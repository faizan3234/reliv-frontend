export function readBrowserStorage(key, kind = 'localStorage') {
  try { return window[kind].getItem(key); }
  catch { return null; }
}
