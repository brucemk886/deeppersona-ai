const THIRD_PARTY_ANALYTICS_ENABLED = true;
export const GA_MEASUREMENT_ID = "G-WS2Z8SKMY1";
export const ANALYTICS_CONSENT_KEY = "deeppersona_analytics_consent_v2";

export type AnalyticsConsent = "granted" | "denied";

type GoogleAnalyticsValue = string | number | boolean;
type GoogleAnalyticsParameters = Record<string, GoogleAnalyticsValue | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __deepPersonaGaInitialized?: boolean;
  }
}

const quizEventNames: Record<string, string> = {
  session_started: "test_session_start",
  quiz_started: "quiz_start",
  question_viewed: "quiz_question_view",
  answer_selected: "quiz_answer",
  email_gate_viewed: "email_gate_view",
  result_viewed: "quiz_result_view",
  upgrade_clicked: "upgrade_click",
  affiliate_link_clicked: "affiliate_click",
};

export function getAnalyticsConsent(): AnalyticsConsent | null {
  if (typeof window === "undefined") return null;
  if ((window.navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return 'denied';
  try {
    const choice = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
    if (choice === 'granted' || choice === 'denied') return choice;
    // Earlier versions automatically wrote "granted". That is not an affirmative choice.
    return window.localStorage.getItem('deeppersona_analytics_consent') === 'denied' ? 'denied' : null;
  } catch { return null; }
}

function cleanParameters(parameters: GoogleAnalyticsParameters) {
  return Object.fromEntries(
    Object.entries(parameters).filter((entry): entry is [string, GoogleAnalyticsValue] => ['step', 'method'].includes(entry[0]) && entry[1] !== undefined),
  );
}

export function analyticsPagePath(pathname: string) {
  if (/^\/(reports|admin|recover|api)(\/|$)/.test(pathname)) return null;
  if (pathname.startsWith('/tests/')) return '/tests';
  if (pathname.startsWith('/insights/')) return '/insights';
  return ['/', '/privacy', '/terms', '/refunds', '/contact', '/disclaimer'].includes(pathname) ? pathname : '/other';
}

function pageParameters() {
  const path = analyticsPagePath(window.location.pathname);
  return { page_location: window.location.origin + (path || '/'), page_path: path || '/',
    page_title: 'DeepPersona AI', page_referrer: '' };
}

function ensureGtag() {
  window.dataLayer ??= [];
  window.gtag ??= function (..._args: unknown[]) {
    window.dataLayer?.push(arguments);
  };
}

export function initializeGoogleAnalytics() {
  if (!THIRD_PARTY_ANALYTICS_ENABLED || typeof window === "undefined" || getAnalyticsConsent() === "denied" || analyticsPagePath(window.location.pathname) === null) return;
  ensureGtag();
  if (window.__deepPersonaGaInitialized) return;

  window.__deepPersonaGaInitialized = true;
  window.gtag?.("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  window.gtag?.("consent", "update", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  window.gtag?.("set", { ...pageParameters(), ads_data_redaction: true });
  window.gtag?.("js", new Date());
  window.gtag?.("config", GA_MEASUREMENT_ID, {
    ...pageParameters(),
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  if (!document.getElementById("deeppersona-google-analytics")) {
    const script = document.createElement("script");
    script.async = true;
    script.id = "deeppersona-google-analytics";
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);
  }
}

export function updateGoogleAnalyticsConsent(consent: AnalyticsConsent) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(ANALYTICS_CONSENT_KEY, consent); } catch { return; }

  if (consent === "granted") {
    initializeGoogleAnalytics();
    window.gtag?.("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    return;
  }

  window.gtag?.("consent", "update", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

export function clearGoogleAnalyticsCookies() {
  if (typeof document === "undefined") return;
  const cookieNames = document.cookie
    .split(";")
    .map((cookie) => cookie.trim().split("=")[0])
    .filter((name) => name === "_ga" || name.startsWith("_ga_"));

  for (const name of cookieNames) {
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
    document.cookie = `${name}=; Max-Age=0; path=/; domain=.deeppersonaai.com; SameSite=Lax`;
  }
}

export function trackGoogleAnalyticsEvent(eventName: string, parameters: GoogleAnalyticsParameters = {}) {
  if (!THIRD_PARTY_ANALYTICS_ENABLED || typeof window === "undefined" || getAnalyticsConsent() === "denied" || analyticsPagePath(window.location.pathname) === null) return;
  initializeGoogleAnalytics();
  window.gtag?.("event", eventName, { ...cleanParameters(parameters), ...pageParameters() });
}

export function trackQuizGoogleAnalyticsEvent(eventName: string, parameters: GoogleAnalyticsParameters = {}) {
  const googleEventName = quizEventNames[eventName];
  if (!googleEventName) return;
  trackGoogleAnalyticsEvent(googleEventName, parameters);
}
