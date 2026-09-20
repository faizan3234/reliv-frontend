import test from "node:test";
import assert from "node:assert/strict";
import { getPaymentQrConfig, normalizePaymentQrValue, paymentQrError, PAYMENT_QR_MEDIUM_BYTES, PAYMENT_QR_MAX_BYTES } from "../src/utils/paymentQr.js";
import { readFileSync } from 'node:fs';
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

test('exact QR capacities choose the matching correction level without a render exception', () => {
  const prefix = 'https://example.com/pay#p=';
  for (const [size, level] of [[2201, 'M'], [PAYMENT_QR_MEDIUM_BYTES, 'M'], [PAYMENT_QR_MEDIUM_BYTES + 1, 'L'], [PAYMENT_QR_MAX_BYTES, 'L']]) {
    const value = prefix + 'x'.repeat(size - prefix.length);
    const config = getPaymentQrConfig(value);
    assert.equal(config.level, level);
    assert.equal(config.value, value);
    const svg = renderToStaticMarkup(React.createElement(QRCodeSVG, { ...config, marginSize: 4, boostLevel: false }));
    assert.match(svg, /<svg/);
  }
  const oversized = prefix + 'x'.repeat(PAYMENT_QR_MAX_BYTES + 1 - prefix.length);
  assert.equal(getPaymentQrConfig(oversized), null);
  assert.match(paymentQrError(oversized), /too large/);
  assert.match(paymentQrError('http://localhost/pay'), /invalid payment address/);
  assert.equal(normalizePaymentQrValue(prefix + 'x'.repeat(PAYMENT_QR_MEDIUM_BYTES)), '');
});

test('actual backend requests using standard 4096-bit keys render without changing encrypted payment data', () => {
  const fixtures = JSON.parse(readFileSync(new URL('./fixtures/payment-v2-qr.json', import.meta.url)));
  for (const [key, fixture] of Object.entries(fixtures)) {
    for (const value of [fixture.legacyUrl, fixture.paymentUrl]) {
      const config = getPaymentQrConfig(value);
      if (value.length > PAYMENT_QR_MAX_BYTES) {
        assert.equal(config, null);
        continue;
      }
      assert.equal(config.value, value, key);
      assert.match(renderToStaticMarkup(React.createElement(QRCodeSVG, { ...config, marginSize: 4, boostLevel: false })), /<svg/);
    }
    assert.equal(getPaymentQrConfig(fixture.paymentUrl).level, 'M');
  }
});

test("payment QR rejects LAN, malformed, and whitespace-contaminated values", () => {
  assert.equal(normalizePaymentQrValue("http://192.168.50.1:5000/pay#p=package"), "");
  assert.equal(normalizePaymentQrValue("not-a-url"), "");
  assert.equal(normalizePaymentQrValue("https://reliv7.vercel.app/pay#p=bad value"), "");
});
