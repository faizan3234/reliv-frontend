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
    "शरीर", "হেলথ", "চেকআপ", "স্বাস্থ্য", "শরীর", "স্বাস্থ্য পরীক্ষা",
  ]);
  const medicine = containsPhrase(raw, [
    "medicine", "medicines", "medicine dispensing", "medicine kit", "meds", "dispenser",
    "dawa", "dawai", "दवा", "दवाई", "मेडिसिन", "डिस्पेंसर", "oshudh", "osudh",
    "ওষুধ", "ঔষধ", "মেডিসিন", "দাওয়াই", "ডিস্পেন্সার",
  ]);
  // A prompt naming both choices, or a negated choice, is not a selection.
  if (health === medicine || containsPhrase(raw, ["no", "not", "don't", "nahi", "nahin", "না", "নয়", "नहीं"])) return null;
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
  // Short legitimate replies often repeat words from a prompt ("female", "yes").
  if (words.length < 4) return false;
  return recent.some(({ text: spoken, at }) => {
    if (now - at > 15000 || now < at) return false;
    const normalized = normalizeVoiceText(spoken);
    if (text === normalized) return true;
    const a = new Set(words);
    const b = new Set(normalized.split(" "));
    const common = [...a].filter((word) => b.has(word)).length;
    return common / Math.max(a.size, b.size) >= 0.85;
  });
}
