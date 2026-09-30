import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App';
import ErrorBoundary from '../src/components/ErrorBoundary';
import { HealthProvider } from '../src/context/HealthContext';
import { SpeechProvider } from '../src/context/SpeechContext';
import '../src/i18n';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
window.speechSynthesis = { cancel() {}, getVoices: () => [], addEventListener() {}, removeEventListener() {}, speak() {} };
window.WebSocket = class { static OPEN = 1; readyState = 0; send() {} close() {} };
window.fetch = async () => ({ ok: true, status: 200, json: async () => ({ ok: true, ads: [], splashIntervalSeconds: 5 }) });
Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new Error('Storage blocked'); } });
const root = createRoot(document.getElementById('app'));
const output = document.getElementById('results');
async function run() {
  await act(async () => {
    root.render(<MemoryRouter><ErrorBoundary><HealthProvider><SpeechProvider><App /></SpeechProvider></HealthProvider></ErrorBoundary></MemoryRouter>);
    await new Promise(resolve => setTimeout(resolve, 100));
  });
  const text = document.getElementById('app').textContent;
  if (text.includes('Something went wrong') || !text.includes('English')) throw new Error('Home failed to boot: ' + text);
  await act(async () => root.unmount());
  output.textContent = 'ALL 1 BROWSER CHECKS PASSED';
}
run().catch(error => { output.textContent = 'FAIL ' + error.stack; });
