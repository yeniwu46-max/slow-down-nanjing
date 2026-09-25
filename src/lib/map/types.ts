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
  scenicScore: number;
  shelterScore: number;
  crowdCost: number;
  energyCost: number;
  nightSuitability: number;
  indoorStayShare: number;
  restFacilityCount: number;
  cultureTags: string[];
}

export interface ScheduledStop {
  poiId: string;
  arrivalMinutes: number;
  departureMinutes: number;
  stayMinutes: number;
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
}

export type MapFilter = "全部" | PoiCategory;
