import { chatGPTSignOutPath, requireChatGPTUser } from "@/app/chatgpt-auth";
import { hasAdminAllowlist, isAdminEmail } from "@/lib/admin";
import { AdminDashboard } from "./admin-dashboard";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  if (!isAdminEmail(user.email)) {
    return (
      <main className="gate-shell">
        <section className="upgrade-modal">
          <span className="result-seal">访问受限</span>
          <h2>当前账号不在管理员白名单中。</h2>
          <p>请让站点所有者将你的邮箱加入 ADMIN_EMAILS 设置。</p>
          <Link href="/" className="primary-button full-button">返回测试网站</Link>
        </section>
      </main>
    );
  }

  return (
    <AdminDashboard
      adminEmail={user.email}
      hasAllowlist={hasAdminAllowlist()}
      signOutPath={chatGPTSignOutPath("/")}
    />
  );
}
