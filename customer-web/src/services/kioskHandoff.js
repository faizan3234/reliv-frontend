const DEFAULT_KIOSK_URL = import.meta.env.VITE_KIOSK_FALLBACK_URL || 'http://192.168.50.1';

/**
 * Creates and submits a top-level HTML form POST to the local Raspberry Pi.
 * Solves HTTPS-to-HTTP mixed content restrictions by relying on browser top-level navigation.
 */
export function performKioskHandoff(actionPath, formDataFields, kioskBaseUrl = DEFAULT_KIOSK_URL) {
  const targetUrl = actionPath.startsWith('http') ? actionPath : `${kioskBaseUrl}${actionPath.startsWith('/') ? '' : '/'}${actionPath}`;

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = targetUrl;
  form.style.display = 'none';

  Object.keys(formDataFields).forEach((key) => {
    const val = formDataFields[key];
    if (val !== undefined && val !== null) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = typeof val === 'object' ? JSON.stringify(val) : String(val);
      form.appendChild(input);
    }
  });

  document.body.appendChild(form);
  form.submit();
}

/**
 * Submits signed payment authorization to Pi /payment-complete endpoint via top-level form POST.
 */
export function submitPaymentCompleteToPi({ sessionId, authorization, signature, pairingToken, kioskBaseUrl }) {
  performKioskHandoff(
    '/payment-complete',
    {
      sessionId,
      authorization: typeof authorization === 'object' ? JSON.stringify(authorization) : authorization,
      signature,
      pairingToken,
    },
    kioskBaseUrl
  );
}

/**
 * Submits customer details to Pi endpoint via top-level form POST.
 */
export function submitCustomerDetailsToPi({ sessionId, customerDetails, pairingToken, returnUrl, kioskBaseUrl }) {
  performKioskHandoff(
    `/api/sessions/${sessionId}/customer`,
    {
      sessionId,
      pairingToken,
      name: customerDetails.name,
      age: customerDetails.age,
      gender: customerDetails.gender,
      email: customerDetails.email,
      phone: customerDetails.phone,
      returnUrl: returnUrl || window.location.href,
    },
    kioskBaseUrl
  );
}
