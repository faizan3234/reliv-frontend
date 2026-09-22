import test from 'node:test';
import assert from 'node:assert/strict';
import { isPhoneExperience, usesNativeScrolling } from '../src/utils/phoneExperience.js';

test('phone routes including trailing slashes never use kiosk controls', () => {
  for (const path of ['/advertise', '/advertise/', '/pay', '/pay/', '/mobile-entry', '/photo-upload', '/h/abc']) {
    assert.equal(isPhoneExperience(path, '192.168.50.1', ''), true, path);
    assert.equal(usesNativeScrolling(path, '192.168.50.1', ''), true, path);
  }
  assert.equal(isPhoneExperience('/', 'reliv7.vercel.app', ''), true);
  assert.equal(usesNativeScrolling('/admin', '192.168.50.1', ''), true);
  for (const path of ['/', '/payment', '/health-checkup']) {
    assert.equal(isPhoneExperience(path, '192.168.50.1', ''), false);
    assert.equal(usesNativeScrolling(path, '192.168.50.1', ''), false);
  }
});
