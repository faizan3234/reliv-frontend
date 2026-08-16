/**
 * Resolves clean kiosk URL from state or string.
 * Throws an explicit error if kiosk connection info is missing.
 */
export function getKioskUrl(state) {
  const kioskUrl = typeof state === 'string' ? state : state?.kioskUrl;
  if (!kioskUrl || kioskUrl.trim().length === 0) {
    throw new Error('Kiosk connection information is missing from session.');
  }
  return kioskUrl.replace(/\/+$/, '');
}

/**
 * Gets default return URL for Pi redirects back to HTTPS customer site.
 */
export function getDefaultReturnUrl(extraParams = {}) {
  const currentUrl = new URL(window.location.href);
  Object.keys(extraParams).forEach((key) => {
    if (extraParams[key]) {
      currentUrl.searchParams.set(key, extraParams[key]);
    }
  });
  return currentUrl.toString();
}

/**
 * Creates and submits a top-level HTML form POST to the local Raspberry Pi.
 * Solves HTTPS-to-HTTP mixed content restrictions by relying on browser top-level navigation.
 */
export function performKioskHandoff(actionPath, formDataFields, kioskStateOrUrl) {
  const kioskBaseUrl = getKioskUrl(kioskStateOrUrl);
  const targetUrl = actionPath.startsWith('http')
    ? actionPath
    : `${kioskBaseUrl}${actionPath.startsWith('/') ? '' : '/'}${actionPath}`;

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
export function submitPaymentCompleteToPi({ sessionId, authorization, signature, pairingToken, returnUrl, kioskBaseUrl }) {
  performKioskHandoff(
    '/payment-complete',
    {
      sessionId,
      authorization: typeof authorization === 'object' ? JSON.stringify(authorization) : authorization,
      signature,
      pairingToken,
      returnUrl: returnUrl || getDefaultReturnUrl({ step: 'completion', status: 'pending' }),
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
      returnUrl: returnUrl || getDefaultReturnUrl({ step: 'service' }),
    },
    kioskBaseUrl
  );
}

/**
 * Submits order creation request to Pi /api/create-order endpoint via top-level form POST.
 * Pi calculates authoritative price from backend inventory, creates SQLite transaction, and redirects back.
 */
export function submitOrderCreationToPi({ sessionId, pairingToken, serviceType, cart, returnUrl, kioskBaseUrl }) {
  performKioskHandoff(
    '/api/create-order',
    {
      sessionId,
      pairingToken,
      serviceType,
      cart: typeof cart === 'object' ? JSON.stringify(cart) : cart,
      returnUrl: returnUrl || getDefaultReturnUrl({ step: 'payment' }),
    },
    kioskBaseUrl
  );
}

