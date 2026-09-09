import { adminCookie, createAdminSession, isCorrectAdminCredential } from "@/app/admin-auth";

function safeReturnTo(value: string | null): string { return value && value.startsWith("/") && !value.startsWith("//") ? value : "/admin"; }

function sessionCookie(value: string, request: Request, maxAge = adminCookie.maxAge) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${adminCookie.name}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly${secure}; SameSite=Strict`;
}

export async function POST(request: Request) {
  const form = await request.formData();
  const username = typeof form.get("username") === "string" ? String(form.get("username")) : "";
  const password = typeof form.get("password") === "string" ? String(form.get("password")) : "";
  const returnTo = safeReturnTo(new URL(request.url).searchParams.get("return_to"));
  if (!isCorrectAdminCredential(username, password)) return new Response(null, { status: 303, headers: { Location: new URL(`/admin/login?error=1&return_to=${encodeURIComponent(returnTo)}`, request.url).toString() } });
  const response = new Response(null, { status: 303, headers: { Location: new URL(returnTo, request.url).toString() } });
  response.headers.append("Set-Cookie", sessionCookie(await createAdminSession(), request));
  return response;
}

export function DELETE(request: Request) {
  const response = Response.json({ ok: true });
  response.headers.append("Set-Cookie", sessionCookie("", request, 0));
  return response;
}

export function GET(request: Request) {
  const response = new Response(null, { status: 303, headers: { Location: new URL("/admin/login", request.url).toString() } });
  response.headers.append("Set-Cookie", sessionCookie("", request, 0));
  return response;
}
