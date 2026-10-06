// Retryable and idempotent on the server; no cookies or local/session storage.
export async function confirmLinkArrival(clickId: string, send: typeof fetch = fetch): Promise<boolean> {
 try {
  const response = await send('/api/link-arrival', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({clickId}),keepalive:true});
  return response.ok;
 } catch { return false; }
}
