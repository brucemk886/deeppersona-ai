import type { Metadata } from "next";
import { QuizApp } from "@/app/quiz-app";
import { defaultTests } from "@/lib/quiz";

export function generateStaticParams() {
  return defaultTests.filter((test) => test.active).map((test) => ({ id: test.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const test = defaultTests.find((item) => item.id === id && item.active);
  if (!test) return {};

  const title = `${test.title} | DeepPersona AI`;
  const image = test.coverAtlasPath.replace(".png", "-768.webp");
  const canonical = `/tests/${test.id}`;

  return {
    title,
    description: test.description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description: test.description,
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: test.description,
      images: [image],
    },
  };
}

export default async function TestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <QuizApp initialTestId={id} initialTests={defaultTests} />;
}
