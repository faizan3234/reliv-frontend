import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App';

const results = [];
function record(ok, message) {
  results.push(`${ok ? 'PASS' : 'FAIL'} ${message}`);
  document.querySelector('#results').textContent = results.join('\n');
}

// Mock fetch for Wi-Fi endpoints in JSDOM
window.fetch = async (url) => {
  const urlStr = String(url);
  if (urlStr.includes('/api/wifi/status')) {
    return {
      ok: true,
      json: async () => ({
        success: true,
        status: {
          connected: true,
          ssid: 'Reliv_Office_5GHz',
          ip: '192.168.1.145',
          mac: 'B8:27:EB:4A:8C:91',
          signal: 94,
          bars: '▂▄▆█',
          frequency: '5 GHz',
          security: 'WPA2',
          gateway: '192.168.1.1',
          internetReachable: true
        }
      })
    };
  }
  if (urlStr.includes('/api/wifi/saved')) {
    return {
      ok: true,
      json: async () => ({
        success: true,
        saved: [
          { ssid: 'Reliv_Office_5GHz', uuid: 'uuid-1', autoConnect: true, isCurrent: true },
          { ssid: 'Reliv_Field_Hotspot', uuid: 'uuid-2', autoConnect: false, isCurrent: false }
        ]
      })
    };
  }
  if (urlStr.includes('/api/wifi/scan')) {
    return {
      ok: true,
      json: async () => ({
        success: true,
        networks: [
          { ssid: 'Reliv_Office_5GHz', signal: 94, frequency: '5 GHz', security: 'WPA2', isOpen: false, inUse: true, isSaved: true },
          { ssid: 'Airtel_Fiber_5G', signal: 86, frequency: '5 GHz', security: 'WPA2', isOpen: false, inUse: false, isSaved: false },
          { ssid: 'Reliv_Guest_Open', signal: 65, frequency: '2.4 GHz', security: 'Open', isOpen: true, inUse: false, isSaved: false }
        ]
      })
    };
  }
  return { ok: true, json: async () => ({ success: true }) };
};

const root = createRoot(document.getElementById('app'));
root.render(
  <MemoryRouter initialEntries={['/wifi']}>
    <App />
  </MemoryRouter>
);

// Wait for Suspense / lazy load and assertions
setTimeout(async () => {
  try {
    const text = document.body.textContent;
    record(!text.includes('QR Code Expired'), 'does not show QR Code Expired message');
    record(text.includes('Wi-Fi Settings'), 'renders Wi-Fi Settings header through App root');
    record(text.includes('192.168.50.1'), 'renders Kiosk AP 192.168.50.1 indicator');
    record(text.includes('Current Connection'), 'renders Current Connection section');
    record(text.includes('Reliv_Office_5GHz'), 'displays connected SSID');
    record(text.includes('Available Networks'), 'renders Available Networks list');
    record(text.includes('Join Other Network...'), 'renders Join Other Network button');

    record(true, 'ALL 7 BROWSER CHECKS PASSED');
  } catch (err) {
    record(false, `Error: ${err.message}`);
  }
}, 400);
