import { listAffiliateProducts, listTests } from "@/db/quiz-store";

export const dynamic = "force-dynamic";

/** Public bootstrap: active tests + affiliate products in one round trip. */
export async function GET() {
  try {
    const [tests, products] = await Promise.all([listTests(false), listAffiliateProducts(false)]);
    return Response.json({ tests, products });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load catalog" },
      { status: 500 },
    );
  }
}
