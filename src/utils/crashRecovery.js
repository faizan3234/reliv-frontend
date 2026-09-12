export function recoverBlankScreen(root, browser = window) {
  if (!root || root.children.length) return;
  // One automatic reload per minute, retaining the payment/report route and
  // session. If storage is blocked, use manual recovery instead of looping.
  try {
    const last = Number(browser.sessionStorage.getItem('reliv_crash_reload') || 0);
    if (Date.now() - last > 60000) {
      browser.sessionStorage.setItem('reliv_crash_reload', String(Date.now()));
      browser.location.reload();
      return;
    }
  } catch { /* Recovery screen below works without storage. */ }
  const panel = root.ownerDocument.createElement('section');
  panel.setAttribute('role', 'alert');
  panel.style.cssText = 'padding:40px;text-align:center;background:white;color:#172033;font:18px sans-serif';
  const message = root.ownerDocument.createElement('p');
  message.textContent = 'Reliv could not load. If you already paid, do not pay again. Please ask the kiosk administrator for help.';
  const retry = root.ownerDocument.createElement('button');
  retry.textContent = 'Reload this screen';
  retry.style.cssText = 'padding:16px;border-radius:12px;background:#ea580c;color:white;border:0';
  retry.onclick = () => browser.location.reload();
  panel.append(message, retry);
  root.append(panel);
}
