import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { paymentPathFromQr, isDemoPaymentQr } from '../src/services/paymentQr.js';
const origin = 'https://reliv7.vercel.app';
test('existing kiosk QR fixtures transfer to same-origin checkout', () => {
 const fixtures=JSON.parse(fs.readFileSync(new URL('../../tests/fixtures/payment-v2-qr.json',import.meta.url)));
 let checked=0;
 for(const fixture of Object.values(fixtures)) for(const value of Object.values(fixture)) {
  if(typeof value==='string' && value.startsWith(origin+'/pay#p=')) {
   assert.equal(paymentPathFromQr(value,origin),new URL(value).pathname+new URL(value).hash); checked++;
  }
 }
 assert.ok(checked>0);
});
test('known production QR transfers to custom app origin without external navigation',()=>{
 assert.equal(paymentPathFromQr(origin+'/pay#p=abc_123-Z','https://app.example.com'),'/pay#p=abc_123-Z');
});
test('rejects unrelated, executable, malformed and ambiguous codes',()=>{
 for(const value of ['javascript:alert(1)','https://evil.example/pay#p=abc','https://reliv7.vercel.app.evil.example/pay#p=abc',origin+'/pay',origin+'/pay#p=abc&p=def',origin+'/pay?redirect=evil#p=abc',origin+'/other#p=abc','https://user@reliv7.vercel.app/pay#p=abc','http://reliv7.vercel.app/pay#p=abc',origin+'/pay#p=%3Cscript%3E']) assert.throws(()=>paymentPathFromQr(value,origin),value);
});

test('demo JSON is recognized for feedback and remains forbidden for payment',()=>{
 const sample=JSON.stringify({type:'RELIV_DEMO_SAMPLE',status:'NOT_PAYABLE',service:'Sample',padding:'x'.repeat(1900)});
 assert.equal(isDemoPaymentQr(sample),true);
 assert.throws(()=>paymentPathFromQr(sample,origin));
 for(const value of ['null','{}','bad',JSON.stringify({type:'RELIV_DEMO_SAMPLE',status:'PAID'}),origin+'/pay#p=abc'])
  assert.equal(isDemoPaymentQr(value),false);
});
