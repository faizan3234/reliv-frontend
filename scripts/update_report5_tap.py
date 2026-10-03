# scripts/update_report5_tap.py
import re

file_path = r"c:\Users\khanf\Downloads\reliv-frontend-main (2)\reliv-frontend-main\src\pages\Report5.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add handleCardSpeak
target_handlers = """    const text = getReport5Speech(speechPayload, newLang);
    speakText(text, { langHint: newLang });
  }, [data, patient, vitals, setReportSpeechLanguage, speakText]);"""

replacement_handlers = """    const text = getReport5Speech(speechPayload, newLang);
    speakText(text, { langHint: newLang });
  }, [data, patient, vitals, setReportSpeechLanguage, speakText]);

  const handleCardSpeak = (metricKey) => {
    window.dispatchEvent(new CustomEvent('reliv_speak_metric', { detail: metricKey }));
  };"""

assert target_handlers in content, "target_handlers not found!"
content = content.replace(target_handlers, replacement_handlers, 1)

# 2. Update availableMetrics in ReportVoiceExplainer
old_metrics = "availableMetrics={['metabolicAge', 'bodyScore', 'hydration']}"
new_metrics = """availableMetrics={[
            'dataConfidence',
            'standardWeight',
            'eyesight',
            'bloodPressure',
            'pulse',
            'oxygen',
            'temperature',
            'bodyScore',
            'metabolicAge'
          ]}"""

assert old_metrics in content, "old_metrics not found!"
content = content.replace(old_metrics, new_metrics, 1)

# 3. Scan Count milestone banner
target_banner = """          {scanCount < 7 && (
            <div style={{ marginTop: "16px", padding: "12px 24px", background: "#fef3c7", border: "2px solid #fbbf24", borderRadius: "12px", display: "inline-block" }}>
              <span style={{ fontSize: "15px", fontWeight: "600", color: "#92400e" }}>
                {scanCount === 1 && "📊 Initial Baseline — Building your health profile"}
                {scanCount === 2 && "🔄 Pattern Recognition — Detecting early trends"}
                {scanCount === 3 && "📈 Composition Analysis — Body metrics now visible"}
                {scanCount === 4 && "🎯 Trend Confirmation — Changes becoming clear"}
                {scanCount === 5 && "Five visits recorded"}
                {scanCount === 6 && "Six visits recorded"}
              </span>
            </div>
          )}
          {scanCount >= 7 && (
            <div style={{ marginTop: "16px", padding: "14px 28px", background: "#d1fae5", border: "2px solid #6ee7b7", borderRadius: "12px", display: "inline-block" }}>
              <span style={{ fontSize: "16px", fontWeight: "700", color: "#065f46" }}>
                Seven visits recorded — current measurements shown
              </span>
            </div>
          )}"""

replacement_banner = """          {scanCount < 7 && (
            <div
              onClick={() => handleCardSpeak('dataConfidence')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardSpeak('dataConfidence'); }}
              style={{ marginTop: "16px", padding: "12px 24px", background: "#fef3c7", border: "2px solid #fbbf24", borderRadius: "12px", display: "inline-flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
              className="hover:scale-[1.02] hover:shadow-md transition-all"
            >
              <span style={{ fontSize: "15px", fontWeight: "600", color: "#92400e" }}>
                {scanCount === 1 && "📊 Initial Baseline — Building your health profile"}
                {scanCount === 2 && "🔄 Pattern Recognition — Detecting early trends"}
                {scanCount === 3 && "📈 Composition Analysis — Body metrics now visible"}
                {scanCount === 4 && "🎯 Trend Confirmation — Changes becoming clear"}
                {scanCount === 5 && "Five visits recorded"}
                {scanCount === 6 && "Six visits recorded"}
              </span>
              <span style={{ fontSize: "11px", fontWeight: "bold", color: "#92400e", background: "#fde68a", padding: "2px 8px", borderRadius: "9999px" }}>
                🔊 Tap to listen
              </span>
            </div>
          )}
          {scanCount >= 7 && (
            <div
              onClick={() => handleCardSpeak('dataConfidence')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardSpeak('dataConfidence'); }}
              style={{ marginTop: "16px", padding: "14px 28px", background: "#d1fae5", border: "2px solid #6ee7b7", borderRadius: "12px", display: "inline-flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
              className="hover:scale-[1.02] hover:shadow-md transition-all"
            >
              <span style={{ fontSize: "16px", fontWeight: "700", color: "#065f46" }}>
                Seven visits recorded — all 112 data points confirmed
              </span>
              <span style={{ fontSize: "11px", fontWeight: "bold", color: "#065f46", background: "#a7f3d0", padding: "2px 8px", borderRadius: "9999px" }}>
                🔊 Tap to listen
              </span>
            </div>
          )}"""

assert target_banner in content, "target_banner not found!"
content = content.replace(target_banner, replacement_banner, 1)

# 4. Stress Index
target_stress = """                  <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e5e5e5", textAlign: "center" }}>
                    <div style={{ fontSize: "15px", color: "#666666", marginBottom: "8px" }}>Stress Index</div>"""

replacement_stress = """                  <div
                    onClick={() => handleCardSpeak('pulse')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardSpeak('pulse'); }}
                    style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e5e5e5", textAlign: "center", cursor: "pointer" }}
                    className="hover:scale-[1.02] hover:border-amber-300 hover:shadow-md transition-all"
                  >
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                      <span style={{ fontSize: "15px", color: "#666666" }}>Stress Index</span>
                      <span style={{ fontSize: "10px", fontWeight: "bold", color: "#d97706", background: "#fef3c7", padding: "1px 6px", borderRadius: "9999px" }}>🔊 Tap</span>
                    </div>"""

assert target_stress in content, "target_stress not found!"
content = content.replace(target_stress, replacement_stress, 1)

# 5. Cardio Fitness
target_cardio = """                  <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e5e5e5", textAlign: "center" }}>
                    <div style={{ fontSize: "15px", color: "#666666", marginBottom: "8px" }}>Cardio Fitness</div>"""

replacement_cardio = """                  <div
                    onClick={() => handleCardSpeak('bloodPressure')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardSpeak('bloodPressure'); }}
                    style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e5e5e5", textAlign: "center", cursor: "pointer" }}
                    className="hover:scale-[1.02] hover:border-green-300 hover:shadow-md transition-all"
                  >
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                      <span style={{ fontSize: "15px", color: "#666666" }}>Cardio Fitness</span>
                      <span style={{ fontSize: "10px", fontWeight: "bold", color: "#059669", background: "#d1fae5", padding: "1px 6px", borderRadius: "9999px" }}>🔊 Tap</span>
                    </div>"""

assert target_cardio in content, "target_cardio not found!"
content = content.replace(target_cardio, replacement_cardio, 1)

# 6. Respiratory Health
target_resp = """                  <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e5e5e5", textAlign: "center" }}>
                    <div style={{ fontSize: "15px", color: "#666666", marginBottom: "8px" }}>Respiratory Health</div>"""

replacement_resp = """                  <div
                    onClick={() => handleCardSpeak('oxygen')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardSpeak('oxygen'); }}
                    style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e5e5e5", textAlign: "center", cursor: "pointer" }}
                    className="hover:scale-[1.02] hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                      <span style={{ fontSize: "15px", color: "#666666" }}>Respiratory Health</span>
                      <span style={{ fontSize: "10px", fontWeight: "bold", color: "#2563eb", background: "#eff6ff", padding: "1px 6px", borderRadius: "9999px" }}>🔊 Tap</span>
                    </div>"""

assert target_resp in content, "target_resp not found!"
content = content.replace(target_resp, replacement_resp, 1)

# 7. Recovery Readiness
target_recovery = """                  <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e5e5e5", textAlign: "center" }}>
                    <div style={{ fontSize: "15px", color: "#666666", marginBottom: "8px" }}>Recovery Readiness</div>"""

replacement_recovery = """                  <div
                    onClick={() => handleCardSpeak('temperature')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardSpeak('temperature'); }}
                    style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e5e5e5", textAlign: "center", cursor: "pointer" }}
                    className="hover:scale-[1.02] hover:border-purple-300 hover:shadow-md transition-all"
                  >
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                      <span style={{ fontSize: "15px", color: "#666666" }}>Recovery Readiness</span>
                      <span style={{ fontSize: "10px", fontWeight: "bold", color: "#7c3aed", background: "#ede9fe", padding: "1px 6px", borderRadius: "9999px" }}>🔊 Tap</span>
                    </div>"""

assert target_recovery in content, "target_recovery not found!"
content = content.replace(target_recovery, replacement_recovery, 1)

# 8. Vision Assessment
target_vision = """        {/* Eye Sight Assessment */}
        {vitals.leftEye && vitals.rightEye && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            style={{
              marginBottom: "48px",
              padding: "28px",
              background: "linear-gradient(135deg, #fef3e8 0%, #fff5eb 100%)",
              border: "2px solid #fed7aa",
              borderRadius: "16px",
            }}
          >
            <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px", color: "#111111" }}>
              👁️ Vision Assessment
            </h2>"""

replacement_vision = """        {/* Eye Sight Assessment */}
        {vitals.leftEye && vitals.rightEye && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            onClick={() => handleCardSpeak('eyesight')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardSpeak('eyesight'); }}
            style={{
              marginBottom: "48px",
              padding: "28px",
              background: "linear-gradient(135deg, #fef3e8 0%, #fff5eb 100%)",
              border: "2px solid #fed7aa",
              borderRadius: "16px",
              cursor: "pointer"
            }}
            className="hover:scale-[1.01] hover:border-orange-400 hover:shadow-lg transition-all"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#111111", margin: 0 }}>
                👁️ Vision Assessment
              </h2>
              <span style={{ fontSize: "11px", fontWeight: "bold", color: "#ea580c", background: "#ffedd5", padding: "3px 10px", borderRadius: "9999px" }}>
                🔊 Tap to listen
              </span>
            </div>"""

assert target_vision in content, "target_vision not found!"
content = content.replace(target_vision, replacement_vision, 1)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Successfully updated Report5.jsx with tap-to-speak!")
