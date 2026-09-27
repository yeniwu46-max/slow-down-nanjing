export type KnowledgeEntityType =
  | "place"
  | "theme"
  | "period"
  | "person"
  | "event"
  | "heritage";

export type KnowledgeEvidenceLevel = "authoritative" | "corroborated" | "curated";
export type KnowledgeClaimStatus = "verified" | "interpretive";

export interface KnowledgeSource {
  id: string;
  title: string;
  publisher: string;
  url: string;
  accessedAt: string;
  pageUpdatedAt: string | null;
  kind: "government" | "museum" | "public-culture" | "international" | "project-record";
}

export interface KnowledgeEntity {
  id: string;
  type: KnowledgeEntityType;
  label: string;
  aliases?: string[];
  summary?: string;
  sourceIds: string[];
  lastReviewedAt: string;
}

export interface KnowledgeClaim {
  id: string;
  subjectId: string;
  predicate: "embodiesTheme" | "belongsToPeriod" | "associatedWith" | "hasHeritageType" | "connectsTo";
  objectId: string;
  text: string;
  sourceIds: string[];
  lastReviewedAt: string;
  evidenceLevel: KnowledgeEvidenceLevel;
  status: KnowledgeClaimStatus;
}

export interface KnowledgeEditorial {
  id: string;
  placeId: string;
  text: string;
  version: string;
  authoredAt: string;
  basedOnClaimIds: string[];
  label: "项目原创表达";
}

export interface KnowledgeGraphData {
  "@context": Record<string, string>;
  "@type": "KnowledgeGraph";
  version: string;
  generatedAt: string;
  sources: KnowledgeSource[];
  entities: KnowledgeEntity[];
  claims: KnowledgeClaim[];
  editorials: KnowledgeEditorial[];
  legacyTagMap: Record<string, string[]>;
}

export interface CultureCoverageMetrics {
  score: number;
  coveredThemeIds: string[];
  uncoveredThemeIds: string[];
  coveredPeriodIds: string[];
  denominatorWeight: number;
  coveredWeight: number;
}

export interface NarrativeEvidence {
  claimId: string;
  sourceIds: string[];
  text: string;
  evidenceLevel: KnowledgeEvidenceLevel;
  status: KnowledgeClaimStatus;
}

export interface RouteNarrativeStop {
  poiId: string;
  placeEntityId: string;
  title: string;
  text: string;
  evidence: NarrativeEvidence[];
  editorialId: string | null;
  expressionLabel: "项目原创表达";
}

export interface RouteNarrativeBridge {
  fromPoiId: string;
  toPoiId: string;
  text: string;
  claimIds: string[];
  sourceIds: string[];
}

export interface RouteNarrative {
  stops: RouteNarrativeStop[];
  bridges: RouteNarrativeBridge[];
  sourceIds: string[];
  oldestReviewedAt: string | null;
  generatedAt: string;
}
