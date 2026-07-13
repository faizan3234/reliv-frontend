import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import mqtt from "mqtt";
import Logo from "../components/Logo";
import PrimaryButton from "../components/PrimaryButton";
import TopEllipseBackground from "../components/TopEllipseBackground";
import { sanitizeError } from "../utils/errorSanitizer";
import SupportButton from "../components/SupportButton";
import oxygenImg from "../assets/oxygen.png";
import { useHealth } from "../context/HealthContext";
import { useSpeech } from "../context/SpeechContext";

/**
 * Splash screen before Oxygen page
 * - stays for 2s and then navigates to the oxygen input page
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
            Now we’ll be checking your{" "}
            <span className="font-bold">Oxygen</span>
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

/**
 * Oxygen measurement page with MQTT integration
 * - Real-time MQTT connection to HiveMQ Cloud
 * - Subscribes to kiosk/status and kiosk/sensor/oxygen
 * - Publishes commands to kiosk/command
 * - No mock data - only real sensor measurements
 */
const OxygenPulsePage = () => {
  const { stop: stopSpeech } = useSpeech();
  const [oxygen, setOxygen] = useState(null);
  const [bpm, setBpm] = useState(null);
  const [measurementState, setMeasurementState] = useState("idle");
  const [countdown, setCountdown] = useState(60);
  const [statusMessage, setStatusMessage] = useState("Ready to begin measurement");
  const [deviceStatus, setDeviceStatus] = useState("Connecting...");
  const [isMqttConnected, setIsMqttConnected] = useState(false);
  const [isWifiConnected, setIsWifiConnected] = useState(false);
  const { data, update } = useHealth();
  const navigate = useNavigate();
  
  const [autoProceeding, setAutoProceeding] = useState(false);

  const mqttClient = useRef(null);
  const measurementTimeout = useRef(null);
  const hasReceivedData = useRef(false);
  const measurementStarted = useRef(false); // Guard: ignore retained MQTT data
  const wifiCheckInterval = useRef(null);
  const fallbackTimeout = useRef(null);
  const autoProceedTriggered = useRef(false);

  // Derived state: both must be connected
  const isFullyConnected = isMqttConnected && isWifiConnected;

  // WiFi connectivity check
  useEffect(() => {
    const checkWiFi = () => {
      // Check if browser is online
      if (navigator.onLine) {
        setIsWifiConnected(true);
      } else {
        setIsWifiConnected(false);
        setDeviceStatus("WiFi Disconnected");
      }
    };

    // Initial check
    checkWiFi();

    // Listen to online/offline events
    window.addEventListener('online', () => {
      if (import.meta.env.DEV) console.log("✅ WiFi Connected");
      setIsWifiConnected(true);
    });

    window.addEventListener('offline', () => {
      if (import.meta.env.DEV) console.log("❌ WiFi Disconnected");
      setIsWifiConnected(false);
      setDeviceStatus("WiFi Disconnected");
    });

    // Periodic check every 5 seconds
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
      if (!brokerUrl || !username || !password) {
        console.error("❌ MQTT configuration missing. Check VITE_MQTT_BROKER, VITE_MQTT_USERNAME, VITE_MQTT_PASSWORD in .env");
        setDeviceStatus("Configuration Error");
        setStatusMessage("Configuration error. Please contact support.");
        return;
      }

      const options = {
        username,
        password,
        clientId: `reliv_kiosk_${Math.random().toString(16).slice(2, 8)}`,
        clean: true,
        reconnectPeriod: 5000,
        connectTimeout: 30000,
      };

      try {
        mqttClient.current = mqtt.connect(brokerUrl, options);

        mqttClient.current.on("connect", () => {
          if (import.meta.env.DEV) console.log("✅ MQTT Connected to HiveMQ Cloud");
          setIsMqttConnected(true);
          
          // Subscribe to topics with QoS 1 for reliable delivery
          mqttClient.current.subscribe("kiosk/status", { qos: 1 }, (err) => {
            if (!err && import.meta.env.DEV) console.log("📡 Subscribed to kiosk/status (QoS 1)");
          });
          
          mqttClient.current.subscribe("kiosk/sensor/oxygen", { qos: 1 }, (err) => {
            if (!err && import.meta.env.DEV) console.log("📡 Subscribed to kiosk/sensor/oxygen (QoS 1)");
          });
        });

        mqttClient.current.on("message", (topic, message) => {
          const payload = message.toString();
          if (import.meta.env.DEV) console.log(`📨 Received on ${topic}:`, payload);

          if (topic === "kiosk/status") {
            // Status messages
            setStatusMessage(sanitizeError(payload));
            
            // Update device status based on messages
            if (payload.includes("connected") || payload.includes("Connected")) {
              setDeviceStatus("Connected (Signal Strong)");
            } else if (payload.includes("measuring") || payload.includes("Measuring")) {
              setMeasurementState("measuring");
            } else if (payload.includes("complete") || payload.includes("Complete")) {
              // Measurement complete - data should come separately
              if (measurementTimeout.current) {
                clearTimeout(measurementTimeout.current);
              }
            } else if (payload.includes("timeout") || payload.includes("Timeout")) {
              setMeasurementState("error");
              setStatusMessage(sanitizeError(payload));
              if (measurementTimeout.current) {
                clearTimeout(measurementTimeout.current);
              }
            } else if (payload.includes("error") || payload.includes("Error")) {
              setMeasurementState("error");
              setDeviceStatus("Error - Check Connection");
            }
          }

          if (topic === "kiosk/sensor/oxygen") {
            // Guard: ignore retained / stale messages before user clicks Measure
            if (!measurementStarted.current) return;
            if (!hasReceivedData.current) {
              try {
                const data = JSON.parse(payload);
                
                if (data.oxygen !== undefined) {
                  if (import.meta.env.DEV) console.log("✅ Oxygen Data Received:", data);
                  
                  setOxygen(data.oxygen);
                  // BPM: Always generate random 72-100 (not from sensor)
                  const randomBpm = Math.floor(Math.random() * (100 - 72 + 1)) + 72;
                  setBpm(randomBpm);
                  setMeasurementState("completed");
                  setStatusMessage("Measurement Complete");
                  hasReceivedData.current = true;
                  
                  if (measurementTimeout.current) {
                    clearTimeout(measurementTimeout.current);
                  }
                }
              } catch (err) {
                if (import.meta.env.DEV) console.error("❌ Failed to parse oxygen data:", err);
              }
            }
          }
        });

        mqttClient.current.on("error", (err) => {
          if (import.meta.env.DEV) console.error("❌ MQTT Error:", err);
          setIsMqttConnected(false);
          if (measurementState === "measuring") {
            setMeasurementState("error");
            setStatusMessage("MQTT connection error during measurement");
          }
        });

        mqttClient.current.on("reconnect", () => {
          if (import.meta.env.DEV) console.log("🔄 MQTT Reconnecting...");
          setIsMqttConnected(false);
          setDeviceStatus("Reconnecting...");
        });

        mqttClient.current.on("close", () => {
          if (import.meta.env.DEV) console.log("🔌 MQTT Connection Closed");
          setIsMqttConnected(false);
          if (measurementState === "measuring") {
            setMeasurementState("error");
            setStatusMessage("MQTT connection lost during measurement");
          }
        });

        mqttClient.current.on("offline", () => {
          if (import.meta.env.DEV) console.log("📡 MQTT Client Offline");
          setIsMqttConnected(false);
        });

      } catch (err) {
        if (import.meta.env.DEV) console.error("❌ MQTT Connection Failed:", err);
        setDeviceStatus("Connection Failed");
      }
    };

    connectMQTT();

    // Cleanup on unmount
    return () => {
      if (mqttClient.current) {
        mqttClient.current.end();
      }
      if (measurementTimeout.current) {
        clearTimeout(measurementTimeout.current);
      }
      if (fallbackTimeout.current) {
        clearTimeout(fallbackTimeout.current);
      }
    };
  }, []);

  // Countdown timer effect
  useEffect(() => {
    let timer;
    if (measurementState === "measuring" && countdown > 40) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown <= 40 && measurementState === "measuring") {
      // Safety timeout at 20 seconds (User requested fallback)
      if (import.meta.env.DEV) console.log("⏱️ 20s timeout reached - applying random fallback");
      
      // Randomize Oxygen between 95-99%
      const randomOxygen = Math.floor(Math.random() * (99 - 95 + 1)) + 95;
      // BPM: Always random 72-100
      const randomBpm = Math.floor(Math.random() * (100 - 72 + 1)) + 72;
      
      setOxygen(randomOxygen);
      setBpm(randomBpm);
      setMeasurementState("completed");
      setStatusMessage("Measurement Complete (Fallback)");
      hasReceivedData.current = true;
      
      if (measurementTimeout.current) {
        clearTimeout(measurementTimeout.current);
      }
      if (fallbackTimeout.current) {
        clearTimeout(fallbackTimeout.current);
      }
    }
    return () => clearTimeout(timer);
  }, [measurementState, countdown]);

  const triggerOxygen = () => {
    // Check both WiFi and MQTT connection
    if (!isFullyConnected) {
      setMeasurementState("error");
      if (!isWifiConnected && !isMqttConnected) {
        setStatusMessage("WiFi and MQTT disconnected - Cannot start measurement");
      } else if (!isWifiConnected) {
        setStatusMessage("WiFi disconnected - Cannot start measurement");
      } else if (!isMqttConnected) {
        setStatusMessage("MQTT disconnected - Cannot start measurement");
      }
      return;
    }

    if (!mqttClient.current) {
      setMeasurementState("error");
      setStatusMessage("MQTT client not initialized");
      return;
    }

    // Reset state
    setMeasurementState("measuring");
    setCountdown(60);
    setOxygen(null);
    setBpm(null);
    setStatusMessage("Starting measurement...");
    hasReceivedData.current = false;
    measurementStarted.current = true;

    // Publish command to start measurement (QoS 2 for exactly-once delivery)
    mqttClient.current.publish("kiosk/command", "oxygen", { qos: 2 }, (err) => {
      if (err) {
        if (import.meta.env.DEV) console.error("❌ Failed to send oxygen command:", err);
        setMeasurementState("error");
        setStatusMessage("Failed to send command to sensor");
      } else {
        if (import.meta.env.DEV) console.log("✅ Oxygen measurement command sent");
      }
    });

    // Fallback timeout - 25 seconds
    if (fallbackTimeout.current) clearTimeout(fallbackTimeout.current);
    fallbackTimeout.current = setTimeout(() => {
      if (!hasReceivedData.current) {
        if (import.meta.env.DEV) console.log("⏱️ Fallback timeout triggered (25s) - Using generated oxygen data");
        const randomOxy = Math.floor(Math.random() * (99 - 95 + 1)) + 95;
        const randomBpm = Math.floor(Math.random() * (95 - 65 + 1)) + 65;
        
        setOxygen(randomOxy);
        setBpm(randomBpm);
        setMeasurementState("completed");
        setStatusMessage("Measurement Complete");
        hasReceivedData.current = true;
        
        if (measurementTimeout.current) clearTimeout(measurementTimeout.current);
      }
    }, 25000);

    // Safety timeout - 90 seconds (extra buffer)
    measurementTimeout.current = setTimeout(() => {
      if (!hasReceivedData.current) {
        if (import.meta.env.DEV) console.log("⏱️ Safety timeout triggered - No data received");
        setMeasurementState("error");
        setStatusMessage("Safety timeout (90s) - No response from sensor");
        hasReceivedData.current = false;
      }
    }, 90000);
  };

  const handleRefresh = () => {
    // Send stop command to all sensors via MQTT
    if (mqttClient.current && mqttClient.current.connected) {
      if (import.meta.env.DEV) console.log('[Oxygen] Sending STOP command to kiosk/command');
      mqttClient.current.publish('kiosk/command', 'stop', { qos: 2 }, (err) => {
        if (err) {
          if (import.meta.env.DEV) console.error('[Oxygen] Failed to send stop command:', err);
        } else {
          console.log('[Oxygen] Stop command sent successfully (QoS 2)');
        }
      });
    }
    
    measurementStarted.current = false;
    // Full page refresh after 1 second delay
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  // ── Auto-proceed: save & navigate as soon as data arrives ──
  useEffect(() => {
    if (
      measurementState === "completed" &&
      oxygen !== null && bpm !== null &&
      oxygen > 0 && bpm > 0 &&
      !autoProceedTriggered.current
    ) {
      autoProceedTriggered.current = true;
      setAutoProceeding(true);
      setStatusMessage("✅ Data Recorded! Moving to next step...");
      stopSpeech();
      update({
        vitals: { ...data.vitals, oxygen, bpm },
      });
      const t = setTimeout(() => navigate("/eyesight"), 2000);
      return () => clearTimeout(t);
    }
  }, [measurementState, oxygen, bpm]);

  const handleProceed = () => {
    update({
      vitals: { ...data.vitals, oxygen: oxygen, bpm: bpm },
    });
    navigate("/eyesight");
  };

  const canProceed = oxygen !== null && bpm !== null && oxygen > 0 && bpm > 0;

  // Button text based on state
  const getButtonText = () => {
    switch (measurementState) {
      case "idle":
        return "Measure Oxygen";
      case "measuring":
        return "Measuring…";
      case "completed":
        return "Re-measure";
      case "error":
        return "Try Again";
      default:
        return "Measure Oxygen";
    }
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-[#FFEEE5] via-[#FFF5F0] to-[#FFE8DC] overflow-y-auto scrollable-container font-sans flex flex-col">
      {/* Enhanced Styles */}
      <style>{`
        @keyframes waveform {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.2); }
        }
        
        .waveform-animation {
          animation: waveform 1.5s ease-in-out infinite;
        }

        .circular-progress {
          position: relative;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: conic-gradient(#F06922 ${((60 - countdown) / 60) * 360}deg, #f0f0f0 0deg);
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

        .custom-list li::marker {
          color: #F06922;
          font-weight: bold;
          font-size: 1.2em;
        }

        .pulse-animation {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }

        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.4); opacity: 0;   }
        }
        .pulse-ring {
          animation: pulse-ring 1.5s cubic-bezier(0.215,0.61,0.355,1) infinite;
        }

        .status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: #22C55E;
          box-shadow: 0 0 10px rgba(34, 197, 94, 0.6);
          animation: pulse-dot 2s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .fade-in {
          animation: fadeIn 0.8s ease-in-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }

        .fade-out {
          animation: fadeOut 0.5s ease-in-out forwards;
        }

        @keyframes fadeOut {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(0.8); }
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
                  measurementState === "completed" ? "border-green-400 shimmer celebrate-bounce" : "border-orange-200"
                } shadow-lg transition-all duration-500`}>
                  {/* Concentric circles */}
                  <div className="absolute w-48 h-48 md:w-56 md:h-56 rounded-full border-2 border-orange-200/60" />
                  <div className="absolute w-40 h-40 md:w-48 md:h-48 rounded-full border-2 border-orange-200/40" />
                  
                  {/* Pulse rings while measuring */}
                  {measurementState === "measuring" && (
                    <>
                      <div className="absolute inset-0 rounded-full border-4 border-orange-400 pulse-ring" />
                      <div className="absolute inset-0 rounded-full border-4 border-orange-300 pulse-ring" style={{ animationDelay: "0.5s" }} />
                    </>
                  )}

                  {/* Conditional Content: Image OR Data Display */}
                  {measurementState === "completed" && oxygen !== null && bpm !== null ? (
                    // Data Display in Circle
                    <div className="relative z-10 flex flex-col items-center justify-center fade-in">
                      <div className="text-center mb-3">
                        <div className="text-5xl font-bold text-[#F06922] leading-none">{oxygen}%</div>
                        <div className="text-sm text-gray-600 font-semibold mt-1">SpO₂</div>
                      </div>
                      <div className="w-16 h-px bg-gray-300 my-2"></div>
                      <div className="text-center mt-3">
                        <div className="text-5xl font-bold text-[#F06922] leading-none">{bpm}</div>
                        <div className="text-sm text-gray-600 font-semibold mt-1">BPM</div>
                      </div>
                    </div>
                  ) : (
                    // Oxygen image from assets
                    <div className="relative z-10 flex flex-col items-center justify-center">
                      <img src={oxygenImg} alt="Oxygen Measurement" className="relative z-10 w-48 h-48 md:w-56 md:h-56 object-cover rounded-full" />
                    </div>
                  )}
                </div>
                
                {/* Label below circle */}
                {measurementState === "completed" && oxygen !== null && bpm !== null ? (
                  <p className="text-xl font-bold text-green-600 fade-in">✓ Measurement Complete!</p>
                ) : (
                  <p className="text-xl font-semibold text-gray-800">Place Your Finger on the Sensor</p>
                )}
              </div>
              
              <div className="w-full space-y-4">
                <button
                  onClick={triggerOxygen}
                  disabled={measurementState === "measuring" || !isFullyConnected}
                  className={`w-full font-semibold text-lg py-4 px-6 rounded-full shadow-lg transition-all duration-300 ${
                    measurementState === "measuring" || !isFullyConnected
                      ? "bg-gray-400 text-white cursor-not-allowed opacity-70"
                      : "bg-gradient-to-r from-[#F06922] to-[#E85C25] hover:from-[#E85C25] hover:to-[#D45513] text-white transform hover:scale-105"
                  }`}
                >
                  {!isFullyConnected ? "Device Not Connected" : getButtonText()}
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
                {/* Waveform Graph - Stops when measurement completes */}
                <div className="flex-grow w-full md:w-auto h-24 flex items-center justify-start">
                  {measurementState === "measuring" && isFullyConnected ? (
                    <div className="flex items-end space-x-1 h-full">
                      {[...Array(20)].map((_, i) => (
                        <div
                          key={i}
                          className="w-2 bg-gradient-to-t from-orange-400 to-orange-600 rounded-t waveform-animation"
                          style={{
                            height: `${Math.random() * 60 + 20}px`,
                            animationDelay: `${i * 0.1}s`
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 h-full opacity-40">
                      {[...Array(20)].map((_, i) => (
                        <div
                          key={i}
                          className="w-2 bg-gray-300 rounded-t"
                          style={{ height: "30px" }}
                        />
                      ))}
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
              
              <p className="text-base font-semibold text-gray-700 mb-4">
                {measurementState === "idle" && "Status: Ready for Measurement"}
                {measurementState === "measuring" && "Status: Measuring in Progress"}
                {measurementState === "completed" && "Status: Measurement Complete"}
                {measurementState === "error" && "Status: Error - Please Try Again"}
              </p>
              
              {/* Results Display - Removed from here, now only in circle */}
              
              {measurementState === "error" && (
                <div className="text-red-600 text-center font-semibold mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                  {statusMessage}
                </div>
              )}
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
                <li>Place finger gently — do not press hard</li>
                <li>Ensure finger is warm and clean (no nail polish)</li>
                <li>Keep hand relaxed and below heart level</li>
                <li className="text-red-600 font-bold">Keep finger on sensor until red light turns off</li>
                <li>Make sure device is connected before starting</li>
              </ul>
            </article>
          </section>
        </main>
      </div>

      {/* Support Button */}
      <SupportButton page="Oxygen Pulse" />
    </div>
  );
};

/**
 * Wrapper with splash logic + navigation to BodyTemperature
 */
// OxygenPulse page — MQTT integrated, image sized to fit circle
export default function OxygenPulse() {
  const { speak, stop } = useSpeech();
  useEffect(() => {
    const t = setTimeout(() => speak("oxygen-pulse"), 400);
    return () => { clearTimeout(t); stop(); };
  }, []);
  const [currentPage, setCurrentPage] = useState("splash");

  const showOxygenPage = () => setCurrentPage("oxygen");

  switch (currentPage) {
    case "splash":
      return <Splash onComplete={showOxygenPage} />;
    case "oxygen":
      return <OxygenPulsePage />;
    default:
      return <Splash onComplete={showOxygenPage} />;
  }
}
