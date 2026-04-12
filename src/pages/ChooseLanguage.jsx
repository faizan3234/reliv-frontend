import React, { useEffect, useState } from "react";
import Logo from "../components/Logo";
import PrimaryButton from "../components/PrimaryButton";
import { useNavigate } from "react-router-dom";
import i18n from "i18next"; // Import i18n instance

export default function ChooseLanguage() {
  const navigate = useNavigate();
  const [slideUp, setSlideUp] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setSlideUp(true), 20);
    return () => clearTimeout(t);
  }, []);

  const handleLanguageSelect = (langCode) => {
    setSelectedLanguage(langCode);

    // Change language in i18next
    i18n.changeLanguage(langCode);

    // Save preference locally
    localStorage.setItem("appLanguage", langCode);
  };

  const handleProceed = () => {
    if (selectedLanguage) {
      navigate("/customer-details");
    }
  };

  // Language options with display labels & codes
  const languages = [
    { label: "English", code: "en" },
    { label: "हिन्दी", code: "hi" },
    { label: "বাংলা", code: "bn" },
  ];

  return (
    <div className="h-screen bg-white flex flex-col font-sans overflow-y-auto scrollable-container">
      {/* Top faded orange header area */}
      <div className="bg-gradient-to-b from-orange-50 to-white pt-[100px] pb-6 flex flex-col items-center relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute left-4 top-4 text-3xl text-gray-700 hover:text-orange-500"
          aria-label="Go back"
        >
          ←
        </button>
        <Logo size="text-3xl" />
        <p className="mt-3 text-gray-600">A couple of questions to start</p>
      </div>

      {/* Sliding card */}
      <div
        className={`mt-auto transform transition-transform duration-700 ease-out ${
          slideUp ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="bg-white rounded-t-3xl shadow-2xl border border-gray-300 px-6 py-8">
          <h2 className="text-base font-semibold mb-6">Choose your language</h2>

          {/* Language options */}
          <div className="space-y-4 mb-6">
            {languages.map(({ label, code }) => (
              <button
                key={code}
                onClick={() => handleLanguageSelect(code)}
                className={`w-full border-2 rounded-xl py-4 text-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all ${
                  selectedLanguage === code
                    ? "border-orange-500 bg-orange-50 shadow-md"
                    : "border-gray-300"
                }`}
              >
                {selectedLanguage === code && <span className="mr-2">✓</span>}
                {label}
              </button>
            ))}
          </div>

          {/* Proceed button */}
          <PrimaryButton
            className="w-full justify-center"
            onClick={handleProceed}
            disabled={!selectedLanguage}
          >
            Proceed →
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
