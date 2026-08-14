const BRIDGE_BASE_URL = import.meta.env.VITE_PAYMENT_BRIDGE_URL || 'https://bridge.reliv.in';

/**
 * Calls Payment Bridge POST /create-order to create Razorpay Order server-side.
 */
export async function createBridgeOrder({ sessionId, transactionId, kioskId, amount, currency = 'INR' }) {
  try {
    const response = await fetch(`${BRIDGE_BASE_URL}/create-order`, {
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
 * Calls Payment Bridge POST /verify-payment to verify Razorpay signature and generate RSA authorization.
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
    const response = await fetch(`${BRIDGE_BASE_URL}/verify-payment`, {
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
