import { chatGPTSignOutPath, requireChatGPTUser } from "@/app/chatgpt-auth";
import { hasAdminAllowlist, isAdminEmail } from "@/lib/admin";
import { AdminDashboard } from "./admin-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  if (!isAdminEmail(user.email)) {
    return (
      <main className="gate-shell">
        <section className="upgrade-modal">
          <span className="result-seal">Restricted</span>
          <h2>This account is not on the admin allowlist.</h2>
          <p>Ask the site owner to add your email to the ADMIN_EMAILS setting.</p>
          <a href="/" className="primary-button full-button">Back to the test</a>
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
