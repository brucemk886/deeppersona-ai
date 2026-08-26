import { listAffiliateProducts } from "@/db/quiz-store";

export const dynamic = "force-dynamic";

/** Public catalog endpoint — active products only. Admin mutations live under /api/admin/affiliates. */
export async function GET() {
  try {
    return Response.json({ products: await listAffiliateProducts(false) });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load affiliate products" },
      { status: 500 },
    );
  }
}
