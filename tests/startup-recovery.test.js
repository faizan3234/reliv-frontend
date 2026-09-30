import test from 'node:test';
import assert from 'node:assert/strict';
import { optionalCloudClient } from '../src/utils/optionalCloudClient.js';
import { recoveryUrl } from '../src/utils/recoveryUrl.js';
import { readBrowserStorage, writeBrowserStorage } from '../src/utils/browserStorage.js';

test('offline kiosk never initializes optional cloud services even with stale env', () => {
  const env = { VITE_SUPABASE_URL: 'https://cloud.example', VITE_SUPABASE_ANON_KEY: 'test' };
  let calls = 0;
  for (const hostname of ['192.168.50.1', 'localhost', '127.0.0.1']) {
    assert.equal(optionalCloudClient(env, { hostname }, () => { calls++; }), null);
  }
  assert.equal(calls, 0);
});
test('invalid optional config and cloud initialization errors do not crash module imports', () => {
  assert.equal(optionalCloudClient({}, {}, () => {}), null);
  assert.equal(optionalCloudClient({ VITE_SUPABASE_URL: 'bad', VITE_SUPABASE_ANON_KEY: 'key' }, {}, () => {}), null);
  const env = { VITE_SUPABASE_URL: 'https://cloud.example', VITE_SUPABASE_ANON_KEY: 'test' };
  assert.equal(optionalCloudClient(env, {}, () => { throw new Error('Unavailable browser API'); }), null);
  assert.equal(optionalCloudClient(env, {}, () => 'client'), 'client');
});
test('retry fetches fresh HTML and preserves payment state; home explicitly targets root', () => {
  const input = 'http://192.168.50.1/payment?request=123#signed-data';
  const retry = new URL(recoveryUrl(input, false, 10));
  assert.equal(retry.pathname, '/payment');
  assert.equal(retry.searchParams.get('request'), '123');
  assert.equal(retry.hash, '#signed-data');
  assert.equal(retry.searchParams.get('reliv_reload'), '10');
  assert.equal(recoveryUrl(input, true, 10), 'http://192.168.50.1/?reliv_reload=10');
});
test('optional voice/language storage tolerates blocked storage access', () => {
  const previous = globalThis.window;
  globalThis.window = Object.defineProperty({}, 'localStorage', { get() { throw new Error('Storage blocked'); } });
  try {
    assert.equal(readBrowserStorage('voice'), null);
    assert.equal(writeBrowserStorage('voice', 'id'), false);
  } finally {
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
});
