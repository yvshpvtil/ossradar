import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export interface SubscribeResult {
  ok: boolean;
  duplicate?: boolean;
}

/**
 * Storage adapter for newsletter signups. Swap the implementation returned by
 * getSubscriberStore() for a provider (e.g. Beehiiv) without touching the API route.
 */
export interface SubscriberStore {
  add(email: string, meta: { source: string }): Promise<SubscribeResult>;
}

/** Appends to data/subscribers.json. Fine locally; on Vercel the filesystem is read-only, so it logs instead. */
export class JsonFileStore implements SubscriberStore {
  constructor(private file = path.join(process.cwd(), "data", "subscribers.json")) {}

  async add(email: string, meta: { source: string }): Promise<SubscribeResult> {
    try {
      let list: { email: string; source: string; createdAt: string }[] = [];
      try {
        list = JSON.parse(await readFile(this.file, "utf8"));
      } catch {
        // missing or empty file
      }
      if (list.some((s) => s.email === email)) return { ok: true, duplicate: true };
      list.push({ email, source: meta.source, createdAt: new Date().toISOString() });
      await mkdir(path.dirname(this.file), { recursive: true });
      await writeFile(this.file, `${JSON.stringify(list, null, 2)}\n`);
      return { ok: true };
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === "EROFS" || code === "EACCES" || code === "EPERM" || code === "ENOENT") {
        // Read-only filesystem (e.g. Vercel). Log so the signup isn't silently lost from logs.
        console.log(`[subscribe] read-only FS, signup logged only: ${email} (${meta.source})`);
        return { ok: true };
      }
      throw err;
    }
  }
}

/** TODO: implement once a Beehiiv publication exists (POST /v2/publications/{id}/subscriptions). */
export class BeehiivStore implements SubscriberStore {
  constructor(
    private apiKey: string,
    private publicationId: string,
  ) {}

  async add(email: string, meta: { source: string }): Promise<SubscribeResult> {
    const res = await fetch(`https://api.beehiiv.com/v2/publications/${this.publicationId}/subscriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, utm_source: meta.source, reactivate_existing: false, send_welcome_email: true }),
    });
    if (!res.ok) throw new Error(`Beehiiv error ${res.status}`);
    return { ok: true };
  }
}

export function getSubscriberStore(): SubscriberStore {
  const { BEEHIIV_API_KEY, BEEHIIV_PUBLICATION_ID } = process.env;
  if (BEEHIIV_API_KEY && BEEHIIV_PUBLICATION_ID) return new BeehiivStore(BEEHIIV_API_KEY, BEEHIIV_PUBLICATION_ID);
  return new JsonFileStore();
}
