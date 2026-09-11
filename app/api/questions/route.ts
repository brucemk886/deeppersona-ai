import { publicQuestion } from "@/lib/public-quiz";
import { isAdminRequest } from "@/app/admin-auth";
import { deleteQuestion, listQuestions, saveQuestion } from "@/db/quiz-store";
import { type QuizQuestion } from "@/lib/quiz";
import { paymentError, requireSameOrigin } from "@/lib/payment-http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const includeInactive = url.searchParams.get("all") === "1";
  const testId = url.searchParams.get("test")?.slice(0, 100);
  if (includeInactive) {
    if (!await isAdminRequest(request)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const items = await listQuestions(testId, includeInactive);
    return Response.json({ questions: includeInactive ? items : items.map(publicQuestion) }, {
      headers: { "Cache-Control": "no-store", Vary: "Cookie" },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load questions" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  if (!await isAdminRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as QuizQuestion;
  const valid =
    typeof body.id === "string" &&
    typeof body.testId === "string" &&
    typeof body.prompt === "string" &&
    typeof body.kicker === "string" &&
    typeof body.atlasPath === "string" &&
    typeof body.active === "boolean" &&
    Number.isSafeInteger(body.position) && body.position >= 0 &&
    Array.isArray(body.options) &&
    body.options.length === 4 &&
    body.options.every(
      (option) =>
        typeof option.label === "string" &&
        typeof option.microcopy === "string" &&
        typeof option.meaning === "string" &&
        typeof option.projection === "string" &&
        [option.readingFocus, option.styleKey, option.cardTone].every((value) => value === undefined || typeof value === "string"),
    );

  if (!valid) {
    return Response.json({ error: "Invalid question payload" }, { status: 400 });
  }

  await saveQuestion({
    ...body,
    options: body.options.map(({ label, microcopy, meaning, projection, readingFocus, styleKey, cardTone }) => ({
      label,
      microcopy,
      meaning,
      projection,
      ...(readingFocus ? { readingFocus } : {}),
      ...(styleKey ? { styleKey } : {}),
      ...(cardTone ? { cardTone } : {}),
    })),
  });
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!await isAdminRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    requireSameOrigin(request);
    const id = new URL(request.url).searchParams.get("id")?.trim();
    if (!id || id.length > 100) {
      return Response.json({ error: "Invalid question id" }, { status: 400 });
    }
    await deleteQuestion(id);
    return Response.json({ ok: true });
  } catch (error) { return paymentError(error); }
}
