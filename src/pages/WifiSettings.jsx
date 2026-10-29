import { useCallback, useEffect, useRef, useState } from 'react';
import RelivBrandLogo from '../components/RelivBrandLogo';
import { API_BASE } from '../config/api';
import { readAdminSession, saveAdminSession, clearAdminSession, adminFetch } from '../utils/adminSession';
import './WifiSettings.css';
const activePhases = ['scheduled', 'connecting', 'connected', 'restoring', 'restore_failed'];
export default function WifiSettings() {
 const [session, setSession] = useState(readAdminSession);
 const [status, setStatus] = useState(null), [networks, setNetworks] = useState([]);
 const [notice, setNotice] = useState(''), [busy, setBusy] = useState(false), [lost, setLost] = useState(false);
 const [ssid, setSsid] = useState(''), [password, setPassword] = useState('');
 const [security, setSecurity] = useState('personal'), [hidden, setHidden] = useState(false), [minutes, setMinutes] = useState(5), [ack, setAck] = useState(false);
 const lock = useRef(false), mounted = useRef(true);
 const controllers = useRef(new Set());
 const request = useCallback(async (path, options = {}) => {
  const controller = new AbortController(); controllers.current.add(controller);
  try {
   const response = await adminFetch(`${API_BASE}/api/wifi/${path}`, { ...options, signal: controller.signal, timeoutMs: 65000 });
   const body = await response.json();
   if (response.status === 401) { clearAdminSession(); if (mounted.current) setSession(null); }
   if (!response.ok || !body.success) throw new Error(body.error || body.message || 'Cannot reach the Pi. Rejoin RELIV-KIOSK after the maintenance window.');
   return body;
  } finally { controllers.current.delete(controller); }
 }, []);
 const scan = useCallback(async () => {
  try { const data = await request('scan'); if (mounted.current) setNetworks(data.networks || []); }
  catch (error) { if (mounted.current) setNotice(error.message); }
 }, [request]);
 useEffect(() => {
  mounted.current = true; const pending = controllers.current;
  return () => { mounted.current = false; for (const controller of pending) controller.abort(); };
 }, []);
 useEffect(() => {
  if (!session) return;
  let stopped = false, timer, initial = true;
  const poll = async () => {
   try {
    const data = await request('status');
    if (!stopped) { setStatus(data.status); setLost(false); if (initial) { initial = false; void scan(); } }
   } catch (error) { if (!stopped) { setLost(true); setNotice(error.message); } }
   if (!stopped) timer = setTimeout(poll, 5000);
  };
  void poll(); return () => { stopped = true; clearTimeout(timer); };
 }, [session, request, scan]);
 async function login(event) {
  event.preventDefault(); if (lock.current) return; lock.current = true; setBusy(true); setNotice('');
  const form = new FormData(event.currentTarget);
  try {
   const response = await fetch(`${API_BASE}/api/check-login`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({email: form.get('email'), password: form.get('password')}), signal: AbortSignal.timeout(15000) });
   const data = await response.json(); if (!response.ok || !data.ok) throw new Error(data.message || 'Unable to sign in.');
   saveAdminSession(data); if (mounted.current) setSession(readAdminSession());
  } catch (error) { if (mounted.current) setNotice(error.message); }
  finally { lock.current = false; if (mounted.current) setBusy(false); }
 }
 async function change(event) {
  event.preventDefault(); if (lock.current) return; lock.current = true; setBusy(true); setNotice('');
  try {
   const data = await request('connect', {method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ssid, password, security, hidden, minutes, acknowledged: ack})});
   if (mounted.current) { setStatus(previous => ({...previous, operation: data.operation})); setPassword(''); setNotice('Request accepted. The Pi will try this network in 12 seconds. This is not yet a confirmed connection.'); }
  } catch (error) { if (mounted.current) setNotice(error.message); }
  finally { lock.current = false; if (mounted.current) setBusy(false); }
 }
 async function restore() {
  if (lock.current) return; lock.current = true; setBusy(true);
  try { const data = await request('restore', {method:'POST'}); if (mounted.current) setStatus(previous => ({...previous, operation:data.operation})); }
  catch (error) { if (mounted.current) setNotice(error.message); }
  finally { lock.current = false; if (mounted.current) setBusy(false); }
 }
 const operation = status?.operation, active = activePhases.includes(operation?.phase);
 return <main className="wifi-page"><div className="wifi-shell">
  <header><RelivBrandLogo width={112}/><a href="/admin">Admin home</a></header>
  <div className="wifi-heading"><span>OWNER CONTROLS</span><h1>Kiosk Wi-Fi</h1><p>Connect your Pi to a hotspot for a short maintenance window.</p></div>
  {notice && <div className="wifi-notice" role="status">{notice}</div>}
  {!session ? <form className="wifi-card" onSubmit={login}><h2>Sign in to manage Wi-Fi</h2><p>Use your existing local admin account.</p><label>Email<input name="email" type="email" autoComplete="username" required/></label><label>Password<input name="password" type="password" autoComplete="current-password" required/></label><button className="wifi-primary" disabled={busy}>{busy?'Signing in…':'Sign in'}</button></form> : <>
   <section className="wifi-card"><span className="wifi-eyebrow">PI CONNECTION</span><h2>{status?.ssid || 'Checking connection…'}</h2><p>{status?.ip || 'Waiting for the Pi'} · {status?.connectivity === 'full'?'Internet detected':'Internet not confirmed'}</p>
    {lost && <p className="wifi-warning">Phone lost contact with the Pi. Keep this page open. Do not submit another connection request.</p>}
    <p>{status?.singleAdapter === false ? 'Two adapters: RELIV-KIOSK stays available while the second adapter connects.' : 'One adapter: RELIV-KIOSK and ESP32 connections pause during maintenance, then return automatically. Start only when nobody is using the kiosk.'}</p>
   </section>
   {active ? <section className="wifi-card"><h2>{operation.phase==='connected'?'Pi connected': 'Maintenance in progress'}</h2><p>Network: {operation.ssid}</p><p>Automatic return: <strong>{new Date(operation.returnsAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</strong></p><p>Using this phone’s hotspot? Turn it on now. After the window ends, reconnect your phone to RELIV-KIOSK and reopen this page.</p><button onClick={restore} disabled={busy || lost}>Return to kiosk network now</button></section> : <>
    <section className="wifi-card"><div className="wifi-row"><h2>Nearby networks</h2><button onClick={scan} disabled={busy || !status}>Refresh list</button></div><p>The Pi scans nearby Wi-Fi. If your hotspot is off, enter its name below.</p>{networks.map(network=><button className="wifi-network" key={network.ssid} disabled={network.supported===false || busy} onClick={()=>{setSsid(network.ssid); setSecurity(!network.security || network.security==='--'?'open':'personal'); setPassword('');}}><strong>{network.ssid}</strong><span>{network.signal}% · {network.security || 'Open'}{network.supported===false?' · Unsupported':''}</span></button>)}{!networks.length && <p>No cached networks found. You can enter the hotspot details below.</p>}</section>
    <form className="wifi-card" onSubmit={change}><h2>Connect to a hotspot</h2><label>Network name<input value={ssid} onChange={e=>setSsid(e.target.value)} required maxLength={32} autoComplete="off"/></label><label>Security<select value={security} onChange={e=>setSecurity(e.target.value)}><option value="personal">WPA / WPA2 Personal</option><option value="open">Open network</option></select></label>{security==='personal'&&<label>Wi-Fi password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} maxLength={64} autoComplete="new-password"/></label>}
    <label className="wifi-check"><input type="checkbox" checked={hidden} onChange={e=>setHidden(e.target.checked)}/>Hidden network</label><label>Return to kiosk network after<select value={minutes} onChange={e=>setMinutes(Number(e.target.value))}>{[5,10,20].map(value=><option key={value} value={value}>{value} minutes</option>)}</select></label>
    <label className="wifi-check"><input type="checkbox" checked={ack} onChange={e=>setAck(e.target.checked)}/>The kiosk is idle. No measurement, payment or dispensing is in progress.</label><button className="wifi-primary" disabled={busy || !ack || !status || lost}>{busy?'Scheduling…':'Connect Pi in 12 seconds'}</button><p>This changes the Pi’s connection. Your phone’s Wi-Fi settings cannot be changed by this page. Software updates still use your existing deployment setup.</p></form>
   </>}
  </>}
 </div></main>;
}
