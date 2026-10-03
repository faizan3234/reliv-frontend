import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./mobile.css";
import MobileEntryGateway from "../../src/pages/MobileEntryGateway.jsx";
import WifiSettings from "../../src/pages/WifiSettings.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/wifi" element={<WifiSettings />} />
        <Route path="/:path" element={<MobileEntryGateway />} />
        <Route path="*" element={<MobileEntryGateway />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
