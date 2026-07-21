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
    title: "Inner Atlas — Visual Psychology Tests",
    description:
      "Eight short visual tests reveal how you connect, reset, set boundaries, and move through relationships.",
    applicationName: "Inner Atlas",
    openGraph: {
      title: "One image can say what words miss.",
      description: "Explore eight 2-minute visual psychology tests from Inner Atlas.",
      type: "website",
      images: metadataBase ? [{ url: new URL("/og-v2.png", metadataBase) }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: "One image can say what words miss.",
      description: "Explore eight 2-minute visual psychology tests from Inner Atlas.",
      images: metadataBase ? [new URL("/og-v2.png", metadataBase)] : undefined,
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
