import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveApiBase } from '../src/config/api.js';

test('local kiosk cannot be redirected to a stale cloud backend by build variables', () => {
  for (const hostname of ['192.168.50.1', 'localhost', '127.0.0.1']) {
    assert.equal(resolveApiBase({ VITE_BACKEND_URL: 'https://old-cloud.example' }, { hostname }), `http://${hostname}:5000`);
  }
  assert.equal(resolveApiBase(), 'http://192.168.50.1:5000');
  assert.equal(resolveApiBase({ VITE_BACKEND_URL: 'https://explicit.example' }, { hostname: 'remote.example' }), 'https://explicit.example');
});

test('served local kiosk uses nginx API on the same origin',()=>{
 assert.equal(resolveApiBase({}, {hostname:'192.168.50.1',port:'',origin:'http://192.168.50.1',protocol:'http:'}), 'http://192.168.50.1');
 assert.equal(resolveApiBase({}, {hostname:'reliv.local',port:'',origin:'https://reliv.local',protocol:'https:'}), 'https://reliv.local');
});
