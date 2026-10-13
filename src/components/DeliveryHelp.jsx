import {useRef,useState} from 'react';
import {API_BASE} from '../config/api';
import {readKioskSession} from '../utils/kioskSession';
import {requestJSON} from '../utils/request';
const words={
 en:{button:'Did not receive medicine or report?',title:'Let us help',save:'Save help request on this kiosk',saved:'Request saved on this kiosk. Photograph this reference.',contact:'WhatsApp 9163606455 or email khanfaizan3234@gmail.com from your phone when Internet is available.',proof:'Send your problem, this reference, payment receipt, time and a photo if possible. Do not send your PIN, OTP or full health report.',honest:'Please describe what happened accurately. Staff will compare your receipt with kiosk records and check the machine. Keep one request per order. Do not pay again.',local:'Saving here does not send a WhatsApp message or email. Please contact support separately.',error:'Could not save locally. Photograph the order reference and contact support.',close:'Close'},
 hi:{button:'दवा या रिपोर्ट नहीं मिली?',title:'हम मदद करेंगे',save:'इस कियोस्क पर शिकायत सेव करें',saved:'शिकायत सेव हो गई। इस नंबर की फोटो लें।',contact:'इंटरनेट मिलने पर अपने फोन से WhatsApp 9163606455 या khanfaizan3234@gmail.com पर संपर्क करें।',proof:'अपनी परेशानी, यह नंबर, पेमेंट की रसीद, समय और हो सके तो फोटो भेजें। PIN, OTP या पूरी हेल्थ रिपोर्ट न भेजें।',honest:'जो हुआ, सही-सही बताएं। स्टाफ रसीद और कियोस्क के रिकॉर्ड देखकर मशीन चेक करेगा। एक ऑर्डर के लिए एक ही शिकायत रखें। दोबारा पैसे न दें।',local:'यहां सेव करने से WhatsApp या ईमेल नहीं जाता। सपोर्ट से अलग से संपर्क करें।',error:'शिकायत सेव नहीं हुई। ऑर्डर नंबर की फोटो लेकर सपोर्ट से संपर्क करें।',close:'बंद करें'},
 bn:{button:'ওষুধ বা রিপোর্ট পাননি?',title:'আমরা সাহায্য করব',save:'এই কিওস্কে অভিযোগ সেভ করুন',saved:'অভিযোগ সেভ হয়েছে। এই নম্বরের ছবি তুলে রাখুন।',contact:'ইন্টারনেট পেলে নিজের ফোন থেকে WhatsApp 9163606455 বা khanfaizan3234@gmail.com-এ যোগাযোগ করুন।',proof:'আপনার সমস্যা, এই নম্বর, পেমেন্টের রসিদ, সময় আর পারলে ছবি পাঠান। PIN, OTP বা পুরো স্বাস্থ্য রিপোর্ট পাঠাবেন না।',honest:'যা হয়েছে ঠিকভাবে জানান। কর্মীরা রসিদ আর কিওস্কের রেকর্ড মিলিয়ে মেশিন দেখবেন। এক অর্ডারের জন্য একটাই অভিযোগ রাখুন। আবার টাকা দেবেন না।',local:'এখানে সেভ করলে WhatsApp বা ইমেল যায় না। সাপোর্টে আলাদা করে যোগাযোগ করুন।',error:'সেভ করা যায়নি। অর্ডার নম্বরের ছবি তুলে সাপোর্টে যোগাযোগ করুন।',close:'বন্ধ করুন'}
};
export default function DeliveryHelp({sessionId,language='en'}) {
 const w=words[language]||words.en;
 const [open,setOpen]=useState(false),[record,setRecord]=useState(null),[error,setError]=useState(false),[busy,setBusy]=useState(false);
 const pending=useRef(false);
 let paired;try{paired=readKioskSession();}catch{/* Contact details remain usable when storage is unavailable. */}
 const id=sessionId||paired?.sessionId;
 const save=async()=>{
  if(pending.current)return;
  pending.current=true;setBusy(true);setError(false);
  try{
   if(!id||paired?.sessionId!==id)throw new Error('Session mismatch');
   const result=await requestJSON(`${API_BASE}/api/sessions/${encodeURIComponent(id)}/support`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pairingToken:paired.pairingToken}),timeoutMs:10000});
   if(!result.case?.case_id)throw new Error('No case');
   setRecord(result.case);
  }catch{setError(true);}finally{pending.current=false;setBusy(false);}
 };
 return <section className="mx-auto my-5 w-full max-w-3xl rounded-2xl border border-orange-200 bg-white p-4 text-left text-base text-slate-900">
  <button type="button" aria-expanded={open} onClick={()=>setOpen(!open)} className="min-h-12 w-full text-left font-semibold text-orange-800">{w.button}</button>
  {open&&<div className="space-y-3 break-words">
   <h2 className="text-xl font-bold">{w.title}</h2>
   <p className="break-all">Order: {id||'—'}</p>
   {record&&<p role="status" className="break-all rounded-xl bg-green-50 p-3">{w.saved}<br/>{record.case_id}</p>}
   <p className="font-semibold">{w.contact}</p><p>{w.proof}</p><p>{w.honest}</p><p className="text-sm">{w.local}</p>
   {error&&<p role="alert">{w.error}</p>}
   {!record&&<button type="button" disabled={busy||!id} onClick={save} className="min-h-12 rounded-xl bg-orange-700 px-4 py-3 font-bold text-white disabled:opacity-50">{busy?'…':w.save}</button>}
   <button type="button" onClick={()=>setOpen(false)} className="min-h-12 px-4 py-3">{w.close}</button>
  </div>}
 </section>;
}
