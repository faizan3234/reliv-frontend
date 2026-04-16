import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import PDFDocument from "pdfkit";
import { google } from "googleapis";
import { MongoClient, ObjectId } from "mongodb";
import Razorpay from "razorpay";
import QRCode from "qrcode";
import fetch from "node-fetch";
import mqtt from "mqtt";

// Load environment variables
dotenv.config();

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL ERROR HANDLERS - Prevent crashes from unhandled errors
// ═══════════════════════════════════════════════════════════════════════════
process.on('unhandledRejection', (reason, promise) => {
    console.error('[CRITICAL] Unhandled Promise Rejection:', reason);
    // Don't exit - log and continue
});

process.on('uncaughtException', (error) => {
    console.error('[CRITICAL] Uncaught Exception:', error);
    // Log but don't exit - let the error handler deal with it
    // Only exit on truly fatal errors
    if (error.code === 'EADDRINUSE' || error.code === 'EACCES') {
        console.error('[FATAL] Cannot recover from this error, exiting...');
        setTimeout(() => process.exit(1), 1000);
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// PRICING CONFIGURATION - Admin-adjustable, persisted in MongoDB
// ═══════════════════════════════════════════════════════════════════════════
let reportPrice = 27; // Default fallback; actual value loaded from MongoDB on startup

// ═══════════════════════════════════════════════════════════════════════════
// DEPLOYMENT DETECTION
// ═══════════════════════════════════════════════════════════════════════════
const IS_CLOUD_DEPLOYMENT = process.env.RENDER || process.env.HEROKU || process.env.VERCEL;
const BLE_BACKEND_URL = process.env.BLE_BACKEND_URL || 'http://127.0.0.1:5001';

// ═══════════════════════════════════════════════════════════════════════════
// COMPREHENSIVE ADMIN MONITORING SYSTEM - FULL HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════════════
const ADMIN_ALERT_EMAIL = 'khanfaizan3234@gmail.com'; // Email for system health alerts

// Timing configurations
const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
const DAILY_SUMMARY_HOUR = 9; // Send daily summary at 9 AM IST
const FOLLOW_UP_INTERVAL = 10 * 60 * 1000; // 10 minutes for follow-up

// Health check state tracking
let healthMonitorState = {
    lastFullStatus: {},
    failureStartTime: null,
    failureAlertSent: false,
    followUpAlertSent: false,
    lastDailySummaryDate: null,
    consecutiveFailures: 0,
    serverStartTime: Date.now(),
    totalHealthChecks: 0,
    totalFailures: 0
};

// Track individual component test results
let componentTestResults = {};

// ═══════════════════════════════════════════════════════════════════════════
// COMPREHENSIVE HEALTH CHECK FUNCTIONS FOR EACH COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

// Test MongoDB connection and operations
async function testMongoDB() {
    try {
        if (!db || !dbConnected) return { ok: false, message: 'Database not connected' };
        await db.command({ ping: 1 });
        const collections = await db.listCollections().toArray();
        return { ok: true, message: `Connected, ${collections.length} collections` };
    } catch (err) {
        return { ok: false, message: err.message };
    }
}

// Test Inventory/Kits collection
async function testInventory() {
    try {
        if (!db || !dbConnected) return { ok: false, message: 'Database not available' };
        const kits = await db.collection('kits').find({}).limit(1).toArray();
        const count = await db.collection('kits').countDocuments();
        if (count === 0) return { ok: true, message: 'Collection accessible but empty', warning: true };
        return { ok: true, message: `${count} kits available` };
    } catch (err) {
        return { ok: false, message: err.message };
    }
}

// Test MQTT connection
function testMQTT() {
    try {
        if (!mqttClient) return { ok: false, message: 'MQTT client not initialized' };
        if (mqttClient.connected) return { ok: true, message: 'Connected to HiveMQ' };
        return { ok: false, message: 'MQTT disconnected' };
    } catch (err) {
        return { ok: false, message: err.message };
    }
}

// Test Google Drive API
async function testGoogleDrive() {
    try {
        // Check if credentials are configured
        if (!SERVICE_ACCOUNT_KEY_PATH && !process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
            return { ok: true, message: 'Not configured (optional)', skipped: true };
        }

        // If we've already verified it works, return OK
        if (googleDriveAvailable) return { ok: true, message: 'API accessible & verified' };

        // Try to verify the credentials by initializing auth
        try {
            let auth;
            if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
                const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
                auth = new google.auth.GoogleAuth({
                    credentials,
                    scopes: ["https://www.googleapis.com/auth/drive.readonly"]
                });
            } else if (SERVICE_ACCOUNT_KEY_PATH) {
                auth = new google.auth.GoogleAuth({
                    keyFile: SERVICE_ACCOUNT_KEY_PATH,
                    scopes: ["https://www.googleapis.com/auth/drive.readonly"]
                });
            }

            // Test authentication
            await auth.getClient();
            googleDriveAvailable = true;
            return { ok: true, message: 'Credentials verified' };
        } catch (authErr) {
            return { ok: false, message: `Auth failed: ${authErr.message}` };
        }
    } catch (err) {
        return { ok: false, message: err.message };
    }
}

// Test Nodemailer/Email service
async function testNodemailer() {
    try {
        if (!transporter) return { ok: false, message: 'Email transporter not configured' };
        if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
            return { ok: false, message: 'Gmail credentials missing' };
        }
        await transporter.verify();
        return { ok: true, message: 'SMTP verified' };
    } catch (err) {
        return { ok: false, message: err.message };
    }
}

// Test Razorpay payment gateway
function testRazorpay() {
    try {
        if (!razorpay) return { ok: false, message: 'Razorpay not initialized' };
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return { ok: false, message: 'Razorpay credentials missing' };
        }
        if (razorpayAvailable) return { ok: true, message: 'Payment gateway ready' };
        return { ok: false, message: 'Razorpay initialization failed' };
    } catch (err) {
        return { ok: false, message: err.message };
    }
}

// Test PDF generation capability
async function testPDFGeneration() {
    try {
        // Quick test: create a minimal PDF document
        const PDFDocument = (await import('pdfkit')).default;
        const doc = new PDFDocument();
        doc.text('Test');
        doc.end();
        return { ok: true, message: 'PDFKit operational' };
    } catch (err) {
        return { ok: false, message: err.message };
    }
}

// Test QR Code generation
async function testQRCode() {
    try {
        const testQR = await QRCode.toDataURL('https://reliv.vercel.app/test');
        if (testQR && testQR.startsWith('data:image')) {
            return { ok: true, message: 'QR generation working' };
        }
        return { ok: false, message: 'QR code output invalid' };
    } catch (err) {
        return { ok: false, message: err.message };
    }
}

// Test Report API (check if reports collection is accessible)
async function testReportAPI() {
    try {
        if (!db || !dbConnected) return { ok: false, message: 'Database not available' };
        const count = await db.collection('reports').countDocuments();
        return { ok: true, message: `${count} reports stored` };
    } catch (err) {
        return { ok: false, message: err.message };
    }
}

// Test Eco Tracker functionality
async function testEcoTracker() {
    try {
        const stats = await getEcoStats();
        if (stats && stats.total && typeof stats.total.paper === 'number') {
            return { ok: true, message: `Tracking ${stats.total.paper} paper sheets saved` };
        }
        return { ok: false, message: 'Eco stats returned invalid data' };
    } catch (err) {
        return { ok: false, message: err.message };
    }
}

// Test Admin Auth system
async function testAdminAuth() {
    try {
        const credStore = await loadJsonSafe(CRED_STORE_FILE);
        const adminCount = Object.keys(credStore).length;
        return { ok: true, message: `${adminCount} admin account(s) configured` };
    } catch (err) {
        return { ok: false, message: err.message };
    }
}

// Test Weight/BLE backend (only if not cloud deployment)
async function testWeightAPI() {
    try {
        // BLE hardware is optional - only available locally with Raspberry Pi
        if (IS_CLOUD_DEPLOYMENT) {
            return { ok: true, message: 'N/A on cloud (hardware feature)', skipped: true };
        }
        // In local development, BLE is also optional unless user is testing hardware
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        try {
            const response = await fetch(`${BLE_BACKEND_URL}/api/weight`, { signal: controller.signal });
            clearTimeout(timeout);
            if (response.ok) return { ok: true, message: 'BLE backend responding' };
            return { ok: true, message: 'BLE not responding (optional)', warning: true };
        } catch (err) {
            clearTimeout(timeout);
            return { ok: true, message: 'BLE unavailable (optional hardware)', skipped: true };
        }
    } catch (err) {
        if (IS_CLOUD_DEPLOYMENT) return { ok: true, message: 'N/A (cloud)', skipped: true };
        return { ok: false, message: 'BLE backend unreachable' };
    }
}

// Test Server health (memory, uptime)
function testServerHealth() {
    try {
        const mem = process.memoryUsage();
        const heapUsedMB = Math.round(mem.heapUsed / 1024 / 1024);
        const uptime = Math.round(process.uptime() / 60);
        if (heapUsedMB > 450) { // Near 512MB limit
            return { ok: false, message: `High memory: ${heapUsedMB}MB` };
        }
        return { ok: true, message: `Uptime: ${uptime}min, Memory: ${heapUsedMB}MB` };
    } catch (err) {
        return { ok: false, message: err.message };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPREHENSIVE HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════════════
async function runComprehensiveHealthCheck() {
    const startTime = Date.now();
    healthMonitorState.totalHealthChecks++;

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('🏥 RELIV BACKEND COMPREHENSIVE HEALTH CHECK');
    console.log('═══════════════════════════════════════════════════════════════');

    // Run all health checks
    const checks = {
        'MongoDB Database': await testMongoDB(),
        'Inventory/Kits': await testInventory(),
        'MQTT IoT Connection': testMQTT(),
        'Google Drive API': await testGoogleDrive(),
        'Email Service (Nodemailer)': await testNodemailer(),
        'Payment Gateway (Razorpay)': testRazorpay(),
        'PDF Generation': await testPDFGeneration(),
        'QR Code Generation': await testQRCode(),
        'Report API': await testReportAPI(),
        'Eco Tracker': await testEcoTracker(),
        'Admin Authentication': await testAdminAuth(),
        'Weight/BLE API': await testWeightAPI(),
        'Server Health': testServerHealth()
    };

    // Analyze results
    let failedComponents = [];
    let warningComponents = [];
    let okComponents = [];
    let skippedComponents = [];

    for (const [name, result] of Object.entries(checks)) {
        if (result.skipped) {
            skippedComponents.push({ name, ...result });
            console.log(`⏭️  ${name}: SKIPPED - ${result.message}`);
        } else if (!result.ok) {
            failedComponents.push({ name, ...result });
            console.log(`❌ ${name}: FAILED - ${result.message}`);
        } else if (result.warning) {
            warningComponents.push({ name, ...result });
            console.log(`⚠️  ${name}: WARNING - ${result.message}`);
        } else {
            okComponents.push({ name, ...result });
            console.log(`✅ ${name}: OK - ${result.message}`);
        }
    }

    const duration = Date.now() - startTime;
    console.log(`\n⏱️  Health check completed in ${duration}ms`);
    console.log(`📊 Results: ${okComponents.length} OK, ${warningComponents.length} Warnings, ${failedComponents.length} Failed, ${skippedComponents.length} Skipped`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Store results
    componentTestResults = checks;
    healthMonitorState.lastFullStatus = {
        timestamp: new Date().toISOString(),
        failed: failedComponents,
        warnings: warningComponents,
        ok: okComponents,
        skipped: skippedComponents,
        allOk: failedComponents.length === 0,
        duration
    };

    return {
        allOk: failedComponents.length === 0,
        failed: failedComponents,
        warnings: warningComponents,
        ok: okComponents,
        skipped: skippedComponents,
        timestamp: new Date().toISOString()
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL NOTIFICATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

// Send immediate failure alert
async function sendImmediateFailureAlert(failedComponents, allResults) {
    if (!transporter) {
        console.error('❌ Cannot send failure alert - email not configured');
        return;
    }

    try {
        const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

        const failedList = failedComponents.map(c =>
            `<tr><td style="padding:10px;border-bottom:1px solid #fee2e2;">❌ ${c.name}</td><td style="padding:10px;border-bottom:1px solid #fee2e2;color:#991b1b;">${c.message}</td></tr>`
        ).join('');

        const okList = allResults.ok.map(c =>
            `<tr><td style="padding:8px;border-bottom:1px solid #d1fae5;">✅ ${c.name}</td><td style="padding:8px;border-bottom:1px solid #d1fae5;color:#166534;">${c.message}</td></tr>`
        ).join('');

        const html = `
      <!DOCTYPE html>
      <html>
      <head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;}</style></head>
      <body>
        <div style="max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:#dc2626;color:white;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
            <h1 style="margin:0;">🚨 RELIV BACKEND MALFUNCTION</h1>
            <p style="margin:10px 0 0 0;">Immediate Action Required</p>
          </div>
          <div style="background:#fff;padding:20px;border:1px solid #e5e7eb;">
            <p><strong>Time:</strong> ${timestamp}</p>
            <p><strong>Failed Components (${failedComponents.length}):</strong></p>
            <table style="width:100%;border-collapse:collapse;background:#fef2f2;border-radius:8px;">
              <thead><tr><th style="padding:10px;text-align:left;border-bottom:2px solid #fecaca;">Component</th><th style="padding:10px;text-align:left;border-bottom:2px solid #fecaca;">Error</th></tr></thead>
              <tbody>${failedList}</tbody>
            </table>
            
            <p style="margin-top:20px;"><strong>Working Components (${allResults.ok.length}):</strong></p>
            <table style="width:100%;border-collapse:collapse;background:#f0fdf4;border-radius:8px;">
              <tbody>${okList}</tbody>
            </table>
            
            <div style="margin-top:20px;padding:15px;background:#fff7ed;border-left:4px solid #f97316;border-radius:4px;">
              <strong>⚠️ A follow-up email will be sent in 10 minutes if issues persist.</strong>
            </div>
          </div>
          <div style="background:#374151;color:white;padding:15px;text-align:center;border-radius:0 0 8px 8px;font-size:12px;">
            <p style="margin:0;">Reliv Backend Health Monitor</p>
            <p style="margin:5px 0 0 0;">Health checks run every 5 minutes</p>
          </div>
        </div>
      </body>
      </html>
    `;

        await transporter.sendMail({
            from: `"Reliv Health Monitor" <${process.env.GMAIL_USER}>`,
            to: ADMIN_ALERT_EMAIL,
            subject: `🚨 URGENT: Reliv Backend Malfunction - ${failedComponents.length} Component(s) Failed`,
            html,
            text: `RELIV BACKEND MALFUNCTION\n\nTime: ${timestamp}\n\nFailed Components:\n${failedComponents.map(c => `❌ ${c.name}: ${c.message}`).join('\n')}\n\nWorking Components:\n${allResults.ok.map(c => `✅ ${c.name}`).join('\n')}`,
            priority: 'high'
        });

        console.log(`📧 Immediate failure alert sent to ${ADMIN_ALERT_EMAIL}`);
        healthMonitorState.failureAlertSent = true;
    } catch (err) {
        console.error('❌ Failed to send immediate alert:', err.message);
    }
}

// Send 10-minute follow-up alert
async function sendFollowUpAlert(failedComponents, allResults) {
    if (!transporter) {
        console.error('❌ Cannot send follow-up alert - email not configured');
        return;
    }

    try {
        const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        const minutesSinceFailure = Math.round((Date.now() - healthMonitorState.failureStartTime) / 60000);

        const failedList = failedComponents.map(c =>
            `<tr><td style="padding:10px;border-bottom:1px solid #fee2e2;">❌ ${c.name}</td><td style="padding:10px;border-bottom:1px solid #fee2e2;color:#991b1b;">${c.message}</td></tr>`
        ).join('');

        const html = `
      <!DOCTYPE html>
      <html>
      <head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;}</style></head>
      <body>
        <div style="max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:#b91c1c;color:white;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
            <h1 style="margin:0;">⏰ ISSUE NOT FIXED - ${minutesSinceFailure} MINUTES</h1>
            <p style="margin:10px 0 0 0;">Backend Still Malfunctioning!</p>
          </div>
          <div style="background:#fff;padding:20px;border:1px solid #e5e7eb;">
            <p><strong>Time:</strong> ${timestamp}</p>
            <p><strong>Issue Duration:</strong> ${minutesSinceFailure} minutes</p>
            <p><strong>Still Failing (${failedComponents.length}):</strong></p>
            <table style="width:100%;border-collapse:collapse;background:#fef2f2;border-radius:8px;">
              <thead><tr><th style="padding:10px;text-align:left;border-bottom:2px solid #fecaca;">Component</th><th style="padding:10px;text-align:left;border-bottom:2px solid #fecaca;">Error</th></tr></thead>
              <tbody>${failedList}</tbody>
            </table>
            
            <div style="margin-top:20px;padding:15px;background:#fef2f2;border-left:4px solid #dc2626;border-radius:4px;">
              <strong>🔴 CRITICAL: Issues have persisted for ${minutesSinceFailure}+ minutes. Immediate manual intervention required!</strong>
            </div>
            
            <p style="margin-top:20px;"><strong>Recommended Actions:</strong></p>
            <ul>
              <li>Check Render dashboard for deployment issues</li>
              <li>Verify MongoDB Atlas cluster status</li>
              <li>Check MQTT broker (HiveMQ) connection</li>
              <li>Verify Gmail app password is still valid</li>
              <li>Check Razorpay dashboard for API issues</li>
            </ul>
          </div>
          <div style="background:#374151;color:white;padding:15px;text-align:center;border-radius:0 0 8px 8px;font-size:12px;">
            <p style="margin:0;">Reliv Backend Health Monitor - Follow-up Alert</p>
          </div>
        </div>
      </body>
      </html>
    `;

        await transporter.sendMail({
            from: `"Reliv Health Monitor" <${process.env.GMAIL_USER}>`,
            to: ADMIN_ALERT_EMAIL,
            subject: `⏰ NOT FIXED: Reliv Backend Issues Persist - ${minutesSinceFailure} Minutes`,
            html,
            text: `RELIV BACKEND - ISSUE NOT FIXED\n\nTime: ${timestamp}\nDuration: ${minutesSinceFailure} minutes\n\nStill Failing:\n${failedComponents.map(c => `❌ ${c.name}: ${c.message}`).join('\n')}`,
            priority: 'high'
        });

        console.log(`📧 Follow-up alert sent to ${ADMIN_ALERT_EMAIL}`);
        healthMonitorState.followUpAlertSent = true;
    } catch (err) {
        console.error('❌ Failed to send follow-up alert:', err.message);
    }
}

// Send daily all-okay summary
async function sendDailySummary(allResults) {
    if (!transporter) {
        console.error('❌ Cannot send daily summary - email not configured');
        return;
    }

    try {
        const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        const uptimeHours = Math.round(process.uptime() / 3600);
        const mem = process.memoryUsage();
        const heapUsedMB = Math.round(mem.heapUsed / 1024 / 1024);

        // Build checklist
        const allComponents = [...allResults.ok, ...allResults.warnings, ...allResults.skipped];
        const checklist = allComponents.map(c => {
            if (c.skipped) return `<tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;">⏭️ ${c.name}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${c.message}</td></tr>`;
            if (c.warning) return `<tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;">⚠️ ${c.name}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#d97706;">${c.message}</td></tr>`;
            return `<tr><td style="padding:8px;border-bottom:1px solid #d1fae5;">✅ ${c.name}</td><td style="padding:8px;border-bottom:1px solid #d1fae5;color:#166534;">${c.message}</td></tr>`;
        }).join('');

        const html = `
      <!DOCTYPE html>
      <html>
      <head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;}</style></head>
      <body>
        <div style="max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:linear-gradient(135deg,#22c55e,#16a34a);color:white;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
            <h1 style="margin:0;">✅ RELIV BACKEND - ALL OKAY</h1>
            <p style="margin:10px 0 0 0;">Daily Health Summary</p>
          </div>
          <div style="background:#fff;padding:20px;border:1px solid #e5e7eb;">
            <p><strong>Report Time:</strong> ${timestamp}</p>
            <p><strong>Server Uptime:</strong> ${uptimeHours} hours</p>
            <p><strong>Memory Usage:</strong> ${heapUsedMB} MB</p>
            <p><strong>Health Checks Today:</strong> ${healthMonitorState.totalHealthChecks}</p>
            
            <h3 style="margin-top:20px;color:#166534;">📋 System Status Checklist</h3>
            <table style="width:100%;border-collapse:collapse;background:#f0fdf4;border-radius:8px;">
              <thead><tr><th style="padding:10px;text-align:left;border-bottom:2px solid #bbf7d0;">Component</th><th style="padding:10px;text-align:left;border-bottom:2px solid #bbf7d0;">Status</th></tr></thead>
              <tbody>${checklist}</tbody>
            </table>
            
            <div style="margin-top:20px;padding:15px;background:#f0fdf4;border-left:4px solid #22c55e;border-radius:4px;text-align:center;">
              <strong style="font-size:18px;">🎉 All Systems Operational!</strong>
              <p style="margin:5px 0 0 0;color:#166534;">No issues detected in the last 24 hours.</p>
            </div>
          </div>
          <div style="background:#374151;color:white;padding:15px;text-align:center;border-radius:0 0 8px 8px;font-size:12px;">
            <p style="margin:0;">Reliv Backend Health Monitor</p>
            <p style="margin:5px 0 0 0;">Daily summary sent at 9 AM IST | Next check in 5 minutes</p>
          </div>
        </div>
      </body>
      </html>
    `;

        await transporter.sendMail({
            from: `"Reliv Health Monitor" <${process.env.GMAIL_USER}>`,
            to: ADMIN_ALERT_EMAIL,
            subject: `✅ Reliv Daily Health Report - All Systems Working`,
            html,
            text: `RELIV BACKEND - DAILY HEALTH SUMMARY\n\nTime: ${timestamp}\nUptime: ${uptimeHours} hours\n\nAll Systems Operational!\n\nStatus:\n${allComponents.map(c => `${c.ok ? '✅' : '⚠️'} ${c.name}: ${c.message}`).join('\n')}`
        });

        console.log(`📧 Daily summary sent to ${ADMIN_ALERT_EMAIL}`);
        healthMonitorState.lastDailySummaryDate = new Date().toDateString();
    } catch (err) {
        console.error('❌ Failed to send daily summary:', err.message);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HEALTH MONITORING SCHEDULER
// ═══════════════════════════════════════════════════════════════════════════
async function healthMonitorScheduler() {
    try {
        const results = await runComprehensiveHealthCheck();
        const now = Date.now();
        const currentHour = new Date().getHours();
        const todayDate = new Date().toDateString();

        // Handle failures
        if (!results.allOk) {
            healthMonitorState.totalFailures++;
            healthMonitorState.consecutiveFailures++;

            // First failure detection - send immediate alert
            if (!healthMonitorState.failureStartTime) {
                healthMonitorState.failureStartTime = now;
                healthMonitorState.failureAlertSent = false;
                healthMonitorState.followUpAlertSent = false;
                await sendImmediateFailureAlert(results.failed, results);
            }

            // Check if 10 minutes passed and follow-up not sent
            const timeSinceFailure = now - healthMonitorState.failureStartTime;
            if (timeSinceFailure >= FOLLOW_UP_INTERVAL && !healthMonitorState.followUpAlertSent) {
                await sendFollowUpAlert(results.failed, results);
            }
        } else {
            // All okay - reset failure tracking
            if (healthMonitorState.failureStartTime) {
                console.log('✅ All issues resolved! Backend is healthy again.');
            }
            healthMonitorState.failureStartTime = null;
            healthMonitorState.failureAlertSent = false;
            healthMonitorState.followUpAlertSent = false;
            healthMonitorState.consecutiveFailures = 0;

            // Send daily summary at 9 AM IST if not sent today
            if (currentHour === DAILY_SUMMARY_HOUR && healthMonitorState.lastDailySummaryDate !== todayDate) {
                await sendDailySummary(results);
            }
        }
    } catch (err) {
        console.error('❌ Health monitor scheduler error:', err.message);
    }
}

// Production logging
const isDev = process.env.NODE_ENV !== 'production';
const log = {
    info: (...args) => console.log('[INFO]', new Date().toISOString(), ...args),
    error: (...args) => console.error('[ERROR]', new Date().toISOString(), ...args),
    warn: (...args) => console.warn('[WARN]', new Date().toISOString(), ...args),
    debug: (...args) => isDev && console.log('[DEBUG]', new Date().toISOString(), ...args)
};

// Validate required environment variables
const requiredEnvVars = [
    'MONGODB_URI',
    'GMAIL_USER',
    'GMAIL_PASS',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'MQTT_BROKER_URL',
    'MQTT_USERNAME',
    'MQTT_PASSWORD'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
    log.warn('⚠️ Missing environment variables:', missingVars.join(', '));
    log.warn('Some features may be disabled. Check your .env file or Render environment.');
    // Don't exit - allow partial functionality
}
const app = express();

// Production-ready CORS configuration
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://localhost:5001',
    'http://192.168.1.8:5173',
    'http://192.168.1.8:5174',
    'http://192.168.0.101:5173',
    'https://reliv.vercel.app',
    'https://reliv-frontend-henna.vercel.app',
    'https://mail-request-m33c.vercel.app', // QR code domain (separate Vercel deployment)
    process.env.FRONTEND_URL, // Add your production frontend URL
].filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, Postman, etc.)
            if (!origin) return callback(null, true);

            // Allow only specific origins
            if (allowedOrigins.indexOf(origin) !== -1 || isDev) {
                callback(null, true);
            } else {
                log.warn('Blocked CORS request from:', origin);
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control']
    })
);

// ═══════════════════════════════════════════════════════════════════════════
// SIMPLE RATE LIMITING (No external dependency)
// ═══════════════════════════════════════════════════════════════════════════
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 requests per minute per IP
const RATE_LIMIT_MAX_ENTRIES = 10000; // Max IPs to track (prevents memory leak)

function rateLimitMiddleware(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    // Prevent memory leak: if map is too large, clear oldest entries
    if (rateLimitMap.size > RATE_LIMIT_MAX_ENTRIES) {
        const entriesToDelete = Math.floor(RATE_LIMIT_MAX_ENTRIES * 0.2); // Delete 20%
        const iterator = rateLimitMap.keys();
        for (let i = 0; i < entriesToDelete; i++) {
            rateLimitMap.delete(iterator.next().value);
        }
        log.warn(`Rate limiter cleanup: removed ${entriesToDelete} entries`);
    }

    if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, { count: 1, startTime: now });
        return next();
    }

    const record = rateLimitMap.get(ip);

    // Reset if window has passed
    if (now - record.startTime > RATE_LIMIT_WINDOW) {
        rateLimitMap.set(ip, { count: 1, startTime: now });
        return next();
    }

    record.count++;

    if (record.count > RATE_LIMIT_MAX_REQUESTS) {
        log.warn(`Rate limit exceeded for IP: ${ip}`);
        return res.status(429).json({
            ok: false,
            message: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil((RATE_LIMIT_WINDOW - (now - record.startTime)) / 1000)
        });
    }

    next();
}

// Clean up old rate limit entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap.entries()) {
        if (now - record.startTime > RATE_LIMIT_WINDOW * 2) {
            rateLimitMap.delete(ip);
        }
    }
}, 5 * 60 * 1000);

// Apply rate limiting to all API routes
app.use('/api', rateLimitMiddleware
);
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));
// Request logging middleware
app.use((req, res, next) => {
    if (req.path.startsWith("/api/gdrive")) {
        res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    }
    next();
});
// Initialize Razorpay - gracefully handle missing credentials
let razorpay = null;
let razorpayAvailable = false;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    try {
        razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
        razorpayAvailable = true;
        log.info('✅ Razorpay initialized');
    } catch (err) {
        log.error('⚠️ Failed to initialize Razorpay:', err.message);
        log.warn('Payment features will be disabled');
    }
} else {
    log.warn('⚠️ Razorpay credentials not configured - payment features disabled');
}
const mongoUrl = process.env.MONGODB_URI;

// MongoDB connection with pool and timeout options
const client = new MongoClient(mongoUrl, {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    retryWrites: true,
    retryReads: true
});
let db;

// Track database connection state
let dbConnected = false;
let reconnectInProgress = false; // Debounce flag

// Background DB reconnection with debounce
async function reconnectDB() {
    // Prevent multiple simultaneous reconnect attempts
    if (reconnectInProgress || dbConnected) return;
    reconnectInProgress = true;

    try {
        log.info('Attempting MongoDB reconnection...');
        await client.connect();
        db = client.db("reliv");
        await db.command({ ping: 1 });
        dbConnected = true;
        log.info('✅ MongoDB reconnected successfully');
    } catch (err) {
        log.error('❌ MongoDB reconnection failed:', err.message);
        dbConnected = false;
        // Schedule another attempt in 30 seconds (only if not already scheduled)
        setTimeout(() => {
            reconnectInProgress = false;
            reconnectDB();
        }, 30000);
        return; // Don't reset flag yet
    }
    reconnectInProgress = false;
}

// Unified startup function: Start server first, then connect DB (non-blocking)
async function start() {
    // Start HTTP server IMMEDIATELY (don't wait for DB)
    const PORT = process.env.PORT || 5000;
    const HOST = process.env.HOST || '0.0.0.0';

    const server = app.listen(PORT, HOST, () => {
        log.info(`🚀 Reliv Backend Server running on ${HOST}:${PORT}`);
        log.info(`📡 Environment: ${isDev ? 'Development' : 'Production'}`);
        log.info(`🔗 CORS allowed origins: ${allowedOrigins.join(', ')}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async () => {
        log.info('Received shutdown signal, closing connections...');
        server.close(async () => {
            log.info('HTTP server closed');
            if (dbConnected) {
                await client.close();
                log.info('MongoDB connection closed');
            }
            if (mqttClient) mqttClient.end();
            log.info('MQTT connection closed');
            process.exit(0);
        });

        // Force shutdown after 10 seconds
        setTimeout(() => {
            log.error('Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    // Now try to connect to MongoDB (with retries, but don't block)
    let retries = 5;
    while (retries > 0) {
        try {
            log.info('Connecting to MongoDB Atlas...');
            await client.connect();
            db = client.db("reliv");

            // Verify connection
            await db.command({ ping: 1 });
            dbConnected = true;
            log.info('✅ Successfully connected to MongoDB Atlas');

            // Migrate admin auth data from files to MongoDB (one-time sync)
            await migrateAdminDataToMongo();

            // Load admin-set report price from MongoDB
            try {
                const savedPrice = await db.collection('settings').findOne({ key: 'report_price' });
                if (savedPrice && typeof savedPrice.value === 'number') {
                    reportPrice = savedPrice.value;
                    log.info(`✅ Report price loaded from DB: ₹${reportPrice}`);
                } else {
                    log.info(`ℹ️ No saved report price found, using default: ₹${reportPrice}`);
                }
            } catch (priceErr) {
                log.warn('⚠️ Could not load report price from DB, using default:', priceErr.message);
            }

            // Start proactive inventory monitoring only after DB is ready
            startInventoryMonitoring();

            return; // Success, exit retry loop
        } catch (err) {
            retries--;
            log.error(`❌ Failed to connect to MongoDB (${retries} retries left):`, err.message);
            if (retries === 0) {
                log.error('⚠️ Could not connect to MongoDB - server running in degraded mode');
                log.warn('Database-dependent features will be unavailable');
                // Don't exit! Keep server running for health checks
                // Schedule background reconnection attempts
                setTimeout(reconnectDB, 30000);
                return;
            }
            log.info(`Retrying in 5 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}
const DATA_DIR = process.env.DATA_DIR || "./data";
const TOKEN_STORE_FILE = path.join(DATA_DIR, "reset_tokens.json");
const CRED_STORE_FILE = path.join(DATA_DIR, "admin_credentials.json");
// Google Service Account - Check multiple locations for flexibility
const SERVICE_ACCOUNT_KEY_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    ? null // Use JSON from env var directly
    : (process.env.GOOGLE_APPLICATION_CREDENTIALS ||
        (process.env.NODE_ENV === 'production' ? '/etc/secrets/service-account-key.json' : './data/service-account-key.json'));

// Flag to track if Google Drive is available
let googleDriveAvailable = false;
function assessBP(sys, dia) {
    const s = Number(sys),
        d = Number(dia);
    if (!s || !d) return { label: "—", advice: "No BP values provided." };
    if (s < 100 || d < 65)
        return {
            label: "Low",
            advice: "May cause tiredness or dizziness. Try drinking water, coconut water, or adding a pinch of salt if not restricted.",
        };
    if (s >= 110 && s < 131 && d >= 72 && d < 89)
        return { label: "Normal", advice: "Healthy and considered normal for most Indians." };
    return { label: "High", advice: "May mean stress or extra salt in diet. Reduce salt, eat fruits/veggies, practice deep breathing." };
}
function assessSpO2(oxygen) {
    const v = Number(oxygen);
    if (!v) return { label: "—", advice: "No oxygen value provided." };
    if (v < 94) return { label: "Low", advice: "May feel breathless or fatigued. Try sitting upright, doing deep breathing, or checking air quality." };
    return { label: "Normal", advice: "Healthy oxygen level." };
}
function assessPulse(bpm, isAthlete = false) {
    const v = Number(bpm);
    if (!v) return { label: "—", advice: "No pulse value provided." };
    if (v < 55 && !isAthlete) return { label: "Low", advice: "May feel weak or dizzy. Rest, hydrate, and eat a light snack." };
    if (v >= 60 && v <= 100) return { label: "Normal", advice: "Good: Resting heart rate is within normal range." };
    return { label: "High", advice: "Could be due to stress, caffeine, or dehydration. Drink water, slow your breathing, and rest." };
}
function assessTempF(t) {
    const v = Number(t);
    if (!v) return { label: "—", advice: "No temperature provided." };
    if (v < 95) return { label: "Low", advice: "Feeling cold, shivering. Keep warm, drink warm fluids." };
    if (v >= 97 && v <= 99) return { label: "Normal", advice: "Good: Within normal range." };
    return { label: "High", advice: "Fever. Rest, drink fluids, sponge with lukewarm water." };
}
function getSnellenEquivalent(line) {
    const lines = { 1: 200, 2: 100, 3: 70, 4: 50, 5: 40, 6: 30, 7: 25, 8: 20, 9: 15 };
    return lines[line] || "—";
}
function assessEyes(left, right) {
    if (!left && !right) {
        return { summary: "—", note: "No eyesight input provided.", comment: "Please provide eye test results for assessment." };
    }
    const leftSnellen = getSnellenEquivalent(left);
    const rightSnellen = getSnellenEquivalent(right);
    const summary = `Left: 20/${leftSnellen}, Right: 20/${rightSnellen}`;
    let leftComment = "",
        rightComment = "",
        combinedComment = "";
    if (leftSnellen !== "—") {
        if (leftSnellen <= 15) leftComment = "High: Better than normal eyesight, nothing to worry about.";
        else if (leftSnellen <= 40) leftComment = "Normal: Great vision in your left eye—keep it up!";
        else leftComment = "Low: Blurry vision. Use proper lighting, take blink breaks, consult eye doctor if needed.";
    }
    if (rightSnellen !== "—") {
        if (rightSnellen <= 15) rightComment = "High: Better than normal eyesight, nothing to worry about.";
        else if (rightSnellen <= 40) rightComment = "Normal: Excellent vision in your right eye—maintain healthy habits!";
        else rightComment = "Low: Blurry vision. Use proper lighting, take blink breaks, consult eye doctor if needed.";
    }
    const worseSnellen = Math.max(leftSnellen === "—" ? 0 : leftSnellen, rightSnellen === "—" ? 0 : rightSnellen);
    if (worseSnellen <= 15) combinedComment = "High: Better than normal eyesight, nothing to worry about.";
    else if (worseSnellen <= 40) combinedComment = "Normal: Both eyes are in great shape—keep nurturing your eye health!";
    else combinedComment = "Low: Blurry vision. Use proper lighting, take blink breaks, consult eye doctor if needed.";
    return {
        summary,
        note: combinedComment,
        comment: `${leftComment} ${rightComment} Overall, ${combinedComment}`,
    };
}
const generatePdfFromImage = (imageBase64, options = {}) => {
    return new Promise((resolve, reject) => {
        try {
            const config = {
                zoom: 0.65,
                margin: 24,
                showPageNumbers: false,
                maxPages: 4,
            };
            const doc = new PDFDocument({
                size: "A4",
                layout: "portrait",
                margin: config.margin,
                compress: true,
            });
            const buffers = [];
            doc.on("data", buffers.push.bind(buffers));
            doc.on("end", () => resolve(Buffer.concat(buffers)));
            const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
            const imageBuffer = Buffer.from(base64Data, "base64");
            const pageWidth = doc.page.width - config.margin * 2;
            const pageHeight = doc.page.height - config.margin * 2;
            const img = doc.openImage(imageBuffer);
            const baseScale = pageWidth / img.width;
            const scale = baseScale * config.zoom;
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;
            const totalPages = Math.min(Math.ceil(scaledHeight / pageHeight), config.maxPages);
            for (let i = 0; i < totalPages; i++) {
                if (i > 0) doc.addPage();
                doc.save();
                doc.rect(config.margin, config.margin, pageWidth, pageHeight).clip();
                const x = scaledWidth < pageWidth ? config.margin + (pageWidth - scaledWidth) / 2 : config.margin;
                doc.image(imageBuffer, x, config.margin - i * pageHeight, { width: scaledWidth, height: scaledHeight });
                doc.restore();
                if (config.showPageNumbers) {
                    doc.fontSize(9).fillColor("#666666").text(`Page ${i + 1} of ${totalPages}`, config.margin, doc.page.height - config.margin - 18, { width: pageWidth, align: "center" });
                }
            }
            doc.end();
        } catch (err) {
            reject(err);
        }
    });
};
function generateReportPdf(data, ecoStats) {
    return new Promise((resolve) => {
        const doc = new PDFDocument({ size: "A4", margin: 50 });
        const buffers = [];
        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => resolve(Buffer.concat(buffers)));
        const { patient, vitals } = data;
        const computed = {
            bp: assessBP(vitals.systolic, vitals.diastolic),
            oxygen: assessSpO2(vitals.oxygen),
            bpm: assessPulse(vitals.bpm, patient.isAthlete),
            temp: assessTempF(vitals.temperature),
            eyes: assessEyes(vitals.leftEye, vitals.rightEye),
        };
        function getColorForStatus(status) {
            if (status.includes("Normal") || status.includes("Good")) return "#22C55E";
            if (status.includes("Low") || status.includes("High")) return "#EF4444";
            return "#EAB308";
        }

        // Header background - off-white/cream gradient
        doc.rect(0, 0, 595.28, 150).fill("#FFF5F0");

        // Draw Reliv logo matching Logo.jsx exactly
        // Frontend: <span className="text-orange-500">Re</span><span className="text-black">lıv</span>
        // Orange dot on the ı character at top

        doc.fontSize(36).font("Helvetica-Bold");
        const logoY = 55;
        let currentX = 50;

        // "Re" in orange #F97316
        const reWidth = doc.widthOfString("Re");
        doc.fillColor("#F97316").text("Re", currentX, logoY, { lineBreak: false });
        currentX += reWidth;

        // "l" in black
        const lWidth = doc.widthOfString("l");
        doc.fillColor("#000000").text("l", currentX, logoY, { lineBreak: false });
        currentX += lWidth + 3; // Add 3pt space after "l"

        // Draw dotless "ı" stem in black
        const stemWidth = 3;
        const stemHeight = 19;
        const stemY = logoY + 9;
        doc.save();
        doc.fillColor("#000000").rect(currentX, stemY, stemWidth, stemHeight).fill();
        doc.restore();

        // Draw orange dot above the stem (matching Logo.jsx: 0.23em from top)
        const dotRadius = 3.2;
        const dotX = currentX + stemWidth / 2;
        const dotY = stemY - dotRadius * 1.5;
        doc.save();
        doc.fillColor("#F97316").circle(dotX, dotY, dotRadius).fill();
        doc.restore();

        currentX += stemWidth + 1;

        // "v" in black
        doc.fillColor("#000000").text("v", currentX, logoY, { lineBreak: false });

        doc.fontSize(18).fillColor("#FFFFFF").font("Helvetica").text("Health Screening Report", 0, 90, { align: "center" });
        doc.fillColor("#000000").fontSize(16).text("Patient Information", 50, 170);
        doc.moveTo(50, 195).lineTo(545.28, 195).stroke("#FDBA74");
        const col1X = 50,
            col2X = 300,
            currentY = 210;
        doc.fontSize(12);
        doc.font("Helvetica-Bold").text("Name:", col1X, currentY);
        doc.font("Helvetica").text(patient.name || "N/A", col1X + 50, currentY);
        doc.font("Helvetica-Bold").text("Age:", col2X, currentY);
        doc.font("Helvetica").text(patient.age || "N/A", col2X + 35, currentY);
        doc.font("Helvetica-Bold").text("Gender:", col1X, currentY + 20);
        doc.font("Helvetica").text(patient.gender || "N/A", col1X + 50, currentY + 20);
        doc.font("Helvetica-Bold").text("Phone:", col2X, currentY + 20);
        doc.font("Helvetica").text(patient.phone || "N/A", col2X + 45, currentY + 20);
        doc.font("Helvetica-Bold").text("Email:", col1X, currentY + 40);
        doc.font("Helvetica").text(patient.email || "N/A", col1X + 40, currentY + 40);
        let yPos = currentY + 80;
        doc.fontSize(16).text("Health Vitals", 50, yPos);
        doc.moveTo(50, yPos + 25).lineTo(545.28, yPos + 25).stroke("#FDBA74");
        yPos += 40;
        const vitalsCards = [
            { label: "Blood Pressure", value: `${vitals.systolic || "—"}/${vitals.diastolic || "—"} mmHg`, status: computed.bp.label, note: computed.bp.advice },
            { label: "Oxygen Saturation", value: `${vitals.oxygen || "—"} %`, status: computed.oxygen.label, note: computed.oxygen.advice },
            { label: "Pulse Rate", value: `${vitals.bpm || "—"} BPM`, status: computed.bpm.label, note: computed.bpm.advice },
            { label: "Body Temperature", value: `${vitals.temperature || "—"} °F`, status: computed.temp.label, note: computed.temp.advice },
            { label: "Visual Acuity", value: computed.eyes.summary, status: computed.eyes.note, note: computed.eyes.comment },
        ];
        const cardWidth = 240,
            cardHeight = 120,
            cardMargin = 15;
        const startXCol1 = 50,
            startXCol2 = startXCol1 + cardWidth + cardMargin;
        let cardIndex = 0;
        vitalsCards.forEach((vital) => {
            if (yPos + cardHeight > doc.page.height - 100) {
                doc.addPage();
                yPos = 50;
            }
            const xPos = cardIndex % 2 === 0 ? startXCol1 : startXCol2;
            doc.roundedRect(xPos, yPos, cardWidth, cardHeight, 10).fillAndStroke("#FFFFFF", "#E5E7EB");
            const textX = xPos + 10,
                textY = yPos + 10;
            doc.fontSize(10).fillColor("#6B7280").font("Helvetica").text(vital.label, textX, textY);
            doc.fontSize(24).fillColor("#111827").font("Helvetica-Bold").text(vital.value, textX, textY + 15);
            doc.fontSize(12).fillColor(getColorForStatus(vital.status)).font("Helvetica").text(vital.status, textX, textY + 45);
            doc.fontSize(10).fillColor("#000000").font("Helvetica").text(vital.note, textX, textY + 60, { width: cardWidth - 20 });
            if (cardIndex % 2 !== 0) yPos += cardHeight + 20;
            cardIndex++;
        });
        if (cardIndex % 2 !== 0) yPos += cardHeight + 20;
        doc.fontSize(8).fillColor("#9CA3AF").text("This report is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment.", 50, doc.page.height - 80, { align: "center", width: 495.28 });
        doc.text(`© ${new Date().getFullYear()} Reliv. All rights reserved.`, 50, doc.page.height - 65, { align: "center", width: 495.28 });
        if (ecoStats) {
            doc.text(`Fun Fact: Your digital choice saved ~${ecoStats.individual.water}L of water & ~${ecoStats.individual.co2}g of CO2. Collectively, our users have saved ~${ecoStats.total.water}L of water, ~${ecoStats.total.co2}g of CO2, and ~${ecoStats.total.paper} sheets of paper!`, 50, doc.page.height - 50, { align: "center", width: 495.28 });
        }
        doc.end();
    });
}
function generateReceiptPdf(data, ecoStats) {
    return new Promise((resolve) => {
        const doc = new PDFDocument({ size: "A4", margin: 50 });
        const buffers = [];
        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => resolve(Buffer.concat(buffers)));
        const { patient, cart, totalPrice, needsReport } = data;
        const brandColor = "#F97316",
            headerBgColor = "#FFF1EA",
            textColor = "#1F2937",
            lightTextColor = "#6B7280";

        // Soft off-white header background
        doc.rect(0, 0, doc.page.width, 130).fill("#FFF5F0");

        // Draw Reliv logo (matching Logo.jsx exactly)
        doc.fontSize(32).font("Helvetica-Bold");
        const logoStartX = 50;
        const logoY = 50;

        let currentX = logoStartX;

        // "Re" in orange #F97316
        const reWidth = doc.widthOfString("Re");
        doc.fillColor(brandColor).text("Re", currentX, logoY, { lineBreak: false });
        currentX += reWidth;

        // "l" in black
        const lWidth = doc.widthOfString("l");
        doc.fillColor(textColor).text("l", currentX, logoY, { lineBreak: false });
        currentX += lWidth + 3; // Add 3pt space after "l"

        // Draw dotless "ı" stem in black
        const stemWidth = 3;
        const stemHeight = 19;
        const stemY = logoY + 9;
        doc.save();
        doc.fillColor(textColor).rect(currentX, stemY, stemWidth, stemHeight).fill();
        doc.restore();

        // Draw orange dot above the stem (matching Logo.jsx: 0.23em from top)
        const dotRadius = 3.2;
        const dotX = currentX + stemWidth / 2;
        const dotY = stemY - dotRadius * 1.5;
        doc.save();
        doc.fillColor(brandColor).circle(dotX, dotY, dotRadius).fill();
        doc.restore();

        currentX += stemWidth + 1;

        // "v" in black
        doc.fillColor(textColor).text("v", currentX, logoY, { lineBreak: false });
        doc.fontSize(10).font("Helvetica").fillColor(lightTextColor).text("Your Personalized Health Checkup.", logoStartX, 85);
        doc.fontSize(18).font("Helvetica-Bold").fillColor(textColor).text("Purchase Receipt", 0, 65, { align: "right" });
        doc.fontSize(10).fillColor(lightTextColor).text(`Date: ${new Date().toLocaleDateString()}`, 0, 90, { align: "right" });
        doc.fontSize(14).font("Helvetica-Bold").fillColor(textColor).text("Billed To:", 50, 160);
        doc.font("Helvetica").fontSize(11).fillColor(lightTextColor);
        doc.text(patient.name || "N/A", 50, 180);
        doc.text(patient.email || "N/A", 50, 195);
        let tableTop = 220;
        const itemX = 50,
            qtyX = 300,
            priceX = 370,
            totalX = 460;
        const tableHeaderHeight = 25,
            rowHeight = 30;
        let y = tableTop + tableHeaderHeight;
        let i = 0;
        doc.rect(50, tableTop, 500, tableHeaderHeight).fill("#F3F4F6");
        doc.font("Helvetica-Bold").fontSize(10).fillColor(textColor);
        doc.text("ITEM", itemX + 10, tableTop + 8);
        doc.text("QTY", qtyX, tableTop + 8, { width: 60, align: "center" });
        doc.text("PRICE", priceX, tableTop + 8, { width: 80, align: "right" });
        doc.text("TOTAL", totalX, tableTop + 8, { width: 90, align: "right" });
        const items = [];
        if (needsReport) items.push({ name: "Health Checkup Report", quantity: 1, price: reportPrice });
        if (cart) items.push(...cart);
        items.forEach((item) => {
            if (y + rowHeight > doc.page.height - 100) {
                doc.addPage();
                y = 50;
                doc.rect(50, y, 500, tableHeaderHeight).fill("#F3F4F6");
                doc.font("Helvetica-Bold").fontSize(10).fillColor(textColor);
                doc.text("ITEM", itemX + 10, y + 8);
                doc.text("QTY", qtyX, y + 8, { width: 60, align: "center" });
                doc.text("PRICE", priceX, y + 8, { width: 80, align: "right" });
                doc.text("TOTAL", totalX, y + 8, { width: 90, align: "right" });
                y += tableHeaderHeight;
            }
            doc.rect(50, y, 500, rowHeight).fill(i % 2 === 0 ? "#FFFFFF" : "#F9FAFB");
            doc.font("Helvetica").fontSize(10).fillColor(textColor);
            doc.text(item.name, itemX + 10, y + 10, { width: 230 });
            // Support both cartQuantity (new format) and quantity (old format)
            const qty = item.cartQuantity || item.quantity;
            doc.text(qty.toString(), qtyX, y + 10, { width: 60, align: "center" });
            doc.text(`INR ${item.price.toFixed(2)}`, priceX, y + 10, { width: 80, align: "right" });
            doc.text(`INR ${(item.price * qty).toFixed(2)}`, totalX, y + 10, { width: 90, align: "right" });
            y += rowHeight;
            i++;
        });
        let totalY = y + 20;
        doc.font("Helvetica-Bold").fontSize(12).fillColor(textColor);
        doc.text("Total Paid:", 350, totalY, { width: 100, align: "right" });
        doc.fillColor(brandColor).text(`INR ${totalPrice.toFixed(2)}`, 450, totalY, { width: 100, align: "right" });
        doc.fontSize(10).font("Helvetica-Bold").fillColor(textColor).text("Thank you for your purchase!", 50, doc.page.height - 100, { align: "center", width: 495.28 });
        if (ecoStats) {
            doc.fontSize(8).fillColor(lightTextColor).text(`Fun Fact: Your digital choice saved ~${ecoStats.individual.water}L of water & ~${ecoStats.individual.co2}g of CO2. Collectively, our users have saved ~${ecoStats.total.water}L of water, ~${ecoStats.total.co2}g of CO2, and ~${ecoStats.total.paper} sheets of paper!`, 50, doc.page.height - 80, { align: "center", width: 495.28 });
        }
        doc.end();
    });
}

// Email transporter - gracefully handle missing credentials
let transporter = null;
let emailAvailable = false;

if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    try {
        transporter = nodemailer.createTransport({
            service: "gmail",
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
            pool: true,
            maxConnections: 20,
            rateLimit: 9,
            // Add connection timeout for cloud deployments
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 30000,
        });

        // Verify transporter on startup (non-blocking)
        transporter.verify()
            .then(() => {
                emailAvailable = true;
                log.info('✅ Email transporter verified and ready');
            })
            .catch((err) => {
                emailAvailable = false;
                log.warn('⚠️ Email transporter verification failed:', err.message);
                log.warn('Email features may be unreliable');
            });

        log.info('📧 Email transporter configured');
    } catch (err) {
        log.error('⚠️ Failed to create email transporter:', err.message);
        log.warn('Email features will be disabled');
    }
} else {
    log.warn('⚠️ Gmail credentials not configured - email features disabled');
}

// ── Customer Care email transporter (relivcustomercare@gmail.com) ──────────
// Set CUSTOMER_GMAIL_USER + CUSTOMER_GMAIL_PASS in .env / Render env vars.
// Falls back to the main transporter if the dedicated account isn't configured.
let customerTransporter = null;
if (process.env.CUSTOMER_GMAIL_USER && process.env.CUSTOMER_GMAIL_PASS) {
    try {
        customerTransporter = nodemailer.createTransport({
            service: "gmail",
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: { user: process.env.CUSTOMER_GMAIL_USER, pass: process.env.CUSTOMER_GMAIL_PASS },
            pool: true,
            maxConnections: 10,
            rateLimit: 9,
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 30000,
        });
        customerTransporter.verify()
            .then(() => log.info('✅ Customer Care email transporter ready'))
            .catch(err => log.warn('⚠️ Customer Care transporter verify failed:', err.message));
        log.info('📧 Customer Care transporter configured (relivcustomercare account)');
    } catch (err) {
        log.error('⚠️ Failed to create Customer Care transporter:', err.message);
        customerTransporter = null;
    }
} else {
    log.info('ℹ️  CUSTOMER_GMAIL_USER not set — customer emails will use main transporter');
}

// Helper function for safe email sending
async function sendEmailSafe(mailOptions) {
    if (!transporter) {
        log.warn('Email not available - skipping:', mailOptions.subject);
        return { success: false, reason: 'Email not configured' };
    }

    try {
        const result = await transporter.sendMail(mailOptions);
        emailAvailable = true;
        return { success: true, result };
    } catch (error) {
        emailAvailable = false;
        log.error('Email send failed:', error.message);
        return { success: false, reason: error.message };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// BACKEND HEALTH MONITORING SYSTEM
// ═══════════════════════════════════════════════════════════════════════════
let lastHealthCheck = { timestamp: Date.now(), status: 'healthy', failures: [] };
let lastAlertSent = 0; // Track when last alert was sent (deduplication)
const ALERT_COOLDOWN = 30 * 60 * 1000; // Only send alerts every 30 minutes max

async function performHealthCheck() {
    const failures = [];
    const timestamp = new Date().toISOString();

    log.info('🏥 Starting health check...');

    // 1. Test Database Connection
    try {
        if (!db || !dbConnected) throw new Error('Database not initialized');
        await db.command({ ping: 1 });
        dbConnected = true; // Update flag
        log.info('✅ Database: OK');
    } catch (err) {
        dbConnected = false;
        failures.push(`Database Connection Failed: ${err.message}`);
        log.error('❌ Database: FAILED', err.message);
        // Trigger background reconnection
        setTimeout(reconnectDB, 5000);
    }

    // 2. Test Kits Collection (Medicine Loading)
    try {
        if (!db || !dbConnected) throw new Error('Database not available');
        const kitsCollection = db.collection('kits');
        const kitsCount = await kitsCollection.countDocuments();
        if (kitsCount === 0) {
            failures.push('Kits Collection Empty: No medicine kits available in database');
            log.warn('⚠️ Kits: Empty collection');
        } else {
            log.info(`✅ Kits: ${kitsCount} items available`);
        }
    } catch (err) {
        failures.push(`Kits Loading Failed: ${err.message}`);
        log.error('❌ Kits: FAILED', err.message);
    }

    // 3. Test Email Service (GUARD against null transporter)
    try {
        if (!transporter) {
            throw new Error('Email transporter not configured');
        }
        await transporter.verify();
        emailAvailable = true;
        log.info('✅ Email Service: OK');
    } catch (err) {
        emailAvailable = false;
        failures.push(`Email Service Failed: Cannot send emails - ${err.message}`);
        log.error('❌ Email: FAILED', err.message);
    }

    // 4. Test Razorpay Connection
    try {
        if (!razorpay) throw new Error('Razorpay not initialized');
        // Just check if instance exists (actual API test would cost money)
        log.info('✅ Razorpay: OK');
    } catch (err) {
        failures.push(`Payment Gateway Issue: ${err.message}`);
        log.error('❌ Razorpay: FAILED', err.message);
    }

    // 5. Check MQTT Connection
    try {
        if (mqttClient && mqttClient.connected) {
            log.info('✅ MQTT: Connected');
        } else {
            failures.push('MQTT Disconnected: IoT device communication unavailable');
            log.warn('⚠️ MQTT: Disconnected');
        }
    } catch (err) {
        log.warn('⚠️ MQTT: Unable to check status');
    }

    lastHealthCheck = {
        timestamp: Date.now(),
        status: failures.length === 0 ? 'healthy' : 'unhealthy',
        failures: failures,
        checkedAt: timestamp
    };

    // Send alert email if there are failures (with deduplication)
    if (failures.length > 0) {
        const now = Date.now();
        // Only send alert if cooldown has passed (prevents email storm)
        if (now - lastAlertSent > ALERT_COOLDOWN) {
            await sendHealthAlertEmail(failures, timestamp);
            lastAlertSent = now;
        } else {
            log.warn(`⚠️ Health alert suppressed (cooldown active, ${Math.round((ALERT_COOLDOWN - (now - lastAlertSent)) / 60000)} min remaining)`);
        }
    } else {
        log.info('✅ All systems healthy');
    }

    return lastHealthCheck;
}

async function sendHealthAlertEmail(failures, timestamp) {
    // Guard against null transporter
    if (!transporter) {
        log.error('❌ Cannot send health alert - email not configured');
        return;
    }

    try {
        const failureList = failures.map((f, i) => `${i + 1}. ${f}`).join('\n');

        const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .failure { background: #fee2e2; padding: 10px; margin: 10px 0; border-left: 4px solid #dc2626; }
          .footer { background: #374151; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
          .timestamp { color: #6b7280; font-size: 14px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🚨 RELIV Backend Health Alert</h1>
          </div>
          <div class="content">
            <p><strong>Critical System Issues Detected</strong></p>
            <p>The following problems were found during the health check:</p>
            <div class="failure">
              <pre style="margin: 0; white-space: pre-wrap;">${failureList}</pre>
            </div>
            <p class="timestamp">Detected at: ${timestamp}</p>
            <p style="margin-top: 20px;"><strong>Immediate Action Required:</strong></p>
            <ul>
              <li>Check backend server logs</li>
              <li>Verify database connection</li>
              <li>Confirm email service credentials</li>
              <li>Test medicine kits API endpoint</li>
            </ul>
          </div>
          <div class="footer">
            <p style="margin: 0;">Reliv Health Monitoring System</p>
            <p style="margin: 5px 0 0 0;">Automated health checks run every 30 minutes</p>
          </div>
        </div>
      </body>
      </html>
    `;

        await transporter.sendMail({
            from: `"Reliv Health Monitor" <${process.env.GMAIL_USER}>`,
            to: ADMIN_ALERT_EMAIL,
            subject: `🚨 URGENT: Reliv Backend Issues Detected - ${failures.length} Problem(s)`,
            html: emailHtml,
            text: `RELIV BACKEND HEALTH ALERT\n\nCritical issues detected at ${timestamp}:\n\n${failureList}\n\nImmediate action required.`
        });

        log.info(`📧 Alert email sent to ${ADMIN_ALERT_EMAIL}`);
    } catch (err) {
        log.error('❌ Failed to send alert email:', err.message);
    }
}

// Start health monitoring
function startHealthMonitoring() {
    // Delay initial check by 30 seconds to allow services to initialize
    // (email transporter verify is async)
    setTimeout(() => {
        performHealthCheck().catch(err => log.error('Health check failed:', err));
    }, 30000);

    // Then run every 30 minutes
    setInterval(() => {
        performHealthCheck().catch(err => log.error('Health check failed:', err));
    }, HEALTH_CHECK_INTERVAL);

    log.info(`✅ Health monitoring scheduled (first check in 30s, then every ${HEALTH_CHECK_INTERVAL / 60000} minutes)`);
}

let cachedEcoStats = null;
const cacheTTL = 300000;
const DEFAULT_ECO_STATS = {
    total: { paper: 0, water: 0, co2: 0 },
    individual: { paper: 2, water: 20, co2: 18 }
};

async function getEcoStats() {
    // Return cached if available
    if (cachedEcoStats && Date.now() - cachedEcoStats.timestamp < cacheTTL) {
        return cachedEcoStats.data;
    }

    // Return defaults if DB not connected
    if (!dbConnected || !db) {
        log.warn('getEcoStats: DB not available, returning defaults');
        return DEFAULT_ECO_STATS;
    }

    try {
        const reportsCollection = db.collection("reports");
        const receiptsCollection = db.collection("receipts");
        const [reportCount, receiptCount] = await Promise.all([
            reportsCollection.countDocuments(),
            receiptsCollection.countDocuments()
        ]);
        const totalDocuments = reportCount + receiptCount;
        const PAPER_SAVED_PER_DOC = 2,
            WATER_SAVED_PER_DOC = 20,
            CO2_SAVED_PER_DOC = 18;
        cachedEcoStats = {
            timestamp: Date.now(),
            data: {
                total: { paper: totalDocuments * PAPER_SAVED_PER_DOC, water: totalDocuments * WATER_SAVED_PER_DOC, co2: totalDocuments * CO2_SAVED_PER_DOC },
                individual: { paper: PAPER_SAVED_PER_DOC, water: WATER_SAVED_PER_DOC, co2: CO2_SAVED_PER_DOC },
            },
        };
        return cachedEcoStats.data;
    } catch (err) {
        log.error('getEcoStats error:', err.message);
        return DEFAULT_ECO_STATS;
    }
}
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || "mqtts://8579448a15e74503b0abc9e934b8a469.s1.eu.hivemq.cloud:8883";
const MQTT_OPTIONS = {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    rejectUnauthorized: false,
};
const mqttClient = mqtt.connect(MQTT_BROKER_URL, {
    ...MQTT_OPTIONS,
    reconnectPeriod: 5000,
    connectTimeout: 30000,
    keepalive: 60
});

mqttClient.on("connect", () => {
    log.info("✅ MQTT connected to HiveMQ Cloud");
    mqttClient.subscribe("kiosk/response", { qos: 1 }, (err) => {
        if (err) log.error('MQTT subscribe error (kiosk/response):', err);
        else log.debug('Subscribed to kiosk/response');
    });
    mqttClient.subscribe("kiosk/sensor/#", { qos: 1 }, (err) => {
        if (err) log.error('MQTT subscribe error (kiosk/sensor/#):', err);
        else log.debug('Subscribed to kiosk/sensor/#');
    });
});

mqttClient.on("error", (err) => {
    log.error("❌ MQTT error:", err.message);
});

mqttClient.on("reconnect", () => {
    log.info("🔄 MQTT reconnecting...");
});

mqttClient.on("offline", () => {
    log.warn("⚠️ MQTT offline");
});

// MQTT message handler for sensor data
mqttClient.on("message", (topic, message) => {
    log.debug(`📡 MQTT [${topic}]: ${message.toString()}`);
});

// ═══════════════════════════════════════════════════════════════════════════
// DISPENSING SYSTEM — MQTT motor control (runs ONLY after payment)
// ═══════════════════════════════════════════════════════════════════════════
// Kit id → Motor number mapping:
//   Kit id 1 → Motor 1 (GPIO 18) — Women's Kit
//   Kit id 2 → Motor 2 (GPIO 19) — Travel Kit
//   Kit id 3 → Motor 3 (GPIO 21) — First Aid Kit
//
// ESP32 MQTT commands (exact format your ESP32 code expects):
//   Single:  {"motor":2,"quantity":3}
//   Multi:   {"commands":[{"motor":1,"quantity":2},{"motor":2,"quantity":1}]}

app.post("/api/dispense", async (req, res) => {
    try {
        const { cart } = req.body; // [{ id, cartQuantity, ... }]

        if (!Array.isArray(cart) || cart.length === 0) {
            return res.status(400).json({ ok: false, message: "No items to dispense" });
        }

        if (!mqttClient || !mqttClient.connected) {
            return res.status(503).json({ ok: false, message: "MQTT not connected. Dispenser offline." });
        }

        // Build commands from cart — kit id = motor number
        const commands = [];
        for (const item of cart) {
            const motor = Number(item.id);
            const qty = Number(item.cartQuantity);
            if (!motor || motor < 1 || motor > 3) continue;
            if (!qty || qty < 1 || qty > 10) continue;
            commands.push({ motor, quantity: qty });
        }

        if (commands.length === 0) {
            return res.status(400).json({ ok: false, message: "No valid kits to dispense" });
        }

        // Use single format for 1 kit, multi format for 2+ kits (matches ESP32 code)
        const payload = commands.length === 1
            ? JSON.stringify({ motor: commands[0].motor, quantity: commands[0].quantity })
            : JSON.stringify({ commands });

        mqttClient.publish("kiosk/relay/dispense", payload, { qos: 1 }, (err) => {
            if (err) {
                log.error("❌ MQTT dispense publish error:", err.message);
                return res.status(500).json({ ok: false, message: "Failed to send dispense command" });
            }
            log.info(`✅ Dispense sent: ${payload}`);
            return res.json({ ok: true, message: "Dispense commands sent", commands });
        });

    } catch (err) {
        log.error("❌ Dispense error:", err.message);
        res.status(500).json({ ok: false, message: "Dispense failed" });
    }
});

// Database availability middleware for critical routes
function requireDatabase(req, res, next) {
    if (!dbConnected || !db) {
        return res.status(503).json({
            ok: false,
            message: 'Database temporarily unavailable. Please try again in a moment.',
            retryAfter: 30
        });
    }
    next();
}

app.get("/api/kits", async (req, res) => {
    if (!dbConnected || !db) {
        return res.status(503).json({
            message: "Database temporarily unavailable",
            kits: [] // Return empty array so frontend doesn't break
        });
    }

    try {
        const kits = await db.collection("kits")
            .find({})
            .sort({ id: 1 })
            .toArray();
        res.json(kits);
    } catch (err) {
        console.error("Error fetching kits:", err);
        res.status(500).json({ message: "Failed to fetch kits" });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// FEEDBACK SUBMISSION - Send to admin email (hidden from users)
// ═══════════════════════════════════════════════════════════════════════════
const FEEDBACK_EMAIL = 'Mairagouher@gmail.com';

app.post("/api/feedback", async (req, res) => {
    try {
        const { name, role, stream, mood, positives, comment, submittedAt, collaboration } = req.body;

        // Build email content
        const moodEmojis = { 1: '😡 Very Bad', 3: '😐 Okay', 4: '🙂 Good', 5: '😊 Great', 6: '🤩 Excellent' };
        const moodText = moodEmojis[mood] || `Rating: ${mood}`;

        const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #FF7A00, #FFA14A); padding: 20px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">📋 New Kiosk Feedback</h1>
        </div>
        
        <div style="background: #fff; padding: 24px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 12px 0; font-weight: bold; color: #6b7280;">Name:</td>
              <td style="padding: 12px 0; color: #1f2937;">${name || 'Anonymous'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 12px 0; font-weight: bold; color: #6b7280;">Role:</td>
              <td style="padding: 12px 0; color: #1f2937;">${role}</td>
            </tr>
            ${stream ? `
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 12px 0; font-weight: bold; color: #6b7280;">Stream:</td>
              <td style="padding: 12px 0; color: #1f2937;">${stream}</td>
            </tr>
            ` : ''}
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 12px 0; font-weight: bold; color: #6b7280;">Mood Rating:</td>
              <td style="padding: 12px 0; color: #1f2937; font-size: 18px;">${moodText}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 12px 0; font-weight: bold; color: #6b7280;">Positives:</td>
              <td style="padding: 12px 0; color: #1f2937;">${positives?.join(', ') || 'None selected'}</td>
            </tr>
            ${comment ? `
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 12px 0; font-weight: bold; color: #6b7280;">Comment:</td>
              <td style="padding: 12px 0; color: #1f2937;">${comment}</td>
            </tr>
            ` : ''}
          </table>
          
          ${collaboration ? `
          <div style="margin-top: 20px; padding: 16px; background: #FFF7ED; border-radius: 8px; border-left: 4px solid #FF7A00;">
            <h3 style="margin: 0 0 12px 0; color: #B45309;">🤝 Wants to Collaborate!</h3>
            <p style="margin: 4px 0; color: #1f2937;"><strong>Email:</strong> ${collaboration.email || 'Not provided'}</p>
            <p style="margin: 4px 0; color: #1f2937;"><strong>Phone:</strong> ${collaboration.phone || 'Not provided'}</p>
          </div>
          ` : ''}
          
          <p style="margin-top: 20px; font-size: 12px; color: #9ca3af; text-align: center;">
            Submitted: ${new Date(submittedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
          </p>
        </div>
      </div>
    `;

        // Send email
        const emailResult = await sendEmailSafe({
            from: `"Reliv Kiosk" <${process.env.GMAIL_USER}>`,
            to: FEEDBACK_EMAIL,
            subject: `📋 Kiosk Feedback: ${moodText} from ${name || 'Anonymous'}`,
            html: emailContent
        });

        if (emailResult.success) {
            log.info(`✅ Feedback email sent for: ${name || 'Anonymous'}`);
            res.json({ ok: true, message: 'Feedback submitted successfully' });
        } else {
            log.warn(`⚠️ Feedback email failed: ${emailResult.reason}`);
            // Still return success to user - we don't want them to know about email issues
            res.json({ ok: true, message: 'Feedback received' });
        }

    } catch (err) {
        log.error('Feedback submission error:', err.message);
        res.status(500).json({ ok: false, message: 'Failed to submit feedback' });
    }
});

app.post("/api/kits", async (req, res) => {
    if (!dbConnected || !db) {
        return res.status(503).json({ ok: false, message: "Database temporarily unavailable" });
    }

    try {
        const kit = req.body;
        if (!kit.name || !kit.description || !kit.price || !kit.quantity || !kit.expiryDate) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Generate auto-incrementing ID
        const kitsCollection = db.collection("kits");
        const lastKit = await kitsCollection.find({}).sort({ id: -1 }).limit(1).toArray();
        const newId = lastKit.length > 0 ? lastKit[0].id + 1 : 1;

        const newKit = {
            id: newId,
            name: kit.name,
            description: kit.description,
            price: Number(kit.price),
            quantity: Number(kit.quantity),
            expiryDate: kit.expiryDate,
            folderUrl: kit.folderUrl || "",
            imageUrl: kit.imageUrl || "",
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await kitsCollection.insertOne(newKit);
        res.json({ ok: true, kit: newKit });
    } catch (err) {
        console.error("Error adding kit:", err);
        res.status(500).json({ message: "Failed to add kit" });
    }
});
app.patch("/api/kits/:id", async (req, res) => {
    if (!dbConnected || !db) {
        return res.status(503).json({ ok: false, message: "Database temporarily unavailable" });
    }

    try {
        const { id } = req.params;
        const numId = parseInt(id);
        if (isNaN(numId)) return res.status(400).json({ message: "Invalid kit ID" });

        // Build update object with only allowed fields
        const updateFields = {};
        if (req.body.name !== undefined) updateFields.name = req.body.name;
        if (req.body.description !== undefined) updateFields.description = req.body.description;
        if (req.body.price !== undefined) updateFields.price = Number(req.body.price);
        if (req.body.quantity !== undefined) updateFields.quantity = Number(req.body.quantity);
        if (req.body.expiryDate !== undefined) updateFields.expiryDate = req.body.expiryDate;
        if (req.body.folderUrl !== undefined) updateFields.folderUrl = req.body.folderUrl;
        if (req.body.imageUrl !== undefined) updateFields.imageUrl = req.body.imageUrl;

        updateFields.updatedAt = new Date();

        const result = await db.collection("kits").updateOne(
            { id: numId },
            { $set: updateFields }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Kit not found" });
        }

        // Return updated kit
        const updatedKit = await db.collection("kits").findOne({ id: numId });
        res.json({ ok: true, kit: updatedKit });
    } catch (err) {
        console.error("Error updating kit:", err);
        res.status(500).json({ message: "Failed to update kit" });
    }
});
app.patch("/api/kits/:id/image", async (req, res) => {
    if (!dbConnected || !db) {
        return res.status(503).json({ ok: false, message: "Database temporarily unavailable" });
    }

    try {
        const { id } = req.params;
        const { imageUrl } = req.body;
        const numId = parseInt(id);
        if (isNaN(numId)) return res.status(400).json({ message: "Invalid kit ID" });
        if (!imageUrl) return res.status(400).json({ message: "Missing imageUrl" });

        const result = await db.collection("kits").updateOne(
            { id: numId },
            { $set: { imageUrl, updatedAt: new Date() } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Kit not found" });
        }

        const updatedKit = await db.collection("kits").findOne({ id: numId });
        res.json({ ok: true, kit: updatedKit });
    } catch (err) {
        console.error("Error updating kit image:", err);
        res.status(500).json({ message: "Failed to update kit image" });
    }
});
app.delete("/api/kits/:id", async (req, res) => {
    if (!dbConnected || !db) {
        return res.status(503).json({ ok: false, message: "Database temporarily unavailable" });
    }

    try {
        const { id } = req.params;
        const numId = parseInt(id);
        if (isNaN(numId)) return res.status(400).json({ message: "Invalid kit ID" });
        const result = await db.collection("kits").deleteOne({ id: numId });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Kit not found" });
        }
        res.json({ ok: true });
    } catch (err) {
        console.error("Error deleting kit:", err);
        res.status(500).json({ message: "Failed to delete kit" });
    }
});
app.get("/api/report/:id/download", async (req, res) => {
    if (!dbConnected || !db) {
        return res.status(503).json({ error: "Database temporarily unavailable" });
    }

    try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid report ID" });
        const report = await db.collection("reports").findOne({ _id: new ObjectId(id) });
        if (!report) return res.status(404).json({ error: "Report not found" });
        const ecoStats = await getEcoStats();
        const pdfBuffer = await generateReportPdf(report, ecoStats);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=Reliv-Health-Report-${report.patient.name || "user"}.pdf`);
        res.send(pdfBuffer);
    } catch (err) {
        console.error("Error in /api/report/:id/download:", err);
        res.status(500).json({ error: "Server Error" });
    }
});
app.post("/api/qr-code", async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: "URL is required" });
        const qrCode = await QRCode.toDataURL(url);
        res.json({ qrCode });
    } catch (err) {
        console.error("Error generating QR code:", err);

        // Send critical alert to admin
        await sendCriticalErrorAlert('QR Code Generation', err, {
            requestedURL: req.body.url,
            endpoint: '/api/qr-code',
            timestamp: new Date().toISOString()
        }).catch(alertErr => log.error('Alert send failed:', alertErr));

        res.status(500).json({ error: "Failed to generate QR code" });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// QR SESSION TOKEN STORE — One-time opaque tokens for hiding real session IDs
// CRITICAL: Replace with Redis or MongoDB for production.
// In-memory storage loses all sessions on server restart and does NOT scale
// across multiple server instances.
// ═══════════════════════════════════════════════════════════════════════════
const qrSessions = new Map();
// Each entry: { sessionId, createdAt, used: false }

// Clean up expired QR session tokens every 5 minutes
setInterval(() => {
    const now = Date.now();
    const TTL = 10 * 60 * 1000; // 10 minutes
    for (const [token, session] of qrSessions.entries()) {
        if (now - session.createdAt > TTL) {
            qrSessions.delete(token);
        }
    }
}, 5 * 60 * 1000);

// Called by the kiosk when generating a QR code
app.post("/api/create-qr-session", (req, res) => {
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Referrer-Policy': 'no-referrer',
        'X-Content-Type-Options': 'nosniff',
    });
    try {
        const { sessionId } = req.body;
        if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

        // Generate a cryptographically secure opaque token (full UUID — 122-bit entropy)
        const token = crypto.randomUUID();

        qrSessions.set(token, {
            sessionId,
            createdAt: Date.now(),
            used: false,
        });

        // Auto-expire after 10 minutes
        setTimeout(() => qrSessions.delete(token), 10 * 60 * 1000);

        log.info(`🔑 QR session token created for session ${sessionId.slice(0, 8)}…`);
        res.json({ token });
    } catch (err) {
        console.error("Error creating QR session:", err);
        res.status(500).json({ error: "Failed to create QR session" });
    }
});

// Called by the phone when it opens /h?t=<token>
app.post("/api/validate-session", (req, res) => {
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Referrer-Policy': 'no-referrer',
        'X-Content-Type-Options': 'nosniff',
    });
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ error: 'token required' });

        const session = qrSessions.get(token);

        if (!session) {
            return res.status(404).json({ valid: false, reason: 'not_found' });
        }

        // Check if already used
        if (session.used) {
            return res.status(410).json({ valid: false, reason: 'already_used' });
        }

        // Check if expired (10 min TTL)
        if (Date.now() - session.createdAt > 10 * 60 * 1000) {
            qrSessions.delete(token);
            return res.status(410).json({ valid: false, reason: 'expired' });
        }

        // Mark as used (one-time only)
        session.used = true;

        log.info(`✅ QR session token validated for session ${session.sessionId.slice(0, 8)}…`);
        res.json({ valid: true, sessionId: session.sessionId });
    } catch (err) {
        console.error("Error validating session:", err);
        res.status(500).json({ error: "Failed to validate session" });
    }
});

// Customer data storage for QR entry
const customerDataStore = new Map(); // In production, use Redis or database

// Clean up old sessions every 5 minutes
setInterval(() => {
    const now = Date.now();
    const expiryTime = 30 * 60 * 1000; // 30 minutes

    for (const [sessionId, data] of customerDataStore.entries()) {
        if (now - data.timestamp > expiryTime) {
            customerDataStore.delete(sessionId);
        }
    }
}, 5 * 60 * 1000); // Run every 5 minutes

app.post("/api/save-customer-data", async (req, res) => {
    try {
        const { sessionId, customerData } = req.body;
        if (!sessionId || !customerData) {
            return res.status(400).json({ error: "Session ID and customer data are required" });
        }

        // Store data temporarily (in production, use proper storage)
        customerDataStore.set(sessionId, {
            ...customerData,
            timestamp: Date.now()
        });

        res.json({ success: true });
    } catch (err) {
        console.error("Error saving customer data:", err);
        res.status(500).json({ error: "Failed to save customer data" });
    }
});

app.post("/api/get-customer-data", async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) {
            return res.status(400).json({ error: "Session ID is required" });
        }

        const data = customerDataStore.get(sessionId);
        if (data) {
            // Clean up after retrieval
            customerDataStore.delete(sessionId);
            res.json({ customerData: data });
        } else {
            res.json({ customerData: null });
        }
    } catch (err) {
        console.error("Error retrieving customer data:", err);
        res.status(500).json({ error: "Failed to retrieve customer data" });
    }
});

// Health check endpoint (for monitoring)
app.get("/api/health", async (req, res) => {
    try {
        const health = await performHealthCheck();
        res.status(health.status === 'healthy' ? 200 : 503).json(health);
    } catch (err) {
        res.status(503).json({
            status: 'error',
            message: 'Health check failed',
            error: err.message
        });
    }
});

// Service status endpoint - shows which features are available
app.get("/api/status", (req, res) => {
    const IS_CLOUD = process.env.RENDER || process.env.HEROKU || process.env.VERCEL;

    res.json({
        status: 'running',
        environment: isDev ? 'development' : 'production',
        deployment: IS_CLOUD ? 'cloud' : 'local',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
            database: dbConnected,
            email: emailAvailable,
            payments: razorpayAvailable,
            googleDrive: googleDriveAvailable,
            mqtt: !!mqttClient?.connected,
            bleHardware: !IS_CLOUD // BLE only available locally
        },
        features: {
            healthReports: dbConnected,
            kitPurchase: dbConnected && razorpayAvailable,
            emailNotifications: emailAvailable,
            kitImages: googleDriveAvailable,
            weightMeasurement: !IS_CLOUD,
            bodyComposition: !IS_CLOUD
        },
        lastHealthCheck: {
            status: lastHealthCheck.status,
            timestamp: lastHealthCheck.checkedAt || null,
            failureCount: lastHealthCheck.failures?.length || 0
        }
    });
});

// Get report price (admin-adjustable, persisted in MongoDB)
app.get("/api/report-price", (req, res) => {
    res.json({ price: reportPrice });
});

// Update report price (admin only)
app.put("/api/report-price", async (req, res) => {
    try {
        const { price, password } = req.body;
        if (typeof price !== 'number' || price < 0) {
            return res.status(400).json({ ok: false, message: 'Invalid price' });
        }
        // Verify admin password
        if (!password) return res.status(401).json({ ok: false, message: 'Password required' });
        // Load credentials (same pattern as check-login)
        let credStore;
        if (dbConnected) {
            const doc = await db.collection('admin_credentials').findOne({ _id: 'admin_store' });
            credStore = doc && doc.data ? doc.data : {};
        } else {
            credStore = JSON.parse(await fs.readFile(CRED_STORE_FILE, 'utf8'));
        }
        const adminEmail = Object.keys(credStore)[0];
        if (!adminEmail) return res.status(401).json({ ok: false, message: 'No admin configured' });
        const admin = credStore[adminEmail];
        const hash = crypto.pbkdf2Sync(password, admin.salt, admin.iterations || 100000, admin.keyLen || 64, admin.digest || 'sha512').toString('hex');
        if (hash !== admin.hash) return res.status(401).json({ ok: false, message: 'Invalid password' });
        // Update in-memory
        reportPrice = price;
        // Persist to MongoDB
        if (dbConnected) {
            await db.collection('settings').updateOne(
                { key: 'report_price' },
                { $set: { key: 'report_price', value: price, updatedAt: new Date() } },
                { upsert: true }
            );
        }
        log.info(`✅ Report price updated to ₹${price} by admin`);
        res.json({ ok: true, price: reportPrice });
    } catch (err) {
        log.error('Error updating report price:', err);
        res.status(500).json({ ok: false, message: 'Server error' });
    }
});

app.post("/api/create-order", async (req, res) => {
    // Check if Razorpay is configured
    if (!razorpay || !razorpayAvailable) {
        return res.status(503).json({
            error: "Payment service not available",
            message: "Please try again later or contact support"
        });
    }

    try {
        const { amount } = req.body;
        if (!amount || isNaN(amount)) {
            return res.status(400).json({ error: "Valid amount is required" });
        }
        const options = {
            amount: amount * 100,
            currency: "INR",
            receipt: `receipt_order_${Date.now()}`,
            payment_capture: 1,
        };
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (err) {
        console.error("Error in /api/create-order:", err);

        // Send critical alert to admin (if email is available)
        if (transporter) {
            sendCriticalErrorAlert('Payment Order Creation', err, {
                requestedAmount: req.body.amount,
                endpoint: '/api/create-order',
                timestamp: new Date().toISOString()
            }).catch(alertErr => log.error('Alert send failed:', alertErr));
        }

        res.status(500).json({ error: "Server Error" });
    }
});
app.get("/api/eco-stats", async (req, res) => {
    try {
        const ecoStats = await getEcoStats();
        res.json(ecoStats);
    } catch (err) {
        console.error("Error in /api/eco-stats:", err);
        res.status(500).json({ error: "Failed to fetch eco stats" });
    }
});

// ── Razorpay payment signature verification (HMAC-SHA256) ─────────────────
// Must be called from client after Razorpay handler fires.
// If signature is invalid we reject — prevents fake/replayed payments.
app.post("/api/verify-payment", (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ ok: false, message: "Missing payment verification fields" });
        }
        if (!process.env.RAZORPAY_KEY_SECRET) {
            return res.status(503).json({ ok: false, message: "Payment verification not configured" });
        }
        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");
        if (expectedSignature !== razorpay_signature) {
            log.warn(`🔴 Payment signature mismatch — possible fraud. order: ${razorpay_order_id}`);
            return res.status(400).json({ ok: false, message: "Payment verification failed" });
        }
        res.json({ ok: true });
    } catch (err) {
        log.error("❌ Payment verification error:", err.message);
        res.status(500).json({ ok: false, message: "Verification error" });
    }
});

// Email configuration test endpoint
app.get("/api/email-test", async (req, res) => {
    try {
        const emailConfigured = !!(process.env.GMAIL_USER && process.env.GMAIL_PASS);

        if (!emailConfigured) {
            return res.status(500).json({
                ok: false,
                message: "Email credentials not configured",
                gmailUser: !!process.env.GMAIL_USER,
                gmailPass: !!process.env.GMAIL_PASS
            });
        }

        // Try to verify transporter
        await transporter.verify();

        res.json({
            ok: true,
            message: "Email service configured and ready",
            gmailUser: process.env.GMAIL_USER?.replace(/(.{3}).*(@.*)/, '$1***$2') // Mask email
        });
    } catch (err) {
        log.error("❌ Email verification failed:", err.message);
        res.status(500).json({
            ok: false,
            message: "Email service configuration error: " + err.message
        });
    }
});

app.post("/api/send-report", async (req, res) => {
    try {
        log.info('📧 Received email send request');
        const { to, name, healthData, reportImage } = req.body;

        if (!to || !healthData) {
            log.error('❌ Missing required fields:', { to: !!to, healthData: !!healthData });
            return res.status(400).json({ ok: false, message: "Missing email or health data" });
        }

        log.info('📨 Sending report to:', to);

        // Check if transporter is configured
        if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
            log.error('❌ Email credentials not configured');
            return res.status(500).json({ ok: false, message: "Email service not configured" });
        }

        const ecoStats = await getEcoStats();
        const pdfBuffer = reportImage ? await generatePdfFromImage(reportImage) : await generateReportPdf(healthData, ecoStats);
        const MAX_SIZE = 24 * 1024 * 1024;

        if (pdfBuffer.length > MAX_SIZE) {
            log.error(`❌ Report PDF too large: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);
            return res.status(413).json({ ok: false, message: "Report PDF exceeds 24MB email limit" });
        }

        log.info(`📄 PDF generated: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);

        const mailOptions = {
            from: `Reliv Reports <${process.env.GMAIL_USER}>`,
            to,
            subject: `Your Health Report from Reliv, ${name || "User"}`,
            text: `Hi ${name || "User"},\n\nPlease find your health report attached.\n\nBest,\nThe Reliv Team`,
            attachments: [
                {
                    filename: `Reliv-Health-Report-${name || "user"}.pdf`,
                    content: pdfBuffer,
                    contentType: "application/pdf",
                },
            ],
        };

        log.info('📮 Attempting to send email via Gmail SMTP...');
        await transporter.sendMail(mailOptions);
        log.info('✅ Email sent successfully to:', to);

        res.json({ ok: true, message: "Report sent successfully" });
    } catch (err) {
        log.error("❌ Send report error:", err.message);
        log.error("Stack trace:", err.stack);

        // Send critical alert to admin
        await sendCriticalErrorAlert('Report Email', err, {
            userEmail: req.body.to,
            userName: req.body.name,
            endpoint: '/api/send-report',
            hasHealthData: !!req.body.healthData,
            timestamp: new Date().toISOString()
        }).catch(alertErr => log.error('Alert send failed:', alertErr));

        res.status(500).json({ ok: false, message: err.message || "Failed to send report" });
    }
});

// Function to send critical operation failure alert to admin
async function sendCriticalErrorAlert(operation, error, context = {}) {
    // Check if email is available
    if (!transporter) {
        log.error(`❌ Critical error in ${operation} (email not available):`, error.message);
        console.error('═══════════════════════════════════════════════');
        console.error('🚨 CRITICAL ERROR (email alerts disabled)');
        console.error(`Operation: ${operation}`);
        console.error(`Error: ${error.message}`);
        console.error('═══════════════════════════════════════════════');
        return;
    }

    try {
        const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

        const contextInfo = Object.entries(context)
            .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
            .join('\n');

        const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .error-box { background: #fee2e2; padding: 15px; margin: 15px 0; border-left: 4px solid #dc2626; border-radius: 4px; }
          .context-box { background: #f3f4f6; padding: 15px; margin: 15px 0; border-radius: 4px; font-family: monospace; font-size: 12px; }
          .footer { background: #374151; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
          .operation { color: #f59e0b; font-weight: bold; font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🚨 RELIV Critical Function Failure</h1>
          </div>
          <div class="content">
            <p><strong>Operation Failed:</strong> <span class="operation">${operation}</span></p>
            <p><strong>Time:</strong> ${timestamp}</p>
            
            <div class="error-box">
              <h3 style="margin-top: 0; color: #991b1b;">Error Details:</h3>
              <pre style="margin: 0; white-space: pre-wrap; color: #1f2937;">${error.message || error}</pre>
              ${error.stack ? `<details style="margin-top: 10px;"><summary style="cursor: pointer; color: #6b7280;">Stack Trace</summary><pre style="font-size: 11px; color: #6b7280; margin-top: 5px;">${error.stack}</pre></details>` : ''}
            </div>
            
            ${contextInfo ? `
            <div class="context-box">
              <strong>Context:</strong><br>
              ${contextInfo.replace(/\n/g, '<br>')}
            </div>
            ` : ''}
            
            <p style="margin-top: 20px;"><strong>Impact:</strong></p>
            <ul style="color: #dc2626;">
              <li>${operation === 'Report Email' ? 'User paid but did not receive health report PDF' : ''}</li>
              <li>${operation === 'Receipt Email' ? 'User purchased kits but did not receive receipt' : ''}</li>
              <li>${operation === 'QR Code Generation' ? 'System unable to generate QR codes for payment/links' : ''}</li>
              <li>${operation === 'Payment Order Creation' ? 'Users cannot complete payments' : ''}</li>
              <li>User experience severely impacted - may require manual intervention</li>
            </ul>
            
            <p style="margin-top: 20px;"><strong>Recommended Actions:</strong></p>
            <ul>
              <li>Check backend server logs immediately</li>
              <li>Verify ${operation === 'Report Email' || operation === 'Receipt Email' ? 'email service (GMAIL_USER, GMAIL_PASS)' : ''}</li>
              <li>Verify ${operation === 'QR Code Generation' ? 'QRCode library installation' : ''}</li>
              <li>Verify ${operation === 'Payment Order Creation' ? 'Razorpay credentials' : ''}</li>
              <li>Test endpoint manually: <code>${context.endpoint || 'N/A'}</code></li>
              ${context.userEmail ? `<li>Contact user: ${context.userEmail} with apology</li>` : ''}
            </ul>
          </div>
          <div class="footer">
            <p style="margin: 0;">Reliv Critical Operations Monitor</p>
            <p style="margin: 5px 0 0 0;">Automated alert triggered by backend failure</p>
          </div>
        </div>
      </body>
      </html>
    `;

        await transporter.sendMail({
            from: `"Reliv Critical Alerts" <${process.env.GMAIL_USER}>`,
            to: ADMIN_ALERT_EMAIL,
            subject: `🚨 URGENT: ${operation} Failed - Immediate Action Required`,
            html: emailHtml,
            text: `RELIV CRITICAL FAILURE\n\nOperation: ${operation}\nTime: ${timestamp}\n\nError: ${error.message || error}\n\nContext:\n${contextInfo}\n\nCheck backend logs immediately.`,
            priority: 'high'
        });

        log.info(`📧 Critical error alert sent to ${ADMIN_ALERT_EMAIL} for: ${operation}`);
    } catch (alertErr) {
        log.error('❌ Failed to send critical error alert:', alertErr.message);
        // If we can't even send alerts, log to console loudly
        console.error('═══════════════════════════════════════════════');
        console.error('🚨 CRITICAL: ALERT SYSTEM FAILURE');
        console.error(`Original error: ${error.message}`);
        console.error(`Alert send error: ${alertErr.message}`);
        console.error('═══════════════════════════════════════════════');
    }
}

// Function to send low stock notification to admin
async function sendInventoryAlert(alerts) {
    // Check if email is available
    if (!transporter) {
        log.warn('Email not available - skipping inventory alert');
        return;
    }

    try {
        const ADMIN_EMAIL = "khanfaizan3234@gmail.com";

        // Filter alerts by type
        const lowStockKits = alerts.filter(a => a.type === 'lowstock');
        const outOfStockKits = alerts.filter(a => a.type === 'outofstock');
        const expiredKits = alerts.filter(a => a.type === 'expired');

        if (lowStockKits.length === 0 && outOfStockKits.length === 0 && expiredKits.length === 0) {
            return; // Nothing to report
        }

        // Create email body sections
        let htmlSections = '';
        let textSections = '';

        if (outOfStockKits.length > 0) {
            const outOfStockList = outOfStockKits.map(kit =>
                `• ${kit.name} - QUANTITY: ${kit.currentQuantity}`
            ).join('\n');
            htmlSections += `
        <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #dc2626;">
          <h3 style="color: #991b1b; margin-top: 0;">🚨 OUT OF STOCK (${outOfStockKits.length})</h3>
          <pre style="font-family: monospace; color: #1f2937; margin: 0; white-space: pre-wrap;">${outOfStockList}</pre>
        </div>
      `;
            textSections += `\n🚨 OUT OF STOCK (${outOfStockKits.length}):\n${outOfStockList}\n`;
        }

        if (lowStockKits.length > 0) {
            const lowStockList = lowStockKits.map(kit =>
                `• ${kit.name} - Quantity: ${kit.currentQuantity}`
            ).join('\n');
            htmlSections += `
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f59e0b;">
          <h3 style="color: #92400e; margin-top: 0;">⚠️ LOW STOCK (${lowStockKits.length})</h3>
          <pre style="font-family: monospace; color: #1f2937; margin: 0; white-space: pre-wrap;">${lowStockList}</pre>
        </div>
      `;
            textSections += `\n⚠️ LOW STOCK (${lowStockKits.length}):\n${lowStockList}\n`;
        }

        if (expiredKits.length > 0) {
            const expiredList = expiredKits.map(kit =>
                `• ${kit.name} - Expired: ${new Date(kit.expiryDate).toLocaleDateString('en-IN')} - Quantity: ${kit.currentQuantity}`
            ).join('\n');
            htmlSections += `
        <div style="background: #fce7f3; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #db2777;">
          <h3 style="color: #831843; margin-top: 0;">❌ EXPIRED ITEMS (${expiredKits.length})</h3>
          <pre style="font-family: monospace; color: #1f2937; margin: 0; white-space: pre-wrap;">${expiredList}</pre>
        </div>
      `;
            textSections += `\n❌ EXPIRED ITEMS (${expiredKits.length}):\n${expiredList}\n`;
        }

        const mailOptions = {
            from: `Reliv Inventory Alert <${process.env.GMAIL_USER}>`,
            to: ADMIN_EMAIL,
            subject: `🔔 Inventory Alert - ${outOfStockKits.length} Out of Stock, ${lowStockKits.length} Low Stock, ${expiredKits.length} Expired`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 20px; border-radius: 10px 10px 0 0;">
            <h2 style="color: white; margin: 0;">🏥 Reliv Inventory Alert</h2>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #374151;">Immediate action required for the following inventory issues:</p>
            ${htmlSections}
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              <strong>Action Required:</strong> Please address these inventory issues immediately to ensure continuous kiosk availability.
            </p>
            <p style="font-size: 12px; color: #9ca3af; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
              This is an automated notification from your Reliv Health Kiosk system.<br/>
              Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
            </p>
          </div>
        </div>
      `,
            text: `
RELIV INVENTORY ALERT

Immediate action required for the following inventory issues:
${textSections}
Action Required: Please address these inventory issues immediately to ensure continuous kiosk availability.

Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

---
This is an automated notification from your Reliv Health Kiosk system.
      `
        };

        await transporter.sendMail(mailOptions);
        console.log(`📧 Inventory alert sent to ${ADMIN_EMAIL}: ${outOfStockKits.length} out of stock, ${lowStockKits.length} low stock, ${expiredKits.length} expired`);
    } catch (error) {
        console.error("Error sending inventory alert:", error);
        // Don't throw error - we don't want to fail the operation if notification fails
    }
}

// Backward compatibility wrapper
async function sendLowStockNotification(lowStockKits) {
    const alerts = lowStockKits.map(kit => ({
        ...kit,
        type: kit.currentQuantity === 0 ? 'outofstock' : 'lowstock'
    }));
    await sendInventoryAlert(alerts);
}

// Proactive inventory monitoring - checks for expired items automatically
async function checkInventoryExpiration() {
    try {
        if (!db || !dbConnected) {
            log.warn('Skipping expiry check - database not connected');
            return;
        }

        const kitsCollection = db.collection("kits");
        const now = new Date();

        // Find all expired kits using $expr for proper date comparison
        // This handles both Date objects and ISO strings properly
        const allKits = await kitsCollection.find({}).toArray();
        const expiredKits = allKits.filter(kit => {
            const expiryDate = new Date(kit.expiryDate);
            return expiryDate < now;
        });

        if (expiredKits.length > 0) {
            log.warn(`Found ${expiredKits.length} expired kit(s) in inventory`);

            const alerts = expiredKits.map(kit => ({
                name: kit.name,
                currentQuantity: kit.quantity,
                expiryDate: kit.expiryDate,
                type: 'expired'
            }));

            // Send alert email
            await sendInventoryAlert(alerts);

            log.info('✅ Expiry alerts sent successfully');
        } else {
            log.debug('No expired items found in inventory');
        }
    } catch (error) {
        log.error('Error checking inventory expiration:', error);
    }
}

// Start periodic inventory checks
function startInventoryMonitoring() {
    // Run immediately on startup
    checkInventoryExpiration();

    // Then run every hour (3600000 ms)
    setInterval(checkInventoryExpiration, 3600000);

    log.info('✅ Inventory expiration monitoring started (checking every hour)');
}

app.post("/api/send-receipt", async (req, res) => {
    try {
        // DB Guard - prevent crash when DB is reconnecting
        if (!dbConnected || !db) {
            return res.status(503).json({ ok: false, message: "Database temporarily unavailable" });
        }

        const { patient, cart, totalPrice, needsReport } = req.body;
        if (!patient || !patient.email) return res.status(400).json({ ok: false, message: "Missing patient email" });
        if (!needsReport && (!cart || cart.length === 0 || !totalPrice)) return res.status(400).json({ ok: false, message: "Missing cart items for purchase" });

        const kitsCollection = db.collection("kits");
        const inventoryAlerts = []; // Track kits that need alerts

        for (const item of cart || []) {
            const kit = await kitsCollection.findOne({ id: parseInt(item.id) });

            if (!kit) {
                log.error(`❌ Kit not found in database: ID ${item.id}`);
                return res.status(404).json({ ok: false, message: `Kit not found: ${item.name || item.id}` });
            }

            // Support both cartQuantity (new format) and quantity (old format)
            const purchaseQty = item.cartQuantity || item.quantity;

            if (!purchaseQty || purchaseQty <= 0) {
                log.error(`❌ Invalid purchase quantity for kit ${item.id}: ${purchaseQty}`);
                return res.status(400).json({ ok: false, message: `Invalid quantity for ${kit.name}` });
            }

            if (kit.quantity < purchaseQty) {
                log.warn(`⚠️ Insufficient stock for kit ${kit.name}: requested ${purchaseQty}, available ${kit.quantity}`);
                return res.status(400).json({
                    ok: false,
                    message: `Insufficient stock for ${kit.name}. Only ${kit.quantity} available, you requested ${purchaseQty}.`
                });
            }

            // Atomic update with condition to prevent race conditions
            const updateResult = await kitsCollection.updateOne(
                { id: parseInt(item.id), quantity: { $gte: purchaseQty } }, // Only update if still enough stock
                {
                    $inc: {
                        quantity: -purchaseQty,
                        totalPurchases: purchaseQty  // Track total purchases for "Most Chosen" badge
                    },
                    $set: { updatedAt: new Date() }
                }
            );

            // Check if update actually happened (prevents race condition)
            if (updateResult.matchedCount === 0) {
                log.error(`❌ Race condition detected for kit ${item.id} - stock changed during transaction`);
                return res.status(409).json({
                    ok: false,
                    message: `Stock for ${kit.name} changed during checkout. Please refresh and try again.`
                });
            }

            // Check for inventory alerts: expired, out of stock (0), or reaches 1
            const updatedKit = await kitsCollection.findOne({ id: parseInt(item.id) });
            if (updatedKit) {
                const isExpired = new Date(updatedKit.expiryDate) < new Date();

                // Check if expired
                if (isExpired) {
                    inventoryAlerts.push({
                        name: updatedKit.name,
                        currentQuantity: updatedKit.quantity,
                        expiryDate: updatedKit.expiryDate,
                        type: 'expired'
                    });
                }

                // Check if out of stock (quantity = 0)
                if (updatedKit.quantity === 0) {
                    inventoryAlerts.push({
                        name: updatedKit.name,
                        currentQuantity: updatedKit.quantity,
                        type: 'outofstock'
                    });
                }
                // Check if quantity reaches 1
                else if (updatedKit.quantity === 1) {
                    inventoryAlerts.push({
                        name: updatedKit.name,
                        currentQuantity: updatedKit.quantity,
                        type: 'lowstock'
                    });
                }
            }
        }

        await db.collection("receipts").insertOne({ patient, cart, totalPrice, needsReport, createdAt: new Date() });
        console.log("🧾 Receipt saved");

        const ecoStats = await getEcoStats();
        const pdfBuffer = await generateReceiptPdf({ patient, cart, totalPrice, needsReport }, ecoStats);

        const mailOptions = {
            from: `Reliv Receipts <${process.env.GMAIL_USER}>`,
            to: patient.email,
            subject: "Your Receipt from Reliv",
            text: `Hi ${patient.name || "User"},\n\nPlease find your purchase receipt attached.\n\nBest,\nThe Reliv Team`,
            attachments: [{ filename: "Reliv-Receipt.pdf", content: pdfBuffer, contentType: "application/pdf" }],
        };

        await transporter.sendMail(mailOptions);
        console.log(`Receipt sent to ${patient.email}`);

        // Send inventory alerts if any issues detected
        if (inventoryAlerts.length > 0) {
            await sendInventoryAlert(inventoryAlerts);
        }

        res.json({ ok: true });
    } catch (err) {
        console.error("Error in /api/send-receipt:", err);

        // Send critical alert to admin
        await sendCriticalErrorAlert('Receipt Email', err, {
            userEmail: req.body.patient?.email,
            userName: req.body.patient?.name,
            endpoint: '/api/send-receipt',
            cartItems: req.body.cart?.length || 0,
            totalPrice: req.body.totalPrice,
            timestamp: new Date().toISOString()
        }).catch(alertErr => log.error('Alert send failed:', alertErr));

        res.status(500).json({ ok: false, message: "Failed to send receipt" });
    }
});
// BLE endpoints - Only work when running locally with Raspberry Pi
// On Render these gracefully return "not available" without crashing
// Note: IS_CLOUD_DEPLOYMENT and BLE_BACKEND_URL are defined at the top of the file

app.get("/api/weight", async (req, res) => {
    // Skip BLE calls on cloud deployments - they will always fail
    if (IS_CLOUD_DEPLOYMENT) {
        return res.status(200).json({
            weight: null,
            impedance: null,
            status: "unavailable",
            message: "BLE hardware not available on cloud deployment"
        });
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000); // 3 second timeout

        const response = await fetch(`${BLE_BACKEND_URL}/api/weight`, { signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        // Don't log errors on cloud - expected behavior
        if (!IS_CLOUD_DEPLOYMENT) {
            log.error("Error fetching weight from BLE backend:", error.message);
        }
        res.status(200).json({
            weight: null,
            impedance: null,
            status: "unavailable",
            message: "BLE backend not responding"
        });
    }
});

app.get("/api/get-device-data", async (req, res) => {
    // Skip BLE calls on cloud deployments
    if (IS_CLOUD_DEPLOYMENT) {
        return res.status(200).json({
            error: null,
            status: "unavailable",
            message: "BLE hardware not available on cloud deployment"
        });
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(`${BLE_BACKEND_URL}/get_ble_data`, { signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        if (!IS_CLOUD_DEPLOYMENT) {
            log.error("Error in /api/get-device-data:", error.message);
        }
        res.status(200).json({
            error: null,
            status: "unavailable",
            message: "BLE backend not responding"
        });
    }
});
async function ensureDataDir() {
    await fs.mkdir(DATA_DIR, { recursive: true }).catch(() => { });
}

// ============================================
// ADMIN AUTH STORAGE (MongoDB-first with file fallback)
// ============================================

// One-time migration: sync file-based admin data to MongoDB
async function migrateAdminDataToMongo() {
    if (!dbConnected || !db) return;

    try {
        // Check if migration already done
        const migrationFlag = await db.collection('admin_credentials').findOne({ _id: 'admin_store' });
        if (migrationFlag && migrationFlag.data && Object.keys(migrationFlag.data).length > 0) {
            log.info('✅ Admin credentials already in MongoDB');
            return; // Already migrated
        }

        // Migrate credentials from file
        try {
            const credContent = await fs.readFile(CRED_STORE_FILE, "utf8");
            const credentials = credContent ? JSON.parse(credContent) : {};
            if (Object.keys(credentials).length > 0) {
                await db.collection('admin_credentials').updateOne(
                    { _id: 'admin_store' },
                    { $set: { data: credentials, migratedAt: new Date() } },
                    { upsert: true }
                );
                log.info(`✅ Migrated ${Object.keys(credentials).length} admin credential(s) to MongoDB`);
            }
        } catch (err) {
            log.info('No existing credentials file to migrate');
        }

        // Migrate reset tokens from file (usually empty, but just in case)
        try {
            const tokenContent = await fs.readFile(TOKEN_STORE_FILE, "utf8");
            const tokens = tokenContent ? JSON.parse(tokenContent) : {};
            if (Object.keys(tokens).length > 0) {
                await db.collection('admin_reset_tokens').updateOne(
                    { _id: 'admin_store' },
                    { $set: { data: tokens, migratedAt: new Date() } },
                    { upsert: true }
                );
                log.info(`✅ Migrated ${Object.keys(tokens).length} reset token(s) to MongoDB`);
            }
        } catch (err) {
            // No tokens file - that's fine
        }
    } catch (err) {
        log.error('Admin data migration failed:', err.message);
        // Non-fatal - will use file fallback
    }
}

// Load admin data from MongoDB first, fall back to file
async function loadAdminData(collection, filePath) {
    // Try MongoDB first (persistent across deploys)
    if (dbConnected && db) {
        try {
            const doc = await db.collection(collection).findOne({ _id: 'admin_store' });
            if (doc && doc.data) {
                return doc.data;
            }
        } catch (err) {
            log.error(`MongoDB load failed for ${collection}:`, err.message);
        }
    }

    // Fall back to file (for initial data or when DB is down)
    try {
        const content = await fs.readFile(filePath, "utf8");
        const data = content ? JSON.parse(content) : {};

        // If we loaded from file and DB is available, sync to DB
        if (dbConnected && db && Object.keys(data).length > 0) {
            await db.collection(collection).updateOne(
                { _id: 'admin_store' },
                { $set: { data, updatedAt: new Date() } },
                { upsert: true }
            ).catch(err => log.error('Failed to sync to MongoDB:', err.message));
        }

        return data;
    } catch (e) {
        return {};
    }
}

// Save admin data to MongoDB first, then file as backup
async function saveAdminData(collection, filePath, data) {
    let savedToMongo = false;

    // Try MongoDB first (persistent across deploys)
    if (dbConnected && db) {
        try {
            await db.collection(collection).updateOne(
                { _id: 'admin_store' },
                { $set: { data, updatedAt: new Date() } },
                { upsert: true }
            );
            savedToMongo = true;
            log.info(`✅ Admin data saved to MongoDB: ${collection}`);
        } catch (err) {
            log.error(`MongoDB save failed for ${collection}:`, err.message);
        }
    }

    // Also save to file as backup (helps with local dev)
    try {
        await ensureDataDir();
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
    } catch (err) {
        // File save failed - only error if MongoDB also failed
        if (!savedToMongo) {
            throw new Error(`Failed to save admin data: MongoDB unavailable and file write failed`);
        }
    }
}

// Wrapper functions for backward compatibility
async function loadJsonSafe(filePath) {
    // Determine collection name from file path
    const collection = filePath.includes('reset_tokens') ? 'admin_reset_tokens' : 'admin_credentials';
    return loadAdminData(collection, filePath);
}

async function saveJsonSafe(filePath, obj) {
    const collection = filePath.includes('reset_tokens') ? 'admin_reset_tokens' : 'admin_credentials';
    return saveAdminData(collection, filePath, obj);
}
app.post("/api/save-report", async (req, res) => {
    if (!dbConnected || !db) {
        return res.status(503).json({ ok: false, message: "Database temporarily unavailable" });
    }

    try {
        const { healthData, bodyCompositionData, scanId } = req.body;
        if (!healthData || !healthData.patient || !healthData.patient.email || !healthData.vitals) {
            return res.status(400).json({ ok: false, message: "Missing data. Expected { healthData: { patient, vitals } }" });
        }
        if (scanId) {
            const existing = await db.collection("reports").findOne({ scanId });
            if (existing) {
                return res.json({ ok: true, duplicate: true });
            }
        }
        const reportDoc = {
            patient: healthData.patient,
            vitals: healthData.vitals,
            bodyComposition: bodyCompositionData || healthData.bodyComposition || null,
            scanId: scanId || null,
            createdAt: new Date(),
        };
        const result = await db.collection("reports").insertOne(reportDoc);

        // Count total scans for this patient and send a personalised progress email (non-blocking)
        const scanCount = await db.collection('reports').countDocuments({ 'patient.email': healthData.patient.email });
        sendCustomerScanEmail(healthData.patient, scanCount).catch(() => { });

        res.json({ ok: true, reportId: result.insertedId });
    } catch (err) {
        console.error("❌ Error saving report:", err);
        res.status(500).json({ ok: false, message: "Failed to save report" });
    }
});
app.get("/api/reports/history/:email", async (req, res) => {
    try {
        // DB Guard - prevent crash when DB is reconnecting
        if (!dbConnected || !db) {
            return res.status(503).json({ error: "Database temporarily unavailable" });
        }

        const { email } = req.params;
        if (!email) return res.status(400).json({ error: "Email is required" });
        const reports = await db.collection("reports").find({ "patient.email": email }).sort({ createdAt: -1 }).limit(10).toArray();
        res.json(reports);
    } catch (err) {
        console.error("Error fetching report history:", err);
        res.status(500).json({ error: "Failed to fetch report history" });
    }
});
app.post("/api/send-reset-email", async (req, res) => {
    try {
        const { to } = req.body;
        if (!to) return res.status(400).json({ ok: false, message: "Missing 'to' (admin email)" });
        const token = Math.floor(100000 + Math.random() * 900000).toString();
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        const expiry = Date.now() + 15 * 60 * 1000;
        const store = await loadJsonSafe(TOKEN_STORE_FILE);
        store[to] = { tokenHash, expiry };
        await saveJsonSafe(TOKEN_STORE_FILE, store);
        const mailOptions = {
            from: `Reliv Reports <${process.env.GMAIL_USER}>`,
            to,
            subject: "Admin password reset — your recovery code",
            text: `Your recovery code is: ${token}\n\nThis code expires in 15 minutes.`,
        };
        await transporter.sendMail(mailOptions);
        res.json({ ok: true, message: "Recovery email sent" });
    } catch (err) {
        console.error("Error in /api/send-reset-email:", err);
        res.status(500).json({ ok: false, message: "Failed to send reset email" });
    }
});
app.post("/api/confirm-reset", async (req, res) => {
    try {
        const { email, token, newPassword } = req.body;
        if (!email || !token || !newPassword) return res.status(400).json({ ok: false, message: "Missing parameters" });
        const store = await loadJsonSafe(TOKEN_STORE_FILE);
        const entry = store[email];
        if (!entry || Date.now() > entry.expiry) {
            return res.status(400).json({ ok: false, message: "Invalid or expired code" });
        }
        const inputHash = crypto.createHash("sha256").update(token).digest("hex");
        if (inputHash !== entry.tokenHash) return res.status(400).json({ ok: false, message: "Invalid code" });
        const salt = crypto.randomBytes(16).toString("hex");
        const hash = crypto.pbkdf2Sync(newPassword, salt, 100000, 64, "sha512").toString("hex");
        const credStore = await loadJsonSafe(CRED_STORE_FILE);
        credStore[email] = { algorithm: "pbkdf2", salt, iterations: 100000, keyLen: 64, digest: "sha512", hash, updatedAt: Date.now() };
        await saveJsonSafe(CRED_STORE_FILE, credStore);
        delete store[email];
        await saveJsonSafe(TOKEN_STORE_FILE, store);
        res.json({ ok: true });
    } catch (err) {
        console.error("Error in /api/confirm-reset:", err);
        res.status(500).json({ ok: false, message: "Failed" });
    }
});
app.post("/api/check-login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ ok: false, message: "Missing parameters" });
        const credStore = await loadJsonSafe(CRED_STORE_FILE);
        const user = credStore[email];
        if (!user) return res.status(400).json({ ok: false, message: "No such admin" });
        const hash = crypto.pbkdf2Sync(password, user.salt, user.iterations, user.keyLen, user.digest).toString("hex");
        if (hash === user.hash) return res.json({ ok: true });
        res.status(401).json({ ok: false, message: "Invalid credentials" });
    } catch (err) {
        console.error("Error in /api/check-login:", err);
        res.status(500).json({ ok: false });
    }
});
// Google Drive image endpoints - gracefully handle missing credentials
app.get("/api/gdrive-image/:fileId", async (req, res) => {
    const { fileId } = req.params;

    // Check if Google Drive is configured
    if (!SERVICE_ACCOUNT_KEY_PATH && !process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        return res.status(503).json({
            message: "Google Drive not configured",
            imageUrl: null
        });
    }

    try {
        let auth;
        if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
            // Use JSON from environment variable (Render secret files)
            const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
            auth = new google.auth.GoogleAuth({
                credentials,
                scopes: ["https://www.googleapis.com/auth/drive.readonly"]
            });
        } else {
            auth = new google.auth.GoogleAuth({
                keyFile: SERVICE_ACCOUNT_KEY_PATH,
                scopes: ["https://www.googleapis.com/auth/drive.readonly"]
            });
        }

        const drive = google.drive({ version: "v3", auth });
        const fileMetadata = await drive.files.get({ fileId, fields: "mimeType" });
        const mimeType = fileMetadata.data.mimeType;
        if (!mimeType.startsWith("image/")) return res.status(400).json({ message: "Not an image" });
        const response = await drive.files.get({ fileId, alt: "media" }, { responseType: "arraybuffer" });
        const imageBuffer = Buffer.from(response.data);
        const imageUrl = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;
        googleDriveAvailable = true;
        res.json({ imageUrl });
    } catch (error) {
        log.error("Google Drive Error:", error.message);
        googleDriveAvailable = false;
        res.status(500).json({ message: "Error fetching image", imageUrl: null });
    }
});

app.get("/api/gdrive-folder-image/:folderId", async (req, res) => {
    const { folderId } = req.params;

    // Check if Google Drive is configured
    if (!SERVICE_ACCOUNT_KEY_PATH && !process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        return res.status(503).json({
            message: "Google Drive not configured",
            imageUrl: null
        });
    }

    try {
        let auth;
        if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
            const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
            auth = new google.auth.GoogleAuth({
                credentials,
                scopes: ["https://www.googleapis.com/auth/drive.readonly"]
            });
        } else {
            auth = new google.auth.GoogleAuth({
                keyFile: SERVICE_ACCOUNT_KEY_PATH,
                scopes: ["https://www.googleapis.com/auth/drive.readonly"]
            });
        }

        const drive = google.drive({ version: "v3", auth });
        const response = await drive.files.list({
            q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
            fields: "files(id, mimeType, createdTime)",
            orderBy: "createdTime asc",
            pageSize: 1,
        });
        const files = response.data.files;
        if (!files || files.length === 0) return res.status(404).json({ message: "No images found", imageUrl: null });
        const fileId = files[0].id;
        const mimeType = files[0].mimeType;
        const imageResponse = await drive.files.get({ fileId, alt: "media" }, { responseType: "arraybuffer" });
        const imageBuffer = Buffer.from(imageResponse.data);
        const imageUrl = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;
        googleDriveAvailable = true;
        res.json({ imageUrl });
    } catch (error) {
        log.error("Google Drive Folder Error:", error.message);
        googleDriveAvailable = false;
        res.status(500).json({ message: "Error fetching folder image", imageUrl: null });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// SPEECH CONFIG - Dynamic TTS text management (stored in MongoDB)
// ═══════════════════════════════════════════════════════════════════════════

// Default speech config - used when MongoDB has no saved config
const DEFAULT_SPEECH_CONFIG = {
    _voiceSettings: { rate: 0.95, pitch: 1.0, lang: "en-IN", voicePreference: "female" },
    splash: "Welcome to Reliv! Your personal health companion. Tap the button to get started.",
    "choose-language": "Please select your preferred language to continue.",
    "customer-details": "Please scan the QR code with your phone to enter your details, or tap Enter Manually to type them in.",
    "two-options": "Great! How can we help you today? Choose Health Checkup or Medicine Dispensing.",
    "body-composition": "Let's measure your body composition. Please step on the scale and hold the handles.",
    "health-checkup": "Now we'll check your blood pressure. Please place the cuff on your upper arm and stay relaxed.",
    "oxygen-pulse": "Let's check your oxygen levels. Place your finger gently into the sensor clip.",
    "body-temperature": "Time to measure your body temperature. Please stay still for an accurate reading.",
    "eyesight": "Let's check your eyesight. Follow the instructions on screen carefully.",
    "report-1": "Here is your blood pressure report. Let's review your results.",
    "report-2": "Here is your oxygen and pulse report.",
    "report-3": "Here is your body temperature analysis.",
    "report-4": "Here is your eyesight assessment.",
    "report-5": "Here is your complete health report. You can email it to yourself or your doctor.",
    "wellness-recommendations": "Based on your results, here are personalized wellness recommendations for you.",
    checkout: "Review your health kits and proceed to checkout when ready.",
    payment: "Please complete your payment to proceed with your order.",
    "order-success": "Thank you! Your order is being processed and your kits will be dispensed shortly.",
    feedback: "We would love to hear your feedback about your experience today.",
};

// GET /api/speech-config — returns the current speech config
app.get("/api/speech-config", async (req, res) => {
    try {
        if (!db || !dbConnected) {
            return res.json(DEFAULT_SPEECH_CONFIG);
        }
        const saved = await db.collection("speech_config").findOne({ _id: "active" });
        if (saved && saved.config) {
            // Merge with defaults so new pages always have a fallback
            res.json({ ...DEFAULT_SPEECH_CONFIG, ...saved.config });
        } else {
            res.json(DEFAULT_SPEECH_CONFIG);
        }
    } catch (err) {
        log.error("Speech config GET error:", err.message);
        res.json(DEFAULT_SPEECH_CONFIG);
    }
});

// PUT /api/speech-config — update speech config (admin only)
app.put("/api/speech-config", async (req, res) => {
    try {
        const { config, password } = req.body;
        if (!config || typeof config !== "object") {
            return res.status(400).json({ error: "Invalid config object" });
        }

        // Verify admin password via the same mechanism as check-login
        if (!password) {
            return res.status(401).json({ error: "Password required" });
        }

        if (db && dbConnected) {
            // Check admin password against MongoDB
            const adminDoc = await db.collection("admin").findOne({ email: "khanfaizan3234@gmail.com" });
            const storedPassword = adminDoc?.password || "admin123";
            if (password !== storedPassword) {
                return res.status(403).json({ error: "Incorrect admin password" });
            }

            // Sanitize: only allow string values for page keys, object for _voiceSettings
            const sanitized = {};
            for (const [key, value] of Object.entries(config)) {
                if (key === "_voiceSettings" && typeof value === "object" && value !== null) {
                    sanitized._voiceSettings = {
                        rate: Math.max(0.5, Math.min(2, Number(value.rate) || 0.95)),
                        pitch: Math.max(0.5, Math.min(2, Number(value.pitch) || 1.0)),
                        lang: typeof value.lang === "string" ? value.lang.slice(0, 10) : "en-IN",
                        voicePreference: ["female", "male", "default"].includes(value.voicePreference) ? value.voicePreference : "female",
                    };
                } else if (typeof key === "string" && typeof value === "string") {
                    sanitized[key] = value.slice(0, 500); // Max 500 chars per entry
                }
            }

            await db.collection("speech_config").updateOne(
                { _id: "active" },
                { $set: { config: sanitized, updatedAt: new Date() } },
                { upsert: true }
            );
            res.json({ success: true, config: { ...DEFAULT_SPEECH_CONFIG, ...sanitized } });
        } else {
            return res.status(503).json({ error: "Database unavailable" });
        }
    } catch (err) {
        log.error("Speech config PUT error:", err.message);
        res.status(500).json({ error: "Failed to save speech config" });
    }
});

// Health check endpoints
app.get("/", (req, res) => {
    res.json({
        message: "Reliv Backend is live and running hoho! 🚀",
        status: "OK",
        version: "1.0.0",
        timestamp: new Date().toISOString()
    });
});

app.get("/health", async (req, res) => {
    try {
        // Check MongoDB connection
        await db.command({ ping: 1 });

        res.json({
            status: "healthy",
            timestamp: new Date().toISOString(),
            services: {
                mongodb: "connected",
                mqtt: mqttClient.connected ? "connected" : "disconnected",
                razorpay: "initialized"
            },
            uptime: process.uptime(),
            memory: process.memoryUsage()
        });
    } catch (error) {
        log.error('Health check failed:', error);
        res.status(503).json({
            status: "unhealthy",
            error: error.message
        });
    }
});

// Global error handling middleware
app.use((err, req, res, next) => {
    log.error('Unhandled error:', err);

    // Don't leak error details in production
    const errorResponse = {
        ok: false,
        message: isDev ? err.message : 'An error occurred',
        ...(isDev && { stack: err.stack })
    };

    res.status(err.status || 500).json(errorResponse);
});

// Handle 404
app.use((req, res) => {
    log.warn('404 Not Found:', req.method, req.path);
    res.status(404).json({
        ok: false,
        message: 'Endpoint not found',
        path: req.path
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOMER JOURNEY EMAIL SYSTEM
// Sends personalised scan-progress emails + daily "come back" reminders
// From: "Reliv Customer Care" using GMAIL_USER credentials
// ═══════════════════════════════════════════════════════════════════════════

const SCAN_UNLOCK_BENEFITS = [
    null, // index 0 unused
    { // After scan 1
        headline: "Your wellness baseline is live!",
        unlocked: ["Vitals snapshot (BP, pulse, oxygen, temperature)", "Body composition profile (BMI, fat%, muscle%)", "Metabolic rate (BMR) calculated", "Biological age estimate established"],
        next: "Your first change detection — see if anything shifted in your next scan!",
        tip: "Drink 2–3 litres of water daily to support your metabolism and muscle hydration."
    },
    { // After scan 2
        headline: "Your first health trend is forming!",
        unlocked: ["Change detection active vs your scan 1 baseline", "Weight & vitals delta comparison", "Body fat trend beginning to emerge"],
        next: "Full baseline metrics unlock + first pattern insights (scan 3)",
        tip: "A 20-minute walk daily can lower resting blood pressure by 4–9 mmHg within weeks."
    },
    { // After scan 3
        headline: "Your health patterns are emerging!",
        unlocked: ["Full baseline metrics unlocked", "Muscle & fat trend lines visible", "First personal pattern insights"],
        next: "Win moment celebration + deeper metabolic trend analysis (scan 4)",
        tip: "Protein-rich meals (eggs, lentils, paneer) help preserve muscle while reducing fat."
    },
    { // After scan 4
        headline: "You've earned your first win moment!",
        unlocked: ["Win moment celebration & achievement milestone", "Deeper metabolic trend analysis", "Cardiovascular efficiency score"],
        next: "Delta indicators (↑↓) activate on ALL your metrics (scan 5)",
        tip: "7–8 hours of quality sleep is when your body rebuilds muscle and burns fat. Prioritise it!"
    },
    { // After scan 5
        headline: "Delta indicators are now live on all metrics!",
        unlocked: ["↑↓ delta indicators on every metric", "Comprehensive change tracking across all scans", "Body composition performance score"],
        next: "Advanced pattern language + physiological efficiency score (scan 6)",
        tip: "Stress raises cortisol which promotes fat storage. Even 5 minutes of deep breathing daily helps."
    },
    { // After scan 6
        headline: "Advanced insights unlocked — you're almost there!",
        unlocked: ["Physiological efficiency score", "Advanced pattern language across metrics", "Integration metrics & recomposition gap"],
        next: "ONE more scan to complete your full 7-scan wellness cycle! 🏆",
        tip: "Your body responds to consistency. Even small daily actions compound into big changes over time."
    },
    { // After scan 7
        headline: "You've completed your 7-scan wellness cycle! 🏆",
        unlocked: ["Complete 7-scan health story", "Full trend analytics across all metrics", "Comprehensive physiological profile", "Long-term wellness baseline established"],
        next: "Begin your next cycle to track continued progress and long-term trends",
        tip: "You did it! Share your wellness journey and inspire someone you love to start theirs."
    },
];

function buildProgressBar(scanCount) {
    const total = 7;
    const dots = [];
    for (let i = 1; i <= total; i++) {
        const done = i <= scanCount;
        dots.push(
            `<td style="padding:0 3px;"><div style="width:30px;height:30px;border-radius:50%;background:${done ? '#F06922' : '#e2e8f0'};line-height:30px;text-align:center;font-size:12px;font-weight:700;color:${done ? '#fff' : '#94a3b8'};">${i}</div></td>`
        );
    }
    const pct = Math.round((scanCount / total) * 100);
    return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin:12px auto 8px;">
      <tr>${dots.join('')}</tr>
    </table>
    <div style="background:#e2e8f0;border-radius:20px;height:8px;margin:6px 0 4px;overflow:hidden;">
      <div style="background:linear-gradient(90deg,#F06922,#f59e0b);height:100%;width:${pct}%;border-radius:20px;"></div>
    </div>
    <p style="text-align:center;margin:4px 0 0;font-size:13px;color:#64748b;">${scanCount} of 7 scans complete &nbsp;·&nbsp; ${7 - scanCount} left to go</p>
  `;
}

async function sendCustomerScanEmail(patient, scanCount) {
    const mailer = customerTransporter || transporter;
    if (!mailer || !patient?.email) return;
    try {
        const name = patient.name || 'there';
        const firstName = name.split(' ')[0];
        const info = SCAN_UNLOCK_BENEFITS[Math.min(scanCount, 7)] || SCAN_UNLOCK_BENEFITS[7];
        const scansLeft = Math.max(0, 7 - scanCount);
        const isComplete = scanCount >= 7;

        const subjectEmojis = ['', '🌟', '📈', '🔍', '🏆', '⚡', '🧠', '🎉'];
        const emoji = subjectEmojis[Math.min(scanCount, 7)] || '🌟';
        const subject = isComplete
            ? `${emoji} Congratulations ${firstName}! Your 7-scan wellness journey is complete!`
            : `${emoji} Scan ${scanCount} done, ${firstName}! ${scansLeft} more scan${scansLeft !== 1 ? 's' : ''} to go`;

        const unlockedRows = info.unlocked.map(u =>
            `<tr><td style="padding:5px 0 5px 10px;color:#1e293b;font-size:14px;line-height:1.5;">✅&nbsp; ${u}</td></tr>`
        ).join('');

        const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
<span style="display:none;font-size:1px;color:#f1f5f9;overflow:hidden;">${scansLeft > 0 ? `${scansLeft} scans left — see what unlocks next` : 'Your complete health profile is ready!'}</span>
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f1f5f9">
  <tr><td align="center" style="padding:24px 12px;">
  <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

    <!-- HERO -->
    <tr><td style="background:linear-gradient(135deg,#1e3a5f 0%,#F06922 100%);padding:40px;text-align:center;">
      <p style="margin:0 0 4px;color:rgba(255,255,255,0.7);font-size:13px;letter-spacing:1.5px;text-transform:uppercase;">Reliv Health Kiosk</p>
      <h1 style="margin:0 0 10px;color:#ffffff;font-size:28px;font-weight:800;">${isComplete ? '🎉 Journey Complete!' : `Scan ${scanCount} Done!`}</h1>
      <p style="margin:0;color:rgba(255,255,255,0.85);font-size:16px;">Hello ${firstName} — your health story is being written 💙</p>
    </td></tr>

    <!-- PROGRESS BAR -->
    <tr><td style="padding:28px 40px 12px;text-align:center;">
      <p style="margin:0 0 4px;font-size:13px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Your Progress</p>
      ${buildProgressBar(scanCount)}
    </td></tr>

    <!-- HEADLINE -->
    <tr><td style="padding:16px 40px 6px;text-align:center;">
      <h2 style="margin:0;color:#F06922;font-size:20px;font-weight:700;">${info.headline}</h2>
    </td></tr>

    <!-- UNLOCKED TODAY -->
    <tr><td style="padding:12px 40px;">
      <div style="background:#f0fdf4;border-radius:12px;padding:20px 24px;">
        <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:0.5px;">✨ What you measured today</p>
        <table cellpadding="0" cellspacing="0" border="0" width="100%">${unlockedRows}</table>
      </div>
    </td></tr>

    ${!isComplete ? `
    <!-- NEXT SCAN PREVIEW -->
    <tr><td style="padding:8px 40px 12px;">
      <div style="background:#fff7ed;border-radius:12px;padding:20px 24px;border-left:4px solid #F06922;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#c2410c;text-transform:uppercase;letter-spacing:0.5px;">🔜 What unlocks in your next scan</p>
        <p style="margin:0;color:#1e293b;font-size:14px;line-height:1.7;">${info.next}</p>
      </div>
    </td></tr>` : `
    <!-- COMPLETION CONGRATS -->
    <tr><td style="padding:8px 40px 12px;text-align:center;">
      <div style="background:linear-gradient(135deg,#f0fdf4,#eff6ff);border-radius:12px;padding:24px;border:2px solid #bbf7d0;">
        <p style="margin:0 0 8px;font-size:24px;">🏆</p>
        <p style="margin:0;color:#166534;font-size:15px;font-weight:600;line-height:1.7;">You've built a complete wellness profile!<br>
        <span style="font-weight:400;font-size:13px;color:#475569;">Visit again to start your next cycle and track long-term health trends.</span></p>
      </div>
    </td></tr>`}

    <!-- HEALTH TIP -->
    <tr><td style="padding:8px 40px 24px;">
      <div style="background:#eff6ff;border-radius:12px;padding:20px 24px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.5px;">💡 Today's Health Tip</p>
        <p style="margin:0;color:#1e293b;font-size:14px;font-style:italic;line-height:1.7;">"${info.tip}"</p>
      </div>
    </td></tr>

    <!-- CTA -->
    <tr><td style="padding:0 40px 36px;text-align:center;">
      <p style="color:#64748b;font-size:14px;line-height:1.7;">${isComplete ? 'Start your next 7-scan cycle to track long-term progress — visit any Reliv kiosk.' : 'Each scan adds a new layer to your health story.<br>Come back to Reliv soon — your next scan takes just a few minutes!'}</p>
      <table cellpadding="0" cellspacing="0" border="0" style="margin:12px auto 0;">
        <tr><td style="background:linear-gradient(135deg,#1e3a5f,#F06922);border-radius:30px;padding:14px 36px;">
          <span style="color:#fff;font-weight:700;font-size:15px;">📍 ${isComplete ? 'Start Next Cycle' : 'Visit Reliv Again Soon'}</span>
        </td></tr>
      </table>
    </td></tr>

    <!-- FOOTER -->
    <tr><td style="background:#1e293b;padding:24px 40px;text-align:center;">
      <p style="margin:0 0 6px;color:#94a3b8;font-size:13px;">Made with 💙 by the Reliv Team</p>
      <p style="margin:0;color:#64748b;font-size:11px;line-height:1.6;">You're receiving this because you scanned at a Reliv Health Kiosk.<br>Questions? Reply to this email or visit us at your nearest kiosk.</p>
    </td></tr>

  </table>
  </td></tr>
</table>
</body></html>`;

        await mailer.sendMail({
            from: `"Reliv Customer Care" <${process.env.CUSTOMER_GMAIL_USER || process.env.GMAIL_USER}>`,
            to: patient.email,
            subject,
            html,
            text: `Hi ${firstName},\n\nScan ${scanCount} is complete!\n\n${info.headline}\n\nWhat you accessed today:\n${info.unlocked.map(u => `• ${u}`).join('\n')}${!isComplete ? `\n\nNext scan unlocks: ${info.next}` : ''}\n\nHealth Tip: "${info.tip}"\n\nSee you at Reliv!\nThe Reliv Customer Care Team`
        });
        log.info(`📧 Customer scan email sent → ${patient.email} (scan ${scanCount})`);
    } catch (err) {
        log.error(`❌ Failed to send customer scan email to ${patient?.email}:`, err.message);
    }
}

async function sendCustomerReminderEmail(patient, scanCount, daysSince) {
    const mailer = customerTransporter || transporter;
    if (!mailer || !patient?.email) return;
    try {
        const name = patient.name || 'there';
        const firstName = name.split(' ')[0];
        const scansLeft = 7 - scanCount;
        const pct = Math.round((scanCount / 7) * 100);
        const nextInfo = SCAN_UNLOCK_BENEFITS[Math.min(scanCount + 1, 7)] || SCAN_UNLOCK_BENEFITS[7];

        const dayText = daysSince === 1 ? 'yesterday' : `${daysSince} day${daysSince !== 1 ? 's' : ''} ago`;
        const urgency = daysSince >= 7 ? `We haven't seen you in ${daysSince} days` : daysSince >= 3 ? 'Your health journey is waiting for you' : 'Quick check-in from Reliv';
        const subject = `${firstName}, ${urgency.toLowerCase()} 💙 — ${scansLeft} scan${scansLeft !== 1 ? 's' : ''} left on your wellness story`;

        const nextRows = nextInfo.unlocked.map(u =>
            `<tr><td style="padding:5px 0 5px 10px;color:#1e293b;font-size:14px;line-height:1.5;">🔓&nbsp; ${u}</td></tr>`
        ).join('');

        const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
<span style="display:none;font-size:1px;color:#f1f5f9;overflow:hidden;">You're ${pct}% through your 7-scan wellness journey — don't stop now!</span>
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f1f5f9">
  <tr><td align="center" style="padding:24px 12px;">
  <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

    <!-- HERO -->
    <tr><td style="background:linear-gradient(135deg,#1e3a5f 0%,#0f766e 100%);padding:40px;text-align:center;">
      <p style="margin:0 0 4px;color:rgba(255,255,255,0.7);font-size:13px;letter-spacing:1.5px;text-transform:uppercase;">Reliv Health Kiosk</p>
      <h1 style="margin:0 0 10px;color:#ffffff;font-size:26px;font-weight:800;">Hey ${firstName}, we miss you! 💙</h1>
      <p style="margin:0;color:rgba(255,255,255,0.8);font-size:15px;">Your last wellness scan was <strong>${dayText}</strong>.</p>
    </td></tr>

    <!-- PROGRESS -->
    <tr><td style="padding:28px 40px 12px;text-align:center;">
      <p style="margin:0 0 4px;font-size:13px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">You're ${pct}% there</p>
      ${buildProgressBar(scanCount)}
    </td></tr>

    <!-- MOTIVATION BANNER -->
    <tr><td style="padding:8px 40px 12px;">
      <div style="background:#fef9c3;border-radius:12px;padding:20px 24px;border-left:4px solid #eab308;">
        <p style="margin:0;color:#854d0e;font-size:15px;font-weight:600;line-height:1.7;">
          You've already done ${scanCount} scan${scanCount !== 1 ? 's' : ''} — that's ${scanCount} chapter${scanCount !== 1 ? 's' : ''} of your health story written.<br>
          <span style="font-weight:400;font-size:14px;color:#713f12;">Just ${scansLeft} more scan${scansLeft !== 1 ? 's' : ''} to complete your full wellness picture.</span>
        </p>
      </div>
    </td></tr>

    <!-- NEXT UNLOCK -->
    <tr><td style="padding:8px 40px 12px;">
      <div style="background:#fff7ed;border-radius:12px;padding:20px 24px;border-left:4px solid #F06922;">
        <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#c2410c;text-transform:uppercase;letter-spacing:0.5px;">🔜 Your next scan will unlock</p>
        <table cellpadding="0" cellspacing="0" border="0" width="100%">${nextRows}</table>
      </div>
    </td></tr>

    <!-- 3 BENEFIT ICONS -->
    <tr><td style="padding:8px 40px 16px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td width="33%" style="padding:6px;text-align:center;">
            <div style="background:#f0fdf4;border-radius:10px;padding:16px 8px;">
              <div style="font-size:24px;">❤️</div>
              <p style="margin:6px 0 0;font-size:12px;color:#15803d;font-weight:600;line-height:1.4;">Heart Health<br>Tracked</p>
            </div>
          </td>
          <td width="33%" style="padding:6px;text-align:center;">
            <div style="background:#eff6ff;border-radius:10px;padding:16px 8px;">
              <div style="font-size:24px;">💪</div>
              <p style="margin:6px 0 0;font-size:12px;color:#1d4ed8;font-weight:600;line-height:1.4;">Body Comp<br>Monitored</p>
            </div>
          </td>
          <td width="33%" style="padding:6px;text-align:center;">
            <div style="background:#fdf4ff;border-radius:10px;padding:16px 8px;">
              <div style="font-size:24px;">🧠</div>
              <p style="margin:6px 0 0;font-size:12px;color:#7e22ce;font-weight:600;line-height:1.4;">Full Story<br>Building</p>
            </div>
          </td>
        </tr>
      </table>
    </td></tr>

    <!-- CTA -->
    <tr><td style="padding:8px 40px 36px;text-align:center;">
      <p style="color:#64748b;font-size:14px;line-height:1.7;">Each scan takes just a few minutes at your nearest Reliv kiosk.<br>Your body has a story to tell — let's keep writing it together.</p>
      <table cellpadding="0" cellspacing="0" border="0" style="margin:12px auto 0;">
        <tr><td style="background:linear-gradient(135deg,#F06922,#f59e0b);border-radius:30px;padding:14px 36px;">
          <span style="color:#fff;font-weight:700;font-size:15px;">📍 Visit Reliv Today</span>
        </td></tr>
      </table>
    </td></tr>

    <!-- FOOTER -->
    <tr><td style="background:#1e293b;padding:24px 40px;text-align:center;">
      <p style="margin:0 0 6px;color:#94a3b8;font-size:13px;">Made with 💙 by the Reliv Team</p>
      <p style="margin:0;color:#64748b;font-size:11px;line-height:1.6;">You're receiving this because you scanned at a Reliv Health Kiosk.<br>Questions? Reply to this email or visit us at your nearest kiosk.</p>
    </td></tr>

  </table>
  </td></tr>
</table>
</body></html>`;

        await mailer.sendMail({
            from: `"Reliv Customer Care" <${process.env.CUSTOMER_GMAIL_USER || process.env.GMAIL_USER}>`,
            to: patient.email,
            subject,
            html,
            text: `Hi ${firstName},\n\nYour last scan was ${dayText} and you have ${scansLeft} scan${scansLeft !== 1 ? 's' : ''} left.\n\nYou're ${pct}% through your wellness journey!\n\nScan ${scanCount + 1} will unlock:\n${nextInfo.unlocked.map(u => `• ${u}`).join('\n')}\n\nCome visit Reliv soon!\nThe Reliv Customer Care Team`
        });
        log.info(`📧 Daily reminder sent → ${patient.email} (${scanCount} scans, last: ${dayText})`);
    } catch (err) {
        log.error(`❌ Failed to send reminder email to ${patient?.email}:`, err.message);
    }
}

let lastDailyCustomerReminderDate = null;

async function sendCustomerDailyReminders() {
    const mailer = customerTransporter || transporter;
    if (!mailer || !dbConnected || !db) return;
    const todayStr = new Date().toDateString();
    if (lastDailyCustomerReminderDate === todayStr) return;

    try {
        log.info('📅 Running daily customer reminder scan...');

        // Aggregate: one doc per unique patient email, count scans, get last scan date
        const patients = await db.collection('reports').aggregate([
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: '$patient.email',
                    name: { $first: '$patient.name' },
                    email: { $first: '$patient.email' },
                    scanCount: { $sum: 1 },
                    lastScan: { $first: '$createdAt' }
                }
            },
            { $match: { scanCount: { $lt: 7 }, email: { $ne: null } } }
        ]).toArray();

        log.info(`📋 ${patients.length} patients with incomplete journeys found`);

        let sent = 0;
        for (const p of patients) {
            try {
                // Skip if already reminded today
                const alreadySent = await db.collection('email_log').findOne({
                    type: 'daily_reminder', email: p.email, sentDate: todayStr
                });
                if (alreadySent) continue;

                const daysSince = Math.floor((Date.now() - new Date(p.lastScan).getTime()) / 86400000);
                if (daysSince < 1) continue; // Don't send same day as scan

                await sendCustomerReminderEmail({ name: p.name, email: p.email }, p.scanCount, daysSince);

                // Record send so we don't double-send
                await db.collection('email_log').insertOne({
                    type: 'daily_reminder', email: p.email,
                    sentDate: todayStr, scanCount: p.scanCount, createdAt: new Date()
                });
                sent++;
                // Throttle: 800ms between emails to avoid SMTP rate limits
                await new Promise(r => setTimeout(r, 800));
            } catch (innerErr) {
                log.error(`❌ Reminder failed for ${p.email}:`, innerErr.message);
            }
        }

        lastDailyCustomerReminderDate = todayStr;
        log.info(`✅ Daily customer reminders complete: ${sent} sent`);
    } catch (err) {
        log.error('❌ sendCustomerDailyReminders error:', err.message);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// START COMPREHENSIVE HEALTH MONITORING
// ═══════════════════════════════════════════════════════════════════════════
function startComprehensiveHealthMonitoring() {
    // Wait 60 seconds after startup for all services to initialize
    console.log('⏳ Health monitoring will start in 60 seconds (allowing services to initialize)...');

    setTimeout(async () => {
        console.log('🏥 Starting comprehensive health monitoring system...');

        // Run initial check
        await healthMonitorScheduler();

        // Schedule regular health checks every 5 minutes
        setInterval(healthMonitorScheduler, HEALTH_CHECK_INTERVAL);

        // Daily customer reminder emails — check every hour, fire once at 10 AM IST (4:30 AM UTC)
        setInterval(async () => {
            try {
                const hourIST = new Date(Date.now() + 5.5 * 3600000).getUTCHours();
                if (hourIST === 10) await sendCustomerDailyReminders();
            } catch (e) { log.error('Daily reminder check error:', e.message); }
        }, 60 * 60 * 1000);

        console.log(`✅ Health monitoring active - checking every ${HEALTH_CHECK_INTERVAL / 60000} minutes`);
        console.log(`📧 Alerts will be sent to: ${ADMIN_ALERT_EMAIL}`);
        console.log(`📅 Daily summary at ${DAILY_SUMMARY_HOUR}:00 AM IST`);
    }, 60000);
}

// Initialize application
start()
    .then(() => {
        // Start automated health monitoring (delayed to allow services to initialize)
        startHealthMonitoring();

        // Start comprehensive health monitoring with email alerts
        startComprehensiveHealthMonitoring();
    })
    .catch(err => {
        log.error('Failed to start server:', err);
        // Don't exit - try to keep running for health checks
        log.warn('Server starting in degraded mode');

        // Still start health monitoring even in degraded mode
        startComprehensiveHealthMonitoring();
    });
