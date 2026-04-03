import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next"; // Import translation hook
import Logo from "../components/Logo";
import PrimaryButton from "../components/PrimaryButton";

export default function TwoOptions() {
  const navigate = useNavigate();
  const { t } = useTranslation(); // Access translation function
  const [slideUp, setSlideUp] = useState(false);
  const [selectedOption, setSelectedOption] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setSlideUp(true), 20);
    return () => clearTimeout(timer);
  }, []);

  const handleProceed = () => {
    if (selectedOption === "health-checkup") {
      navigate("/health-checkup");
    } else if (selectedOption === "medicine-dispensing") {
      navigate("/medicine-dispensing");
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col font-sans overflow-y-auto scrollable-container">
      {/* Header */}
      <div className="bg-gradient-to-b from-orange-50 to-white pt-10 pb-6 flex items-center justify-center relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl"
          aria-label={t("go_back")}
        >
          ←
        </button>
        <Logo size="text-3xl" />
      </div>

      {/* Sliding card */}
      <div
        className={`bg-white rounded-t-3xl shadow-lg px-6 py-8 mt-auto transform transition-transform duration-700 ease-out ${
          slideUp ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <h2 className="text-2xl font-semibold mb-2 text-center">
          <span className="text-orange-500">{t("great")}</span>{" "}
          {t("how_can_we_help")}
        </h2>
        <p className="text-gray-500 mb-8 text-center">
          {t("please_select_option")}
        </p>

        {/* Radio button options */}
        <div className="space-y-4 mb-8">
          <label
            className={`flex items-center p-4 border rou            className={`flex items-center p-5 border-2 rounded-xl cursor-pointer transition-all ${
              selectedOption === "health-checkup"
                ? "border-orange-500 bg-orange-50 shadow-md"
                : "border-gray-300"
            }`}
          >
            <input
              type="radio"
              name="service-option"
              value="health-checkup"
              checked={selectedOption === "health-checkup"}
              onChange={(e) => setSelectedOption(e.target.value)}
              className="h-6 w-6 text-orange-600 focus:ring-orange-500"
            />
            <span className="ml-3 text-lg font-medium">
              {t("health_checkup")}
            </span>
          </label>
          <label
            className={`flex items-center p-5 border-2 rounded-xl cursor-pointer transition-all ${
              selectedOption === "medicine-dispensing"
                ? "border-orange-500 bg-orange-50 shadow-md"
                : "border-gray-300"
            }`}
          >
            <input
              type="radio"
              name="service-option"
              value="medicine-dispensing"
              checked={selectedOption === "medicine-dispensing"}
              onChange={(e) => setSelectedOption(e.target.value)}
              className="h-6 w-6 text-orange-600 focus:ring-orange-500"
            />
            <span className="ml-3 text-lg font-medium">
div>

        {/* Proceed button */}
        <PrimaryButton
          className="w-full justify-center"
          onClick={handleProceed}
          disabled={!selectedOption}
        >
          {t("proceed")} 
        </PrimaryButton>
      </div>
    </div>
  );
}
