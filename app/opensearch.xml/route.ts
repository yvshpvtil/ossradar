import { SITE } from "@/lib/site";

// OpenSearch description: lets browsers offer "search OSS Radar" from the address bar (Chrome
// tab-to-search, Firefox/Safari/Edge "add search engine"). Advertised by <link rel="search"> in the
// root layout; the homepage leaderboard reads ?q= and pre-fills its search box.
export function GET() {
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/" xmlns:moz="http://www.mozilla.org/2006/browser/search/">
  <ShortName>${SITE.name}</ShortName>
  <Description>Search the fastest-rising open-source AI and developer tools tracked by ${SITE.name}</Description>
  <InputEncoding>UTF-8</InputEncoding>
  <Image width="16" height="16" type="image/x-icon">${SITE.url}/favicon.ico</Image>
  <Url type="text/html" method="get" template="${SITE.url}/?q={searchTerms}"/>
  <Url type="application/opensearchdescription+xml" rel="self" template="${SITE.url}/opensearch.xml"/>
  <moz:SearchForm>${SITE.url}/</moz:SearchForm>
</OpenSearchDescription>
`;
  return new Response(body, {
    headers: {
      "Content-Type": "application/opensearchdescription+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
      "X-Robots-Tag": "noindex",
    },
  });
}
