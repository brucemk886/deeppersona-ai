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
    title: "DeepPersona AI — Visual Psychology Tests",
    description:
      "Eight short visual tests reveal how you connect, reset, set boundaries, and move through relationships.",
    applicationName: "DeepPersona AI",
    openGraph: {
      title: "One image can say what words miss.",
      description: "Explore eight 2-minute visual psychology tests from DeepPersona AI.",
      type: "website",
      images: metadataBase ? [{ url: new URL("/og-deep-persona.png", metadataBase) }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: "One image can say what words miss.",
      description: "Explore eight 2-minute visual psychology tests from DeepPersona AI.",
      images: metadataBase ? [new URL("/og-deep-persona.png", metadataBase)] : undefined,
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
