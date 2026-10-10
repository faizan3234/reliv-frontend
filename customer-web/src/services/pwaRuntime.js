// A deployment changes sw.js through Vite's build stamp. Check without
// interrupting checkout, code display, camera use or another open app tab.
let registration;
let idle = false;
export function setAppIdle(value) { idle = value; }
export async function checkForAppUpdate() {
  try { await registration?.update(); } catch { /* Offline is recoverable. */ }
}
export function refreshApp() { window.location.reload(); }
export function startPwaUpdates() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data?.type === 'RELIV_CAN_UPDATE') event.ports[0]?.postMessage({ idle });
  });
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (idle) refreshApp();
  });
  navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then(value => {
    registration = value;
  }).catch(() => {});
  const check = async () => {
    if (document.visibilityState === 'hidden') return;
    await checkForAppUpdate();
    if (idle) {
      if (registration?.waiting) registration.waiting.postMessage({ type: 'RELIV_ACTIVATE_IF_IDLE' });
      else refreshApp();
    }
  };
  // No wall-clock reload while a payment or confirmed code is active.
  setInterval(check, 5 * 60 * 1000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForAppUpdate();
  });
  window.addEventListener('online', checkForAppUpdate);
}
