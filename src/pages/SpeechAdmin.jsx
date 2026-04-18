import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config/api";
import { supabase, LEADERBOARD_BUCKET } from "../config/supabase";

/* ─── Page registry ─── */
const PAGE_KEYS = [
  "splash", "choose-language", "customer-details", "two-options",
  "health-checkup", "oxygen-pulse", "eyesight", "body-temperature",
  "body-composition", "report-1", "report-2", "report-3", "report-4",
  "report-5", "wellness-recommendations", "checkout", "payment",
  "order-success", "feedback",
];

const PAGE_LABELS = {
  splash: "Splash / Welcome",
  "choose-language": "Choose Language",
  "customer-details": "Customer Details (QR / Manual)",
  "two-options": "Health Checkup or Medicine",
  "health-checkup": "Blood Pressure Measurement",
  "oxygen-pulse": "Oxygen & Pulse",
  eyesight: "Eye Sight Test",
  "body-temperature": "Body Temperature",
  "body-composition": "Body Composition (Weight & Height)",
  "report-1": "Report 1 – Blood Pressure",
  "report-2": "Report 2 – Oxygen & Pulse",
  "report-3": "Report 3 – Temperature",
  "report-4": "Report 4 – Eyesight",
  "report-5": "Report 5 – Full Report",
  "wellness-recommendations": "Wellness Recommendations",
  checkout: "Checkout / Cart",
  payment: "Payment Gate",
  "order-success": "Order Success",
  feedback: "Feedback",
};

/* ─── Default speech texts (same as SpeechContext DEFAULT_CONFIG) ─── */
const DEFAULT_TEXTS = {
  splash: "Welcome to Reliv. Your personal health companion. Tap to start.",
  "choose-language": "Pick your language. English, Hindi, or Bengali.",
  "customer-details": "Scan QR code with your phone. Or open Google and scan. Save your details for faster login next time.",
  "two-options": "Great. Health checkup or medicine dispenser? Tap your choice.",
  "body-composition": "Step on the scale. Feet on the black area, not the orange. Bring your feet closer. Hold still. We will measure height too. If weight looks wrong, tap Refresh and stand again. If device disconnected, tap Refresh.",
  "health-checkup": "Now blood pressure. Pick the cuff from the hook. Put it on your wrist at heart level. Press the ON button. Then tap Measure on screen. Don't talk. Stay relaxed. If anything looks off, tap Refresh and measure again. If device disconnected, tap Refresh.",
  "oxygen-pulse": "Place your finger in the sensor clip. Tap Measure. Hold still for 15 seconds. If device disconnected, tap Refresh.",
  "body-temperature": "Hold the temperature gun on your forehead. Tap Measure. If device disconnected, tap Refresh.",
  eyesight: "Now the eyesight test. Cover one eye. Read the letters and numbers you see on screen. Select what you see from the options. Then cover your other eye and repeat.",
  "report-1": "This is your health score compared to an average person your age.",
  "report-2": "Your overall status. Green, yellow, or red.",
  "report-3": "This graph grows as you visit. Come back tomorrow. New insights unlock.",
  "report-4": "Your eyesight assessment is complete.",
  "report-5": "Here are all your numbers in one place. But more importantly, here is what they mean in simple human language. Read the advice on screen. Screenshot it. Follow it for 7 days. Then come back. A free checkup is waiting for you. Scroll down. Your full report will be emailed to you. You can also challenge a friend or your partner to see who's healthier. Loser posts on their story! And check out the wellness kits curated just for you.",
  "wellness-recommendations": "Your personalized advice is on screen. Eat this. Do that. Avoid this. No doctor terms. Just simple steps.",
  checkout: "Review your health kits and proceed to checkout when ready.",
  payment: "That's all the free tests. Now for just 17 rupees, less than a Coke or a cigarette, I will translate everything into simple human language. No doctor terms. Just eat this, do that, avoid this. Plus a 7-day graph. Scan QR code. GPay, PhonePe, Paytm. Or insert 17 rupees, exact change.",
  "order-success": "Thank you. Your full receipt is sent to your email. Simple language. Easy to understand. Come back tomorrow to see the changes and compare. Your graph grows. New insights unlock. I am proud of you. See you tomorrow?",
  feedback: "Rate your experience. 1 to 5 stars. Your feedback helps other students trust Reliv.",
  "idle-loop": "Free weight. Free BP. Free oxygen. A full report with simple human advice, just 17 rupees. Less than a Coke. Step up. Let me help you.",
};

/* ─── Keyword → page key mapping (for smart file parsing) ─── */
const PAGE_SYNONYMS = {
  splash:       ["splash", "welcome", "intro", "home"],
  "choose-language": ["language", "choose language", "select language"],
  "customer-details": ["customer", "details", "name", "registration", "qr", "manual entry"],
  "two-options": ["two options", "health checkup or medicine", "choose option", "options"],
  "health-checkup": ["health checkup", "blood pressure", "bp measurement", "bp"],
  "oxygen-pulse": ["oxygen", "pulse", "spo2", "oximeter", "heart rate", "bpm"],
  eyesight:     ["eyesight", "eye sight", "eye test", "vision", "near vision"],
  "body-temperature": ["temperature", "body temperature", "infrared", "thermometer", "temp"],
  "body-composition": ["body composition", "weight", "height", "scale", "bmi", "body mass"],
  "report-1":   ["report 1", "report1", "bp report"],
  "report-2":   ["report 2", "report2", "oxygen report", "pulse report"],
  "report-3":   ["report 3", "report3", "temperature report", "temp report"],
  "report-4":   ["report 4", "report4", "eyesight report", "eye report", "vision report"],
  "report-5":   ["report 5", "report5", "full report", "final report", "complete report"],
  "wellness-recommendations": ["wellness", "recommendations", "suggestion", "advice", "tips"],
  checkout:     ["checkout", "cart", "buy", "purchase"],
  payment:      ["payment", "pay", "razorpay", "payment gate"],
  "order-success": ["order success", "order confirmation", "receipt", "success"],
  feedback:     ["feedback", "review", "rate", "rating"],
  "idle-loop":  ["idle", "idle loop", "attract", "attract mode", "standby"],
};

/* ─── Clean text for natural TTS ─── */
function cleanForSpeech(raw) {
  let t = raw;
  // Strip smart/straight quotes
  t = t.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036""]/g, "");
  // Strip single quotes used as decoration (keep apostrophes inside words)
  t = t.replace(/(?<!\w)['\u2018\u2019\u2032]|['\u2018\u2019\u2032](?!\w)/g, "");
  // Remove asterisks, underscores used for formatting
  t = t.replace(/[*_~`#]/g, "");
  // Replace semicolons / colons mid-sentence with a pause (period)
  t = t.replace(/[:;]/g, ".");
  // Collapse multiple periods / exclamation / question marks
  t = t.replace(/([.!?])\1+/g, "$1");
  // Normalize ellipsis
  t = t.replace(/\.{2,}/g, ".");
  // Remove stray brackets / parentheses content (often notes, not speech)
  t = t.replace(/\(([^)]{0,6})\)/g, ""); // short parenthetical like (QR)
  // Collapse multiple spaces
  t = t.replace(/\s{2,}/g, " ");
  return t.trim();
}

/* ─── Smart file parser: detects page sections and maps text ─── */
function parseUploadedText(raw) {
  const results = {};
  const lines = raw.split(/\r?\n/);
  let currentKey = null;
  let currentText = [];

  const flushCurrent = () => {
    if (currentKey && currentText.length > 0) {
      const joined = currentText.join(" ").trim();
      if (joined) results[currentKey] = cleanForSpeech(joined);
    }
    currentText = [];
  };

  // Try to detect if the file uses "PageName: text" single-line format
  const isColonFormat = lines.filter((l) => /^[^:]{3,40}:\s*.{5,}/.test(l.trim())).length >= 3;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Match the line against known page names / synonyms
    const detectedKey = detectPageKey(line);

    if (isColonFormat) {
      // "PageName: the text here" format — one line per page
      const colonIdx = line.indexOf(":");
      if (colonIdx > 2 && colonIdx < 40) {
        const label = line.slice(0, colonIdx).trim();
        const text = line.slice(colonIdx + 1).trim();
        const key = detectPageKey(label);
        if (key && text) {
          results[key] = cleanForSpeech(text);
        }
      }
    } else {
      // Multi-line format: header line then text paragraph(s)
      if (detectedKey && isHeaderLine(line)) {
        flushCurrent();
        currentKey = detectedKey;
      } else if (currentKey) {
        currentText.push(line);
      } else if (!currentKey && detectedKey) {
        // First detection — might be "Splash: Welcome to Reliv..."
        const colonIdx = line.indexOf(":");
        if (colonIdx > 0) {
          flushCurrent();
          currentKey = detectedKey;
          const afterColon = line.slice(colonIdx + 1).trim();
          if (afterColon) currentText.push(afterColon);
        }
      }
    }
  }
  flushCurrent();

  return results;
}

/* Detect if a line is a section header rather than body text */
function isHeaderLine(line) {
  const clean = line.replace(/^[\d.)\-–—•*#]+\s*/, "").trim();
  // Short lines (< 60 chars) that match a page synonym are likely headers
  if (clean.length < 60) return true;
  // Lines ending with : are headers
  if (clean.endsWith(":")) return true;
  return false;
}

/* Match a line/label to a page key by checking synonyms */
function detectPageKey(text) {
  const lower = text.toLowerCase()
    .replace(/^[\d.)\-–—•*#]+\s*/, "") // strip leading numbering
    .replace(/[:]/g, "")               // strip trailing colon
    .trim();
  // Direct key match (e.g. "splash", "oxygen-pulse")
  if (PAGE_LABELS[lower]) return lower;
  // Check synonyms
  for (const [key, synonyms] of Object.entries(PAGE_SYNONYMS)) {
    for (const syn of synonyms) {
      if (lower === syn || lower.startsWith(syn + " ") || lower.includes(syn)) return key;
    }
  }
  // Check against the label text itself
  for (const [key, label] of Object.entries(PAGE_LABELS)) {
    if (lower.includes(label.toLowerCase().split("/")[0].trim().slice(0, 10))) return key;
  }
  return null;
}

/* ═══════════════════════════════════════════════════════════
   Leaderboard Admin Panel — inline component
   Shows all leaderboard entries with photos, admin can delete
   ═══════════════════════════════════════════════════════════ */
function LeaderboardAdminPanel() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (expanded) fetchEntries();
  }, [expanded]);

  async function fetchEntries() {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("leaderboard")
        .select("*")
        .order("score", { ascending: false });
      if (error) throw error;

      const withPhotos = (data || []).map((entry) => {
        let photoUrl = null;
        if (entry.photo_path) {
          const { data: urlData } = supabase.storage
            .from(LEADERBOARD_BUCKET)
            .getPublicUrl(entry.photo_path);
          photoUrl = urlData?.publicUrl || null;
        }
        return { ...entry, photoUrl };
      });
      setEntries(withPhotos);
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(entry) {
    if (!supabase) return;
    const confirmed = window.confirm(`Delete ${entry.name} (score: ${entry.score}) from the leaderboard?`);
    if (!confirmed) return;

    setDeleting(entry.id);
    try {
      // Delete photo from storage if exists
      if (entry.photo_path) {
        await supabase.storage.from(LEADERBOARD_BUCKET).remove([entry.photo_path]);
      }
      // Delete row
      const { error } = await supabase.from("leaderboard").delete().eq("id", entry.id);
      if (error) throw error;
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete. Check console.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🏆</span>
          <h2 className="font-bold text-gray-800 text-sm">Leaderboard Manager</h2>
          <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {expanded ? entries.length + " entries" : "tap to expand"}
          </span>
        </div>
        <span className="text-gray-400 text-lg">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-2">
          {loading ? (
            <div className="text-center py-6">
              <div className="w-8 h-8 border-3 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-400 text-xs">Loading leaderboard...</p>
            </div>
          ) : entries.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No entries on the leaderboard yet.</p>
          ) : (
            <>
              <p className="text-[10px] text-gray-400 mb-2">
                {entries.length} total entries. Click 🗑️ to remove someone from the leaderboard.
              </p>
              {entries.map((entry, i) => (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    deleting === entry.id ? "opacity-50 border-red-200 bg-red-50" : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  {/* Rank */}
                  <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                    {i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
                  </div>

                  {/* Photo */}
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 border border-gray-300">
                    {entry.photoUrl ? (
                      <img src={entry.photoUrl} alt={entry.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg">🧑</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800 text-sm truncate">{entry.name}</span>
                      <span className="font-mono text-xs font-bold" style={{
                        color: entry.score >= 80 ? "#16a34a" : entry.score >= 60 ? "#ea580c" : "#dc2626"
                      }}>
                        {entry.score}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 truncate">
                      {entry.department || "—"} • {entry.email || "no email"}
                      {entry.scan_count > 1 && ` • ${entry.scan_count} scans`}
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(entry)}
                    disabled={deleting === entry.id}
                    className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-100 hover:text-red-600 active:bg-red-200 transition-all border border-transparent hover:border-red-200"
                    title={`Delete ${entry.name}`}
                  >
                    🗑️
                  </button>
                </div>
              ))}
              <button
                onClick={fetchEntries}
                className="w-full py-2 rounded-xl text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 transition mt-2"
              >
                🔄 Refresh
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function SpeechAdmin() {
  const navigate = useNavigate();
  const [config, setConfig] = useState({});
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [testing, setTesting] = useState(null);
  const [loading, setLoading] = useState(true);

  // Voice settings state
  const [voiceSettings, setVoiceSettings] = useState({
    rate: 0.95, pitch: 1.0, lang: "en-IN", voicePreference: "female"
  });
  const [availableVoices, setAvailableVoices] = useState([]);

  // Upload state
  const [uploadPreview, setUploadPreview] = useState(null); // { [key]: text }
  const [uploadFileName, setUploadFileName] = useState("");
  const fileInputRef = useRef(null);
  const textareaRefs = useRef({});

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis?.getVoices() || [];
      setAvailableVoices(voices.filter((v) => v.lang.startsWith("en")));
    };
    loadVoices();
    window.speechSynthesis?.addEventListener?.("voiceschanged", loadVoices);
    return () => window.speechSynthesis?.removeEventListener?.("voiceschanged", loadVoices);
  }, []);

  // Fetch current config on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/speech-config`);
        if (res.ok) {
          const data = await res.json();
          if (data._voiceSettings) setVoiceSettings((prev) => ({ ...prev, ...data._voiceSettings }));
          setConfig(data);
        }
      } catch {
        setStatus("Failed to load config — using defaults.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = (key, value) => setConfig((prev) => ({ ...prev, [key]: value }));

  /* ─── File Upload Handler ─── */
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const raw = ev.target?.result;
      if (typeof raw !== "string") return;
      const parsed = parseUploadedText(raw);
      const count = Object.keys(parsed).length;
      if (count === 0) {
        setStatus("⚠️ Could not detect any page sections in the file. Check the format.");
        setUploadPreview(null);
      } else {
        setUploadPreview(parsed);
        setStatus(`📄 Detected text for ${count} page(s) from "${file.name}". Review below and Apply.`);
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be re-uploaded
    e.target.value = "";
  };

  /* Apply uploaded preview into config */
  const applyUpload = () => {
    if (!uploadPreview) return;
    setConfig((prev) => {
      const next = { ...prev };
      for (const [key, text] of Object.entries(uploadPreview)) {
        next[key] = text;
      }
      return next;
    });
    setStatus(`✅ Applied ${Object.keys(uploadPreview).length} page(s) from upload. Edit below if needed, then Save.`);
    setUploadPreview(null);
    setUploadFileName("");
  };

  const cancelUpload = () => {
    setUploadPreview(null);
    setUploadFileName("");
    setStatus("");
  };

  const handleSave = async () => {
    if (!password) { setStatus("Enter admin password to save."); return; }
    setSaving(true);
    setStatus("");
    try {
      const res = await fetch(`${API_BASE}/api/speech-config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: { ...config, _voiceSettings: voiceSettings }, password }),
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config || config);
        setStatus("✅ Saved successfully! Changes will apply on next kiosk session.");
        setAuthenticated(true);
      } else if (res.status === 403) {
        setStatus("❌ Incorrect password.");
      } else {
        const err = await res.json().catch(() => ({}));
        setStatus(`❌ ${err.error || "Failed to save."}`);
      }
    } catch { setStatus("❌ Network error — could not reach server."); }
    finally { setSaving(false); }
  };

  // Test speech for a specific page key
  const testSpeak = (key, overrideText) => {
    const text = overrideText || config[key];
    if (!text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = voiceSettings.rate;
    utt.pitch = voiceSettings.pitch;
    utt.lang = voiceSettings.lang;
    const voices = window.speechSynthesis.getVoices();
    const pref = voiceSettings.voicePreference;
    let preferred;
    if (pref === "male")
      preferred = voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Male") || v.name.includes("David") || v.name.includes("James")));
    else if (pref === "female")
      preferred = voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Female") || v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Zira")));
    if (!preferred) preferred = voices.find((v) => v.lang.startsWith("en"));
    if (preferred) utt.voice = preferred;
    utt.onstart = () => setTesting(key);
    utt.onend = () => setTesting(null);
    utt.onerror = () => setTesting(null);
    window.speechSynthesis.speak(utt);
  };

  const stopTest = () => { window.speechSynthesis?.cancel(); setTesting(null); };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading speech config...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-orange-50 via-white to-orange-50 font-sans">
      {/* ═══ Fixed Header ═══ */}
      <div className="flex-shrink-0 bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-sm z-50">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="text-2xl text-gray-600 hover:text-orange-500 transition">←</button>
              <div>
                <h1 className="text-lg font-bold text-gray-800">🔊 Speech Config Editor</h1>
                <p className="text-[11px] text-gray-400">Edit what the kiosk says on each page — type or upload a file</p>
              </div>
            </div>
            <button onClick={handleSave} disabled={saving}
              className={`px-4 py-2 rounded-xl font-semibold text-sm shadow transition-all ${saving ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-lg active:scale-95"}`}>
              {saving ? "Saving..." : "💾 Save All"}
            </button>
          </div>
          {/* Auth + Upload row */}
          <div className="flex items-center gap-2 flex-wrap">
            {!authenticated ? (
              <input type="password" placeholder="Admin password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 min-w-[140px] border border-gray-300 rounded-lg px-3 py-1.5 text-sm caret-orange-600 cursor-text focus:border-orange-400 focus:ring-1 focus:ring-orange-200 outline-none" />
            ) : (
              <span className="text-green-600 text-sm font-medium">🔓 Authenticated</span>
            )}
            <button onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-all whitespace-nowrap">
              📄 Upload Text File
            </button>
            <input ref={fileInputRef} type="file" accept=".txt,.text,.md,.csv" className="hidden" onChange={handleFileUpload} />
          </div>
        </div>

        {/* Status bar */}
        {status && (
          <div className={`text-center text-xs py-1.5 font-medium ${status.startsWith("✅") ? "bg-green-50 text-green-700" : status.startsWith("❌") ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"}`}>
            {status}
          </div>
        )}
      </div>

      {/* ═══ Scrollable Content ═══ */}
      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="max-w-4xl mx-auto px-4 py-4 space-y-3 pb-6">

          {/* ─── Upload Preview Panel ─── */}
          {uploadPreview && (
            <div className="bg-blue-50 rounded-2xl border-2 border-blue-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-blue-800 text-sm">📄 File Preview — {uploadFileName}</h2>
                <div className="flex gap-2">
                  <button onClick={applyUpload} className="px-3 py-1 rounded-lg text-xs font-semibold bg-green-500 text-white hover:bg-green-600 transition">
                    ✅ Apply All
                  </button>
                  <button onClick={cancelUpload} className="px-3 py-1 rounded-lg text-xs font-semibold bg-gray-200 text-gray-600 hover:bg-gray-300 transition">
                    ✖ Cancel
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-blue-600">
                Detected {Object.keys(uploadPreview).length} of {PAGE_KEYS.length} pages. Review the extracted text, edit if needed, then click Apply.
              </p>

              {PAGE_KEYS.map((key) => {
                const text = uploadPreview[key];
                if (!text) return null;
                return (
                  <div key={key} className="bg-white rounded-xl border border-blue-100 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="font-semibold text-gray-800 text-xs">{PAGE_LABELS[key]}</span>
                        <span className="text-[10px] text-gray-400 font-mono ml-2">/{key}</span>
                      </div>
                      <button onClick={() => testSpeak(key, text)}
                        className={`text-[10px] px-2 py-1 rounded font-medium ${testing === key ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>
                        {testing === key ? "⏹ Stop" : "▶ Test"}
                      </button>
                    </div>
                    <textarea value={text} rows={2}
                      onChange={(e) => setUploadPreview((prev) => ({ ...prev, [key]: e.target.value }))}
                      className="w-full border border-blue-100 rounded-lg px-2 py-1.5 text-xs text-gray-700 caret-blue-600 cursor-text focus:border-blue-400 outline-none resize-none" />
                  </div>
                );
              })}

              {/* Show unmatched pages */}
              {PAGE_KEYS.filter((k) => !uploadPreview[k]).length > 0 && (
                <p className="text-[10px] text-gray-400 italic">
                  Not detected: {PAGE_KEYS.filter((k) => !uploadPreview[k]).map((k) => PAGE_LABELS[k]).join(", ")}
                </p>
              )}
            </div>
          )}

          {/* ─── Voice Settings Card ─── */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl shadow-sm border border-orange-200 p-4">
            <h2 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
              🎙️ Voice Settings
              <span className="text-[10px] font-normal text-gray-400">(applies to all pages)</span>
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Speed: {voiceSettings.rate.toFixed(2)}x</label>
                <input type="range" min="0.5" max="1.5" step="0.05" value={voiceSettings.rate}
                  onChange={(e) => setVoiceSettings((p) => ({ ...p, rate: parseFloat(e.target.value) }))}
                  className="w-full h-2 rounded-lg appearance-none bg-orange-200 accent-orange-500" />
                <div className="flex justify-between text-[9px] text-gray-400 mt-0.5"><span>Slow</span><span>Normal</span><span>Fast</span></div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Pitch: {voiceSettings.pitch.toFixed(2)}</label>
                <input type="range" min="0.5" max="1.5" step="0.05" value={voiceSettings.pitch}
                  onChange={(e) => setVoiceSettings((p) => ({ ...p, pitch: parseFloat(e.target.value) }))}
                  className="w-full h-2 rounded-lg appearance-none bg-orange-200 accent-orange-500" />
                <div className="flex justify-between text-[9px] text-gray-400 mt-0.5"><span>Deep</span><span>Normal</span><span>High</span></div>
              </div>
            </div>
            <div className="mt-3">
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Voice Type</label>
              <div className="flex gap-2">
                {["female", "male", "default"].map((v) => (
                  <button key={v} onClick={() => setVoiceSettings((p) => ({ ...p, voicePreference: v }))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${voiceSettings.voicePreference === v ? "bg-orange-500 text-white shadow" : "bg-white text-gray-600 border border-gray-200 active:bg-gray-50"}`}>
                    {v === "female" ? "👩 Female" : v === "male" ? "👨 Male" : "🔊 Default"}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => {
              const utt = new SpeechSynthesisUtterance("Hello! This is how I sound with the current settings.");
              utt.rate = voiceSettings.rate; utt.pitch = voiceSettings.pitch; utt.lang = voiceSettings.lang;
              const voices = window.speechSynthesis.getVoices(); const pref = voiceSettings.voicePreference; let preferred;
              if (pref === "male") preferred = voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Male") || v.name.includes("David")));
              else if (pref === "female") preferred = voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Female") || v.name.includes("Google") || v.name.includes("Zira")));
              if (!preferred) preferred = voices.find((v) => v.lang.startsWith("en"));
              if (preferred) utt.voice = preferred;
              window.speechSynthesis.cancel(); window.speechSynthesis.speak(utt);
            }} className="mt-3 w-full py-2 rounded-xl text-xs font-semibold bg-white border border-orange-300 text-orange-600 active:bg-orange-50 transition-all">
              🔊 Preview Voice Settings
            </button>
            {availableVoices.length > 0 && (
              <p className="text-[9px] text-gray-400 mt-2">{availableVoices.length} English voices available on this device</p>
            )}
          </div>

          {/* ─── Leaderboard Admin Panel ─── */}
          <LeaderboardAdminPanel />

          {/* ─── Page Reference + Upload Format Guide ─── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h2 className="font-bold text-gray-800 text-sm mb-2">📋 All Pages</h2>
            <p className="text-[10px] text-gray-400 mb-2">These are the pages the kiosk speaks on. Upload a .txt file with sections matching these names.</p>
            <div className="grid grid-cols-2 gap-1">
              {PAGE_KEYS.map((key) => (
                <div key={key} className="flex items-center gap-1.5 text-[11px] py-0.5">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${config[key] ? "bg-green-400" : DEFAULT_TEXTS[key] ? "bg-blue-300" : "bg-gray-200"}`} title={config[key] ? "Custom text" : DEFAULT_TEXTS[key] ? "Using default" : "No text"} />
                  <span className="text-gray-700 truncate">{PAGE_LABELS[key]}</span>
                  <span className="text-gray-300 font-mono">/{key}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 bg-gray-50 rounded-lg p-2.5 text-[10px] text-gray-500 font-mono leading-relaxed">
              <p className="font-sans font-medium text-gray-600 mb-1">Example file format:</p>
              Splash: Welcome to Reliv Health Kiosk. Please step forward.<br />
              Oxygen: Place your finger on the sensor. We will measure your oxygen level.<br />
              Body Composition: Please step on the scale. We will measure your weight and height.<br />
              Report 5: Here is your complete health report.
            </div>
          </div>

          {/* ─── Page Speech Entries ─── */}
          {PAGE_KEYS.map((key) => (
            <div key={key} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="min-w-0 mr-2">
                  <h3 className="font-semibold text-gray-800 text-sm truncate">{PAGE_LABELS[key]}</h3>
                  <span className="text-[10px] text-gray-400 font-mono">/{key}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => (testing === key ? stopTest() : testSpeak(key))}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${testing === key ? "bg-red-100 text-red-600 active:bg-red-200" : "bg-orange-100 text-orange-600 active:bg-orange-200"}`}>
                    {testing === key ? "⏹ Stop" : "▶ Test"}
                  </button>
                  <span className="text-[10px] text-gray-400 w-10 text-right">{(config[key] || "").length}/500</span>
                </div>
              </div>
              <textarea ref={(el) => (textareaRefs.current[key] = el)} value={config[key] || ""}
                onChange={(e) => handleChange(key, e.target.value)} maxLength={500} rows={2}
                placeholder={DEFAULT_TEXTS[key] ? `Default: ${DEFAULT_TEXTS[key]}` : "Enter what the speaker should say..."}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 caret-orange-600 cursor-text focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none resize-none transition-all" />
              {!config[key] && DEFAULT_TEXTS[key] && (
                <p className="text-[10px] text-blue-400 mt-1 italic">📢 Empty — will use default text shown above</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
