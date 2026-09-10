export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // vinext currently combines CSS imports from all routes. A route-local stylesheet
  // keeps operations-dashboard CSS out of the public quiz's render-blocking bundle.
  return <><link rel="stylesheet" href="/styles/admin.css" precedence="admin" />{children}</>;
}
