import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { RepoDetails } from "./types";
import { cleanUseCases } from "./useCases";

const DIR = path.join(process.cwd(), "data", "details");

export function getDetails(fullName: string): RepoDetails | null {
  const f = path.join(DIR, `${fullName.replace("/", "__")}.json`);
  if (!existsSync(f)) return null;
  try {
    const d = JSON.parse(readFileSync(f, "utf8")) as RepoDetails;
    // Stored bullets can be clipped README fragments; render only ones that read as complete phrases.
    return { ...d, useCases: cleanUseCases(d.useCases) };
  } catch {
    return null;
  }
}
