// CDC adult BMI screening reference: 18.5 <= BMI < 25. Not a prescribed target.
export function weightReference(data = {}) {
 const age=Number(data.patient?.age), height=Number(data.vitals?.height), weight=Number(data.vitals?.weight);
 if(!Number.isFinite(age)||age<20||age>120||!Number.isFinite(height)||height<100||height>230||!Number.isFinite(weight)||weight<20||weight>300)return null;
 const lower=18.5*(height/100)**2, upper=25*(height/100)**2;
 const direction=weight<lower?'below':weight>=upper?'above':'within';
 return {lower:Number(lower.toFixed(1)),upper:Number(upper.toFixed(1)),weight,direction,gap:Number((direction==='below'?lower-weight:direction==='above'?weight-upper:0).toFixed(1))};
}
