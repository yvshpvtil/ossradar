import { altLabel } from "@/lib/alternatives";
import { repoBlurb } from "@/lib/blurb";
import { categoryLabel } from "@/lib/categories";
import { getArchiveDays, getDailyTop, getDaySummary } from "@/lib/daily";
import { formatDate, formatNumber } from "@/lib/format";
import { SITE } from "@/lib/site";

/**
 * Markdown twin of a daily archive page (/daily/{date}.md), for chatbots and agents answering
 * "what was trending on GitHub on <date>": the same list and recap as the HTML page, in clean text.
 */
export function dailyMarkdown(date: string): string {
  const days = getArchiveDays();
  const i = days.indexOf(date);
  const top = getDailyTop(date);
  const s = getDaySummary(date);
  const page = `${SITE.url}/daily/${date}`;
  const name = (e: (typeof top)[number]) => (e.repo ? altLabel(e.repo) : e.fullName);
  const lines: string[] = [
    `# Fastest-rising GitHub repos on ${formatDate(date)}`,
    "",
    `Stars gained during the UTC day ${date}, measured by diffing ${SITE.name}'s daily star snapshots (${date} minus the day before). HTML page: ${page}`,
  ];
  if (s.leader && s.count >= 3) {
    const recap = [`The ${s.count} repos below gained ${formatNumber(s.total)} stars between them. ${name(s.leader)} led with +${formatNumber(s.leader.gained)}, ${s.leaderShare}% of that total.`];
    if (s.categories.length) recap.push(`The busiest ${s.categories.length === 1 ? "category was" : "categories were"} ${s.categories.map((c) => `${categoryLabel(c.slug)} (${c.count})`).join(" and ")}.`);
    if (s.prevDate) recap.push(`${s.repeat} also made the list on ${s.prevDate}; ${s.count - s.repeat} are new to it.`);
    if (s.createdThisWeek > 0) recap.push(`${s.createdThisWeek} ${s.createdThisWeek === 1 ? "was" : "were"} created on GitHub in the 7 days up to that day.`);
    lines.push("", "## The day in numbers", "", recap.join(" "));
  }
  lines.push("", `## Top ${top.length} by stars gained`, "", "| # | Repo | Stars gained | Total stars | What it is |", "| --- | --- | --- | --- | --- |");
  top.forEach((e, n) => {
    const link = e.repo ? `[${name(e)}](${SITE.url}/repo/${e.repo.owner}/${e.repo.name})${name(e) !== e.fullName ? ` (${e.fullName})` : ""}` : `[${e.fullName}](https://github.com/${e.fullName})`;
    const blurb = (e.repo ? repoBlurb(e.repo) ?? "" : "").replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
    lines.push(`| ${n + 1} | ${link} | +${e.gained} | ${e.stars} | ${blurb} |`);
  });
  const older = days[i + 1], newer = days[i - 1];
  lines.push(
    "",
    "## More",
    "",
    ...(older ? [`- Previous day: ${SITE.url}/daily/${older}.md`] : []),
    ...(newer ? [`- Next day: ${SITE.url}/daily/${newer}.md`] : []),
    `- All archived days: ${SITE.url}/daily`,
    `- Live leaderboard (last 24 hours and 7 days, updated hourly): ${SITE.url}/ (also ${SITE.url}/llms.txt and ${SITE.url}/api/v1/trending)`,
    "",
    `Free to cite with a link back to ${page}.`,
    "",
  );
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}
