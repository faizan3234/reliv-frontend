import assert from "node:assert/strict";
import { test, beforeEach } from "node:test";
import { clearKioskSession, ensureKioskSession, readKioskSession, saveKioskCustomer, storeKioskSession } from "./src/utils/kioskSession.js";

class Storage {
  data = new Map();
  getItem(key) { return this.data.get(key) ?? null; }
  setItem(key, value) { this.data.set(key, String(value)); }
  removeItem(key) { this.data.delete(key); }
}
beforeEach(() => {
  Object.defineProperty(globalThis, "localStorage", { value: new Storage(), configurable: true });
  Object.defineProperty(globalThis, "sessionStorage", { value: new Storage(), configurable: true });
});
const session = { sessionId: "KSK-TEST", pairingToken: "test-pair" };
const response = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });

test("persist complete pair in both storage areas", () => {
  storeKioskSession(session);
  assert.deepEqual(readKioskSession(), session);
  assert.equal(sessionStorage.getItem("reliv_pairing_token"), session.pairingToken);
});
test("reject mismatched halves and recover a complete sessionStorage pair", () => {
  localStorage.setItem("reliv_session_id", "KSK-OLD");
  sessionStorage.setItem("reliv_pairing_token", "new-token");
  assert.equal(readKioskSession(), null);
  sessionStorage.setItem("reliv_session_id", "KSK-NEW");
  assert.deepEqual(readKioskSession(), { sessionId: "KSK-NEW", pairingToken: "new-token" });
});
test("missing token never becomes a usable local session", async () => {
  globalThis.fetch = async () => response({ sessionId: "KSK-NO-TOKEN" });
  await assert.rejects(ensureKioskSession(""), /pairing token/);
  assert.equal(readKioskSession(), null);
});
test("failed creation does not invent an ID and can be retried", async () => {
  globalThis.fetch = async () => { throw new Error("offline"); };
  await assert.rejects(ensureKioskSession(""), /offline/);
  assert.equal(readKioskSession(), null);
  globalThis.fetch = async () => response(session);
  assert.deepEqual(await ensureKioskSession(""), session);
});
test("concurrent initialization and submission create only one session", async () => {
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url, body: JSON.parse(options.body) });
    if (url.endsWith("create-qr-session")) { await pending; return response(session); }
    return response({ success: true });
  };
  const init = ensureKioskSession("");
  const patient = { name: "Test Customer", age: 40, gender: "female" };
  const save = saveKioskCustomer("", patient);
  release();
  await init;
  assert.deepEqual(await save, session);
  assert.deepEqual(requests, [
    { url: "/api/create-qr-session", body: {} },
    { url: "/api/sessions/KSK-TEST/customer", body: { pairingToken: "test-pair", customerData: patient } },
  ]);
});
test("customer rejection propagates and expired pairing is cleared", async () => {
  storeKioskSession(session);
  globalThis.fetch = async () => response({ error: "Session expired" }, 403);
  await assert.rejects(saveKioskCustomer("", { name: "Test" }), /Session expired/);
  assert.equal(readKioskSession(), null);
});
test("HTTP success with failed business result is not accepted", async () => {
  storeKioskSession(session);
  globalThis.fetch = async () => response({ success: false, error: "Customer rejected" });
  await assert.rejects(saveKioskCustomer("", { name: "Test" }), /Customer rejected/);
});

test("reset during creation cannot resurrect an old session or replace a new pending creation", async () => {
  const releases = [];
  globalThis.fetch = () => new Promise(resolve => releases.push(resolve));
  const old = ensureKioskSession("");
  const oldRejected = assert.rejects(old, /reset/);
  clearKioskSession();
  const next = ensureKioskSession("");
  releases[0](response({ sessionId: "KSK-OLD", pairingToken: "old" }));
  await oldRejected;
  assert.equal(readKioskSession(), null);
  const concurrent = ensureKioskSession("");
  assert.equal(releases.length, 2);
  releases[1](response(session));
  assert.deepEqual(await next, session);
  assert.deepEqual(await concurrent, session);
});

test("an expired old customer request cannot clear a newer session", async () => {
  storeKioskSession(session);
  let release;
  globalThis.fetch = () => new Promise(resolve => { release = resolve; });
  const old = saveKioskCustomer("", { name: "Old Customer" });
  await Promise.resolve();
  const rejected = assert.rejects(old, /expired/);
  const next = { sessionId: "KSK-NEW", pairingToken: "new" };
  storeKioskSession(next);
  release(response({ error: "Session expired" }, 410));
  await rejected;
  assert.deepEqual(readKioskSession(), next);
});
