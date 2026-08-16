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
 * Normalizes cart items to ensure kit_id, name, and quantity are always well-formed.
 */
export function submitOrderCreationToPi({ sessionId, pairingToken, serviceType, cart, returnUrl, kioskBaseUrl }) {
  const normalizedCart = Array.isArray(cart)
    ? cart
        .map((item) => ({
          kit_id: item.kit_id || item.id || '',
          name: item.name || '',
          quantity: Number(item.quantity ?? item.cartQuantity ?? 1),
        }))
        .filter(
          (item) =>
            item.kit_id &&
            Number.isFinite(item.quantity) &&
            item.quantity > 0
        )
    : [];

  console.log('[KIOSK HANDOFF] FINAL CART:', JSON.stringify(normalizedCart));

  if (serviceType === 'MEDICINE' && normalizedCart.length === 0) {
    throw new Error('Cannot create MEDICINE order: cart is empty before Pi handoff.');
  }

  performKioskHandoff(
    '/api/create-order',
    {
      sessionId,
      pairingToken,
      serviceType,
      // Explicit JSON string so Express body-parser receives a clean array
      cart: JSON.stringify(normalizedCart),
      returnUrl: returnUrl || getDefaultReturnUrl({ step: 'payment' }),
    },
    kioskBaseUrl
  );
}

