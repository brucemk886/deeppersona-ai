import { adminCookie, createAdminSession, isCorrectAdminCredential } from "@/app/admin-auth";

function safeReturnTo(value: string | null): string { return value && value.startsWith("/") && !value.startsWith("//") ? value : "/admin"; }

export async function POST(request: Request) {
  const form = await request.formData();
  const username = typeof form.get("username") === "string" ? String(form.get("username")) : "";
  const password = typeof form.get("password") === "string" ? String(form.get("password")) : "";
  const returnTo = safeReturnTo(new URL(request.url).searchParams.get("return_to"));
  if (!isCorrectAdminCredential(username, password)) return Response.redirect(new URL(`/admin/login?error=1&return_to=${encodeURIComponent(returnTo)}`, request.url), 303);
  const response = Response.redirect(new URL(returnTo, request.url), 303);
  response.headers.append("Set-Cookie", `${adminCookie.name}=${await createAdminSession()}; Path=/; Max-Age=${adminCookie.maxAge}; HttpOnly; Secure; SameSite=Strict`);
  return response;
}

export function DELETE(request: Request) {
  const response = Response.json({ ok: true });
  response.headers.append("Set-Cookie", `${adminCookie.name}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`);
  return response;
}

export function GET(request: Request) {
  const response = Response.redirect(new URL("/admin/login", request.url), 303);
  response.headers.append("Set-Cookie", `${adminCookie.name}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`);
  return response;
}
