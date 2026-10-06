"use client";
import { currentAttribution } from '@/lib/traffic';
import { confirmLinkArrival } from '@/lib/link-arrival';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { trackGoogleAnalyticsEvent, getAnalyticsConsent, clearGoogleAnalyticsCookies } from '@/lib/google-analytics';

// Keep local page counts and Google Analytics separate.
export function GoogleAnalytics() {
  const pathname = usePathname();
  const trackedPage = useRef('');
  useEffect(() => {
    if (/^\/(reports|admin|recover|api)(\/|$)/.test(pathname)) return;
    const clickId = currentAttribution().visitId;
    if (!clickId) return;
    let cancelled = false, sent = false;
    const report = async () => {
      if (cancelled || sent || document.visibilityState !== 'visible' || getAnalyticsConsent() === 'denied') return;
      sent = true;
      if (!await confirmLinkArrival(clickId)) sent = false;
    };
    void report();
    document.addEventListener('visibilitychange', report);
    const retry = window.setTimeout(report, 1500);
    return () => { cancelled = true; window.clearTimeout(retry); document.removeEventListener('visibilitychange', report); };
  }, [pathname]);

  useEffect(() => {
    if (getAnalyticsConsent() === 'denied') clearGoogleAnalyticsCookies();
    try { sessionStorage.removeItem('dp_traffic_visit'); localStorage.removeItem('dp_traffic_visitor'); } catch { /* Storage unavailable. */ }
    if (/^\/(reports|admin|recover|api)(\/|$)/.test(pathname) || trackedPage.current === pathname) return;
    trackedPage.current = pathname;
    trackGoogleAnalyticsEvent('page_view');
    const page = pathname === '/' ? '/' : pathname.startsWith('/tests/') ? '/tests' : pathname.startsWith('/insights') ? '/insights' : pathname === '/blog' || pathname.startsWith('/blog/') ? '/blog' : '/other';
    void fetch('/api/traffic', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({anonymous:true,id:crypto.randomUUID(),page}),keepalive:true}).catch(()=>undefined);
  }, [pathname]);
  return null;
}
