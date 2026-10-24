import type { Metadata } from "next";
import { breadcrumbLd, staticPageLd, ogDefaults, twitterImage, pageAlternates } from "@/lib/seo";
import { PageNav } from "@/components/PageNav";
import { JsonLd } from "@/components/JsonLd";
import { getRepos } from "@/lib/data";
import { SITE } from "@/lib/site";
import { SubmitForm } from "./SubmitForm";

const title = "Suggest a rising AI or developer-tool repo";
const description = `Suggest an open-source AI, LLM, agent or MCP repo for ${SITE.name} to track. Free and reviewed by hand; it's ranked purely by the GitHub stars it gains.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: pageAlternates("/submit"),
  openGraph: { ...ogDefaults, title, description, url: "/submit" },
  twitter: { card: "summary_large_image", title, description, ...twitterImage },
};

export default function SubmitPage() {
  return (
    <div className="max-w-2xl">
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Submit a repo", path: "/submit" }])} />
      <JsonLd data={staticPageLd({ name: title, description, path: "/submit" })} />
      <PageNav crumbs={[{ name: "Submit a repo" }]} fallbackHref={"/"} />
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Submit</p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Submit a repo</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Know an open-source AI or developer tool that&apos;s taking off? Suggest it here. Submissions are free and reviewed by hand. Once
        added, a repo is ranked like every other one, purely by the stars it gains, so submitting doesn&apos;t buy a better spot.
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
        <li>It must be a public GitHub repo with an open-source license.</li>
        <li>It should be AI, LLM, agent, MCP or developer-tool related.</li>
        <li>You&apos;ll open a short public GitHub issue, which needs a free GitHub account. You can email us instead.</li>
      </ul>
      <div className="mt-6 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
        <SubmitForm tracked={getRepos().map((r) => r.fullName)} />
      </div>
    </div>
  );
}
