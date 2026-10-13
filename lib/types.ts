export type CategorySlug =
  | "ai-agents"
  | "llm-tooling"
  | "mcp"
  | "coding-agents"
  | "rag-vector"
  | "local-llms"
  | "devops"
  | "other";

export interface HistoryPoint {
  date: string; // YYYY-MM-DD
  stars: number;
}

export interface Repo {
  fullName: string;
  owner: string;
  name: string;
  url: string;
  homepage: string | null;
  description: string;
  language: string | null;
  topics: string[];
  stars: number;
  forks: number;
  createdAt: string;
  pushedAt: string;
  ownerAvatar: string;
  category: CategorySlug;
  oneLiner: string;
  /** Stars gained in the last ~24h. */
  delta24h: number;
  /** Stars gained in the last ~7 days. */
  delta7d: number;
  /** True when delta24h is an estimate rather than measured from snapshots. */
  estimated24h: boolean;
  /** True when delta7d is an estimate rather than measured from snapshots. */
  estimated7d: boolean;
  /** True when either delta is estimated. */
  velocityEstimated: boolean;
  history: HistoryPoint[];
  /** Stars gained in the last hour, from data/hourly.json (null until two hourly points exist). */
  delta1h: number | null;
  /** UTC date the repo first entered the tracked list. */
  firstSeen: string;
  /** Rank by 24h gain on rankBaseDate (null when unknown or not ranked then). */
  prevRank: number | null;
}

export interface RepoData {
  generatedAt: string;
  snapshotDate: string;
  /** Number of daily snapshots available when this file was generated. */
  snapshotCount: number;
  /** Hourly points available in data/hourly.json (max 48). */
  hourlyPoints: number;
  /** Previous UTC day used for rank movement, or null with only one day of data. */
  rankBaseDate: string | null;
  repos: Repo[];
}

/** Snapshot file shape: full_name -> stars. */
export type Snapshot = Record<string, number>;

export interface RepoRequirements {
  os: string | null;
  ramMinGB: number | null;
  ramRecommendedGB: number | null;
  /** true = GPU required, false = runs without GPU, null = not stated. */
  gpuRequired: boolean | null;
  vramMinGB: number | null;
  diskGB: number | null;
  runtime: string | null;
  modelSizes: string | null;
}

/** data/details/<owner>__<repo>.json */
export interface RepoDetails {
  fullName: string;
  whoItsFor: string | null;
  useCases: string[];
  requirements: RepoRequirements;
  installCommand: string | null;
  source: "readme" | "inferred";
  extractor: string;
  readmeHash: string;
  version: number;
  generatedAt: string;
}
