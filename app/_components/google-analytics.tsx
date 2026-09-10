"use client";
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { trackGoogleAnalyticsEvent, getAnalyticsConsent, clearGoogleAnalyticsCookies } from '@/lib/google-analytics';

// Keep local page counts and Google Analytics separate.
export function GoogleAnalytics() {
  const pathname = usePathname();
  const trackedPage = useRef('');
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
