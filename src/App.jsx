import React, { lazy, Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { isPhoneExperience } from './utils/phoneExperience';

// Advertisers do not download report charts, MQTT or kiosk screens to book an ad.
const KioskApp = lazy(() => import('./KioskApp'));
const Advertise = lazy(() => import('./pages/Advertise'));
const PayAd = lazy(() => import('./pages/PayAd'));
const MobileEntry = lazy(() => import('./pages/MobileEntry'));
const PhotoUpload = lazy(() => import('./pages/PhotoUpload'));
const MobileEntryGateway = lazy(() => import('./pages/MobileEntryGateway'));
const WifiSettings = lazy(() => import('./pages/WifiSettings'));

export default function App() {
  const { pathname } = useLocation();
  return <Suspense fallback={<div role="status" className="min-h-screen flex items-center justify-center bg-white text-slate-700">Loading Reliv…</div>}>
    {!isPhoneExperience(pathname) ? <KioskApp /> : <div className="app-screen phone-screen">
    <Routes>
      <Route path="/advertise" element={<Advertise />} />
      <Route path="/pay" element={<PayAd />} />
      <Route path="/mobile-entry" element={<MobileEntry />} />
      <Route path="/photo-upload" element={<PhotoUpload />} />
      <Route path="/wifi" element={<WifiSettings />} />
      <Route path="*" element={<MobileEntryGateway />} />
    </Routes>
  </div>}
  </Suspense>;
}
