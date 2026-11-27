import { repoBlurb } from "./blurb";
import { altLabel } from "./alternatives";
import { formatDate } from "./format";
import { getMonthTop, getMonthWindow, getMonthWindows, monthLabel, monthSummary } from "./monthly";
import { SITE } from "./site";

const name = (e: { fullName: string; repo?: Parameters<typeof altLabel>[0] }) => (e.repo ? altLabel(e.repo) : e.fullName);
const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();

/** Markdown twin of /monthly/{YYYY-MM} for chatbots and agents ("top GitHub repos of November 2026"). */
export function monthlyMarkdown(month: string): string {
  const w = getMonthWindow(month)!;
  const page = `${SITE.url}/monthly/${month}`;
  const top = getMonthTop(month);
  const s = monthSummary(month);
  const label = monthLabel(month);
  const lines = [
    `# Top GitHub repos of ${label}${w.complete ? "" : " (so far)"}`,
    "",
    `> The ${top.length} open-source AI and developer-tool repos tracked by ${SITE.name} that gained the most GitHub stars from ${formatDate(w.from)} to ${formatDate(w.to)} (UTC)${w.complete ? "" : `; ${label} is still in progress, so this list updates daily`}. Source: ${page}`,
    "",
    `Measured from daily star-count snapshots (${w.days.length} days). Repos created during the month count from 0 stars; others count from the end of the previous month (or their first snapshot this month).`,
    "",
  ];
  if (top.length) {
    lines.push(`Together these ${top.length} repos gained ${top.reduce((a, e) => a + e.gained, 0)} stars; ${s.created} of them were created on GitHub during ${label}.${s.mostAtOne ? ` ${name(s.mostAtOne)} finished #1 on the daily list most often (${s.mostAtOne.daysAtOne} day${s.mostAtOne.daysAtOne === 1 ? "" : "s"}).` : ""}`, "");
  }
  lines.push("| # | Repo | Stars gained | Total stars | Days in daily top 25 | What it is |", "|---|---|---|---|---|---|");
  top.forEach((e, n) => {
    const link = e.repo ? `[${name(e)}](${SITE.url}/repo/${e.repo.owner}/${e.repo.name})${name(e) !== e.fullName ? ` (${e.fullName})` : ""}` : `[${e.fullName}](https://github.com/${e.fullName})`;
    lines.push(`| ${n + 1} | ${link}${e.newThisMonth ? " (new)" : ""} | +${e.gained} | ${e.stars} | ${e.daysInTop} | ${cell(e.repo ? repoBlurb(e.repo) ?? "" : "")} |`);
  });
  const all = getMonthWindows().map((x) => x.month);
  const i = all.indexOf(month);
  lines.push(
    "",
    "## More",
    "",
    ...(all[i + 1] ? [`- Previous month: ${SITE.url}/monthly/${all[i + 1]}.md`] : []),
    ...(all[i - 1] ? [`- Next month: ${SITE.url}/monthly/${all[i - 1]}.md`] : []),
    `- Every day of ${label}: ${w.days.map((d) => `${SITE.url}/daily/${d}.md`).slice(-3).join(", ")} (all days at ${SITE.url}/daily.md)`,
    `- All months: ${SITE.url}/monthly.md`,
    `- Live leaderboard (last 24 hours and 7 days, updated hourly): ${SITE.url}/`,
    "",
    `Free to cite with a link back to ${page}.`,
    "",
  );
  return lines.join("\n");
}

/** Markdown twin of /monthly: every month with its top 5. */
export function monthlyIndexMarkdown(): string {
  const lines = [
    "# Top GitHub repos by month",
    "",
    `> Monthly roundups from ${SITE.name}: the open-source AI and developer-tool repos that gained the most GitHub stars in each calendar month. Source: ${SITE.url}/monthly`,
    "",
  ];
  for (const w of getMonthWindows()) {
    lines.push(`## [${monthLabel(w.month)}${w.complete ? "" : " (so far)"}](${SITE.url}/monthly/${w.month}) (${formatDate(w.from)} to ${formatDate(w.to)}; Markdown: ${SITE.url}/monthly/${w.month}.md)`, "");
    getMonthTop(w.month, 5).forEach((e, n) => lines.push(`${n + 1}. ${e.repo ? `[${name(e)}](${SITE.url}/repo/${e.repo.owner}/${e.repo.name})` : e.fullName}: +${e.gained} stars`));
    lines.push("");
  }
  return lines.join("\n");
}
