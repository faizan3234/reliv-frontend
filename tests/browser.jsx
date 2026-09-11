import React, { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { HealthProvider, useHealth } from '../src/context/HealthContext';
import { SpeechProvider, useSpeech } from '../src/context/SpeechContext';
import { VoiceAssistantProvider, useVoiceAssistant } from '../src/context/VoiceAssistantContext';
import { useVoicePage } from '../src/hooks/useVoicePage';
import CustomerDetails from '../src/pages/CustomerDetails';
import TwoOptions from '../src/pages/TwoOptions';
import '../src/i18n';

// Test-only browser dependencies; production providers and pages stay unmodified.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const events = [];
const requests = [];
const transcripts = [];
let autoEnd = true;
let rejectPlayback = false;
let rejectCustomer = false;
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
    if (message.type === 'CLIENT_HELLO') queueMicrotask(() => this.receive({ type: 'CONTROLLER_ACTIVE' }));
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
  const body = options.body ? JSON.parse(options.body) : {};
  requests.push({ url: String(url), body });
  if (String(url).endsWith('/api/create-qr-session')) return { ok: true, status: 200, json: async () => ({ sessionId: 'KSK-BROWSER', pairingToken: 'browser-token' }) };
  if (rejectCustomer && String(url).endsWith('/customer')) return { ok: false, status: 500, json: async () => ({ error: 'Test save failed' }) };
  return { ok: true, status: 200, json: async () => ({ success: true, ok: true }) };
};
function Probe() {
  controls = { speech: useSpeech(), voice: useVoiceAssistant(), health: useHealth(), navigate: useNavigate(), path: useLocation().pathname };
  return null;
}
function VoicePage() {
  useVoicePage({ expecting: 'gender', vocabularyHints: ['female'], onTranscript: (text) => transcripts.push(text) });
  return <p>Voice test page</p>;
}
async function mount(path, strict = false) {
  if (root) await act(async () => root.unmount());
  localStorage.clear(); sessionStorage.clear();
  root = createRoot(document.querySelector('#app'));
  const app = <HealthProvider><MemoryRouter initialEntries={[path]}><SpeechProvider><VoiceAssistantProvider>
    <Probe /><Routes>
      <Route path="/customer-details" element={<CustomerDetails />} />
      <Route path="/two-options" element={<TwoOptions />} />
      <Route path="/body-composition" element={<h2>Health destination</h2>} />
      <Route path="/medicine-dispensing" element={<h2>Medicine destination</h2>} />
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
