import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { HealthProvider } from '../src/context/HealthContext';
import { SpeechProvider, useSpeech } from '../src/context/SpeechContext';
import { VoiceAssistantProvider } from '../src/context/VoiceAssistantContext';
import KioskAdPlayer from '../src/components/KioskAdPlayer';
import Advertise from '../src/pages/Advertise';
import PayAd from '../src/pages/PayAd';
import '../src/i18n';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const result = document.getElementById('results');
const checks = [];
const calls = [];
let root, navigate, speech, pathname;
let pending = null;
let failActivation = false;
let delayActivation = false;
let resolveActivation;
let playlist = [];
let intervalSeconds = 5;
let paid = false;
const nativeSetTimeout = window.setTimeout.bind(window);
const nativeClearTimeout = window.clearTimeout.bind(window);
const scheduled = new Map();
let timerId = -1;
window.setTimeout = (fn, ms, ...args) => {
  if (ms >= 1000) { const id = timerId--; scheduled.set(id, { fn: () => fn(...args), ms }); return id; }
  return nativeSetTimeout(fn, ms, ...args);
};
window.clearTimeout = id => { scheduled.delete(id); nativeClearTimeout(id); };
Date.now = () => 1800000000000;
window.speechSynthesis = { cancel() {}, getVoices: () => [], addEventListener() {}, removeEventListener() {}, speak() {} };
window.WebSocket = class { static OPEN = 1; readyState = 0; send() {} close() { this.readyState = 3; } };
const json = (data, status = 200) => ({ ok: status < 400, status, json: async () => data });
window.fetch = async (url, options = {}) => {
  url = String(url);
  calls.push({ url, options });
  if (url.endsWith('/api/ads/pending-payment')) return json({ ok: true, pending });
  if (url.endsWith('/api/ads/active-playlist')) return json({ ok: true, ads: playlist, splashIntervalSeconds: intervalSeconds });
  if (url.endsWith('/activate')) {
    if (delayActivation) return new Promise(resolve => { resolveActivation = resolve; });
    return failActivation ? json({ ok: false, message: 'Invalid activation code' }, 400) : json({ ok: true, status: 'ACTIVE', campaign: { venueName: 'Gurukul' } });
  }
  if (url.endsWith('/api/ads/config')) return json({ ok: true, currentVenueId: 'gurukul', venues: [{ id: 'gurukul', name: 'Gurukul', isCurrent: true }] });
  if (url.endsWith('/api/ads/quote')) return json({ ok: true, quote: { finalRupees: 117, effectivePerDayRupees: 39 } });
  if (url.endsWith('/api/ads/drafts')) return json({ ok: true, campaignId: 'AD-TEST' });
  if (url.includes('/chunks?')) return json({ ok: true });
  if (url.endsWith('/finalize')) return json({ ok: true, media: { previewUrl: '/media/ad.png', mediaType: 'image', aspectRatio: 'portrait' } });
  if (url.endsWith('/confirm-booking')) return json({ ok: true, requestId: 'AD-REQUEST', paymentUrl: 'https://reliv7.vercel.app/pay#p=synthetic', amountPaise: 11700, expiresAt: Date.now() + 900000 });
  if (url.endsWith('/api/v2/create-order')) return json({ ok: true, orderId: 'order_AD_TEST', requestId: 'AD-REQUEST', amount: 11700, keyId: 'rzp_test_synthetic', serviceType: 'AD_CAMPAIGN', ...(paid ? { status: 'PAID', confirmationCode: '0042' } : {}) });
  if (url.endsWith('/api/v2/recover-payment')) return json({ ok: true, paid: false });
  return json({ ok: true });
};
function assert(value, message) { if (!value) throw new Error(message); checks.push('PASS ' + message); result.textContent = checks.join('\n'); }
async function flush() { await act(async () => new Promise(resolve => nativeSetTimeout(resolve, 10))); }
async function tick(ms) {
  const matches = [...scheduled].filter(([, timer]) => Math.abs(timer.ms - ms) < 10);
  if (!matches.length) throw new Error('Missing timer ' + ms);
  await act(async () => {
    for (const [id, timer] of matches) { scheduled.delete(id); timer.fn(); }
  });
  await flush();
}
// eslint-disable-next-line react-refresh/only-export-components
function Probe() { navigate = useNavigate(); pathname = useLocation().pathname; speech = useSpeech(); return null; }
async function mount(element, route = '/', savedHandoff = null) {
  if (root) await act(async () => root.unmount());
  scheduled.clear(); localStorage.clear(); sessionStorage.clear();
  if (savedHandoff) sessionStorage.setItem('reliv_ad_payment_handoff', savedHandoff);
  root = createRoot(document.getElementById('app'));
  await act(async () => root.render(<HealthProvider><MemoryRouter initialEntries={[route]}><SpeechProvider><VoiceAssistantProvider><Probe />{element}</VoiceAssistantProvider></SpeechProvider></MemoryRouter></HealthProvider>));
  await flush();
}
function findButton(text) { return [...document.querySelectorAll('button')].find(el => el.textContent.trim() === text); }
async function click(text) { const el = findButton(text); if (!el) throw new Error('Missing button ' + text); await act(async () => el.click()); await flush(); }
async function run() {
  pending = { campaignId: 'AD-TEST', requestId: 'AD-REQUEST', amountPaise: 11700, durationDays: 3, paymentUrl: 'https://reliv7.vercel.app/pay#p=synthetic' };
  await mount(<KioskAdPlayer />);
  assert(!document.querySelector('.kiosk-ad-player-overlay') && !document.querySelector('svg'), 'empty playlist keeps the original splash and never shows a kiosk payment QR');
  await act(async () => window.dispatchEvent(new CustomEvent('reliv_open_ad_keypad')));
  for (const digit of ['0','0','4','2']) await click(digit);
  const activationCount = () => calls.filter(call => call.url.endsWith('/activate')).length;
  assert(activationCount() === 0, 'typing code cannot activate without verification');
  failActivation = true;
  await click('Verify activation code');
  assert(document.querySelector('#app').textContent.includes('Invalid activation code'), 'rejected backend activation stays an error');
  failActivation = false; delayActivation = true;
  for (const digit of ['0','0','4','2']) await click(digit);
  const verify = findButton('Verify activation code');
  await act(async () => { verify.click(); verify.click(); });
  await flush();
  assert(activationCount() === 2, 'rapid double tap sends one activation request');
  const sent = JSON.parse(calls.filter(call => call.url.endsWith('/activate')).at(-1).options.body);
  assert(sent.code === '0042' && !sent.requestId, 'code-only activation preserves leading zero without binding to the newest booking');
  await act(async () => navigate('/health-checkup'));
  await act(async () => resolveActivation(json({ ok: true, status: 'ACTIVE' })));
  await flush();
  assert(pathname === '/health-checkup' && !document.querySelector('.kiosk-activation-success'), 'late activation cannot reopen overlays on health pages');

  pending = null; delayActivation = false;
  playlist = [{ campaignId: 'AD-VIDEO', mediaType: 'video', mediaUrl: '/media/video.mp4', durationSeconds: 30, hasAudio: true }];
  await mount(<KioskAdPlayer />);
  await tick(5000);
  assert(document.querySelector('.is-loading') && !document.querySelector('.is-ready'), 'media preloads hidden while the actual splash remains visible');
  await act(async () => document.querySelector('video').dispatchEvent(new Event('canplay')));
  const video = document.querySelector('video');
  assert(video && document.querySelector('.kiosk-ad-player-overlay'), 'eligible ads start only after splash idle');
  video.muted = false; let paused = false; video.pause = () => { paused = true; };
  const overlay = document.querySelector('.kiosk-ad-player-overlay');
  await act(async () => overlay.dispatchEvent(new Event('pointerdown', { bubbles: true, cancelable: true })));
  assert(video.muted && paused && !document.querySelector('.kiosk-ad-player-overlay'), 'first touch synchronously mutes, pauses and exits the ad');
  const synthetic = new MouseEvent('click', { bubbles: true, cancelable: true });
  document.body.dispatchEvent(synthetic);
  assert(synthetic.defaultPrevented, 'exit touch cannot click through into health controls');
  await act(async () => navigate('/payment'));
  assert(!document.querySelector('.kiosk-ad-player-overlay') && !document.querySelector('.kiosk-payment-active-screen'), 'health payment route never shows ad overlays');

  for (const seconds of [5, 10, 15]) {
    intervalSeconds = seconds;
    playlist = [{ campaignId: 'AD-IMAGE', mediaType: 'image', mediaUrl: '/media/ad.webp', durationSeconds: 10 }];
    await mount(<KioskAdPlayer />);
    await tick(seconds * 1000);
    await act(async () => document.querySelector('img').dispatchEvent(new Event('load')));
    assert(document.querySelector('.is-ready'), seconds + ' second admin interval starts a ready ad');
    let spoken = 0;
    const onSpoken = () => { spoken++; };
    window.addEventListener('reliv_spoken_text', onSpoken);
    await act(async () => { speech.speakText('Delayed prompt'); speech.speak('leaderboard'); });
    window.removeEventListener('reliv_spoken_text', onSpoken);
    assert(spoken === 0, 'ad playback blocks delayed speech at interval ' + seconds);
    await tick(10000);
    assert(!document.querySelector('.kiosk-ad-player-overlay'), 'ad ends to the actual splash, without a substitute screen, at interval ' + seconds);
    await tick(seconds * 1000);
    await act(async () => document.querySelector('img').dispatchEvent(new Event('error')));
    assert(!document.querySelector('.kiosk-ad-player-overlay'), 'broken media returns to splash at interval ' + seconds);
  }
  intervalSeconds = 5;
  playlist = [];
  await mount(<Advertise />, '/advertise');
  await click('Continue to Creative');
  const input = document.querySelector('input[type="file"]');
  Object.defineProperty(input, 'files', { configurable: true, value: [new File(['synthetic image'], 'ad.png', { type: 'image/png' })] });
  await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })));
  await flush();
  assert(calls.some(call => call.url.includes('/chunks?')) && calls.some(call => call.url.endsWith('/finalize')), 'phone creative is uploaded and finalized on the Pi');
  await click('Preview on Reliv Screen');
  const creative = document.querySelector('.ads-creative-preview img');
  assert(creative && !document.querySelector('.preview-touch-pill') && !document.querySelector('#app').textContent.includes('Touch to start'), 'phone preview displays only the uploaded creative');
  await act(async () => creative.click());
  assert(document.querySelector('.ads-creative-preview img') && !document.querySelector('#app').textContent.includes('Touch detected'), 'touching the preview never replaces it with a fake kiosk screen');
  const confirm = findButton('Confirm & Pay ₹117');
  await act(async () => { confirm.click(); confirm.click(); }); await flush();
  assert(calls.filter(call => call.url.endsWith('/confirm-booking')).length === 1, 'booking confirmation is protected against duplicate taps');
  assert(document.querySelector('#app').textContent.includes('Your ad is saved') && !document.querySelector('svg[role="img"]'), 'phone handoff appears after backend confirmation and shows no payment QR');
  assert(document.querySelector('a[href="https://reliv7.vercel.app/pay#p=synthetic"]'), 'phone receives its own secure payment link');
  const payLink = document.querySelector('.ads-pay-link');
  assert(!payLink.target && payLink.textContent.includes('₹117'), 'payment opens in the same tab with the server-confirmed amount');
  const saved = JSON.parse(sessionStorage.getItem('reliv_ad_payment_handoff'));
  assert(saved.paymentUrl === payLink.href && saved.amountPaise === 11700 && saved.expiresAt > Date.now(), 'encrypted payment link and amount survive a reload without re-uploading');
  assert(!document.querySelector('#app').textContent.includes('Scan the payment QR'), 'phone handoff does not require scanning another device');
  assert(!localStorage.getItem('reliv_ads_campaigns_v1') && !localStorage.getItem('reliv_kiosk_pending_payment_v1'), 'campaigns and activation secrets are not stored in browser simulation');
  const apiCallsBeforeRestore = calls.length;
  await mount(<Advertise />, '/advertise', JSON.stringify(saved));
  assert(document.querySelector('.ads-pay-link')?.href === saved.paymentUrl, 'returning to the saved page restores the actual payment destination');
  assert(calls.slice(apiCallsBeforeRestore).every(call => !call.url.includes('/api/ads/')), 'saved payment handoff requires no connection to the Pi');

  window.history.replaceState({}, '', '/pay?campaign=FORGED&amt=1&code=5829');
  await mount(<PayAd />, '/pay');
  assert(!document.querySelector('#app').textContent.includes('Payment Successful') && !document.querySelector('#app').textContent.includes('5829'), 'forged campaign/code query cannot produce payment success');
  window.history.replaceState({}, '', '/pay#p=synthetic-encrypted-package');
  paid = true;
  await mount(<PayAd />, '/pay');
  await flush();
  assert(document.querySelector('#app').textContent.includes('Payment Successful'), 'signed-package flow displays success from an authoritative paid response');
  assert(document.querySelector('#app').textContent.includes('Enter this activation code'), 'verified ad payment has ad-specific activation instructions');
  assert(!findButton('Pay ₹117'), 'already-paid ad never opens another checkout');
  assert(!JSON.stringify(localStorage).includes('0042'), 'verified code is not persisted');
  await act(async () => root.unmount());
  result.textContent = checks.join('\n') + '\n\nALL ' + checks.length + ' BROWSER CHECKS PASSED';
}
run().catch(async error => { result.textContent = checks.join('\n') + '\nFAIL ' + error.stack; console.error(error); if (root) await act(async () => root.unmount()); });
