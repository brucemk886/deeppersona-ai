import { publicTest } from "@/lib/public-quiz";
import { isAdminRequest } from "@/app/admin-auth";
import { deleteTest, listTests, saveTest } from "@/db/quiz-store";
import { paymentError, requireSameOrigin } from "@/lib/payment-http";
import { type QuizTest } from "@/lib/quiz";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const includeInactive = new URL(request.url).searchParams.get("all") === "1";
  if (includeInactive) {
    if (!await isAdminRequest(request)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const items = await listTests(includeInactive);
    return Response.json({ tests: items.map(publicTest) }, { headers: { "Cache-Control": "no-store", Vary: "Cookie" } });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load tests" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  if (!await isAdminRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as QuizTest;
  if (!Number.isSafeInteger(body.reportPriceCents) || body.reportPriceCents < 0 ||
      (body.reportPriceCents > 0 && body.reportPriceCents < 50) || body.reportPriceCents > 99999999) {
    return Response.json({ error: "报告价格须为 0（免费），或至少 0.50 美元。" }, { status: 400 });
  }
  const valid =
    typeof body.id === "string" &&
    typeof body.title === "string" &&
    typeof body.kicker === "string" &&
    typeof body.description === "string" &&
    typeof body.coverAtlasPath === "string" &&
    typeof body.accent === "string" &&
    Number.isInteger(body.reportPriceCents) && body.reportPriceCents >= 0 &&
    Number.isFinite(body.position);

  if (!valid) return Response.json({ error: "Invalid test payload" }, { status: 400 });
  await saveTest(body);
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!await isAdminRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    requireSameOrigin(request);
    const id = new URL(request.url).searchParams.get("id")?.trim();
    if (!id || id.length > 100) return Response.json({ error: "Invalid test id" }, { status: 400 });
    await deleteTest(id);
    return Response.json({ ok: true });
  } catch (error) { return paymentError(error); }
}
