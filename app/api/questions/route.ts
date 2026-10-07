import { fixedValidation, isFixedQuestion } from "@/lib/attachment-fixed";
import { managedOption, publicQuestion } from "@/lib/public-quiz";
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

  try {
  requireSameOrigin(request);
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
    (body.reportConfig ? body.options.length >= 4 && body.options.length <= 8 : body.options.length === 4) &&
    body.options.every(
      (option) =>
        typeof option.label === "string" &&
        [option.readingFocus, option.styleKey, option.cardTone].every((value) => value === undefined || typeof value === "string"),
    );

  if (!valid) {
    return Response.json({ error: "Invalid question payload" }, { status: 400 });
  }

  const issue = fixedValidation(body);
  if (issue) return Response.json({error:issue},{status:400});
  if (body.reportConfig && (!isFixedQuestion(body.id) || body.testId !== "attachment-style")) return Response.json({error:"Invalid fixed edition"},{status:400});
  if(body.reportConfig){
    const previous=(await listQuestions(body.testId,true)).find(q=>q.id===body.id);
    if(previous && (JSON.stringify(previous.reportConfig)!==JSON.stringify(body.reportConfig) || previous.options.map(o=>o.optionId).join('|')!==body.options.map(o=>o.optionId).join('|') || previous.options.some((o,i)=>o.fixed?.tag!==body.options[i]?.fixed?.tag))) return Response.json({error:"此版本的计分用途、情境、选项 ID 与标签不可重排。请在新版本中调整结构。"},{status:409});
  }
  await saveQuestion({
    ...body,
    options: body.options.map((option, index) => managedOption(option, index)),
  });
  return Response.json({ ok: true });
  } catch (error) { return paymentError(error); }
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
