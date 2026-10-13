import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { RepoDetails } from "./types";

const DIR = path.join(process.cwd(), "data", "details");

export function getDetails(fullName: string): RepoDetails | null {
  const f = path.join(DIR, `${fullName.replace("/", "__")}.json`);
  if (!existsSync(f)) return null;
  try {
    return JSON.parse(readFileSync(f, "utf8")) as RepoDetails;
  } catch {
    return null;
  }
}
