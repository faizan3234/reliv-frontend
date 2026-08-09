const MQTT_ENV_KEYS = [
  "VITE_MQTT_BROKER",
  "VITE_MQTT_USERNAME",
  "VITE_MQTT_PASSWORD",
];

const isPlaceholder = (value) =>
  !value ||
  /^(brokerid|your-|vite_mqtt_|<.+>)/i.test(value.trim());

export function getMqttConfig() {
  const brokerUrl = import.meta.env.VITE_MQTT_BROKER?.trim();
  const username = import.meta.env.VITE_MQTT_USERNAME?.trim();
  const password = import.meta.env.VITE_MQTT_PASSWORD;

  if (isPlaceholder(brokerUrl) || isPlaceholder(username) || isPlaceholder(password)) {
    throw new Error(`Missing MQTT configuration: ${MQTT_ENV_KEYS.join(", ")}`);
  }

  let broker;
  try {
    broker = new URL(brokerUrl);
  } catch {
    throw new Error("VITE_MQTT_BROKER must be a valid WebSocket URL");
  }

  if (broker.protocol !== "ws:" && broker.protocol !== "wss:") {
    throw new Error("VITE_MQTT_BROKER must use ws:// or wss:// in the browser");
  }

  return { brokerUrl: broker.toString(), username, password };
}
