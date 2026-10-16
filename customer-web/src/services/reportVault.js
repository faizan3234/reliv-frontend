// Password-free records belong to this browser/app. Keep legacy encrypted data untouched.
const KEY = 'reliv-device-records-v2';
const LEGACY_KEY = 'reliv-private-records-v1';
const changed = () => { if (typeof window !== 'undefined') window.dispatchEvent(new Event('reliv-records-changed')); };
export function legacyRecordsExist() { return Boolean(localStorage.getItem(LEGACY_KEY)); }
export function vaultExists() { return Boolean(localStorage.getItem(KEY)); }
export function readVault() {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { records: [], autoProfiles: [] };
    const data = JSON.parse(raw);
    if (data.version !== 2 || !Array.isArray(data.records) || !Array.isArray(data.autoProfiles)) throw Error('Saved records could not be read. They have not been replaced.');
    return data;
}
function write(change) {
    // Synchronous read-modify-write avoids async lost updates within this document.
    const data = readVault(); change(data);
    localStorage.setItem(KEY, JSON.stringify({ ...data, version: 2 })); changed();
}
function commit(change) {
    return globalThis.navigator?.locks?.request ? navigator.locks.request('reliv-records-write', () => write(change)) : Promise.resolve(write(change));
}
export async function saveRecord(record, auto = true) {
    if (!record || record.version !== 1 || typeof record.id !== 'string' || !record.id || typeof record.profileKey !== 'string' || !record.profileKey || !Number.isSafeInteger(record.scanNumber) || record.scanNumber < 1 || !record.vitals || !record.patient) throw Error('This report is incomplete and was not saved.');
    await commit(data => {
        const existing = data.records.find(r => r.id === record.id);
        if (existing && existing.profileKey !== record.profileKey) throw Error('Record identity does not match.');
        if (!existing) data.records.push(record);
        data.autoProfiles = data.autoProfiles.filter(k => k !== record.profileKey);
        if (auto) data.autoProfiles.push(record.profileKey);
    });
    // Best effort only: the browser decides whether persistent storage is granted.
    try { await globalThis.navigator?.storage?.persist?.(); } catch { /* Saving already succeeded. */ }
}
export async function setAutoSave(profileKey, enabled) { await commit(data => { data.autoProfiles = data.autoProfiles.filter(k => k !== profileKey); if (enabled) data.autoProfiles.push(profileKey); }); }
export async function deleteRecord(id) { await commit(data => { data.records = data.records.filter(r => r.id !== id); data.autoProfiles = data.autoProfiles.filter(k => data.records.some(r => r.profileKey === k)); }); }
export function exportVault() { return JSON.stringify(readVault()); }
