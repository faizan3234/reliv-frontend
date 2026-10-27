import {MAX_ORDER_UNITS,medicineUnitCount,dispenseLimitCopy} from '../utils/dispenseLimits';
import {useEffect,useRef,useState} from 'react';
import {useLocation,useNavigate} from 'react-router-dom';
import {useHealth} from '../context/HealthContext';
import CommerceHeader,{commerceCopy} from '../components/CommerceHeader';
import MedicineImage from '../components/MedicineImage';
import SpokenGuide from '../components/SpokenGuide';
import {getKitId,getMedicineImageUrl,getAvailableQuantity} from './MedicineDispensing';
import {readBrowserStorage,writeBrowserStorage} from '../utils/browserStorage';
import {formatINR} from '../utils/currency';
import './KioskCommerce.css';

export default function Checkout(){
 const location=useLocation(),navigate=useNavigate();
 const {data:health}=useHealth();const language=health.language||'en',c=commerceCopy[language]||commerceCopy.en;
 const fromPaymentGate=Boolean(location.state?.fromPaymentGate);
 const navigating=useRef(false);
 const [cart,setCart]=useState(()=>{
  let saved=location.state?.cart;
  if(!Array.isArray(saved)){try{saved=JSON.parse(readBrowserStorage('reliv_cart','sessionStorage')||readBrowserStorage('reliv_cart')||'[]');}catch{saved=[];}}
  return Array.isArray(saved)?saved.filter(item=>item&&getKitId(item)&&Number.isFinite(Number(item.price))&&Number(item.price)>=0&&Number.isSafeInteger(item.cartQuantity)&&item.cartQuantity>0):[];
 });
 useEffect(()=>{writeBrowserStorage('reliv_cart',JSON.stringify(cart),'sessionStorage');},[cart]);
 const subtotal=cart.reduce((sum,item)=>sum+Math.round(Number(item.price)*100)*item.cartQuantity,0)/100;
 const stock=item=>Math.min(MAX_ORDER_UNITS-medicineUnitCount(cart)+item.cartQuantity,Math.max(0,Number(item.availableStock??item.maxStock??getAvailableQuantity(item))||0));
 const change=(id,delta)=>setCart(prev=>prev.map(item=>getKitId(item)===id?{...item,cartQuantity:Math.min(stock(item),item.cartQuantity+delta)}:item).filter(item=>item.cartQuantity>0));
 const remove=id=>setCart(prev=>prev.filter(item=>getKitId(item)!==id));
 const go=()=>{if(navigating.current||medicineUnitCount(cart)>MAX_ORDER_UNITS||(!cart.length&&!fromPaymentGate))return;navigating.current=true;navigate('/payment',{state:{cart,totalPrice:subtotal,fromPaymentGate}});};
 return <main className="commerce-screen"><CommerceHeader language={language} step={1} onBack={()=>navigate('/medicine-dispensing',{state:{cart,fromPaymentGate}})}/>
  <div className="commerce-layout"><section><div className="commerce-intro"><h1>{c.reviewTitle}</h1><SpokenGuide text={c.reviewText} language={language} autoSpeak/></div>
   {cart.length===0&&<p>{c.empty}</p>}
   {cart.map(item=><article className="commerce-checkout-item" key={getKitId(item)}>
    <MedicineImage src={getMedicineImageUrl(item)} alt={item.name}/>
    <div><h2>{item.name}</h2><p>{item.description}</p><strong>{formatINR(item.price)}</strong></div>
    <div className="commerce-item-actions"><strong>{formatINR(Number(item.price)*item.cartQuantity)}</strong><div className="commerce-qty"><button aria-label={`${c.remove}: ${item.name}`} onClick={()=>change(getKitId(item),-1)}>−</button><span>{item.cartQuantity}</span><button aria-label={`+: ${item.name}`} disabled={item.cartQuantity>=stock(item)} onClick={()=>change(getKitId(item),1)}>+</button></div><button className="commerce-quiet" onClick={()=>remove(getKitId(item))}>{c.remove}</button></div>
   </article>)}
   <button className="commerce-quiet" onClick={()=>navigate('/medicine-dispensing',{state:{cart,fromPaymentGate}})}>+ {c.more}</button>
  </section><aside className="commerce-summary"><h2>{c.basket}</h2><div className="commerce-total"><span>{c.subtotal}</span><strong>{formatINR(subtotal)}</strong></div>
   <p className="commerce-note">{c.fees}</p><p className="commerce-note">{dispenseLimitCopy[language]||dispenseLimitCopy.en}</p><button className="commerce-primary" disabled={medicineUnitCount(cart)>MAX_ORDER_UNITS||(!cart.length&&!fromPaymentGate)} onClick={go}>{c.pay} →</button>
  </aside></div>
 </main>;
}
