import { getAnalyticsConsent } from './google-analytics';

export type Attribution = { source: string; campaign: string; medium: string; content: string; visitId?: string };
export function resolveAttribution(search: string, referrer: string, host: string, previous?: Attribution): Attribution {
  const params = new URLSearchParams(search);
  let external = '';
  try { const name = new URL(referrer).hostname; if (name.replace(/^www\./, '') !== host.replace(/^www\./, '')) external = name; } catch { /* No referrer. */ }
  const clean = (value: string | null) => (value ?? '').replace(/[^a-zA-Z0-9._ -]/g, '').slice(0, 120);
  const source = clean(params.get('utm_source'));
  // Internal campaign links must not overwrite acquisition attribution.
  if (params.get('utm_medium') === 'internal') return previous ?? { source: 'unknown', campaign: '', medium: '', content: '' };
  if (source || params.has('ttclid')) return { source: source || 'tiktok', campaign: clean(params.get('utm_campaign')), medium: clean(params.get('utm_medium')), content: clean(params.get('utm_content')) };
  return previous ?? { source: /(^|\.)tiktok\.com$/.test(external) ? 'tiktok' : external || 'direct', campaign: '', medium: '', content: '' };
}

const ATTRIBUTION_KEY = 'dp_attr';
const CLICK_ID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

function storedAttribution(): Attribution | undefined {
  try {
    const saved = JSON.parse(sessionStorage.getItem(ATTRIBUTION_KEY) || 'null') as Attribution | null;
    if (saved && typeof saved.source === 'string') return saved;
  } catch { /* Storage unavailable. */ }
  return undefined;
}

// The landing URL is kept for the browser session, so attribution survives redirects and in-app navigation.
export function currentAttribution(): Attribution {
  if (typeof window === 'undefined') return { source: 'direct', campaign: '', medium: '', content: '' };
  const consent = getAnalyticsConsent();
  const attribution = resolveAttribution(location.search, document.referrer, location.hostname, consent === 'denied' ? undefined : storedAttribution());
  const clickId = new URLSearchParams(location.search).get('lf_click');
  const linkedSource = (attribution.source === 'tiktok' && attribution.campaign.startsWith('factory-')) || attribution.source === 'tiktok_one';
  if (consent !== 'denied' && linkedSource && CLICK_ID.test(clickId || '')) attribution.visitId = clickId!;
  if (consent !== 'denied') {
    try { sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution)); } catch { /* Storage unavailable. */ }
  }
  return attribution;
}
