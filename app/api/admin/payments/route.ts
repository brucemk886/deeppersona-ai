import { isAdminRequest } from "@/app/admin-auth";
import { getAdminPayments } from "@/db/quiz-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!await isAdminRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return Response.json(await getAdminPayments());
}
