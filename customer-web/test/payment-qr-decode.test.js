// Exercise the exact bundled worker decoder against Pi-style SVG QR rasters.
// This is a clean-image decoder test, not a phone autofocus/latency benchmark.
import {Buffer} from 'node:buffer';
import {PAYMENT_READER_OPTIONS} from '../src/services/scannerTuning.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const kioskRequire=createRequire(new URL('../../package.json',import.meta.url));
const React=kioskRequire('react');
const {renderToStaticMarkup}=kioskRequire('react-dom/server');
import {QRCodeSVG} from 'qrcode.react';
import sharp from 'sharp';
import {prepareZXingModule,readBarcodes} from 'zxing-wasm/reader';
import {getPaymentQrConfig} from '../../src/utils/paymentQr.js';
import {paymentPathFromQr} from '../src/services/paymentQr.js';

test('fallback decoder reads dense kiosk SVGs and maximum-size payment URL',async()=>{
 prepareZXingModule({overrides:{wasmBinary:fs.readFileSync(new URL('../node_modules/zxing-wasm/dist/reader/zxing_reader.wasm',import.meta.url))}});
 const fixtures=JSON.parse(fs.readFileSync(new URL('../../tests/fixtures/payment-v2-qr.json',import.meta.url)));
 const urls=['https://reliv7.vercel.app/pay#p=abc',...Object.values(fixtures).map(f=>f.paymentUrl)];
 urls.push('https://reliv7.vercel.app/pay#p='+Array.from({length:2953-'https://reliv7.vercel.app/pay#p='.length},(_,i)=>'aB3dE6gH9jK2mN5pQ8sT1vW4yZ7'[i%26]).join(''));
 for(const url of urls){
  const qr=getPaymentQrConfig(url);assert.ok(qr);
  const svg=renderToStaticMarkup(React.createElement(QRCodeSVG,{...qr,size:768,marginSize:6,boostLevel:false}));
  const {data,info}=await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const results=await readBarcodes({data:new Uint8ClampedArray(data),width:info.width,height:info.height},PAYMENT_READER_OPTIONS);
  const result={data:results[0]?.text};
  assert.equal(result.data,url,`Exact package preserved at ${url.length} bytes`);
  assert.equal(paymentPathFromQr(result.data,'https://reliv7.vercel.app'),new URL(url).pathname+new URL(url).hash);
 }
});

test('dense payment survives rotation, inversion, modest blur and off-centre framing',async()=>{
 const fixture=JSON.parse(fs.readFileSync(new URL('../../tests/fixtures/payment-v2-qr.json',import.meta.url)));
 const url=Object.values(fixture)[0].paymentUrl;
 const svg=Buffer.from(renderToStaticMarkup(React.createElement(QRCodeSVG,{...getPaymentQrConfig(url),size:768,marginSize:6,boostLevel:false})));
 const variants=[
  ['rotated 90',sharp(svg).rotate(90)],['upside down',sharp(svg).rotate(180)],
  ['tilted 15',sharp(svg).rotate(15,{background:'#fff'})],
  ['inverted',sharp(svg).negate({alpha:false})],
  ['mirrored',sharp(svg).flop()],
  ['slight blur',sharp(svg).blur(0.4)],
  ['off-centre landscape',sharp(svg).extend({left:30,right:1122,top:20,bottom:292,background:'#fff'})],
 ];
 for(const [name,raster] of variants){
  const {data,info}=await raster.ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const results=await readBarcodes({data:new Uint8ClampedArray(data),width:info.width,height:info.height},PAYMENT_READER_OPTIONS);
  assert.equal(results[0]?.text,url,name);
 }
});
