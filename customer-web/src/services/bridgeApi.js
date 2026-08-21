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

// Backward compatibility alias
export const BRIDGE_BASE_URL = PAYMENT_API_BASE;

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
  razorpay_payment_id,
  razorpay_order_id,
  razorpay_signature,
}) {
  try {
    const response = await fetch(`${PAYMENT_API_BASE}/api/v2/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestId,
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `Payment verification failed (HTTP ${response.status})`);
    }

    const data = await response.json();
    if (!data.ok && data.success !== true && !data.confirmationCode && !data.confirmation_code && !data.code) {
      throw new Error(data.message || 'Payment verification failed');
    }

    return {
      ok: true,
      confirmationCode: data.confirmationCode || data.confirmation_code || data.code,
      requestId: data.requestId || requestId,
      raw: data,
    };
  } catch (err) {
    console.error('Error calling Payment V2 verify-payment:', err);
    throw err;
  }
}

/**
 * Legacy: Calls Payment Bridge POST /create-order to create Razorpay Order server-side.
 */
export async function createBridgeOrder({ sessionId, transactionId, kioskId, amount, currency = 'INR' }) {
  try {
    const response = await fetch(`${PAYMENT_API_BASE}/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        transactionId,
        kioskId,
        amount,
        currency,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: Failed to create order on Payment Bridge`);
    }

    const data = await response.json();
    return {
      orderId: data.id || data.orderId || data.razorpay_order_id,
      amount: data.amount,
      currency: data.currency || 'INR',
      keyId: data.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID,
      raw: data,
    };
  } catch (err) {
    console.error('Error calling Payment Bridge create-order:', err);
    throw err;
  }
}

/**
 * Legacy: Calls Payment Bridge POST /verify-payment to verify Razorpay signature and generate RSA authorization.
 */
export async function verifyBridgePayment({
  razorpay_payment_id,
  razorpay_order_id,
  razorpay_signature,
  sessionId,
  transactionId,
  kioskId,
}) {
  try {
    const response = await fetch(`${PAYMENT_API_BASE}/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        sessionId,
        transactionId,
        kioskId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `Payment verification failed on Bridge (Status ${response.status})`);
    }

    const data = await response.json();
    if (!data.success && data.ok !== true) {
      throw new Error(data.message || 'Payment verification returned unsuccessful state');
    }

    return {
      success: true,
      authorization: data.authorization,
      signature: data.signature,
      raw: data,
    };
  } catch (err) {
    console.error('Error calling Payment Bridge verify-payment:', err);
    throw err;
  }
}
