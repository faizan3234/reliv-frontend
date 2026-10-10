import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { savePaidSession, getPaidSession, clearPaidSession, PAID_SESSION_TTL_MS, PAID_SESSION_STORAGE_KEY, savePaymentRecovery, getPaymentRecovery } from '../customer-web/src/services/session.js';

test('five-minute code lifetime is absolute, scoped and survives reload data', () => {
  const dom = new JSDOM('', {url:'https://reliv7.vercel.app/pay#p=A'});
  global.window=dom.window;
  const oldNow=Date.now;let now=1000000;Date.now=()=>now;
  try {
    const a={requestId:'request-A',encryptedPackage:'A',confirmationCode:'1234',storySummary:{healthScore:98},serviceType:'AD_CAMPAIGN'};
    savePaymentRecovery(a);savePaidSession(a);
    assert.equal(PAID_SESSION_TTL_MS,300000);
    assert.equal(getPaidSession('A').confirmationCode,'1234');
    assert.equal(getPaidSession('B'),null);
    now+=240000;
    savePaidSession(a);
    assert.equal(getPaidSession().paidAt,1000000,'repeat verification does not extend deadline');
    assert.equal(getPaidSession().storySummary.healthScore,98);
    now+=59999;assert.ok(getPaidSession());
    now++;assert.equal(getPaidSession(),null,'expires at exactly five minutes');
    assert.equal(window.location.hash,'','expired payment cannot resurrect from URL');
    assert.equal(getPaymentRecovery('A'),null);
    assert.equal(window.localStorage.getItem(PAID_SESSION_STORAGE_KEY),null);
    savePaidSession({...a,requestId:'request-B',encryptedPackage:'B'});
    savePaidSession({...a,requestId:'request-C',encryptedPackage:'C'});
    assert.equal(getPaidSession('B'),null,'new code removes previous device code');
    clearPaidSession();
    assert.equal(getPaidSession(),null);
  } finally {Date.now=oldNow;dom.window.close();delete global.window;}
});

test('code remains available in memory when storage is disabled',()=>{
 const dom=new JSDOM('',{url:'https://reliv7.vercel.app/'});global.window=dom.window;
 for(const key of ['localStorage','sessionStorage'])Object.defineProperty(window,key,{get(){throw Error('disabled');}});
 try {savePaidSession({requestId:'private',encryptedPackage:'P',confirmationCode:'5678'});assert.equal(getPaidSession('P').confirmationCode,'5678');assert.equal(getPaidSession('Q'),null);clearPaidSession();}
 finally{dom.window.close();delete global.window;}
});
