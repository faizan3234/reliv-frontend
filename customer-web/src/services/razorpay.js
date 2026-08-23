const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

let scriptLoadPromise = null;

/**
 * Dynamically loads official Razorpay checkout.js script if not already present in DOM.
 */
export function loadRazorpayScript() {
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    if (window.Razorpay) {
      return resolve(true);
    }
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      scriptLoadPromise = null;
      reject(new Error('Failed to load Razorpay Checkout script. Check Internet connection.'));
    };
    document.body.appendChild(script);
  });

  return scriptLoadPromise;
}

/**
 * Initializes standard Razorpay Checkout flow upon explicit user action.
 */
export async function openRazorpayCheckout({
  orderId,
  amount,
  currency = 'INR',
  keyId = import.meta.env.VITE_RAZORPAY_KEY_ID,
  customerDetails = {},
  onSuccess,
  onDismiss,
  onError,
}) {
  await loadRazorpayScript();

  if (!window.Razorpay) {
    throw new Error('Razorpay SDK is not available in browser window.');
  }

  const options = {
    key: keyId,
    amount: amount, // in paise
    currency: currency,
    name: 'Reliv Health Kiosk',
    description: 'Health Kiosk Transaction',
    image: '/reliv-logo.svg',
    order_id: orderId,
    prefill: {
      name: customerDetails.name || '',
      email: customerDetails.email || '',
      contact: customerDetails.phone || '',
    },
    theme: {
      color: '#f97316', // Reliv Orange
    },
    handler: function (response) {
      if (!response) {
        if (onError) {
          onError(new Error('Invalid Razorpay callback: empty response received.'));
        }
        return;
      }

      const orderId = response.razorpay_order_id;
      const paymentId = response.razorpay_payment_id;
      const signature = response.razorpay_signature;

      const isValid =
        typeof orderId === 'string' && orderId.trim().length > 0 &&
        typeof paymentId === 'string' && paymentId.trim().length > 0 &&
        typeof signature === 'string' && signature.trim().length > 0;

      if (!isValid) {
        if (onError) {
          onError(new Error('Invalid Razorpay callback: orderId, paymentId, and signature are required.'));
        }
        return;
      }

      if (onSuccess) {
        onSuccess({
          orderId: orderId.trim(),
          paymentId: paymentId.trim(),
          signature: signature.trim(),
          razorpay_order_id: orderId.trim(),
          razorpay_payment_id: paymentId.trim(),
          razorpay_signature: signature.trim(),
        });
      }
    },
    modal: {
      confirm_close: true,
      escape: false,
      ondismiss: function () {
        if (onDismiss) onDismiss();
      },
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.on('payment.failed', function (response) {
    if (onError) {
      onError(response.error || { message: 'Payment failed' });
    }
  });

  rzp.open();
}
