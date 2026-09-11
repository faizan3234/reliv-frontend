import React, { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { HealthProvider, useHealth, MOCK_TEST_REPORT } from '../src/context/HealthContext';
import { SpeechProvider, useSpeech } from '../src/context/SpeechContext';
import { VoiceAssistantProvider, useVoiceAssistant } from '../src/context/VoiceAssistantContext';
import { useVoicePage } from '../src/hooks/useVoicePage';
import CustomerDetails from '../src/pages/CustomerDetails';
import TwoOptions from '../src/pages/TwoOptions';
import Report1 from '../src/pages/Report1';
import Report5 from '../src/pages/Report5';
import MedicineDispensing from '../src/pages/MedicineDispensing';
import SpeechControl from '../src/components/SpeechControl';
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
  if (String(url).endsWith('/assets/audio/manifest.json')) return { ok: true, json: async () => ({ 'Recorded welcome': 'welcome.mp3' }) };
  if (String(url).endsWith('/api/speech-config')) return { ok: true, json: async () => ({}) };
  if (String(url).endsWith('/report/data')) return { ok: true, json: async () => ({ ok: true, paymentVerified: true, reportStatus: 'READY', sessionId: 'KSK-BROWSER', customerData: MOCK_TEST_REPORT.patient, healthData: MOCK_TEST_REPORT }) };
  const body = options.body ? JSON.parse(options.body) : {};
  requests.push({ url: String(url), body });
  if (String(url).endsWith('/api/create-qr-session')) return { ok: true, status: 200, json: async () => ({ sessionId: 'KSK-BROWSER', pairingToken: 'browser-token' }) };
  if (pendingCustomer && String(url).endsWith('/customer')) await pendingCustomer;
  if (pendingService && String(url).endsWith('/service')) await pendingService;
  if (rejectCustomer && String(url).endsWith('/customer')) return { ok: false, status: 500, json: async () => ({ error: 'Test save failed' }) };
  return { ok: true, status: 200, json: async () => ({ success: true, ok: true }) };
};
// eslint-disable-next-line react-refresh/only-export-components
function Probe() {
  controls = { speech: useSpeech(), voice: useVoiceAssistant(), health: useHealth(), navigate: useNavigate(), path: useLocation().pathname };
  return null;
}
// eslint-disable-next-line react-refresh/only-export-components
function VoicePage() {
  useVoicePage({ expecting: 'gender', vocabularyHints: ['female'], onTranscript: (text) => transcripts.push(text), onIdle: (seconds) => idleEvents.push(seconds) });
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
      <Route path="/medicine-audit" element={<MedicineDispensing />} />
      <Route path="*" element={<VoicePage />} />
    </Routes>
  </VoiceAssistantProvider></SpeechProvider></MemoryRouter></HealthProvider>;
  await act(async () => root.render(strict ? <StrictMode>{app}</StrictMode> : app));
  await flush();
}
async function say(text) {
  await act(async () => FakeWebSocket.instances.at(-1).receive({ type: 'transcript', text, is_final: true }));
  await flush();
}
async function run() {
  await mount('/voice-test', true);
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
  assert(transcripts.at(-1) === 'female', 'short user answer is not mistaken for echo');
  const connectionCount = FakeWebSocket.instances.length;
  for (const path of ['/voice-next', '/voice-test', '/voice-next']) {
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
  assert(context.page === '/voice-next' && context.expecting === 'gender' && context.vocabulary_hints[0] === 'female', 'reconnect restores full question and vocabulary context');
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
  await act(async () => controls.navigate('/voice-departed'));
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
  for (const [service, destination] of [['checkup korbo', '/body-composition'], ['oshudh nebo', '/medicine-dispensing']]) {
    requests.length = 0;
    await mount('/customer-details');
    await say('my name is Namita Shah');
    await say('haan');
    await say('umar challis saal');
    await say('haan');
    await say('Femile !');
    await say('haan');
    assert(controls.path === '/two-options', 'confirmed gender proceeds to service selection');
    const saved = requests.find((request) => request.url.endsWith('/customer'));
    assert(saved.body.customerData.name === 'Namita Shah', 'name cleaning preserves Namita Shah');
    assert(saved.body.customerData.age === 40 && saved.body.customerData.gender === 'female', 'submitted values include latest confirmed age and gender');
    assert(saved.body.pairingToken === 'browser-token', 'customer request includes authoritative pairing token');
    assert(requests.filter((request) => request.url.endsWith('create-qr-session')).length === 1, 'customer flow creates one session');
    await say('health checkup or medicine dispensing');
    assert(controls.path === '/two-options', 'ambiguous service prompt does not navigate');
    await say(service);
    assert(controls.path === destination, 'spoken service reaches ' + destination);
    assert(requests.findIndex((request) => request.url.endsWith('/customer')) < requests.findIndex((request) => request.url.endsWith('/service')), 'customer is saved before selecting service');
  }
  rejectCustomer = true;
  await mount('/customer-details');
  for (const word of ['Test Person', 'yes', 'forty five', 'yes', 'girl', 'yes']) await say(word);
  assert(controls.path === '/customer-details', 'failed customer save does not navigate');
  assert(document.querySelector('[role="alert"]')?.textContent === 'Test save failed', 'save failure is visible and retryable');
  rejectCustomer = false;
  await say('proceed');
  assert(controls.path === '/two-options', 'customer save can be retried');
  let releaseService;
  pendingService = new Promise((resolve) => { releaseService = resolve; });
  await say('health checkup');
  await act(async () => controls.navigate('/voice-test'));
  await act(async () => releaseService());
  await flush();
  assert(controls.path === '/voice-test', 'late service response cannot navigate away from the current screen');
  pendingService = null;
  let releaseCustomer;
  pendingCustomer = new Promise((resolve) => { releaseCustomer = resolve; });
  await mount('/customer-details');
  for (const word of ['Test Person', 'yes', 'forty five', 'yes', 'girl', 'yes']) await say(word);
  await act(async () => { controls.navigate('/voice-test'); controls.health.resetHealth(); });
  await act(async () => releaseCustomer());
  await flush();
  assert(controls.path === '/voice-test' && !controls.health.data.patient.name, 'late customer response cannot restore a patient after leaving and resetting');
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
    controls.navigate('/voice-test');
  });
  await act(async () => controls.navigate('/medicine-audit'));
  await flush();
  assert(document.querySelector('#app').textContent.includes('Medicine Dispensing Disabled'), 'disabling medicine while mounted keeps hook order valid');
  await act(async () => {
    localStorage.removeItem('reliv_medicine_dispensing_enabled');
    controls.navigate('/voice-test');
  });
  await act(async () => controls.navigate('/medicine-audit'));
  await flush();
  assert(!document.querySelector('#app').textContent.includes('Medicine Dispensing Disabled'), 'medicine screen can be enabled again without crashing');
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
