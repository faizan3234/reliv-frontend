// src/utils/adCryptoLocal.js
/**
 * Reliv Ads V1 - Local Campaign & Cryptographic Engine
 * Simulates and interfaces with the offline Pi SQLite & HMAC-SHA256 store.
 */

const STORAGE_KEY = 'reliv_ads_campaigns_v1';
const ATTEMPTS_KEY = 'reliv_ads_verify_attempts_v1';
const PENDING_PAYMENT_BROADCAST_KEY = 'reliv_kiosk_pending_payment_v1';

export const VENUES = [
  { 
    id: 'gurukul', 
    name: 'Gurukul', 
    statusText: 'Current kiosk · Instant activation',
    badgeType: 'current',
    isCurrent: true, 
    availableNow: true,
    requiresApproval: false
  },
  { 
    id: 'dps-megacity', 
    name: 'DPS Megacity School', 
    statusText: 'Scheduled after approval',
    badgeType: 'school',
    isCurrent: false, 
    availableNow: false,
    requiresApproval: true
  },
  { 
    id: 'beeu-resorts', 
    name: 'Beeu Resorts', 
    statusText: 'Scheduled placement',
    badgeType: 'scheduled',
    isCurrent: false, 
    availableNow: false,
    requiresApproval: false
  }
];

export const DURATION_TIERS = [
  { days: 1, basePrice: 50, launchPrice: 50, perDay: 50, tag: null },
  { days: 3, basePrice: 150, launchPrice: 117, perDay: 39, tag: 'Most Popular', savings: 33 },
  { days: 7, basePrice: 350, launchPrice: 245, perDay: 35, tag: null, savings: 105 },
  { days: 15, basePrice: 750, launchPrice: 450, perDay: 30, tag: null, savings: 300 },
  { days: 30, basePrice: 1500, launchPrice: 750, perDay: 25, tag: null, savings: 750, note: '50% launch saving' }
];

/**
 * Authoritative Pricing Calculation (Day-based, clean, no hourly breakdown in primary funnel)
 */
export function calculatePricing({
  venueSelection = 'gurukul',
  durationDays = 3,
  isAllDay = true,
  startHour = 10,
  endHour = 18
}) {
  const days = Math.max(1, parseInt(durationDays, 10) || 1);

  // Find tier or rate per day
  let pricePerDay;
  const matchTier = DURATION_TIERS.find(t => t.days === days);
  if (matchTier) {
    pricePerDay = matchTier.perDay;
  } else if (days < 3) {
    pricePerDay = 50;
  } else if (days < 7) {
    pricePerDay = 39;
  } else if (days < 15) {
    pricePerDay = 35;
  } else if (days < 30) {
    pricePerDay = 30;
  } else {
    pricePerDay = 25;
  }

  let singleVenueCost = pricePerDay * days;

  // Multi-venue discount (20% off combined 3-venue total)
  let venueCount = 1;
  let multiVenueDiscount = 0;
  if (venueSelection === 'all') {
    venueCount = 3;
    const combined = singleVenueCost * venueCount;
    multiVenueDiscount = Math.round(combined * 0.20);
    singleVenueCost = combined - multiVenueDiscount;
  }

  const normalPrice = days * 50 * (venueSelection === 'all' ? 3 : 1);
  const finalPrice = Math.max(50, singleVenueCost);
  const savings = Math.max(0, normalPrice - finalPrice);
  const effectivePerDay = Math.round(finalPrice / days);

  return {
    totalPrice: finalPrice,
    normalPrice,
    savings,
    days,
    effectivePerDay,
    isAllDay,
    startHour,
    endHour,
    venueCount,
    multiVenueDiscount
  };
}

/**
 * Generate cryptographically random 4-digit code
 */
export function generateActivationCode() {
  const arr = new Uint32Array(1);
  window.crypto.getRandomValues(arr);
  const code = (1000 + (arr[0] % 9000)).toString();
  return code;
}

/**
 * Fetch all stored campaigns
 */
export function getStoredCampaigns() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed default active demo campaign so kiosk rotation works right away
      const sampleCampaign = {
        campaignId: 'AD-SHOWCASE-1',
        brandName: 'Gurukul Academy',
        headline: 'Admissions Open 2026-27',
        mediaType: 'image',
        mediaUrl: '/gurukul-ad.png',
        aspectRatio: 'landscape',
        venueId: 'gurukul',
        venueName: 'Gurukul',
        startDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
        isAllDay: true,
        dailyStartHour: 0,
        dailyEndHour: 24,
        priceRupees: 117,
        status: 'ACTIVE',
        confirmationCode: '5829',
        createdAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify([sampleCampaign]));
      return [sampleCampaign];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Save new draft campaign and trigger payment display on Kiosk
 */
export function savePendingCampaign(campaignData) {
  const campaigns = getStoredCampaigns();
  const confirmationCode = generateActivationCode();
  const campaignId = `AD-${Date.now().toString(36).toUpperCase()}`;

  const newCampaign = {
    version: 1,
    purpose: 'RELIV_AD_CAMPAIGN', // Protocol discriminator
    campaignId,
    ...campaignData,
    confirmationCode,
    status: 'PENDING_PAYMENT',
    createdAt: new Date().toISOString()
  };

  campaigns.unshift(newCampaign);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));

  // Broadcast to physical kiosk screen so it displays the Payment QR mode
  localStorage.setItem(PENDING_PAYMENT_BROADCAST_KEY, JSON.stringify(newCampaign));
  window.dispatchEvent(new CustomEvent('reliv_kiosk_show_payment_qr', { detail: newCampaign }));

  return newCampaign;
}

/**
 * Get the currently active pending payment campaign on the kiosk screen
 */
export function getPendingPaymentCampaign() {
  try {
    const raw = localStorage.getItem(PENDING_PAYMENT_BROADCAST_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPendingPayment() {
  localStorage.removeItem(PENDING_PAYMENT_BROADCAST_KEY);
  window.dispatchEvent(new CustomEvent('reliv_kiosk_clear_payment_qr'));
}

/**
 * Offline Activation Keypad Verifier (Timing-Safe simulation & 5-attempt lockout)
 */
export function verifyAndActivateCode(inputCode) {
  const attemptsData = JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || '{"count":0,"lockoutUntil":0}');
  const now = Date.now();

  if (attemptsData.lockoutUntil && attemptsData.lockoutUntil > now) {
    const secondsLeft = Math.ceil((attemptsData.lockoutUntil - now) / 1000);
    return {
      success: false,
      error: `Too many failed attempts. Security lockout active for ${secondsLeft}s.`
    };
  }

  const campaigns = getStoredCampaigns();
  const target = campaigns.find(
    c => c.status === 'PENDING_PAYMENT' && c.confirmationCode === inputCode.trim()
  );

  if (!target) {
    attemptsData.count += 1;
    if (attemptsData.count >= 5) {
      attemptsData.lockoutUntil = now + 60000;
      attemptsData.count = 0;
    }
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attemptsData));
    return {
      success: false,
      error: 'Invalid activation code. Please check your phone and try again.',
      attemptsLeft: Math.max(0, 5 - attemptsData.count)
    };
  }

  // Reset failed attempts on success
  localStorage.removeItem(ATTEMPTS_KEY);

  // Check start date
  const todayStr = new Date().toISOString().split('T')[0];
  const isScheduledFuture = target.startDate > todayStr;

  target.status = isScheduledFuture ? 'SCHEDULED' : 'ACTIVE';
  target.activatedAt = new Date().toISOString();

  localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
  clearPendingPayment();

  return {
    success: true,
    campaign: target,
    isScheduled: isScheduledFuture
  };
}

/**
 * Get active campaigns eligible for idle rotation right now
 */
export function getCurrentlyEligibleAds() {
  const campaigns = getStoredCampaigns();
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentHour = now.getHours();

  return campaigns.filter(c => {
    if (c.status !== 'ACTIVE') return false;
    if (c.startDate && c.startDate > todayStr) return false;
    if (c.endDate && c.endDate < todayStr) return false;
    if (!c.isAllDay) {
      if (currentHour < c.dailyStartHour || currentHour >= c.dailyEndHour) return false;
    }
    return true;
  });
}
