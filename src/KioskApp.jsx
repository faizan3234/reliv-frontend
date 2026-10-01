// src/App.jsx
import React, { useEffect } from "react";
import { Navigate, Routes, Route } from "react-router-dom";
import Splash from "./pages/Splash.jsx";
import ChooseLanguage from "./pages/ChooseLanguage.jsx";
import CustomerDetailsWrapper from "./pages/CustomerDetails.jsx";
import TwoOptions from "./pages/TwoOptions.jsx";
import HealthCheckup from "./pages/HealthCheckup.jsx";
import MedicineDispensing from "./pages/MedicineDispensing.jsx";
import EyeSight from "./pages/EyeSight.jsx";
import PaymentGate from "./pages/PaymentGate.jsx";
import OxygenPulse from "./pages/OxygenPulse.jsx";
import BodyTemperature from "./pages/BodyTemperature.jsx";
import Checkout from "./pages/Checkout.jsx";
import OrderSuccess from "./pages/OrderSuccess.jsx";
import BodyComposition from "./pages/BodyComposition.jsx";
import Feedback from "./pages/feedback.jsx";
import KioskGuardian from "./components/KioskGuardian.jsx";
import KioskSafetyManager from "./components/KioskSafetyManager.jsx";

import UnifiedReport from "./pages/UnifiedReport.jsx";
import Team from "./pages/Team.jsx";
import WellnessRecommendations from "./pages/WellnessRecommendations.jsx";
import MobileEntry from "./pages/MobileEntry.jsx";
import MobileEntryGateway from "./pages/MobileEntryGateway.jsx";
import SpeechAdmin from "./pages/SpeechAdmin.jsx";
import AdminMedicinePage from "./pages/AdminMedicinePage.jsx";
import SpeechControl from "./components/SpeechControl.jsx";
import PhotoUpload from "./pages/PhotoUpload.jsx";
import ProtectedReportRoute from "./components/ProtectedReportRoute";
import { VoiceAssistantProvider } from "./context/VoiceAssistantContext";
import VoiceAssistantOverlay from "./components/VoiceAssistantOverlay";
import KioskAdPlayer from "./components/KioskAdPlayer.jsx";
import { readBrowserStorage } from './utils/browserStorage';

export default function KioskApp() {
    const isMedicineDispensingEnabled = readBrowserStorage('reliv_medicine_dispensing_enabled') !== 'false';
    useEffect(() => {
      const links = [
        'https://fonts.cdnfonts.com/css/transcity',
        'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200'
      ].map(href => {
        const link = document.createElement('link');
        link.rel = 'stylesheet'; link.href = href; document.head.appendChild(link);
        return link;
      });
      return () => links.forEach(link => link.remove());
    }, []);


    // Normal kiosk app (reliv-frontend-henna.vercel.app)
    return (
      <VoiceAssistantProvider>
        <div className="app-screen">
          <KioskAdPlayer />
          <KioskGuardian />
          <KioskSafetyManager />
          <SpeechControl />
          <VoiceAssistantOverlay />
          <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/choose-language" element={<ChooseLanguage />} />
          <Route path="/customer-details" element={<CustomerDetailsWrapper />} />
          <Route path="/two-options" element={<TwoOptions />} />
          <Route path="/health-checkup" element={<HealthCheckup />} />
          {isMedicineDispensingEnabled && (
            <Route path="/medicine-dispensing" element={<MedicineDispensing />} />
          )}
          <Route path="/payment" element={<PaymentGate />} />
          <Route path="/oxygen-pulse" element={<OxygenPulse />} />
          <Route path="/eyesight" element={<EyeSight />} />
          <Route path="/body-temperature" element={<BodyTemperature />} />
          <Route path="/body-composition" element={<BodyComposition />} />
          <Route
            path="/report-1"
            element={
              <ProtectedReportRoute>
                <UnifiedReport />
              </ProtectedReportRoute>
            }
          />
          <Route
            path="/report-2"
            element={
              <ProtectedReportRoute>
                <UnifiedReport />
              </ProtectedReportRoute>
            }
          />
          <Route
            path="/report-3"
            element={
              <ProtectedReportRoute>
                <UnifiedReport />
              </ProtectedReportRoute>
            }
          />
          <Route
            path="/report-4"
            element={
              <ProtectedReportRoute>
                <UnifiedReport />
              </ProtectedReportRoute>
            }
          />
          <Route
            path="/report-5"
            element={
              <ProtectedReportRoute>
                <UnifiedReport />
              </ProtectedReportRoute>
            }
          />
          <Route path="/wellness-recommendations" element={<WellnessRecommendations />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/team" element={<Team />} />
          <Route path="/mobile-entry" element={<MobileEntry />} />
          <Route path="/h" element={<MobileEntryGateway />} />
          <Route path="/photo-upload" element={<PhotoUpload />} />
          <Route path="/admin" element={<AdminMedicinePage />} />
          <Route path="/admin-x7k9/speech" element={<SpeechAdmin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      </VoiceAssistantProvider>
    );
}
