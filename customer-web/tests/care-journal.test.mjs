import 'fake-indexeddb/auto';import test from 'node:test';import assert from 'node:assert/strict';
globalThis.window=new EventTarget();
const {applyCoachAction,toggleCoachAction,readCare,clearCare,saveProfile,editEntry}=await import('../src/care/data.js');
test('atomic journal is idempotent, persistent and preserves manual corrections',async()=>{
 await clearCare();await saveProfile({name:'Rahul',trackers:[]});const p={id:'water-1',kind:'log',entry:{kind:'water',amount:250}};
 await Promise.all([applyCoachAction(p),applyCoachAction(p)]);assert.equal((await readCare()).entries.length,1);
 await toggleCoachAction(p.id);assert.equal((await readCare()).entries.length,0);await toggleCoachAction(p.id,true);assert.equal((await readCare()).entries[0].amount,250);
 await editEntry(p.id,{amount:500});await assert.rejects(toggleCoachAction(p.id));assert.equal((await readCare()).entries[0].amount,500);
 await applyCoachAction({id:'habit-1',kind:'tracker',name:'stretching'});assert.equal((await readCare()).profile.trackers.length,1);
 await toggleCoachAction('habit-1');assert.equal((await readCare()).profile.trackers.length,0);await toggleCoachAction('habit-1',true);assert.equal((await readCare()).profile.trackers[0].name,'stretching');
 await clearCare();assert.equal((await readCare()).actions.length,0);
});
