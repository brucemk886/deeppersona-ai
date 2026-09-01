"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  clearGoogleAnalyticsCookies,
  getAnalyticsConsent,
  initializeGoogleAnalytics,
  trackGoogleAnalyticsEvent,
  updateGoogleAnalyticsConsent,
  type AnalyticsConsent,
} from "@/lib/google-analytics";

const LANDING_LOCATION_KEY = "deeppersona_ga_landing_location";
const INITIAL_PAGE_VIEW_KEY = "deeppersona_ga_initial_page_view";

export function GoogleAnalytics() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<AnalyticsConsent | null | "loading">("loading");
  const [choosing, setChoosing] = useState(false);

  useEffect(() => {
    let active = true;
    if (!window.sessionStorage.getItem(LANDING_LOCATION_KEY)) {
      window.sessionStorage.setItem(LANDING_LOCATION_KEY, window.location.href);
    }
    const storedConsent = getAnalyticsConsent();
    const effectiveConsent = storedConsent ?? "granted";
    if (storedConsent === null) updateGoogleAnalyticsConsent(effectiveConsent);
    if (effectiveConsent === "granted") initializeGoogleAnalytics();

    queueMicrotask(() => {
      if (!active) return;
      setConsent(effectiveConsent);
      setChoosing(false);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (consent !== "granted") return;
    initializeGoogleAnalytics();

    const initialPageViewSent = window.sessionStorage.getItem(INITIAL_PAGE_VIEW_KEY) === "sent";
    const pageLocation = initialPageViewSent
      ? window.location.href
      : window.sessionStorage.getItem(LANDING_LOCATION_KEY) ?? window.location.href;
    let pagePath = pathname;
    try {
      const pageUrl = new URL(pageLocation);
      pagePath = `${pageUrl.pathname}${pageUrl.search}`;
    } catch {
      pagePath = pathname;
    }

    trackGoogleAnalyticsEvent("page_view", {
      page_title: document.title,
      page_location: pageLocation,
      page_path: pagePath,
    });
    window.sessionStorage.setItem(INITIAL_PAGE_VIEW_KEY, "sent");
  }, [consent, pathname]);

  function allowAnalytics() {
    updateGoogleAnalyticsConsent("granted");
    setConsent("granted");
    setChoosing(false);
  }

  function useNecessaryOnly() {
    const wasGranted = consent === "granted";
    updateGoogleAnalyticsConsent("denied");
    clearGoogleAnalyticsCookies();
    setConsent("denied");
    setChoosing(false);
    if (wasGranted) window.location.reload();
  }

  if (consent === "loading") return null;

  return (
    <>
      {choosing ? (
        <section className="analytics-consent" aria-labelledby="analytics-consent-title" role="region">
          <div>
            <strong id="analytics-consent-title">Analytics preferences</strong>
            <p>Google Analytics helps us understand visits and test completion. We never send your email, image choices, or reflection result to Google. Read our <Link href="/privacy">Privacy Policy</Link>.</p>
          </div>
          <div className="analytics-consent-actions">
            <button className="analytics-decline" onClick={useNecessaryOnly} type="button">Turn off analytics</button>
            <button className="analytics-allow" onClick={allowAnalytics} type="button">Keep analytics on</button>
          </div>
        </section>
      ) : (
        <button className="analytics-choices" onClick={() => setChoosing(true)} type="button">Privacy choices</button>
      )}
    </>
  );
}
