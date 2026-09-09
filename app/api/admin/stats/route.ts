import { getTrafficStats } from '@/db/traffic-stats';
import { getOrderStats } from '@/db/order-stats';
import { isAdminRequest } from "@/app/admin-auth";
import { getAdminStats } from "@/db/quiz-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!await isAdminRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const range = new URL(request.url).searchParams.get("range");
  const [stats, orders, traffic] = await Promise.all([
    getAdminStats(range),
    getOrderStats(),
    getTrafficStats(range),
  ]);
  return Response.json({ ...stats, orders, traffic }, { headers: { "Cache-Control": "no-store" } });
}
