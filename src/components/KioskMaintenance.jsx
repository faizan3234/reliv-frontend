import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { API_BASE } from '../config/api';
import RelivBrandLogo from './RelivBrandLogo';
export default function KioskMaintenance() {
 const [active, setActive] = useState(false);
 const {pathname} = useLocation();
 useEffect(()=>{
  let stopped=false,timer,controller;
  const poll=async()=>{
   controller=new AbortController(); const timeout=setTimeout(()=>controller.abort(),4000);
   try {const response=await fetch(`${API_BASE}/api/kiosk-maintenance`,{signal:controller.signal});if(response.ok){const data=await response.json();if(!stopped)setActive(data.maintenance===true);}}
   catch { /* Preserve known maintenance state while the AP is offline. */ }
   finally {clearTimeout(timeout);if(!stopped)timer=setTimeout(poll,5000);}
  };
  void poll();return()=>{stopped=true;clearTimeout(timer);controller?.abort();};
 },[]);
 if(!active||pathname.startsWith('/admin')||pathname==='/wifi')return null;
 return <section role="alert" style={{position:'fixed',inset:0,zIndex:100000,background:'#faf9f7',display:'grid',placeItems:'center',overflowY:'auto',padding:24}}><div style={{maxWidth:600,textAlign:'center'}}><div style={{display:'flex',justifyContent:'center'}}><RelivBrandLogo/></div><h1>We’ll be back shortly</h1><p>The kiosk is connecting for maintenance. Please wait before starting.</p><p>कृपया थोड़ा इंतज़ार करें। · একটু অপেক্ষা করুন।</p><p>Already paid? Keep your code. Do not pay again.</p><a href="/wifi">Owner Wi-Fi controls</a></div></section>;
}
