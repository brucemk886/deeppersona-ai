import { listQuestions, listTests } from "@/db/quiz-store";
import { publicTest, publicQuestion } from "@/lib/public-quiz";
import type { Metadata } from "next";
import { QuizApp } from "@/app/quiz-app";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const test = (await listTests()).find((item) => item.id === id);
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
  const [tests, questions] = await Promise.all([listTests(), listQuestions(id)]);
  return <QuizApp initialTestId={id} initialTests={tests.map(publicTest)} initialQuestions={questions.map(publicQuestion)} />;
}
