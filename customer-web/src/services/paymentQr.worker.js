import {prepareZXingModule, readBarcodes} from 'zxing-wasm/reader';
import { PAYMENT_READER_OPTIONS } from './scannerTuning';
import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';

// Ship the decoder with this Vercel build. Never send camera pixels to a server.
const ready=prepareZXingModule({fireImmediately:true,overrides:{locateFile:(path,prefix)=>path.endsWith('.wasm')?wasmUrl:prefix+path}});
// Prevent an unhandled rejection before the first camera frame arrives.
ready.catch(()=>{});
self.onmessage=async ({data:message})=>{
 if(message.type==='close'){self.close();return;}
 if(message.type!=='decode')return;
 try{
  await ready;
  const results=await readBarcodes(message.data,PAYMENT_READER_OPTIONS);
  const qr=results[0];
  self.postMessage({id:message.id,type:'qrResult',data:qr?.text||null,
   ...(qr?{cornerPoints:[qr.position.topLeft,qr.position.topRight,qr.position.bottomRight,qr.position.bottomLeft]}:{})});
 }catch{self.postMessage({id:message.id,type:'qrResult',data:null});}
};
