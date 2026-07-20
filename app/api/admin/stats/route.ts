import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getAdminStats } from "@/db/quiz-store";
import { isAdminEmail } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user || !isAdminEmail(user.email)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return Response.json(await getAdminStats());
}
