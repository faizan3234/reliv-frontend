import test from 'node:test';
import assert from 'node:assert/strict';
import {paymentBrowserInfo,paymentBrowserLinks} from '../customer-web/src/services/paymentBrowser.js';
test('Android scanner hints do not confuse normal Chrome or iPhone',()=>{
 assert.deepEqual(paymentBrowserInfo('Mozilla Android 14; Pixel; wv) Version/4.0 Chrome/130'),{android:true,embedded:true});
 assert.deepEqual(paymentBrowserInfo('Mozilla Android 14 Chrome/130 Mobile Safari/537'),{android:true,embedded:false});
 assert.equal(paymentBrowserInfo('iPhone Safari').android,false);
 assert.equal(paymentBrowserInfo('Android GooglePay').embedded,true);
});
test('Chrome handoff preserves the exact QR fragment, including dense packages, without query leakage',()=>{
 for(const pkg of ['abc_def-123', 'a+b/c==', 'x;#Intent;package=bad;end', 'a'.repeat(12000)]){
  const links=paymentBrowserLinks(pkg,'https://reliv7.vercel.app');const url=new URL(links.web);
  assert.equal(url.pathname,'/pay');assert.equal(url.search,'');assert.equal(new URLSearchParams(url.hash.slice(1)).get('p'),pkg);
  const marker=links.chrome.lastIndexOf('#Intent;');const data='https:'+links.chrome.slice('intent:'.length,marker);
  assert.equal(data,links.web);assert.equal((links.chrome.match(/#Intent;/g)||[]).length,1);
  assert.ok(links.chrome.includes('package=com.android.chrome;'));
  assert.equal(decodeURIComponent(links.chrome.split('S.browser_fallback_url=')[1].slice(0,-4)),links.web);
 }
 assert.equal(paymentBrowserLinks('','https://reliv7.vercel.app'),null);assert.equal(paymentBrowserLinks('p','http://example.com'),null);
 assert.equal(paymentBrowserLinks('p'.repeat(16385),'https://reliv7.vercel.app'),null);
});
