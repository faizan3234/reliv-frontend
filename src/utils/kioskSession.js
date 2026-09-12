const SESSION_KEY = "reliv_session_id";
const TOKEN_KEY = "reliv_pairing_token";
const INVALID_IDS = new Set(["current", "default", "RELIV-001"]);
let pendingCreation = null;
let sessionGeneration = 0;

function stores() {
  return [localStorage, sessionStorage];
}

export function readKioskSession() {
  // Never combine an ID from one storage area with a token from another.
  for (const storage of stores()) {
    const sessionId = (storage.getItem(SESSION_KEY) || "").trim();
    const pairingToken = (storage.getItem(TOKEN_KEY) || "").trim();
    if (sessionId && pairingToken && !INVALID_IDS.has(sessionId)) {
      return { sessionId, pairingToken };
    }
  }
  return null;
}

export function clearKioskSession() {
  sessionGeneration += 1;
  pendingCreation = null;
  for (const storage of stores()) {
    storage.removeItem(SESSION_KEY);
    storage.removeItem(TOKEN_KEY);
  }
}

export function storeKioskSession(data) {
  const sessionId = String(data?.sessionId || data?.id || "").trim();
  const pairingToken = String(data?.pairingToken || "").trim();
  if (!sessionId || !pairingToken || INVALID_IDS.has(sessionId)) {
    throw new Error("The kiosk did not return a valid session and pairing token. Please retry.");
  }
  for (const storage of stores()) {
    storage.setItem(SESSION_KEY, sessionId);
    storage.setItem(TOKEN_KEY, pairingToken);
  }
  return { sessionId, pairingToken };
}

async function post(base, path, body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(base + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const result = await response.json();
    if (!response.ok || result?.success === false || result?.ok === false) {
      const error = new Error(result?.error || result?.message || "The kiosk request failed. Please retry.");
      error.status = response.status;
      throw error;
    }
    return result;
  } catch (error) {
    if (error.name === "AbortError") throw new Error("The kiosk is not responding. Please retry.");
    if (error instanceof TypeError) throw new Error("Cannot connect to the kiosk. Check its connection and retry; your details are still on this screen.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function ensureKioskSession(base) {
  const existing = readKioskSession();
  if (existing) return storeKioskSession(existing);
  if (!pendingCreation) {
    clearKioskSession();
    const generation = sessionGeneration;
    const creation = post(base, "/api/create-qr-session", {})
      .then((data) => {
        if (generation !== sessionGeneration) throw new Error("The kiosk session was reset. Please retry.");
        return storeKioskSession(data);
      }).finally(() => { if (pendingCreation === creation) pendingCreation = null; });
    pendingCreation = creation;
  }
  return pendingCreation;
}

export async function saveKioskCustomer(base, patient) {
  const session = await ensureKioskSession(base);
  try {
    await post(base, "/api/sessions/" + encodeURIComponent(session.sessionId) + "/customer", {
      pairingToken: session.pairingToken,
      customerData: patient,
    });
    if (!isCurrentKioskSession(session)) throw new Error("The kiosk session was reset. Please retry.");
    return session;
  } catch (error) {
    if ([403, 404, 409, 410].includes(error.status) && isCurrentKioskSession(session)) clearKioskSession();
    throw error;
  }
}

export function isCurrentKioskSession(session) {
  const current = readKioskSession();
  return current?.sessionId === session.sessionId && current?.pairingToken === session.pairingToken;
}
