import { getRuntimeEnv } from "@/db/quiz-store";

export function isAdminEmail(email: string): boolean {
  const configured = getRuntimeEnv().ADMIN_EMAILS?.trim();
  if (!configured) return true;
  return configured
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

export function hasAdminAllowlist(): boolean {
  return Boolean(getRuntimeEnv().ADMIN_EMAILS?.trim());
}
