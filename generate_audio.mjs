import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import translations
import { dict as CustomerDetailsDict } from './src/config/CustomerDetailsDict.js';
import { dict as PaymentDict } from './src/config/PaymentDict.js';
import { dict as TwoOptionsDict } from './src/config/TwoOptionsDict.js';

const enLocales = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/locales/en/translation.json'), 'utf8'));
const hiLocales = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/locales/hi/translation.json'), 'utf8'));
const bnLocales = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/locales/bn/translation.json'), 'utf8'));

const outDir = path.join(__dirname, 'public', 'assets', 'audio');

// Ensure output directories exist
['en', 'hi', 'bn'].forEach(lang => {
  fs.mkdirSync(path.join(outDir, lang), { recursive: true });
});

const manifest = {};
const allPhrases = [];

// Helper to add phrases
function addPhrase(text, lang, voice) {
  if (!text) return;
  const hash = crypto.createHash('md5').update(text).digest('hex');
  const filename = `${hash}.mp3`;
  manifest[text] = filename;
  
  const destPath = path.join(outDir, lang, filename);
  if (!fs.existsSync(destPath)) {
    allPhrases.push({ text, lang, voice, destPath });
  }
}

// 1. Splash hardcoded strings
const splashPhrases = {
  en: [
    "English selected. I'll guide you in English from here. Let's begin.",
    "Welcome to Reliv. Check your key health measurements in just a few minutes. Touch Start whenever you're ready — or simply talk to me and I'll guide you.",
    "Hello, welcome to Reliv.",
    "Free BP. Free Weight. Free Oxygen. Check your key health measurements in just a few minutes."
  ],
  hi: [
    "Hindi select ho gayi hai. Ab main aapko Hindi mein guide karungi. Chaliye shuru karte hain.",
    "Reliv mein aapka swagat hai.",
    "Main aapko English, Hindi ya Bengali mein guide kar sakti hoon. Apni language choose kijiye, ya seedha mujhe boliye — main aapke saath step by step rahungi."
  ],
  bn: [
    "বাংলা সিলেক্ট হয়েছে। এখন থেকে আমি আপনাকে বাংলায় গাইড করব। চলুন শুরু করি।"
  ]
};

splashPhrases.en.forEach(text => addPhrase(text, 'en', 'en-IN-NeerjaNeural'));
splashPhrases.hi.forEach(text => addPhrase(text, 'hi', 'hi-IN-SwaraNeural'));
splashPhrases.bn.forEach(text => addPhrase(text, 'bn', 'bn-IN-TanishaaNeural'));

// 2. SpeechContext DEFAULT_CONFIG
const speechContextDict = {
  "checkout": {
    en: "Review your selected medicines or health kits. When everything looks correct, continue to checkout.",
    hi: "अपनी selected medicines या health kits check कर लीजिए। सब सही हो तो checkout पर जाएँ।",
    bn: "Selected medicines বা health kits দেখে নিন। সব ঠিক থাকলে checkout করুন।"
  },
  "payment": {
    en: "Your tests are complete. To unlock the full plain-language report and progress insights for 17 rupees, scan the QR code with your phone. Complete the payment on your phone, then return here for your four-digit verification code.",
    hi: "आपके tests complete हो गए हैं। 17 rupees में full plain-language report और progress insights unlock करने के लिए phone से QR scan करें। Phone पर payment पूरा करें, फिर four-digit verification code के साथ यहाँ continue करें।",
    bn: "আপনার tests complete হয়েছে। 17 rupees-এ full plain-language report এবং progress insights unlock করতে phone দিয়ে QR scan করুন। Phone-এ payment শেষ করে four-digit verification code দিয়ে এখানে continue করুন।"
  },
  "order-success": {
    en: "All done. Your transaction is complete. Please collect your item if applicable, and check your phone or email for your receipt and report. Thank you for using Reliv.",
    hi: "सब हो गया। आपका transaction complete है। अगर medicine है counter से collect करें, और receipt/report के लिए phone या email check करें। Reliv इस्तेमाल करने के लिए धन्यवाद।",
    bn: "সব হয়ে গেছে। আপনার transaction complete। Medicine থাকলে collect করুন এবং receipt/report-এর জন্য phone বা email check করুন। Reliv ব্যবহার করার জন্য ধন্যবাদ।"
  },
  "feedback": {
    en: "Before you go, how was your experience with Reliv? Your feedback helps us improve.",
    hi: "जाने से पहले बताइए, Reliv का experience कैसा रहा? आपका feedback हमें बेहतर बनने में मदद करता है।",
    bn: "যাওয়ার আগে বলুন, Reliv-এর experience কেমন ছিল? আপনার feedback আমাদের আরও ভালো হতে সাহায্য করবে।"
  },
  "idle-loop": {
    en: "Free weight. Free BP. Free oxygen. A full report with simple human advice, just 17 rupees. Less than a Coke. Step up. Let me help you.",
    hi: "Free weight. Free BP. Free oxygen. A full report with simple human advice, just 17 rupees. Less than a Coke. Step up. Let me help you.",
    bn: "Free weight. Free BP. Free oxygen. A full report with simple human advice, just 17 rupees. Less than a Coke. Step up. Let me help you."
  },
  "leaderboard": {
    en: "Take a moment to appreciate our campus health heroes. These students took charge of their health. Can you beat them? Step up to the Reliv kiosk!",
    hi: "Take a moment to appreciate our campus health heroes. These students took charge of their health. Can you beat them? Step up to the Reliv kiosk!",
    bn: "Take a moment to appreciate our campus health heroes. These students took charge of their health. Can you beat them? Step up to the Reliv kiosk!"
  }
};

const dicts = [CustomerDetailsDict, PaymentDict, TwoOptionsDict, speechContextDict];
dicts.forEach(d => {
  for (const key in d) {
    const val = d[key];
    if (typeof val === 'object' && !Array.isArray(val)) {
      addPhrase(val.en, 'en', 'en-IN-NeerjaNeural');
      addPhrase(val.hi, 'hi', 'hi-IN-SwaraNeural');
      addPhrase(val.bn, 'bn', 'bn-IN-TanishaaNeural');
    }
  }
});

// 3. translation.json files
for (const key in enLocales) {
  addPhrase(enLocales[key], 'en', 'en-IN-NeerjaNeural');
}
for (const key in hiLocales) {
  addPhrase(hiLocales[key], 'hi', 'hi-IN-SwaraNeural');
}
for (const key in bnLocales) {
  addPhrase(bnLocales[key], 'bn', 'bn-IN-TanishaaNeural');
}

// Generate MP3s using edge-tts
console.log(`Need to generate ${allPhrases.length} new audio files...`);
for (const item of allPhrases) {
  console.log(`Generating: ${item.lang} / ${item.text.substring(0, 30)}...`);
  try {
    // Note: requires edge-tts to be installed globally or in current python venv
    execSync(`python -m edge_tts --voice ${item.voice} --text "${item.text.replace(/"/g, '\\"')}" --write-media "${item.destPath}"`, { stdio: 'inherit' });
  } catch (e) {
    console.error("Error generating audio:", e.message);
  }
}

// Write manifest
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log("Audio generation complete! Manifest saved.");
