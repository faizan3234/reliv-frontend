# Medicine stock visibility

Each medicine card shows backend available quantity (physical stock minus reservations when the API does not provide available_quantity directly). The quantity selected in the cart stays separate; selecting an item does not pretend that dispensing has happened.

Zero, invalid and expired inventory cannot be selected. Both card and cart plus buttons stop at available quantity. Zero-stock cards remain visible with a disabled Out of stock button. English, Hindi and Bengali stock labels and spoken selection instructions explain the flow.

Local inventory refresh runs every 15 seconds while the page is visible and can be requested manually. Requests have an eight-second deadline; unmount aborts the active inventory refresh. A failed refresh blocks adding/increasing items and checkout until stock is checked again. This is polling, not a guarantee of instantaneous synchronization with hardware.

Checkout rechecks stock and price. If quantities or prices changed, the selection is adjusted and the customer stays on the page to review it. It never silently proceeds with a changed order. Backend payment pricing/reservations remain authoritative for races after this check.

Validation: medicine-stock browser regressions cover quantity 2, reserved units, zero/invalid stock, card/cart limits, stock refresh, checkout reduction, offline recovery, sold-out removal, EN/HI/BN labels and valid checkout navigation. Existing customer-flow integration, lint and production build are also run. Real Pi touch display and dispensing require device verification.
