export function normalizeVoiceText(value = "") {
  return String(value).normalize("NFKC").toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

export function containsPhrase(text, phrases) {
  const padded = ` ${normalizeVoiceText(text)} `;
  return [...phrases].some((phrase) => padded.includes(` ${normalizeVoiceText(phrase)} `));
}

const POSITIVE = [
  "yes", "yeah", "yep", "correct", "right", "that's right", "haan", "han", "ha",
  "haan ji", "sahi", "sahi hai", "theek", "thik", "hmm yes",
  "हां", "हाँ", "सही", "सही है", "ठीक", "হ্যাঁ", "ঠিক", "ঠিক আছে",
];
const NEGATIVE = [
  "no", "nope", "wrong", "incorrect", "not correct", "that's wrong", "it is wrong",
  "change", "change it", "edit", "edit it", "nahi", "nahin", "na", "galat",
  "galat hai", "ye galat hai", "sahi nahi", "sahi nahin", "theek nahi", "thik nahi",
  "wrong hai", "change karo", "dobara", "नहीं", "गलत", "गलत है", "सही नहीं",
  "ठीक नहीं", "ना", "না", "ভুল", "ভুল আছে", "ঠিক না", "সঠিক না", "naa", "bhul",
  "bhool", "vul", "vul ache", "thik na", "sothik na",
];

export function parseConfirmation(raw) {
  if (containsPhrase(raw, NEGATIVE)) return "negative";
  if (containsPhrase(raw, POSITIVE)) return "positive";
  return "unknown";
}

export function parseServiceChoice(raw) {
  const health = containsPhrase(raw, [
    "health", "health checkup", "health check", "healthcheck", "checkup", "check up",
    "body", "jaanch", "jaancha", "जांच", "जाँच", "हेल्थ", "चेकअप", "स्वास्थ्य",
    "\u0936\u0930\u0940\u0930", "\u09b9\u09c7\u09b2\u09a5", "\u099a\u09c7\u0995\u0986\u09aa", "\u09b8\u09cd\u09ac\u09be\u09b8\u09cd\u09a5\u09cd\u09af", "\u09b6\u09b0\u09c0\u09b0", "\u09b8\u09cd\u09ac\u09be\u09b8\u09cd\u09a5\u09cd\u09af \u09aa\u09b0\u09c0\u0995\u09cd\u09b7\u09be",
    "option 1", "option one", "first option", "first", "pehla", "pahla", "pehla option",
    "ek number", "number 1", "number ek", "\u092a\u0939\u0932\u093e", "\u092a\u0939\u0932\u093e \u0911\u092a\u094d\u0936\u0928", "\u09aa\u09cd\u09b0\u09a5\u09ae", "\u09aa\u09cd\u09b0\u09a5\u09ae \u0985\u09aa\u09b6\u09a8"
  ]);
  const medicine = containsPhrase(raw, [
    "medicine", "medicines", "medicine dispensing", "medicine kit", "meds", "dispenser",
    "dawa", "dawai", "\u0926\u0935\u093e", "\u0926\u0935\u093e\u0908", "\u092e\u0947\u0921\u093f\u0938\u093f\u0928", "\u0921\u093f\u0938\u094d\u092a\u0947\u0902\u0938\u0930", "oshudh", "osudh",
    "\u0993\u09b7\u09c1\u09a7", "\u0994\u09b7\u09a7", "\u09ae\u09c7\u09a1\u09bf\u09b8\u09bf\u09a8", "\u09a6\u09be\u0993\u09af\u09bc\u09be\u0987", "\u09a1\u09bf\u09b8\u09cd\u09aa\u09c7\u09a8\u09cd\u09b8\u09be\u09b0",
    "option 2", "option two", "second option", "second", "dusra", "doosra", "dusra option",
    "doosra option", "do number", "number 2", "number do", "\u0926\u0942\u0938\u0930\u093e", "\u0926\u0942\u0938\u0930\u093e \u0911\u092a\u094d\u0936\u0928", "\u09a6\u09cd\u09ac\u09bf\u09a4\u09c0\u09af\u09bc", "\u09a6\u09cd\u09ac\u09bf\u09a4\u09c0\u09af\u09bc \u0985\u09aa\u09b6\u09a8"
  ]);
  // A prompt naming both choices, or a negated choice, is not a selection.
  if (health === medicine || containsPhrase(raw, ["no", "not", "don't", "nahi", "nahin", "\u09a8\u09be", "\u09a8\u09af\u09bc", "\u0928\u0939\u0940\u0902"])) return null;
  return health ? "HEALTH_CHECKUP" : "MEDICINE";
}

export function parseSpokenGender(raw) {
  const matches = [
    ["female", ["female", "femile", "femail", "woman", "women", "girl", "lady",
      "mahila", "maheela", "mohila", "aurat", "ladki", "ladaki", "stree", "stri", "nari",
      "महिला", "औरत", "लड़की", "स्त्री", "नारी", "फीमेल",
      "মহিলা", "নারী", "মেয়ে", "মেয়ে", "ফিমেল", "ফিমেইল"]],
    ["male", ["male", "mail", "mel", "man", "boy", "gentleman", "aadmi", "purush",
      "mard", "ladka", "ladaka", "chele", "chhele", "पुरुष", "मर्द", "लड़का", "मेल",
      "आदमी", "পুরুষ", "ছেলে", "মেল", "মেইল", "পুরুস", "আদমি"]],
    ["other", ["other", "others", "nonbinary", "non binary", "अन्य", "अदर", "অন্যান্য", "অন্য", "আদার"]],
  ].filter(([, aliases]) => containsPhrase(raw, aliases));
  return matches.length === 1 ? matches[0][0] : null;
}

const AGE_WORDS = {
          // English
          "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
          "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14, "fifteen": 15, "sixteen": 16, "seventeen": 17, "eighteen": 18, "nineteen": 19, "twenty": 20,
          "twenty one": 21, "twenty two": 22, "twenty three": 23, "twenty four": 24, "twenty five": 25, "twenty six": 26, "twenty seven": 27, "twenty eight": 28, "twenty nine": 29, "thirty": 30,
          "thirty one": 31, "thirty two": 32, "thirty three": 33, "thirty four": 34, "thirty five": 35, "thirty six": 36, "thirty seven": 37, "thirty eight": 38, "thirty nine": 39, "forty": 40,
          "forty one": 41, "forty two": 42, "forty three": 43, "forty four": 44, "forty five": 45, "forty six": 46, "forty seven": 47, "forty eight": 48, "forty nine": 49, "fifty": 50,
          "fifty five": 55, "sixty": 60, "sixty five": 65, "seventy": 70, "seventy five": 75, "eighty": 80, "ninety": 90,
          // Hindi (Transliterated & Devanagari)
          "ek": 1, "do": 2, "teen": 3, "char": 4, "paanch": 5, "panch": 5, "chhah": 6, "che": 6, "saat": 7, "aath": 8, "nau": 9, "das": 10,
          "gyarah": 11, "barah": 12, "terah": 13, "chaudah": 14, "pandrah": 15, "solah": 16, "satrah": 17, "atharah": 18, "unnis": 19, "bees": 20,
          "ikkees": 21, "baais": 22, "baees": 22, "teees": 23, "chaubees": 24, "pachchees": 25, "pachees": 25, "chhabbees": 26, "sattaees": 27, "atthaees": 28, "untees": 29, "tees": 30,
          "iktees": 31, "battees": 32, "tentees": 33, "chauntees": 34, "paintees": 35, "chhattees": 36, "saintees": 37, "adtees": 38, "untalees": 39, "chalees": 40,
          "iktalees": 41, "bayalees": 42, "taintalees": 43, "chawalees": 44, "paintalees": 45, "chhiyalees": 46, "saintalees": 47, "adtalees": 48, "unchaas": 49, "pachaas": 50,
          "ekavvan": 51, "baavan": 52, "tirpan": 53, "chawwan": 54, "pachpan": 55, "chhappan": 56, "sattawan": 57, "atthaavan": 58, "unsath": 59, "saath": 60,
          "पैंतीस": 35, "छब्बीस": 26, "पच्चीस": 25, "चौबीस": 24, "तेईस": 23, "बाईस": 22, "इक्कीस": 21, "बीस": 20, "उन्नीस": 19, "अठारह": 18, "सत्रह": 17, "सोलह": 16, "पंद्रह": 15, "चौदह": 14, "तेरह": 13, "बारह": 12, "ग्यारह": 11, "दस": 10, "तीस": 30, "चालीस": 40, "पचास": 50, "साठ": 60,
          // Bengali (Transliterated & Bengali Script)
          "dui": 2, "tin": 3, "paach": 5, "chhoy": 6, "aat": 8, "noy": 9, "dosh": 10,
          "egaro": 11, "baro": 12, "tero": 13, "choddo": 14, "ponero": 15, "sholo": 16, "sotero": 17, "atharo": 18, "unish": 19, "kuri": 20, "bish": 20,
          "ekush": 21, "baish": 22, "teish": 23, "chobbish": 24, "pochish": 25, "chabbish": 26, "shatash": 27, "athash": 28, "untrish": 29, "trish": 30,
          "ektrish": 31, "botrish": 32, "tetrish": 33, "choutrish": 34, "poyntrish": 35, "chhotrish": 36, "shaytrish": 37, "athtrish": 38, "unochollish": 39, "chollish": 40,
          "একুশ": 21, "বাইশ": 22, "তেইশ": 23, "চব্বিশ": 24, "পঁচিশ": 25, "ছাব্বিশ": 26, "সাতাশ": 27, "আটাশ": 28, "উনত্রিশ": 29, "ত্রিশ": 30, "চল্লিশ": 40, "পঞ্চাশ": 50, "ষাট": 60, "কুড়ি": 20, "বিশ": 20
        };

const AGE_ALIASES = {
  15: ["pandra", "pandara", "पन्द्रह", "পনেরো"],
  18: ["athara", "athra", "আঠারো"],
  20: ["bis", "बीस"],
  30: ["tis"],
  40: ["chalis", "challis", "chalish", "chaalis", "chalicell", "challicell"],
  45: ["paitalis", "paitalish", "paintalis", "paintalish", "पैंतालीस", "পঁয়তাল্লিশ", "poytallish"],
  50: ["pachas", "ponchash"],
  60: ["sath", "shaat"],
  70: ["sattar", "सत्तर", "sottor", "সত্তর"],
  80: ["assi", "अस्सी", "ashi", "আশি"],
  90: ["nabbe", "navve", "नब्बे", "nobboi", "নব্বই"],
  92: ["biranobboi", "biranabboi", "biranoboi", "বিরানব্বই"],
  100: ["hundred", "one hundred", "sau", "saw", "सौ", "eksho", "একশো"],
};
for (const [age, words] of Object.entries(AGE_ALIASES)) {
  for (const word of words) AGE_WORDS[normalizeVoiceText(word)] = Number(age);
}
const UNITS = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
const TEENS = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
function englishNumber(n) {
  if (n < 10) return UNITS[n];
  if (n < 20) return TEENS[n - 10];
  if (n < 100) return [TENS[Math.floor(n / 10)], UNITS[n % 10]].filter(Boolean).join(" ");
  return "one hundred" + (n % 100 ? " " + englishNumber(n % 100) : "");
}
for (let n = 1; n <= 120; n += 1) {
  AGE_WORDS[englishNumber(n)] = n;
  if (n > 100) AGE_WORDS["one hundred and " + englishNumber(n - 100)] = n;
}
const AGE_PHRASES = Object.entries(AGE_WORDS)
  .map(([word, age]) => [normalizeVoiceText(word).split(" "), age])
  .sort((a, b) => b[0].length - a[0].length);

export function parseSpokenAge(raw) {
  const digits = String(raw).replace(/[०-९০-৯]/g, (c) =>
    String(c.charCodeAt(0) - (c >= "০" ? 0x09e6 : 0x0966)));
  if (/(?:^|\s)-\s*\d|\d[.,]\d/.test(digits)) return null;
  const tokens = normalizeVoiceText(digits).split(" ");
  const numbers = [];
  for (let i = 0; i < tokens.length; i += 1) {
    if (/^\d+$/.test(tokens[i])) {
      numbers.push(Number(tokens[i]));
      continue;
    }
    const match = AGE_PHRASES.find(([words]) =>
      words.every((word, offset) => tokens[i + offset] === word));
    if (match) {
      numbers.push(match[1]);
      i += match[0].length - 1;
    }
  }
  const [age] = numbers;
  return numbers.length === 1 && Number.isInteger(age) && age >= 1 && age <= 120 ? age : null;
}

export function looksLikeRelivEcho(raw, recent, now = Date.now()) {
  const text = normalizeVoiceText(raw);
  const words = text.split(" ").filter(Boolean);
  // Short legitimate replies often repeat words from a prompt ("female", "yes", "medicine dispensing").
  const shortRetry = /^(?:sorry(?: try again)?|try again|please try again|sorry please|फिर से बोलिए|আবার বলুন)$/u.test(text);
  if (words.length < 4 && !shortRetry) return false;
  return recent.some(({ text: spoken, at }) => {
    if (now - at > 15000 || now < at) return false;
    const normalized = normalizeVoiceText(spoken);
    if (text === normalized) return true;
    // If the 4+ word utterance is a direct contiguous substring of the spoken prompt
    if (normalized.includes(text)) return true;
    const a = new Set(words);
    const b = new Set(normalized.split(" "));
    const common = [...a].filter((word) => b.has(word)).length;
    // Overlap relative to the captured utterance
    return common / a.size >= 0.85;
  });
}

const NAME_PREFIX_REGEXES = [
  // English introductory prefixes
  /^(?:my name is|the name is|my name's|my name|name is|name's|name|myself|i am|i'm|im|this is|call me|here is|it is|it's)\s+/i,
  // Hindi / Hinglish / Urdu introductory prefixes
  /^(?:mera naam hai|mera naam|mera nam hai|mera nam|mera name hai|mera name|mera|hamara naam hai|hamara naam|humara naam hai|humara naam|humara nam|humara|main hoon|main hu|mai hoon|mai hu|main|mai|hum|apna naam hai|apna naam|naam hai|naam)\s+/i,
  // Bengali introductory prefixes
  /^(?:amar naam hoche|amar nam hoche|amar naam holo|amar nam holo|amar naam|amar nam|amar name|ami|amake|apnar naam|naam holo|naam hoche)\s+/i,
  // Devanagari script prefixes
  /^(?:मेरा नाम है|मेरा नाम|मेरा नाम हे|मेरा नाम हु|मेरा नाम हूँ|मेरा नाम हुं|मैं हूँ|मैं हु|मैं|हमारा नाम है|हमारा नाम|हम|माय नेम इज|माय नेम)\s+/u,
  // Bengali script prefixes
  /^(?:আমার নাম হচ্ছে|আমার নাম হলো|আমার নাম|আমি|আমার|মাই নেম ইজ|মাই নেম)\s+/u,
  // Common titles to strip so name is preserved
  /^(?:mr|mrs|ms|miss|dr|doctor|shri|shree|smt|shrimati|janab|md|mohd|mohammad|md\.)\s+/i,
];

const NAME_SUFFIX_REGEXES = [
  /\s+(?:bol raha hu|bol raha hoon|bol rahi hu|bol rahi hoon|bol rahe hai|bol rahe hain|bolte hai|bolte hain|bolta hai|bolti hai|bolchi|shuncho|bolun)$/i,
  /\s+(?:naam hai|nam hai|name hai|naam|nam)$/i,
  /\s+(?:hai|hain|hoche|holo|hobe|hona|haye|bolte|bolta|bolti|है|हैं|हूँ|हुँ|हूं|हो|হচ্ছে|হলো|হয়|হবে)$/i,
  /\s+(?:ji|babu|da|dada|bhai|bhaiya|sir|madam|here|speaking|this side)$/i,
  /\s+(?:জি|বাবু|দা|দাদা|ভাই|স্যার|ম্যাডাম)$/u,
  /\s+(?:जी|बाबू|सर|मैडम)$/u,
];

export const INVALID_NAME_WORDS = new Set([
  // Kiosk UI & System keywords
  "reliv", "kiosk", "screen", "machine", "device", "detail", "details", "touch", "touchscreen", "phone", "camera",
  "qr", "scan", "code", "payment", "rupee", "rupees", "start", "stop", "cancel", "submit",
  "save", "saved", "proceed", "proceeding", "next", "back", "done", "complete", "completed",
  "all", "exit", "finish", "home", "menu", "option", "options",

  // Prompt / Form instruction words
  "name", "names", "fullname", "full", "first", "last", "naam", "nam", "apna", "apana", "amar",
  "apnar", "tell", "enter", "type", "speak", "batao", "bataiye", "bataye", "batai", "batana", "bolo", "boliye", "bolun",
  "bolen", "bolna", "shuno", "shunun", "dikhao", "dekhun", "please", "kripya", "doya",

  // Services & Medical keywords
  "health", "checkup", "check", "body", "composition", "weight", "height", "bp", "blood",
  "pressure", "pulse", "oxygen", "spo2", "temperature", "temp", "eyesight", "eye",
  "medicine", "medicines", "dispensing", "dispenser", "kit", "dawa", "dawai", "oshudh",
  "osudh", "doctor", "hospital", "clinic", "patient", "customer", "user", "test", "testing",
  "report", "reports", "result", "results", "summary",

  // Gender keywords
  "male", "female", "femile", "man", "woman", "boy", "girl", "lady", "gentleman", "aadmi", "admi",
  "mahila", "purush", "aurat", "mard", "ladka", "ladki", "chele", "chhele", "meye",
  "other", "others", "nonbinary", "non-binary", "transgender", "gender",

  // Age & Numbers
  "age", "year", "years", "old", "saal", "sal", "umar", "umr", "bochor", "bocchor",
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty",
  "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety", "hundred",
  "ek", "do", "teen", "char", "paanch", "panch", "chhah", "che", "saat", "aath", "nau", "das",
  "gyarah", "barah", "terah", "chaudah", "pandrah", "solah", "satrah", "atharah", "unnis", "bees",
  "challis", "chalees", "paitalish", "paintalees", "pachaas", "saath", "sattar", "assi", "nabbe", "sau",
  "dui", "tin", "paach", "chhoy", "dosh", "kuri", "bish", "chollish", "ponchash", "eksho",

  // Confirmation & Negation keywords
  "yes", "yeah", "yep", "yup", "haan", "han", "ha", "ji", "haanji", "haji", "sahi", "theek",
  "thik", "correct", "right", "true", "ok", "okay", "accha", "achha", "sure", "fine",
  "no", "nope", "nah", "naah", "naa", "na", "nahi", "nahin", "nhi", "wrong", "incorrect",
  "galat", "bhul", "bhool", "vul", "false", "change", "edit", "wait", "ruko", "ruk",
  "darao", "thamo", "hold",

  // Greetings & Courtesy
  "hello", "hi", "hey", "namaste", "namaskar", "pranam", "salam", "adaab", "alvida",
  "good", "morning", "afternoon", "evening", "night", "day",
  "bye", "goodbye", "tata", "sir", "madam", "maam", "bhai", "bhaiya", "didi", "dada",
  "babu", "friend", "uncle", "aunty", "listen", "excuse", "thank", "thanks", "dhanyawad",
  "shukriya", "dhonnobad", "welcome", "sorry", "maaf", "dukkho",

  // Questions / Doubts / Help
  "what", "who", "where", "when", "why", "how", "which", "kya", "kaun", "kahan", "kab",
  "kyun", "kaise", "kisko", "kisne", "ki", "ke", "kothay", "keno", "kibhabe", "kake",
  "ab", "kare", "karein", "karna", "karu", "karo", "korbo", "korte", "hobe", "aage",
  "help", "madad", "sahajyo", "sahayata", "samajh", "samjh", "pata", "malum", "bujhte",
  "nothing", "kuch", "kichu", "none", "nobody",

  // Whisper noise / hallucinations
  "music", "silence", "applause", "laugh", "laughter", "cough", "throat", "sigh", "sighs",
  "bell", "birds", "chirping", "mimics", "sound", "noise", "audio", "mic", "microphone",
  "subscribe", "channel", "amaraorg", "watching", "video", "subtitle", "subtitles",
  "caption", "captions", "transcribed", "translated", "copyright",

  // Common stop words / Pronouns
  "i", "me", "my", "mine", "myself", "you", "your", "yours", "yourself", "he", "him", "his", "himself", "she", "her", "hers", "herself",
  "it", "its", "itself", "they", "them", "their", "theirs", "themselves", "we", "us", "our", "ours",
  "this", "that", "these", "those", "here", "there", "where",
  "am", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "doing",
  "would", "should", "could", "will", "shall", "can", "may", "might", "must",
  "about", "above", "across", "after", "again", "against", "along", "already",
  "and", "but", "or", "because", "as", "until", "while", "of", "at", "by", "for",
  "with", "without", "into", "through", "during", "before", "under", "between",

  // Hindi / Bengali Script equivalents
  "हाँ", "हां", "नहीं", "ना", "सही", "गलत", "ठीक", "ভুল", "হ্যাঁ", "না", "ঠিক",
  "ओके", "अच्छा", "हेलो", "नमस्ते", "नमस्कार", "धन्यवाद", "शुक्रिया", "ধন্যবাদ",
  "হেলো", "নমস্কার", "মদদ", "সাহায্য", "সাহায্য করুন", "কি করবো", "কী করব",
  "क्या करें", "क्या करूं", "समझ नहीं", "पता नहीं", "पुरुष", "महिला", "लड़का", "लड़की",
  "पुरुष", "মহিলা", "ছেলে", "মেয়ে", "বয়স", "उम्र", "साल", "বছর", "হেalth", "চেকআপ",
  "মেডিসিন", "ওষুধ", "ঔষধ", "दवाई", "दवा"
]);

export function parseSpokenName(raw, recentPrompts = []) {
  if (!raw || typeof raw !== "string") return null;

  // 1. Expand contractions before stripping punctuation, then strip Whisper artifacts
  let text = raw
    .replace(/\b(name|it|here|what|that)'s\b/gi, "$1 is")
    .replace(/\bi'm\b/gi, "i am")
    .replace(/\[.*?\]/g, " ")
    .replace(/\(.*?\)/g, " ")
    .replace(/\*.*?\*/g, " ")
    .replace(/<.*?>/g, " ")
    .replace(/[.,/#!$%^&*;:{}=_`~()?"'<>।॥]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length < 2 || /^\d+$/.test(text)) return null;

  // 2. Check against recent spoken prompt echo
  if (Array.isArray(recentPrompts) && recentPrompts.length > 0) {
    const norm = normalizeVoiceText(text);
    const isEcho = recentPrompts.some(({ text: spoken, at }) => {
      if (Date.now() - at > 15000) return false;
      const normSpoken = normalizeVoiceText(spoken);
      return normSpoken.includes(norm);
    });
    if (isEcho) return null;
  }

  // 3. Strip introductory prefixes in a loop (e.g. "My name is Mr Rahul" -> "Mr Rahul" -> "Rahul")
  let stripped = text;
  let changed = true;
  let passes = 0;
  while (changed && passes < 3) {
    changed = false;
    passes += 1;
    for (const rx of NAME_PREFIX_REGEXES) {
      if (rx.test(stripped)) {
        stripped = stripped.replace(rx, "").trim();
        changed = true;
      }
    }
  }

  // 4. Strip conversational suffixes in a loop
  changed = true;
  passes = 0;
  while (changed && passes < 3) {
    changed = false;
    passes += 1;
    for (const rx of NAME_SUFFIX_REGEXES) {
      if (rx.test(stripped)) {
        stripped = stripped.replace(rx, "").trim();
        changed = true;
      }
    }
  }

  // 5. Retain only Unicode letters, mark/vowel characters (matras), hyphens, and whitespace
  stripped = stripped.replace(/[^\p{L}\p{M}\s-]/gu, " ").replace(/\s+/g, " ").trim();

  // Length boundary for realistic human names
  if (stripped.length < 2 || stripped.length > 40) return null;

  // 6. Split into words and evaluate for invalid/stop/garbage tokens
  const words = stripped.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;

  // Entire phrase matches an invalid token
  const lowerPhrase = stripped.toLowerCase();
  if (INVALID_NAME_WORDS.has(lowerPhrase)) return null;

  // If single word: must not be in invalid list and must not be a repetitive noise string
  if (words.length === 1) {
    const word = words[0];
    if (INVALID_NAME_WORDS.has(word)) return null;
    if (word.length < 2) return null;
    // Reject repeated character noise (e.g. "aaaa", "zzzz")
    if (/^(.)\1+$/.test(word)) return null;
  } else {
    // Multi-word phrase: if EVERY word is in INVALID_NAME_WORDS, reject
    // e.g. "health checkup", "thank you", "hello sir", "twenty five", "tell me"
    const invalidCount = words.filter((w) => INVALID_NAME_WORDS.has(w)).length;
    if (invalidCount === words.length) return null;
    // If more than half of the words are invalid words, reject
    if (invalidCount >= Math.ceil(words.length * 0.6)) return null;
  }

  // 7. Format clean Title Case for each word (preserves non-Latin scripts cleanly)
  const formatted = stripped
    .split(/\s+/)
    .map((w) => {
      if (w.length === 1) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");

  return formatted;
}

