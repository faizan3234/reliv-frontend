const KEY = 'reliv-private-records-v1';
let unlocked = null;
const encode = bytes => { let text = ''; for (let i = 0; i < bytes.length; i += 16384) text += String.fromCharCode(...bytes.subarray(i, i + 16384)); return btoa(text); };
const decode = text => Uint8Array.from(atob(text), c => c.charCodeAt(0));
const changed = () => { if (typeof window !== 'undefined') window.dispatchEvent(new Event('reliv-records-changed')); };
export const vaultOpen = () => Boolean(unlocked);
export const vaultExists = () => Boolean(localStorage.getItem(KEY));
export function lockVault() { unlocked = null; changed(); }
export async function unlockVault(password) {
    if (typeof password !== 'string' || password.length < 8) throw Error('Use at least 8 characters for your private password.');
    const raw = localStorage.getItem(KEY), envelope = raw ? JSON.parse(raw) : null;
    const salt = envelope ? decode(envelope.salt) : crypto.getRandomValues(new Uint8Array(16));
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    let data = { records: [], autoProfiles: [] };
    if (envelope) {
        try {
            const bytes = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(envelope.iv) }, key, decode(envelope.cipher));
            data = JSON.parse(new TextDecoder().decode(bytes));
            if (!Array.isArray(data.records) || !Array.isArray(data.autoProfiles)) throw Error();
        } catch { throw Error('Password did not unlock these records. Please try again.'); }
    }
    unlocked = { key, salt, data, raw }; changed();
}
export function readVault() { if (!unlocked) throw Error('Unlock your private records first.'); return JSON.parse(JSON.stringify(unlocked.data)); }
async function commit(data) {
    if (!unlocked) throw Error('Unlock your private records first.');
    const current = unlocked, expectedRaw = unlocked.raw;
    if (localStorage.getItem(KEY) !== expectedRaw) throw Error('Records changed in another window. Lock and unlock to reload them.');
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, current.key, new TextEncoder().encode(JSON.stringify(data)));
    if (unlocked !== current || localStorage.getItem(KEY) !== expectedRaw) throw Error('Records changed. Unlock and try again.');
    const raw = JSON.stringify({ version: 1, salt: encode(current.salt), iv: encode(iv), cipher: encode(new Uint8Array(cipher)) });
    localStorage.setItem(KEY, raw); current.raw = raw; current.data = data; changed();
}
export async function saveRecord(record, auto = false) {
    if (!record || record.version !== 1 || typeof record.id !== 'string' || !record.id || typeof record.profileKey !== 'string' || !record.profileKey || !Number.isSafeInteger(record.scanNumber) || record.scanNumber < 1 || !record.vitals || !record.patient) throw Error('This report is incomplete and was not saved.');
    const data = readVault(), existing = data.records.find(r => r.id === record.id);
    if (existing && existing.profileKey !== record.profileKey) throw Error('Record identity does not match.');
    if (!existing) { if (data.records.length >= 500) throw Error('This phone has reached its 500-record limit.'); data.records.push(record); }
    data.autoProfiles = data.autoProfiles.filter(key => key !== record.profileKey);
    if (auto) data.autoProfiles.push(record.profileKey);
    await commit(data);
}
export async function setAutoSave(profileKey, enabled) { const data = readVault(); data.autoProfiles = data.autoProfiles.filter(k => k !== profileKey); if (enabled) data.autoProfiles.push(profileKey); await commit(data); }
export async function deleteRecord(id) { const data = readVault(); data.records = data.records.filter(r => r.id !== id); data.autoProfiles = data.autoProfiles.filter(k => data.records.some(r => r.profileKey === k)); await commit(data); }
export function exportVault() { const raw = localStorage.getItem(KEY); if (!raw) throw Error('No saved records to back up.'); return raw; }
export function importVault(raw) {
    if (localStorage.getItem(KEY)) throw Error('This browser already has records. Import cannot overwrite them.');
    if (typeof raw !== 'string' || raw.length > 2500000) throw Error('Invalid or oversized backup.');
    const e = JSON.parse(raw);
    if (e.version !== 1 || typeof e.cipher !== 'string' || decode(e.salt).length !== 16 || decode(e.iv).length !== 12 || decode(e.cipher).length < 16) throw Error('Invalid encrypted backup.');
    localStorage.setItem(KEY, raw); lockVault();
}
