export function getAttribution() {
  if (typeof window === "undefined") return { source: "direct", campaign: "" };
  const params = new URLSearchParams(window.location.search);
  const referrer = document.referrer;
  let referrerHost = "";
  try {
    referrerHost = referrer ? new URL(referrer).hostname : "";
  } catch {
    referrerHost = "";
  }
  const source =
    params.get("utm_source") ||
    (params.get("ttclid") || referrerHost.includes("tiktok.com") ? "tiktok" : referrerHost || "direct");
  return { source, campaign: params.get("utm_campaign") ?? "" };
}
