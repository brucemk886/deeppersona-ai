import { getChatGPTUser } from "@/app/chatgpt-auth";
import { deleteQuestion, listQuestions, saveQuestion } from "@/db/quiz-store";
import { isAdminEmail } from "@/lib/admin";
import { TRAIT_KEYS, type QuizQuestion } from "@/lib/quiz";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const includeInactive = new URL(request.url).searchParams.get("all") === "1";
  if (includeInactive) {
    const user = await getChatGPTUser();
    if (!user || !isAdminEmail(user.email)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    return Response.json({ questions: await listQuestions(includeInactive) });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load questions" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const user = await getChatGPTUser();
  if (!user || !isAdminEmail(user.email)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as QuizQuestion;
  const valid =
    typeof body.id === "string" &&
    typeof body.prompt === "string" &&
    typeof body.kicker === "string" &&
    typeof body.atlasPath === "string" &&
    Array.isArray(body.options) &&
    body.options.length === 4 &&
    body.options.every(
      (option) =>
        typeof option.label === "string" &&
        typeof option.microcopy === "string" &&
        TRAIT_KEYS.includes(option.scoreKey),
    );

  if (!valid) {
    return Response.json({ error: "Invalid question payload" }, { status: 400 });
  }

  await saveQuestion(body);
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await getChatGPTUser();
  if (!user || !isAdminEmail(user.email)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id || id.length > 100) {
    return Response.json({ error: "Invalid question id" }, { status: 400 });
  }

  await deleteQuestion(id);
  return Response.json({ ok: true });
}
