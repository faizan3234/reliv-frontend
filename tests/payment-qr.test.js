import test from "node:test";
import assert from "node:assert/strict";
import { normalizePaymentQrValue } from "../src/utils/paymentQr.js";
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QRCodeSVG } from 'qrcode.react';

test("payment QR keeps a clean HTTPS gateway URL", () => {
  const value = normalizePaymentQrValue(" https://reliv7.vercel.app/pay#p=encrypted-package ");
  assert.equal(value, "https://reliv7.vercel.app/pay#p=encrypted-package");
});

test('payment QR rejects credentials, private gateways, and unsupported schemes', () => {
  for (const value of [null, {}, '', 'https:example.com/pay', 'javascript:alert(1)',
    'upi://pay?pa=example', 'https://user:secret@example.com/pay', 'https://localhost/pay',
    'https://kiosk.local/pay', 'https://127.0.0.1/pay', 'https://192.168.50.1/pay',
    'https://10.0.0.1/pay', 'https://172.16.0.1/pay', 'https://[::1]/pay']) {
    assert.equal(normalizePaymentQrValue(value), '', String(value));
  }
});

test('oversized QR packages fail validation rather than crashing render', () => {
  assert.equal(normalizePaymentQrValue('https://example.com/pay#p=' + 'x'.repeat(2300)), '');
  const value = normalizePaymentQrValue('https://example.com/pay#p=' + 'x'.repeat(2100));
  const svg = renderToStaticMarkup(React.createElement(QRCodeSVG, { value, level: 'M', marginSize: 4, boostLevel: false }));
  assert.match(svg, /<svg/);
});

test("payment QR rejects LAN, malformed, and whitespace-contaminated values", () => {
  assert.equal(normalizePaymentQrValue("http://192.168.50.1:5000/pay#p=package"), "");
  assert.equal(normalizePaymentQrValue("not-a-url"), "");
  assert.equal(normalizePaymentQrValue("https://reliv7.vercel.app/pay#p=bad value"), "");
});
