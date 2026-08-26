export type PoiCategory =
  | "文化古迹"
  | "自然风景"
  | "街巷小巷"
  | "文艺生活";

export type PoiState = "visited" | "planned" | "unexplored";

export interface MapPoi {
  id: string;
  name: string;
  lng: number;
  lat: number;
  category: PoiCategory;
  state: PoiState;
  description?: string;
  photos: string[];
}

export interface MapRoute {
  id: string;
  name: string;
  duration: string;
  distance: string;
  coordinates: [number, number][];
  poiIds?: string[];
  tagline?: string;
}

export type MapFilter = "全部" | PoiCategory;
