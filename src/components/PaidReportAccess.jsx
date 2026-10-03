import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { reportPaymentQr } from '../utils/reportPresentation';
export default function PaidReportAccess({data}) {
 const [large,setLarge]=useState(false);
 const qr=reportPaymentQr(data);
 return <section className="paid-report-access">
  <div><h2>📩 Keep your health report</h2><p>Your payment is already complete. Scan the same payment QR to reopen your code card and email-report option on your phone.</p><p>No second payment. Use your phone’s Internet; kiosk Wi-Fi is not needed.</p></div>
  {qr?<button type="button" className="paid-report-qr" aria-expanded={large} onClick={()=>setLarge(value=>!value)} aria-label="Resize paid report QR"><QRCodeSVG value={qr.value} level={qr.level} marginSize={4} size={large?440:300} title="Reopen your paid Reliv visit"/><span>{large?'Tap to reduce':'Tap to enlarge'}</span></button>:<p>The original payment QR is unavailable. Reopen the payment page already on your phone. Do not pay again.</p>}
 </section>;
}
