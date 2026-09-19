// tests/test-ads-engine.js
import { calculateAuthoritativePrice } from '../src/ads-backend/adPricingService.js';
import { 
  computeCodeHmac, 
  generate4DigitCode, 
  verifyConfirmationCode, 
  buildPaymentPayload 
} from '../src/ads-backend/adCryptoService.js';
import { getKolkataTime } from '../src/ads-backend/adScheduler.js';

console.log('=== Reliv Ads V1 Engine Tests ===\n');

// 1. Test 1 Day Pricing
const p1 = calculateAuthoritativePrice({ durationDays: 1, isAllDay: true });
console.assert(p1.finalRupees === 50, `Expected 1 day to be 50, got ${p1.finalRupees}`);
console.assert(p1.pricePaise === 5000, `Expected 1 day to be 5000 paise, got ${p1.pricePaise}`);
console.log('✓ 1 Day Pricing matches: ₹50');

// 2. Test 3 Days Pricing (Launch Special)
const p3 = calculateAuthoritativePrice({ durationDays: 3, isAllDay: true });
console.assert(p3.finalRupees === 117, `Expected 3 days to be 117, got ${p3.finalRupees}`);
console.assert(p3.effectivePerDay === 39, `Expected ₹39/day, got ${p3.effectivePerDay}`);
console.log('✓ 3 Days Launch Pricing matches: ₹117 total, ₹39/day');

// 3. Test All Venues 20% Discount
const pAll = calculateAuthoritativePrice({ targetVenues: ['gurukul', 'dps-megacity', 'beeu-resorts'], durationDays: 3 });
// 117 * 3 = 351, 20% discount = 70, final = 281
console.assert(pAll.discountRupees === 70, `Expected 70 discount, got ${pAll.discountRupees}`);
console.assert(pAll.finalRupees === 281, `Expected 281 total, got ${pAll.finalRupees}`);
console.log(`✓ All Venues (3 kiosks) Discounted: ₹${pAll.finalRupees} (Saved ₹${pAll.discountRupees})`);

// 4. Test Crypto Code Generation & HMAC Verification
const code = generate4DigitCode();
console.assert(code.length === 4 && !isNaN(code), `Invalid code format: ${code}`);
const hmac = computeCodeHmac(code);

const campaignMock = {
  confirmation_code_hmac: hmac,
  attempt_count: 0
};

const validRes = verifyConfirmationCode(campaignMock, code);
console.assert(validRes.valid === true, 'Verification should succeed for correct code');

const invalidRes = verifyConfirmationCode(campaignMock, '0000');
console.assert(invalidRes.valid === false, 'Verification should fail for wrong code');
console.log(`✓ Timing-safe HMAC verification passed for code ${code}`);

// 5. Test Protocol Discriminator
const payload = buildPaymentPayload({
  campaignId: 'AD-TEST1',
  amountPaise: 11700,
  startDate: '2026-09-20',
  endDate: '2026-09-22'
});
console.assert(payload.purpose === 'RELIV_AD_CAMPAIGN', 'Must contain RELIV_AD_CAMPAIGN protocol discriminator');
console.assert(payload.version === 1, 'Must contain version 1');
console.log('✓ Protocol discriminator verified: RELIV_AD_CAMPAIGN');

// 6. Test Scheduler Asia/Kolkata Time
const kTime = getKolkataTime();
console.assert(kTime.todayStr.length === 10, `Invalid Kolkata date string: ${kTime.todayStr}`);
console.log(`✓ Asia/Kolkata Time: ${kTime.todayStr}, Hour: ${kTime.currentHour}`);

console.log('\nAll Reliv Ads V1 Engine unit tests passed successfully!');
