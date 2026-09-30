const KIOSK_HOST = '192.168.50.1';

// The installed Pi listener permits anonymous connections. Pin locally served
// kiosk pages to it so old cloud variables cannot redirect medical readings.
export function resolveMqttConfig(env = {}, location = {}) {
  const local = [KIOSK_HOST, 'localhost', '127.0.0.1'].includes(location.hostname);
  if (local) {
    if (location.protocol === 'https:') {
      throw new Error('Open the offline kiosk at http://192.168.50.1; local MQTT uses ws:// on port 9001.');
    }
    return { brokerUrl: `ws://${KIOSK_HOST}:9001/` };
  }
  const raw = env.VITE_MQTT_BROKER?.trim();
  if (!raw) throw new Error('Configure VITE_MQTT_BROKER with a MQTT WebSocket URL.');
  let broker;
  try { broker = new URL(raw); } catch { throw new Error('VITE_MQTT_BROKER must be a valid WebSocket URL.'); }
  if (!['ws:', 'wss:'].includes(broker.protocol)) throw new Error('Browser MQTT requires ws:// or wss://, not TCP port 1883.');
  if (location.protocol === 'https:' && broker.protocol !== 'wss:') throw new Error('HTTPS pages require a secure wss:// MQTT listener.');
  const username = env.VITE_MQTT_USERNAME?.trim() || '';
  const password = env.VITE_MQTT_PASSWORD || '';
  if (Boolean(username) !== Boolean(password)) throw new Error('Set both MQTT username and password, or leave both empty for an anonymous listener.');
  return { brokerUrl: broker.toString(), ...(username ? { username, password } : {}) };
}

export function getMqttConfig() {
  return resolveMqttConfig(import.meta.env, typeof window === 'undefined' ? {} : window.location);
}
