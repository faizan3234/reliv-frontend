import assert from "node:assert/strict";
import {
  parseConfirmation, parseServiceChoice, parseSpokenAge, parseSpokenGender, parseSpokenName, looksLikeRelivEcho,
} from "./src/voice/voicePageProfiles.js";

let passed = 0;
function check(parser, cases) {
  for (const [input, expected] of cases) {
    assert.equal(parser(input), expected, `${parser.name}(${JSON.stringify(input)})`);
    passed += 1;
  }
}
check(parseConfirmation, [
  ...["galat", "galat hai", "ye galat hai", "wrong", "no", "nahi", "गलत", "गलत है",
    "नहीं", "ভুল", "না", "ঠিক না", "No, that's wrong", "Naam galat hai", "Ye naam galat hai",
    "না এটা ভুল", "এটা ঠিক না", "not correct", "sahi nahi"].map((s) => [s, "negative"]),
  ...["yes", "haan", "sahi hai", "हाँ", "হ্যাঁ", "ঠিক আছে"].map((s) => [s, "positive"]),
  ...["Faizan", "Naina", "normal", "yesterday", ""].map((s) => [s, "unknown"]),
]);
check(parseSpokenGender, [
  ...["female", "femile", "Femile !", "femail", "woman", "girl", "mahila", "mohila",
    "মহিলা", "মেয়ে", "महिला", "I am a woman"].map((s) => [s, "female"]),
  ...["male", "mail", "man", "boy", "ladka", "chele", "purush", "পুরুষ", "लड़का"].map((s) => [s, "male"]),
  ...["other", "non-binary", "অন্যান্য", "अन्य"].map((s) => [s, "other"]),
  ...["male or female", "female or other", "email", "human", ""].map((s) => [s, null]),
]);
check(parseSpokenAge, [
  ...["40", "40 years", "umar 40 saal", "umr challis saal", "Challicell", "चालीस साल",
    "চল্লিশ বছর", "৪০", "४०"].map((s) => [s, 40]),
  ...["paitalish saal", "forty five", "forty-five", "পঁয়তাল্লিশ বছর", "पैंतालीस"].map((s) => [s, 45]),
  ["pandrah", 15], ["18 years", 18], ["eighteen years", 18],
  ["biranobboi", 92], ["বিরানব্বই বছর", 92], ["ninety two", 92],
  ["twenty one", 21], ["fifty nine", 59], ["sixty seven", 67],
  ["one hundred", 100], ["one hundred and twenty", 120], ["একশো", 100],
  ...["0", "121", "-5", "18.5", "18,5", "one hundred twenty one", "40 or 45",
    "forty or fifty", "nothing", "someone", ""].map((s) => [s, null]),
]);
check(parseServiceChoice, [
  ...["health checkup", "checkup karna hai", "checkup korbo", "স্বাস্থ্য পরীক্ষা",
    "हेल्थ चेकअप", "जाँच"].map((s) => [s, "HEALTH_CHECKUP"]),
  ...["medicine dispensing", "dawai chahiye", "oshudh nebo", "ওষুধ", "दवा"].map((s) => [s, "MEDICINE"]),
  ...["health checkup or medicine dispensing", "What would you like, health checkup or medicine?",
    "not medicine", "medicine nahi", "healthcare", "", "unknown"].map((s) => [s, null]),
]);
check(parseSpokenName, [
  // 1. Direct clean names
  ["Rahul", "Rahul"],
  ["Rahul Sharma", "Rahul Sharma"],
  ["Amit Kumar", "Amit Kumar"],
  ["Faizan Khan", "Faizan Khan"],
  ["Priya Patel", "Priya Patel"],
  ["Subhash Mukherjee", "Subhash Mukherjee"],
  ["A. K. Sen", "A K Sen"],
  ["Dr. Rajesh", "Rajesh"],
  ["Mr Amit Sharma", "Amit Sharma"],
  ["राहुल शर्मा", "राहुल शर्मा"],
  ["রাহুল শর্মা", "রাহুল শর্মা"],

  // 2. Prefixed spoken introductions (English, Hindi, Bengali)
  ["My name is Rahul", "Rahul"],
  ["My name is Rahul Sharma", "Rahul Sharma"],
  ["My name's Priya", "Priya"],
  ["I am Amit Kumar", "Amit Kumar"],
  ["I'm Faizan", "Faizan"],
  ["Myself Rahul Sharma", "Rahul Sharma"],
  ["The name is Ananya", "Ananya"],
  ["Mera naam Rahul hai", "Rahul"],
  ["Mera naam hai Amit", "Amit"],
  ["Mera name Rajesh", "Rajesh"],
  ["Mera nam Ananya Sen", "Ananya Sen"],
  ["Amar naam Rahul", "Rahul"],
  ["Amar naam hoche Subhash", "Subhash"],
  ["Amar naam holo Subhash", "Subhash"],
  ["Ami Rahul bolchi", "Rahul"],
  ["Ami Priya", "Priya"],
  ["मेरा नाम राहुल है", "राहुल"],
  ["मेरा नाम अमित कुमार", "अमित कुमार"],
  ["আমার নাম রাহুল", "রাহুল"],

  // 3. Suffixes
  ["Rahul Sharma hai", "Rahul Sharma"],
  ["Amit bol raha hu", "Amit"],
  ["Faizan bol raha hoon", "Faizan"],
  ["Priya bolte hain", "Priya"],
  ["Priya ji", "Priya"],
  ["Rajesh sir", "Rajesh"],
  ["Subhash babu", "Subhash"],
  ["Rahul here", "Rahul"],

  // 4. REJECTED: Prompt & Echo Weird Words
  ["Tell me your name", null],
  ["What is your name", null],
  ["Your name", null],
  ["Enter your name", null],
  ["Apna naam bataye", null],
  ["Naam batao", null],
  ["Naam boliye", null],
  ["Amar naam bolun", null],
  ["Reliv", null],
  ["Kiosk", null],
  ["Touchscreen", null],
  ["Machine", null],
  ["Details please", null],

  // 5. REJECTED: Service Choices as Name
  ["Health checkup", null],
  ["Health check", null],
  ["Medicine", null],
  ["Medicine dispensing", null],
  ["Checkup", null],
  ["Dawai", null],
  ["Oshudh", null],

  // 6. REJECTED: Gender & Age words as Name
  ["Male", null],
  ["Female", null],
  ["Other", null],
  ["Boy", null],
  ["Girl", null],
  ["25", null],
  ["Twenty five", null],
  ["Forty years", null],
  ["Age", null],

  // 7. REJECTED: Confirmations & Negations
  ["Yes", null],
  ["Haan", null],
  ["Haan ji", null],
  ["Sahi hai", null],
  ["Theek hai", null],
  ["No", null],
  ["Nahi", null],
  ["Wrong", null],
  ["Galat hai", null],
  ["Ok", null],
  ["Done", null],

  // 8. REJECTED: Greetings, Help, Noise, Whisper Hallucinations
  ["Hello", null],
  ["Namaste", null],
  ["Hi", null],
  ["Good morning", null],
  ["Thank you", null],
  ["Thanks", null],
  ["Subscribe", null],
  ["Help me", null],
  ["Ab kya kare", null],
  ["What to do", null],
  ["...", null],
  ["???", null],
  ["[cough]", null],
  ["Music", null],
  ["Silence", null],
  ["Mera naam", null], // Incomplete, user only said prefix
  ["My name is", null], // Incomplete
  ["I am", null], // Incomplete
  ["", null],
]);
const recent = [
  { text: "Proceeding to medicine dispensing.", at: 1000 },
  { text: "Is the selected gender female or male?", at: 1000 },
  { text: "Health checkup or medicine dispensing?", at: 1000 },
];
assert.equal(looksLikeRelivEcho("Proceeding to medicine dispensing", recent, 2000), true);
assert.equal(looksLikeRelivEcho("female", recent, 2000), false);
assert.equal(looksLikeRelivEcho("medicine dispensing", recent, 2000), false);
assert.equal(looksLikeRelivEcho("health checkup", recent, 2000), false);
assert.equal(looksLikeRelivEcho("yes", recent, 2000), false);
assert.equal(looksLikeRelivEcho("Proceeding to medicine dispensing", recent, 17000), false);

// 9. SERVICE CHOICE: Ordinals & Synonyms
assert.equal(parseServiceChoice("health checkup"), "HEALTH_CHECKUP");
assert.equal(parseServiceChoice("option 1"), "HEALTH_CHECKUP");
assert.equal(parseServiceChoice("option one"), "HEALTH_CHECKUP");
assert.equal(parseServiceChoice("pehla option"), "HEALTH_CHECKUP");
assert.equal(parseServiceChoice("first option"), "HEALTH_CHECKUP");
assert.equal(parseServiceChoice("medicine dispensing"), "MEDICINE");
assert.equal(parseServiceChoice("option 2"), "MEDICINE");
assert.equal(parseServiceChoice("option two"), "MEDICINE");
assert.equal(parseServiceChoice("dusra option"), "MEDICINE");
assert.equal(parseServiceChoice("doosra"), "MEDICINE");
assert.equal(parseServiceChoice("second option"), "MEDICINE");
assert.equal(parseServiceChoice("no medicine"), null);
assert.equal(parseServiceChoice("health or medicine"), null);

console.log(`${passed + 6 + 13} intent and echo assertions passed.`);

