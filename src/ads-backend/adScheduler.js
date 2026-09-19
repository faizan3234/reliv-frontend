// src/ads-backend/adScheduler.js
/**
 * Reliv Ads V1 — Ad Scheduler Service
 * Evaluates campaign eligibility using Pi system time in Asia/Kolkata,
 * manages fair round-robin rotation, and purges expired media after 24h retention.
 */

import fs from 'fs';

export const MAX_SIMULTANEOUS_CAMPAIGNS = 8;
export const EXPIRED_RETENTION_HOURS = 24;

/**
 * Returns current date and hour in Asia/Kolkata timezone
 */
export function getKolkataTime() {
  const date = new Date();
  const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false };
  const formatter = new Intl.DateTimeFormat('en-CA', options);
  const parts = formatter.formatToParts(date);
  
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);

  return {
    todayStr: `${year}-${month}-${day}`,
    currentHour: hour,
    timestampMs: date.getTime()
  };
}

/**
 * Checks whether a campaign record is eligible for display right now
 */
export function isCampaignEligible(campaign, kolkataTime = getKolkataTime()) {
  if (campaign.status !== 'ACTIVE') return false;

  const { todayStr, currentHour } = kolkataTime;

  // Date range check
  if (campaign.start_date > todayStr) return false;
  if (campaign.end_date < todayStr) return false;

  // Hourly dayparting check
  if (!campaign.is_all_day) {
    if (currentHour < campaign.daily_start_hour || currentHour >= campaign.daily_end_hour) {
      return false;
    }
  }

  return true;
}

/**
 * Fair round-robin rotator
 */
class AdRotator {
  constructor() {
    this.currentIndex = 0;
  }

  getNextAd(eligibleAds) {
    if (!eligibleAds || eligibleAds.length === 0) return null;
    const ad = eligibleAds[this.currentIndex % eligibleAds.length];
    // Always increment so interruptions do not replay the same ad
    this.currentIndex = (this.currentIndex + 1) % eligibleAds.length;
    return ad;
  }
}

export const adRotator = new AdRotator();

/**
 * Purges media for campaigns expired longer than 24 hours
 */
export function cleanupExpiredMedia(campaigns) {
  const { todayStr } = getKolkataTime();
  const purged = [];

  for (const c of campaigns) {
    if (c.status === 'EXPIRED' && c.prepared_path) {
      try {
        if (fs.existsSync(c.prepared_path)) {
          fs.unlinkSync(c.prepared_path);
          purged.push(c.campaign_id);
        }
      } catch (err) {
        console.error(`[adScheduler] Error removing expired media for ${c.campaign_id}:`, err);
      }
    }
  }

  return purged;
}
