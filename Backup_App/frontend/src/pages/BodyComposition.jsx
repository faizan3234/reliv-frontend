// src/pages/BodyComposition.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import mqtt from "mqtt";
import Logo from "../components/Logo";
import SupportButton from "../components/SupportButton";
import { useHealth } from "../context/HealthContext";
import heightImage from "../assets/height.png";

const PI_WEIGHT_URL = import.meta.env.VITE_PI_WEIGHT_URL || "http://localhost:5001";

// ─────────────────────────────────────────────────────────────
//  MQTT CONFIG  (all from .env — never hardcode credentials)
// ─────────────────────────────────────────────────────────────
const MQTT_BROKER = import.meta.env.VITE_MQTT_BROKER;
const MQTT_OPTIONS = {
  username: import.meta.env.VITE_MQTT_USERNAME,
  password: import.meta.env.VITE_MQTT_PASSWORD,
  clientId: `reliv-body-${Math.random().toString(16).slice(2, 10)}`,
  clean: true,
  reconnectPeriod: 5000,
};

// ─────────────────────────────────────────────────────────────
//  MQTT TOPICS
//
//  PUBLISHES  → kiosk/command         "height" | "stop"
//  SUBSCRIBES → kiosk/status          human-readable progress (every round etc.)
//             → kiosk/sensor/height   final height JSON  {"height_cm": 172.3, ...}
//
//  HOW IT WORKS (user never clicks twice):
//  1. User clicks "Start Measurement"
//  2. Web publishes "height" → kiosk/command
//  3. S3 and Ultrasonic ESP both start measuring simultaneously (~20 s)
//  4. kiosk/status messages appear in Live Message as rounds complete
//  5. kiosk/sensor/height fires once with final fused result
//  6. Height shows in circle — user steps on scale for weight (BLE poll)
//  7. Both done → "Save & Proceed" unlocks
// ─────────────────────────────────────────────────────────────

// Internal system messages that should never reach the customer UI
const INTERNAL_MSG_PATTERNS = [
  "ready. send",
  "waiting for next command",
  "[system]",
  "[ready]",
];

const isInternalMessage = (msg) => {
  const lower = msg.toLowerCase();
  return INTERNAL_MSG_PATTERNS.some((p) => lower.includes(p));
};

// Countdown covers one measurement attempt (20s) + possible retry (20s) + buffer
const COUNTDOWN_SECONDS = 120;

const BodyComposition = () => {
  const [weight, setWeight]                 = useState(null);
  const [height, setHeight]                 = useState(null);
  const [impedance, setImpedance]           = useState(null);
  const [measurementState, setMeasurementState] = useState("idle");
  // idle | measuring | completed | error
  const [countdown, setCountdown]           = useState(COUNTDOWN_SECONDS);
  const [statusMessage, setStatusMessage]   = useState("Ready to begin measurement.");
  const [mqttConnected, setMqttConnected]   = useState(false);

  const navigate = useNavigate();
  const { update } = useHealth();

  const clientRef          = useRef(null);
  const countdownRef       = useRef(null);
  const timeoutRef         = useRef(null);
  const hasHeight          = useRef(false);
  const hasWeight          = useRef(false);
  const measurementStarted = useRef(false); // Guard: ignore retained/stale MQTT data before user clicks Start
  // Always-current refs — lets MQTT useEffect ([] deps) call latest logic
  // without stale closure on re-measure
  const onHeightReceivedRef = useRef(null);
  const onWeightReceivedRef = useRef(null);

  // Updated every render so MQTT handler always uses current state/functions
  onHeightReceivedRef.current = (heightVal) => {
    if (hasWeight.current) {
      // Both arrived — auto-save to context immediately so report pages have data
      update({
        vitals: {
          height:    parseFloat(heightVal),
          weight:    parseFloat(weight),
          impedance: parseFloat(impedance) || 500,
        },
      });
      setMeasurementState("completed");
      setStatusMessage(`✅ Height: ${heightVal} cm  |  Weight: ${weight} kg`);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (timeoutRef.current)   clearTimeout(timeoutRef.current);
    } else {
      setStatusMessage(`Height recorded: ${heightVal} cm. Now step on the scale.`);
    }
  };

  onWeightReceivedRef.current = (weightVal) => {
    if (hasHeight.current) {
      // Both arrived — auto-save to context immediately so report pages have data
      update({
        vitals: {
          height:    parseFloat(height),
          weight:    parseFloat(weightVal),
          impedance: parseFloat(impedance) || 500,
        },
      });
      setMeasurementState("completed");
      setStatusMessage(`✅ Height: ${height} cm  |  Weight: ${weightVal} kg`);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (timeoutRef.current)   clearTimeout(timeoutRef.current);
    } else {
      setStatusMessage(`Weight recorded: ${weightVal} kg. Height sensor still measuring...`);
    }
  };

  // ─── MQTT CONNECT ────────────────────────────────────────────
  useEffect(() => {
    console.log("🔌 Connecting to MQTT Broker...");
    const client = mqtt.connect(MQTT_BROKER, MQTT_OPTIONS);
    clientRef.current = client;

    client.on("connect", () => {
      console.log("✅ MQTT Connected");
      setMqttConnected(true);
      setStatusMessage("Connected! Ready to measure.");

      // kiosk/status  — round-by-round progress from ESP32
      client.subscribe("kiosk/status", { qos: 1 }, (err) => {
        if (!err) console.log("📡 Subscribed to kiosk/status");
      });

      // kiosk/sensor/height  — final fused height result
      // Firmware publishes: {"height_cm":172.3,"tof_cm":171.9,"us_cm":172.6,"confidence":"high"}
      client.subscribe("kiosk/sensor/height", { qos: 1 }, (err) => {
        if (!err) console.log("📡 Subscribed to kiosk/sensor/height");
      });
    });

    client.on("message", (topic, message) => {
      const msg = message.toString();
      console.log(`📩 [${topic}] ${msg}`);

      // ── kiosk/status — live progress messages ──────────────────
      if (topic === "kiosk/status") {
        if (isInternalMessage(msg)) return;
        // Once height received, firmware fires one final kiosk/status ~50ms later.
        // Block it — we already set the "step on scale" instruction.
        if (hasHeight.current) return;
        setStatusMessage(msg);
        return;
      }

      // ── kiosk/sensor/height — FINAL height result ──────────────
      // Key is height_cm (not "height") — matches firmware output
      // Guard: ignore retained/stale messages if user hasn't started measurement
      if (topic === "kiosk/sensor/height" && !measurementStarted.current) return;
      if (topic === "kiosk/sensor/height") {
        try {
          const parsed = JSON.parse(msg);

          // Support both key names defensively
          const h = parsed.height_cm ?? parsed.height ?? null;

          if (h && parseFloat(h) > 0) {
            const heightVal = parseFloat(h).toFixed(1);
            console.log(`📏 Height received: ${heightVal} cm`);
            console.log(`   TOF: ${parsed.tof_cm} cm | US: ${parsed.us_cm} cm | confidence: ${parsed.confidence}`);

            setHeight(heightVal);
            hasHeight.current = true;
            // Call via ref — uses latest render's logic (safe on re-measure)
            onHeightReceivedRef.current?.(heightVal);
          } else {
            console.warn("⚠️ Height payload missing height_cm:", msg);
          }
        } catch (e) {
          console.error("❌ Failed to parse height payload:", e, msg);
        }
      }
    });

    client.on("error", (err) => {
      console.error("❌ MQTT Error:", err);
      setMqttConnected(false);
      setStatusMessage("Connection error. Check network.");
    });

    client.on("offline", () => {
      setMqttConnected(false);
      setStatusMessage("Device offline. Reconnecting...");
    });

    client.on("reconnect", () => {
      setStatusMessage("Reconnecting to device...");
    });

    return () => {
      clearTimers();
      if (client) { client.end(); }
    };
  }, []);

  // ─── HELPERS ─────────────────────────────────────────────────
  const clearTimers = () => {
    if (countdownRef.current)  clearInterval(countdownRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const completeMeasurement = (msg) => {
    setMeasurementState("completed");
    setStatusMessage(msg);
    clearTimers();
  };

  const publishCommand = (cmd) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish("kiosk/command", cmd, { qos: 2 }, (err) => {
        if (err) console.error(`❌ Failed to publish "${cmd}":`, err);
        else     console.log(`✅ Published "${cmd}" to kiosk/command`);
      });
    }
  };

  // ─── WEIGHT POLL (BLE via Pi backend) ────────────────────────
  const fetchWeight = async () => {
    try {
      const res = await fetch(`${PI_WEIGHT_URL}/api/weight`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.weight && parseFloat(data.weight) > 0) {
        const w = parseFloat(data.weight).toFixed(1);
        console.log(`⚖️ Weight received: ${w} kg`);
        setWeight(w);
        setImpedance(data.impedance || 500);
        hasWeight.current = true;
        onWeightReceivedRef.current?.(w);
      }
    } catch (e) {
      console.error("❌ Weight fetch failed:", e);
    }
  };

  // Poll weight every second while measuring
  useEffect(() => {
    if (measurementState !== "measuring") return;
    const interval = setInterval(() => {
      if (!hasWeight.current) fetchWeight();
    }, 1000);
    return () => clearInterval(interval);
  }, [measurementState]);

  // ─── START MEASUREMENT ────────────────────────────────────────
  const startMeasurement = () => {
    if (!mqttConnected) {
      setStatusMessage("Not connected to device. Please wait...");
      return;
    }

    // Reset all state
    setMeasurementState("measuring");
    setHeight(null);
    setWeight(null);
    setImpedance(null);
    setCountdown(COUNTDOWN_SECONDS);
    hasHeight.current = false;
    hasWeight.current = false;
    measurementStarted.current = true;
    setStatusMessage("Starting height measurement... Stand straight and look forward.");

    // ONE command → both TOF and Ultrasonic sensors start simultaneously on their boards
    publishCommand("height");

    // Countdown timer
    clearTimers();
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(countdownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);

    // Safety timeout (generous buffer beyond max measurement time)
    timeoutRef.current = setTimeout(() => {
      setMeasurementState("error");
      setStatusMessage("Measurement timed out. Please try again.");
      clearTimers();
    }, (COUNTDOWN_SECONDS + 10) * 1000);

    // Start weight polling immediately
    fetchWeight();
  };

  // ─── STOP / REFRESH ──────────────────────────────────────────
  const handleRefresh = () => {
    measurementStarted.current = false;
    publishCommand("stop"); // tells both ESP32s to halt immediately
    setTimeout(() => window.location.reload(), 800);
  };

  // ─── SAVE & PROCEED ──────────────────────────────────────────
  const handleProceed = () => {
    if (height && weight) {
      // Update context with confirmed final values (auto-save may have already done this)
      update({
        vitals: {
          height:    parseFloat(height),
          weight:    parseFloat(weight),
          impedance: parseFloat(impedance) || 500,
        },
      });
      console.log(`✅ Proceeding with Height=${height} cm, Weight=${weight} kg`);
      navigate("/payment", { state: { fromPaymentGate: true, cart: [], totalPrice: 0 } });
    }
  };

  const canProceed = measurementState === "completed" && height && weight;

  // ─── RENDER ──────────────────────────────────────────────────
  return (
    <div className="relative w-full min-h-screen bg-gradient-to-br from-[#FFEEE5] via-[#FFF5F0] to-[#FFE8DC] overflow-hidden font-sans flex flex-col">
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

      <div className="flex-grow flex flex-col items-center justify-start px-4 md:px-6 lg:px-10 pb-8">
        {/* ── Header ── */}
        <header className="w-full max-w-7xl mx-auto mb-8">
          <div className="flex justify-center mb-6">
            <Logo />
          </div>

          <h1 className="text-center text-4xl md:text-5xl font-bold text-gray-800 tracking-tight mb-6">
            Body Composition Measurement
          </h1>

          {/* Device Status Bar */}
          <div className="flex justify-start mb-6">
            <div className={`inline-flex items-center space-x-3 backdrop-blur-sm rounded-full px-5 py-3 shadow-md border transition-all duration-300 ${
              mqttConnected ? "bg-white/80 border-green-100" : "bg-red-50/80 border-red-200"
            }`}>
              <div className={`w-3 h-3 rounded-full animate-pulse ${mqttConnected ? "bg-green-500" : "bg-red-500"}`} />
              <span className="text-sm font-semibold text-gray-800">
                Device:{" "}
                <span className={mqttConnected ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                  {mqttConnected ? "Connected" : "Disconnected"}
                </span>
              </span>
              <span className={`px-2 py-1 rounded-full text-xs ${mqttConnected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                MQTT
              </span>
            </div>
          </div>
        </header>

        {/* ── Main Grid ── */}
        <main className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── Left: Control Panel ── */}
          <section className="lg:col-span-5 flex flex-col">
            <div className="bg-white/90 backdrop-blur-sm shadow-2xl rounded-3xl p-8 md:p-10 flex flex-col items-center justify-between space-y-8 h-full border border-white/50">

              {/* Central circle — image or live data */}
              <div className="flex flex-col items-center space-y-6 flex-grow justify-center">
                <div className={`relative w-56 h-56 md:w-64 md:h-64 bg-gradient-to-br from-orange-50 to-orange-100 rounded-full flex items-center justify-center border-4 shadow-lg transition-all duration-500 ${
                  measurementState === "measuring" ? "border-orange-400 animate-pulse" :
                  measurementState === "completed" ? "border-green-400" :
                  "border-orange-200"
                }`}>
                  <div className="absolute w-48 h-48 md:w-56 md:h-56 rounded-full border-2 border-orange-200/60" />
                  <div className="absolute w-40 h-40 md:w-48 md:h-48 rounded-full border-2 border-orange-200/40" />

                  {measurementState === "completed" && height && weight ? (
                    // ── COMPLETED: large final values, green ✓ badge ──────
                    <div className="relative z-10 flex flex-col items-center justify-center px-2">
                      {/* Green checkmark badge */}
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-md z-20">
                        <span className="text-white text-sm font-bold">✓</span>
                      </div>
                      <div className="text-center mb-1">
                        <div className="text-[10px] text-green-600 font-bold uppercase tracking-widest mb-1">Height</div>
                        <div className="text-5xl font-extrabold text-[#F06922] leading-none">{height}</div>
                        <div className="text-sm text-gray-500 font-semibold mt-1">cm</div>
                      </div>
                      <div className="w-16 h-0.5 bg-gradient-to-r from-orange-200 via-orange-400 to-orange-200 my-2" />
                      <div className="text-center mt-1">
                        <div className="text-[10px] text-green-600 font-bold uppercase tracking-widest mb-1">Weight</div>
                        <div className="text-5xl font-extrabold text-[#F06922] leading-none">{weight}</div>
                        <div className="text-sm text-gray-500 font-semibold mt-1">kg</div>
                      </div>
                    </div>

                  ) : (height !== null || weight !== null) ? (
                    // ── MEASURING: show values as they arrive ─────────────
                    <div className="relative z-10 flex flex-col items-center justify-center px-4">
                      {height !== null ? (
                        <div className="text-center mb-2">
                          <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Height</div>
                          <div className="text-4xl font-bold text-[#F06922] leading-none">{height}</div>
                          <div className="text-sm text-gray-600 font-semibold mt-1">cm</div>
                        </div>
                      ) : (
                        <div className="text-center mb-2">
                          <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Height</div>
                          <div className="text-2xl font-bold text-gray-300">---</div>
                          <div className="text-xs text-gray-400 mt-1">measuring...</div>
                        </div>
                      )}
                      <div className="w-16 h-px bg-gray-300 my-2" />
                      {weight !== null ? (
                        <div className="text-center mt-2">
                          <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Weight</div>
                          <div className="text-4xl font-bold text-[#F06922] leading-none">{weight}</div>
                          <div className="text-sm text-gray-600 font-semibold mt-1">kg</div>
                        </div>
                      ) : (
                        <div className="text-center mt-2">
                          <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Weight</div>
                          <div className="text-2xl font-bold text-gray-300">---</div>
                          <div className="text-xs text-gray-400 mt-1">step on scale</div>
                        </div>
                      )}
                    </div>

                  ) : (
                    // ── IDLE: illustration ────────────────────────────────
                    <img
                      src={heightImage}
                      alt="Height Measurement"
                      className="relative z-10 w-48 h-48 md:w-56 md:h-56 object-cover rounded-full"
                    />
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="w-full space-y-4">
                <button
                  onClick={startMeasurement}
                  disabled={measurementState === "measuring" || !mqttConnected}
                  className={`w-full font-semibold text-lg py-4 px-6 rounded-full shadow-lg transition-all duration-300 ${
                    measurementState === "measuring" || !mqttConnected
                      ? "bg-gray-400 text-white cursor-not-allowed opacity-70"
                      : "bg-gradient-to-r from-[#F06922] to-[#E85C25] hover:from-[#E85C25] hover:to-[#D45513] text-white transform hover:scale-105"
                  }`}
                >
                  {!mqttConnected              ? "Device Not Connected" :
                   measurementState === "idle"      ? "Start Measurement" :
                   measurementState === "measuring"  ? "Measuring…" :
                   measurementState === "completed"  ? "Re-measure" :
                                                       "Try Again"}
                </button>

                {canProceed && (
                  <button
                    onClick={handleProceed}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold text-lg py-4 px-6 rounded-full shadow-lg hover:opacity-90 transition-all duration-300"
                  >
                    Save & Proceed →
                  </button>
                )}

                <button
                  onClick={handleRefresh}
                  className="w-full bg-white border-2 border-[#F06922] text-[#F06922] hover:bg-orange-50 font-semibold text-lg py-4 px-6 rounded-full transition-all duration-300 shadow-md"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </section>

          {/* ── Right: Status Stack ── */}
          <section className="lg:col-span-7 flex flex-col gap-6">

            {/* Card 1: Live Device Status + Timer */}
            <article className="bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl p-8 border border-white/50">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Live Device Status</h2>

              <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-6">
                {/* Waveform — animated when measuring */}
                <div className="flex-grow w-full h-24 flex items-center justify-start">
                  {measurementState === "measuring" ? (
                    <div className="flex items-end space-x-1 h-full">
                      {[...Array(20)].map((_, i) => (
                        <div
                          key={i}
                          className="w-2 bg-gradient-to-t from-orange-400 to-orange-600 rounded-t animate-pulse"
                          style={{ height: `${20 + ((i * 17 + 13) % 61)}px`, animationDelay: `${i * 0.1}s` }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-end space-x-1 h-full opacity-30">
                      {[...Array(20)].map((_, i) => (
                        <div key={i} className="w-2 bg-gray-300 rounded-t" style={{ height: "30px" }} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Countdown circle */}
                <div className="flex-shrink-0">
                  <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 shadow-lg flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle cx="56" cy="56" r="50" stroke="#f0f0f0" strokeWidth="6" fill="none" />
                      <circle
                        cx="56" cy="56" r="50"
                        stroke="#F06922" strokeWidth="6" fill="none"
                        strokeDasharray={`${2 * Math.PI * 50}`}
                        strokeDashoffset={`${2 * Math.PI * 50 * (1 - countdown / COUNTDOWN_SECONDS)}`}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="relative z-10 flex flex-col items-center justify-center bg-white rounded-full w-24 h-24">
                      <span className="text-4xl font-bold text-gray-800 leading-none">{countdown}s</span>
                      <span className="text-xs text-gray-500 font-medium mt-1">remaining</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-base font-semibold text-gray-700">
                {measurementState === "idle"      && "Status: Ready for Measurement"}
                {measurementState === "measuring"  && "Status: Measuring in Progress"}
                {measurementState === "completed"  && "Status: Measurement Complete ✅"}
                {measurementState === "error"      && "Status: Error — Please Try Again"}
              </p>
            </article>

            {/* Card 2: Live Message (from kiosk/status — filtered) */}
            <article className="bg-gradient-to-br from-white to-orange-50/50 backdrop-blur-sm shadow-xl rounded-3xl p-8 border-2 border-orange-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">💬</span> Live Message
              </h2>
              <p className="text-xl md:text-2xl font-bold text-[#F06922] leading-snug">
                {statusMessage}
              </p>
            </article>

            {/* Card 3: Instructions */}
            <article className="bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl p-8 border border-white/50">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">📋</span>
                <h2 className="text-xl font-bold text-gray-900">Instructions</h2>
              </div>
              <ul className="list-disc list-outside pl-6 space-y-3 text-gray-700 font-medium text-base">
                <li>Stand directly under the height sensor — stay still for ~20 seconds</li>
                <li>Look straight ahead, feet together</li>
                <li>After height is recorded, step on the weight scale barefoot</li>
                <li className="text-red-600 font-bold">Remove shoes, heavy items from pockets</li>
                <li>Both readings appear automatically — no need to click again</li>
              </ul>
            </article>
          </section>
        </main>
      </div>

      {/* Support Button */}
      <SupportButton page="Body Composition" />
    </div>
  );
};

export default BodyComposition;
