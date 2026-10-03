# scripts/update_report3_tap.py
import re

file_path = r"c:\Users\khanf\Downloads\reliv-frontend-main (2)\reliv-frontend-main\src\pages\Report3.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Biological Age card:
target_bio = """        {/* BIOLOGICAL AGE */}
        {biologicalAge && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{
              background: "#fdf4ff",
              border: "2px solid #e9d5ff",
              borderRadius: "16px",
              padding: "32px",
              marginBottom: "36px",
              textAlign: "center"
            }}
          >
            <div style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", color: "#9333ea", marginBottom: "12px" }}>
              Biological Age {scanCount >= 5 ? "• Delta Confirmed" : ""}
            </div>"""

replacement_bio = """        {/* BIOLOGICAL AGE */}
        {biologicalAge && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => handleCardSpeak('metabolicAge')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardSpeak('metabolicAge'); }}
            style={{
              background: "#fdf4ff",
              border: "2px solid #e9d5ff",
              borderRadius: "16px",
              padding: "32px",
              marginBottom: "36px",
              textAlign: "center",
              cursor: "pointer",
              boxShadow: "0 4px 18px rgba(147, 51, 234, 0.1)"
            }}
            className="hover:scale-[1.01] hover:border-purple-400 transition-all"
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "12px" }}>
              <span style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", color: "#9333ea" }}>
                Biological Age {scanCount >= 5 ? "• Delta Confirmed" : ""}
              </span>
              <span style={{ fontSize: "11px", fontWeight: "bold", color: "#9333ea", background: "#f3e8ff", padding: "2px 8px", borderRadius: "9999px" }}>
                🔊 Tap to listen
              </span>
            </div>"""

assert target_bio in content, "target_bio not found!"
content = content.replace(target_bio, replacement_bio, 1)

# 2. Muscle Mass card:
target_muscle = """            {/* Muscle Mass */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                background: "#ffffff",
                border: "2px solid #e5e7eb",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px"
                }}>
                  💪
                </div>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: "bold", color: "#111111" }}>Muscle Mass</div>
                  <div style={{ fontSize: "13px", color: "#9ca3af" }}>Skeletal Muscle %</div>
                </div>
              </div>"""

replacement_muscle = """            {/* Muscle Mass */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={() => handleCardSpeak('muscleMass')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardSpeak('muscleMass'); }}
              style={{
                background: "#ffffff",
                border: "2px solid #e5e7eb",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                cursor: "pointer"
              }}
              className="hover:scale-[1.01] hover:border-indigo-400 hover:shadow-lg transition-all"
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px"
                }}>
                  💪
                </div>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: "bold", color: "#111111" }}>Muscle Mass</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "13px", color: "#9ca3af" }}>Skeletal Muscle %</span>
                    <span style={{ fontSize: "10px", fontWeight: "bold", color: "#4f46e5", background: "#eef2ff", padding: "1px 6px", borderRadius: "9999px" }}>🔊 Tap</span>
                  </div>
                </div>
              </div>"""

assert target_muscle in content, "target_muscle not found!"
content = content.replace(target_muscle, replacement_muscle, 1)

# 3. Body Fat card:
target_fat = """            {/* Body Fat */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              style={{
                background: "#ffffff",
                border: "2px solid #e5e7eb",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  background: "linear-gradient(135deg, #ec4899, #f97316)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px"
                }}>
                  🔥
                </div>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: "bold", color: "#111111" }}>Body Fat</div>
                  <div style={{ fontSize: "13px", color: "#9ca3af" }}>Total Body Fat %</div>
                </div>
              </div>"""

replacement_fat = """            {/* Body Fat */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              onClick={() => handleCardSpeak('bodyFat')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardSpeak('bodyFat'); }}
              style={{
                background: "#ffffff",
                border: "2px solid #e5e7eb",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                cursor: "pointer"
              }}
              className="hover:scale-[1.01] hover:border-pink-400 hover:shadow-lg transition-all"
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  background: "linear-gradient(135deg, #ec4899, #f97316)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px"
                }}>
                  🔥
                </div>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: "bold", color: "#111111" }}>Body Fat</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "13px", color: "#9ca3af" }}>Total Body Fat %</span>
                    <span style={{ fontSize: "10px", fontWeight: "bold", color: "#e11d48", background: "#ffe4e6", padding: "1px 6px", borderRadius: "9999px" }}>🔊 Tap</span>
                  </div>
                </div>
              </div>"""

assert target_fat in content, "target_fat not found!"
content = content.replace(target_fat, replacement_fat, 1)

# 4. Visceral Fat card:
target_visc = """            {/* Visceral Fat */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                background: "#ffffff",
                border: "2px solid #e5e7eb",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  background: "linear-gradient(135deg, #f59e0b, #ef4444)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px"
                }}>
                  🫀
                </div>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: "bold", color: "#111111" }}>Visceral Fat</div>
                  <div style={{ fontSize: "13px", color: "#9ca3af" }}>Internal Fat Level</div>
                </div>
              </div>"""

replacement_visc = """            {/* Visceral Fat */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={() => handleCardSpeak('visceralFat')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardSpeak('visceralFat'); }}
              style={{
                background: "#ffffff",
                border: "2px solid #e5e7eb",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                cursor: "pointer"
              }}
              className="hover:scale-[1.01] hover:border-amber-400 hover:shadow-lg transition-all"
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  background: "linear-gradient(135deg, #f59e0b, #ef4444)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px"
                }}>
                  🫀
                </div>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: "bold", color: "#111111" }}>Visceral Fat</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "13px", color: "#9ca3af" }}>Internal Fat Level</span>
                    <span style={{ fontSize: "10px", fontWeight: "bold", color: "#d97706", background: "#fef3c7", padding: "1px 6px", borderRadius: "9999px" }}>🔊 Tap</span>
                  </div>
                </div>
              </div>"""

assert target_visc in content, "target_visc not found!"
content = content.replace(target_visc, replacement_visc, 1)

# 5. Supporting Metrics (Body Water, BMI, BMR):
target_support = """            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
              <div>
                <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "6px" }}>Body Water</div>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#111111", marginBottom: "4px" }}>
                  {metrics.waterPct}%
                </div>
                <div style={{
                  display: "inline-block",
                  background: "#dbeafe",
                  color: "#1e40af",
                  padding: "4px 10px",
                  borderRadius: "9999px",
                  fontSize: "12px",
                  fontWeight: "600"
                }}>
                  {getWaterStatus(metrics.waterPct).status}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "6px" }}>BMI</div>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#111111", marginBottom: "4px" }}>
                  {metrics.bmi}
                </div>
                <div style={{
                  display: "inline-block",
                  background: getBMIStatus(metrics.bmi) === "Healthy" ? "#d1fae5" : "#fed7aa",
                  color: getBMIStatus(metrics.bmi) === "Healthy" ? "#065f46" : "#9a3412",
                  padding: "4px 10px",
                  borderRadius: "9999px",
                  fontSize: "12px",
                  fontWeight: "600"
                }}>
                  {getBMIStatus(metrics.bmi)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "6px" }}>BMR (Basal Metabolic Rate)</div>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#111111", marginBottom: "4px" }}>
                  {metrics.bmr} cal/day
                </div>
                <div style={{
                  display: "inline-block",
                  background: "#e0e7ff",
                  color: "#4338ca",
                  padding: "4px 10px",
                  borderRadius: "9999px",
                  fontSize: "12px",
                  fontWeight: "600"
                }}>
                  {getBMRStatus(metrics.bmr)}
                </div>
              </div>
            </div>"""

replacement_support = """            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
              <div
                onClick={() => handleCardSpeak('hydration')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardSpeak('hydration'); }}
                style={{ cursor: "pointer", padding: "14px", borderRadius: "12px", background: "#ffffff", border: "1px solid #e5e7eb", transition: "all 0.2s" }}
                className="hover:scale-[1.02] hover:border-blue-300 hover:shadow-md"
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "13px", color: "#6b7280" }}>Body Water</span>
                  <span style={{ fontSize: "10px", fontWeight: "bold", color: "#2563eb", background: "#eff6ff", padding: "1px 6px", borderRadius: "9999px" }}>🔊 Tap</span>
                </div>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#111111", marginBottom: "4px" }}>
                  {metrics.waterPct}%
                </div>
                <div style={{
                  display: "inline-block",
                  background: "#dbeafe",
                  color: "#1e40af",
                  padding: "4px 10px",
                  borderRadius: "9999px",
                  fontSize: "12px",
                  fontWeight: "600"
                }}>
                  {getWaterStatus(metrics.waterPct).status}
                </div>
              </div>
              <div
                onClick={() => handleCardSpeak('bmi')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardSpeak('bmi'); }}
                style={{ cursor: "pointer", padding: "14px", borderRadius: "12px", background: "#ffffff", border: "1px solid #e5e7eb", transition: "all 0.2s" }}
                className="hover:scale-[1.02] hover:border-emerald-300 hover:shadow-md"
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "13px", color: "#6b7280" }}>BMI</span>
                  <span style={{ fontSize: "10px", fontWeight: "bold", color: "#059669", background: "#ecfdf5", padding: "1px 6px", borderRadius: "9999px" }}>🔊 Tap</span>
                </div>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#111111", marginBottom: "4px" }}>
                  {metrics.bmi}
                </div>
                <div style={{
                  display: "inline-block",
                  background: getBMIStatus(metrics.bmi) === "Healthy" ? "#d1fae5" : "#fed7aa",
                  color: getBMIStatus(metrics.bmi) === "Healthy" ? "#065f46" : "#9a3412",
                  padding: "4px 10px",
                  borderRadius: "9999px",
                  fontSize: "12px",
                  fontWeight: "600"
                }}>
                  {getBMIStatus(metrics.bmi)}
                </div>
              </div>
              <div
                onClick={() => handleCardSpeak('dailyCalories')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardSpeak('dailyCalories'); }}
                style={{ cursor: "pointer", padding: "14px", borderRadius: "12px", background: "#ffffff", border: "1px solid #e5e7eb", transition: "all 0.2s" }}
                className="hover:scale-[1.02] hover:border-indigo-300 hover:shadow-md"
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "13px", color: "#6b7280" }}>BMR (Calories)</span>
                  <span style={{ fontSize: "10px", fontWeight: "bold", color: "#4f46e5", background: "#eef2ff", padding: "1px 6px", borderRadius: "9999px" }}>🔊 Tap</span>
                </div>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#111111", marginBottom: "4px" }}>
                  {metrics.bmr} cal/day
                </div>
                <div style={{
                  display: "inline-block",
                  background: "#e0e7ff",
                  color: "#4338ca",
                  padding: "4px 10px",
                  borderRadius: "9999px",
                  fontSize: "12px",
                  fontWeight: "600"
                }}>
                  {getBMRStatus(metrics.bmr)}
                </div>
              </div>
            </div>"""

assert target_support in content, "target_support not found!"
content = content.replace(target_support, replacement_support, 1)

# 6. Bone Mass (Scan 2+) in Tissue Composition:
target_bone = """              {/* Bone Mass (Scan 2+) */}
              {scanCount >= 2 && boneMassData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  style={{
                    background: "linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)",
                    border: "2px solid #d8b4fe",
                    borderRadius: "14px",
                    padding: "22px",
                    boxShadow: "0 4px 14px rgba(167, 139, 250, 0.15)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      background: "linear-gradient(135deg, #a855f7, #7c3aed)",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px"
                    }}>
                      🦴
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#581c87" }}>Bone Mass</div>
                      <div style={{ fontSize: "12px", color: "#7e22ce" }}>Skeletal Strength</div>
                    </div>
                  </div>"""

replacement_bone = """              {/* Bone Mass (Scan 2+) */}
              {scanCount >= 2 && boneMassData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  onClick={() => handleCardSpeak('boneMass')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardSpeak('boneMass'); }}
                  style={{
                    background: "linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)",
                    border: "2px solid #d8b4fe",
                    borderRadius: "14px",
                    padding: "22px",
                    boxShadow: "0 4px 14px rgba(167, 139, 250, 0.15)",
                    cursor: "pointer"
                  }}
                  className="hover:scale-[1.01] hover:border-purple-400 hover:shadow-lg transition-all"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      background: "linear-gradient(135deg, #a855f7, #7c3aed)",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px"
                    }}>
                      🦴
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#581c87" }}>Bone Mass</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", color: "#7e22ce" }}>Skeletal Strength</span>
                        <span style={{ fontSize: "10px", fontWeight: "bold", color: "#6b21a8", background: "#f3e8ff", padding: "1px 6px", borderRadius: "9999px" }}>🔊 Tap</span>
                      </div>
                    </div>
                  </div>"""

assert target_bone in content, "target_bone not found!"
content = content.replace(target_bone, replacement_bone, 1)

# 7. Protein Mass (Scan 3+) in Tissue Composition:
target_protein = """              {/* Protein Mass + Percent (Scan 3+) */}
              {scanCount >= 3 && proteinData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 }}
                  style={{
                    background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                    border: "2px solid #fbbf24",
                    borderRadius: "14px",
                    padding: "22px",
                    boxShadow: "0 4px 14px rgba(251, 191, 36, 0.15)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      background: "linear-gradient(135deg, #f59e0b, #d97706)",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px"
                    }}>
                      🥚
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#78350f" }}>Protein Mass</div>
                      <div style={{ fontSize: "12px", color: "#92400e" }}>Building Blocks</div>
                    </div>
                  </div>"""

replacement_protein = """              {/* Protein Mass + Percent (Scan 3+) */}
              {scanCount >= 3 && proteinData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 }}
                  onClick={() => handleCardSpeak('protein')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardSpeak('protein'); }}
                  style={{
                    background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                    border: "2px solid #fbbf24",
                    borderRadius: "14px",
                    padding: "22px",
                    boxShadow: "0 4px 14px rgba(251, 191, 36, 0.15)",
                    cursor: "pointer"
                  }}
                  className="hover:scale-[1.01] hover:border-amber-400 hover:shadow-lg transition-all"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      background: "linear-gradient(135deg, #f59e0b, #d97706)",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px"
                    }}>
                      🥚
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#78350f" }}>Protein Mass</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", color: "#92400e" }}>Building Blocks</span>
                        <span style={{ fontSize: "10px", fontWeight: "bold", color: "#92400e", background: "#fef3c7", padding: "1px 6px", borderRadius: "9999px" }}>🔊 Tap</span>
                      </div>
                    </div>
                  </div>"""

assert target_protein in content, "target_protein not found!"
content = content.replace(target_protein, replacement_protein, 1)

# 8. LBMI (Scan 4+) in Tissue Composition:
target_lbmi = """              {/* LBMI (Scan 4+) */}
              {scanCount >= 4 && lbmiData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
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
                      💎
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#1e3a8a" }}>LBMI</div>
                      <div style={{ fontSize: "12px", color: "#1e40af" }}>Lean Body Mass Quality</div>
                    </div>
                  </div>"""

replacement_lbmi = """              {/* LBMI (Scan 4+) */}
              {scanCount >= 4 && lbmiData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => handleCardSpeak('muscleMass')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardSpeak('muscleMass'); }}
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
                      💎
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#1e3a8a" }}>LBMI</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", color: "#1e40af" }}>Lean Body Mass Quality</span>
                        <span style={{ fontSize: "10px", fontWeight: "bold", color: "#1e40af", background: "#dbeafe", padding: "1px 6px", borderRadius: "9999px" }}>🔊 Tap</span>
                      </div>
                    </div>
                  </div>"""

assert target_lbmi in content, "target_lbmi not found!"
content = content.replace(target_lbmi, replacement_lbmi, 1)

# 9. Structural Mass % (Scan 5+) in Tissue Composition:
target_struct = """              {/* Structural Mass % (Scan 5+) */}
              {scanCount >= 5 && structuralData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 }}
                  style={{
                    background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
                    border: "2px solid #34d399",
                    borderRadius: "14px",
                    padding: "22px",
                    boxShadow: "0 4px 14px rgba(52, 211, 153, 0.15)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      background: "linear-gradient(135deg, #10b981, #059669)",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px"
                    }}>
                      🏛️
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#064e3b" }}>Structural Mass</div>
                      <div style={{ fontSize: "12px", color: "#065f46" }}>Bone + Muscle Framework</div>
                    </div>
                  </div>"""

replacement_struct = """              {/* Structural Mass % (Scan 5+) */}
              {scanCount >= 5 && structuralData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 }}
                  onClick={() => handleCardSpeak('boneMass')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardSpeak('boneMass'); }}
                  style={{
                    background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
                    border: "2px solid #34d399",
                    borderRadius: "14px",
                    padding: "22px",
                    boxShadow: "0 4px 14px rgba(52, 211, 153, 0.15)",
                    cursor: "pointer"
                  }}
                  className="hover:scale-[1.01] hover:border-emerald-400 hover:shadow-lg transition-all"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      background: "linear-gradient(135deg, #10b981, #059669)",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px"
                    }}>
                      🏛️
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#064e3b" }}>Structural Mass</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", color: "#065f46" }}>Bone + Muscle Framework</span>
                        <span style={{ fontSize: "10px", fontWeight: "bold", color: "#065f46", background: "#d1fae5", padding: "1px 6px", borderRadius: "9999px" }}>🔊 Tap</span>
                      </div>
                    </div>
                  </div>"""

assert target_struct in content, "target_struct not found!"
content = content.replace(target_struct, replacement_struct, 1)

# 10. Subcutaneous Fat % (Scan 5+) in Tissue Composition:
target_subcut = """              {/* Subcutaneous Fat % (Scan 5+) */}
              {scanCount >= 5 && subcutFatData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  style={{
                    background: "linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)",
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
                      📊
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#7f1d1d" }}>Subcutaneous Fat</div>
                      <div style={{ fontSize: "12px", color: "#991b1b" }}>Under-skin Fat Distribution</div>
                    </div>
                  </div>"""

replacement_subcut = """              {/* Subcutaneous Fat % (Scan 5+) */}
              {scanCount >= 5 && subcutFatData.status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => handleCardSpeak('subcutaneousFat')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardSpeak('subcutaneousFat'); }}
                  style={{
                    background: "linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)",
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
                      📊
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#7f1d1d" }}>Subcutaneous Fat</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", color: "#991b1b" }}>Under-skin Fat Distribution</span>
                        <span style={{ fontSize: "10px", fontWeight: "bold", color: "#991b1b", background: "#fecaca", padding: "1px 6px", borderRadius: "9999px" }}>🔊 Tap</span>
                      </div>
                    </div>
                  </div>"""

assert target_subcut in content, "target_subcut not found!"
content = content.replace(target_subcut, replacement_subcut, 1)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Successfully updated Report3.jsx with tap-to-speak!")
