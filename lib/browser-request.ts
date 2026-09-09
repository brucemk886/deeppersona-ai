// Keep the deadline active while reading the body, not only until response headers arrive.
// AbortController also works in embedded browsers without AbortSignal.timeout.
export async function requestJson<T>(url: string, init: RequestInit = {}, timeoutMs = 20000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    let data: T & { error?: string };
    try { data = await response.json(); }
    catch { throw new Error('We could not read the response. Please try again.'); }
    if (!response.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Something went wrong. Please try again.');
    return data;
  } catch (error) {
    if (controller.signal.aborted) throw new Error('The connection took too long. Please check your connection and try again.');
    if (error instanceof TypeError) throw new Error('Unable to connect. Please check your connection and try again.');
    throw error;
  } finally { clearTimeout(timer); }
}
