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
    title: "DeepPersona AI — Free Attachment Style Quiz",
    description:
      "A free 12-image attachment quiz for adult relationships. See whether you lean anxious, avoidant, secure, or fearful-avoidant. Educational self-reflection, not a diagnosis.",
    applicationName: "DeepPersona AI",
    icons: {
      icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "Do you know your attachment style?",
      description: "Take the free 12-image quiz from DeepPersona AI. Educational self-reflection, not a diagnosis.",
      type: "website",
      images: metadataBase ? [{ url: new URL("/og-deep-persona.png", metadataBase) }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: "Do you know your attachment style?",
      description: "Take the free 12-image quiz from DeepPersona AI. Educational self-reflection, not a diagnosis.",
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
