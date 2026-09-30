import React from "react";
import { recoveryUrl } from '../utils/recoveryUrl';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    this._autoRecoverTimer = null;
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: String(error?.message || 'Unknown startup error').slice(0, 600) };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught:", error, errorInfo);
    }
    // Never send an active/paid customer home automatically or claim their
    // data was saved. Keep an explicit recovery screen with the current URL.
  }

  componentWillUnmount() {
    clearTimeout(this._autoRecoverTimer);
  }

  handleReset = () => {
    clearTimeout(this._autoRecoverTimer);
    window.location.replace(recoveryUrl(window.location.href));
  };

  handleGoHome = () => {
    clearTimeout(this._autoRecoverTimer);
    // Do not remount the failed subtree before the browser navigates.
    window.location.replace(recoveryUrl(window.location.href, true));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen h-auto w-full flex flex-col items-center justify-center overflow-y-auto scrollable-container touch-pan-y bg-gradient-to-b from-white to-orange-50 px-6 py-8 text-center">
          <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full border border-orange-100">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-600">
              <svg className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h1>
            <p className="text-gray-500 mb-8">Please reload this screen to try again. If you already paid, do not pay again; ask the kiosk administrator for help.</p>
            <div className="space-y-3">
              <details className="text-left text-sm break-words text-gray-600 mb-4">
                <summary className="cursor-pointer py-2">Error details for administrator</summary>
                <p>{this.state.errorMessage}</p>
              </details>
              <button
                onClick={this.handleReset}
                className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3.5 font-semibold text-white shadow-md hover:shadow-lg transition-all"
              >
                Reload This Screen
              </button>
              <button
                onClick={this.handleGoHome}
                className="w-full rounded-xl bg-white border-2 border-gray-200 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50 transition-all"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
