import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    this._autoRecoverTimer = null;
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught:", error, errorInfo);
    }
    // Auto-recover to home after 3 seconds (kiosk can't have dead screens)
    this._autoRecoverTimer = setTimeout(() => {
      window.location.href = "/";
    }, 3000);
  }

  componentWillUnmount() {
    clearTimeout(this._autoRecoverTimer);
  }

  handleReset = () => {
    clearTimeout(this._autoRecoverTimer);
    this.setState({ hasError: false });
  };

  handleGoHome = () => {
    clearTimeout(this._autoRecoverTimer);
    this.setState({ hasError: false });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-white to-orange-50 px-6 text-center">
          <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full border border-orange-100">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-600">
              <svg className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h1>
            <p className="text-gray-500 mb-8">Don't worry — no data was lost. Please try again.</p>
            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3.5 font-semibold text-white shadow-md hover:shadow-lg transition-all"
              >
                Try Again
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
