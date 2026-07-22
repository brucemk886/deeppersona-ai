import { requireAdmin } from "@/app/admin-auth";
import { AdminDashboard } from "./admin-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin("/admin");
  return <AdminDashboard adminEmail="admin" hasAllowlist signOutPath="/api/admin/login" />;
}
