import React, { createContext, useContext, useEffect, useState } from "react";
import { API_BASE } from "../config/api";

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
};

const HealthContext = createContext();

export function HealthProvider({ children }) {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem("healthData");
      if (!saved) return defaultData;
      const parsed = JSON.parse(saved);
      // Validate critical structure; merge with defaults if shape is wrong
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
      if (data.sessionId) {
        localStorage.setItem("reliv_session_id", data.sessionId);
      }
    } catch (e) {}
  }, [data]);

  useEffect(() => {
    if (!data.patient?.email) return;
    const email = data.patient.email;
    fetch(`${API_BASE}/api/reports/history/${encodeURIComponent(email)}`)
      .then((res) => {
        if (!res.ok) throw new Error('History fetch failed');
        return res.json();
      })
      .then((history) => {
        setData((prev) => {
          const next = { ...prev, history: Array.isArray(history) ? history : [] };
          try {
            localStorage.setItem("healthData", JSON.stringify(next));
          } catch (e) {}
          return next;
        });
      })
      .catch(() => {});
  }, [data.patient?.email]);

  const update = (partial) => {
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
        if (next.sessionId) {
          localStorage.setItem("reliv_session_id", next.sessionId);
        }
      } catch (e) {}
      return next;
    });
  };

  const resetHealth = () => {
    try {
      localStorage.removeItem("healthData");
      localStorage.removeItem("reliv_session_id");
      sessionStorage.removeItem("reliv_session_id");
    } catch (e) {}
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
        const next = {
          ...prev,
          history: Array.isArray(history) ? history : [],
        };
        try {
          localStorage.setItem("healthData", JSON.stringify(next));
        } catch (e) {}
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

export const useHealth = () => useContext(HealthContext);