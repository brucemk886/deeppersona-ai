import { listTests } from "@/db/quiz-store";

export const dynamic = "force-dynamic";

/** Public catalog endpoint — active tests only. Admin mutations live under /api/admin/tests. */
export async function GET() {
  try {
    return Response.json({ tests: await listTests(false) });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load tests" },
      { status: 500 },
    );
  }
}
