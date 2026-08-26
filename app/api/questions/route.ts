import { listQuestions } from "@/db/quiz-store";

export const dynamic = "force-dynamic";

/** Public catalog endpoint — active questions only. Admin mutations live under /api/admin/questions. */
export async function GET(request: Request) {
  const testId = new URL(request.url).searchParams.get("test")?.slice(0, 100) || undefined;

  try {
    return Response.json({ questions: await listQuestions(testId, false) });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load questions" },
      { status: 500 },
    );
  }
}
