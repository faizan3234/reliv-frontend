# scripts/update_report4_tap.py
import re

file_path = r"c:\Users\khanf\Downloads\reliv-frontend-main (2)\reliv-frontend-main\src\pages\Report4.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add handleCardSpeak
target_handlers = """    const text = getReport4Speech(speechPayload, newLang);
    speakText(text, { langHint: newLang });
  }, [data, patient, vitals, setReportSpeechLanguage, speakText]);"""

replacement_handlers = """    const text = getReport4Speech(speechPayload, newLang);
    speakText(text, { langHint: newLang });
  }, [data, patient, vitals, setReportSpeechLanguage, speakText]);

  const handleCardSpeak = (metricKey) => {
    window.dispatchEvent(new CustomEvent('reliv_speak_metric', { detail: metricKey }));
  };"""

assert target_handlers in content, "target_handlers not found!"
content = content.replace(target_handlers, replacement_handlers, 1)

# 2. Update availableMetrics in locked and unlocked ReportVoiceExplainer
old_metrics = "availableMetrics={['bloodPressure', 'oxygen', 'pulse', 'temperature']}"
new_metrics = "availableMetrics={['bloodPressure', 'pulse', 'oxygen', 'temperature', 'fatMuscleRatio', 'hydration', 'efficiency', 'dataConfidence']}"
assert content.count(old_metrics) == 2, f"Expected 2 occurrences of old_metrics, found {content.count(old_metrics)}"
content = content.replace(old_metrics, new_metrics)

# 3. Baseline Metrics Preview (Scan 1)
target_baseline = """              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
                {vitals.systolic && vitals.diastolic && (
                  <div style={{ textAlign: "center", padding: "16px", background: "#fef2f2", borderRadius: "12px" }}>
                    <div style={{ fontSize: "14px", color: "#dc2626", fontWeight: "600", marginBottom: "8px" }}>Blood Pressure</div>
                    <div style={{ fontSize: "28px", fontWeight: "bold", color: "#111111" }}>
                      {vitals.systolic}/{vitals.diastolic}
                    </div>
                    <div style={{ fontSize: "12px", color: "#888888", marginTop: "4px" }}>mmHg</div>
                  </div>
                )}
                {vitals.bpm && (
                  <div style={{ textAlign: "center", padding: "16px", background: "#f0fdf4", borderRadius: "12px" }}>
                    <div style={{ fontSize: "14px", color: "#10b981", fontWeight: "600", marginBottom: "8px" }}>Pulse</div>
                    <div style={{ fontSize: "28px", fontWeight: "bold", color: "#111111" }}>
                      {vitals.bpm}
                    </div>
                    <div style={{ fontSize: "12px", color: "#888888", marginTop: "4px" }}>BPM</div>
                  </div>
                )}
                {vitals.oxygen && (
                  <div style={{ textAlign: "center", padding: "16px", background: "#faf5ff", borderRadius: "12px" }}>
                    <div style={{ fontSize: "14px", color: "#a855f7", fontWeight: "600", marginBottom: "8px" }}>Oxygen</div>
                    <div style={{ fontSize: "28px", fontWeight: "bold", color: "#111111" }}>
                      {vitals.oxygen}%
                    </div>
                    <div style={{ fontSize: "12px", color: "#888888", marginTop: "4px" }}>SpO₂</div>
                  </div>
                )}
                {vitals.temperature && (
                  <div style={{ textAlign: "center", padding: "16px", background: "#fff7ed", borderRadius: "12px" }}>
                    <div style={{ fontSize: "14px", color: "#f97316", fontWeight: "600", marginBottom: "8px" }}>Temperature</div>
                    <div style={{ fontSize: "28px", fontWeight: "bold", color: "#111111" }}>
                      {vitals.temperature}°F
                    </div>
                    <div style={{ fontSize: "12px", color: "#888888", marginTop: "4px" }}>Body Temp</div>
                  </div>
                )}
              </div>"""

replacement_baseline = """              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
                {vitals.systolic && vitals.diastolic && (
                  <div
                    onClick={() => handleCardSpeak('bloodPressure')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardSpeak('bloodPressure'); }}
                    style={{ textAlign: "center", padding: "16px", background: "#fef2f2", borderRadius: "12px", cursor: "pointer" }}
                    className="hover:scale-[1.02] hover:border hover:border-red-300 transition-all"
                  >
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                      <span style={{ fontSize: "14px", color: "#dc2626", fontWeight: "600" }}>Blood Pressure</span>
                      <span style={{ fontSize: "10px", fontWeight: "bold", color: "#dc2626", background: "#fee2e2", padding: "1px 6px", borderRadius: "9999px" }}>🔊 Tap</span>
                    </div>
                    <div style={{ fontSize: "28px", fontWeight: "bold", color: "#111111" }}>
                      {vitals.systolic}/{vitals.diastolic}
                    </div>
                    <div style={{ fontSize: "12px", color: "#888888", marginTop: "4px" }}>mmHg</div>
                  </div>
                )}
                {vitals.bpm && (
                  <div
                    onClick={() => handleCardSpeak('pulse')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardSpeak('pulse'); }}
                    style={{ textAlign: "center", padding: "16px", background: "#f0fdf4", borderRadius: "12px", cursor: "pointer" }}
                    className="hover:scale-[1.02] hover:border hover:border-emerald-300 transition-all"
                  >
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                      <span style={{ fontSize: "14px", color: "#10b981", fontWeight: "600" }}>Pulse</span>
                      <span style={{ fontSize: "10px", fontWeight: "bold", color: "#059669", background: "#d1fae5", padding: "1px 6px", borderRadius: "9999px" }}>🔊 Tap</span>
                    </div>
                    <div style={{ fontSize: "28px", fontWeight: "bold", color: "#111111" }}>
                      {vitals.bpm}
                    </div>
                    <div style={{ fontSize: "12px", color: "#888888", marginTop: "4px" }}>BPM</div>
                  </div>
                )}
                {vitals.oxygen && (
                  <div
                    onClick={() => handleCardSpeak('oxygen')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardSpeak('oxygen'); }}
                    style={{ textAlign: "center", padding: "16px", background: "#faf5ff", borderRadius: "12px", cursor: "pointer" }}
                    className="hover:scale-[1.02] hover:border hover:border-purple-300 transition-all"
                  >
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                      <span style={{ fontSize: "14px", color: "#a855f7", fontWeight: "600" }}>Oxygen</span>
                      <span style={{ fontSize: "10px", fontWeight: "bold", color: "#7c3aed", background: "#ede9fe", padding: "1px 6px", borderRadius: "9999px" }}>🔊 Tap</span>
                    </div>
                    <div style={{ fontSize: "28px", fontWeight: "bold", color: "#111111" }}>
                      {vitals.oxygen}%
                    </div>
                    <div style={{ fontSize: "12px", color: "#888888", marginTop: "4px" }}>SpO₂</div>
                  </div>
                )}
                {vitals.temperature && (
                  <div
                    onClick={() => handleCardSpeak('temperature')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardSpeak('temperature'); }}
                    style={{ textAlign: "center", padding: "16px", background: "#fff7ed", borderRadius: "12px", cursor: "pointer" }}
                    className="hover:scale-[1.02] hover:border hover:border-orange-300 transition-all"
                  >
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                      <span style={{ fontSize: "14px", color: "#f97316", fontWeight: "600" }}>Temperature</span>
                      <span style={{ fontSize: "10px", fontWeight: "bold", color: "#ea580c", background: "#ffedd5", padding: "1px 6px", borderRadius: "9999px" }}>🔊 Tap</span>
                    </div>
                    <div style={{ fontSize: "28px", fontWeight: "bold", color: "#111111" }}>
                      {vitals.temperature}°F
                    </div>
                    <div style={{ fontSize: "12px", color: "#888888", marginTop: "4px" }}>Body Temp</div>
                  </div>
                )}
              </div>"""

assert target_baseline in content, "target_baseline not found!"
content = content.replace(target_baseline, replacement_baseline, 1)

# 4. Fat-Muscle Ratio (Scan 2+)
target_fm = """              {/* Fat-Muscle Ratio (Scan 2+) */}
              {scanCount >= 2 && fatMuscleRatioData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  style={{
                    background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
                    border: "2px solid #f87171",
                    borderRadius: "14px",
                    padding: "22px",
                    boxShadow: "0 4px 14px rgba(248, 113, 113, 0.15)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      background: "linear-gradient(135deg, #ef4444, #dc2626)",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px"
                    }}>
                      ⚖️
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#7f1d1d" }}>Fat-Muscle Ratio</div>
                      <div style={{ fontSize: "12px", color: "#991b1b" }}>Body Composition Balance</div>
                    </div>
                  </div>"""

replacement_fm = """              {/* Fat-Muscle Ratio (Scan 2+) */}
              {scanCount >= 2 && fatMuscleRatioData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  onClick={() => handleCardSpeak('fatMuscleRatio')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardSpeak('fatMuscleRatio'); }}
                  style={{
                    background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
                    border: "2px solid #f87171",
                    borderRadius: "14px",
                    padding: "22px",
                    boxShadow: "0 4px 14px rgba(248, 113, 113, 0.15)",
                    cursor: "pointer"
                  }}
                  className="hover:scale-[1.01] hover:border-red-400 hover:shadow-lg transition-all"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      background: "linear-gradient(135deg, #ef4444, #dc2626)",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px"
                    }}>
                      ⚖️
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#7f1d1d" }}>Fat-Muscle Ratio</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", color: "#991b1b" }}>Body Composition Balance</span>
                        <span style={{ fontSize: "10px", fontWeight: "bold", color: "#991b1b", background: "#fee2e2", padding: "1px 6px", borderRadius: "9999px" }}>🔊 Tap</span>
                      </div>
                    </div>
                  </div>"""

assert target_fm in content, "target_fm not found!"
content = content.replace(target_fm, replacement_fm, 1)

# 5. Hydration Efficiency (Scan 3+)
target_hyd = """              {/* Hydration Efficiency (Scan 3+) */}
              {scanCount >= 3 && hydrationData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 }}
                  style={{
                    background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
                    border: "2px solid #60a5fa",
                    borderRadius: "14px",
                    padding: "22px",
                    boxShadow: "0 4px 14px rgba(96, 165, 250, 0.15)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px"
                    }}>
                      💧
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#1e3a8a" }}>Hydration Efficiency</div>
                      <div style={{ fontSize: "12px", color: "#1e40af" }}>Water-Muscle Balance</div>
                    </div>
                  </div>"""

replacement_hyd = """              {/* Hydration Efficiency (Scan 3+) */}
              {scanCount >= 3 && hydrationData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 }}
                  onClick={() => handleCardSpeak('hydration')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardSpeak('hydration'); }}
                  style={{
                    background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
                    border: "2px solid #60a5fa",
                    borderRadius: "14px",
                    padding: "22px",
                    boxShadow: "0 4px 14px rgba(96, 165, 250, 0.15)",
                    cursor: "pointer"
                  }}
                  className="hover:scale-[1.01] hover:border-blue-400 hover:shadow-lg transition-all"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px"
                    }}>
                      💧
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#1e3a8a" }}>Hydration Efficiency</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", color: "#1e40af" }}>Water-Muscle Balance</span>
                        <span style={{ fontSize: "10px", fontWeight: "bold", color: "#1e40af", background: "#dbeafe", padding: "1px 6px", borderRadius: "9999px" }}>🔊 Tap</span>
                      </div>
                    </div>
                  </div>"""

assert target_hyd in content, "target_hyd not found!"
content = content.replace(target_hyd, replacement_hyd, 1)

# 6. Metabolic Load (Scan 3+)
target_ml = """              {/* Metabolic Load (Scan 3+) */}
              {scanCount >= 3 && metabolicLoadData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  style={{
                    background: "linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)",
                    border: "2px solid #fb923c",
                    borderRadius: "14px",
                    padding: "22px",
                    boxShadow: "0 4px 14px rgba(251, 146, 60, 0.15)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      background: "linear-gradient(135deg, #f97316, #ea580c)",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px"
                    }}>
                      ⚡
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#7c2d12" }}>Metabolic Load</div>
                      <div style={{ fontSize: "12px", color: "#9a3412" }}>Body Stress Level</div>
                    </div>
                  </div>"""

replacement_ml = """              {/* Metabolic Load (Scan 3+) */}
              {scanCount >= 3 && metabolicLoadData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => handleCardSpeak('efficiency')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardSpeak('efficiency'); }}
                  style={{
                    background: "linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)",
                    border: "2px solid #fb923c",
                    borderRadius: "14px",
                    padding: "22px",
                    boxShadow: "0 4px 14px rgba(251, 146, 60, 0.15)",
                    cursor: "pointer"
                  }}
                  className="hover:scale-[1.01] hover:border-orange-400 hover:shadow-lg transition-all"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      background: "linear-gradient(135deg, #f97316, #ea580c)",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px"
                    }}>
                      ⚡
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#7c2d12" }}>Metabolic Load</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", color: "#9a3412" }}>Body Stress Level</span>
                        <span style={{ fontSize: "10px", fontWeight: "bold", color: "#c2410c", background: "#ffedd5", padding: "1px 6px", borderRadius: "9999px" }}>🔊 Tap</span>
                      </div>
                    </div>
                  </div>"""

assert target_ml in content, "target_ml not found!"
content = content.replace(target_ml, replacement_ml, 1)

# 7. Energy Reserve Score (Scan 4+)
target_er = """              {/* Energy Reserve Score (Scan 4+) */}
              {scanCount >= 4 && energyReserveData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 }}
                  style={{
                    background: "linear-gradient(135deg, #fef3c7 0%, #fde047 100%)",
                    border: "2px solid #facc15",
                    borderRadius: "14px",
                    padding: "22px",
                    boxShadow: "0 4px 14px rgba(250, 204, 21, 0.15)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      background: "linear-gradient(135deg, #eab308, #ca8a04)",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px"
                    }}>
                      🔋
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#78350f" }}>Energy Reserve</div>
                      <div style={{ fontSize: "12px", color: "#854d0e" }}>Fuel Storage Score</div>
                    </div>
                  </div>"""

replacement_er = """              {/* Energy Reserve Score (Scan 4+) */}
              {scanCount >= 4 && energyReserveData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 }}
                  onClick={() => handleCardSpeak('efficiency')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardSpeak('efficiency'); }}
                  style={{
                    background: "linear-gradient(135deg, #fef3c7 0%, #fde047 100%)",
                    border: "2px solid #facc15",
                    borderRadius: "14px",
                    padding: "22px",
                    boxShadow: "0 4px 14px rgba(250, 204, 21, 0.15)",
                    cursor: "pointer"
                  }}
                  className="hover:scale-[1.01] hover:border-yellow-400 hover:shadow-lg transition-all"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      background: "linear-gradient(135deg, #eab308, #ca8a04)",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px"
                    }}>
                      🔋
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#78350f" }}>Energy Reserve</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", color: "#854d0e" }}>Fuel Storage Score</span>
                        <span style={{ fontSize: "10px", fontWeight: "bold", color: "#854d0e", background: "#fef9c3", padding: "1px 6px", borderRadius: "9999px" }}>🔊 Tap</span>
                      </div>
                    </div>
                  </div>"""

assert target_er in content, "target_er not found!"
content = content.replace(target_er, replacement_er, 1)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Successfully updated Report4.jsx with tap-to-speak!")
