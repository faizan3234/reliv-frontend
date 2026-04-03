import React, { createContext, useContext, useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

const defaultData = {
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
    } catch (e) {}
  }, [data]);

  useEffect(() => {
    if (!data.patient?.email) return;
    const email = data.patient.email;
    fetch(`${API_BASE}/api/reports/history/${encodeURIComponent(email)}`)
      .then((res) => res.json())
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
        patient: { ...prev.patient, ...(partial?.patient || {}) },
        vitals: { ...prev.vitals, ...(partial?.vitals || {}) },
      };
      try {
        localStorage.setItem("healthData", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const resetHealth = () => {
    try {
      localStorage.removeItem("healthData");
    } catch (e) {}
    setData(defaultData);
  };

  const refreshHistory = async () => {
    if (!data.patient?.email) return;
    try {
      const history = await fetch(
        `${API_BASE}/api/reports/history/${encodeURIComponent(data.patient.email)}`
      ).then((r) => r.json());
      setData((prev) => ({
        ...prev,
        history: Array.isArray(history) ? history : [],
      }));
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