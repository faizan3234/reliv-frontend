// src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
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

// Import your new Report pages
import Report1 from "./pages/Report1.jsx";
import Report2 from "./pages/Report2.jsx";
import Report3 from "./pages/Report3.jsx";
import Report4 from "./pages/Report4.jsx";
import Report5 from "./pages/Report5.jsx";
import Team from "./pages/Team.jsx";
import WellnessRecommendations from "./pages/WellnessRecommendations.jsx";
import MobileEntry from "./pages/MobileEntry.jsx";
import MobileEntryGateway from "./pages/MobileEntryGateway.jsx";

export default function App() {
    const isMedicineDispensingEnabled = localStorage.getItem('reliv_medicine_dispensing_enabled') !== 'false';

    // If accessed from the QR domain, only allow /h and /mobile-entry routes
    const isQRDomain = window.location.hostname === 'mail-request-m33c.vercel.app';

    if (isQRDomain) {
      return (
        <Routes>
          <Route path="/h" element={<MobileEntryGateway />} />
          <Route path="/mobile-entry" element={<MobileEntry />} />
          {/* Everything else → Session Expired (MobileEntryGateway with no token) */}
          <Route path="*" element={<MobileEntryGateway />} />
        </Routes>
      );
    }

    // Normal kiosk app (reliv-frontend-henna.vercel.app)
    return (
      <>
        <KioskGuardian />
        <KioskSafetyManager />
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
          <Route path="/body-temperature" element={<BodyTemperature />} />
          <Route path="/eyesight" element={<EyeSight />} />
          <Route path="/body-composition" element={<BodyComposition />} />
          <Route path="/report-1" element={<Report1 />} />
          <Route path="/report-2" element={<Report2 />} />
          <Route path="/report-3" element={<Report3 />} />
          <Route path="/report-4" element={<Report4 />} />
          <Route path="/report-5" element={<Report5 />} />
          <Route path="/wellness-recommendations" element={<WellnessRecommendations />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/team" element={<Team />} />
          <Route path="/mobile-entry" element={<MobileEntry />} />
          <Route path="/h" element={<MobileEntryGateway />} />
        </Routes>
      </>
    );
}