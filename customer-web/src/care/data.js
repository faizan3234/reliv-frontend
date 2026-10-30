// Separate from paid health records: guest fitness entries belong to this browser.
export const dayKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export function number(value, min, max, label) {
  if (
    value === "" ||
    value == null ||
    !Number.isFinite(Number(value)) ||
    Number(value) < min ||
    Number(value) > max
  )
    throw Error(`Check ${label}. Use a value from ${min} to ${max}.`);
  return Number(value);
}
export function profileFrom(form) {
  const name = String(form.name || "")
    .trim()
    .slice(0, 60);
  if (!name) throw Error("Please enter your name.");
  const weight = number(form.weight, 25, 350, "weight");
  const target = number(form.target, 25, 350, "target weight");
  if (form.goal === "gain" && target <= weight)
    throw Error("For a gain goal, choose a target above your current weight.");
  if (form.goal === "lose" && target >= weight)
    throw Error("For a loss goal, choose a target below your current weight.");
  if (form.goal === "maintain" && target !== weight)
    throw Error(
      "For maintenance, use your current weight as your target, or choose gain/lose.",
    );
  return {
    name,
    diet: form.diet || "none",
    noBeef: !!form.noBeef, noPork: !!form.noPork,
    trackers: form.trackers || [],
    age: number(form.age, 18, 110, "age"),
    height: number(form.height, 100, 250, "height"),
    weight: number(form.weight, 25, 350, "weight"),
    target: number(form.target, 25, 350, "target weight"),
    goal: ["gain", "lose", "maintain"].includes(form.goal)
      ? form.goal
      : "maintain",
    kiosk: !!form.kiosk,
    calories: form.calories
      ? number(form.calories, 500, 6000, "calorie target")
      : null,
    protein: form.protein
      ? number(form.protein, 10, 350, "protein target")
      : null,
    water: number(form.water || 2000, 250, 6000, "water logging goal"),
  };
}
export function totals(entries, day = dayKey()) {
  return entries
    .filter((e) => e.day === day)
    .reduce(
      (out, e) => {
        if (e.kind === "meal")
          for (const k of ["kcal", "protein", "carbs", "fat"])
            out[k] += Number(e[k]) || 0;
        if (e.kind === "water") out.water += e.amount;
        if (e.kind === "meal") out.meals++;
        if (e.kind === "weight") out.weights++;
        return out;
      },
      { kcal: 0, protein: 0, carbs: 0, fat: 0, water: 0, meals: 0, weights: 0 },
    );
}
export function confirmedFood(food, amount, percent = 100) {
  if (!food?.id || !food?.name)
    throw Error("Choose a matching food before saving.");
  const grams = number(amount, 1, 3000, "portion");
  const consumed = number(percent, 1, 100, "amount eaten");
  const result = {
    kind: "meal",
    name: String(food.name).slice(0, 120),
    foodId: food.id,
    amount: grams,
    consumed,
    source: String(food.source || "Nutrition catalogue estimate"),
    estimated: true,
  };
  for (const k of ["kcal", "protein", "carbs", "fat"])
    result[k] =
      Math.round(
        ((number(food[k], 0, 1000, k) * grams * consumed) / 10000) * 10,
      ) / 10;
  return result;
}
let connection;
function database() {
  if (!connection)
    connection = new Promise((resolve, reject) => {
      const req = indexedDB.open("reliv-fitness", 2);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("profile")) db.createObjectStore("profile");
        if (!db.objectStoreNames.contains("entries")) db.createObjectStore("entries", { keyPath: "id" });
        if (!db.objectStoreNames.contains("actions")) db.createObjectStore("actions", { keyPath: "id" });
      };
      req.onsuccess = () => {
        req.result.onversionchange = () => {
          req.result.close();
          connection = null;
        };
        resolve(req.result);
      };
      req.onerror = () => {
        connection = null;
        reject(Error("Device storage is unavailable. Nothing was saved."));
      };
      req.onblocked = () => {
        connection = null;
        reject(Error("Close other Reliv tabs and retry."));
      };
    });
  return connection;
}
async function transaction(stores, mode, action) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(stores, mode);
    let value;
    try {
      action(tx, (v) => {
        value = v;
      });
    } catch (e) {
      tx.abort();
      reject(e);
      return;
    }
    tx.oncomplete = () => resolve(value);
    tx.onerror = tx.onabort = () =>
      reject(
        Error(
          "Could not save on this device. Check available storage and retry.",
        ),
      );
  });
}
export async function readCare() {
  return transaction(["profile", "entries", "actions"], "readonly", (tx, done) => {
    const result = { profile: null, entries: [], actions: [] };
    tx.objectStore("actions").getAll().onsuccess = e => { result.actions = e.target.result.sort((a,b)=>a.at.localeCompare(b.at)); done(result); };
    tx.objectStore("profile").get("current").onsuccess = (e) => {
      result.profile = e.target.result || null;
      done(result);
    };
    tx.objectStore("entries").getAll().onsuccess = (e) => {
      result.entries = e.target.result.sort((a, b) => a.at.localeCompare(b.at));
      done(result);
    };
  });
}
const notify = () => window.dispatchEvent(new Event("reliv-fitness-changed"));
export async function saveProfile(profile) {
  await transaction(["profile"], "readwrite", (tx) =>
    tx.objectStore("profile").put(profile, "current"),
  );
  notify();
}
export async function saveEntries(entries) {
  const at = new Date().toISOString(),
    day = dayKey();
  await transaction(["entries"], "readwrite", (tx) => {
    for (const entry of entries)
      tx.objectStore("entries").add({
        ...entry,
        id: entry.id || crypto.randomUUID(),
        at,
        day,
      });
  });
  notify();
  try {
    await navigator.storage?.persist?.();
  } catch {
    /* Saved; retention is browser-controlled. */
  }
}
export async function removeEntry(id) {
  await transaction(["entries"], "readwrite", (tx) =>
    tx.objectStore("entries").delete(id),
  );
  notify();
}
export async function clearCare() {
  await transaction(["profile", "entries", "actions"], "readwrite", (tx) => {
    tx.objectStore("actions").clear();
    tx.objectStore("profile").clear();
    tx.objectStore("entries").clear();
  });
  notify();
}

// Store the mutation and Undo record in one transaction. Confirm is idempotent.
export async function applyCoachAction(proposal){
 const id=proposal.id||crypto.randomUUID();
 if(proposal.kind==='log'){
   if(!['water','weight'].includes(proposal.entry?.kind))throw Error('Unsupported action.');
   proposal={...proposal,entry:{...proposal.entry,amount:number(proposal.entry.amount,proposal.entry.kind==='weight'?25:1,proposal.entry.kind==='weight'?350:3000,'amount')}};
 } else if(proposal.kind==='tracker'){
   if(!String(proposal.name||'').trim()||String(proposal.name).length>60)throw Error('Use a tracker name under 60 characters.');
 } else throw Error('Unsupported action.');
 await transaction(['profile','entries','actions'],'readwrite',tx=>{
  const actions=tx.objectStore('actions');actions.get(id).onsuccess=e=>{
   if(e.target.result)return;const at=new Date().toISOString();
   if(proposal.kind==='log'){
    const entry={...proposal.entry,id,at,day:dayKey()};tx.objectStore('entries').add(entry);actions.add({id,kind:'log',entry,state:'applied',at});
   }else tx.objectStore('profile').get('current').onsuccess=e=>{
    const p=e.target.result;if(!p){tx.abort();return;}
    const tracker={id,name:proposal.name.trim()};tx.objectStore('profile').put({...p,trackers:[...(p.trackers||[]),tracker]},'current');actions.add({id,kind:'tracker',tracker,state:'applied',at});
   };
  };
 });notify();return id;
}
export async function toggleCoachAction(id,redo=false){
 await transaction(['profile','entries','actions'],'readwrite',tx=>{
  const store=tx.objectStore('actions');store.get(id).onsuccess=e=>{
   const a=e.target.result;if(!a||a.state===(redo?'applied':'undone'))return;
   if(a.kind==='log'){
    const entries=tx.objectStore('entries');entries.get(id).onsuccess=e=>{
      const current=e.target.result;if((!redo&&current?.editedAt)||(redo&&current)){tx.abort();return;}
      if(redo)entries.add(a.entry);else entries.delete(id);
    };
   }else tx.objectStore('profile').get('current').onsuccess=e=>{
    const p=e.target.result;if(!p){tx.abort();return;}const trackers=(p.trackers||[]).filter(t=>t.id!==id);tx.objectStore('profile').put({...p,trackers:redo?[...trackers,a.tracker]:trackers},'current');
   };
   store.put({...a,state:redo?'applied':'undone'});
  };
 });notify();
}
export async function editEntry(id,changes){
 await transaction(['entries'],'readwrite',tx=>{const store=tx.objectStore('entries');store.get(id).onsuccess=e=>{if(e.target.result)store.put({...e.target.result,...changes,id,at:e.target.result.at,day:e.target.result.day,editedAt:new Date().toISOString()});};});notify();
}
