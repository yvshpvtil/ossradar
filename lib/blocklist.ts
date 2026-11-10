/**
 * Off-topic filter. OSS Radar covers open-source AI and developer tools; GitHub search
 * still surfaces viral non-dev repos (life advice, reading lists, etc.). Anything matched
 * here is dropped at collection time AND at render time.
 */
export const BLOCKED_REPOS = new Set<string>([
  "eternity4719/howtolivebetter", // Chinese life-advice guide
]);

export const BLOCKED_OWNERS = new Set<string>([]);

const OFF_TOPIC_TOPICS = new Set([
  "life", "life-advice", "lifestyle", "self-help", "personal-finance-guide", "health", "medicine",
  "parenting", "dating", "relationship", "recipes", "cooking", "fitness", "travel", "immigration",
  "awesome-books", "books", "novel", "fiction", "religion", "astrology", "lottery", "gambling",
]);

const OFF_TOPIC_WORDS = [
  "人生", "养生", "长寿", "恋爱", "婚育", "育儿", "理财", "减肥", "医保", "社保", "life guide", "life advice",
  "self-help", "horoscope", "recipes",
];

/**
 * Adult / sexual-content signals. These always drop the repo, even when it is AI or dev related
 * (e.g. an NSFW image-generation skill): OSS Radar is a work-safe site, and adult listings can
 * get pages filtered out of SafeSearch results. Matched on whole words in name, description and topics.
 */
const ADULT_RE = /(^|[^a-z0-9])(nsfw|porn|porno|pornography|hentai|nudify|nudity|undress|erotic|erotica|onlyfans|r18)([^a-z0-9]|$)|色情|成人内容/i;

export function isAdult(input: { name: string; description: string; topics: string[] }): boolean {
  return ADULT_RE.test(` ${input.name.replace(/[-_]/g, " ")} ${input.description} ${input.topics.join(" ")} `);
}

/**
 * Pirated-software lures: repos posing as "cracked" commercial apps (e.g. an org called
 * free-cracks publishing Adobe-Acrobat-Pro with no code, no description and stuffed topics) are a
 * common malware vector, and listing them hurts trust and search quality. Owners whose name says
 * crack/keygen/warez always drop; elsewhere only unambiguous piracy wording matches, so slang like
 * "codex-on-crack" stays.
 */
const PIRACY_OWNER_RE = /crack|keygen|warez|pirat/i;
const PIRACY_RE = /(^|[^a-z0-9])(keygens?|warez|kmspico|cracked|crack (download|free|full|for windows|for mac)|free crack|full version crack|license key generator|serial key generator)([^a-z0-9]|$)/i;

/**
 * Installer lures: fake "standalone setup" repos for paid apps and games (Revit, Microsoft 365,
 * game trainers and cheats) that ship a download link instead of code, a common malware vector.
 * Matched on name + description wording no real dev tool uses, plus SEO-bait topic slugs
 * (melodyne-download, exitlag-2026-bypass, dxo-photolab-coupon). "Cheat sheet" stays.
 */
const LURE_RE = /(^|[^a-z0-9])(pre[- ]?activated|fully activated|(all|every) features? (activated|enabled|active|unlocked)|full working installer|full installer|(complete |full )?standalone (desktop )?(setup|installer|edition|build|config)|trainer (tool|setup)|standalone (\w+ )?trainer|cheats?(?! ?sheets?)|robux generator|executor for pc|ready to play)([^a-z0-9]|$)/i;
const LURE_TOPIC_RE = /(^|-)(download|crack|cracked|keygen|activator|bypass|coupon|discount-code|patched|free-20\d\d)(-|$)|-install-windows|install-setup/i;

export function isPiracy(input: { owner: string; name: string; description: string; topics: string[] }): boolean {
  if (PIRACY_OWNER_RE.test(input.owner)) return true;
  if (input.topics.some((t) => LURE_TOPIC_RE.test(t))) return true;
  if (LURE_RE.test(` ${input.name.replace(/[-_]/g, " ")} ${input.description} `)) return true;
  return PIRACY_RE.test(` ${input.name.replace(/[-_]/g, " ")} ${input.description} ${input.topics.join(" ").replace(/-/g, " ")} `);
}

/** A star-farm wave: at least this many repos created the same day with near-identical star counts. */
const FARM_MIN_CLUSTER = 5;
/** Max star spread inside a wave (bots star every repo in a batch the same number of times). */
const FARM_STAR_SPREAD = 10;
const FARM_MIN_STARS = 200;

/**
 * Bot-starred lure campaigns: dozens of throwaway repos created the same day, each with 0-1 forks
 * and the same ~770 stars, which pushes them onto the leaderboard (Nov 6 2026: 60 fake installers
 * for Revit, CorelDraw, game trainers...). Real repos with hundreds of stars always get forks and
 * never land within a few stars of four others born the same day, so the whole wave drops even
 * when one listing's wording slips past isPiracy. Returns lowercased full names.
 */
export function starFarmNames(repos: { fullName: string; createdAt?: string | null; forks?: number | null; stars: number }[]): Set<string> {
  const byDay = new Map<string, { name: string; stars: number }[]>();
  for (const r of repos) {
    if (!r.createdAt || (r.forks ?? 0) > 1 || r.stars < FARM_MIN_STARS) continue;
    const day = r.createdAt.slice(0, 10);
    byDay.set(day, [...(byDay.get(day) ?? []), { name: r.fullName.toLowerCase(), stars: r.stars }]);
  }
  const out = new Set<string>();
  for (const list of byDay.values()) {
    list.sort((a, b) => a.stars - b.stars);
    for (let i = 0, j = 0; j < list.length; j++) {
      while (list[j].stars - list[i].stars > FARM_STAR_SPREAD) i++;
      if (j - i + 1 >= FARM_MIN_CLUSTER) for (let k = i; k <= j; k++) out.add(list[k].name);
    }
  }
  return out;
}

/** Words that signal a repo is actually software / AI / dev related. */
const DEV_SIGNALS = [
  "code", "coding", "cli", "api", "sdk", "library", "framework", "developer", "dev ", "plugin",
  "server", "agent", "llm", "model", "ai", "app", "tool", "open-source", "open source", "python",
  "typescript", "rust", "go ", "javascript", "react", "docker", "kubernetes", "database", "github",
  "terminal", "editor", "browser", "extension", "compiler", "runtime", "engine", "webgpu", "mcp",
  "代码", "开发", "模型", "智能体", "插件", "工具", "框架", "部署", "编程", "接口", "开源", "爬虫", "终端",
];

export function isOffTopic(input: { fullName: string; owner: string; topics: string[]; description: string; name: string }): boolean {
  const full = input.fullName.toLowerCase();
  if (BLOCKED_REPOS.has(full) || BLOCKED_OWNERS.has(input.owner.toLowerCase())) return true;
  if (isAdult(input) || isPiracy(input)) return true;
  const text = ` ${input.name.replace(/[-_]/g, " ")} ${input.description} ${input.topics.join(" ")} `.toLowerCase();
  const offTopicHit =
    input.topics.some((t) => OFF_TOPIC_TOPICS.has(t.toLowerCase())) || OFF_TOPIC_WORDS.some((w) => text.includes(w));
  // Conservative: only drop when there is an off-topic signal AND no dev/AI signal at all.
  return offTopicHit && !DEV_SIGNALS.some((s) => text.includes(s));
}
