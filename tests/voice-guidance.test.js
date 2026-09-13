import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isHelpRequest } from '../src/voice/helpIntent.js';
import { GuidanceTimer } from '../src/voice/guidanceTimer.js';
import { GUIDANCE, ROUTE_GUIDANCE, guidanceText, isGuidedRoute } from '../src/voice/guidanceCopy.js';

test('help requests cover the supplied English, Hindi and Bengali variants', () => {
  for (const phrase of ['ab kya karna hai', 'kya krna hai', 'kaise karna hai', 'ki korbo',
    'abar ki kerom korte hobe', 'ki bhabe korbo', 'ki korte bobe', 'what to do now',
    'whattt to do', 'how to do it', 'what is the next step', 'help me', 'gyuide me',
    'क्या करना है', 'कैसे करूँ', 'এখন কী করব', 'কীভাবে করবো', 'সাহায্য করুন']) {
    assert.ok(isHelpRequest(phrase), phrase);
  }
  for (const phrase of ['Faizan Khan', 'female', 'forty two', 'health checkup', 'medicine dispensing',
    'yes', 'no', 'sorry try again', 'code 1234', 'no help needed', 'মদদ', 'helpful', 'bookshop']) {
    assert.equal(isHelpRequest(phrase), false, phrase);
  }
});
test('first reminder waits four seconds after interaction and speaking', () => {
  const timer = new GuidanceTimer(0);
  assert.equal(timer.take(3999), false);
  timer.reset(3500);
  assert.equal(timer.take(7499), false);
  assert.equal(timer.take(7500), true);
  timer.defer(10000); // End of a reminder must not reset the repeat count.
  assert.equal(timer.take(14000), false);
  assert.equal(timer.take(37500), true);
  assert.equal(timer.take(90000), false);
  timer.reset(90000); // Another touch enables a fresh four-second reminder.
  assert.equal(timer.take(94000), true);
});
test('payment question waits seven quiet seconds after guidance, never four', () => {
  const timer = new GuidanceTimer(0, 7000);
  timer.defer(20000); // The QR guide has just finished speaking.
  assert.equal(timer.take(24000), false);
  assert.equal(timer.take(26999), false);
  assert.equal(timer.take(27000), true);
});
test('every guided screen has complete localized text and admin/mobile are excluded', () => {
  for (const [route, key] of Object.entries(ROUTE_GUIDANCE)) {
    assert.ok(isGuidedRoute(route));
    for (const lang of ['en', 'hi', 'bn']) assert.ok(GUIDANCE[key][lang]?.length > 15, `${route}:${lang}`);
  }
  for (const path of ['/admin', '/admin-x7k9/speech', '/mobile-entry', '/photo-upload', '/h', '/unknown']) assert.equal(isGuidedRoute(path), false);
  assert.ok(isGuidedRoute('/payment'));
  assert.equal(guidanceText('detailsGender', 'auto'), GUIDANCE.detailsGender.en);
});
