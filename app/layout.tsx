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
    title: "DeepPersona AI — Visual Self-Reflection Tests",
    description:
      "Eight short visual tests for entertainment and self-reflection on connection, boundaries, and relationships. Not clinical assessments.",
    applicationName: "DeepPersona AI",
    icons: {
      icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "One image can say what words miss.",
      description: "Explore eight visual and situational self-reflection tests from DeepPersona AI.",
      type: "website",
      images: metadataBase ? [{ url: new URL("/og-deep-persona.png", metadataBase) }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: "One image can say what words miss.",
      description: "Explore eight visual and situational self-reflection tests from DeepPersona AI.",
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
