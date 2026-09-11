import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Logo from "../components/Logo";
import PrimaryButton from "../components/PrimaryButton";
import { usePageSpeech, useSpeech } from "../context/SpeechContext";
import { useVoicePage } from "../hooks/useVoicePage";
import { Activity, Pill, ArrowLeft } from "lucide-react";
import { API_BASE } from "../config/api";
import { useHealth } from "../context/HealthContext";
import { dict } from "../config/TwoOptionsDict";
import { parseServiceChoice, containsPhrase } from "../voice/voicePageProfiles";
import { readKioskSession, clearKioskSession, isCurrentKioskSession } from "../utils/kioskSession";

export default function TwoOptions() {
  const navigate = useNavigate();
  const { t: trans } = useTranslation();
  const { data: healthData } = useHealth();
  const selectedLang = healthData?.language || 'en';
  
  usePageSpeech("two-options");
  const { speakText } = useSpeech();
  
  const [slideUp, setSlideUp] = useState(false);
  const [selectedOption, setSelectedOption] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const mountedRef = useRef(false);
  const requestRef = useRef(null);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestRef.current?.abort();
    };
  }, []);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setSlideUp(true), 20);
    return () => clearTimeout(timer);
  }, []);

  const t = useCallback((key) => {
    const entry = dict[key];
    if (!entry) return "";
    return entry[selectedLang] || entry['en'] || "";
  }, [selectedLang]);

  const selectServiceAndContinue = async (serviceType, destination) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError("");
    const controller = new AbortController();
    requestRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const session = readKioskSession();
      if (!session) {
        navigate("/customer-details", { replace: true });
        return;
      }
      const { sessionId, pairingToken } = session;

      const response = await fetch(
        `${API_BASE}/api/sessions/${encodeURIComponent(sessionId)}/service`,
        {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pairingToken,
            serviceType,
          }),
        }
      );

      const result = await response.json();
      if (!mountedRef.current || !isCurrentKioskSession(session)) return;

      if ([403, 404, 410].includes(response.status)) {
        clearKioskSession();
        navigate("/customer-details", { replace: true });
        return;
      }
      if (response.status === 409 || result?.alreadySelected) {
        // Safe transition or already selected service; proceed to destination without wiping session
        speakText(t(serviceType === 'MEDICINE' ? 'proceedMedicine' : 'proceedHealth'));
        navigate(destination);
        return;
      }
      if (!response.ok || !result?.ok) {
        throw new Error(
          result?.error || result?.message || "Unable to select service"
        );
      }
      speakText(t(serviceType === 'MEDICINE' ? 'proceedMedicine' : 'proceedHealth'));
      navigate(destination);
    } catch (error) {
      if (mountedRef.current) setSubmitError(error.name === "AbortError" ? "The kiosk is not responding. Please retry." : error.message);
    } finally {
      clearTimeout(timeout);
      requestRef.current = null;
      submittingRef.current = false;
      if (mountedRef.current) setIsSubmitting(false);
    }
  };

  const handleProceed = () => {
    if (selectedOption === "health-checkup") {
      selectServiceAndContinue(
        "HEALTH_CHECKUP",
        "/body-composition"
      );
    } else if (selectedOption === "medicine-dispensing") {
      selectServiceAndContinue(
        "MEDICINE",
        "/medicine-dispensing"
      );
    }
  };

  useVoicePage({
    expecting: "service",
    vocabularyHints: ['health', 'checkup', 'medicine', 'dispensing', 'dawai', 'check', 'haan', 'yes', 'no', 'nahi', 'switch', 'change', 'dusra', 'pehla', 'option 1', 'option 2'],
    onHelp: () => {
       speakText(t('idle12'));
    },
    onTranscript: (lowerText) => {
      if (submittingRef.current) return;

      // Spoken confirmation to proceed with currently highlighted option
      if (containsPhrase(lowerText, ['proceed', 'continue', 'next', 'aage', 'chalo', 'theek hai', 'haan', 'yes', 'done'])) {
        if (selectedOption) {
          handleProceed();
          return;
        }
      }

      // Spoken shifting / switching between the two options
      if (containsPhrase(lowerText, ['switch', 'change', 'shift', 'dusra', 'other', 'badlo', 'dusra option'])) {
        const nextOption = selectedOption === 'health-checkup' ? 'medicine-dispensing' : 'health-checkup';
        setSelectedOption(nextOption);
        speakText(t(nextOption === 'health-checkup' ? 'health_checkup' : 'medicine_dispensing'));
        return;
      }

      const service = parseServiceChoice(lowerText);
      if (service === "HEALTH_CHECKUP") {
        setSelectedOption("health-checkup");
        selectServiceAndContinue(service, "/body-composition");
      } else if (service === "MEDICINE") {
        setSelectedOption("medicine-dispensing");
        selectServiceAndContinue(service, "/medicine-dispensing");
      }
    },
    onIdle: (elapsedSeconds) => {
      if (elapsedSeconds === 4) {
         if (!submittingRef.current) {
             speakText(t('idle12'));
         }
      }
    }
  });

  return (
    <div className="min-h-screen h-full bg-slate-50 flex flex-col justify-between font-sans overflow-y-auto scrollable-container touch-pan-y overscroll-contain select-none pb-8">
      {/* Header */}
      <div className="bg-gradient-to-b from-orange-50 to-slate-50 pt-8 pb-4 flex items-center justify-between px-6 relative">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold shadow-sm active:scale-95 transition cursor-pointer"
          aria-label={trans("go_back") || "Back"}
        >
          <ArrowLeft size={16} className="text-orange-500" />
          <span>{trans("back") || "Back"}</span>
        </button>
        <Logo size="text-3xl" />
        <div className="w-16" />
      </div>

      {/* Main card */}
      <div
        className={`bg-white rounded-t-3xl shadow-xl border-t border-slate-200 px-6 sm:px-10 py-8 mt-auto transform transition-transform duration-500 ease-out max-w-xl mx-auto w-full ${
          slideUp ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            <span className="text-orange-500">{trans("great")}</span>{" "}
            {trans("how_can_we_help")}
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {trans("please_select_option")}
          </p>
        </div>

        {/* Big Touch Card Options */}
        <div className="space-y-4 mb-8">
          {/* Option 1: Health Checkup */}
          <div
            onClick={() => {
                if (submittingRef.current) return;
                setSelectedOption("health-checkup");
                selectServiceAndContinue("HEALTH_CHECKUP", "/body-composition");
            }}
            className={`p-5 rounded-2xl border-2 flex items-center gap-4 cursor-pointer transition-all active:scale-98 ${
              selectedOption === "health-checkup"
                ? "border-orange-500 bg-orange-50/80 shadow-md ring-4 ring-orange-500/10"
                : "border-slate-200 bg-white hover:border-orange-200 hover:bg-slate-50"
            }`}
          >
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                selectedOption === "health-checkup"
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/30"
                  : "bg-orange-100 text-orange-600"
              }`}
            >
              <Activity size={28} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900">
                {trans("health_checkup")}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                BP • SpO2 • Weight • Temp • Vision
              </p>
            </div>
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                selectedOption === "health-checkup"
                  ? "border-orange-500 bg-orange-500 text-white"
                  : "border-slate-300"
              }`}
            >
              {selectedOption === "health-checkup" && (
                <div className="w-2.5 h-2.5 bg-white rounded-full" />
              )}
            </div>
          </div>

          {/* Option 2: Medicine Dispensing */}
          <div
            onClick={() => {
                if (submittingRef.current) return;
                setSelectedOption("medicine-dispensing");
                selectServiceAndContinue("MEDICINE", "/medicine-dispensing");
            }}
            className={`p-5 rounded-2xl border-2 flex items-center gap-4 cursor-pointer transition-all active:scale-98 ${
              selectedOption === "medicine-dispensing"
                ? "border-orange-500 bg-orange-50/80 shadow-md ring-4 ring-orange-500/10"
                : "border-slate-200 bg-white hover:border-orange-200 hover:bg-slate-50"
            }`}
          >
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                selectedOption === "medicine-dispensing"
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/30"
                  : "bg-emerald-100 text-emerald-600"
              }`}
            >
              <Pill size={28} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900">
                {trans("medicine_dispensing")}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Instant campus first-aid &amp; wellness kits
              </p>
            </div>
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                selectedOption === "medicine-dispensing"
                  ? "border-orange-500 bg-orange-500 text-white"
                  : "border-slate-300"
              }`}
            >
              {selectedOption === "medicine-dispensing" && (
                <div className="w-2.5 h-2.5 bg-white rounded-full" />
              )}
            </div>
          </div>
        </div>

        {submitError && <p role="alert" className="mb-4 text-sm text-red-700">{submitError}</p>}
        {/* Proceed button */}
        <PrimaryButton
          className="w-full justify-center py-4 text-lg font-bold rounded-2xl"
          onClick={handleProceed}
          disabled={!selectedOption || isSubmitting}
        >
          {isSubmitting ? "..." : trans("proceed")}
        </PrimaryButton>
      </div>
    </div>
  );
}
