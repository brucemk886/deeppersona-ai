import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getRuntimeEnv } from "@/db/quiz-store";

const COOKIE_NAME = "deeppersona_admin";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

type AdminRuntimeEnv = { ADMIN_PASSWORD?: string; ADMIN_SESSION_SECRET?: string; ADMIN_USERNAME?: string };

function credentials() {
  const env = getRuntimeEnv() as AdminRuntimeEnv;
  if (!env.ADMIN_PASSWORD || !env.ADMIN_SESSION_SECRET) throw new Error("管理员登录尚未完成配置。");
  return { password: env.ADMIN_PASSWORD, secret: env.ADMIN_SESSION_SECRET, username: env.ADMIN_USERNAME || "admin" };
}

async function hmac(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return result === 0;
}

export async function createAdminSession(): Promise<string> {
  const issuedAt = Math.floor(Date.now() / 1000).toString();
  return `${issuedAt}.${await hmac(`admin.${issuedAt}`, credentials().secret)}`;
}

export async function isValidAdminSession(value: string | undefined): Promise<boolean> {
  if (!value) return false;
  const [issuedAt, signature, extra] = value.split(".");
  if (!issuedAt || !signature || extra || !/^\d+$/.test(issuedAt)) return false;
  const age = Math.floor(Date.now() / 1000) - Number(issuedAt);
  if (age < -60 || age > SESSION_MAX_AGE) return false;
  try { return constantTimeEqual(signature, await hmac(`admin.${issuedAt}`, credentials().secret)); } catch { return false; }
}

export async function isAdminRequest(request: Request): Promise<boolean> {
  const value = request.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`))?.[1];
  return isValidAdminSession(value);
}

export async function requireAdmin(returnTo = "/admin"): Promise<void> {
  const store = await cookies();
  if (await isValidAdminSession(store.get(COOKIE_NAME)?.value)) return;
  redirect(`/admin/login?return_to=${encodeURIComponent(returnTo)}`);
}

export function isCorrectAdminCredential(username: string, password: string): boolean {
  try { const configured = credentials(); return constantTimeEqual(username, configured.username) && constantTimeEqual(password, configured.password); } catch { return false; }
}

export const adminCookie = { name: COOKIE_NAME, maxAge: SESSION_MAX_AGE };
