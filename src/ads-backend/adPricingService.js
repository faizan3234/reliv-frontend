// src/ads-backend/adPricingService.js
/**
 * Reliv Ads V1 — Authoritative Backend Pricing Service
 * Day-based pricing tiers without confusing hourly multipliers.
 */

const PRICING_VERSION = 1;

const TIERS = [
  { days: 1, baseRupees: 50, launchRupees: 50, perDay: 50 },
  { days: 3, baseRupees: 150, launchRupees: 117, perDay: 39 },
  { days: 7, baseRupees: 350, launchRupees: 245, perDay: 35 },
  { days: 15, baseRupees: 750, launchRupees: 450, perDay: 30 },
  { days: 30, baseRupees: 1500, launchRupees: 750, perDay: 25 }
];

function getRatePerDay(days) {
  const match = TIERS.find(t => t.days === days);
  if (match) return match.perDay;
  if (days < 3) return 50;
  if (days < 7) return 39;
  if (days < 15) return 35;
  if (days < 30) return 30;
  return 25;
}

/**
 * Computes authoritative pricing for a campaign.
 */
export function calculateAuthoritativePrice({
  targetVenues = ['gurukul'],
  durationDays = 3,
  isAllDay = true,
  dailyStartHour = 0,
  dailyEndHour = 24
}) {
  const days = Math.max(1, parseInt(durationDays, 10) || 1);
  const perDayRate = getRatePerDay(days);
  let basePrice = perDayRate * days;

  // Multi-venue bundle discount (20% off when 3 or more venues selected)
  const venueCount = Math.max(1, targetVenues.length);
  let subtotal = basePrice * venueCount;
  let discountRupees = 0;

  if (venueCount >= 3) {
    discountRupees = Math.round(subtotal * 0.20);
    subtotal -= discountRupees;
  }

  const finalRupees = Math.max(50, subtotal);
  const pricePaise = finalRupees * 100;
  const effectivePerDay = Math.round(finalRupees / days);

  return {
    pricingVersion: PRICING_VERSION,
    days,
    venueCount,
    discountRupees,
    finalRupees,
    pricePaise,
    effectivePerDay,
    isAllDay,
    dailyStartHour: isAllDay ? 0 : dailyStartHour,
    dailyEndHour: isAllDay ? 24 : dailyEndHour
  };
}
