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

export function currentAttribution(): Attribution {
  if (typeof window === 'undefined') return { source: 'direct', campaign: '', medium: '', content: '' };
  const attribution = resolveAttribution(location.search, document.referrer, location.hostname);
  const clickId = new URLSearchParams(location.search).get('lf_click');
  if (getAnalyticsConsent() !== 'denied' && attribution.source === 'tiktok' && attribution.campaign.startsWith('factory-') && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(clickId || '')) attribution.visitId = clickId!;
  return attribution;
}
