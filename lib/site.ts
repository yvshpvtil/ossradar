export const SITE = {
  name: "OSS Radar",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://ossradar.net",
  ossExplainer: "OSS = Open-Source Software.",
  tagline: "The fastest-rising open-source AI & developer tools, ranked daily by star velocity.",
  description:
    "OSS Radar (OSS = Open-Source Software) tracks the fastest-rising open-source AI and developer-tool GitHub repos every day, ranked by stars gained in the last 24 hours and 7 days, with a one-line take on what each does and why it matters.",
  owner: "Yash Patil",
  github: "https://github.com/yvshpvtil",
  /** Current weekly sponsorship price in USD. Launch price $99/week, +$25 after each sale. */
  sponsorPriceUsd: 99,
  sponsorPriceStepUsd: 25,
  // TODO: replace with a real payment link (Stripe Payment Link / Lemon Squeezy) before launch.
  sponsorPaymentUrl: "",
  /**
   * Beehiiv embedded subscribe form iframe src (free plan: Subscribers > Subscribe forms > Get embed code,
   * copy the iframe's src). When set, signups happen in-place inside the embed. When empty, the form
   * falls back to Beehiiv's hosted signup page.
   */
  beehiivEmbedUrl: process.env.NEXT_PUBLIC_BEEHIIV_EMBED_URL ?? "",
  beehiivSubscribeUrl: "https://ossradar.beehiiv.com/subscribe",
  sponsorEmail: "hello@ossradar.net",
};
