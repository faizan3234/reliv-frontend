#!/usr/bin/env node
/**
 * Reliv Pi Audio Server
 * Plays MP3 files via mpv (system-level) so Chromium never decodes audio.
 * This prevents HDMI signal interference on Pi 5.
 *
 * Usage: node audio-server.js
 * Endpoint: GET /play/:pageKey  → plays /home/reliv-17/audio/<pageKey>.mp3
 * Endpoint: GET /stop            → stops current playback
 * Endpoint: GET /health          → returns { ok: true }
 */

const http = require("http");
const { execFile, exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const AUDIO_DIR = "/home/reliv-17/audio";
const PORT = 3456;

// Whitelist of valid page keys (prevents path traversal / command injection)
const VALID_KEYS = new Set([
  "splash", "choose-language", "customer-details", "two-options",
  "body-composition", "health-checkup", "oxygen-pulse", "body-temperature",
  "eyesight", "report-1", "report-2", "report-3", "report-4", "report-5",
  "wellness-recommendations", "checkout", "payment", "order-success",
  "feedback", "idle-loop", "leaderboard",
]);

let currentProcess = null;

function stopPlayback() {
  if (currentProcess) {
    currentProcess.kill("SIGTERM");
    currentProcess = null;
  }
  // Also kill any stray mpv audio processes
  exec('pkill -f "mpv.*\\.mp3" 2>/dev/null');
}

function playAudio(pageKey) {
  stopPlayback();
  const filePath = path.join(AUDIO_DIR, `${pageKey}.mp3`);

  if (!fs.existsSync(filePath)) {
    console.error(`[Audio] File not found: ${filePath}`);
    return false;
  }

  // Use execFile (not exec) to prevent shell injection
  currentProcess = execFile("mpv", ["--no-video", "--really-quiet", filePath], (err) => {
    currentProcess = null;
    if (err && err.killed) return; // Normal stop
    if (err) console.error(`[Audio] mpv error:`, err.message);
  });

  console.log(`[Audio] Playing: ${pageKey}`);
  return true;
}

const server = http.createServer((req, res) => {
  // CORS for Vercel frontend
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // GET /health
  if (url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // GET /stop
  if (url.pathname === "/stop") {
    stopPlayback();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ stopped: true }));
    return;
  }

  // GET /play/:pageKey
  const match = url.pathname.match(/^\/play\/([a-z0-9-]+)$/);
  if (match) {
    const pageKey = match[1];
    if (!VALID_KEYS.has(pageKey)) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid page key" }));
      return;
    }

    const ok = playAudio(pageKey);
    res.writeHead(ok ? 200 : 404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ playing: ok, key: pageKey }));
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[Reliv Audio Server] http://localhost:${PORT}`);
  console.log(`[Reliv Audio Server] Audio dir: ${AUDIO_DIR}`);
});
