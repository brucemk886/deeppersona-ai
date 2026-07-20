import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const metadataBase = host ? new URL(`${protocol}://${host}`) : undefined;

  return {
    metadataBase,
    title: "Inner Atlas — Visual Personality Test",
    description:
      "Four instinctive image choices reveal how you move through possibility, connection, structure, and creativity.",
    applicationName: "Inner Atlas",
    openGraph: {
      title: "What pulls you in says more than you think.",
      description: "Take the 2-minute Inner Atlas visual personality test.",
      type: "website",
      images: metadataBase ? [{ url: new URL("/og.png", metadataBase) }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: "What pulls you in says more than you think.",
      description: "Take the 2-minute Inner Atlas visual personality test.",
      images: metadataBase ? [new URL("/og.png", metadataBase)] : undefined,
    },
    robots: { index: true, follow: true },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
