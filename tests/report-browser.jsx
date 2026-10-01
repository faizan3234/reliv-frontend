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
import UnifiedReport from '../src/pages/UnifiedReport';
import { getScanCount, reportMeasurements } from '../src/utils/reportSnapshot';
import { answerReportQuestion } from '../src/voice/reportQuestions';
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
let authorized = true, root, privateAccess = false;
const requests = [];
window.fetch = async (url, options) => {
  requests.push({ url: String(url), token: options?.headers?.['X-Reliv-Profile-Token'] });
  const body = String(url).includes('/report/data') ? (authorized ? paid : { ok: false, message: 'Payment required' }) : { ok: true, history: [], data: [] };
  return { ok: true, status: 200, json: async () => body };
};
function assert(ok, text) { if (!ok) throw new Error(text); checks.push('PASS ' + text); output.textContent = checks.join('\n'); }
async function mount(Page) {
  if (root) await act(async () => root.unmount());
  localStorage.setItem('reliv_session_id', 'KSK-REPORT-TEST');
  localStorage.setItem('reliv_pairing_token', 'synthetic-pairing-token');
  if (privateAccess) sessionStorage.setItem('reliv_profile_access', JSON.stringify({ sessionId:'KSK-REPORT-TEST', token:'a'.repeat(64) }));
  else sessionStorage.removeItem('reliv_profile_access');
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
    const summary = document.querySelector('[aria-label="Health screening report"]');
    const text = document.getElementById('app').textContent;
    assert(summary?.textContent.includes('172.3 cm') && summary.textContent.includes('65.4 kg') && summary.textContent.includes('98 %'), `report ${index + 1} shows current readings on first scan without email`);
    assert(!text.includes('Previous Person') && !text.includes('Health data is missing or incomplete'), `report ${index + 1} does not show stale identity or require email for readings`);
    assert(!/scan.*QR|Open report on phone/i.test(text), `report ${index + 1} has no phone QR requirement`);
    const stored = JSON.parse(localStorage.getItem('healthData'));
    assert(!stored.vitals.impedance && stored.history.length === 0, `report ${index + 1} clears absent previous readings and history`);
  }
  paid.healthData.scanCount = 7; paid.healthData.identityLinked = true;
  paid.healthData.history = Array.from({ length: 7 }, (_, index) => ({ createdAt: `2026-10-0${index+1}`, systolic: 114 + index, oxygen: 97 + index % 2, temperature: 98.2, impedance: 500 }));
  privateAccess = true;
  await mount(Report5);
  assert(document.querySelector('[aria-label="Health screening report"]').textContent.includes('Visit 7'), 'linked seventh visit is shown from backend metadata');
  assert(document.querySelectorAll('figure').length > 0 && document.querySelector('svg[aria-label^="Systolic pressure:"]'), 'private multi-visit readings draw a graph');
  assert(!document.querySelector('[aria-label="Health screening report"]').textContent.includes('impedance'), 'raw impedance is not displayed');
  assert(requests.some(request => request.token === 'a'.repeat(64)), 'private access token sent to the paid report endpoint');
  assert(!requests.some(request => request.url.includes('/reports/history/')), 'reports never request public email health history');
  assert(answerReportQuestion('my oxygen', { vitals: {oxygen: 98}, history:[{oxygen: 97},{oxygen: 98}] }, 'en').includes('97') && answerReportQuestion('temperature', {vitals:{},history:[]},'en').includes('not recorded'), 'spoken answer uses measured values and handles missing sensor data');
  await mount(UnifiedReport);
  assert(document.getElementById('app').textContent.includes('Understanding your results') && document.getElementById('app').textContent.includes('What comes next'), 'unified report explains current results and next visit without empty report pages');
  authorized = false;
  await mount(Report2);
  assert(!document.querySelector('[aria-label="Health screening report"]') && document.getElementById('app').textContent.includes('Report unavailable'), 'unpaid response cannot render report readings');
  await act(async () => root.unmount());
  output.textContent = checks.join('\n') + '\nALL ' + checks.length + ' BROWSER CHECKS PASSED';
}
run().catch(error => { output.textContent = checks.join('\n') + '\nFAIL ' + error.stack; });
