import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

test('phone bootstrap allows copying and opening the payment browser', () => {
  for (const path of ['/advertise', '/advertise/', '/pay', '/admin']) {
    let opened = '';
    const dom = new JSDOM(readFileSync('index.html', 'utf8'), {
      url: `http://192.168.50.1${path}`, runScripts: 'dangerously',
      beforeParse(window) { window.open = url => { opened = url; }; },
    });
    dom.window.open('https://reliv7.vercel.app/pay#p=synthetic');
    assert.match(opened, /reliv7/);
    const copy = new dom.window.KeyboardEvent('keydown', { key: 'c', ctrlKey: true, cancelable: true, bubbles: true });
    dom.window.document.dispatchEvent(copy);
    assert.equal(copy.defaultPrevented, false);
    dom.window.close();
  }
});

test('checkout loading times out and retries; background taps never dismiss or override success', async () => {
  const dom = new JSDOM('<body></body>');
  const old = { window: globalThis.window, document: globalThis.document, setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout };
  let timeout;
  globalThis.window = dom.window; globalThis.document = dom.window.document;
  globalThis.setTimeout = callback => { timeout = callback; return 1; };
  globalThis.clearTimeout = () => {};
  try {
    const { loadRazorpayScript, openRazorpayCheckout } = await import('../customer-web/src/services/razorpay.js');
    const waiting = loadRazorpayScript();
    const rejection = assert.rejects(waiting, /too long/);
    timeout(); await rejection;
    assert.equal(document.querySelectorAll('script').length, 0);
    const retry = loadRazorpayScript();
    let options, failure;
    window.Razorpay = class {
      constructor(value) { options = value; }
      on(_event, handler) { failure = handler; }
      open() {}
    };
    document.querySelector('script').dispatchEvent(new window.Event('load'));
    await retry;
    let successes = 0, dismissals = 0, errors = 0;
    await openRazorpayCheckout({ orderId: 'order_test', amount: 536, keyId: 'synthetic',
      onSuccess: () => successes++, onDismiss: () => dismissals++, onError: () => errors++ });
    assert.equal(options.amount, 536);
    assert.equal(options.modal.backdropclose, false);
    assert.equal(options.modal.escape, false);
    const result = { razorpay_order_id: 'order_test', razorpay_payment_id: 'pay_test', razorpay_signature: 'synthetic' };
    options.handler(result); options.handler(result); options.modal.ondismiss(); failure({ error: {} });
    assert.equal(successes, 1); assert.equal(dismissals, 0); assert.equal(errors, 0);
  } finally {
    Object.assign(globalThis, old); dom.window.close();
  }
});
