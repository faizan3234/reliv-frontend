// src/ads-backend/adCryptoService.js
/**
 * Reliv Ads V1 — Cryptographic Payment & Activation Service
 * Generates offline HMAC confirmation codes and canonical encrypted payment payloads
 * with explicit RELIV_AD_CAMPAIGN protocol discriminator.
 */

import crypto from 'crypto';

const LOCAL_PEPPER = process.env.RELIV_ADS_PEPPER || 'reliv_ads_kiosk_secret_pepper_v1';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000; // 60 seconds lockout after 5 failed attempts

/**
 * Computes HMAC-SHA256 of 4-digit code using local pepper
 */
export function computeCodeHmac(code, pepper = LOCAL_PEPPER) {
  return crypto.createHmac('sha256', pepper).update(code.trim()).digest('hex');
}

/**
 * Generates cryptographically secure random 4-digit code
 */
export function generate4DigitCode() {
  const num = crypto.randomInt(1000, 10000);
  return num.toString();
}

/**
 * Verifies activation code in timing-safe constant time
 */
export function verifyConfirmationCode(campaign, inputCode, pepper = LOCAL_PEPPER) {
  const now = Date.now();

  // Lockout check
  if (campaign.locked_until && campaign.locked_until > now) {
    const waitSec = Math.ceil((campaign.locked_until - now) / 1000);
    return {
      valid: false,
      locked: true,
      error: `Too many failed attempts. Locked for ${waitSec}s.`
    };
  }

  const computedHmac = computeCodeHmac(inputCode, pepper);
  const targetHmac = campaign.confirmation_code_hmac;

  if (!targetHmac) {
    return { valid: false, error: 'No confirmation HMAC found for campaign.' };
  }

  // Constant-time buffer comparison
  const bufA = Buffer.from(computedHmac, 'hex');
  const bufB = Buffer.from(targetHmac, 'hex');

  const isValid = bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);

  if (!isValid) {
    const attempts = (campaign.attempt_count || 0) + 1;
    const isLocked = attempts >= MAX_ATTEMPTS;
    return {
      valid: false,
      attempts,
      locked: isLocked,
      lockedUntil: isLocked ? now + LOCKOUT_MS : 0,
      error: 'Invalid activation code.'
    };
  }

  return {
    valid: true
  };
}

/**
 * Assembles canonical payment payload with explicit RELIV_AD_CAMPAIGN protocol discriminator
 */
export function buildPaymentPayload({
  campaignId,
  kioskId = 'gurukul-kiosk-1',
  venueId = 'gurukul',
  targetVenueIds = ['gurukul'],
  amountPaise,
  startDate,
  endDate,
  dailyStart = 0,
  dailyEnd = 24,
  mediaSHA256,
  activationSecret,
  pricingVersion = 1
}) {
  const now = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(16).toString('hex');
  const expiresAt = now + (3600 * 2); // 2 hours expiry

  return {
    version: 1,
    purpose: 'RELIV_AD_CAMPAIGN', // Explicit protocol discriminator prevents cross-purpose reuse
    campaignId,
    kioskId,
    venueId,
    targetVenueIds,
    amountPaise,
    pricingVersion,
    startDate,
    endDate,
    dailyStart,
    dailyEnd,
    mediaSHA256,
    activationSecret,
    nonce,
    issuedAt: now,
    expiresAt
  };
}
