import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * Web app manifest so browsers, Google (sitename and icons) and home-screen
 * installers can find the site name, theme colors and icons without guessing.
 * Next.js serves this at /manifest.webmanifest and adds <link rel="manifest">
 * on every page. Not listed in sitemap.xml: it's a browser metadata file, not
 * a page, the same call we made for /api/v1/openapi.json.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.name,
    description: SITE.metaDescription,
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: "en",
    dir: "ltr",
    // Match the light-mode viewport themeColor in app/layout.tsx (the manifest
    // field is a single color; dark-mode chrome still follows the media-query
    // theme-color tags).
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
