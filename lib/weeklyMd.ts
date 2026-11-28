import { repoBlurb } from "./blurb";
import { altLabel } from "./alternatives";
import { formatDate } from "./format";
import { getWeekTop, getWeekWindow, getWeekWindows, weekRange, weekSummary } from "./weekly";
import { SITE } from "./site";

const name = (e: { fullName: string; repo?: Parameters<typeof altLabel>[0] }) => (e.repo ? altLabel(e.repo) : e.fullName);
const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();

/** Markdown twin of /weekly/{YYYY-Www} for chatbots and agents ("top GitHub repos this week"). */
export function weeklyMarkdown(week: string): string {
  const w = getWeekWindow(week)!;
  const page = `${SITE.url}/weekly/${week}`;
  const top = getWeekTop(week);
  const s = weekSummary(week);
  const lines = [
    `# Top GitHub repos of the week: ${weekRange(w)}${w.complete ? "" : " (so far)"}`,
    "",
    `> The ${top.length} open-source AI and developer-tool repos tracked by ${SITE.name} that gained the most GitHub stars from ${formatDate(w.from)} to ${formatDate(w.to)} (UTC; ISO week ${week}, Monday to Sunday)${w.complete ? "" : "; the week is still in progress, so this list updates daily"}. Source: ${page}`,
    "",
    `Measured from daily star-count snapshots (${w.days.length} day${w.days.length === 1 ? "" : "s"}). Repos created during the week count from 0 stars; others count from the snapshot at the end of the previous week (or their first snapshot this week).`,
    "",
  ];
  if (top.length) {
    lines.push(`Together these ${top.length} repos gained ${top.reduce((a, e) => a + e.gained, 0)} stars; ${s.created} of them ${s.created === 1 ? "was" : "were"} created on GitHub during the week.${s.mostAtOne ? ` ${name(s.mostAtOne)} finished #1 on the daily list most often (${s.mostAtOne.daysAtOne} day${s.mostAtOne.daysAtOne === 1 ? "" : "s"}).` : ""}`, "");
  }
  lines.push("| # | Repo | Stars gained | Total stars | Days in daily top 25 | What it is |", "|---|---|---|---|---|---|");
  top.forEach((e, n) => {
    const link = e.repo ? `[${name(e)}](${SITE.url}/repo/${e.repo.owner}/${e.repo.name})${name(e) !== e.fullName ? ` (${e.fullName})` : ""}` : `[${e.fullName}](https://github.com/${e.fullName})`;
    lines.push(`| ${n + 1} | ${link}${e.newThisMonth ? " (new)" : ""} | +${e.gained} | ${e.stars} | ${e.daysInTop} | ${cell(e.repo ? repoBlurb(e.repo) ?? "" : "")} |`);
  });
  const all = getWeekWindows().map((x) => x.week);
  const i = all.indexOf(week);
  lines.push(
    "",
    "## More",
    "",
    ...(all[i + 1] ? [`- Previous week: ${SITE.url}/weekly/${all[i + 1]}.md`] : []),
    ...(all[i - 1] ? [`- Next week: ${SITE.url}/weekly/${all[i - 1]}.md`] : []),
    `- Each day of this week: ${w.days.map((d) => `${SITE.url}/daily/${d}.md`).join(", ")}`,
    `- The month: ${[...new Set(w.days.map((d) => d.slice(0, 7)))].map((m) => `${SITE.url}/monthly/${m}.md`).join(", ")}`,
    `- All weeks: ${SITE.url}/weekly.md`,
    `- Rolling last 7 days (updated hourly): ${SITE.url}/trending/ai-repos-this-week.md`,
    "",
    `Free to cite with a link back to ${page}.`,
    "",
  );
  return lines.join("\n");
}

/** Markdown twin of /weekly: every week with its top 5. */
export function weeklyIndexMarkdown(): string {
  const lines = [
    "# Top GitHub repos by week",
    "",
    `> Weekly roundups from ${SITE.name}: the open-source AI and developer-tool repos that gained the most GitHub stars in each ISO week (Monday to Sunday, UTC). Source: ${SITE.url}/weekly`,
    "",
  ];
  for (const w of getWeekWindows()) {
    lines.push(`## [${weekRange(w)}${w.complete ? "" : " (so far)"}](${SITE.url}/weekly/${w.week}) (ISO week ${w.week}; Markdown: ${SITE.url}/weekly/${w.week}.md)`, "");
    getWeekTop(w.week, 5).forEach((e, n) => lines.push(`${n + 1}. ${e.repo ? `[${name(e)}](${SITE.url}/repo/${e.repo.owner}/${e.repo.name})` : e.fullName}: +${e.gained} stars`));
    lines.push("");
  }
  return lines.join("\n");
}
