import { getCompareRows } from "@/lib/compareRows";

/** Compare-table data for /compare, fetched by the client only once a repo is picked or the search box is used. */
export function GET() {
  return Response.json(getCompareRows(), {
    headers: { "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400", "X-Robots-Tag": "noindex" },
  });
}
