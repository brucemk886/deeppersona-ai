import { isAdminRequest } from "@/app/admin-auth";
import { listTests, saveTest } from "@/db/quiz-store";
import { TRAIT_KEYS, type QuizTest } from "@/lib/quiz";

export const dynamic = "force-dynamic";

function hasValidAffiliateProductIds(test: QuizTest) {
  return TRAIT_KEYS.every((key) => {
    const productId = test.results[key]?.affiliateProductId;
    return productId === undefined || (typeof productId === "string" && productId.length <= 100);
  });
}

export async function GET(request: Request) {
  const includeInactive = new URL(request.url).searchParams.get("all") === "1";
  if (includeInactive) {
    if (!await isAdminRequest(request)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    return Response.json({ tests: await listTests(includeInactive) });
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
  const valid =
    typeof body.id === "string" &&
    typeof body.title === "string" &&
    typeof body.kicker === "string" &&
    typeof body.description === "string" &&
    typeof body.coverAtlasPath === "string" &&
    typeof body.accent === "string" &&
    Number.isInteger(body.reportPriceCents) && body.reportPriceCents >= 0 &&
    Number.isFinite(body.position) &&
    body.results &&
    TRAIT_KEYS.every((key) => body.results[key]?.key === key) &&
    hasValidAffiliateProductIds(body);

  if (!valid) return Response.json({ error: "Invalid test payload" }, { status: 400 });
  await saveTest(body);
  return Response.json({ ok: true });
}
