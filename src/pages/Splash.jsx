import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useSpeech } from "../context/SpeechContext";
import { useVoicePage } from "../hooks/useVoicePage";
import { guidanceText } from "../voice/guidanceCopy";
import { useHealth } from "../context/HealthContext";
import CampusLeaderboard from "../components/CampusLeaderboard";
import { AnimatePresence } from "framer-motion";
import { API_BASE } from "../config/api";
import i18n from "i18next";

const Splash = () => {
  const navigate = useNavigate();
  const { stop, speakText } = useSpeech();
  const { resetHealth, update, data: healthData } = useHealth();
  
  const [showTerms, setShowTerms] = useState(false);
  const [disagreed, setDisagreed] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const disagreedRef = useRef(false);

  const handleOpenTerms = useCallback(() => {
    setShowTerms(true);
  }, []);

  const handleCloseTerms = useCallback(() => {
    setShowTerms(false);
  }, []);

  const handleDisagree = useCallback(() => {
    setDisagreed(true);
    disagreedRef.current = true;
    setErrorMessage("You must agree to the Terms & Conditions to proceed.");
    setShowTerms(false);
  }, []);

  const handleAgree = useCallback(() => {
    setDisagreed(false);
    disagreedRef.current = false;
    setErrorMessage("");
    setShowTerms(false);
  }, []);

  const handleLanguageSelect = useCallback((langCode) => {
    if (disagreedRef.current) {
      setErrorMessage("You must agree to the Terms & Conditions to proceed.");
      return false;
    }
    setErrorMessage("");
    i18n.changeLanguage(langCode);
    localStorage.setItem("appLanguage", langCode);
    update({ language: langCode });
    navigate("/customer-details");
    return true;
  }, [navigate, update]);

  // Best-effort cancel of prior unpaid payment request when customer starts new journey
  const cancelStalePaymentSession = useCallback(() => {
    try {
      const oldSessionId = localStorage.getItem("reliv_session_id") || sessionStorage.getItem("reliv_session_id");
      if (oldSessionId && oldSessionId.startsWith("KSK-")) {
        fetch(`${API_BASE}/api/sessions/${encodeURIComponent(oldSessionId)}/payment-v2/cancel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }).catch(() => {});
      }
    } catch {
      // Ignore errors silently
    }
  }, []);

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const lbCycleRef = useRef(null);
  const lbHideTimer = useRef(null);

  const hideLeaderboard = useCallback(() => {
    clearTimeout(lbHideTimer.current);
    stop();
    setShowLeaderboard(false);
  }, [stop]);

  const showLeaderboardOverlay = useCallback(() => {
    stop();
    setShowLeaderboard(true);
    clearTimeout(lbHideTimer.current);
    lbHideTimer.current = setTimeout(hideLeaderboard, 20000);
  }, [hideLeaderboard, stop]);

  const handleLeaderboardVisible = useCallback(() => {
    speakText(guidanceText('language', healthData?.language));
  }, [speakText, healthData?.language]);

  // Reset any stale customer session on home/splash mount
  // But preserve the selected UI language so going back doesn't look weird
  useEffect(() => {
    cancelStalePaymentSession();
    const savedLang = localStorage.getItem("appLanguage");
    resetHealth();
    // Force backend ASR to Auto for new session
    update({ language: 'auto' });
    // Restore UI language
    if (savedLang) {
      i18n.changeLanguage(savedLang);
    }
  }, []);

  useVoicePage({
    guidanceKey: showTerms ? 'terms' : 'language',
    idleEnabled: !showLeaderboard,
    onHelp: () => {
      if (showLeaderboard) hideLeaderboard();
      speakText(guidanceText(showTerms ? 'terms' : 'language', healthData?.language));
    },
  });

  // The shared idle coordinator owns repeats; welcome/promotional timers must
  // not interrupt help requests or instructions while a customer is touching.
  useEffect(() => {
    const timer = setTimeout(() => speakText(guidanceText('language', healthData?.language)), 500);
    return () => { clearTimeout(timer); stop(); };
  }, [speakText, stop, healthData?.language]);

  // Leaderboard rotation: show after 45s, then every 45s for 20s
  useEffect(() => {
    const firstShow = setTimeout(showLeaderboardOverlay, 45000);
    lbCycleRef.current = setInterval(showLeaderboardOverlay, 65000); // 45s wait + 20s show = 65s cycle

    return () => {
      clearTimeout(firstShow);
      clearTimeout(lbHideTimer.current);
      clearInterval(lbCycleRef.current);
    };
  }, [showLeaderboardOverlay]);

  const [sliding, setSliding] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  // Phase: 0=hidden, 1="Relief & Relive" fading in, 2=fading out, 3="Health Checkup & Medicine Dispenser" fading in
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    let t1, t2;
    const timer = setTimeout(() => {
      setSliding(true);
      setTextVisible(true);
      setPhase(1);
      
      t1 = setTimeout(() => setPhase(2), 2500); // fade out first phrase
      t2 = setTimeout(() => setPhase(3), 3000); // fade in second phrase
    }, 20);
    return () => {
      clearTimeout(timer);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <>
      {/* Leaderboard rotation overlay — tap anywhere to dismiss instantly */}
      <AnimatePresence>
        {showLeaderboard && (
          <div
            onClick={() => {
              hideLeaderboard();
            }}
            style={{
              position: "fixed", inset: 0, zIndex: 9999,
              cursor: "pointer", background: "transparent",
            }}
          >
            <CampusLeaderboard overlay={true} onVisible={handleLeaderboardVisible} />
          </div>
        )}
      </AnimatePresence>

      <div className="h-screen bg-gray-100 flex items-center justify-center font-sans overflow-y-auto scrollable-container">
        <div className="w-full min-h-screen relative overflow-hidden">

          {/* TOP WAVE */}
          <div
            className={`absolute top-0 left-0 w-full transform transition-transform duration-[2500ms] ease-in-out ${sliding ? "-translate-y-full" : "translate-y-0"
              }`}
          >
            <svg className="w-full h-[65vh]" viewBox="0 0 1440 500" preserveAspectRatio="none">
              <path
                fill="#F97316"
                d="M0,32 C200,120 500,0 720,32 C940,64 1200,120 1440,64 L1440,0 L0,0 Z"
              />
            </svg>
          </div>

          {/* CENTER LOGO & TEXT */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4">
            <h1
              className={`text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight transition-opacity duration-[2500ms] ease-in-out ${textVisible ? "opacity-100" : "opacity-0"
                }`}
            >
              <span className="text-orange-500">Re</span>
              <span className="text-black">
                l
                <span className="relative inline-block">
                  ı
                  <span
                    className="absolute left-1/2"
                    style={{
                      top: "0.123em",
                      transform: "translateX(-50%)",
                      width: "0.2em",
                      height: "0.2em",
                      backgroundColor: "#F97316",
                      borderRadius: "50%",
                    }}
                  />
                </span>
                v
              </span>
            </h1>

            <div className="relative mt-3 h-10 flex items-center justify-center w-full">
              <p
                className={`absolute whitespace-nowrap text-sm md:text-base lg:text-lg text-gray-700 italic text-center transition-opacity duration-500 ease-in-out ${
                  phase === 1 ? "opacity-100" : "opacity-0"
                }`}
              >
                Relief &amp; Relive
              </p>
              <p
                className={`absolute whitespace-nowrap text-sm md:text-base lg:text-lg text-gray-700 italic text-center transition-opacity duration-1000 ease-in-out ${
                  phase === 3 ? "opacity-100" : "opacity-0"
                }`}
              >
                Health Checkup &amp; Medicine Dispenser
              </p>
            </div>

          </div>

          {/* BOTTOM WAVE & FOOTER */}
          <div
            className={`absolute bottom-0 left-0 w-full transform transition-transform duration-[2500ms] ease-in-out z-20 ${sliding ? "translate-y-0" : "translate-y-full"
              }`}
          >
            <svg className="w-full h-[36vh] block" viewBox="0 0 1440 320" preserveAspectRatio="none">
              <path
                fill="#F97316"
                d="M0,224 C200,160 500,320 720,288 C940,256 1200,96 1440,128 L1440,320 L0,320 Z"
              />
            </svg>

            <div className="bg-orange-500 pt-4 pb-8 flex flex-col items-center px-4 -mt-1">
              {showTerms ? (
                <div className="bg-white rounded-2xl shadow-2xl max-h-[75vh] overflow-y-auto w-11/12 md:w-3/4 lg:w-1/2 relative">
                  <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl md:text-3xl font-bold text-orange-600">
                        Reliv – Terms & Conditions
                      </h2>
                      <button
                        onClick={handleCloseTerms}
                        className="text-gray-400 hover:text-gray-600 text-2xl font-bold p-1.5 rounded-full hover:bg-gray-100 transition leading-none cursor-pointer"
                        title="Close (Skip)"
                        aria-label="Close"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="text-gray-700 text-sm md:text-base space-y-5 leading-relaxed">
                      <p>
                        Reliv is a personalized health screening and medicine dispensing platform designed to assist users in monitoring health metrics and accessing medication conveniently.
                      </p>

                      <p>
                        <strong>Medical Disclaimer:</strong> Reliv does not replace professional medical advice, diagnosis, or treatment. All health insights, recommendations, and dispensed medications are for informational and supportive purposes only. Always consult a qualified healthcare professional for medical concerns.
                      </p>

                      <p>
                        <strong>User Responsibility:</strong> You are solely responsible for the accuracy of personal and medical information provided. Incorrect inputs may lead to inaccurate results or inappropriate medication dispensing.
                      </p>

                      <p className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg">
                        <strong>⚠️ Important - Credential Consistency:</strong> Please enter the same credentials (name, email, age, gender) each time you use Reliv. This allows our system to recognize you, track your health history, and provide personalized reports with progressive insights based on your scan history.
                      </p>

                      <p>
                        <strong>Medication Use:</strong> Dispensed medications must be used strictly as per labeled instructions and medical guidelines. Reliv is not liable for misuse, overdose, allergic reactions, or adverse effects resulting from improper use.
                      </p>

                      <p>
                        <strong>Age Restriction:</strong> This application is intended for users aged 13 and above. Users under 13 must have parental or guardian supervision.
                      </p>

                      <p>
                        <strong>Data Privacy & Security:</strong> Your health and personal data are processed securely and in compliance with applicable privacy laws (including GDPR/HIPAA where relevant). We do not share your data with third parties without explicit consent, except as required by law.
                      </p>

                      <p>
                        <strong>Service Availability:</strong> Reliv does not guarantee uninterrupted access. We may suspend or restrict access for maintenance, updates, or unforeseen issues.
                      </p>

                      <p>
                        <strong>Limitation of Liability:</strong> To the fullest extent permitted by law, Reliv and its operators shall not be liable for any direct, indirect, or consequential damages arising from use of the platform.
                      </p>

                      <p className="font-semibold">
                        By agreeing, you confirm that you have read, understood, and accept these Terms & Conditions.
                      </p>
                    </div>

                    <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                      <button
                        onClick={handleDisagree}
                        className="bg-gray-400 hover:bg-red-600 text-white font-semibold py-3 px-8 rounded-xl transition shadow-md cursor-pointer"
                      >
                        Disagree
                      </button>
                      <button
                        onClick={handleAgree}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-xl transition shadow-lg cursor-pointer"
                      >
                        I Agree & Continue
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {errorMessage && (
                    <div className="mb-4 px-6 py-2.5 bg-red-100 border border-red-500 text-red-700 font-semibold rounded-xl shadow-md text-center text-sm md:text-base animate-pulse flex items-center gap-2 justify-center">
                      <span>⚠️</span>
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <p className="text-white text-center text-sm md:text-base mb-4 max-w-xl leading-relaxed">
                    By continuing, you agree to Reliv's{" "}
                    <span
                      onClick={handleOpenTerms}
                      className="font-bold underline cursor-pointer hover:text-orange-200 transition"
                    >
                      Terms & Conditions
                    </span>
                    .
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                    <button
                      onClick={() => handleLanguageSelect('en')}
                      className={`bg-white text-orange-600 font-bold text-lg py-3 px-8 rounded-xl shadow-xl hover:shadow-2xl hover:bg-gray-50 transition transform hover:scale-105 border-2 border-orange-200 ${
                        disagreed ? "opacity-75" : ""
                      }`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => handleLanguageSelect('hi')}
                      className={`bg-white text-orange-600 font-bold text-lg py-3 px-8 rounded-xl shadow-xl hover:shadow-2xl hover:bg-gray-50 transition transform hover:scale-105 border-2 border-orange-200 ${
                        disagreed ? "opacity-75" : ""
                      }`}
                    >
                      हिन्दी
                    </button>
                    <button
                      onClick={() => handleLanguageSelect('bn')}
                      className={`bg-white text-orange-600 font-bold text-lg py-3 px-8 rounded-xl shadow-xl hover:shadow-2xl hover:bg-gray-50 transition transform hover:scale-105 border-2 border-orange-200 ${
                        disagreed ? "opacity-75" : ""
                      }`}
                    >
                      বাংলা
                    </button>
                  </div>

                  {/* Optional Team Link */}
                  <p className="text-white text-center text-sm mt-6 opacity-75">
                    <span
                      onClick={() => navigate('/team')}
                      className="cursor-pointer hover:underline hover:opacity-100 transition"
                    >
                      About Our Team
                    </span>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Splash;
