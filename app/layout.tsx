import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { GoogleAnalytics } from "@/app/_components/google-analytics";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0d0b24",
};

const TITLE = "DeepPersona AI — Your Cosmic Blueprint: Free Astrology Reading";
const DESCRIPTION = "Discover your Sun sign, Moon sign and Life Path number in a 3-minute quiz. Get a free personality reading and an optional full reading on love, matches and career. For entertainment and self-reflection.";
const SHARE_TITLE = "What do your Sun and Moon say about you?";
const SHARE_DESCRIPTION = "Take the free 3-minute astrology quiz from DeepPersona AI. For entertainment and self-reflection.";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const metadataBase = host ? new URL(`${protocol}://${host}`) : undefined;

  return {
    metadataBase,
    title: TITLE,
    description: DESCRIPTION,
    applicationName: "DeepPersona AI",
    icons: {
      icon: [
        { url: "/brand/favicon-v2-32.png", type: "image/png", sizes: "32x32" },
        { url: "/brand/favicon-v2-16.png", type: "image/png", sizes: "16x16" },
      ],
      shortcut: "/brand/favicon-v2-32.png",
      apple: [{ url: "/brand/apple-touch-icon-v2.png", sizes: "180x180", type: "image/png" }],
    },
    openGraph: {
      title: SHARE_TITLE,
      description: SHARE_DESCRIPTION,
      type: "website",
      images: metadataBase ? [{ url: new URL("/og-deep-persona.png", metadataBase) }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: SHARE_TITLE,
      description: SHARE_DESCRIPTION,
      images: metadataBase ? [new URL("/og-deep-persona.png", metadataBase)] : undefined,
    },
    robots: { index: true, follow: true },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}<GoogleAnalytics /></body>
    </html>
  );
}
