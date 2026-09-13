import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { requestJSON } from '../src/utils/request.js';
import { recoverBlankScreen } from '../src/utils/crashRecovery.js';
import { parsePaymentVoice } from '../src/voice/paymentVoice.js';
import { looksLikeRelivEcho } from '../src/voice/voicePageProfiles.js';

test('payment voice accepts replies only and gives negation priority', () => {
  for (const text of ['not paid', 'payment not done', 'payment nahi hua', 'না', 'नहीं', 'nhi', 'korini', 'naah korlam na', 'nope', 'না করিনি', 'হয়নি', 'जी नहीं']) assert.equal(parsePaymentVoice(text), 'no', text);
  for (const text of ['yes', 'haan', 'hnn', 'paid', 'payment ho gaya', 'হ্যাঁ', 'हाँ', 'হুম', 'করেছি', 'korechhi', 'kar diya', 'hoye geche']) assert.equal(parsePaymentVoice(text), 'yes', text);
  for (const text of ['scan done', 'enter code', '1234', 'yesterday', 'क्या आपने पेमेंट कर दिया', 'have you paid']) assert.equal(parsePaymentVoice(text), null, text);
  assert.equal(parsePaymentVoice('yes but payment is not done'), 'no');
});
test('short retry echo is suppressed without rejecting legitimate service answers', () => {
  const recent = [{ text: 'Sorry, try again', at: 1000 }, { text: 'Health checkup or medicine dispensing', at: 1000 }];
  for (const text of ['sorry try again', 'try again']) assert.equal(looksLikeRelivEcho(text, recent, 1200), true);
  for (const text of ['medicine dispensing', 'health checkup', 'female', 'yes']) assert.equal(looksLikeRelivEcho(text, recent, 1200), false);
  assert.equal(looksLikeRelivEcho('try again', recent, 20000), false);
});
test('timeouts cover response bodies and never automatically retry a payment', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (_url, { signal }) => {
    calls++;
    return { ok: true, status: 200, json: () => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })) };
  });
  await assert.rejects(requestJSON('/payment', { method: 'POST', timeoutMs: 15 }), { name: 'TimeoutError' }); assert.equal(calls, 1);
  const controller = new AbortController(); const pending = requestJSON('/report', { signal: controller.signal });
  await Promise.resolve(); controller.abort(); await assert.rejects(pending, { name: 'AbortError' }); assert.equal(calls, 2);
});
test('HTTP status remains available and malformed JSON fails clearly', async t => {
  t.mock.method(globalThis, 'fetch', async () => ({ ok: false, status: 409, json: async () => ({ message: 'Conflict' }) }));
  await assert.rejects(requestJSON('/service'), { status: 409, message: 'Conflict' });
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError(); } });
  await assert.rejects(requestJSON('/report'), /unreadable response/);
});
test('blank-screen recovery retains payment URL and stops automatic reload loops', () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/payment' });
  const root = dom.window.document.querySelector('#root'); let reloads = 0;
  const browser = { sessionStorage: dom.window.sessionStorage, location: { reload: () => { reloads++; } } };
  recoverBlankScreen(root, browser); assert.equal(reloads, 1);
  recoverBlankScreen(root, browser); assert.equal(reloads, 1); assert.ok(root.querySelector('[role="alert"]'));
  root.querySelector('button').click(); assert.equal(reloads, 2); assert.equal(dom.window.location.pathname, '/payment');
  root.replaceChildren(); browser.sessionStorage = { getItem() { throw new Error('Blocked'); } };
  recoverBlankScreen(root, browser); assert.ok(root.querySelector('button')); assert.equal(reloads, 2); dom.window.close();
});
