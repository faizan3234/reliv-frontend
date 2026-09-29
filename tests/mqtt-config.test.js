import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveMqttConfig } from '../src/config/mqtt.js';
test('Pi and local Chromium use the AP WebSocket listener without stale cloud credentials', () => {
  for (const hostname of ['192.168.50.1', 'localhost', '127.0.0.1']) {
    assert.deepEqual(resolveMqttConfig({VITE_MQTT_BROKER:'wss://old.example.com',VITE_MQTT_USERNAME:'old',VITE_MQTT_PASSWORD:'old'}, {hostname,protocol:'http:'}), {brokerUrl:'ws://192.168.50.1:9001/'});
  }
});
test('explicit non-kiosk config supports anonymous and authenticated WebSockets', () => {
  assert.deepEqual(resolveMqttConfig({VITE_MQTT_BROKER:'ws://192.168.50.1:9001'}),{brokerUrl:'ws://192.168.50.1:9001/'});
  assert.equal(resolveMqttConfig({VITE_MQTT_BROKER:'wss://broker.example.com',VITE_MQTT_USERNAME:'local',VITE_MQTT_PASSWORD:'test'}).username,'local');
});
test('reject TCP, partial credentials and mixed content', () => {
  assert.throws(()=>resolveMqttConfig({VITE_MQTT_BROKER:'mqtt://192.168.50.1:1883'}),/WebSocket|ws:/);
  assert.throws(()=>resolveMqttConfig({VITE_MQTT_BROKER:'ws://example.com',VITE_MQTT_USERNAME:'only'}),/both/);
  assert.throws(()=>resolveMqttConfig({}, {hostname:'192.168.50.1',protocol:'https:'}),/http:/);
});
