# Backend Changes Required for QR URL Hiding & One-Time Tokens

This document describes the backend (`server.js`) changes needed to fully support
the front-end QR code URL hiding and one-time token validation features.

---

## 1. New Endpoint: `POST /api/validate-session`

**Purpose:** Validates a one-time QR session token. Returns the real session ID
if valid, or a 410/404 if expired/already used.

```js
// In-memory store — CRITICAL: replace with Redis or MongoDB for production.
// In-memory storage loses all sessions on server restart and does NOT scale
// across multiple server instances.
const qrSessions = new Map();
// Each entry: { sessionId, createdAt, used: false }

// Called by the kiosk when generating a QR code
app.post('/api/create-qr-session', (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

  // Generate a cryptographically secure opaque token (full UUID for 122-bit entropy)
  const token = crypto.randomUUID();

  qrSessions.set(token, {
    sessionId,
    createdAt: Date.now(),
    used: false,
  });

  // Auto-expire after 10 minutes
  setTimeout(() => qrSessions.delete(token), 10 * 60 * 1000);

  res.json({ token });
});

// Called by the phone when it opens /h?t=<token>
app.post('/api/validate-session', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'token required' });

  const session = qrSessions.get(token);

  if (!session) {
    return res.status(404).json({ valid: false, reason: 'not_found' });
  }

  // Check if already used
  if (session.used) {
    return res.status(410).json({ valid: false, reason: 'already_used' });
  }

  // Check if expired (10 min TTL)
  if (Date.now() - session.createdAt > 10 * 60 * 1000) {
    qrSessions.delete(token);
    return res.status(410).json({ valid: false, reason: 'expired' });
  }

  // Mark as used (one-time only)
  session.used = true;

  res.json({ valid: true, sessionId: session.sessionId });
});
```

---

## 2. Update Existing Endpoints

### `POST /api/save-customer-data`
No changes needed — it already accepts `{ sessionId, customerData }`.

### `POST /api/get-customer-data`
No changes needed — it already accepts `{ sessionId }` and returns `{ customerData }`.

---

## 3. Optional: Short Token Generation on Kiosk Side

If you want the kiosk to generate tokens via the backend (instead of using
raw UUIDs as both tokens and session IDs), update the kiosk's
`CustomerDetails.jsx` flow:

1. Kiosk calls `POST /api/create-qr-session` with `{ sessionId }`.
2. Backend returns `{ token }` (a short 12-char string).
3. Kiosk embeds the token in the QR URL: `/h?t=<token>`.
4. Phone scans → hits `/h?t=<token>` → gateway calls `POST /api/validate-session`.
5. Backend returns `{ valid: true, sessionId }` → phone can now save data.

This way the real `sessionId` is **never** in the QR URL — only the short token is.

---

## 4. CORS Configuration

Ensure the backend allows requests from whatever domain you use for QR codes
(e.g., a short domain like `rlv.health`):

```js
app.use(cors({
  origin: [
    'https://your-main-domain.com',
    'https://your-short-domain.com',  // QR code proxy domain
    'http://localhost:5173',           // Dev
  ],
  credentials: true,
}));
```

---

## 5. Summary of Changes

| What                        | File            | Type     |
|-----------------------------|-----------------|----------|
| `POST /api/create-qr-session` | `server.js`  | New      |
| `POST /api/validate-session`  | `server.js`  | New      |
| CORS origin update            | `server.js`  | Modify   |
| In-memory session store       | `server.js`  | New      |

**Note:** The frontend currently has a graceful fallback — if `/api/validate-session`
doesn't exist yet, the gateway treats the token as a raw session ID and renders
the form anyway. So you can deploy the frontend first and add the backend later.
