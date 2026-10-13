import { addToKit } from "@/lib/kit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
// Best-effort per-instance rate limit (serverless instances don't share memory).
const hits = new Map<string, number[]>();

function limited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  let body: { email?: unknown; website?: unknown };
  try {
    const type = request.headers.get("content-type") ?? "";
    body = type.includes("application/json")
      ? await request.json()
      : Object.fromEntries((await request.formData()).entries());
  } catch {
    return Response.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  // Honeypot: pretend success for bots.
  if (typeof body.website === "string" && body.website.length > 0) {
    return Response.json({ ok: true, message: "You're in! First issue lands tomorrow." });
  }

  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (limited(ip)) {
    return Response.json({ ok: false, message: "Too many attempts. Try again in a few minutes." }, { status: 429 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return Response.json({ ok: false, message: "Please enter a valid email address." }, { status: 400 });
  }

  try {
    await addToKit(email, "ossradar.net");
    return Response.json({ ok: true, message: "You're in! First issue lands tomorrow." });
  } catch (err) {
    console.error("[subscribe] failed", err);
    return Response.json({ ok: false, message: "Couldn't subscribe right now. Please try again later." }, { status: 502 });
  }
}
