import assert from "node:assert/strict";
import {
  parseConfirmation, parseServiceChoice, parseSpokenAge, parseSpokenGender, looksLikeRelivEcho,
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
console.log(`${passed + 6} intent and echo assertions passed.`);
