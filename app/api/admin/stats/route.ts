import { isAdminRequest } from "@/app/admin-auth";
import { getAdminStats } from "@/db/quiz-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return Response.json(await getAdminStats());
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load admin stats" },
      { status: 500 },
    );
  }
}
