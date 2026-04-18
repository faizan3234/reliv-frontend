/**
 * Premium Progressive PDF report — test harness.
 * Each scan (1-7) unlocks 5-7 NEW unique parameters.
 * Run:  node test-pdf.mjs
 */
import PDFDocument from "pdfkit";
import { createWriteStream, readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let RELIV_LOGO_BUFFER = null;
try { RELIV_LOGO_BUFFER = readFileSync(path.join(__dirname, "src", "assets", "relivlogo.jpeg")); } catch {}

// ── Assessment helpers ──────────────────────────────────────
function assessBP(sys, dia) {
    const s = Number(sys), d = Number(dia);
    if (!s || !d) return { label: "—", advice: "No BP data.", score: 0 };
    if (s < 100 || d < 65) return { label: "Low", advice: "May cause tiredness. Stay hydrated.", score: 55 };
    if (s >= 110 && s < 131 && d >= 72 && d < 89) return { label: "Normal", advice: "Healthy blood pressure.", score: 95 };
    if (s >= 131 && s < 140) return { label: "High", advice: "Slightly elevated. Reduce salt, manage stress.", score: 65 };
    return { label: "High", advice: "Elevated. Reduce salt, eat more fruits/veggies.", score: 50 };
}
function assessSpO2(o) {
    const v = Number(o);
    if (!v) return { label: "—", advice: "No data.", score: 0 };
    if (v >= 97) return { label: "Normal", advice: "Excellent oxygen level.", score: 100 };
    if (v >= 95) return { label: "Normal", advice: "Healthy oxygen level.", score: 90 };
    if (v >= 92) return { label: "Low", advice: "Slightly low. Try deep breathing.", score: 65 };
    return { label: "Low", advice: "Concerning. Seek medical attention.", score: 40 };
}
function assessPulse(bpm) {
    const v = Number(bpm);
    if (!v) return { label: "—", advice: "No data.", score: 0 };
    if (v >= 60 && v <= 80) return { label: "Normal", advice: "Excellent resting heart rate.", score: 100 };
    if (v > 80 && v <= 100) return { label: "Normal", advice: "Good resting heart rate.", score: 85 };
    if (v < 60 && v >= 50) return { label: "Low", advice: "Slightly low. Monitor if symptomatic.", score: 70 };
    if (v > 100) return { label: "High", advice: "Elevated. Reduce caffeine, rest.", score: 55 };
    return { label: "Low", advice: "Very low. Consult a doctor.", score: 45 };
}
function assessTempF(t) {
    const v = Number(t);
    if (!v) return { label: "—", advice: "No data.", score: 0 };
    if (v >= 97.5 && v <= 98.9) return { label: "Normal", advice: "Perfectly normal.", score: 100 };
    if (v >= 97 && v <= 99) return { label: "Normal", advice: "Within normal range.", score: 90 };
    if (v > 99 && v <= 100.4) return { label: "High", advice: "Low-grade fever. Rest & fluids.", score: 65 };
    if (v > 100.4) return { label: "High", advice: "Fever detected. Rest, fluids, consult doctor.", score: 40 };
    return { label: "Low", advice: "Below normal. Keep warm.", score: 60 };
}
function getSnellenEquivalent(line) {
    return { 1: 200, 2: 100, 3: 70, 4: 50, 5: 40, 6: 30, 7: 25, 8: 20, 9: 15 }[line] || null;
}
function assessEyes(left, right) {
    if (!left && !right) return { summary: "—", note: "—", comment: "No eye test.", score: 0 };
    const ls = getSnellenEquivalent(left), rs = getSnellenEquivalent(right);
    const lStr = ls ? `20/${ls}` : "—", rStr = rs ? `20/${rs}` : "—";
    const summary = `L: ${lStr}   R: ${rStr}`;
    const worse = Math.max(ls || 0, rs || 0);
    if (worse <= 20) return { summary, note: "Excellent", comment: "Better than average vision.", score: 100 };
    if (worse <= 40) return { summary, note: "Normal", comment: "Both eyes in good shape.", score: 85 };
    if (worse <= 70) return { summary, note: "Fair", comment: "Some difficulty. Consider eye checkup.", score: 60 };
    return { summary, note: "Low", comment: "Blurry vision. See an eye specialist.", score: 40 };
}
function assessBMI(bmi) {
    if (!bmi) return { label: "—", score: 0 };
    if (bmi >= 18.5 && bmi < 25) return { label: "Normal", score: 95 };
    if (bmi >= 25 && bmi < 27) return { label: "Slightly Over", score: 75 };
    if (bmi >= 27 && bmi < 30) return { label: "Overweight", score: 60 };
    if (bmi < 18.5) return { label: "Underweight", score: 65 };
    return { label: "Obese", score: 40 };
}

// ── Derived calculations ────────────────────────────────────
function calcMAP(sys, dia) { const s = +sys, d = +dia; return s && d ? Math.round((s + 2 * d) / 3) : null; }
function calcPulsePressure(sys, dia) { const s = +sys, d = +dia; return s && d ? s - d : null; }
function calcIdealWeight(hCm) { if (!hCm) return null; const m = hCm / 100; return { min: (18.5 * m * m).toFixed(0), max: (24.9 * m * m).toFixed(0) }; }
function calcDailyCalories(bmr) { return bmr ? Math.round(bmr * 1.55) : null; }
function calcWaterIntake(w) { return w ? (w * 0.033).toFixed(1) : null; }
function calcMetabolicAge(bmr, age) {
    if (!bmr || !age) return null;
    const avg = 1800 - (+age - 20) * 8;
    return Math.max(15, Math.round(+age - (bmr - avg) / 20));
}
// Scan 3+ unique
function calcLeanMass(w, bf) { return w && bf != null ? +(w * (1 - bf / 100)).toFixed(1) : null; }
function calcFatMass(w, bf) { return w && bf != null ? +(w * bf / 100).toFixed(1) : null; }
function calcRPP(sys, hr) { return sys && hr ? Math.round(+sys * +hr / 100) : null; }
// Scan 4+ unique
function calcDailyProtein(w) { return w ? `${Math.round(w * 0.8)}-${Math.round(w * 1.2)}` : null; }
function calcSleepHours(age) { const a = +age; if (!a) return null; return a < 18 ? "8-10" : a < 65 ? "7-9" : "7-8"; }
// Scan 5+ unique
function calcCardioRisk(sys, bpm, bmi) {
    let risk = 0;
    if (sys) risk += sys > 140 ? 35 : sys > 130 ? 20 : sys > 120 ? 8 : 0;
    if (bpm) risk += bpm > 100 ? 25 : bpm > 85 ? 12 : bpm > 75 ? 4 : 0;
    if (bmi) risk += bmi > 30 ? 30 : bmi > 27 ? 18 : bmi > 25 ? 8 : bmi < 18.5 ? 8 : 0;
    return Math.min(100, risk);
}
function calcFitnessLevel(bpm, o2, bmi) {
    let s = 0, n = 0;
    if (bpm) { s += bpm <= 65 ? 30 : bpm <= 75 ? 25 : bpm <= 85 ? 18 : bpm <= 100 ? 10 : 3; n++; }
    if (o2) { s += o2 >= 98 ? 30 : o2 >= 96 ? 25 : o2 >= 94 ? 15 : 5; n++; }
    if (bmi) { s += bmi >= 18.5 && bmi < 25 ? 30 : bmi >= 25 && bmi < 28 ? 20 : 8; n++; }
    if (!n) return null;
    const avg = s / n;
    if (avg >= 27) return "Excellent";
    if (avg >= 22) return "Good";
    if (avg >= 15) return "Average";
    return "Below Average";
}
function calcStressIndex(bpm, sys) {
    if (!bpm || !sys) return null;
    const rpp = +bpm * +sys;
    if (rpp < 7000) return { level: "Low", value: rpp };
    if (rpp < 10000) return { level: "Moderate", value: rpp };
    return { level: "High", value: rpp };
}
function calcVO2Max(bpm) { if (!bpm) return null; return +(15.3 * (220 / +bpm)).toFixed(1); }
function calcHRRecovery(bpm) { if (!bpm) return null; return +bpm <= 70 ? "Excellent" : +bpm <= 80 ? "Good" : +bpm <= 90 ? "Average" : "Below Average"; }

// ── What-unlocks-next — must match actual content per scan ──
const unlockInfo = {
    2: { title: "Body Composition & Trends", items: ["Body Fat % Analysis", "Muscle Mass Tracking", "Hydration Level", "Health Trend Graph", "Since Last Visit Comparison"] },
    3: { title: "Deep Health Metrics", items: ["Bone Density Score", "Metabolic Rate (BMR)", "Visceral Fat Level", "Lean & Fat Mass Breakdown", "Mean Arterial Pressure", "Pulse Pressure", "Rate Pressure Product", "Historical Data Table"] },
    4: { title: "Personalized Lifestyle Plan", items: ["Ideal Weight Range", "Daily Calorie Goal", "Water Intake Recommendation", "Metabolic Age Estimate", "Daily Protein Requirement", "Recommended Sleep Hours"] },
    5: { title: "Risk & Fitness Analysis", items: ["Cardiovascular Risk Score", "Fitness Level Assessment", "Cardiac Stress Index", "Estimated VO2 Max", "Heart Rate Recovery"] },
    6: { title: "Journey Insights", items: ["Full Health Journey Timeline", "BP / Heart Rate / SpO2 / Temp Changes", "Consistency Score", "Body Composition Trends", "Personalized Recommendations"] },
    7: { title: "Complete Health Profile", items: ["Journey Complete Badge", "Final Health Grade", "Full 7-Visit Analysis", "Consistency Score", "All Metrics Unlocked"] },
};

// ── Test data ───────────────────────────────────────────────
const allHistory = [
    { date: "2026-03-20", systolic: 135, diastolic: 88, bpm: 84, oxygen: 96, temperature: 99.1 },
    { date: "2026-03-25", systolic: 132, diastolic: 86, bpm: 82, oxygen: 97, temperature: 98.8 },
    { date: "2026-04-01", systolic: 129, diastolic: 84, bpm: 80, oxygen: 97, temperature: 98.6 },
    { date: "2026-04-06", systolic: 128, diastolic: 82, bpm: 78, oxygen: 98, temperature: 98.5 },
    { date: "2026-04-10", systolic: 125, diastolic: 80, bpm: 76, oxygen: 98, temperature: 98.4 },
    { date: "2026-04-14", systolic: 122, diastolic: 78, bpm: 74, oxygen: 98, temperature: 98.4 },
];
const ecoStats = { individual: { water: 12, co2: 45 }, total: { water: 8500, co2: 32000, paper: 4200 } };

const scan1Data = {
    patient: { name: "Faizan Khan", age: "22", gender: "Male", email: "khanfaizan3234@gmail.com", phone: "9876543210", scanCount: 1, maxScans: 7 },
    vitals: { systolic: 135, diastolic: 88, bpm: 84, oxygen: 96, temperature: 99.1, leftEye: 4, rightEye: 3 },
    bodyComposition: { weight: 72, height: 172, bmi: 24.3, bodyFat: 22.1, muscleMass: 48.5, waterPercentage: 54.2, boneMass: 2.6, bmr: 1580, visceralFat: 8 },
    history: [],
};
const scan3Data = {
    patient: { name: "Faizan Khan", age: "22", gender: "Male", email: "khanfaizan3234@gmail.com", phone: "9876543210", scanCount: 3, maxScans: 7 },
    vitals: { systolic: 129, diastolic: 84, bpm: 80, oxygen: 97, temperature: 98.6, leftEye: 5, rightEye: 4 },
    bodyComposition: { weight: 70, height: 172, bmi: 23.7, bodyFat: 20.1, muscleMass: 50.8, waterPercentage: 56.4, boneMass: 2.7, bmr: 1620, visceralFat: 7 },
    history: allHistory.slice(0, 2),
};
const scan7Data = {
    patient: { name: "Faizan Khan", age: "22", gender: "Male", email: "khanfaizan3234@gmail.com", phone: "9876543210", scanCount: 7, maxScans: 7 },
    vitals: { systolic: 120, diastolic: 77, bpm: 72, oxygen: 98, temperature: 98.4, leftEye: 6, rightEye: 5 },
    bodyComposition: { weight: 68, height: 172, bmi: 23.0, bodyFat: 18.5, muscleMass: 52.3, waterPercentage: 58.2, boneMass: 2.8, bmr: 1650, visceralFat: 6 },
    history: allHistory,
};

// ═════════════════════════════════════════════════════════════
//  generateReportPdf  —  Progressive Premium Design
// ═════════════════════════════════════════════════════════════
function generateReportPdf(data, ecoStats) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: "A4", margin: 0, compress: true });
        const bufs = [];
        doc.on("data", bufs.push.bind(bufs));
        doc.on("end", () => resolve(Buffer.concat(bufs)));
        doc.on("error", reject);

        const patient = data.patient || {};
        const vitals = data.vitals || {};
        const bc = data.bodyComposition || null;
        const history = data.history;
        const W = 595.28, H = 841.89, M = 40, CW = W - M * 2;
        let pageNum = 0;
        const patientHeight = bc?.height || vitals.height || null;

        // ── Scan level & unlock flags ──
        const scan = patient.scanCount || 1;
        const hist = history && Array.isArray(history) ? history : [];
        const show = {
            bodyCompBars: scan >= 2,
            trendGraph: scan >= 2 && hist.length >= 1,
            sinceLastVisit: scan >= 2 && hist.length >= 1,
            deepBodyComp: scan >= 3,
            derivedStats: scan >= 3,
            trendTable: scan >= 3 && hist.length >= 1,
            lifestyleStats: scan >= 4,
            riskAnalysis: scan >= 5,
            journeyRecap: scan >= 6 && hist.length >= 2,
            journeyComplete: scan >= 7,
            unlocksNext: scan < 7,
        };

        // ── Palette ──
        const C = {
            brand: "#F97316", brandDark: "#EA580C", brandLight: "#FFF7ED",
            green: "#16A34A", greenBg: "#F0FDF4", greenLight: "#DCFCE7",
            yellow: "#CA8A04", yellowBg: "#FEFCE8",
            red: "#DC2626", redBg: "#FEF2F2",
            blue: "#2563EB", blueBg: "#EFF6FF", blueLight: "#DBEAFE",
            text: "#0F172A", textMid: "#334155", textLight: "#64748B", textMuted: "#94A3B8",
            border: "#E2E8F0", borderLight: "#F1F5F9", white: "#FFFFFF", bg: "#F8FAFC",
            dark: "#1E293B", purple: "#7C3AED", purpleBg: "#F5F3FF",
        };

        // ── Assessments ──
        const comp = {
            bp: assessBP(vitals.systolic, vitals.diastolic),
            o2: assessSpO2(vitals.oxygen),
            hr: assessPulse(vitals.bpm),
            temp: assessTempF(vitals.temperature),
            eyes: assessEyes(vitals.leftEye, vitals.rightEye),
            bmi: assessBMI(bc?.bmi),
        };
        const scores = [comp.bp, comp.o2, comp.hr, comp.temp, comp.eyes, comp.bmi].filter(s => s.score > 0);
        const healthScore = scores.length ? Math.round(scores.reduce((a, s) => a + s.score, 0) / scores.length) : 0;

        function scoreColor(s) { return s >= 85 ? C.green : s >= 65 ? C.yellow : C.red; }
        function scoreLabel(s) { return s >= 90 ? "Excellent" : s >= 80 ? "Very Good" : s >= 70 ? "Good" : s >= 60 ? "Fair" : "Needs Attention"; }
        function statusClr(label) {
            if (!label || label === "—") return { fg: C.textMuted, bg: C.borderLight, dot: C.textMuted };
            if (/Normal|Good|Excellent/i.test(label)) return { fg: C.green, bg: C.greenBg, dot: C.green };
            if (/Low|High|Over|Under|Obese/i.test(label)) return { fg: C.red, bg: C.redBg, dot: C.red };
            return { fg: C.yellow, bg: C.yellowBg, dot: C.yellow };
        }

        // ── Drawing helpers ──
        function drawPageFooter() {
            pageNum++;
            doc.save();
            doc.moveTo(M, H - 48).lineTo(W - M, H - 48).lineWidth(0.4).stroke(C.border);
            doc.fontSize(4.5).fillColor(C.textMuted).font("Helvetica")
               .text("DISCLAIMER: This auto-generated report is for informational purposes only. It does not constitute medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional before making health decisions. Reliv Health assumes no liability for actions taken based on this report.", M, H - 42, { width: CW * 0.72, lineGap: 0.3 });
            doc.fontSize(6.5).fillColor(C.textLight).text(`Page ${pageNum}`, W - M - 50, H - 38, { width: 50, align: "right" });
            doc.fontSize(6.5).fillColor(C.brand).font("Helvetica-Bold").text("Reliv Health", W - M - 50, H - 28, { width: 50, align: "right" });
            doc.restore();
        }
        function newPage() { drawPageFooter(); doc.addPage({ size: "A4", margin: 0 }); return M + 10; }
        function ensure(y, n) { return y + n > H - 55 ? newPage() : y; }

        function sectionTitle(title, y) {
            y = ensure(y, 30);
            doc.roundedRect(M, y, 3.5, 15, 1.75).fill(C.brand);
            doc.fontSize(11.5).font("Helvetica-Bold").fillColor(C.text).text(title, M + 12, y + 1);
            return y + 24;
        }
        function badge(text, x, y, clr) {
            const tw = doc.fontSize(7).font("Helvetica-Bold").widthOfString(text);
            const pw = tw + 12, ph = 15;
            doc.roundedRect(x, y, pw, ph, 7.5).fill(clr.bg);
            doc.fillColor(clr.fg).text(text, x + 6, y + 3);
            return pw;
        }
        function drawArc(cx, cy, r, startAngle, endAngle, lineW, color) {
            const segments = Math.max(Math.ceil(Math.abs(endAngle - startAngle) / (Math.PI / 16)), 1);
            const step = (endAngle - startAngle) / segments;
            doc.save();
            doc.lineWidth(lineW).strokeColor(color).lineCap("round");
            const sx = cx + r * Math.cos(startAngle), sy = cy + r * Math.sin(startAngle);
            doc.moveTo(sx, sy);
            for (let i = 1; i <= segments; i++) { const a = startAngle + i * step; doc.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a)); }
            doc.stroke();
            doc.restore();
        }
        function drawCheckmark(cx, cy, size, color) {
            doc.save();
            doc.lineWidth(1.5).strokeColor(color).lineCap("round").lineJoin("round");
            doc.moveTo(cx - size * 0.35, cy + size * 0.05)
               .lineTo(cx - size * 0.05, cy + size * 0.35)
               .lineTo(cx + size * 0.4, cy - size * 0.3)
               .stroke();
            doc.restore();
        }
        function drawTriangle(x, y, up, color) {
            doc.save().fillColor(color);
            if (up) { doc.moveTo(x, y + 5).lineTo(x + 3, y).lineTo(x + 6, y + 5).closePath().fill(); }
            else { doc.moveTo(x, y).lineTo(x + 3, y + 5).lineTo(x + 6, y).closePath().fill(); }
            doc.restore();
        }
        function drawMiniScore(val, x, y, boxW) {
            if (!val || val <= 0) return;
            const clr = scoreColor(val);
            const scoreStr = `${val}`;
            const sw = doc.fontSize(7).font("Helvetica-Bold").widthOfString(scoreStr);
            const slashW = doc.fontSize(5).font("Helvetica").widthOfString("/100");
            const totalW = sw + slashW + 1;
            const sx = x + boxW - 12 - totalW;
            doc.fontSize(7).font("Helvetica-Bold").fillColor(clr).text(scoreStr, sx, y);
            doc.fontSize(5).font("Helvetica").fillColor(C.textMuted).text("/100", sx + sw + 1, y + 1.5);
        }

        // Build graph data: history + current vitals as latest point
        const graphData = [...hist, {
            date: new Date().toISOString().split("T")[0],
            systolic: vitals.systolic, diastolic: vitals.diastolic,
            bpm: vitals.bpm, oxygen: vitals.oxygen, temperature: vitals.temperature,
        }];

        // ═════════════════════════════════════════
        //  HEADER
        // ═════════════════════════════════════════
        const hdrH = 120, splitX = 210;
        doc.rect(0, 0, W, hdrH).fill(C.brand);
        doc.save();
        doc.moveTo(0, 0).lineTo(splitX - 20, 0)
           .bezierCurveTo(splitX + 15, 0, splitX + 15, hdrH, splitX - 20, hdrH)
           .lineTo(0, hdrH).closePath().fill(C.white);
        doc.restore();
        doc.save().opacity(0.05);
        doc.circle(W - 50, 25, 70).fill(C.white);
        doc.circle(W - 120, 100, 40).fill(C.white);
        doc.restore();

        if (RELIV_LOGO_BUFFER) {
            try {
                const lH = 65;
                const lImg = doc.openImage(RELIV_LOGO_BUFFER);
                const lW = (lImg.width / lImg.height) * lH;
                const lX = (splitX - 30) / 2 - lW / 2 + 5;
                const lY = (hdrH - lH) / 2;
                doc.image(RELIV_LOGO_BUFFER, lX, lY, { height: lH });
            } catch {
                doc.fontSize(28).font("Helvetica-Bold").fillColor(C.brand).text("Reliv", 30, hdrH / 2 - 14);
            }
        } else {
            doc.fontSize(28).font("Helvetica-Bold").fillColor(C.brand).text("Reliv", 30, hdrH / 2 - 14);
        }

        const txStart = splitX + 10, txW = W - txStart - M;
        doc.fontSize(20).font("Helvetica-Bold").fillColor(C.white).text("Health Report", txStart, 22, { width: txW });
        doc.save().opacity(0.9);
        doc.fontSize(9).font("Helvetica").fillColor(C.white).text("Your Personalized Wellness Summary", txStart, 48, { width: txW });
        doc.restore();
        const reportDate = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
        doc.save().opacity(0.8);
        doc.fontSize(8).font("Helvetica").fillColor(C.white).text(reportDate, txStart, 63, { width: txW });
        doc.restore();

        // Scan tracker with drawn tick marks
        const scansDone = scan, maxScans = patient.maxScans || 7;
        const scansLeft = Math.max(0, maxScans - scansDone);
        const dotY = 86, dotR = 5.5;
        doc.fontSize(7).font("Helvetica-Bold").fillColor(C.white).text(`${scansDone}/${maxScans} Scans`, txStart, dotY - 1);
        const dotStartX = txStart + 55;
        for (let i = 0; i < maxScans; i++) {
            const dx = dotStartX + i * 15;
            if (i < scansDone) {
                doc.circle(dx, dotY + 4, dotR).fill(C.white);
                drawCheckmark(dx, dotY + 4, dotR * 1.1, C.green);
            } else {
                doc.save();
                doc.circle(dx, dotY + 4, dotR).lineWidth(1.2).strokeColor(C.white).stroke();
                doc.restore();
            }
        }
        if (scansLeft > 0) {
            doc.save().opacity(0.85);
            doc.fontSize(6.5).font("Helvetica").fillColor(C.white)
               .text(`${scansLeft} remaining`, dotStartX + maxScans * 15 + 4, dotY);
            doc.restore();
        }

        // Wave transition
        doc.save();
        const wt = hdrH - 14;
        doc.moveTo(0, wt).bezierCurveTo(W * 0.3, wt + 18, W * 0.7, wt - 6, W, wt + 10)
           .lineTo(W, hdrH + 6).lineTo(0, hdrH + 6).closePath().fill(C.white);
        doc.restore();

        let y = hdrH + 14;

        // ═════════════════════════════════════════
        //  HEALTH SCORE + PATIENT INFO
        // ═════════════════════════════════════════
        y = ensure(y, 78);
        const scoreW = 110, infoW = CW - scoreW - 12;

        const scX = M, scY = y;
        doc.roundedRect(scX, scY, scoreW, 74, 8).fillAndStroke(C.white, C.border);
        const ctrX = scX + scoreW / 2, ctrY = scY + 32, radius = 22;
        const sColor = scoreColor(healthScore);
        doc.save();
        doc.circle(ctrX, ctrY, radius).lineWidth(5).strokeOpacity(0.12).strokeColor(sColor).stroke();
        doc.restore();
        if (healthScore > 0) {
            drawArc(ctrX, ctrY, radius, -Math.PI / 2, -Math.PI / 2 + (healthScore / 100) * 2 * Math.PI, 4.5, sColor);
        }
        doc.fontSize(20).font("Helvetica-Bold").fillColor(sColor)
           .text(`${healthScore}`, ctrX - 18, ctrY - 10, { width: 36, align: "center" });
        doc.fontSize(6).font("Helvetica").fillColor(C.textMuted)
           .text("/ 100", ctrX - 12, ctrY + 10, { width: 24, align: "center" });
        doc.fontSize(8).font("Helvetica-Bold").fillColor(sColor)
           .text(scoreLabel(healthScore), scX, scY + 60, { width: scoreW, align: "center" });
        doc.fontSize(6).font("Helvetica").fillColor(C.textMuted)
           .text("HEALTH SCORE", scX, scY + 4, { width: scoreW, align: "center" });

        const piX = M + scoreW + 12, piY = y;
        doc.roundedRect(piX, piY, infoW, 74, 8).fillAndStroke(C.white, C.border);
        const p1 = piX + 14, p2 = piX + infoW * 0.52;
        doc.fontSize(6.5).fillColor(C.textMuted).font("Helvetica").text("PATIENT NAME", p1, piY + 8);
        doc.fontSize(11).fillColor(C.text).font("Helvetica-Bold").text(patient.name || "—", p1, piY + 18);
        doc.fontSize(6.5).fillColor(C.textMuted).font("Helvetica").text("AGE / GENDER", p2, piY + 8);
        doc.fontSize(11).fillColor(C.text).font("Helvetica-Bold").text([patient.age, patient.gender].filter(Boolean).join(" / ") || "—", p2, piY + 18);
        doc.fontSize(6.5).fillColor(C.textMuted).font("Helvetica").text("EMAIL", p1, piY + 40);
        doc.fontSize(8.5).fillColor(C.textMid).font("Helvetica").text(patient.email || "—", p1, piY + 50);
        doc.fontSize(6.5).fillColor(C.textMuted).font("Helvetica").text("PHONE", p2, piY + 40);
        doc.fontSize(8.5).fillColor(C.textMid).font("Helvetica").text(patient.phone || "—", p2, piY + 50);
        y += 86;

        // ═════════════════════════════════════════
        //  VITAL SIGNS — 2x2 (always — Scan 1)
        // ═════════════════════════════════════════
        y = sectionTitle("Vital Signs", y);
        const vArr = [
            { label: "Blood Pressure", val: `${vitals.systolic || "—"}/${vitals.diastolic || "—"}`, unit: "mmHg", st: comp.bp.label, adv: comp.bp.advice, sc: comp.bp.score },
            { label: "Oxygen Saturation", val: `${vitals.oxygen || "—"}`, unit: "%", st: comp.o2.label, adv: comp.o2.advice, sc: comp.o2.score },
            { label: "Pulse Rate", val: `${vitals.bpm || "—"}`, unit: "BPM", st: comp.hr.label, adv: comp.hr.advice, sc: comp.hr.score },
            { label: "Body Temperature", val: `${vitals.temperature || "—"}`, unit: "\u00B0F", st: comp.temp.label, adv: comp.temp.advice, sc: comp.temp.score },
        ];
        const cW2 = (CW - 10) / 2, cH2 = 82;
        for (let i = 0; i < vArr.length; i++) {
            const v = vArr[i], col = i % 2;
            if (col === 0) y = ensure(y, cH2 + 8);
            const x = M + col * (cW2 + 10);
            const sc = statusClr(v.st);
            doc.roundedRect(x, y, cW2, cH2, 6).fillAndStroke(C.white, C.border);
            doc.roundedRect(x, y, 3.5, cH2, 2).fill(sc.dot);
            const tx = x + 12, ty = y + 7;
            doc.fontSize(6.5).fillColor(C.textMuted).font("Helvetica").text(v.label.toUpperCase(), tx, ty);
            doc.fontSize(19).fillColor(C.text).font("Helvetica-Bold").text(v.val, tx, ty + 11, { continued: true, lineBreak: false });
            doc.fontSize(8.5).fillColor(C.textLight).font("Helvetica").text(` ${v.unit}`, { lineBreak: false });
            badge(v.st || "—", tx, ty + 34, sc);
            drawMiniScore(v.sc, x, ty, cW2);
            doc.fontSize(6.5).fillColor(C.textMid).font("Helvetica")
               .text(v.adv || "", tx, ty + 53, { width: cW2 - 24, lineGap: 0.5 });
            if (col === 1) y += cH2 + 8;
        }
        y += 2;

        // ═══ EYESIGHT (Scan 1) ═══
        y = ensure(y, 52);
        const eSc = statusClr(comp.eyes.note);
        doc.roundedRect(M, y, CW, 48, 6).fillAndStroke(C.white, C.border);
        doc.roundedRect(M, y, 3.5, 48, 2).fill(eSc.dot);
        doc.fontSize(6.5).fillColor(C.textMuted).font("Helvetica").text("VISUAL ACUITY", M + 12, y + 6);
        doc.fontSize(14).fillColor(C.text).font("Helvetica-Bold").text(comp.eyes.summary || "—", M + 12, y + 16);
        badge(comp.eyes.note || "—", M + 12, y + 33, eSc);
        drawMiniScore(comp.eyes.score, M, y + 6, CW);
        doc.fontSize(6.5).fillColor(C.textMid).font("Helvetica")
           .text(comp.eyes.comment || "", M + CW * 0.5, y + 8, { width: CW * 0.35, lineGap: 0.5 });
        y += 58;

        // ═══ BODY BASICS (always — Scan 1: Weight, Height, BMI) ═══
        if (bc && (bc.weight || patientHeight || bc.bmi)) {
            y = sectionTitle("Body Composition", y);
            const tGap = 8, tCnt = 3;
            const tW = (CW - tGap * (tCnt - 1)) / tCnt, tH = 44;
            y = ensure(y, tH + 6);
            const bmiSc = statusClr(comp.bmi.label);
            const tiles = [
                { lbl: "Weight", v: bc.weight ? `${bc.weight}` : "—", u: "kg", c: null },
                { lbl: "Height", v: patientHeight ? `${patientHeight}` : "—", u: "cm", c: null },
                { lbl: "BMI", v: bc.bmi ? `${Number(bc.bmi).toFixed(1)}` : "—", u: comp.bmi.label !== "—" ? comp.bmi.label : "", c: bmiSc },
            ];
            tiles.forEach((t, i) => {
                const x = M + i * (tW + tGap);
                doc.roundedRect(x, y, tW, tH, 6).fill(i === 2 ? (bmiSc.bg || C.brandLight) : C.brandLight);
                doc.fontSize(6.5).fillColor(C.textMuted).font("Helvetica").text(t.lbl.toUpperCase(), x + 9, y + 6);
                doc.fontSize(15).fillColor(C.text).font("Helvetica-Bold").text(t.v, x + 9, y + 17, { continued: true, lineBreak: false });
                doc.fontSize(8).fillColor(i === 2 && t.c ? t.c.fg : C.textLight).font("Helvetica").text(` ${t.u}`, { lineBreak: false });
            });
            y += tH + 10;
        }

        // ═══════════════════════════════════════════
        //  SCAN 2+ : SINCE LAST VISIT (5 new params)
        // ═══════════════════════════════════════════
        if (show.sinceLastVisit) {
            const prev = hist[hist.length - 1];
            y = ensure(y, 68);
            doc.roundedRect(M, y, CW, 62, 6).fillAndStroke(C.blueBg, C.border);
            doc.fontSize(7.5).font("Helvetica-Bold").fillColor(C.blue).text("SINCE LAST VISIT", M + 12, y + 6);
            const changes = [
                { label: "BP", curr: vitals.systolic, prev: prev.systolic, unit: "mmHg", lowerBetter: true },
                { label: "Pulse", curr: vitals.bpm, prev: prev.bpm, unit: "BPM", lowerBetter: true },
                { label: "SpO2", curr: vitals.oxygen, prev: prev.oxygen, unit: "%", lowerBetter: false },
                { label: "Temp", curr: vitals.temperature, prev: prev.temperature, unit: "\u00B0F", lowerBetter: null },
            ];
            const chipW = (CW - 24 - 8 * 3) / 4;
            changes.forEach((ch, ci) => {
                const cx = M + 12 + ci * (chipW + 8);
                const diff = +(ch.curr || 0) - +(ch.prev || 0);
                const improved = ch.lowerBetter != null ? (ch.lowerBetter ? diff < 0 : diff > 0) : Math.abs(+(ch.curr) - 98.6) < Math.abs(+(ch.prev) - 98.6);
                const clr = diff === 0 ? C.textMuted : improved ? C.green : C.red;
                doc.roundedRect(cx, y + 20, chipW, 36, 4).fill(C.white);
                doc.fontSize(6).fillColor(C.textMuted).font("Helvetica").text(ch.label, cx + 5, y + 22);
                // Current value (prominent)
                const currStr = ch.label === "Temp" ? (ch.curr != null ? (+ch.curr).toFixed(1) : "--") : `${ch.curr || "--"}`;
                doc.fontSize(11).fillColor(C.text).font("Helvetica-Bold").text(currStr, cx + 5, y + 30);
                // Diff below
                const sign = diff > 0 ? "+" : "";
                const diffStr = `${sign}${ch.label === "Temp" ? diff.toFixed(1) : Math.round(diff)}`;
                doc.fontSize(7).fillColor(clr).font("Helvetica-Bold").text(diffStr, cx + chipW - 35, y + 44, { width: 30, align: "right" });
                if (diff !== 0) drawTriangle(cx + chipW - 8, y + 46, diff > 0, clr);
            });
            y += 70;
        }

        // ═══════════════════════════════════════════
        //  SCAN 2+ : BODY COMP BARS (Body Fat, Muscle, Water)
        //  SCAN 3+ adds: Bone, BMR, Visceral, Lean, Fat
        // ═══════════════════════════════════════════
        if (show.bodyCompBars && bc) {
            const mets = [];
            if (bc.bodyFat != null) mets.push({ label: "Body Fat", value: `${Number(bc.bodyFat).toFixed(1)}%`, pct: Math.min(bc.bodyFat / 40 * 100, 100), color: bc.bodyFat > 25 ? C.yellow : C.brand });
            if (bc.muscleMass != null) mets.push({ label: "Muscle Mass", value: `${Number(bc.muscleMass).toFixed(1)} kg`, pct: Math.min(bc.muscleMass / 80 * 100, 100), color: C.green });
            if (bc.waterPercentage != null) mets.push({ label: "Body Water", value: `${Number(bc.waterPercentage).toFixed(1)}%`, pct: Math.min(bc.waterPercentage / 80 * 100, 100), color: C.blue });

            // Scan 3+ deep body comp (NEW unique to scan 3)
            if (show.deepBodyComp) {
                if (bc.boneMass != null) mets.push({ label: "Bone Mass", value: `${Number(bc.boneMass).toFixed(1)} kg`, pct: Math.min(bc.boneMass / 5 * 100, 100), color: C.purple });
                if (bc.bmr != null) mets.push({ label: "BMR", value: `${Math.round(bc.bmr)} kcal`, pct: Math.min(bc.bmr / 2500 * 100, 100), color: C.brand });
                if (bc.visceralFat != null) mets.push({ label: "Visceral Fat", value: `${bc.visceralFat}`, pct: Math.min(bc.visceralFat / 20 * 100, 100), color: bc.visceralFat > 12 ? C.red : C.brand });
                const lm = calcLeanMass(bc.weight, bc.bodyFat);
                const fm = calcFatMass(bc.weight, bc.bodyFat);
                if (lm) mets.push({ label: "Lean Mass", value: `${lm} kg`, pct: Math.min(lm / 80 * 100, 100), color: "#0EA5E9" });
                if (fm) mets.push({ label: "Fat Mass", value: `${fm} kg`, pct: Math.min(fm / 30 * 100, 100), color: "#F59E0B" });
            }

            if (mets.length > 0) {
                const mH = mets.length * 20 + 12;
                y = ensure(y, mH + 4);
                doc.roundedRect(M, y, CW, mH, 6).fillAndStroke(C.white, C.border);
                let my = y + 7;
                mets.forEach((m) => {
                    doc.fontSize(7.5).fillColor(C.textMid).font("Helvetica").text(m.label, M + 10, my + 1, { width: 75 });
                    doc.fontSize(8).fillColor(C.text).font("Helvetica-Bold").text(m.value, M + 88, my);
                    const bX = M + 160, bW = CW - 175, bH = 6;
                    doc.roundedRect(bX, my + 3, bW, bH, 3).fill(C.borderLight);
                    doc.roundedRect(bX, my + 3, Math.max(bW * m.pct / 100, 4), bH, 3).fill(m.color);
                    my += 20;
                });
                y += mH + 8;
            }
        }

        // ═══════════════════════════════════════════
        //  SCAN 3+ : DERIVED STATS — MAP, Pulse Pressure, RPP
        //  (unique to scan 3 — no duplicates)
        // ═══════════════════════════════════════════
        if (show.derivedStats) {
            const map = calcMAP(vitals.systolic, vitals.diastolic);
            const pp = calcPulsePressure(vitals.systolic, vitals.diastolic);
            const rpp = calcRPP(vitals.systolic, vitals.bpm);

            const dTiles = [];
            if (map) dTiles.push({ lbl: "Mean Arterial Pressure", v: `${map}`, u: "mmHg" });
            if (pp) dTiles.push({ lbl: "Pulse Pressure", v: `${pp}`, u: "mmHg" });
            if (rpp) dTiles.push({ lbl: "Rate Pressure Product", v: `${rpp}`, u: "\u00D7100" });

            if (dTiles.length > 0) {
                const dtH = 40;
                y = ensure(y, dtH + 6);
                const dtW = (CW - 8 * (dTiles.length - 1)) / dTiles.length;
                dTiles.forEach((t, i) => {
                    const x = M + i * (dtW + 8);
                    doc.roundedRect(x, y, dtW, dtH, 6).fill(C.purpleBg);
                    doc.fontSize(5.5).fillColor(C.textMuted).font("Helvetica").text(t.lbl.toUpperCase(), x + 8, y + 5, { width: dtW - 16 });
                    doc.fontSize(14).fillColor(C.text).font("Helvetica-Bold").text(t.v, x + 8, y + 17, { continued: true, lineBreak: false });
                    doc.fontSize(7).fillColor(C.textLight).font("Helvetica").text(` ${t.u}`, { lineBreak: false });
                });
                y += dtH + 6;
            }
        }

        // ═══════════════════════════════════════════
        //  SCAN 4+ : LIFESTYLE STATS — 6 unique tiles
        //  Ideal Weight, Calories, Water, Met Age, Protein, Sleep
        // ═══════════════════════════════════════════
        if (show.lifestyleStats) {
            const dc = calcDailyCalories(bc?.bmr);
            const wi = calcWaterIntake(bc?.weight);
            const ma = calcMetabolicAge(bc?.bmr, patient.age);
            const iw = calcIdealWeight(patientHeight);
            const dp = calcDailyProtein(bc?.weight);
            const sh = calcSleepHours(patient.age);
            const ltiles = [];
            if (iw) ltiles.push({ lbl: "Ideal Weight", v: `${iw.min}-${iw.max}`, u: "kg" });
            if (dc) ltiles.push({ lbl: "Daily Calories", v: `${dc}`, u: "kcal" });
            if (wi) ltiles.push({ lbl: "Water Intake", v: `${wi}`, u: "L/day" });
            if (ma) ltiles.push({ lbl: "Metabolic Age", v: `~${ma}`, u: "years" });
            if (dp) ltiles.push({ lbl: "Daily Protein", v: dp, u: "g" });
            if (sh) ltiles.push({ lbl: "Sleep Goal", v: sh, u: "hrs" });

            if (ltiles.length > 0) {
                const maxPerRow = 3;
                for (let ri = 0; ri < ltiles.length; ri += maxPerRow) {
                    const rowTiles = ltiles.slice(ri, ri + maxPerRow);
                    const ltH = 40;
                    y = ensure(y, ltH + 6);
                    const ltW = (CW - 8 * (rowTiles.length - 1)) / rowTiles.length;
                    rowTiles.forEach((t, i) => {
                        const x = M + i * (ltW + 8);
                        doc.roundedRect(x, y, ltW, ltH, 6).fill(C.greenLight);
                        doc.fontSize(5.5).fillColor(C.textMuted).font("Helvetica").text(t.lbl.toUpperCase(), x + 8, y + 5, { width: ltW - 16 });
                        doc.fontSize(14).fillColor(C.text).font("Helvetica-Bold").text(t.v, x + 8, y + 17, { continued: true, lineBreak: false });
                        doc.fontSize(7).fillColor(C.textLight).font("Helvetica").text(` ${t.u}`, { lineBreak: false });
                    });
                    y += ltH + 6;
                }
                y += 2;
            }
        }

        // ═══════════════════════════════════════════
        //  SCAN 5+ : RISK & FITNESS ANALYSIS — 5 unique tiles
        //  Cardio Risk, Fitness, Stress, VO2 Max, HR Recovery
        // ═══════════════════════════════════════════
        if (show.riskAnalysis) {
            y = sectionTitle("Risk & Fitness Analysis", y);
            const cardioRisk = calcCardioRisk(vitals.systolic, vitals.bpm, bc?.bmi);
            const fitness = calcFitnessLevel(vitals.bpm, vitals.oxygen, bc?.bmi);
            const stress = calcStressIndex(vitals.bpm, vitals.systolic);
            const riskH = 50;
            y = ensure(y, riskH + 6);
            const rW = (CW - 16) / 3;

            // Cardio Risk
            const crClr = cardioRisk <= 15 ? C.green : cardioRisk <= 35 ? C.yellow : C.red;
            const crLabel = cardioRisk <= 15 ? "Low Risk" : cardioRisk <= 35 ? "Moderate" : "Elevated";
            doc.roundedRect(M, y, rW, riskH, 6).fillAndStroke(C.white, C.border);
            doc.roundedRect(M, y, 3, riskH, 1.5).fill(crClr);
            doc.fontSize(5.5).fillColor(C.textMuted).font("Helvetica").text("CARDIOVASCULAR RISK", M + 10, y + 6, { width: rW - 16 });
            doc.fontSize(16).fillColor(crClr).font("Helvetica-Bold").text(`${cardioRisk}%`, M + 10, y + 18);
            doc.fontSize(7).fillColor(crClr).font("Helvetica-Bold").text(crLabel, M + 10, y + 36);

            // Fitness Level
            const fitClr = fitness === "Excellent" ? C.green : fitness === "Good" ? C.green : fitness === "Average" ? C.yellow : C.red;
            const fx = M + rW + 8;
            doc.roundedRect(fx, y, rW, riskH, 6).fillAndStroke(C.white, C.border);
            doc.roundedRect(fx, y, 3, riskH, 1.5).fill(fitClr);
            doc.fontSize(5.5).fillColor(C.textMuted).font("Helvetica").text("FITNESS LEVEL", fx + 10, y + 6, { width: rW - 16 });
            doc.fontSize(16).fillColor(fitClr).font("Helvetica-Bold").text(fitness || "—", fx + 10, y + 20);

            // Stress Index
            const stClr = stress ? (stress.level === "Low" ? C.green : stress.level === "Moderate" ? C.yellow : C.red) : C.textMuted;
            const sx = M + 2 * (rW + 8);
            doc.roundedRect(sx, y, rW, riskH, 6).fillAndStroke(C.white, C.border);
            doc.roundedRect(sx, y, 3, riskH, 1.5).fill(stClr);
            doc.fontSize(5.5).fillColor(C.textMuted).font("Helvetica").text("CARDIAC STRESS INDEX", sx + 10, y + 6, { width: rW - 16 });
            doc.fontSize(16).fillColor(stClr).font("Helvetica-Bold").text(stress ? stress.level : "—", sx + 10, y + 20);
            if (stress) doc.fontSize(6).fillColor(C.textLight).font("Helvetica").text(`RPP: ${stress.value}`, sx + 10, y + 38);
            y += riskH + 8;

            // Row 2: VO2 Max + HR Recovery (unique to scan 5)
            const vo2 = calcVO2Max(vitals.bpm);
            const hrRec = calcHRRecovery(vitals.bpm);
            if (vo2 || hrRec) {
                const r2H = 44;
                y = ensure(y, r2H + 6);
                const r2tiles = [];
                if (vo2) r2tiles.push({ lbl: "EST. VO2 MAX", v: `${vo2}`, u: "ml/kg/min", clr: vo2 >= 40 ? C.green : vo2 >= 30 ? C.yellow : C.red });
                if (hrRec) r2tiles.push({ lbl: "HR RECOVERY POTENTIAL", v: hrRec, u: "", clr: /Excellent|Good/.test(hrRec) ? C.green : hrRec === "Average" ? C.yellow : C.red });
                const r2W = (CW - 8 * (r2tiles.length - 1)) / r2tiles.length;
                r2tiles.forEach((t, i) => {
                    const rx = M + i * (r2W + 8);
                    doc.roundedRect(rx, y, r2W, r2H, 6).fillAndStroke(C.white, C.border);
                    doc.roundedRect(rx, y, 3, r2H, 1.5).fill(t.clr);
                    doc.fontSize(5.5).fillColor(C.textMuted).font("Helvetica").text(t.lbl, rx + 10, y + 6, { width: r2W - 16 });
                    doc.fontSize(16).fillColor(t.clr).font("Helvetica-Bold").text(t.v, rx + 10, y + 20);
                    if (t.u) doc.fontSize(6).fillColor(C.textLight).font("Helvetica").text(t.u, rx + 10, y + 36);
                });
                y += r2H + 6;
            }
        }

        // ═══════════════════════════════════════════
        //  INSIGHTS (always — grows with scan level)
        // ═══════════════════════════════════════════
        y = sectionTitle("What It Means \u2014 In Simple Words", y);
        const ins = [];
        if (vitals.systolic && vitals.diastolic) {
            const s = comp.bp.label;
            if (s === "Normal") ins.push({ t: "Your blood pressure is healthy. Keep it up!", c: C.green });
            else if (s === "Low") ins.push({ t: "Blood pressure is low. Stay hydrated, eat well.", c: C.yellow });
            else ins.push({ t: "Blood pressure is elevated. Reduce salt, manage stress.", c: C.red });
        }
        if (vitals.oxygen) {
            const o = +vitals.oxygen;
            ins.push(o >= 95 ? { t: `Oxygen ${o}% \u2014 healthy.`, c: C.green } : { t: `Oxygen ${o}% \u2014 try deep breathing exercises.`, c: C.red });
        }
        if (vitals.bpm) {
            const h = +vitals.bpm;
            ins.push(h >= 60 && h <= 100 ? { t: `Heart rate ${h} BPM \u2014 normal range.`, c: C.green } : { t: `Heart rate ${h} BPM \u2014 outside normal. Rest & hydrate.`, c: h < 60 ? C.yellow : C.red });
        }
        if (vitals.temperature) {
            const t = +vitals.temperature;
            ins.push(t >= 97 && t <= 99 ? { t: `Temperature ${t}\u00B0F \u2014 normal.`, c: C.green } : { t: `Temperature ${t}\u00B0F \u2014 outside normal. Monitor closely.`, c: t > 99 ? C.red : C.yellow });
        }
        if (bc?.bmi) {
            const b = +bc.bmi;
            if (b < 18.5) ins.push({ t: `BMI ${b.toFixed(1)} \u2014 underweight. Focus on nutrition.`, c: C.yellow });
            else if (b < 25) ins.push({ t: `BMI ${b.toFixed(1)} \u2014 healthy range!`, c: C.green });
            else if (b < 30) ins.push({ t: `BMI ${b.toFixed(1)} \u2014 above ideal. 30 min daily walk helps.`, c: C.yellow });
            else ins.push({ t: `BMI ${b.toFixed(1)} \u2014 elevated. Diet + exercise recommended.`, c: C.red });
        }
        // Scan 2+
        if (scan >= 2 && bc?.bodyFat != null) {
            const bf = +bc.bodyFat;
            ins.push(bf < 20 ? { t: `Body fat ${bf.toFixed(1)}% \u2014 healthy range.`, c: C.green }
                : bf < 25 ? { t: `Body fat ${bf.toFixed(1)}% \u2014 average. Regular exercise helps.`, c: C.yellow }
                : { t: `Body fat ${bf.toFixed(1)}% \u2014 above ideal. Focus on cardio + diet.`, c: C.red });
        }
        if (scan >= 2 && bc?.waterPercentage != null) {
            const wp = +bc.waterPercentage;
            ins.push(wp >= 55 ? { t: `Hydration ${wp.toFixed(0)}% \u2014 well hydrated.`, c: C.green }
                : { t: `Hydration ${wp.toFixed(0)}% \u2014 drink more water throughout the day.`, c: C.yellow });
        }
        // Scan 3+
        if (scan >= 3 && bc?.visceralFat != null) {
            const vf = +bc.visceralFat;
            ins.push(vf <= 9 ? { t: `Visceral fat ${vf} \u2014 healthy level.`, c: C.green }
                : { t: `Visceral fat ${vf} \u2014 elevated. Reduce sugary foods & exercise.`, c: C.red });
        }
        if (scan >= 3) {
            const map = calcMAP(vitals.systolic, vitals.diastolic);
            if (map) ins.push(map >= 70 && map <= 100 ? { t: `MAP ${map} mmHg \u2014 good arterial pressure.`, c: C.green }
                : { t: `MAP ${map} mmHg \u2014 outside ideal range. Monitor.`, c: C.yellow });
            const rpp = calcRPP(vitals.systolic, vitals.bpm);
            if (rpp) ins.push(rpp < 120 ? { t: `Cardiac workload (RPP ${rpp}) \u2014 within healthy limits.`, c: C.green }
                : { t: `Cardiac workload (RPP ${rpp}) \u2014 slightly elevated. Rest well.`, c: C.yellow });
        }
        // Scan 4+
        if (scan >= 4 && bc?.bmr) {
            const dc = calcDailyCalories(bc.bmr);
            if (dc) ins.push({ t: `Aim for ~${dc} kcal/day based on your metabolism.`, c: C.blue });
        }
        if (scan >= 4) {
            const dp = calcDailyProtein(bc?.weight);
            if (dp) ins.push({ t: `Daily protein target: ${dp}g for muscle maintenance.`, c: C.blue });
        }
        // Scan 5+
        if (scan >= 5) {
            const fitness = calcFitnessLevel(vitals.bpm, vitals.oxygen, bc?.bmi);
            if (fitness) ins.push({ t: `Your fitness level: ${fitness}. ${fitness === "Excellent" || fitness === "Good" ? "Great work!" : "Room to improve with daily exercise."}`, c: fitness === "Excellent" || fitness === "Good" ? C.green : C.yellow });
            const stress = calcStressIndex(vitals.bpm, vitals.systolic);
            if (stress) ins.push({ t: `Cardiac stress: ${stress.level}. ${stress.level === "Low" ? "Heart is working efficiently." : "Focus on relaxation and sleep."}`, c: stress.level === "Low" ? C.green : C.yellow });
            const vo2 = calcVO2Max(vitals.bpm);
            if (vo2) ins.push({ t: `Estimated VO2 Max: ${vo2} ml/kg/min. ${vo2 >= 40 ? "Good aerobic capacity." : "More cardio exercise recommended."}`, c: vo2 >= 40 ? C.green : C.yellow });
        }
        if (!ins.length) ins.push({ t: "More tests needed for insights.", c: C.textLight });

        const iH = ins.length * 15 + 12;
        y = ensure(y, iH + 4);
        doc.roundedRect(M, y, CW, iH, 6).fill(C.bg);
        let iy = y + 7;
        ins.forEach((i) => {
            iy = ensure(iy, 15);
            doc.circle(M + 14, iy + 4, 2.5).fill(i.c);
            doc.fontSize(7.5).fillColor(C.textMid).font("Helvetica").text(i.t, M + 24, iy, { width: CW - 40 });
            iy += 15;
        });
        y = iy + 8;

        // ═══════════════════════════════════════════
        //  SCAN 2+ : HEALTH TREND GRAPH
        // ═══════════════════════════════════════════
        if (show.trendGraph && graphData.length > 1) {
            y = ensure(y, 200);
            y = sectionTitle("Health Trend", y);
            y = ensure(y, 175);
            const boxW = CW, boxH = 120;
            const padL = 30, padR = 10, padT = 10, padB = 24;
            doc.roundedRect(M, y, boxW, boxH, 6).fillAndStroke(C.white, C.border);
            const cL = M + padL, cR = M + boxW - padR, cT = y + padT, cBt = y + boxH - padB;
            const cWd = cR - cL, cHt = cBt - cT;
            const n = graphData.length;
            const allVals = graphData.flatMap(h => [h.systolic || 0, h.bpm || 0]).filter(v => v > 0);
            if (allVals.length === 0) allVals.push(80, 120);
            const dMin = Math.min(...allVals), dMax = Math.max(...allVals);
            const yMin = Math.floor((dMin - 10) / 10) * 10, yMax = Math.ceil((dMax + 10) / 10) * 10 || 200;
            const mapYv = (v) => cBt - ((v - yMin) / (yMax - yMin)) * cHt;
            for (let gi = 0; gi <= 4; gi++) {
                const tick = yMin + ((yMax - yMin) * gi) / 4;
                const gy = mapYv(tick);
                doc.moveTo(cL, gy).lineTo(cR, gy).lineWidth(0.3).strokeColor(C.borderLight).stroke();
                doc.fontSize(5).fillColor(C.textMuted).font("Helvetica").text(`${Math.round(tick)}`, M + 2, gy - 3, { width: 25, align: "right" });
            }
            const z1 = Math.max(mapYv(Math.min(130, yMax)), cT), z2 = Math.min(mapYv(Math.max(110, yMin)), cBt);
            if (z2 > z1) {
                doc.save().opacity(0.06); doc.rect(cL, z1, cWd, z2 - z1).fill(C.green); doc.restore();
                doc.save().opacity(0.4); doc.fontSize(4.5).fillColor(C.green).font("Helvetica").text("Normal", cR - 28, z1 + 2); doc.restore();
            }
            const sXstep = n > 1 ? cWd / (n - 1) : 0;
            doc.save().opacity(0.08);
            doc.moveTo(cL, mapYv(graphData[0].systolic || 120));
            for (let gi = 1; gi < n; gi++) doc.lineTo(cL + gi * sXstep, mapYv(graphData[gi].systolic || 120));
            doc.lineTo(cL + (n - 1) * sXstep, cBt).lineTo(cL, cBt).closePath().fill(C.brand);
            doc.restore();
            doc.lineWidth(2).strokeColor(C.brand).lineJoin("round").lineCap("round");
            for (let gi = 0; gi < n; gi++) { const px = cL + gi * sXstep, py = mapYv(graphData[gi].systolic || 120); gi === 0 ? doc.moveTo(px, py) : doc.lineTo(px, py); }
            doc.stroke();
            for (let gi = 0; gi < n; gi++) { const px = cL + gi * sXstep, py = mapYv(graphData[gi].systolic || 120); doc.circle(px, py, 3).fill(C.white); doc.circle(px, py, 2).fill(C.brand); }
            doc.lineWidth(1.5).strokeColor(C.green).lineJoin("round").lineCap("round");
            for (let gi = 0; gi < n; gi++) { const px = cL + gi * sXstep, py = mapYv(graphData[gi].bpm || 72); gi === 0 ? doc.moveTo(px, py) : doc.lineTo(px, py); }
            doc.stroke();
            for (let gi = 0; gi < n; gi++) { const px = cL + gi * sXstep, py = mapYv(graphData[gi].bpm || 72); doc.circle(px, py, 2.5).fill(C.white); doc.circle(px, py, 1.5).fill(C.green); }
            for (let gi = 0; gi < n; gi++) {
                const px = cL + gi * sXstep;
                const lbl = graphData[gi].date ? new Date(graphData[gi].date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : `#${gi + 1}`;
                doc.fontSize(5).fillColor(C.textMuted).font("Helvetica").text(lbl, px - 16, cBt + 4, { width: 32, align: "center" });
            }
            const lgX = cR - 110, lgY = cBt + 4;
            doc.circle(lgX, lgY + 3, 2.5).fill(C.brand);
            doc.fontSize(5.5).fillColor(C.textMid).font("Helvetica").text("Systolic BP", lgX + 5, lgY);
            doc.circle(lgX + 55, lgY + 3, 2.5).fill(C.green);
            doc.text("Heart Rate", lgX + 60, lgY);
            y += boxH + 6;
        }

        // ═══════════════════════════════════════════
        //  SCAN 3+ : TREND DATA TABLE
        // ═══════════════════════════════════════════
        if (show.trendTable && graphData.length > 1) {
            y = ensure(y, graphData.length * 13 + 22);
            const colW = [55, 55, 55, 55, 55];
            const tblW = colW.reduce((a, b) => a + b, 0);
            const tblX = M + (CW - tblW) / 2;
            doc.roundedRect(tblX, y, tblW, 13, 3).fill(C.dark);
            const headers = ["Date", "Systolic", "Diastolic", "Pulse", "SpO2"];
            let hx = tblX;
            headers.forEach((h, i) => { doc.fontSize(6).fillColor(C.white).font("Helvetica-Bold").text(h, hx + 3, y + 3, { width: colW[i] - 6, align: "center" }); hx += colW[i]; });
            y += 13;
            graphData.forEach((h, ri) => {
                const bg = ri % 2 === 0 ? C.white : C.bg;
                doc.rect(tblX, y, tblW, 12).fill(bg);
                const row = [
                    h.date ? new Date(h.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }) : `#${ri + 1}`,
                    `${h.systolic || "\u2014"}`, `${h.diastolic || "\u2014"}`, `${h.bpm || "\u2014"}`, `${h.oxygen || "\u2014"}%`,
                ];
                let rx = tblX;
                row.forEach((val, ci) => { doc.fontSize(6).fillColor(C.textMid).font("Helvetica").text(val, rx + 3, y + 2.5, { width: colW[ci] - 6, align: "center" }); rx += colW[ci]; });
                y += 12;
            });
            y += 8;
        }

        // ═══════════════════════════════════════════
        //  SCAN 6+ : JOURNEY RECAP — BP, HR, O2, Temp changes
        // ═══════════════════════════════════════════
        if (show.journeyRecap && graphData.length >= 3) {
            y = ensure(y, 110);
            y = sectionTitle("Your Health Journey", y);
            const first = graphData[0], last = graphData[graphData.length - 1];
            const jH = 96;
            y = ensure(y, jH + 4);
            doc.roundedRect(M, y, CW, jH, 6).fill(C.blueBg);
            doc.fontSize(7.5).font("Helvetica-Bold").fillColor(C.blue)
               .text(`Over ${graphData.length} visits, here's how you've progressed:`, M + 12, y + 7);
            const jMetrics = [
                { lbl: "Blood Pressure", from: `${first.systolic ?? "--"}/${first.diastolic ?? "--"}`, to: `${last.systolic ?? "--"}/${last.diastolic ?? "--"}`, diff: (first.systolic && last.systolic) ? (first.systolic - last.systolic) : 0, unit: "mmHg" },
                { lbl: "Heart Rate", from: `${first.bpm ?? "--"}`, to: `${last.bpm ?? "--"}`, diff: (first.bpm && last.bpm) ? (first.bpm - last.bpm) : 0, unit: "BPM" },
                { lbl: "Oxygen", from: `${first.oxygen ?? "--"}%`, to: `${last.oxygen ?? "--"}%`, diff: (first.oxygen && last.oxygen) ? (last.oxygen - first.oxygen) : 0, unit: "%" },
                { lbl: "Temperature", from: `${first.temperature ?? "--"}\u00B0F`, to: `${last.temperature ?? "--"}\u00B0F`, diff: (first.temperature && last.temperature) ? +((last.temperature - first.temperature).toFixed(1)) : 0, unit: "\u00B0F", neutral: true },
            ];
            let jy = y + 22;
            jMetrics.forEach((jm) => {
                const clr = jm.neutral ? C.textMid : (jm.diff > 0 ? C.green : jm.diff < 0 ? C.red : C.textMuted);
                const sign = jm.diff > 0 ? "+" : "";
                doc.fontSize(7).fillColor(C.textMid).font("Helvetica").text(`${jm.lbl}:`, M + 16, jy);
                doc.fontSize(7.5).fillColor(C.text).font("Helvetica-Bold").text(`${jm.from}  -->  ${jm.to}`, M + 100, jy);
                doc.fontSize(7).fillColor(clr).font("Helvetica-Bold").text(`(${sign}${jm.diff} ${jm.unit})`, M + 220, jy);
                jy += 12;
            });
            // Consistency score
            const consistency = Math.round((graphData.length / (patient.maxScans || 7)) * 100);
            doc.fontSize(7).fillColor(C.textMid).font("Helvetica").text("Consistency:", M + 16, jy + 2);
            const cBarX = M + 80, cBarW = 120, cBarH = 7;
            doc.roundedRect(cBarX, jy + 3, cBarW, cBarH, 3.5).fill(C.blueLight);
            doc.roundedRect(cBarX, jy + 3, Math.max(cBarW * consistency / 100, 4), cBarH, 3.5).fill(C.blue);
            doc.fontSize(7.5).fillColor(C.blue).font("Helvetica-Bold").text(`${consistency}%`, cBarX + cBarW + 6, jy + 1);
            y += jH + 8;
        }

        // ═══════════════════════════════════════════
        //  ACTION PLAN (progressive)
        // ═══════════════════════════════════════════
        y = ensure(y, 60);
        y = sectionTitle("Your Action Plan", y);
        const acts = [];
        if (comp.bp.label === "High") acts.push("Reduce salt to under 5g/day. Avoid pickles, papad, processed snacks.");
        if (comp.bp.label === "Low") acts.push("Stay hydrated \u2014 8+ glasses of water daily.");
        if (+vitals.bpm > 100) acts.push("Limit caffeine. Try 10 min of meditation before sleep.");
        if (+vitals.oxygen < 95) acts.push("Deep breathing: inhale 4s, hold 4s, exhale 6s \u2014 5 times daily.");
        if (bc?.bmi && +bc.bmi >= 25) acts.push("Walk briskly 30 min daily. Replace sugary drinks with water.");
        if (bc?.bmi && +bc.bmi < 18.5) acts.push("Eat nutrient-dense foods: nuts, eggs, paneer, bananas.");
        if (scan <= 2) {
            acts.push("Drink 8 glasses of water daily and eat 2-3 servings of fruits.");
            acts.push("Sleep 7-8 hours. Avoid screens 1 hour before bed.");
            acts.push("Take a 15-minute walk after meals to aid digestion.");
        }
        if (scan >= 2 && hist.length > 0) {
            const prev = hist[hist.length - 1];
            if (vitals.systolic < prev.systolic) acts.push("Your BP is improving! Continue your current routine.");
            else if (vitals.systolic > prev.systolic) acts.push("BP increased since last visit. Cut salt, reduce stress, walk more.");
        }
        if (scan >= 3 && bc?.bodyFat && +bc.bodyFat > 22) acts.push("Body fat above ideal. Add 20 min cardio 4x/week.");
        if (scan >= 3 && bc?.visceralFat && +bc.visceralFat > 9) acts.push("Visceral fat elevated. Cut refined sugar and processed food.");
        if (scan >= 4) {
            const wi = calcWaterIntake(bc?.weight);
            if (wi) acts.push(`Drink at least ${wi}L of water daily based on your body weight.`);
            const dc = calcDailyCalories(bc?.bmr);
            if (dc) acts.push(`Target ~${dc} kcal/day. Focus on protein-rich meals.`);
            const dp = calcDailyProtein(bc?.weight);
            if (dp) acts.push(`Aim for ${dp}g protein daily from dal, eggs, paneer, chicken.`);
        }
        if (scan >= 5) {
            acts.push("Track your meals for 3 days to find hidden calorie sources.");
            acts.push("Add strength training 2x/week to boost muscle mass and BMR.");
            const stress = calcStressIndex(vitals.bpm, vitals.systolic);
            if (stress && stress.level !== "Low") acts.push("Practice 10 min deep breathing or meditation daily to lower cardiac stress.");
        }
        if (scan >= 6) {
            acts.push("Review your journey data above \u2014 celebrate the improvements you've made!");
            acts.push("Share this report with your doctor for a comprehensive health discussion.");
        }
        if (scan >= 7) {
            acts.push("You've completed all 7 scans! Keep monitoring monthly for long-term health.");
        }
        acts.push("Come back for your next checkup \u2014 your report grows with each visit!");
        acts.push("Save this report. Follow these steps for 7 days and compare your numbers.");

        const aH = acts.length * 18 + 12;
        y = ensure(y, aH + 4);
        doc.roundedRect(M, y, CW, aH, 6).fill(C.bg);
        let ay = y + 7;
        acts.forEach((a, i) => {
            ay = ensure(ay, 18);
            doc.circle(M + 14, ay + 4, 6.5).fill(C.brand);
            doc.fontSize(7).fillColor(C.white).font("Helvetica-Bold").text(`${i + 1}`, M + 10, ay + 1, { width: 9, align: "center" });
            doc.fontSize(7.5).fillColor(C.textMid).font("Helvetica").text(a, M + 26, ay + 0.5, { width: CW - 38 });
            ay += 18;
        });
        y = ay + 6;

        // ═══════════════════════════════════════════
        //  WHAT UNLOCKS NEXT (scan < 7)
        // ═══════════════════════════════════════════
        if (show.unlocksNext) {
            const nextScan = scan + 1;
            const info = unlockInfo[nextScan];
            if (info) {
                const allItems = [...info.items];
                const extraH = scan === 1 ? 18 : 0;
                const boxH = allItems.length * 14 + 38 + extraH;
                y = ensure(y, boxH + 8);
                doc.roundedRect(M, y, CW, boxH, 6).fillAndStroke(C.brandLight, C.brand);
                doc.roundedRect(M, y, CW, 3, 1.5).fill(C.brand);
                doc.fontSize(8.5).font("Helvetica-Bold").fillColor(C.brandDark)
                   .text(`COMING IN SCAN ${nextScan}: ${info.title}`, M + 14, y + 10);
                let uy = y + 26;
                allItems.forEach((item) => {
                    doc.circle(M + 20, uy + 3.5, 2.5).lineWidth(1).strokeColor(C.brand).stroke();
                    doc.fontSize(7.5).fillColor(C.textMid).font("Helvetica").text(item, M + 30, uy, { width: CW - 50 });
                    uy += 14;
                });
                if (scan === 1) {
                    doc.fontSize(6.5).fillColor(C.textLight).font("Helvetica")
                       .text("Plus: Deep Metrics (Scan 3) \u2022 Lifestyle Plan (Scan 4) \u2022 Risk Analysis (Scan 5) \u2022 Journey (Scan 6) \u2022 Complete Report (Scan 7)", M + 14, uy + 2, { width: CW - 28 });
                }
                doc.fontSize(7).fillColor(C.brandDark).font("Helvetica-Bold")
                   .text("Complete your next visit to unlock!", M + 14, y + boxH - 14, { width: CW - 28, align: "center" });
                y += boxH + 8;
            }
        }

        // ═══════════════════════════════════════════
        //  SCAN 7: JOURNEY COMPLETE + Final Grade
        // ═══════════════════════════════════════════
        if (show.journeyComplete) {
            const grade = healthScore >= 90 ? "A+" : healthScore >= 80 ? "A" : healthScore >= 70 ? "B" : healthScore >= 60 ? "C" : "D";
            const consistency = Math.round((graphData.length / (patient.maxScans || 7)) * 100);
            y = ensure(y, 78);
            doc.roundedRect(M, y, CW, 72, 6).fill(C.greenBg);
            doc.roundedRect(M, y, CW, 3, 1.5).fill(C.green);
            doc.fontSize(14).font("Helvetica-Bold").fillColor(C.green)
               .text("Journey Complete!", M, y + 8, { width: CW, align: "center" });
            doc.fontSize(8).font("Helvetica").fillColor(C.textMid)
               .text("Congratulations on completing all 7 scans! You've unlocked your full health profile.", M + 20, y + 26, { width: CW - 40, align: "center" });
            doc.fontSize(7.5).font("Helvetica-Bold").fillColor(C.green)
               .text(`Final Grade: ${grade} \u2022 Consistency: ${consistency}% \u2022 Total Visits: ${graphData.length} \u2022 All Metrics Unlocked`, M + 20, y + 42, { width: CW - 40, align: "center" });
            doc.fontSize(6.5).font("Helvetica").fillColor(C.textMid)
               .text("Keep monitoring your health monthly. Share this report with your doctor for a comprehensive discussion.", M + 20, y + 56, { width: CW - 40, align: "center" });
            y += 80;
        }

        // ═══ SUMMARY — layman language ═══
        {
            y = ensure(y, 50);
            y = sectionTitle("Summary", y);
            let summaryText = "";
            if (scan === 1) {
                summaryText = `This is your first health check. Your overall score is ${healthScore}/100 (${scoreLabel(healthScore)}). ` +
                    (healthScore >= 80 ? "Your vitals look good - keep up the healthy habits! Come back for your next scan to unlock body composition tracking."
                    : healthScore >= 60 ? "Most readings are fine, with a few areas to watch. Follow the action plan above and visit again soon."
                    : "Some readings need attention. Follow the tips above and come back for your next scan.");
            } else if (scan <= 3) {
                const improving = show.sinceLastVisit && hist.length > 0 && vitals.systolic <= hist[hist.length - 1].systolic;
                summaryText = `Visit ${scan} of 7. Your score is ${healthScore}/100 (${scoreLabel(healthScore)}). ` +
                    (improving ? "Your numbers are improving since last visit! " : "") +
                    "Keep following the action plan. Each visit adds more insights to your report.";
            } else if (scan <= 5) {
                summaryText = `Visit ${scan} of 7 - your health profile is getting detailed! Score: ${healthScore}/100 (${scoreLabel(healthScore)}). ` +
                    "Your lifestyle plan and risk analysis are now active. Review the tips above to keep improving.";
            } else if (scan === 6) {
                summaryText = `Visit ${scan} of 7. Score: ${healthScore}/100 (${scoreLabel(healthScore)}). ` +
                    "Your full health journey is now visible. One more scan to complete your profile!";
            } else {
                summaryText = `All 7 scans complete! Final score: ${healthScore}/100 (${scoreLabel(healthScore)}). ` +
                    "Your complete health profile with all metrics is above. Share this report with your doctor.";
            }
            y = ensure(y, 38);
            doc.roundedRect(M, y, CW, 32, 6).fill(C.bg);
            doc.fontSize(7.5).fillColor(C.textMid).font("Helvetica").text(summaryText, M + 12, y + 8, { width: CW - 24, lineGap: 1 });
            y += 38;
        }

        // ═══ ECO STATS ═══
        if (ecoStats?.individual && ecoStats?.total) {
            y = ensure(y, 30);
            y += 3;
            doc.roundedRect(M, y, CW, 24, 6).fill(C.greenBg);
            doc.fontSize(6.5).fillColor(C.green).font("Helvetica-Bold")
               .text(`Your digital report saved ~${ecoStats.individual.water}L water & ~${ecoStats.individual.co2}g CO2`, M + 8, y + 3, { width: CW - 16, align: "center" });
            doc.fontSize(5.5).fillColor(C.textLight).font("Helvetica")
               .text(`Together, Reliv users saved ~${ecoStats.total.water}L water, ~${ecoStats.total.co2}g CO2, ~${ecoStats.total.paper} sheets of paper.`, M + 8, y + 13, { width: CW - 16, align: "center" });
        }

        drawPageFooter();
        doc.end();
      } catch (err) {
        reject(err);
      }
    });
}

// ═══ RUN — Generate 3 PDFs ═══
async function main() {
    console.log("Generating Scan 1 PDF...");
    const b1 = await generateReportPdf(scan1Data, ecoStats);
    writeFileSync(path.join(__dirname, "test-report-scan1.pdf"), b1);
    console.log(`  Scan 1: ${(b1.length / 1024).toFixed(1)} KB`);

    console.log("Generating Scan 3 PDF...");
    const b3 = await generateReportPdf(scan3Data, ecoStats);
    writeFileSync(path.join(__dirname, "test-report-scan3.pdf"), b3);
    console.log(`  Scan 3: ${(b3.length / 1024).toFixed(1)} KB`);

    console.log("Generating Scan 7 PDF...");
    const b7 = await generateReportPdf(scan7Data, ecoStats);
    writeFileSync(path.join(__dirname, "test-report-scan7.pdf"), b7);
    console.log(`  Scan 7: ${(b7.length / 1024).toFixed(1)} KB`);

    console.log("\nOpening all 3...");
    exec(`start "" "${path.join(__dirname, "test-report-scan1.pdf")}"`);
    setTimeout(() => exec(`start "" "${path.join(__dirname, "test-report-scan3.pdf")}"`), 500);
    setTimeout(() => exec(`start "" "${path.join(__dirname, "test-report-scan7.pdf")}"`), 1000);
}
main();
