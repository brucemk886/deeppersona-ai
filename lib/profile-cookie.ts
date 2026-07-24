const PROFILE_COOKIE = "dp_profile";
const profilePattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function readProfileId(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const value = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${PROFILE_COOKIE}=`))
    ?.slice(PROFILE_COOKIE.length + 1);
  return value && profilePattern.test(value) ? value : undefined;
}

export function createProfileId() {
  return crypto.randomUUID();
}

export function profileCookie(profileId: string) {
  return `${PROFILE_COOKIE}=${profileId}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`;
}