import { isAdminRequest } from "@/app/admin-auth";
import { listTests, saveTest } from "@/db/quiz-store";
import { isValidQuizTest } from "@/lib/admin/validation";
import type { QuizTest } from "@/lib/quiz";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return Response.json({ tests: await listTests(true) });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load tests" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as QuizTest;
  if (!isValidQuizTest(body)) {
    return Response.json({ error: "Invalid test payload" }, { status: 400 });
  }

  await saveTest(body);
  return Response.json({ ok: true });
}
