import { getSubscriberStore } from "@/lib/subscribers";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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
    return Response.json({ ok: true, message: "Thanks!" });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return Response.json({ ok: false, message: "Please enter a valid email address." }, { status: 400 });
  }

  try {
    const result = await getSubscriberStore().add(email, { source: "ossradar.net" });
    return Response.json({
      ok: true,
      message: result.duplicate ? "You're already subscribed. Thanks!" : "You're in. Watch your inbox.",
    });
  } catch (err) {
    console.error("[subscribe] failed", err);
    return Response.json({ ok: false, message: "Couldn't subscribe right now. Please try again later." }, { status: 500 });
  }
}
