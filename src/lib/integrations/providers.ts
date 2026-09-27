export interface RoutingPoint {
  lat: number;
  lng: number;
}

export interface RoutingRequest {
  points: RoutingPoint[];
  mode: "walking";
}

export interface RoutingLeg {
  coordinates: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
}

export interface RoutingResult {
  provider: string;
  legs: RoutingLeg[];
}

export interface RoutingProvider {
  readonly id: string;
  health(signal?: AbortSignal): Promise<boolean>;
  route(request: RoutingRequest, signal?: AbortSignal): Promise<RoutingResult>;
}

export interface OptimizationRequest {
  travelTimeMatrix: number[][];
  visitDurations: number[];
  timeWindows: Array<{ openMinutes: number; closeMinutes: number }>;
  departureTimeMinutes: number;
  timeBudgetMinutes: number;
  startIndex: number;
  mandatoryIndices?: number[];
}

export interface OptimizationResult {
  provider: string;
  order: number[];
  totalMinutes: number;
  omittedIndices: number[];
  scheduledVisits: Array<{
    index: number;
    arrivalMinutes: number;
    departureMinutes: number;
    waitMinutes: number;
  }>;
}

export interface OptimizationProvider {
  readonly id: string;
  health(signal?: AbortSignal): Promise<boolean>;
  optimize(
    request: OptimizationRequest,
    signal?: AbortSignal,
  ): Promise<OptimizationResult>;
}
