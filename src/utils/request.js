// Deadline includes reading the response body. Never retry a mutation
// automatically: a timed-out payment may already have reached the server.
export async function requestJSON(url, { timeoutMs = 15000, signal, returnResponse = false, ...options } = {}) {
  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  if (signal?.aborted) abort();
  else signal?.addEventListener('abort', abort, { once: true });
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    let data;
    try { data = await response.json(); }
    catch (error) {
      if (controller.signal.aborted) throw error;
      const invalid = new Error('The kiosk returned an unreadable response. Please retry.');
      invalid.status = response.status;
      throw invalid;
    }
    if (!returnResponse && (!response.ok || data?.ok === false || data?.success === false)) {
      const error = new Error(data?.message || data?.error || 'The kiosk request failed. Please retry.');
      error.status = response.status;
      error.data = data;
      throw error;
    }
    if (!data || typeof data !== 'object') throw new Error('The kiosk returned an invalid response. Please retry.');
    return returnResponse ? { ok: response.ok, status: response.status, data } : data;
  } catch (error) {
    if (timedOut) {
      const timeout = new Error('The kiosk is taking too long to respond. Please retry.');
      timeout.name = 'TimeoutError';
      throw timeout;
    }
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
