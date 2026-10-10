import React, { useEffect } from 'react';

export function StartupReady({ children }) {
  useEffect(() => { window.relivBootReady?.(); }, []);
  return children;
}
export class StartupBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { window.relivBootReady?.(); }
  render() {
    if (this.state.failed) return <main className="reliv-app min-h-screen bg-orange-50 p-6 text-slate-900">
      <img src="/reliv-logo.svg" alt="Reliv" width="120" height="50" />
      <h1 className="mt-6 text-xl font-bold">Let’s get you back to Reliv</h1>
      <p className="my-4">The screen could not finish loading. Reload to restore your saved payment session. If you already paid, do not pay again.</p>
      <button className="min-h-12 rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white" onClick={() => window.location.reload()}>Reload Reliv</button>
    </main>;
    return this.props.children;
  }
}
