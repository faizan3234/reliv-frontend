import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import PrimaryButton from "../components/PrimaryButton";
import TopEllipseBackground from "../components/TopEllipseBackground";
import TemparatureGun from "../assets/TemparatureGun.mp4";
import { useHealth } from "../context/HealthContext";

const Splash = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="relative w-full h-screen bg-white overflow-y-auto scrollable-container font-sans">
      <button
        onClick={() => window.history.back()}
        className="absolute top-5 left-5 text-[22px] bg-transparent border-none cursor-pointer z-[3]"
        aria-label="back"
      >
        ←
      </button>

      <TopEllipseBackground color="#FFF1EA" height="60%" />

      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6">
        <div className="mb-6">
          <Logo />
        </div>

        <div className="max-w-xs text-center">
          <h2 className="text-[18px] font-normal leading-snug text-gray-800 mb-4">
            Now we’ll be checking your{" "}
            <span className="font-bold">Body Temperature</span>
          </h2>

          <h3 className="text-[28px] font-extrabold text-gray-900 mb-6">
            Let’s <span className="text-[#E85C25]">Get</span>
            <br />
            <span className="text-[#E85C25]">Started!</span>
          </h3>

          <p className="text-[14px] text-center leading-snug text-gray-700">
            Please <span className="text-[#E85C25]">follow</span> the steps
            <br />
            carefully that will be shown
          </p>
        </div>
      </div>
    </div>
  );
};

const BodyTemperaturePage = () => {
  const [temperatureF, setTemperatureF] = useState(null);
  const [status, setStatus] = useState("ready"); // ready, measuring, success
  // Removed connectionStatus since no MQTT; assume always connected for simulation
  const { update } = useHealth();
  const navigate = useNavigate();
  // Removed clientRef, intervalRef, timeoutRef as no MQTT

  // Removed useEffect for MQTT connection; no need for real device connection

  const startMeasurement = () => {
    // Simulate measurement without MQTT
    if (status === "ready") {
      setStatus("measuring");
      setTemperatureF(null);

      // Simulate delay for measurement (2-4 seconds random delay)
      const delay = Math.random() * 2000 + 2000; // Between 2000ms and 4000ms
      setTimeout(() => {
        // Generate random temperature between 97 and 100°F, with one decimal place
        const randomTemp = (Math.random() * (100 - 97) + 97).toFixed(1);
        const tempF = parseFloat(randomTemp);

        // Check if in valid range (as per original code, but adjusted for random)
        if (tempF >= 90 && tempF <= 110) {
          setTemperatureF(tempF);
          setStatus("success");
        } else {
          // Fallback retry (though unlikely with our random range)
          setStatus("ready");
        }
      }, delay);
    }
  };

  const handleProceed = () => {
    update({ vitals: { temperature: temperatureF } });
    navigate("/eyesight"); // Change to your actual next route
  };

  const canProceed = status === "success" && temperatureF !== null;

  // Removed isButtonDisabled based on connection; assume always enabled except during measuring
  const isButtonDisabled = status === "measuring";

  // Always show as connected since no real device
  const getConnectionDisplay = () => {
    return { icon: "🟢", text: "Device Connected", color: "text-green-600" };
  };

  const conn = getConnectionDisplay();

  return (
    <div className="relative w-full h-screen bg-white font-sans overflow-y-auto scrollable-container flex flex-col">
      <TopEllipseBackground color="#FFF1EA" height="50%" />

      <header className="relative z-10 flex items-center px-4 md:px-6 pt-4">
        <button
          onClick={() => window.history.back()}
          className="text-3xl text-gray-800"
          aria-label="back"
        >
          ←
        </button>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 md:px-6">
        <div className="w-full max-w-xs">
          <div className="flex justify-center mb-6">
            <Logo />
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mt-4 mb-3 text-center">
            Body Temperature
          </h2>

          <p className="text-base text-gray-700 mb-3 text-center">
            Point the thermometer at your forehead
          </p>

          <div className="text-center mb-5">
            <p className={`text-sm font-semibold ${conn.color} flex items-center justify-center gap-2`}>
              <span className="text-lg">{conn.icon}</span>
              {conn.text}
            </p>
          </div>

          <div className="flex justify-center mb-8">
            <div
              className={`relative w-64 h-64 rounded-full flex flex-col items-center justify-center shadow-xl border-8 transition-all duration-700
                ${status === "success"
                  ? "bg-gradient-to-br from-orange-500 to-red-600 border-orange-400"
                  : status === "measuring"
                  ? "bg-gradient-to-br from-yellow-400 to-orange-500 border-yellow-300 animate-subtlePulse"
                  : "bg-gradient-to-br from-gray-200 to-gray-300 border-gray-300"
                }`}
            >
              {status === "measuring" && (
                <div className="absolute inset-0 rounded-full bg-white opacity-20 animate-ping"></div>
              )}

              {status === "ready" && (
                <div className="text-center text-gray-600">
                  <div className="text-6xl mb-3">🌡️</div>
                  <p className="text-lg font-medium">Aim at Forehead</p>
                </div>
              )}

              {status === "measuring" && (
                <div className="text-white text-center">
                  <div className="text-5xl mb-4">🌡️</div>
                  <p className="text-xl font-semibold">Measuring...</p>
                  <p className="text-sm mt-2 opacity-90">Hold still</p>
                </div>
              )}

              {status === "success" && (
                <div className="text-white text-center px-4">
                  <div className="text-6xl font-black leading-tight">
                    {temperatureF}°F
                  </div>
                  <p className="text-xl font-bold mt-4 opacity-90">Body Temperature</p>
                </div>
              )}
            </div>
          </div>

          <div className="text-center mb-6">
            <button
              onClick={startMeasurement}
              disabled={isButtonDisabled}
              className={`w-full max-w-xs bg-orange-500 hover:bg-orange-600 transition-all duration-300 text-white font-bold px-8 py-2 rounded-lg shadow-lg text-[1.1rem] ${
                isButtonDisabled ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {status === "measuring" ? "Measuring..." : "Measure Temperature"}
            </button>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-md border border-orange-100">
            <h3 className="text-base font-bold text-gray-800 mb-3 text-center">
              📋 Important Instructions
            </h3>
            <ul className="text-sm text-gray-700 space-y-2 leading-relaxed">
              <li>• Keep forehead <strong>clean, dry, and uncovered</strong> (no hair, sweat, hats, or makeup)</li>
              <li>• Hold sensor <strong>1–2 cm away</strong> from forehead or clean hand</li>
              <li>• <strong>Hold still</strong> during measurement</li>
              <li>• If no reading appears, <strong>gently touch</strong> sensor to forehead</li>
              <li className="font-semibold text-orange-700">
                • Wait until valid temperature appears on screen
              </li>
              <li className="font-medium text-red-600 mt-3">
                ⚠️ Make sure device is connected before starting
              </li>
            </ul>
          </div>
        </div>
      </main>

      <footer className="relative z-10 px-4 md:px-6 pb-6 pt-4">
        <div className="w-full max-w-xs mx-auto">
          <div className="w-full h-28 mb-3">
            <video
              src={TemparatureGun}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-contain rounded-xl"
            />
          </div>

          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 bg-gray-300 rounded-full"></div>
              <div className="w-2.5 h-2.5 bg-gray-300 rounded-full"></div>
              <div className="w-2.5 h-2.5 bg-[#E85C25] rounded-full"></div>
              <div className="w-2.5 h-2.5 bg-gray-300 rounded-full"></div>
              <div className="w-2.5 h-2.5 bg-gray-300 rounded-full"></div>
              <span className="text-xs text-gray-500 ml-2">3/6 complete</span>
            </div>

            {canProceed && (
              <PrimaryButton
                onClick={handleProceed}
                className="w-full justify-center animate-fadeIn"
              >
                Proceed →
              </PrimaryButton>
            )}
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes subtlePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate-subtlePulse {
          animation: subtlePulse 2s ease-in-out infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

export default function BodyTemperature() {
  const [currentPage, setCurrentPage] = useState("splash");

  return (
    <>
      {currentPage === "splash" && <Splash onComplete={() => setCurrentPage("main")} />}
      {currentPage === "main" && <BodyTemperaturePage />}
    </>
  );
}