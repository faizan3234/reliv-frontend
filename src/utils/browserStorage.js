export function readBrowserStorage(key, kind = 'localStorage') {
  try { return window[kind].getItem(key); }
  catch { return null; }
}

export function writeBrowserStorage(key, value, kind = 'localStorage') {
  try { window[kind].setItem(key, value); return true; }
  catch { return false; }
}
