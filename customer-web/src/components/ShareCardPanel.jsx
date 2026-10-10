import React, { useEffect, useState } from 'react';

// Keep artwork, fonts and image-export libraries off the scanner/startup path.
let pending;
function loadCard() {
  if (!pending) pending = import('./CheckinCard').catch(error => { pending = null; throw error; });
  return pending;
}
export function ShareCardPanel(props) {
  const [Card, setCard] = useState(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setError(false);
    loadCard().then(module => { if (active) setCard(() => module.CheckinCard); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [attempt]);
  if (Card) return <Card {...props} />;
  return <section className="rounded-2xl border border-orange-100 bg-white p-4" aria-live="polite">
    <p>{error ? 'Your kiosk code is ready. The optional share card could not load.' : 'Your kiosk code is ready. Preparing your share card…'}</p>
    {error && <button type="button" className="mt-3 min-h-11 rounded-xl border px-4" onClick={() => setAttempt(value => value + 1)}>Retry share card</button>}
  </section>;
}
