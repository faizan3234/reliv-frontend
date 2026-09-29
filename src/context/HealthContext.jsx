import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { API_BASE } from "../config/api";
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

  const resetHealth = useCallback(() => {
    try {
      localStorage.removeItem("healthData");
      clearKioskSession();
    } catch { /* Storage may be unavailable. */ }
    setData(defaultData);
  }, []);

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
    <HealthContext.Provider value={{ data, update, resetHealth, refreshHistory }}>
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
