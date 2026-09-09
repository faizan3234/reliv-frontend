const normalizeVoiceText = (value = '') =>
  value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[.,!?;:"'()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const positiveConfirmations = new Set([
  'yes', 'yeah', 'yep', 'correct', 'right', "that's right", 'haan', 'han', 'ha', 'haan ji', 'sahi', 'sahi hai', 'theek', 'thik', 'hmm yes', 'हां', 'हाँ', 'सही', 'सही है', 'ठीक', 'হ্যাঁ', 'ঠিক', 'ঠিক আছে'
]);

const negativeConfirmations = new Set([
  'no', 'nope', 'wrong', 'incorrect', 'not correct', "that's wrong", 'it is wrong', 'change', 'change it', 'edit', 'edit it', 'nahi', 'nahin', 'na', 'galat', 'galat hai', 'ye galat hai', 'sahi nahi', 'sahi nahin', 'theek nahi', 'thik nahi', 'wrong hai', 'change karo', 'dobara', 'नहीं', 'गलत', 'गलत है', 'सही नहीं', 'ठीक नहीं', 'না', 'ভুল', 'ভুল আছে', 'ঠিক না', 'সঠিক না', 'naa', 'bhul', 'bhool', 'vul', 'vul ache', 'thik na', 'sothik na'
]);

const containsPhrase = (text, phrases) => {
  const arr = Array.from(phrases);
  return arr.some(p =>
    text === p ||
    text.startsWith(`${p} `) ||
    text.endsWith(` ${p}`) ||
    text.includes(` ${p} `) ||
    (/[\u0900-\u097F\u0980-\u09FF]/.test(p) && text.includes(p))
  );
};

const checkIntent = (transcript) => {
  const normalizedText = normalizeVoiceText(transcript);
  
  if (negativeConfirmations.has(normalizedText) || containsPhrase(normalizedText, negativeConfirmations)) {
      return 'NEGATIVE';
  } else if (positiveConfirmations.has(normalizedText) || containsPhrase(normalizedText, positiveConfirmations)) {
      return 'POSITIVE';
  }
  return 'UNKNOWN';
};

const tests = [
  // Negative
  "galat",
  "galat hai",
  "ye galat hai",
  "wrong",
  "no",
  "nahi",
  "गलत",
  "गलत है",
  "नहीं",
  "ভুল",
  "না",
  "ঠিক না",
  // Positive
  "yes",
  "haan",
  "sahi hai",
  "हाँ",
  "হ্যাঁ",
  "ঠিক আছে",
  // Edge cases
  "No, that's wrong",
  "Naam galat hai",
  "Ye naam galat hai",
  "না এটা ভুল",
  "এটা ঠিক না"
];

console.log("=== RUNNING UNICODE INTENT TESTS ===");
let allPassed = true;
tests.forEach(t => {
  const intent = checkIntent(t);
  console.log(`"${t}" -> ${intent}`);
  if (intent === 'UNKNOWN') {
    allPassed = false;
    console.error(`FAILED: ${t} should not be UNKNOWN`);
  }
});

if (allPassed) {
  console.log("\n✅ ALL TESTS PASSED");
} else {
  console.log("\n❌ SOME TESTS FAILED");
  process.exit(1);
}
