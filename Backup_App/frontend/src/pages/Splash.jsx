import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import logo from "../assets/relivlogo.jpeg";

const Splash = () => {
  const navigate = useNavigate();
  const [sliding, setSliding] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [hasOpenedTerms, setHasOpenedTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSliding(true);
      setTextVisible(true);
    }, 20);
    return () => clearTimeout(timer);
  }, []);

  const handleProceed = () => {
    if (hasOpenedTerms && !agreed) {
      setErrorMessage("Please agree to the Terms & Conditions to proceed.");
      return;
      return;
    }
    navigate("/choose-language");
  };

  const handleOpenTerms = () => {
    setShowTerms(true);
    setHasOpenedTerms(true); // Once opened, agreement becomes mandatory
  };

  const handleDisagree = () => {
    setAgreed(false);
    setShowTerms(false);
  };

  const handleAgree = () => {
    setAgreed(true);
    setShowTerms(false);
  };

  return (
    <div className="h-screen bg-gray-100 flex items-center justify-center font-sans overflow-y-auto scrollable-container">
      <div className="w-full min-h-screen relative overflow-hidden">

        {/* TOP WAVE */}
        <div
          className={`absolute top-0 left-0 w-full transform transition-transform duration-[2500ms] ease-in-out ${
            sliding ? "-translate-y-full" : "translate-y-0"
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
            className={`text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight transition-opacity duration-[2500ms] ease-in-out ${
              textVisible ? "opacity-100" : "opacity-0"
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
         -   </span>
          </h1>

          <p
            className={`mt-4 text-base md:text-lg lg:text-xl text-gray-700 italic text-center max-w-2xl transition-opacity duration-[2500ms] ease-in-out ${
              textVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            Your Personalized Health Checkup & Medicine Dispenser
          </p>
          
          {/* Error Message */}
          {errorMessage && (
            <div className="mt-4 px-6 py-3 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-md animate-pulse">
              {errorMessage}
            </div>
          )}
        </div>

        {/* BOTTOM WAVE & FOOTER */}
        <div
          className={`absolute bottom-0 left-0 w-full transform transition-transform duration-[2500ms] ease-in-out z-20 ${
            sliding ? "translate-y-0" : "translate-y-full"
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
              <div className="bg-white rounded-2xl shadow-2xl max-h-[75vh] overflow-y-auto w-11/12 md:w-3/4 lg:w-1/2">
                <div className="p-8">
                  <div className="flex justify-center mb-6">
                    <img src={logo} alt="Reliv Logo" className="w-32 h-32 rounded-full shadow-lg" />
                  </div>

                  <h2 className="text-3xl font-bold text-center text-orange-600 mb-8">
                    Reliv – Terms & Conditions
                  </h2>

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
                      className="bg-gray-400 hover:bg-gray-500 text-white font-medium py-3 px-8 rounded-xl transition"
                    >
                      Disagree
                    </button>
                    <button
                      onClick={handleAgree}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-8 rounded-xl transition shadow-lg"
                    >
                      I Agree & Continue
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
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

                <button
                  onClick={handleProceed}
                  className="bg-white text-orange-600 font-semibold text-base py-3 px-8 rounded-xl shadow-xl hover:shadow-2xl hover:bg-gray-50 transition transform hover:scale-105"
                >
                  Let's find your best option →
                </button>

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
  );
};

export default Splash;
