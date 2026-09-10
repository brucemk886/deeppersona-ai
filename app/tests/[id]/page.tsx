import { listQuestions, listTests } from "@/db/quiz-store";
import { PUBLIC_TEST_ID } from "@/lib/attachment-styles";
import { publicTest, publicQuestion } from "@/lib/public-quiz";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { QuizApp } from "@/app/quiz-app";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (id !== PUBLIC_TEST_ID) return {};
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
  if (id !== PUBLIC_TEST_ID) redirect("/");
  const [tests, questions] = await Promise.all([listTests(), listQuestions(id)]);
  return <QuizApp initialTests={tests.map(publicTest)} initialQuestions={questions.map(publicQuestion)} />;
}
