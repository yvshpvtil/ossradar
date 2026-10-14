/** Adds a subscriber to the Kit (ConvertKit) form. v4 first, v3 fallback. Server-only. */
const V4 = "https://api.kit.com/v4";
/** Kit "Welcome" sequence (one immediate email). Kit has no API for form-triggered automations, so we enrol here. */
const WELCOME_SEQUENCE_ID = process.env.KIT_WELCOME_SEQUENCE_ID || "2929497";

export async function addToKit(email: string, source: string): Promise<void> {
  const key = process.env.KIT_API_KEY;
  const formId = process.env.KIT_FORM_ID;
  if (!formId || (!key && !process.env.KIT_V3_API_KEY)) throw new Error("Kit not configured");
  if (key) {
    try {
      const h = { "X-Kit-Api-Key": key, "Content-Type": "application/json", Accept: "application/json" };
      const r1 = await fetch(`${V4}/subscribers`, {
        method: "POST",
        headers: h,
        body: JSON.stringify({ email_address: email, state: "active", fields: { source } }),
      });
      if (!r1.ok) throw new Error(`v4 subscribers ${r1.status}`);
      const r2 = await fetch(`${V4}/forms/${formId}/subscribers`, {
        method: "POST",
        headers: h,
        body: JSON.stringify({ email_address: email, referrer: `https://ossradar.net/?src=${source}` }),
      });
      if (!r2.ok) throw new Error(`v4 form ${r2.status}`);
      // Welcome email: best-effort, never blocks the signup.
      const r3 = await fetch(`${V4}/sequences/${WELCOME_SEQUENCE_ID}/subscribers`, {
        method: "POST",
        headers: h,
        body: JSON.stringify({ email_address: email }),
      }).catch((e) => e as Error);
      if (r3 instanceof Error || !r3.ok) console.warn("[kit] welcome sequence enrol failed", r3 instanceof Error ? r3 : r3.status);
      return;
    } catch (err) {
      console.warn("[kit] v4 failed, trying v3", err);
    }
  }
  const v3 = process.env.KIT_V3_API_KEY;
  if (!v3) throw new Error("Kit v4 failed and no v3 key");
  const r = await fetch(`https://api.convertkit.com/v3/forms/${formId}/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: v3, email }),
  });
  if (!r.ok) throw new Error(`v3 ${r.status}`);
  await fetch(`https://api.convertkit.com/v3/sequences/${WELCOME_SEQUENCE_ID}/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: v3, email }),
  }).catch((e) => console.warn("[kit] v3 welcome sequence enrol failed", e));
}
