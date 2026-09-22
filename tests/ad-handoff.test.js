import test from 'node:test';
import assert from 'node:assert/strict';
import { isIosCaptiveBrowser, safeAdPaymentUrl } from '../src/utils/adHandoff.js';

test('detects iPhone captive network assistant without misclassifying Safari', () => {
  const captive = 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
  const safari = captive + ' Version/26.0 Safari/604.1';
  const chrome = captive + ' CriOS/140.0.0.0 Mobile/15E148 Safari/604.1';

  assert.equal(isIosCaptiveBrowser({ userAgent: captive }), true);
  assert.equal(isIosCaptiveBrowser({ userAgent: 'CaptiveNetworkSupport-480 wispr' }), true);
  assert.equal(isIosCaptiveBrowser({ userAgent: safari }), false);
  assert.equal(isIosCaptiveBrowser({ userAgent: chrome }), false);
});

test('payment handoff still accepts only the Reliv7 encrypted pay URL', () => {
  assert.equal(
    safeAdPaymentUrl('https://reliv7.vercel.app/pay#p=abc_123-XYZ'),
    'https://reliv7.vercel.app/pay#p=abc_123-XYZ'
  );
  assert.equal(safeAdPaymentUrl('http://reliv7.vercel.app/pay#p=abc'), '');
  assert.equal(safeAdPaymentUrl('https://evil.example/pay#p=abc'), '');
});
