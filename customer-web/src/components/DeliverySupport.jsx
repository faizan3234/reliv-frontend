import React from 'react';
export function DeliverySupport({requestId}) {
 const text=`Reliv help request. Order reference: ${requestId||'Please attach payment receipt'}. I did not receive my medicine/report. What happened: `;
 return <details className="rounded-2xl border border-orange-200 bg-white p-4 text-slate-900">
  <summary className="min-h-12 cursor-pointer font-semibold">Did not receive medicine or report?</summary>
  <div className="space-y-3 break-words">
   <p>Do not pay again. Tell us what happened and attach your payment receipt, time and a photo if available. Do not share your PIN, OTP or full health report.</p>
   <p className="break-all">Reference: {requestId||'Use the order number on your receipt'}</p>
   <p>Please give accurate details. Staff will compare your receipt with kiosk records and check the machine. Keep one request per order.</p>
   <a className="block min-h-12 rounded-xl bg-green-700 p-3 text-center text-white" href={`https://wa.me/919163606455?text=${encodeURIComponent(text)}`}>WhatsApp 9163606455</a>
   <a className="block min-h-12 break-all rounded-xl border p-3 text-center" href={`mailto:khanfaizan3234@gmail.com?subject=${encodeURIComponent('Reliv order help')}&body=${encodeURIComponent(text)}`}>Email khanfaizan3234@gmail.com</a>
   <p className="text-sm">Internet is needed to send. Review and send the message in WhatsApp or your email app. Opening this section does not submit a claim to the offline kiosk.</p>
  </div>
 </details>;
}
