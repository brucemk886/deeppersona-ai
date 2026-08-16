import { getAdminUsername, requireAdmin } from "@/app/admin-auth";
import { AdminShell } from "@/app/admin/_components/admin-shell";
import { hasAdminAllowlist } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin("/admin");
  return (
    <AdminShell adminUsername={getAdminUsername()} hasAllowlist={hasAdminAllowlist()}>
      {children}
    </AdminShell>
  );
}
