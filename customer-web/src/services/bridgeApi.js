export const PAYMENT_API_BASE = (
  import.meta.env.VITE_PAYMENT_API_BASE ||
  import.meta.env.VITE_PAYMENT_BRIDGE_URL ||
  'https://80.225.243.51'
).replace(/\/$/, '');

if (!PAYMENT_API_BASE.startsWith('https://')) {
  throw new Error(
    'Payment Bridge must use HTTPS in production.'
  );
}

/**
 * Checks Payment Bridge /health status
 */
export async function checkBridgeHealth() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${PAYMENT_API_BASE}/health`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Payment service returned HTTP ${response.status}`);
    }

    const data = await response.json();

    return {
      ok:
        data?.status === 'healthy' &&
        data?.razorpay === true &&
        data?.database === true,
      data,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error?.name === 'AbortError'
          ? 'Payment service timed out.'
          : error?.message || 'Payment service unavailable.',
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * PAYMENT V2: Calls Oracle POST /api/v2/create-order with encrypted QR package
 */
export async function createPaymentV2Order({ encryptedPackage }) {
  try {
    const response = await fetch(`${PAYMENT_API_BASE}/api/v2/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        package: encryptedPackage,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `Failed to create payment order (HTTP ${response.status})`);
    }

    const data = await response.json();
    return {
      ok: true,
      orderId: data.orderId || data.id || data.razorpay_order_id,
      amount: data.amount, // in paise
      currency: data.currency || 'INR',
      keyId: data.keyId || data.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID,
      requestId: data.requestId || data.request_id,
      serviceType: data.serviceType || data.service_type || 'HEALTH_CHECKUP',
      kioskId: data.kioskId || data.kiosk_id,
      raw: data,
    };
  } catch (err) {
    console.error('Error calling Payment V2 create-order:', err);
    throw err;
  }
}

/**
 * PAYMENT V2: Calls Oracle POST /api/v2/verify-payment to verify signature and return 4-digit confirmation code
 */
export async function verifyPaymentV2({
  requestId,
  orderId,
  paymentId,
  signature,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) {
  const finalOrderId = orderId || razorpay_order_id;
  const finalPaymentId = paymentId || razorpay_payment_id;
  const finalSignature = signature || razorpay_signature;

  if (
    typeof finalOrderId !== 'string' || !finalOrderId.trim() ||
    typeof finalPaymentId !== 'string' || !finalPaymentId.trim() ||
    typeof finalSignature !== 'string' || !finalSignature.trim()
  ) {
    throw new Error('orderId, paymentId, and signature are required');
  }

  const payload = {
    orderId: finalOrderId.trim(),
    paymentId: finalPaymentId.trim(),
    signature: finalSignature.trim(),
  };

  if (requestId) {
    payload.requestId = requestId;
  }

  try {
    const response = await fetch(`${PAYMENT_API_BASE}/api/v2/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `Payment verification failed (HTTP ${response.status})`);
    }

    const data = await response.json();
    if (!data.ok && data.success !== true && !data.confirmationCode && !data.confirmation_code && !data.code && data.paid !== true) {
      throw new Error(data.error || data.message || 'Payment verification failed');
    }

    const confirmationCode = data.confirmationCode || data.confirmation_code || data.code;

    return {
      ok: true,
      paid: data.paid ?? true,
      confirmationCode: confirmationCode ? String(confirmationCode).trim() : '',
      requestId: data.requestId || requestId,
      raw: data,
    };
  } catch (err) {
    console.error('Error calling Payment V2 verify-payment:', err.message || err);
    throw err;
  }
}

/**
 * PAYMENT V2: Calls Oracle POST /api/v2/email-receipt to send payment receipt to customer
 */
export async function emailPaymentReceipt({ requestId, email }) {
  if (!requestId || !email) {
    throw new Error('requestId and email are required to send receipt.');
  }

  try {
    const response = await fetch(`${PAYMENT_API_BASE}/api/v2/email-receipt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestId: String(requestId).trim(),
        email: String(email).trim(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `Failed to send email receipt (HTTP ${response.status})`);
    }

    const data = await response.json();
    return {
      ok: true,
      alreadySent: Boolean(data.alreadySent || data.already_sent),
      message: data.message || 'Receipt sent successfully',
      raw: data,
    };
  } catch (err) {
    console.error('Error calling Payment V2 email-receipt:', err.message || err);
    throw err;
  }
}
