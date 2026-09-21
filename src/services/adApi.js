import { API_BASE } from '../config/api.js';
import { requestJSON } from '../utils/request.js';

async function adRequest(path, options = {}) {
  const data = await requestJSON(`${API_BASE.replace(/\/$/, '')}/api/ads${path}`, { cache: 'no-store', ...options });
  if (data.ok !== true) throw new Error(data.message || 'The kiosk could not confirm this advertising request.');
  return data;
}

const post = (path, data, options = {}) => adRequest(path, {
  ...options, method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
});
const campaignPath = id => `/${encodeURIComponent(id)}`;

export const getAdConfig = options => adRequest('/config', options);
export const getAdQuote = (data, options) => post('/quote', data, options);
export const createAdDraft = (data, options) => post('/drafts', data, options);
export const confirmAdBooking = (id, options) => post(`${campaignPath(id)}/confirm-booking`, {}, options);
export const getPendingAdPayment = options => adRequest('/pending-payment', options);
export const getActiveAdPlaylist = options => adRequest('/active-playlist', options);
export const activateAdCampaign = ({ code }, options) => post('/activate', { code }, options);

export async function uploadAdFile({ campaignId, file, onProgress, signal }) {
  if (!campaignId || !file?.size) throw new Error('Choose a non-empty image or video.');
  const chunkSize = 4 * 1024 * 1024;
  const total = Math.ceil(file.size / chunkSize);
  for (let index = 0; index < total; index++) {
    const params = new URLSearchParams({ index, total, mime: file.type, size: file.size });
    await adRequest(`${campaignPath(campaignId)}/chunks?${params}`, {
      method: 'POST', headers: { 'Content-Type': 'application/octet-stream' },
      body: file.slice(index * chunkSize, (index + 1) * chunkSize), signal, timeoutMs: 60000,
    });
    onProgress?.(Math.round((index + 1) / total * 100));
  }
}

export const finalizeAd = (id, file, options) => post(`${campaignPath(id)}/finalize`, {
  mimeType: file.type, size: file.size, originalName: file.name,
}, { timeoutMs: 150000, ...options });

export async function recordAdPlay(id, payload) {
  try { await post(`${campaignPath(id)}/play-event`, payload, { timeoutMs: 5000 }); }
  catch { /* Logging must never block returning to health care. */ }
}

export function absoluteAdMediaUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value, `${API_BASE.replace(/\/$/, '')}/`);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}
