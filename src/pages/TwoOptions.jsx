import React, { useEffect, useState, useCallback } from "react";
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

export default function TwoOptions() {
  const navigate = useNavigate();
  const { t: trans } = useTranslation();
  const { data: healthData } = useHealth();
  const selectedLang = healthData?.language || 'en';
  
  usePageSpeech("two-options");
  const { speak, speakText } = useSpeech();
  
  const [slideUp, setSlideUp] = useState(false);
  const [selectedOption, setSelectedOption] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voiceExpecting, setVoiceExpecting] = useState('selection'); // 'selection' or 'confirm'

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
    try {
      setIsSubmitting(true);
      const sessionId =
        localStorage.getItem("reliv_session_id") ||
        sessionStorage.getItem("reliv_session_id");

      const pairingToken =
        localStorage.getItem("reliv_pairing_token");

      if (!sessionId || !pairingToken) {
        console.error("Missing Reliv session or pairing token");
        return;
      }

      const response = await fetch(
        `${API_BASE}/api/sessions/${encodeURIComponent(sessionId)}/service`,
        {
          method: "POST",
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

      if (!response.ok || !result?.ok) {
        throw new Error(
          result?.message || "Unable to select service"
        );
      }
      navigate(destination);
    } catch (error) {
      console.error("[Reliv] Service selection failed:", error);
    } finally {
      setIsSubmitting(false);
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
    expecting: voiceExpecting,
    vocabularyHints: ['health', 'checkup', 'medicine', 'dispensing', 'dawai', 'check', 'haan', 'yes', 'no', 'nahi'],
    onHelp: () => {
       speakText(t('idle12'));
    },
    onTranscript: (lowerText) => {
        if (/(health|checkup|body|হেলথ|চেকআপ|স্বাস্থ্য|শরীর|हेल्थ|चेकअप|स्वास्थ्य|शरीर)/.test(lowerText)) {
          setSelectedOption('health-checkup');
          speakText(t("proceedHealth"));
          setTimeout(() => {
            selectServiceAndContinue("HEALTH_CHECKUP", "/body-composition");
          }, 800);
        } else if (/(medicine|dispenser|dawai|মেডিসিন|ওষুধ|দাওয়াই|ডিস্পেন্সার|मेडिसिन|दवाई|दवा|डिस्पेंसर)/.test(lowerText)) {
          setSelectedOption('medicine-dispensing');
          speakText(t("proceedMedicine"));
          setTimeout(() => {
            selectServiceAndContinue("MEDICINE", "/medicine-dispensing");
          }, 800);
        }
    },
    onIdle: (elapsedSeconds) => {
      if (elapsedSeconds === 4) {
         if (voiceExpecting === 'selection') {
             speakText(t('idle12'));
         }
      }
    }
  });

  return (
    <div className="h-screen bg-slate-50 flex flex-col justify-between font-sans overflow-y-auto scrollable-container select-none">
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
                setSelectedOption("health-checkup");
                speakText(t("proceedHealth"));
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
                setSelectedOption("medicine-dispensing");
                speakText(t("proceedMedicine"));
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
