# Security Fixes — Fix Before Full Public Launch

---

## 🔴 FIX 1 — Gmail Password in Public GitHub

**File:** `backend/data/email_credentials.json`  
**Problem:** Contains `"password": "admin123"` in plaintext. This file is committed to the public GitHub repo. Anyone can read it by visiting the repo URL.

**Steps to fix:**
1. Add to `backend/.gitignore`:
   ```
   data/email_credentials.json
   data/admin_credentials.json
   data/reset_tokens.json
   ```
2. Delete the file from Git history:
   ```bash
   git rm --cached backend/data/email_credentials.json
   git commit -m "security: remove credentials from tracking"
   git push
   ```
3. Move credentials to environment variables on Render dashboard:
   - `GMAIL_USER=khanfaizan3234@gmail.com`
   - `GMAIL_PASS=your_new_app_password`
4. **Change your Gmail password immediately** — it has been publicly exposed.

---

## 🔴 FIX 2 — No Razorpay Payment Signature Verification (Dispense Without Paying)

### The Attack

Your backend exposes `/api/dispense` with **no authentication**. Since the backend is hosted on public Render, anyone on the internet can call it directly:

```bash
curl -X POST https://your-render-backend.onrender.com/api/dispense \
  -H "Content-Type: application/json" \
  -d '{"cart": [{"id": 1, "name": "Vitamin Kit", "cartQuantity": 2, "motor": 1}]}'
```

This triggers real MQTT → Pi → motor spins → medicine dispensed. **Zero payment made.**

The attack requires no physical access to the kiosk. The backend URL is visible in the Vercel-hosted frontend JS source.

### Why it works

Current frontend flow:
```
Razorpay success → handler() fires in browser → browser calls /api/dispense
```

The backend never verifies that Razorpay actually confirmed the payment. It just trusts the caller.

### The Fix (15 lines in server.js)

Razorpay gives 3 values on real payment success:
- `razorpay_order_id`
- `razorpay_payment_id`
- `razorpay_signature`

The signature = `HMAC-SHA256(order_id + "|" + payment_id, RAZORPAY_KEY_SECRET)`

Only Razorpay can produce a valid signature. Backend verifies it before dispensing.

**New flow:**
```
Razorpay success → frontend sends {order_id, payment_id, signature} to /api/verify-payment
→ backend verifies HMAC signature
→ if valid: dispense
→ if invalid/fake: reject 401
```

**Code to add in server.js:**
```js
import crypto from "crypto"; // already imported

app.post("/api/verify-payment", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, cart } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing payment verification fields" });
  }

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expected !== razorpay_signature) {
    console.error("[SECURITY] Invalid Razorpay signature — possible tamper attempt");
    return res.status(401).json({ error: "Payment verification failed" });
  }

  // Signature valid — safe to dispense
  // ... move dispense logic here or call it
  res.json({ ok: true, verified: true });
});
```

**Also update PaymentGate.jsx handler:**
```js
handler: async (response) => {
  // Verify with backend BEFORE proceeding
  const verifyRes = await fetch(`${VITE_BACKEND_URL}/api/verify-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature,
    }),
  });
  if (!verifyRes.ok) throw new Error("Payment verification failed");
  await completeSuccessfulPayment();
}
```

---

## Priority

| # | Issue | Risk | Effort |
|---|---|---|---|
| 1 | Gmail password in GitHub | HIGH — email account compromised right now | 10 min |
| 2 | No payment signature verification | HIGH — free medicine for anyone | 30 min |
