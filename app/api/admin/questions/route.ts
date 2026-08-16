import { isAdminRequest } from "@/app/admin-auth";
import { deleteQuestion, listQuestions, saveQuestion } from "@/db/quiz-store";
import { isValidQuizQuestion } from "@/lib/admin/validation";
import type { QuizQuestion } from "@/lib/quiz";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const testId = new URL(request.url).searchParams.get("test")?.slice(0, 100) || undefined;

  try {
    return Response.json({ questions: await listQuestions(testId, true) });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load questions" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as QuizQuestion;
  if (!isValidQuizQuestion(body)) {
    return Response.json({ error: "Invalid question payload" }, { status: 400 });
  }

  await saveQuestion(body);
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id || id.length > 100) {
    return Response.json({ error: "Invalid question id" }, { status: 400 });
  }

  await deleteQuestion(id);
  return Response.json({ ok: true });
}
