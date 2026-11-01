import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Every page is prerendered at build time from the committed data/ files, and the site is
// redeployed after each hourly data commit (see .github/workflows/deploy-cloudflare.yml), so the
// read-only Workers Static Assets cache is enough: no R2/KV/D1/Durable Objects, all free-plan.
// Cache interception stays off because it does not work with PPR (cacheComponents).
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
