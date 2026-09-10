import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { GoogleAnalytics } from "@/app/_components/google-analytics";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const metadataBase = host ? new URL(`${protocol}://${host}`) : undefined;

  return {
    metadataBase,
    title: "Attachment Style Test | DeepPersona AI",
    description:
      "Take a free 5-minute attachment style test. See whether you show up as secure, anxious, avoidant, or fearful-avoidant in love. For entertainment and self-reflection, not diagnosis.",
    applicationName: "DeepPersona AI",
    icons: {
      icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "Attachment Style Test",
      description: "Discover your attachment style in 5 minutes. Free to take, for self-reflection.",
      type: "website",
      images: metadataBase ? [{ url: new URL("/og-deep-persona.png", metadataBase) }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: "Attachment Style Test",
      description: "Discover your attachment style in 5 minutes. Free to take, for self-reflection.",
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
