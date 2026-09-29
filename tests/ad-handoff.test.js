import test from 'node:test';
import assert from 'node:assert/strict';
import { safeAdPaymentUrl } from '../src/utils/adHandoff.js';

test('payment handoff still accepts only the Reliv7 encrypted pay URL', () => {
  assert.equal(
    safeAdPaymentUrl('https://reliv7.vercel.app/pay#p=abc_123-XYZ'),
    'https://reliv7.vercel.app/pay#p=abc_123-XYZ'
  );
  assert.equal(safeAdPaymentUrl('http://reliv7.vercel.app/pay#p=abc'), '');
  assert.equal(safeAdPaymentUrl('https://evil.example/pay#p=abc'), '');
});
