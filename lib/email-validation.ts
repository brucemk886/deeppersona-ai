const COMMON_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "yahoo.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "proton.me",
  "protonmail.com",
  "aol.com",
  "zoho.com",
  "mail.com",
  "gmx.com",
  "qq.com",
  "163.com",
  "126.com",
]);

const BLOCKED_DOMAINS = new Set([
  "example.com",
  "example.org",
  "example.net",
  "test.com",
  "invalid.com",
  "fake.com",
  "mailinator.com",
  "tempmail.com",
  "guerrillamail.com",
]);

const BLOCKED_LOCAL_PARTS = new Set(["test", "testing", "example", "email", "fake", "none", "null", "undefined"]);
const EMAIL_PATTERN = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

export type EmailValidation = { valid: true; normalized: string } | { valid: false; message: string };

export function validateEmailAddress(value: string): EmailValidation {
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized.length > 254 || !EMAIL_PATTERN.test(normalized)) {
    return { valid: false, message: "Enter a valid email, such as name@gmail.com." };
  }

  const [localPart, domain] = normalized.split("@");
  if (!localPart || !domain || BLOCKED_LOCAL_PARTS.has(localPart) || BLOCKED_DOMAINS.has(domain)) {
    return { valid: false, message: "Please use an email address you can access—not a test or placeholder address." };
  }

  const domainParts = domain.split(".");
  const topLevelDomain = domainParts.at(-1) ?? "";
  if (topLevelDomain.length < 2 || /^\d+$/.test(topLevelDomain)) {
    return { valid: false, message: "Please check the email domain and try again." };
  }

  if (!COMMON_EMAIL_DOMAINS.has(domain) && (domain.startsWith("gmail") || domain.startsWith("yahoo") || domain.startsWith("outlook") || domain.startsWith("hotmail"))) {
    return { valid: false, message: "Please check the email provider spelling, for example gmail.com or outlook.com." };
  }

  return { valid: true, normalized };
}
