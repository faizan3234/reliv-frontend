import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { HealthProvider } from '../src/context/HealthContext';
import { SpeechProvider } from '../src/context/SpeechContext';
import { VoiceAssistantProvider } from '../src/context/VoiceAssistantContext';
import ProtectedReportRoute from '../src/components/ProtectedReportRoute';
import Report1 from '../src/pages/Report1';
import Report2 from '../src/pages/Report2';
import Report3 from '../src/pages/Report3';
import Report4 from '../src/pages/Report4';
import Report5 from '../src/pages/Report5';
import { getScanCount, reportMeasurements } from '../src/utils/reportSnapshot';
import '../src/i18n';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const output = document.getElementById('results'), checks = [];
const wait = window.setTimeout.bind(window);
// Do not start narration/idle timers while checking direct route hydration.
window.setTimeout = (fn, ms, ...args) => ms >= 400 ? -1 : wait(fn, ms, ...args);
window.speechSynthesis = { cancel() {}, getVoices: () => [], addEventListener() {}, removeEventListener() {}, speak() {} };
window.WebSocket = class { static OPEN = 1; readyState = 0; send() {} close() { this.readyState = 3; } };
const paid = {
  ok: true, paymentVerified: true, reportStatus: 'READY', sessionId: 'KSK-REPORT-TEST',
  customerData: { name: 'Current Person', age: 25, gender: 'male', email: '' },
  healthData: { vitals: { height: 172.3, weight: 65.4, systolic: 120, diastolic: 80, bpm: 72, oxygen: 98, temperature: 98.4 }, history: [], scanCount: 1, identityLinked: false },
};
let authorized = true, root;
const requests = [];
window.fetch = async url => {
  requests.push(String(url));
  const body = String(url).includes('/report/data') ? (authorized ? paid : { ok: false, message: 'Payment required' }) : { ok: true, history: [], data: [] };
  return { ok: true, status: 200, json: async () => body };
};
function assert(ok, text) { if (!ok) throw new Error(text); checks.push('PASS ' + text); output.textContent = checks.join('\n'); }
async function mount(Page) {
  if (root) await act(async () => root.unmount());
  localStorage.setItem('reliv_session_id', 'KSK-REPORT-TEST');
  localStorage.setItem('reliv_pairing_token', 'synthetic-pairing-token');
  localStorage.setItem('healthData', JSON.stringify({ patient: { name: 'Previous Person', email: 'previous@example.invalid' }, vitals: { impedance: 999, oxygen: 77 }, history: Array(7).fill({ vitals: {} }) }));
  root = createRoot(document.getElementById('app'));
  await act(async () => root.render(<MemoryRouter><HealthProvider><SpeechProvider><VoiceAssistantProvider><ProtectedReportRoute>{React.createElement(Page)}</ProtectedReportRoute></VoiceAssistantProvider></SpeechProvider></HealthProvider></MemoryRouter>));
  await act(async () => new Promise(resolve => wait(resolve, 30)));
}
async function run() {
  assert(getScanCount({ history: Array(7).fill({}) }) === 1, 'history length cannot impersonate seven completed visits');
  assert(getScanCount({ scanCount: 7 }) === 7, 'server supplied visit count is honored');
  assert(reportMeasurements({ impedance: 500 }).every(r => r.value === null), 'raw impedance is never a report field or substitute reading');
  for (const [index, Page] of [Report1, Report2, Report3, Report4, Report5].entries()) {
    await mount(Page);
    const summary = document.querySelector('[aria-label="Current scan measurements"]');
    const text = document.getElementById('app').textContent;
    assert(summary?.textContent.includes('172.3 cm') && summary.textContent.includes('65.4 kg') && summary.textContent.includes('98 %'), `report ${index + 1} shows current readings on first scan without email`);
    assert(!text.includes('Previous Person') && !text.includes('Health data is missing or incomplete'), `report ${index + 1} does not show stale identity or require email for readings`);
    assert(!/scan.*QR|Open report on phone/i.test(text), `report ${index + 1} has no phone QR requirement`);
    const stored = JSON.parse(localStorage.getItem('healthData'));
    assert(!stored.vitals.impedance && stored.history.length === 0, `report ${index + 1} clears absent previous readings and history`);
  }
  paid.healthData.scanCount = 7; paid.healthData.identityLinked = true;
  await mount(Report5);
  assert(document.querySelector('[aria-label="Current scan measurements"]').textContent.includes('Visit 7'), 'linked seventh visit is shown from backend metadata');
  assert(!requests.some(url => url.includes('/reports/history/')), 'reports never request public email health history');
  authorized = false;
  await mount(Report2);
  assert(!document.querySelector('[aria-label="Current scan measurements"]') && document.getElementById('app').textContent.includes('Report unavailable'), 'unpaid response cannot render report readings');
  await act(async () => root.unmount());
  output.textContent = checks.join('\n') + '\nALL ' + checks.length + ' BROWSER CHECKS PASSED';
}
run().catch(error => { output.textContent = checks.join('\n') + '\nFAIL ' + error.stack; });
