export const SITE = {
  name: "OSS Radar",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://ossradar.net",
  tagline: "The fastest-rising open-source AI & developer tools, ranked daily by star velocity.",
  description:
    "OSS Radar tracks the fastest-rising open-source AI and developer-tool GitHub repos every day, ranked by stars gained in the last 24 hours and 7 days, with a one-line take on what each does and why it matters.",
  owner: "Yash Patil",
  github: "https://github.com/yvshpvtil",
  /** Current weekly sponsorship price in USD. Launch price $99/week, +$25 after each sale. */
  sponsorPriceUsd: 99,
  sponsorPriceStepUsd: 25,
  // TODO: replace with a real payment link (Stripe Payment Link / Lemon Squeezy) before launch.
  sponsorPaymentUrl: "",
  sponsorEmail: "hello@ossradar.net",
};
