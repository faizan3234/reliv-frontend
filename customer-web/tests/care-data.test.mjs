import test from "node:test";
import assert from "node:assert/strict";
import {
  confirmedFood,
  totals,
  profileFrom,
  dayKey,
} from "../src/care/data.js";
const food = {
  id: "paneer",
  name: "Paneer",
  kcal: 300,
  protein: 20,
  carbs: 4,
  fat: 23,
  source: "test reference",
};
test("only confirmed consumed portion contributes to nutrition totals", () => {
  const entry = { ...confirmedFood(food, 200, 50), day: "2026-10-30" };
  assert.equal(entry.kcal, 300);
  assert.equal(entry.protein, 20);
  const result = totals(
    [
      entry,
      { kind: "water", amount: 250, day: entry.day },
      { ...entry, day: "2026-10-29" },
    ],
    entry.day,
  );
  assert.equal(result.kcal, 300);
  assert.equal(result.water, 250);
  assert.equal(result.meals, 1);
});
test("unknown foods, invalid portions and malformed nutrients cannot be logged", () => {
  for (const input of ["", NaN, Infinity, -1, 0, 3001])
    assert.throws(() => confirmedFood(food, input));
  assert.throws(() => confirmedFood(null, 100));
  assert.throws(() => confirmedFood({ ...food, protein: NaN }, 100));
  assert.throws(() => confirmedFood(food, 100, 101));
});
test("setup does not manufacture body composition or automatic nutrition targets", () => {
  const p = profileFrom({
    name: "Rahul",
    age: 30,
    height: 172,
    weight: 65,
    target: 65,
    goal: "maintain",
  });
  assert.equal(p.calories, null);
  assert.equal(p.protein, null);
  assert.equal(p.bodyFat, undefined);
  assert.throws(() => profileFrom({ ...p, age: 10 }));
  assert.throws(() => profileFrom({ ...p, weight: "" }));
});
test("local day keys avoid UTC day boundaries", () => {
  assert.equal(dayKey(new Date(2026, 9, 30, 0, 1)), "2026-10-30");
});
