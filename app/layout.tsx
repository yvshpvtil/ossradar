import { NavTracker } from "@/components/BackNav";
import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { EngagementTracker } from "@/components/EngagementTracker";
import { JsonLd } from "@/components/JsonLd";
import { RSS_ALTERNATE, websiteLd } from "@/lib/seo";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SponsorSlot } from "@/components/SponsorSlot";
import { themeInitScript } from "@/components/ThemeToggle";
import { SITE } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  verification: { google: "NW8aDd0EOyyuQQXGn6EI_b-1v3VypoooB2-HIVpTUXY" },
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name}: fastest-rising open-source AI & dev tools`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.metaDescription,
  applicationName: SITE.name,
  alternates: {
    types: RSS_ALTERNATE,
  },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name}: fastest-rising open-source AI & dev tools`,
    description: `${SITE.ossExplainer} ${SITE.tagline}`,
    url: "/",
    locale: "en_US",
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
  twitter: { card: "summary_large_image", title: `${SITE.name}: fastest-rising open-source AI & dev tools`, description: `${SITE.ossExplainer} ${SITE.tagline}` },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col overflow-x-hidden font-sans">
        <NavTracker />
        <Header />
        <SponsorSlot />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
        <Footer />
        <JsonLd data={websiteLd} />
        <Analytics />
        <EngagementTracker />
      </body>
    </html>
  );
}
