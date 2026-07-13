import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import mqtt from "mqtt";
import Logo from "../components/Logo";
import TopEllipseBackground from "../components/TopEllipseBackground";
import SupportButton from "../components/SupportButton";
import { useHealth } from "../context/HealthContext";
import { sanitizeError } from "../utils/errorSanitizer";
import bpPicture from "../assets/bppicture.png";
import meditatingGirl from "../assets/MeditatingGirl.mp4";
import { useSpeech } from "../context/SpeechContext";

/**
 * Splash screen before BP page
 * - stays for 2s and then navigates to the BP input page
 */
const Splash = ({ onComplete }) => {
  useEffect(() => {
    const t = setTimeout(() => onComplete(), 2000);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <div className="relative w-full h-screen bg-white overflow-y-auto scrollable-container font-sans">
      <button
        className="absolute top-5 left-5 text-[22px] bg-transparent border-none cursor-pointer z-[3]"
        onClick={() => window.history.back()}
        aria-label="back"
      >
        ←
      </button>

      {/* Top ellipse background */}
      <TopEllipseBackground color="#FFF1EA" height="60%" />

      <div className="relative z-[10] h-full flex flex-col items-center justify-center px-6">
        <div className="mb-6">
          <Logo />
        </div>

        <div className="max-w-xs text-center">
          <h2 className="text-[18px] font-normal leading-snug text-gray-800 mb-4">
            Now we'll be checking your{" "}
            <span className="font-bold">Blood Pressure</span>
          </h2>

          <h3 className="text-[28px] font-extrabold text-gray-900 mb-6">
            Let's <span className="text-[#E85C25]">Get</span>
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

/**
 * Blood Pressure measurement page with MQTT integration
 * - Real-time MQTT connection to HiveMQ Cloud
 * - Subscribes to kiosk/status and kiosk/sensor/bp
 * - Publishes commands to kiosk/command
 * - No mock data - only real sensor measurements
 */
const BloodPressurePage = () => {
  const { stop: stopSpeech } = useSpeech();
  const [systolic, setSystolic] = useState(null);
  const [diastolic, setDiastolic] = useState(null);
  const [measurementState, setMeasurementState] = useState("idle"); // idle, measuring, completed, error
  const [countdown, setCountdown] = useState(120);
  const [showRetryScreen, setShowRetryScreen] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(10);
  const [statusMessage, setStatusMessage] = useState("Ready to begin measurement");
  const [deviceStatus, setDeviceStatus] = useState("Connecting...");
  const [isMqttConnected, setIsMqttConnected] = useState(false);
  const [isWifiConnected, setIsWifiConnected] = useState(false);
  const { data, update } = useHealth();
  
  const [autoProceeding, setAutoProceeding] = useState(false);

  const mqttClient = useRef(null);
  const measurementTimeout = useRef(null);
  const hasReceivedData = useRef(false);
  const wifiCheckInterval = useRef(null);
  const autoProceedTriggered = useRef(false);

  // Derived state: both must be connected
  const isFullyConnected = isMqttConnected && isWifiConnected;

  // WiFi connectivity check
  useEffect(() => {
    const checkWiFi = () => {
      if (navigator.onLine) {
        setIsWifiConnected(true);
      } else {
        setIsWifiConnected(false);
        setDeviceStatus("WiFi Disconnected");
      }
    };

    checkWiFi();
    window.addEventListener('online', () => {
      console.log("✅ WiFi Connected");
      setIsWifiConnected(true);
    });
    window.addEventListener('offline', () => {
      console.log("❌ WiFi Disconnected");
      setIsWifiConnected(false);
      setDeviceStatus("WiFi Disconnected");
    });

    wifiCheckInterval.current = setInterval(checkWiFi, 5000);

    return () => {
      window.removeEventListener('online', checkWiFi);
      window.removeEventListener('offline', checkWiFi);
      if (wifiCheckInterval.current) {
        clearInterval(wifiCheckInterval.current);
      }
    };
  }, []);

  // Update device status based on both connections
  useEffect(() => {
    if (isMqttConnected && isWifiConnected) {
      setDeviceStatus("Connected (Signal Strong)");
    } else if (!isWifiConnected && !isMqttConnected) {
      setDeviceStatus("WiFi & MQTT Disconnected");
    } else if (!isWifiConnected) {
      setDeviceStatus("WiFi Disconnected");
    } else if (!isMqttConnected) {
      setDeviceStatus("MQTT Disconnected");
    }
  }, [isMqttConnected, isWifiConnected]);

  // MQTT Connection Setup
  useEffect(() => {
    const connectMQTT = () => {
      const brokerUrl = import.meta.env.VITE_MQTT_BROKER;
      const username = import.meta.env.VITE_MQTT_USERNAME;
      const password = import.meta.env.VITE_MQTT_PASSWORD;

      // Validate env variables are present
      if (!brokerUrl || !username || !password || brokerUrl.includes("your-broker-id") || brokerUrl.includes("brokerid")) {
        console.error("❌ MQTT configuration missing or invalid. Check VITE_MQTT_BROKER, VITE_MQTT_USERNAME, VITE_MQTT_PASSWORD in .env");
        setDeviceStatus("Configuration Error");
        setStatusMessage("MQTT Configuration Error. Check .env file.");
        return;
      }

      const options = {
        username,
        password,
        clientId: `reliv_kiosk_bp_${Math.random().toString(16).slice(2, 8)}`,
        clean: true,
        reconnectPeriod: 5000,
        connectTimeout: 30000,
      };

      if (import.meta.env.DEV) console.log("🔌 Connecting to MQTT broker for BP...");
      try {
        mqttClient.current = mqtt.connect(brokerUrl, options);
      } catch (err) {
        console.error("❌ Failed to initialize MQTT connection:", err);
        setDeviceStatus("Configuration Error");
        setStatusMessage("MQTT Configuration Error. Check .env file.");
        return;
      }

      mqttClient.current.on("connect", () => {
        if (import.meta.env.DEV) console.log("✅ MQTT Connected for BP measurement");
        setIsMqttConnected(true);
        
        // Subscribe to BP sensor and status topics
        mqttClient.current.subscribe("kiosk/sensor/bp", { qos: 1 }, (err) => {
          if (err) {
            if (import.meta.env.DEV) console.error("❌ Failed to subscribe to kiosk/sensor/bp:", err);
          } else {
            if (import.meta.env.DEV) console.log("📡 Subscribed to kiosk/sensor/bp");
          }
        });

        mqttClient.current.subscribe("kiosk/status", { qos: 1 }, (err) => {
          if (err) {
            if (import.meta.env.DEV) console.error("❌ Failed to subscribe to kiosk/status:", err);
          } else {
            if (import.meta.env.DEV) console.log("📡 Subscribed to kiosk/status");
          }
        });
      });

      mqttClient.current.on("message", (topic, message) => {
        const payload = message.toString();
        if (import.meta.env.DEV) console.log(`📨 MQTT Message [${topic}]: ${payload}`);

        try {
          if (topic === "kiosk/sensor/bp") {
            // Expected format: {"systolic": 120, "diastolic": 80, "bpm": 72}
            const data = JSON.parse(payload);
            
            if (data.systolic && data.diastolic && data.bpm) {
              // Prevent duplicate data during same measurement
              if (hasReceivedData.current && measurementState === "measuring") {
                if (import.meta.env.DEV) console.log("⚠️ Duplicate BP data received, ignoring");
                return;
              }

              if (import.meta.env.DEV) console.log(`✅ BP Data Received: ${data.systolic}/${data.diastolic} mmHg, ${data.bpm} BPM`);
              
              // Check if values are abnormal
              if (isAbnormalBP(data.systolic, data.diastolic)) {
                console.log("⚠️ Abnormal BP values detected, showing retry screen");
                setShowRetryScreen(true);
                setRetryCountdown(10);
                setSystolic(null);
                setDiastolic(null);
                hasReceivedData.current = false;
                setMeasurementState("idle");
                
                // Start retry countdown
                let countdown = 10;
                const retryTimer = setInterval(() => {
                  countdown--;
                  setRetryCountdown(countdown);
                  if (countdown <= 0) {
                    clearInterval(retryTimer);
                    setShowRetryScreen(false);
                    setStatusMessage("Ready to begin measurement");
                  }
                }, 1000);
              } else {
                setSystolic(data.systolic);
                setDiastolic(data.diastolic);
                hasReceivedData.current = true;
                setMeasurementState("completed");
                setStatusMessage("Measurement complete!");
              }
              
              // Clear safety timeout
              if (measurementTimeout.current) {
                clearTimeout(measurementTimeout.current);
              }
            }
          } else if (topic === "kiosk/status") {
            // Handle status messages (errors, progress updates, etc.)
            setStatusMessage(sanitizeError(payload));
            
            if (payload.includes("Error") || payload.includes("Invalid")) {
              setMeasurementState("error");
            }
          }
        } catch (err) {
          console.error("❌ Error parsing MQTT message:", err);
        }
      });

      mqttClient.current.on("error", (err) => {
        console.error("❌ MQTT Connection Error:", err);
        setIsMqttConnected(false);
      });

      mqttClient.current.on("offline", () => {
        console.log("⚠️ MQTT Client Offline");
        setIsMqttConnected(false);
      });

      mqttClient.current.on("reconnect", () => {
        console.log("🔄 MQTT Reconnecting...");
      });
    };

    connectMQTT();

    return () => {
      if (mqttClient.current) {
        console.log("🔌 Disconnecting MQTT for BP...");
        mqttClient.current.end();
      }
      if (measurementTimeout.current) {
        clearTimeout(measurementTimeout.current);
      }
    };
  }, []);

  // Countdown timer for measurement
  useEffect(() => {
    let timer;
    if (measurementState === "measuring" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [measurementState, countdown]);

  // Start BP measurement
  const startMeasurement = () => {
    if (!isFullyConnected) {
      setStatusMessage("Cannot measure: WiFi or MQTT disconnected");
      return;
    }

    console.log("🩺 Starting BP measurement...");
    setMeasurementState("measuring");
    setCountdown(120);
    setSystolic(null);
    setDiastolic(null);
    hasReceivedData.current = false;
    setStatusMessage("Measuring blood pressure... Keep arm still and relaxed.");

    // Publish command to kiosk/command to trigger BP measurement (QoS 2 for exactly-once)
    if (mqttClient.current && mqttClient.current.connected) {
      mqttClient.current.publish("kiosk/command", "bp", { qos: 2 }, (err) => {
        if (err) {
          console.error("❌ Failed to publish BP command:", err);
        } else {
          console.log("📤 Published 'bp' command to kiosk/command (QoS 2)");
        }
      });
    }

    // Safety timeout: if no data received after 150 seconds (120 + 30 buffer), show error
    measurementTimeout.current = setTimeout(() => {
      if (!hasReceivedData.current) {
        console.log("⚠️ BP measurement timeout (150s)");
        setMeasurementState("error");
        setStatusMessage("Measurement timeout (150s). Please try again.");
      }
    }, 150000);
  };

  // Reset and try again (can be used for a reset button in the future)
  // eslint-disable-next-line no-unused-vars
  const resetMeasurement = () => {
    // Send stop command to all sensors via MQTT
    if (mqttClient.current && mqttClient.current.connected) {
      console.log('[BP] Sending STOP command to kiosk/command');
      mqttClient.current.publish('kiosk/command', 'stop', { qos: 2 }, (err) => {
        if (err) {
          console.error('[BP] Failed to send stop command:', err);
        } else {
          console.log('[BP] Stop command sent successfully (QoS 2)');
        }
      });
    }
    
    setMeasurementState("idle");
    setSystolic(null);
    setDiastolic(null);
    setCountdown(120);
    hasReceivedData.current = false;
    setStatusMessage("Ready to begin measurement");
  };

  const navigate = useNavigate();

  // ── Auto-proceed: save & navigate as soon as data arrives ──
  useEffect(() => {
    if (
      measurementState === "completed" &&
      systolic && diastolic &&
      !autoProceedTriggered.current
    ) {
      autoProceedTriggered.current = true;
      setAutoProceeding(true);
      setStatusMessage("✅ Data Recorded! Moving to next step...");
      stopSpeech();
      // Save to context immediately
      update({
        vitals: { ...data.vitals, systolic, diastolic },
      });
      // Navigate after brief delay so user sees confirmation
      const t = setTimeout(() => navigate("/oxygen-pulse"), 2000);
      return () => clearTimeout(t);
    }
  }, [measurementState, systolic, diastolic]);

  // Abnormal BP detection — outside these ranges = retry with meditating girl video
  // Tuned for Indian population: covers hypertension (common) + thin young women
  // Acceptable: Systolic 75–170, Diastolic 55–110
  const isAbnormalBP = (systolic, diastolic) => {
    return (
      systolic > 170 ||      // Beyond Stage 2 hypertension
      systolic < 75 ||       // Below normal hypotension
      diastolic > 110 ||     // Beyond Stage 2 diastolic
      diastolic < 55 ||      // Below normal (young/thin women)
      diastolic >= systolic   // Impossible: diastolic can't exceed systolic
    );
  };

  const handleRefresh = () => {
    // Send stop command to all sensors via MQTT
    if (mqttClient.current && mqttClient.current.connected) {
      console.log('[BP] Sending STOP command to kiosk/command');
      mqttClient.current.publish('kiosk/command', 'stop', { qos: 2 }, (err) => {
        if (err) {
          console.error('[BP] Failed to send stop command:', err);
        } else {
          console.log('[BP] Stop command sent successfully (QoS 2)');
        }
      });
    }
    
    // Full page refresh after 1 second delay
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  // Save to context and proceed
  const handleProceed = () => {
    if (systolic && diastolic) {
      update({
        vitals: {
          ...data.vitals,
          systolic: systolic,
          diastolic: diastolic,
        },
      });
      navigate("/oxygen-pulse");
    }
  };

  const canProceed = measurementState === "completed" && systolic && diastolic;

  // Retry Screen - Shows when abnormal BP values detected
  if (showRetryScreen) {
    return (
      <div className="relative w-full h-screen bg-white font-sans overflow-y-auto scrollable-container">
        <div
          className="absolute top-0 left-0 w-full h-[60%] z-0 bg-[#FFF1EA]"
          style={{ clipPath: "ellipse(120% 100% at 50% -40%)" }}
        />
        <div
          className="relative z-10 flex flex-col p-5 min-h-full"
        >
          <header className="flex-shrink-0 flex items-center">
            <button
              onClick={() => window.history.back()}
              className="text-3xl text-gray-800"
            >
              ←
            </button>
          </header>
          <main className="flex-grow flex flex-col items-center justify-center">
            <div className="text-center max-w-md w-full">
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <Logo />
              </div>

              {/* Breathing Animation - Meditating Girl Video */}
              <div className="w-48 h-48 mx-auto mb-6 bg-white rounded-full flex items-center justify-center border-2 border-orange-300 shadow-lg overflow-hidden">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                >
                  <source src={meditatingGirl} type="video/mp4" />
                </video>
              </div>

              {/* Countdown */}
              <div className="text-3xl font-bold text-orange-500 mb-4">
                {retryCountdown}s
              </div>

              {/* Message */}
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Oops! We missed recording your data.
              </h2>
              <p className="text-gray-600 mb-4">
                Sorry for the inconvenience. It looks like your last reading was affected by movement or an irregular pulse. Let's try again for an accurate result.
              </p>

              {/* Instructions */}
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200 mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">Important Instructions:</h3>
                <ul className="text-sm text-gray-600 text-left space-y-1">
                  <li>• Sit comfortably with back supported</li>
                  <li>• Keep feet flat on the floor</li>
                  <li>• Place cuff on bare upper arm at heart level</li>
                  <li>• Keep arm relaxed and supported</li>
                  <li className="text-red-600 font-bold">• Remain still and silent during measurement</li>
                </ul>
              </div>

              <p className="text-gray-500 text-sm">
                Measurement will reset automatically after {retryCountdown} seconds...
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-[#FFEEE5] via-[#FFF5F0] to-[#FFE8DC] overflow-y-auto scrollable-container font-sans flex flex-col">
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .pulse-animation {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes waveform {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .waveform-animation {
          animation: waveform 2s linear infinite;
        }

        .status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: #22C55E;
          box-shadow: 0 0 10px rgba(34, 197, 94, 0.6);
          animation: pulse-dot 2s ease-in-out infinite;
        }

        .fade-in {
          animation: fadeIn 0.8s ease-in-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }

        .shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }

        @keyframes shimmer {
          0%, 100% { box-shadow: 0 0 20px rgba(240, 105, 34, 0.3); }
          50% { box-shadow: 0 0 40px rgba(240, 105, 34, 0.6); }
        }

        .celebrate-bounce {
          animation: celebrateBounce 0.6s ease-in-out;
        }

        @keyframes celebrateBounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .circular-progress {
          position: relative;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: conic-gradient(#F06922 ${((120 - countdown) / 120) * 360}deg, #f0f0f0 0deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(240, 105, 34, 0.15);
        }
        
        .circular-progress::before {
          content: "";
          position: absolute;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background-color: white;
        }
      `}</style>

      {/* Back button */}
      <header className="flex-shrink-0 flex items-center p-5">
        <button
          onClick={() => window.history.back()}
          className="text-3xl text-gray-700 hover:text-gray-900 transition-colors"
          aria-label="back"
        >
          ←
        </button>
      </header>

      {/* Main content */}
      <div className="flex-grow flex flex-col items-center justify-start px-4 md:px-6 lg:px-10 pb-8">
        {/* Header Section */}
        <header className="w-full max-w-7xl mx-auto mb-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo />
          </div>
          
          {/* Title */}
          <h1 className="text-center text-4xl md:text-5xl font-bold text-gray-800 tracking-tight mb-6">
            Reliv Real-Time Measurement Monitor
          </h1>
          
          {/* Device Status Bar - Top Left */}
          <div className="flex justify-start mb-6">
            <div className={`inline-flex items-center space-x-3 backdrop-blur-sm rounded-full px-5 py-3 shadow-md border transition-all duration-300 ${
              isFullyConnected ? "bg-white/80 border-green-100" : "bg-red-50/80 border-red-200"
            }`}>
              {isFullyConnected ? (
                <div className="status-dot"></div>
              ) : (
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
              )}
              <span className="text-sm font-semibold text-gray-800">
                Device Status: <span className={isFullyConnected ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{deviceStatus}</span>
              </span>
              {/* Real-time indicators */}
              <div className="flex items-center gap-2 ml-2 text-xs">
                <span className={`px-2 py-1 rounded-full ${isWifiConnected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  WiFi
                </span>
                <span className={`px-2 py-1 rounded-full ${isMqttConnected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  MQTT
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Dashboard Layout */}
        <main className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (Control Panel) */}
          <section className="lg:col-span-5 flex flex-col">
            <div className="bg-white/90 backdrop-blur-sm shadow-2xl rounded-3xl p-8 md:p-10 flex flex-col items-center justify-between space-y-8 h-full border border-white/50">

              {/* Central Illustration */}
              <div className="flex flex-col items-center space-y-6 flex-grow justify-center">
                <div className={`relative w-56 h-56 md:w-64 md:h-64 bg-gradient-to-br from-orange-50 to-orange-100 rounded-full flex items-center justify-center border-4 ${
                  measurementState === "measuring" ? "border-orange-400 pulse-animation" : 
                  measurementState === "completed" ? "border-green-400 shimmer celebrate-bounce" : 
                  measurementState === "error" ? "border-red-400" :
                  "border-orange-200"
                } shadow-lg transition-all duration-500`}>
                  {/* Concentric circles */}
                  <div className="absolute w-48 h-48 md:w-56 md:h-56 rounded-full border-2 border-orange-200/60" />
                  <div className="absolute w-40 h-40 md:w-48 md:h-48 rounded-full border-2 border-orange-200/40" />
                  
                  {/* Conditional Content */}
                  {measurementState === "completed" && systolic && diastolic ? (
                    // Data Display in Circle
                    <div className="relative z-10 flex flex-col items-center justify-center fade-in">
                      <div className="text-center mb-3">
                        <div className="text-5xl font-bold text-[#F06922] leading-none">{systolic}/{diastolic}</div>
                        <div className="text-sm text-gray-600 font-semibold mt-1">mmHg</div>
                      </div>
                    </div>
                  ) : measurementState === "error" ? (
                    <div className="relative z-10 text-center fade-in">
                      <div className="text-red-500 text-6xl mb-2">⚠️</div>
                      <p className="text-sm text-gray-600">Error</p>
                    </div>
                  ) : (
                    // BP Cuff Image - Bigger and circular
                    <div className="relative z-10 fade-in">
                      <img 
                        src={bpPicture} 
                        alt="BP Cuff" 
                        className="w-48 h-48 md:w-56 md:h-56 object-cover rounded-full"
                      />
                    </div>
                  )}
                </div>
                
                {/* Label below circle */}
                {measurementState === "completed" && systolic && diastolic ? (
                  <p className="text-xl font-bold text-green-600 fade-in">✓ Measurement Complete!</p>
                ) : measurementState === "error" ? (
                  <p className="text-xl font-semibold text-red-600">Measurement Error</p>
                ) : (
                  <p className="text-xl font-semibold text-gray-800">Place Cuff on Arm</p>
                )}
              </div>

              <div className="w-full space-y-4">
                <button
                  onClick={startMeasurement}
                  disabled={measurementState === "measuring" || !isFullyConnected}
                  className={`w-full font-semibold text-lg py-4 px-6 rounded-full shadow-lg transition-all duration-300 ${
                    measurementState === "measuring" || !isFullyConnected
                      ? "bg-gray-400 text-white cursor-not-allowed opacity-70"
                      : "bg-gradient-to-r from-[#F06922] to-[#E85C25] hover:from-[#E85C25] hover:to-[#D45513] text-white transform hover:scale-105"
                  }`}
                >
                  {!isFullyConnected ? "Device Not Connected" : 
                   measurementState === "idle" ? "Measure Blood Pressure" :
                   measurementState === "measuring" ? "Measuring…" :
                   measurementState === "completed" ? "Re-measure" :
                   "Try Again"}
                </button>
                
                {measurementState === "completed" && canProceed && (
                  <button
                    onClick={handleProceed}
                    disabled={autoProceeding}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold text-lg py-4 px-6 rounded-full shadow-lg hover:opacity-90 transition-all duration-300"
                  >
                    {autoProceeding ? "✅ Data Recorded — Proceeding..." : "Save & Proceed →"}
                  </button>
                )}
                
                <button 
                  onClick={handleRefresh}
                  className="w-full bg-white border-2 border-[#F06922] text-[#F06922] hover:bg-orange-50 font-semibold text-lg py-4 px-6 rounded-full transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </section>

          {/* Right Column (Status & Info Stack) */}
          <section className="lg:col-span-7 flex flex-col gap-6">
            {/* Card 1: Live Device Status */}
            <article className="bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl p-8 border border-white/50">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Live Device Status</h2>
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-6">
                {/* Waveform Graph */}
                <div className="flex-grow w-full md:w-auto h-24 flex items-center justify-start">
                  {measurementState === "measuring" ? (
                    <div className="flex space-x-1 items-end h-full w-full">
                      {[3, 8, 5, 12, 7, 15, 6, 10, 4, 9, 14, 6, 11, 5, 8, 13, 7, 10, 6, 12].map((height, i) => (
                        <div
                          key={i}
                          className="bg-gradient-to-t from-[#F06922] to-[#FFA500] rounded-t flex-1 waveform-animation"
                          style={{
                            height: `${height * 5}px`,
                            animationDelay: `${i * 0.1}s`,
                            minWidth: "6px"
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
                      <span className="text-gray-400 text-sm">Awaiting Measurement...</span>
                    </div>
                  )}
                </div>
                
                {/* Circular Timer */}
                <div className="flex-shrink-0">
                  <div className="circular-progress">
                    <div className="relative z-10 flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold text-gray-800 leading-none">{countdown}s</span>
                      <span className="text-sm text-gray-500 font-medium mt-1">remaining</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
                <p className="text-gray-800 text-base leading-relaxed">
                  <span className="font-bold text-[#F06922]">Message:</span>{" "}
                  <span className="font-medium">{statusMessage}</span>
                </p>
              </div>
            </article>

            {/* Card 2: Live Message */}
            <article className="bg-gradient-to-br from-white to-orange-50/50 backdrop-blur-sm shadow-xl rounded-3xl p-8 border-2 border-orange-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">💬</span> Live Message
              </h2>
              <p className="text-xl md:text-2xl font-bold text-[#F06922] leading-snug">
                {statusMessage}
              </p>
            </article>

            {/* Card 3: Important Instructions */}
            <article className="bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl p-8 border border-white/50">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">📋</span>
                <h2 className="text-xl font-bold text-gray-900">Important Instructions</h2>
              </div>
              <ul className="list-disc list-outside pl-6 space-y-3 text-gray-700 font-medium text-base custom-list">
                <li>Sit upright with back supported and feet flat on the floor</li>
                <li>Place cuff on bare upper arm <span className="text-red-600 font-bold">at heart level</span></li>
                <li>Keep arm relaxed and supported on a table</li>
                <li className="text-red-600 font-bold">Do NOT talk or move during measurement</li>
                <li>Avoid caffeine 30 minutes before measurement</li>
              </ul>
            </article>
          </section>
        </main>
      </div>

      {/* Support Button */}
      <SupportButton page="Health Checkup (Blood Pressure)" />
    </div>
  );
};

export default function HealthCheckup() {
  const { speak, stop } = useSpeech();
  useEffect(() => {
    const t = setTimeout(() => speak("health-checkup"), 400);
    return () => { clearTimeout(t); stop(); };
  }, []);
  const [currentPage, setCurrentPage] = useState("splash");

  const showBPPage = () => setCurrentPage("bp");

  switch (currentPage) {
    case "splash":
      return <Splash onComplete={showBPPage} />;
    case "bp":
      return <BloodPressurePage />;
    default:
      return <Splash onComplete={showBPPage} />;
  }
}
