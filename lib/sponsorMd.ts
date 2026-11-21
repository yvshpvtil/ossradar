import { CATEGORIES } from "@/lib/categories";
import { getData } from "@/lib/data";
import { getLanguages } from "@/lib/languages";
import { SITE } from "@/lib/site";
import { LAUNCH_PRICE_USD, LAUNCH_SLOTS, REGULAR_PRICE_USD, getActiveSponsor, sponsorPricing } from "@/lib/sponsors";
import { getTopics } from "@/lib/topics";

/**
 * Markdown twin of /sponsor (/sponsor.md), for agents asked "how do I advertise on OSS Radar" or
 * "how much does an OSS Radar sponsorship cost": live price and launch slots left, what a week
 * includes (with the live page counts), how to book, audience and fine print. Same facts as the
 * HTML page; rebuilt hourly so the slots-left count stays current.
 */
export function sponsorMarkdown(now = new Date()): string {
  const data = getData();
  const tracked = data.repos.length;
  const hubPages = CATEGORIES.length + getTopics().length + getLanguages().length;
  const { launchLeft, price } = sponsorPricing();
  const active = getActiveSponsor(now);
  const page = `${SITE.url}/sponsor`;
  const lines: string[] = [
    `# Sponsor ${SITE.name}: one sponsor per week`,
    "",
    `${SITE.name} ranks open-source AI and developer-tool repos on GitHub by how fast they are gaining stars, updated every hour. Each week has one sponsor, clearly labeled and never mixed into the rankings. HTML page: ${page}`,
    "",
    "## Price",
    "",
    `- Current price: **$${price} per week** (site + daily newsletter)`,
    launchLeft > 0
      ? `- Launch pricing: ${launchLeft} of ${LAUNCH_SLOTS} launch slots left at $${LAUNCH_PRICE_USD}/week; after that the price is $${REGULAR_PRICE_USD}/week`
      : `- The ${LAUNCH_SLOTS} launch slots at $${LAUNCH_PRICE_USD}/week are taken; the price is $${REGULAR_PRICE_USD}/week`,
    `- Current sponsor: ${active ? `${active.name} (through ${active.end})` : "none this week"}`,
    "",
    "## How to book",
    "",
    ...(launchLeft > 0 ? [`1. Pay for a week ($${price}): ${SITE.sponsorPaymentUrl}`] : [`1. Email ${SITE.sponsorEmail} to book a week ($${price})`]),
    `2. Email ${SITE.sponsorEmail} with your product name, a one-line tagline (up to about 90 characters), your link and a square logo, by the Friday before your week.`,
    `3. Sponsorships are reviewed before they go live; you are notified once yours is approved.`,
    "",
    "## What you get for 7 days",
    "",
    `- **Site-wide sponsor bar**: your name, logo, one-line tagline and link at the top of every page: the leaderboard, ${tracked} repo pages, alternatives pages and ${hubPages} category, topic and language pages.`,
    "- **Sponsor card** in the sidebar of the leaderboard and of every repo page.",
    `- **Newsletter slot**: your sponsor block at the top of every daily ${SITE.name} email sent during your week (7 issues).`,
    '- Links are marked `rel="sponsored"`, as search engines require.',
    "",
    "## About the audience",
    "",
    `${SITE.name} launched in October 2026 and currently tracks ${tracked} repos with ${data.snapshotCount} daily snapshot${data.snapshotCount === 1 ? "" : "s"} of history. It is new, which is why launch pricing is low. Email ${SITE.sponsorEmail} for current visitor and subscriber numbers before you book; the real figures are shared.`,
    "",
    "## Fine print",
    "",
    "- Sponsorships never affect rankings. The leaderboard is computed from GitHub data only.",
    "- Developer-relevant products only (tools, APIs, infra, engineering hiring). Any sponsorship may be declined.",
    "- Weeks run Monday to Sunday (UTC).",
    "",
    "## More",
    "",
    `- About and methodology: ${SITE.url}/about.md`,
    `- Today's leaderboard: ${SITE.url}/index.md`,
    `- Contact: ${SITE.sponsorEmail}`,
    "",
    `Data as of ${data.generatedAt} (UTC).`,
    "",
  ];
  return lines.join("\n");
}
