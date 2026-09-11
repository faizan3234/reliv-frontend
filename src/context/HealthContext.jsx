import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { API_BASE } from "../config/api";
import { clearKioskSession } from "../utils/kioskSession";

// eslint-disable-next-line react-refresh/only-export-components
export const MOCK_TEST_REPORT = {
  sessionId: "KSK-DEMO-2026",
  patient: {
    name: "Rahul Sen",
    age: "23",
    email: "rahul.sen@campus.edu",
    phone: "9876543210",
    gender: "male",
  },
  vitals: {
    systolic: 118,
    diastolic: 76,
    oxygen: 99,
    bpm: 72,
    temperature: 98.4,
    leftEye: "6/6",
    rightEye: "6/6",
    weight: 68.5,
    height: 175.0,
    impedance: 485,
    bodyFat: 16.2,
    visceralFat: 4,
    muscleMass: 54.8,
    bodyWater: 61.2,
    boneMass: 3.1,
    bmr: 1680,
    metabolicAge: 21,
    skeletalMuscle: 34.2,
    ffmi: 19.8,
    isAthlete: false,
  },
  history: [
    { date: "10 Aug", score: 82, weight: 70.0, systolic: 124, diastolic: 82, vitals: { weight: 70.0, height: 175.0, systolic: 124, diastolic: 82, oxygen: 98, bpm: 75, temperature: 98.6 } },
    { date: "18 Aug", score: 85, weight: 69.2, systolic: 120, diastolic: 78, vitals: { weight: 69.2, height: 175.0, systolic: 120, diastolic: 78, oxygen: 98, bpm: 74, temperature: 98.4 } },
    { date: "25 Aug", score: 89, weight: 68.5, systolic: 118, diastolic: 76, vitals: { weight: 68.5, height: 175.0, systolic: 118, diastolic: 76, oxygen: 99, bpm: 72, temperature: 98.4 } }
  ],
  ecoStats: {
    paperSavedSheets: 14,
    co2SavedGrams: 85
  },
  paymentVerified: true,
};

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
        history: Array.isArray(parsed.history) ? parsed.history : [],
      };
    } catch {
      return defaultData;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("healthData", JSON.stringify(data));
    } catch { /* Storage may be unavailable. */ }
  }, [data]);

  useEffect(() => {
    if (!data.patient?.email) return;
    const email = data.patient.email;
    let active = true;
    fetch(`${API_BASE}/api/reports/history/${encodeURIComponent(email)}`)
      .then((res) => {
        if (!res.ok) throw new Error('History fetch failed');
        return res.json();
      })
      .then((history) => {
        if (!active) return;
        setData((prev) => {
          if (prev.patient.email !== email) return prev;
          const next = { ...prev, history: Array.isArray(history) ? history : [] };
          try {
            localStorage.setItem("healthData", JSON.stringify(next));
          } catch { /* Storage may be unavailable. */ }
          return next;
        });
      })
      .catch(() => {});
    return () => { active = false; };
  }, [data.patient?.email]);

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
        localStorage.setItem("healthData", JSON.stringify(next));
        if (partial?.sessionId) {
          localStorage.setItem("reliv_session_id", next.sessionId);
        }
      } catch { /* Storage may be unavailable. */ }
      return next;
    });
  }, []);

  const loadMockReportData = () => {
    setData(MOCK_TEST_REPORT);
    try {
      localStorage.setItem("healthData", JSON.stringify(MOCK_TEST_REPORT));
      localStorage.setItem("reliv_session_id", MOCK_TEST_REPORT.sessionId);
    } catch { /* Storage may be unavailable. */ }
    return MOCK_TEST_REPORT;
  };

  const resetHealth = () => {
    try {
      localStorage.removeItem("healthData");
      clearKioskSession();
    } catch { /* Storage may be unavailable. */ }
    setData(defaultData);
  };

  const refreshHistory = async () => {
    if (!data.patient?.email) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/reports/history/${encodeURIComponent(data.patient.email)}`
      );
      if (!res.ok) throw new Error('History refresh failed');
      const history = await res.json();
      setData((prev) => {
        if (prev.patient.email !== data.patient.email) return prev;
        const next = {
          ...prev,
          history: Array.isArray(history) ? history : [],
        };
        try {
          localStorage.setItem("healthData", JSON.stringify(next));
        } catch { /* Storage may be unavailable. */ }
        return next;
      });
    } catch (e) {
      console.error("Failed to refresh history:", e);
    }
  };

  return (
    <HealthContext.Provider value={{ data, update, resetHealth, refreshHistory, loadMockReportData }}>
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
