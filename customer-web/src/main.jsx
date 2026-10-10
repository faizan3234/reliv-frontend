import { StartupBoundary, StartupReady } from './components/StartupBoundary';
import { startPwaUpdates } from './services/pwaRuntime';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StartupBoundary><StartupReady><App /></StartupReady></StartupBoundary>
  </React.StrictMode>
);

if (import.meta.env.PROD) startPwaUpdates();
