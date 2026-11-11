import { getRepos } from "@/lib/data";
import { ogCard, OG_SIZE } from "@/lib/og";

export const alt = "Suggest a rising AI or developer-tool repo for OSS Radar to track";
export const size = OG_SIZE;
export const contentType = "image/png";

// A card for shared /submit links, so they preview the suggestion form rather than the generic site card.
export default function Image() {
  const tracked = getRepos().length;
  return ogCard({
    eyebrow: "Submit a repo",
    title: "Suggest a rising open-source AI or developer-tool repo",
    subtitle: "Free and reviewed by hand · ranked purely by the GitHub stars it gains",
    stat: tracked ? `${tracked} repos tracked` : undefined,
  });
}
