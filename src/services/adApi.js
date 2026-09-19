import { API_BASE } from '../config/api.js';

async function parseResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    const err = new Error(data.message || `Request failed (HTTP ${res.status})`);
    err.code = data.code || `HTTP_${res.status}`;
    throw err;
  }
  return data;
}

export async function getAdConfig() {
  return parseResponse(await fetch(`${API_BASE}/api/ads/config`, { cache:'no-store' }));
}

export async function getAdQuote(payload) {
  return parseResponse(await fetch(`${API_BASE}/api/ads/quote`, {
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)
  }));
}

export async function createAdDraft(payload) {
  return parseResponse(await fetch(`${API_BASE}/api/ads/drafts`, {
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)
  }));
}

export async function uploadAdFile({ campaignId, file, onProgress }) {
  const chunkSize = 4 * 1024 * 1024;
  const total = Math.ceil(file.size / chunkSize);
  for (let index = 0; index < total; index++) {
    const chunk = file.slice(index * chunkSize, Math.min(file.size, (index + 1) * chunkSize));
    const url = new URL(`${API_BASE}/api/ads/${encodeURIComponent(campaignId)}/chunks`);
    url.searchParams.set('index', String(index));
    url.searchParams.set('total', String(total));
    url.searchParams.set('mime', file.type);
    url.searchParams.set('size', String(file.size));
    await parseResponse(await fetch(url, {
      method:'POST',
      headers:{'Content-Type':'application/octet-stream'},
      body:chunk
    }));
    onProgress?.(Math.round(((index + 1) / total) * 100));
  }
}

export async function finalizeAd(campaignId, file) {
  return parseResponse(await fetch(`${API_BASE}/api/ads/${encodeURIComponent(campaignId)}/finalize`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ mimeType:file.type, size:file.size, originalName:file.name })
  }));
}

export async function confirmAdBooking(campaignId) {
  return parseResponse(await fetch(`${API_BASE}/api/ads/${encodeURIComponent(campaignId)}/confirm-booking`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:'{}'
  }));
}

export async function getPendingAdPayment() {
  return parseResponse(await fetch(`${API_BASE}/api/ads/pending-payment`, { cache:'no-store' }));
}

export async function getActiveAdPlaylist() {
  return parseResponse(await fetch(`${API_BASE}/api/ads/active-playlist`, { cache:'no-store' }));
}

export async function activateAdCampaign({ campaignId, requestId, code }) {
  return parseResponse(await fetch(`${API_BASE}/api/ads/${encodeURIComponent(campaignId)}/activate`, {
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ requestId, code })
  }));
}

export async function recordAdPlay(campaignId, payload) {
  try {
    await fetch(`${API_BASE}/api/ads/${encodeURIComponent(campaignId)}/play-event`, {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload), keepalive:true
    });
  } catch {}
}

export function absoluteAdMediaUrl(relativeUrl) {
  if (!relativeUrl) return '';
  if (/^https?:/i.test(relativeUrl)) return relativeUrl;
  return `${API_BASE}${relativeUrl.startsWith('/') ? '' : '/'}${relativeUrl}`;
}
