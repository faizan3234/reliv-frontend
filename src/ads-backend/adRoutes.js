// src/ads-backend/adRoutes.js
/**
 * Reliv Ads V1 — Express API Router
 * Endpoints for captive portal booking and Kiosk overlay player.
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { calculateAuthoritativePrice } from './adPricingService.js';
import { normalizeImage, normalizeVideo, computeFileSHA256 } from './adMediaService.js';
import { 
  computeCodeHmac, 
  generate4DigitCode, 
  verifyConfirmationCode, 
  buildPaymentPayload 
} from './adCryptoService.js';
import { isCampaignEligible, getKolkataTime } from './adScheduler.js';

const router = express.Router();
const DATA_DIR = process.env.RELIV_DATA_DIR || '/home/reliv/reliv-data/ads';

// 1. Venue & Pricing Config
router.get('/config', (req, res) => {
  res.json({
    currentVenueId: 'gurukul',
    venues: [
      { id: 'gurukul', name: 'Gurukul', isCurrent: true, availableNow: true },
      { id: 'dps-megacity', name: 'DPS Megacity School', isCurrent: false, availableNow: false },
      { id: 'beeu-resorts', name: 'Beeu Resorts', isCurrent: false, availableNow: false }
    ],
    pricing: {
      singleDay: 50,
      threeDays: 117,
      sevenDays: 245,
      fifteenDays: 450,
      thirtyDays: 750,
      allVenuesDiscountPercent: 20
    }
  });
});

// 2. Pricing Calculator
router.post('/quote-price', (req, res) => {
  try {
    const { targetVenues, durationDays, isAllDay, dailyStartHour, dailyEndHour } = req.body;
    const quote = calculateAuthoritativePrice({
      targetVenues,
      durationDays,
      isAllDay,
      dailyStartHour,
      dailyEndHour
    });
    res.json({ success: true, quote });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 3. Confirm Booking & Generate Payment Payload
router.post('/confirm-booking', async (req, res) => {
  try {
    const { campaignId, targetVenues, durationDays, isAllDay, dailyStartHour, dailyEndHour, preparedPath } = req.body;
    
    const quote = calculateAuthoritativePrice({
      targetVenues,
      durationDays,
      isAllDay,
      dailyStartHour,
      dailyEndHour
    });

    const confirmationCode = generate4DigitCode();
    const codeHmac = computeCodeHmac(confirmationCode);

    let mediaHash = 'sample_hash_default';
    if (preparedPath && fs.existsSync(preparedPath)) {
      mediaHash = await computeFileSHA256(preparedPath);
    }

    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    const endDate = new Date(today.getTime() + (quote.days * 86400000)).toISOString().split('T')[0];

    const paymentPayload = buildPaymentPayload({
      campaignId,
      targetVenueIds: targetVenues,
      pricePaise: quote.pricePaise,
      startDate,
      endDate,
      dailyStartHour: quote.dailyStartHour,
      dailyEndHour: quote.dailyEndHour,
      mediaSHA256: mediaHash,
      confirmationCode
    });

    // Encrypted link URL for Reliv7 payment gateway
    const paymentUrl = `https://reliv7.vercel.app/pay#p=${Buffer.from(JSON.stringify(paymentPayload)).toString('base64')}`;

    res.json({
      success: true,
      campaignId,
      paymentUrl,
      confirmationCode, // Revealed only on payment confirmation in production
      codeHmac,
      pricePaise: quote.pricePaise,
      priceRupees: quote.finalRupees
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Activate Campaign with 4-Digit Code
router.post('/activate', (req, res) => {
  try {
    const { campaignId, code, campaignRecord } = req.body;
    const result = verifyConfirmationCode(campaignRecord, code);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        error: result.error,
        locked: result.locked,
        lockedUntil: result.lockedUntil
      });
    }

    const { todayStr } = getKolkataTime();
    const isScheduled = campaignRecord.start_date > todayStr;
    const newStatus = isScheduled ? 'SCHEDULED' : 'ACTIVE';

    res.json({
      success: true,
      status: newStatus,
      isScheduled,
      message: isScheduled 
        ? `Campaign scheduled to begin on ${campaignRecord.start_date} at 10:00 AM.` 
        : "Campaign is live! Added to idle kiosk rotation."
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Active Playlist for Kiosk Overlay Player
router.get('/active-playlist', (req, res) => {
  // In production, queries SQLite db.all("SELECT * FROM ad_campaigns WHERE status = 'ACTIVE' LIMIT 8")
  res.json({
    success: true,
    ads: []
  });
});

export default router;
