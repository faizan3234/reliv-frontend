import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { HealthProvider } from '../src/context/HealthContext';
import { SpeechProvider } from '../src/context/SpeechContext';
import { VoiceAssistantProvider } from '../src/context/VoiceAssistantContext';
import OxygenPulse from '../src/pages/OxygenPulse';
import BodyTemperature from '../src/pages/BodyTemperature';
import HealthCheckup from '../src/pages/HealthCheckup';
import { clients } from './mqtt-fixture';
import '../src/i18n';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const checks = [];
const output = document.getElementById('results');
const nativeSetTimeout = window.setTimeout.bind(window);
const nativeClearTimeout = window.clearTimeout.bind(window);
const timers = new Map();
let nextId = -1, root;
window.setTimeout = (fn, ms, ...args) => {
  if (ms >= 400) { const id = nextId--; timers.set(id, { fn: () => fn(...args), ms }); return id; }
  return nativeSetTimeout(fn, ms, ...args);
};
window.clearTimeout = id => { timers.delete(id); nativeClearTimeout(id); };
window.speechSynthesis = { cancel() {}, getVoices: () => [], addEventListener() {}, removeEventListener() {}, speak() {} };
window.WebSocket = class { static OPEN = 1; readyState = 0; send() {} close() { this.readyState = 3; } };
const requests = [];
window.fetch = async (url) => { requests.push(String(url)); return { ok: true, status: 200, json: async () => ({ ok: true, paymentReady: true }) }; };
function assert(ok, message) { if (!ok) throw new Error(message); checks.push('PASS ' + message); output.textContent = checks.join('\n'); }
async function flush() { await act(async () => new Promise(resolve => nativeSetTimeout(resolve, 10))); }
async function tick(ms) {
  const matches = [...timers].filter(([, timer]) => timer.ms === ms);
  assert(matches.length > 0, 'measurement deadline is scheduled: ' + ms);
  await act(async () => { for (const [id, timer] of matches) { timers.delete(id); timer.fn(); } });
  await flush();
}
async function mount(Page) {
  if (root) await act(async () => root.unmount());
  root = createRoot(document.getElementById('app'));
  await act(async () => root.render(<MemoryRouter><HealthProvider><SpeechProvider><VoiceAssistantProvider>{React.createElement(Page)}</VoiceAssistantProvider></SpeechProvider></HealthProvider></MemoryRouter>));
  await tick(2000);
  await flush();
  return clients.at(-1);
}
function button(pattern) { return [...document.querySelectorAll('button')].find(el => pattern.test(el.textContent)); }
async function click(pattern, twice = false) {
  const el = button(pattern);
  if (!el || el.disabled) throw new Error('Missing enabled button: ' + pattern);
  await act(async () => { el.click(); if (twice) el.click(); });
  await flush();
}
async function emit(client, topic, value) { await act(async () => client.emit('message', topic, typeof value === 'string' ? value : JSON.stringify(value))); await flush(); }
async function run() {
  localStorage.setItem('reliv_session_id', 'KSK-SENSOR-TEST');
  localStorage.setItem('reliv_pairing_token', 'synthetic-pairing-token');
  let client = await mount(OxygenPulse);
  await emit(client, 'kiosk/sensor/oxygen', { oxygen: 98, bpm: 72 });
  assert(!document.getElementById('app').textContent.includes('Measurement Complete!'), 'retained oxygen packet cannot complete an unstarted measurement');
  await click(/Measure Oxygen/, true);
  assert(client.published.filter(([, command]) => command === 'oxygen').length === 1, 'double tap sends one oxygen command');
  await emit(client, 'kiosk/sensor/oxygen', { oxygen: 98 });
  await emit(client, 'kiosk/status', 'Complete');
  await tick(60000);
  assert(document.getElementById('app').textContent.includes('No valid sensor reading'), 'missing pulse and status-only completion remain retryable without invented results');
  await click(/Try Again/);
  await emit(client, 'kiosk/status', 'Error');
  await click(/Try Again/);
  await emit(client, 'kiosk/sensor/oxygen', { oxygen: 97, bpm: 73 });
  assert(document.getElementById('app').textContent.includes('Measurement Complete!'), 'oxygen accepts actual sensor data after timeout and error retries');
  const oxygenClient = client;
  client = await mount(BodyTemperature);
  assert(oxygenClient.closed, 'navigation closes the oxygen MQTT client');
  await click(/Measure Temperature/, true);
  assert(client.published.filter(([, command]) => command === 'temperature').length === 1, 'double tap sends one temperature command');
  await emit(client, 'kiosk/sensor/temperature', { temperature_f: 'invalid' });
  await tick(30000);
  assert(document.getElementById('app').textContent.includes('No valid temperature'), 'missing temperature times out without a synthetic reading');
  await click(/Try Again/);
  await emit(client, 'kiosk/sensor/temperature', { temperature_f: 98.4 });
  assert(document.getElementById('app').textContent.includes('Measurement Complete!'), 'temperature accepts a real reading after retry');
  await emit(client, 'kiosk/sensor/temperature', { temperature_f: 99.1 });
  assert(requests.filter(url => url.endsWith('/measurements-complete')).length === 1, 'duplicate sensor packets submit completed measurements only once');
  const temperatureClient = client;
  client = await mount(HealthCheckup);
  assert(temperatureClient.closed, 'navigation closes the temperature MQTT client');
  await click(/Measure Blood Pressure/, true);
  assert(client.published.filter(([, command]) => command === 'bp').length === 1, 'double tap sends one blood-pressure command');
  await emit(client, 'kiosk/status', 'Error');
  await click(/Try Again|Retry/);
  assert(client.published.filter(([, command]) => command === 'bp').length === 2, 'blood-pressure errors release the retry guard');
  await act(async () => root.unmount());
  assert(client.closed, 'unmount closes the blood-pressure MQTT client');
  output.textContent = checks.join('\n') + '\nALL ' + checks.length + ' BROWSER CHECKS PASSED';
}
run().catch(error => { output.textContent += '\nFAIL ' + error.stack; });
