import React, { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { HealthProvider, useHealth, MOCK_TEST_REPORT } from '../src/context/HealthContext';
import { SpeechProvider, useSpeech } from '../src/context/SpeechContext';
import { VoiceAssistantProvider, useVoiceAssistant } from '../src/context/VoiceAssistantContext';
import { useVoicePage } from '../src/hooks/useVoicePage';
import { HELP_HINTS } from '../src/voice/helpIntent';
import { guidanceText } from '../src/voice/guidanceCopy';
import { dict as paymentCopy } from '../src/config/PaymentDict';
import CustomerDetails from '../src/pages/CustomerDetails';
import TwoOptions from '../src/pages/TwoOptions';
import Report1 from '../src/pages/Report1';
import Report5 from '../src/pages/Report5';
import MedicineDispensing from '../src/pages/MedicineDispensing';
import SpeechControl from '../src/components/SpeechControl';
import PaymentGate from '../src/pages/PaymentGate';
import App from '../src/App';
import { emailHealthReport, emailPaymentReceipt, PAYMENT_API_BASE } from '../customer-web/src/services/bridgeApi';
import '../src/i18n';

// Test-only browser dependencies; production providers and pages stay unmodified.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const events = [];
const requests = [];
const transcripts = [];
const idleEvents = [];
let autoEnd = true;
let rejectPlayback = false;
let rejectCustomer = false;
let failRecording = false;
let pendingCustomer = null;
let pendingService = null;
let rejectService = false;
let apiOverride = null;
let lastUtterance;
let controls;
let root;
const results = [];
const output = document.querySelector('#results');
function assert(value, message) {
  if (!value) throw new Error(message);
  results.push('PASS ' + message);
  output.textContent = results.join('\n');
}
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function flush(ms = 20) { await act(async () => { await delay(ms); }); }
window.addEventListener('reliv_speaking', (event) => events.push(['gate', event.detail]));
window.addEventListener('reliv_spoken_text', (event) => events.push(['spoken', event.detail]));
function verifyGate(kind) {
  const gate = events.filter(([type]) => type === 'gate').at(-1);
  if (!gate?.[1]) throw new Error(kind + ' started before speaker gate');
  const wire = FakeWebSocket.instances.at(-1)?.sent.filter((msg) => msg.type === 'SET_RELIV_SPEAKING').at(-1);
  if (!wire?.active) throw new Error(kind + ' started before backend gate signal');
  events.push([kind, true]);
}
class FakeAudio {
  constructor(url) { this.url = url; }
  play() {
    verifyGate('audio');
    if (failRecording) {
      queueMicrotask(() => this.onerror?.());
      return Promise.reject(new DOMException('Missing recording', 'NotSupportedError'));
    }
    if (rejectPlayback) return Promise.reject(new DOMException('Interaction required', 'NotAllowedError'));
    if (autoEnd) queueMicrotask(() => this.onended?.());
    return Promise.resolve();
  }
  pause() {}
}
window.Audio = FakeAudio;
window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
  getVoices: () => [{ lang: 'en-IN', localService: true }],
  addEventListener() {}, removeEventListener() {},
  speak(utterance) {
    verifyGate('synthesis');
    lastUtterance = utterance;
    if (autoEnd) queueMicrotask(() => utterance.onend?.());
  },
  cancel() { lastUtterance?.onerror?.({ error: 'canceled' }); },
} });
class FakeWebSocket {
  static acknowledge = true;
  static OPEN = 1;
  static CONNECTING = 0;
  static instances = [];
  readyState = 0;
  sent = [];
  constructor() {
    this.created = performance.now();
    FakeWebSocket.instances.push(this);
    setTimeout(() => {
      if (this.readyState !== 0) return;
      this.readyState = 1;
      this.onopen?.();
      this.receive({ type: 'connected', device_name: 'Test microphone' });
    }, 0);
  }
  send(raw) {
    const message = JSON.parse(raw);
    this.sent.push(message);
    if (message.type === 'CLIENT_HELLO' && FakeWebSocket.acknowledge) queueMicrotask(() => this.receive({ type: 'CONTROLLER_ACTIVE' }));
    if (message.type === 'PING') queueMicrotask(() => this.receive({ type: 'pong' }));
  }
  receive(message) { this.onmessage?.({ data: JSON.stringify(message) }); }
  close() {
    this.readyState = 3;
    this.onclose?.();
  }
}
window.WebSocket = FakeWebSocket;
window.fetch = async (url, options = {}) => {
  if (apiOverride) { const response = await apiOverride(String(url), options); if (response) return response; }
  if (String(url).endsWith('/assets/audio/manifest.json')) return { ok: true, json: async () => ({ 'Recorded welcome': 'welcome.mp3' }) };
  if (String(url).endsWith('/api/speech-config')) return { ok: true, json: async () => ({}) };
  if (String(url).endsWith('/report/data')) return { ok: true, json: async () => ({ ok: true, paymentVerified: true, reportStatus: 'READY', sessionId: 'KSK-BROWSER', customerData: MOCK_TEST_REPORT.patient, healthData: MOCK_TEST_REPORT }) };
  const body = options.body ? JSON.parse(options.body) : {};
  requests.push({ url: String(url), body });
  if (String(url).endsWith('/api/create-qr-session')) return { ok: true, status: 200, json: async () => ({ sessionId: 'KSK-BROWSER', pairingToken: 'browser-token' }) };
  if (pendingCustomer && String(url).endsWith('/customer')) await pendingCustomer;
  if (pendingService && String(url).endsWith('/service')) await pendingService;
  if (rejectCustomer && String(url).endsWith('/customer')) return { ok: false, status: 500, json: async () => ({ error: 'Test save failed' }) };
  if (rejectService && String(url).endsWith('/service')) return { ok: false, status: 409, json: async () => ({ error: 'Session cannot change service' }) };
  if (String(url).endsWith('/api/kits')) return { ok: true, status: 200, json: async () => ({ kits: [] }) };
  return { ok: true, status: 200, json: async () => ({ success: true, ok: true, reportId: 'RPT-TEST', data: [], history: [] }) };
};
// eslint-disable-next-line react-refresh/only-export-components
function Probe() {
  controls = { speech: useSpeech(), voice: useVoiceAssistant(), health: useHealth(), navigate: useNavigate(), path: useLocation().pathname };
  return null;
}
// eslint-disable-next-line react-refresh/only-export-components
function VoicePage() {
  useVoicePage({ onHelp: (text) => transcripts.push(text), onTranscript: () => { throw new Error('Legacy voice action invoked'); }, onIdle: () => idleEvents.push(Date.now()) });
  return <p>Voice test page</p>;
}
async function mount(path, strict = false) {
  if (root) await act(async () => root.unmount());
  localStorage.clear(); sessionStorage.clear();
  root = createRoot(document.querySelector('#app'));
  const app = <HealthProvider><MemoryRouter initialEntries={[path]}><SpeechProvider><VoiceAssistantProvider>
    <Probe /><SpeechControl /><Routes>
      <Route path="/customer-details" element={<CustomerDetails />} />
      <Route path="/two-options" element={<TwoOptions />} />
      <Route path="/body-composition" element={<h2>Health destination</h2>} />
      <Route path="/medicine-dispensing" element={<h2>Medicine destination</h2>} />
      <Route path="/report-1" element={<Report1 />} />
      <Route path="/report-5" element={<Report5 />} />
      <Route path="/payment" element={<PaymentGate />} />
      <Route path="/medicine-audit" element={<MedicineDispensing />} />
      <Route path="*" element={<VoicePage />} />
    </Routes>
  </VoiceAssistantProvider></SpeechProvider></MemoryRouter></HealthProvider>;
  await act(async () => root.render(strict ? <StrictMode>{app}</StrictMode> : app));
  await flush();
}
async function say(text) {
  await flush(320); // Wait for the acoustic tail after the previous prompt.
  await act(async () => FakeWebSocket.instances.at(-1).receive({ type: 'transcript', text, is_final: true }));
  await flush();
}
const responseJSON = (data, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => data });
const button = label => [...document.querySelectorAll('#app button')].find(el => el.textContent.trim() === label);
async function click(label) {
  const el = button(label); if (!el) throw new Error('Missing button: ' + label);
  await act(async () => el.click()); await flush();
}
async function keyPress(key) {
  const element = [...document.querySelectorAll('[data-skbtn]')].find(el => el.getAttribute('data-skbtn') === key);
  if (!element) throw new Error('Missing keyboard key: ' + key);
  await act(async () => {
    if (typeof element.onpointerdown === 'function') {
      element.dispatchEvent(new Event('pointerdown', { bubbles: true }));
      element.dispatchEvent(new Event('pointerup', { bubbles: true }));
    } else if (typeof element.ontouchstart === 'function') {
      element.dispatchEvent(new Event('touchstart', { bubbles: true }));
      element.dispatchEvent(new Event('touchend', { bubbles: true }));
    } else element.click();
  });
}
async function fillCustomer() {
  await act(async () => document.querySelector('input[name="name"]').click());
  for (const key of 'namita shah') await keyPress(key === ' ' ? '{space}' : key);
  await keyPress('{close}');
  await flush(480);
  assert(events.filter(([kind]) => kind === 'spoken').at(-1)?.[1] === guidanceText('detailsGender'), 'closing the name keyboard guides the user to gender: ' + JSON.stringify({ name: document.querySelector('input[name="name"]').value, spoken: events.filter(([kind]) => kind === 'spoken').at(-1), keyboard: !!document.querySelector('[data-skbtn]') }));
  await click('👩Female');
  // Age is deliberately changed from its default via the actual numeric keyboard.
  const age = [...document.querySelectorAll('span')].find(el => el.textContent === '22');
  await act(async () => age.click());
  for (const key of ['{bksp}', '{bksp}', '4', '0', '{close}']) await keyPress(key);
  await flush();
}
async function selectService(label) {
  const heading = [...document.querySelectorAll('h3')].find(el => el.textContent.trim() === label);
  if (!heading) throw new Error('Missing service: ' + label);
  await act(async () => heading.click()); await flush();
}
async function checkGuidanceTiming() {
  const realNow = Date.now;
  let offset = 0;
  Date.now = () => realNow() + offset;
  try {
    await mount('/choose-language');
    const beforeIdle = idleEvents.length;
    offset += 3500; await flush(50);
    await act(async () => window.dispatchEvent(new Event('touchstart')));
    offset += 3500; await flush(300);
    assert(idleEvents.length === beforeIdle, 'touch resets the four-second idle reminder');
    offset += 600; await flush(300);
    assert(idleEvents.length === beforeIdle + 1, 'idle guidance runs after four seconds without touch');
    await act(async () => controls.speech.toggleMute());
    offset += 4000; await flush(300);
    assert(idleEvents.length === beforeIdle + 1, 'muted speaker does not trigger idle prompts');
    await act(async () => controls.speech.toggleMute());
    apiOverride = async url => url.endsWith('/payment-v2/status')
      ? responseJSON({ ok: true, status: 'ACTIVE', requestId: 'REQ-TIMER', amount: 2700, expiresAt: Date.now() + 300000, paymentUrl: 'https://example.invalid/pay' }) : null;
    await act(async () => { controls.health.update({ sessionId: 'KSK-BROWSER' }); controls.navigate('/payment'); });
    await flush(850);
    const questionCount = () => events.filter(([kind, text]) => kind === 'spoken' && text === paymentCopy.payment_question.en).length;
    const beforeQuestion = questionCount();
    offset += 5500; await flush(300);
    assert(questionCount() === beforeQuestion, 'payment does not ask after only four seconds');
    offset += 1700; await flush(300);
    assert(questionCount() === beforeQuestion + 1, 'payment asks after seven quiet seconds');
    await say('hnn');
    assert(document.querySelector('#app').textContent.includes('Payment Confirmation'), 'Hindi hnn opens code entry after the question');
    assert(!controls.health.data.paymentVerified, 'answering the reminder never verifies a payment');
    const before = events.filter(([kind]) => kind === 'spoken').length;
    await say('yes');
    assert(events.filter(([kind]) => kind === 'spoken').length === before, 'code entry ignores yes/no when no payment question is active');
    const oldRequestCount = requests.length;
    await act(async () => { FakeWebSocket.instances.at(-1).receive({ type: 'transcript', text: 'yes', page: '/customer-details', expecting: 'help' }); });
    assert(requests.length === oldRequestCount, 'stale transcript from another page cannot trigger a payment action');
  } finally {
    Date.now = realNow;
    apiOverride = null;
    await mount('/choose-language');
  }
}
async function checkPaymentRecovery() {
  await mount('/choose-language');
  let statusCalls = 0, createCalls = 0, confirmCalls = 0;
  let statusMode = 'active', confirmMode = 'failure', resolveConfirm;
  apiOverride = async url => {
    if (url.endsWith('/payment-v2/status')) {
      statusCalls++;
      if (statusMode === 'failure') return responseJSON({ ok: false, message: 'Status unavailable' }, 503);
      if (statusMode === 'verified') return responseJSON({ ok: true, paymentVerified: true, status: 'VERIFIED' });
      return responseJSON({ ok: true, status: 'ACTIVE', requestId: 'REQ-TEST', amount: 2700, expiresAt: Date.now() + 300000, paymentUrl: 'https://example.invalid/pay' });
    }
    if (url.endsWith('/payment-v2/request')) { createCalls++; return responseJSON({ ok: false }, 500); }
    if (url.endsWith('/confirm-code')) {
      confirmCalls++;
      if (confirmMode === 'pending') return new Promise(resolve => { resolveConfirm = resolve; });
      return responseJSON({ ok: false, message: 'Database unavailable' }, 503);
    }
  };
  await act(async () => { controls.health.update({ sessionId: 'KSK-BROWSER' }); controls.navigate('/payment'); });
  await flush(80);
  assert(statusCalls === 1 && createCalls === 0, 'payment render restores one request without empty-cart reinitialization');
  assert(document.querySelector('#app').textContent.includes('2. Enter 4-Digit Code'), 'payment code entry tab is present above the main content');
  await say('payment not done');
  assert(!document.querySelector('#app').textContent.includes('Payment Confirmation'), 'negative payment answer keeps QR instructions');
  const beforeHelp = events.filter(([type]) => type === 'spoken').length;
  for (const phrase of ['ab kya karu', 'ki korbo', 'ki korte bobe', 'whattt to do', 'what now']) await say(phrase);
  assert(events.filter(([type]) => type === 'spoken').length >= beforeHelp + 5, 'Hindi, Bengali and English help variations speak payment guidance');
  await say('yes');
  assert(document.querySelector('#app').textContent.includes('Payment Confirmation'), 'spoken yes opens keypad');
  assert(controls.health.data.paymentVerified !== true, 'voice cannot bypass backend payment verification');
  for (const digit of ['0', '0', '4', '2']) await click(digit);
  await click('Verify Payment');
  assert(document.querySelector('#app').textContent.includes('Database unavailable'), 'server failure is visible and retryable');
  assert(!document.querySelector('#app').textContent.includes('Incorrect confirmation code'), 'server failure is not misreported as a wrong code');
  await click('Retry');
  assert(createCalls === 0 && statusCalls === 2, 'retry checks the existing payment rather than creating another charge');
  confirmMode = 'pending';
  await act(async () => { button('Verify Payment').click(); button('Verify Payment').click(); }); await flush();
  assert(confirmCalls === 2, 'duplicate taps send only one verification request');
  await act(async () => controls.navigate('/choose-language'));
  await act(async () => resolveConfirm(responseJSON({ ok: true, status: 'VERIFIED', completionStatus: 'report_ready' })));
  await flush(1850);
  assert(controls.path === '/choose-language', 'late payment response cannot navigate after leaving');
  statusMode = 'failure'; await act(async () => controls.navigate('/payment')); await flush();
  assert(document.querySelector('#app').textContent.includes('Status unavailable') && createCalls === 0, 'status outage does not start a new payment');
  statusMode = 'verified'; await click('Retry'); await flush(1300);
  assert(controls.path === '/report-1', 'verified retry prepares the paid report before navigating');
  apiOverride = null;
}
// Real production routes with synthetic network and hardware responses.
// eslint-disable-next-line react-refresh/only-export-components
function ScreenProbe() {
  controls = { health: useHealth(), navigate: useNavigate(), path: useLocation().pathname }; return null;
}
async function checkAllRoutes() {
  await act(async () => root.unmount()); localStorage.clear(); sessionStorage.clear();
  root = createRoot(document.querySelector('#app'));
  await act(async () => root.render(<HealthProvider><MemoryRouter initialEntries={['/team']}><SpeechProvider><ScreenProbe /><App /></SpeechProvider></MemoryRouter></HealthProvider>));
  await flush(); localStorage.setItem('reliv_session_id', 'KSK-BROWSER'); localStorage.setItem('reliv_pairing_token', 'browser-token');
  await act(async () => controls.health.update({ ...MOCK_TEST_REPORT, sessionId: 'KSK-BROWSER' }));
  for (const path of ['/choose-language', '/customer-details', '/two-options', '/health-checkup', '/medicine-dispensing', '/payment', '/oxygen-pulse', '/eyesight', '/body-temperature', '/body-composition', '/report-1', '/report-2', '/report-3', '/report-4', '/report-5', '/wellness-recommendations', '/checkout', '/order-success', '/feedback', '/team', '/mobile-entry', '/photo-upload', '/h', '/admin', '/admin-x7k9/speech', '/']) {
    await act(async () => controls.navigate(path)); await flush(['/health-checkup', '/oxygen-pulse', '/body-temperature'].includes(path) ? 2200 : 50);
    assert(document.querySelector('.app-screen')?.textContent.trim().length > 10, 'production route renders with synthetic dependencies: ' + path);
  }
}
async function checkPhoneDelivery() {
  const calls = [];
  apiOverride = async (url, options) => { calls.push({ url, data: JSON.parse(options.body) }); return responseJSON({ ok: true, sent: true, downloadToken: 'synthetic-token' }); };
  await emailHealthReport({ requestId: 'REQ-TEST', email: 'test@example.invalid' });
  await emailPaymentReceipt({ requestId: 'REQ-TEST', email: 'test@example.invalid' });
  assert(calls.every(call => call.url.startsWith(PAYMENT_API_BASE + '/api/v2/')), 'phone emails use the HTTPS cloud API instead of the Pi LAN');
  assert(calls.every(call => call.data.requestId === 'REQ-TEST' && call.data.email === 'test@example.invalid'), 'phone email uses the confirmed request and supplied email');
  apiOverride = null;
}
async function run() {
  await mount('/choose-language', true);
  assert(FakeWebSocket.instances.filter((socket) => socket.readyState === 1).length === 1, 'StrictMode leaves exactly one active connection');
  autoEnd = false;
  await act(async () => { void controls.speech.speakText('Dynamic test prompt'); });
  assert(events.some(([kind]) => kind === 'synthesis'), 'missing recording uses gated synthesis');
  await say('female');
  assert(transcripts.length === 0, 'transcripts during playback are ignored');
  const obsoleteEnd = lastUtterance.onend;
  await act(async () => { void controls.speech.speakText('Newer test prompt'); });
  await act(async () => obsoleteEnd());
  assert(controls.speech.speakingRef.current, 'late completion cannot release newer playback gate');
  await act(async () => controls.speech.stop());
  assert(!controls.speech.speakingRef.current, 'cancellation releases speaker gate');
  autoEnd = true;
  await act(async () => { await controls.speech.speakText('Recorded welcome'); });
  assert(events.some(([kind]) => kind === 'audio'), 'recorded audio is gated before play');
  rejectPlayback = true;
  await act(async () => { void controls.speech.speakText('Recorded welcome'); });
  assert(!controls.speech.speakingRef.current, 'autoplay rejection releases speaker gate');
  rejectPlayback = false;
  await act(async () => window.dispatchEvent(new Event('pointerdown')));
  await flush();
  assert(!controls.speech.speakingRef.current, 'blocked recording retries on interaction and completes');
  autoEnd = false;
  failRecording = true;
  const beforeFallback = events.filter(([kind]) => kind === 'synthesis').length;
  await act(async () => { void controls.speech.speakText('Recorded welcome'); });
  assert(events.filter(([kind]) => kind === 'synthesis').length === beforeFallback + 1, 'simultaneous recording error and play rejection start synthesis only once');
  assert(controls.speech.speakingRef.current, 'duplicate recording errors cannot release synthesis gate');
  failRecording = false;
  await act(async () => controls.speech.stop());
  autoEnd = true;
  await act(async () => { await controls.speech.speakText('Proceeding to medicine dispensing'); });
  await say('Proceeding to medicine dispensing');
  assert(transcripts.length === 0, 'recent multiword self-echo is dropped after playback');
  await say('female');
  assert(transcripts.length === 0, 'gender is ignored outside payment even after playback');
  await say('help me');
  assert(transcripts.at(-1) === 'help me', 'help is accepted after the speaker tail');
  const connectionCount = FakeWebSocket.instances.length;
  for (const path of ['/checkout', '/choose-language', '/checkout']) {
    await act(async () => controls.navigate(path));
  }
  assert(FakeWebSocket.instances.length === connectionCount, 'route changes keep one persistent socket');
  await act(async () => controls.voice.pauseListening());
  const disconnectedAt = performance.now();
  await act(async () => FakeWebSocket.instances.at(-1).close());
  await flush(160);
  await flush();
  const recovered = FakeWebSocket.instances.at(-1);
  assert(recovered.created - disconnectedAt < 300, 'forced disconnect reconnects in under 300 ms');
  const context = recovered.sent.filter((msg) => msg.type === 'SET_CONTEXT').at(-1);
  assert(context.page === '/checkout' && context.expecting === 'help' && context.vocabulary_hints[0] === HELP_HINTS[0], 'reconnect restores help-only vocabulary context');
  assert(recovered.sent.some((msg) => msg.type === 'PAUSE_LISTENING'), 'reconnect preserves intentional pause');
  await act(async () => controls.voice.resumeListening());
  const invalidSocket = FakeWebSocket.instances.at(-1);
  await act(async () => {
    invalidSocket.receive(null);
    invalidSocket.receive({ type: 'transcript', text: 40 });
  });
  assert(controls.voice.isConnected, 'malformed transcript payloads do not crash the voice controller');
  autoEnd = false;
  await act(async () => { void controls.speech.speakText('Departing page speech'); });
  await act(async () => controls.navigate('/wellness-recommendations'));
  assert(!controls.speech.speakingRef.current, 'navigation cancels the previous page voice');
  autoEnd = true;
  FakeWebSocket.acknowledge = false;
  await act(async () => FakeWebSocket.instances.at(-1).close());
  await flush(150);
  assert(!controls.voice.isConnected, 'socket is not reported connected before controller acknowledgement');
  const stalled = FakeWebSocket.instances.at(-1);
  FakeWebSocket.acknowledge = true;
  await flush(5300);
  await flush();
  assert(stalled.readyState === 3 && controls.voice.isConnected, 'missing controller acknowledgement times out and reconnects');
  await act(async () => FakeWebSocket.instances.at(-1).receive({ type: 'processing', active: true }));
  const beforeProcessing = idleEvents.length;
  await flush(4100);
  assert(controls.voice.isProcessing && idleEvents.length === beforeProcessing, 'idle reminders cannot interrupt a slow Whisper answer');
  await act(async () => FakeWebSocket.instances.at(-1).receive({ type: 'processing', active: false }));
  assert(!controls.voice.isProcessing, 'recognition completion clears processing state');
  for (const [service, destination] of [['Health Checkup', '/body-composition'], ['Medicine Dispensing', '/medicine-dispensing']]) {
    requests.length = 0;
    await mount('/customer-details');
    for (const word of ['my name is Namita Shah', 'haan', 'forty', 'female', 'next']) await say(word);
    assert(document.querySelector('input[name="name"]').value === '', 'voice cannot fill name or auto-submit details');
    await fillCustomer();
    await click('Proceed →');
    assert(controls.path === '/two-options', 'touch-entered details proceed to service selection');
    const saved = requests.find(request => request.url.endsWith('/customer'));
    assert(saved.body.customerData.name === 'namita shah', 'touch keyboard preserves the entered name');
    assert(saved.body.customerData.age === 40 && saved.body.customerData.gender === 'female', 'touch submission includes age and gender');
    assert(saved.body.pairingToken === 'browser-token', 'customer request includes authoritative pairing token');
    assert(requests.filter(request => request.url.endsWith('create-qr-session')).length === 1, 'customer flow creates one session');
    for (const word of ['health checkup', 'medicine dispensing', 'yes', 'switch']) await say(word);
    assert(controls.path === '/two-options', 'speech cannot select, switch, or confirm a service');
    await selectService(service);
    assert(controls.path === destination, 'touch service reaches ' + destination);
    assert(requests.findIndex(request => request.url.endsWith('/customer')) < requests.findIndex(request => request.url.endsWith('/service')), 'customer is saved before selecting service');
  }
  rejectCustomer = true;
  await mount('/customer-details');
  await fillCustomer(); await click('Proceed →');
  assert(controls.path === '/customer-details', 'failed customer save does not navigate');
  assert(document.querySelector('[role="alert"]')?.textContent === 'Test save failed', 'save failure is visible and retryable');
  rejectCustomer = false;
  await click('Proceed →');
  assert(controls.path === '/two-options', 'customer save can be retried by touch');
  rejectService = true; await selectService('Medicine Dispensing');
  assert(controls.path === '/two-options', '409 service rejection cannot navigate to an unselected service');
  rejectService = false;
  let releaseService;
  pendingService = new Promise(resolve => { releaseService = resolve; });
  await selectService('Health Checkup');
  await act(async () => controls.navigate('/choose-language'));
  await act(async () => releaseService());
  await flush();
  assert(controls.path === '/choose-language', 'late service response cannot navigate away from the current screen');
  pendingService = null;
  let releaseCustomer;
  pendingCustomer = new Promise(resolve => { releaseCustomer = resolve; });
  await mount('/customer-details');
  await fillCustomer(); await click('Proceed →');
  await act(async () => { controls.navigate('/choose-language'); controls.health.resetHealth(); });
  await act(async () => releaseCustomer());
  await flush();
  assert(controls.path === '/choose-language' && !controls.health.data.patient.name, 'late customer response cannot restore a patient after leaving and resetting');
  pendingCustomer = null;
  await act(async () => controls.navigate('/admin-audit'));
  assert(!document.querySelector('[aria-label="Mute speaker"]'), 'speech control hides on admin navigation without a hook-order crash');
  await act(async () => {
    controls.health.loadMockReportData();
    controls.navigate('/report-1');
  });
  await flush();
  assert(document.querySelector('#app').textContent.includes('Champion') || document.querySelector('#app').textContent.includes('Rahul'), 'paid Report 1 renders after authoritative data loads');
  await act(async () => controls.navigate('/report-5'));
  await flush();
  assert(document.querySelector('#app').textContent.includes('Rahul'), 'Report 5 renders the patient summary without missing-hook crashes');
  await act(async () => controls.navigate('/medicine-audit'));
  await flush();
  await act(async () => {
    localStorage.setItem('reliv_medicine_dispensing_enabled', 'false');
    controls.navigate('/choose-language');
  });
  await act(async () => controls.navigate('/medicine-audit'));
  await flush();
  assert(document.querySelector('#app').textContent.includes('Medicine Dispensing Disabled'), 'disabling medicine while mounted keeps hook order valid');
  await act(async () => {
    localStorage.removeItem('reliv_medicine_dispensing_enabled');
    controls.navigate('/choose-language');
  });
  await act(async () => controls.navigate('/medicine-audit'));
  await flush();
  assert(!document.querySelector('#app').textContent.includes('Medicine Dispensing Disabled'), 'medicine screen can be enabled again without crashing');
  await checkPaymentRecovery();
  await checkGuidanceTiming();
  await checkPhoneDelivery();
  await checkAllRoutes();
  await act(async () => root.unmount());
  await flush(200);
  assert(FakeWebSocket.instances.filter((socket) => socket.readyState === 1).length === 0, 'unmount closes socket without reconnecting');
  output.textContent = results.join('\n') + '\n\nALL ' + results.length + ' BROWSER CHECKS PASSED';
}
run().catch(async (error) => {
  output.textContent = results.join('\n') + '\nFAIL ' + error.stack;
  console.error(error);
  if (root) await act(async () => root.unmount());
});
