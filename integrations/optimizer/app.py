from __future__ import annotations

from typing import Annotated

from fastapi import FastAPI, HTTPException
from ortools.constraint_solver import pywrapcp, routing_enums_pb2
from pydantic import BaseModel, Field, model_validator


ORTOOLS_VERSION = "9.15.6755"

app = FastAPI(
    title="Slowdown Optimization Provider",
    version="0.1.0",
    description="Reserved OR-Tools service for time-budgeted POI ordering.",
)


class SolveRequest(BaseModel):
    travel_time_matrix: list[list[Annotated[int, Field(ge=0)]]]
    visit_durations: list[Annotated[int, Field(ge=0)]]
    time_windows: list[tuple[int, int]]
    departure_time_minutes: Annotated[int, Field(ge=0, lt=2880)]
    time_budget_minutes: Annotated[int, Field(gt=0, le=1440)]
    start_index: Annotated[int, Field(ge=0)] = 0
    mandatory_indices: list[Annotated[int, Field(ge=0)]] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_dimensions(self) -> "SolveRequest":
        size = len(self.travel_time_matrix)
        if size < 2:
            raise ValueError("travel_time_matrix must contain at least two locations")
        if any(len(row) != size for row in self.travel_time_matrix):
            raise ValueError("travel_time_matrix must be square")
        if len(self.visit_durations) != size:
            raise ValueError("visit_durations length must match the matrix")
        if len(self.time_windows) != size:
            raise ValueError("time_windows length must match the matrix")
        if any(open_at > close_at for open_at, close_at in self.time_windows):
            raise ValueError("each time window must be [open, close]")
        if self.start_index >= size:
            raise ValueError("start_index is outside the matrix")
        if any(index >= size for index in self.mandatory_indices):
            raise ValueError("mandatory_indices contains an index outside the matrix")
        return self


class ScheduledVisit(BaseModel):
    index: int
    arrival_minutes: int
    departure_minutes: int
    wait_minutes: int


class SolveResponse(BaseModel):
    status: str
    order: list[int]
    total_minutes: int
    omitted_indices: list[int]
    scheduled_visits: list[ScheduledVisit]
    engine: str = f"or-tools {ORTOOLS_VERSION}"


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "optimization-provider",
        "engine": "or-tools",
        "version": ORTOOLS_VERSION,
    }


@app.post("/solve", response_model=SolveResponse)
def solve(request: SolveRequest) -> SolveResponse:
    """Solve a time-windowed open route; optional stops may be omitted with a penalty."""

    size = len(request.travel_time_matrix)
    sink_node = size
    manager = pywrapcp.RoutingIndexManager(
        size + 1,
        1,
        [request.start_index],
        [sink_node],
    )
    routing = pywrapcp.RoutingModel(manager)

    def transit(from_index: int, to_index: int) -> int:
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        if from_node == sink_node:
            return 0
        if to_node == sink_node:
            return request.visit_durations[from_node]
        return request.visit_durations[from_node] + request.travel_time_matrix[from_node][to_node]

    callback = routing.RegisterTransitCallback(transit)
    routing.SetArcCostEvaluatorOfAllVehicles(callback)
    routing.AddDimension(
        callback,
        request.time_budget_minutes,
        request.departure_time_minutes + request.time_budget_minutes,
        False,
        "Time",
    )
    time_dimension = routing.GetDimensionOrDie("Time")
    start_var = time_dimension.CumulVar(routing.Start(0))
    start_open, start_close = request.time_windows[request.start_index]
    start_latest = start_close - request.visit_durations[request.start_index]
    start_service_at = max(request.departure_time_minutes, start_open)
    if start_service_at > start_latest:
        raise HTTPException(status_code=422, detail="Start location is outside its time window")
    start_var.SetRange(start_service_at, start_service_at)
    for node, (open_at, close_at) in enumerate(request.time_windows):
        if node == request.start_index:
            continue
        latest_arrival = close_at - request.visit_durations[node]
        if latest_arrival < open_at:
            raise HTTPException(status_code=422, detail=f"Location {node} has an impossible time window")
        time_dimension.CumulVar(manager.NodeToIndex(node)).SetRange(open_at, latest_arrival)
    time_dimension.CumulVar(routing.End(0)).SetRange(
        request.departure_time_minutes,
        request.departure_time_minutes + request.time_budget_minutes,
    )

    # A high-but-finite penalty lets the solver drop stops when the hard time budget
    # cannot contain all of them. The start node is never optional.
    for node in range(size):
        if node != request.start_index and node not in request.mandatory_indices:
            routing.AddDisjunction([manager.NodeToIndex(node)], 10_000)

    parameters = pywrapcp.DefaultRoutingSearchParameters()
    parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    parameters.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    parameters.time_limit.FromMilliseconds(250)

    solution = routing.SolveWithParameters(parameters)
    if solution is None:
        raise HTTPException(status_code=422, detail="No route satisfies the time budget")

    order: list[int] = []
    index = routing.Start(0)
    scheduled_visits: list[ScheduledVisit] = []
    previous_node: int | None = None
    previous_departure = request.departure_time_minutes
    while not routing.IsEnd(index):
        node = manager.IndexToNode(index)
        if node != sink_node:
            order.append(node)
            arrival = solution.Value(time_dimension.CumulVar(index))
            if previous_node is None:
                expected_arrival = request.departure_time_minutes
            else:
                expected_arrival = (
                    previous_departure
                    + request.travel_time_matrix[previous_node][node]
                )
            departure = arrival + request.visit_durations[node]
            scheduled_visits.append(ScheduledVisit(
                index=node,
                arrival_minutes=arrival,
                departure_minutes=departure,
                wait_minutes=max(0, arrival - expected_arrival),
            ))
            previous_node = node
            previous_departure = departure
        next_index = solution.Value(routing.NextVar(index))
        index = next_index

    end_minutes = solution.Value(time_dimension.CumulVar(routing.End(0)))
    total_minutes = end_minutes - request.departure_time_minutes
    omitted = sorted(set(range(size)) - set(order))
    return SolveResponse(
        status="feasible",
        order=order,
        total_minutes=total_minutes,
        omitted_indices=omitted,
        scheduled_visits=scheduled_visits,
    )
