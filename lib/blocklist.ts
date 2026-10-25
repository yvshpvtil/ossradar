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
  if (isAdult(input)) return true;
  const text = ` ${input.name.replace(/[-_]/g, " ")} ${input.description} ${input.topics.join(" ")} `.toLowerCase();
  const offTopicHit =
    input.topics.some((t) => OFF_TOPIC_TOPICS.has(t.toLowerCase())) || OFF_TOPIC_WORDS.some((w) => text.includes(w));
  // Conservative: only drop when there is an off-topic signal AND no dev/AI signal at all.
  return offTopicHit && !DEV_SIGNALS.some((s) => text.includes(s));
}
