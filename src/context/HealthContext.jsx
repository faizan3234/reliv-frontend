import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { clearKioskSession } from "../utils/kioskSession";

// Missing measurements must stay missing, never be replaced by a demo patient.
// eslint-disable-next-line react-refresh/only-export-components
export const EMPTY_REPORT = Object.freeze({ patient: Object.freeze({}), vitals: Object.freeze({}), history: Object.freeze([]) });

const defaultData = {
  sessionId: "",
  patient: {
    name: "",
    age: "",
    email: "",
    phone: "",
    gender: "",
  },
  vitals: {
    systolic: "",
    diastolic: "",
    oxygen: "",
    bpm: "",
    temperature: "",
    leftEye: "",
    rightEye: "",
    weight: "",
    impedance: "",
    height: "",
    isAthlete: false,
    skeletalMuscle: null,
    ffmi: null,
    bmr: null,
    metabolicAge: null,
  },
  history: [],
  ecoStats: null,
  paymentVerified: false,
};

const HealthContext = createContext();

export function HealthProvider({ children }) {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem("healthData");
      if (!saved) return defaultData;
      const parsed = JSON.parse(saved);
      if (
        !parsed ||
        typeof parsed !== "object" ||
        !parsed.patient ||
        typeof parsed.patient !== "object" ||
        !parsed.vitals ||
        typeof parsed.vitals !== "object"
      ) {
        return defaultData;
      }
      return {
        ...defaultData,
        ...parsed,
        sessionId: parsed.sessionId || localStorage.getItem("reliv_session_id") || "",
        patient: { ...defaultData.patient, ...parsed.patient },
        vitals: { ...defaultData.vitals, ...parsed.vitals },
        // Private historical readings live only in memory during this visit.
        history: [],
      };
    } catch {
      return defaultData;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("healthData", JSON.stringify({ ...data, history: [] }));
    } catch { /* Storage may be unavailable. */ }
  }, [data]);

  const update = useCallback((partial) => {
    setData((prev) => {
      const next = {
        ...prev,
        ...(partial || {}),
        sessionId: partial?.sessionId !== undefined ? partial.sessionId : (prev.sessionId || ""),
        patient: { ...prev.patient, ...(partial?.patient || {}) },
        vitals: { ...prev.vitals, ...(partial?.vitals || {}) },
      };
      try {
        localStorage.setItem("healthData", JSON.stringify({ ...next, history: [] }));
        if (partial?.sessionId) {
          localStorage.setItem("reliv_session_id", next.sessionId);
        }
      } catch { /* Storage may be unavailable. */ }
      return next;
    });
  }, []);

  const resetHealth = useCallback(() => {
    try {
      localStorage.removeItem("healthData");
      clearKioskSession();
    } catch { /* Storage may be unavailable. */ }
    setData(defaultData);
  }, []);

  // Only the authorized report endpoint may replace report identity/readings.
  const hydrateReport = useCallback((report) => {
    setData(prev => ({
      ...defaultData,
      language: prev.language,
      reportSpeechLanguage: prev.reportSpeechLanguage,
      ...report,
      patient: { ...defaultData.patient, ...report.patient },
      vitals: { ...defaultData.vitals, ...report.vitals },
      history: Array.isArray(report.history) ? report.history.map(row => ({ ...row, vitals: row.vitals || row })) : [],
    }));
  }, []);

  return (
    <HealthContext.Provider value={{ data, update, resetHealth, hydrateReport }}>
      {children}
    </HealthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useHealth() {
  const context = useContext(HealthContext);
  if (!context) {
    throw new Error("useHealth must be used within a HealthProvider");
  }
  return context;
}
