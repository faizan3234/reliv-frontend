// An optional cloud feature must never prevent an offline kiosk from booting.
export function optionalCloudClient(env, location, createClient) {
  if (['192.168.50.1', 'localhost', '127.0.0.1'].includes(location?.hostname)) return null;
  const url = env?.VITE_SUPABASE_URL?.trim();
  const key = env?.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;
  try {
    if (!['http:', 'https:'].includes(new URL(url).protocol)) return null;
    return createClient(url, key);
  } catch {
    return null;
  }
}
