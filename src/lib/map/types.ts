export type PoiCategory =
  | "文化古迹"
  | "自然风景"
  | "街巷小巷"
  | "文艺生活";

export type PoiState = "visited" | "planned" | "unexplored";

export type VenueType = "indoor" | "outdoor" | "mixed";
export type EnergyLevel = 1 | 2 | 3 | 4 | 5;
export type SuitabilityScore = 1 | 2 | 3 | 4 | 5;

export interface PoiDataSource {
  label: string;
  kind: "official" | "map" | "field-review";
  checkedAt: string;
}

export interface OperatingHours {
  opensAtMinutes: number;
  closesAtMinutes: number;
  label: string;
}

export interface MapPoi {
  id: string;
  knowledgeEntityId: string;
  name: string;
  lng: number;
  lat: number;
  category: PoiCategory;
  state: PoiState;
  description?: string;
  photos: string[];
  suggestedStayMinutes: number;
  cultureTags: string[];
  venueType: VenueType;
  energyLevel: EnergyLevel;
  rainyDaySuitability: SuitabilityScore;
  restFacilities: string[];
  accessibility: string;
  dataSources: PoiDataSource[];
  operatingHours: OperatingHours;
}

export interface RouteExplanation {
  id: string;
  text: string;
  tone: "efficiency" | "scenery" | "culture" | "comfort" | "caution";
}

export interface RouteMetrics {
  distanceKm: number;
  walkingMinutes: number;
  stayMinutes: number;
  waitMinutes: number;
  scenicScore: number;
  shelterScore: number;
  crowdCost: number;
  energyCost: number;
  nightSuitability: number;
  indoorStayShare: number;
  restFacilityCount: number;
  cultureTags: string[];
  cultureCoverageScore: number;
  coveredCultureThemeIds: string[];
  uncoveredCultureThemeIds: string[];
  coveredCulturePeriodIds: string[];
  semanticMatchScore?: number;
}

export interface ScheduledStop {
  poiId: string;
  arrivalMinutes: number;
  departureMinutes: number;
  stayMinutes: number;
  waitMinutes?: number;
}

export interface AlgorithmRouteSummary {
  kind: "baseline" | "intelligent" | "optimal";
  label: string;
  poiIds: string[];
  distanceKm: number;
  walkingMinutes: number;
  stayMinutes: number;
  waitMinutes: number;
  totalMinutes: number;
  feasible: boolean;
  engine: string;
  note: string;
}

export interface RouteAlgorithmComparison {
  baseline: AlgorithmRouteSummary;
  intelligent: AlgorithmRouteSummary;
  optimal: AlgorithmRouteSummary;
  optimalityGapPercent: number | null;
  visitedGap: number;
  exactValidation: boolean;
  exploredOrders: number;
  objective: string;
}

export interface MapRoute {
  id: string;
  name: string;
  duration: string;
  distance: string;
  coordinates: [number, number][];
  poiIds?: string[];
  tagline?: string;
  metrics?: RouteMetrics;
  explanations?: RouteExplanation[];
  scheduledStops?: ScheduledStop[];
  omittedPoiIds?: string[];
  completionTime?: string;
  dataUpdatedAt?: string;
  dataStatus?: string;
  calculatedAt?: string;
  calculationMs?: number;
  narrative?: import("../culture/types").RouteNarrative;
  cultureOldestReviewedAt?: string | null;
  routingData?: {
    provider: string;
    providerVersion: string | null;
    costing: "pedestrian";
    sourceDataset: string;
    generatedAt: string;
    attribution: string;
    originFallbackUsed: boolean;
  };
  algorithmComparison?: RouteAlgorithmComparison;
}

export type MapFilter = "全部" | PoiCategory;
