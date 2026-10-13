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
}

export interface RepoData {
  generatedAt: string;
  snapshotDate: string;
  /** Number of daily snapshots available when this file was generated. */
  snapshotCount: number;
  repos: Repo[];
}

/** Snapshot file shape: full_name -> stars. */
export type Snapshot = Record<string, number>;
