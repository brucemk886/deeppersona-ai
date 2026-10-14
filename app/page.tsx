import type { Metadata } from "next";
import { AstroQuiz } from "@/app/_components/astro-quiz";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return <AstroQuiz />;
}
