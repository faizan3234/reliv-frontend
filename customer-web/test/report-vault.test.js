import test from 'node:test';
import assert from 'node:assert/strict';
const memory = new Map();
Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });
globalThis.localStorage = { getItem: k => memory.get(k) ?? null, setItem: (k,v) => memory.set(k,v) };
const vault = await import('../src/services/reportVault.js');
const record = n => ({version:1,id:'scan-'+n,profileKey:'kiosk:person',scanNumber:n,recordedAt:n,patient:{name:'Rahul'},vitals:{weight:60+n,temperature:98.4}});
test('password-free saving preserves each scan and reopens without unlocking', async () => {
 memory.clear(); memory.set('reliv-private-records-v1','legacy-ciphertext');
 for(let n=1;n<=7;n++) await vault.saveRecord(record(n));
 await vault.saveRecord(record(7));
 assert.equal(vault.readVault().records.length,7);
 assert.deepEqual(vault.readVault().records.map(r=>r.scanNumber),[1,2,3,4,5,6,7]);
 const reopened = await import('../src/services/reportVault.js?reopen');
 assert.equal(reopened.readVault().records[6].vitals.weight,67);
 assert.deepEqual(reopened.readVault().autoProfiles,['kiosk:person']);
 assert.equal(memory.get('reliv-private-records-v1'),'legacy-ciphertext');
 await assert.rejects(vault.saveRecord({...record(7),profileKey:'someone-else'}),/identity/);
 await vault.setAutoSave('kiosk:person',false);assert.deepEqual(vault.readVault().autoProfiles,[]);
});
test('bad data and storage failure do not report successful saving', async () => {
 await assert.rejects(vault.saveRecord({}),/incomplete/);
 const set = localStorage.setItem; localStorage.setItem=()=>{throw Error('Storage full');};
 await assert.rejects(vault.saveRecord(record(8)),/Storage full/);localStorage.setItem=set;
 assert.equal(vault.readVault().records.length,7);
});
test('different profiles stay separate and concurrent calls keep every scan',async()=>{
 await Promise.all([vault.saveRecord(record(8)),vault.saveRecord({...record(9),profileKey:'other'})]);
 assert.equal(vault.readVault().records.length,9);
 assert.equal(vault.readVault().records.filter(r=>r.profileKey==='other').length,1);
});
