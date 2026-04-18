/**
 * Premium PDF report generator — test harness.
 * Run:  node test-pdf.mjs
 */
import PDFDocument from "pdfkit";
import { createWriteStream, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let RELIV_LOGO_BUFFER = null;
try { RELIV_LOGO_BUFFER = readFileSync(path.join(__dirname, "src", "assets", "relivlogo.jpeg")); } catch {}

// ── Assessment helpers ──────────────────────────────────────
function assessBP(sys, dia) {
    const s = Number(sys), d = Number(dia);
    if (!s || !d) return { label: "—", advice: "No BP values.", score: 0 };
    if (s < 100 || d < 65) return { label: "Low", advice: "May cause tiredness. Stay hydrated.", score: 55 };
    if (s >= 110 && s < 131 && d >= 72 && d < 89) return { label: "Normal", advice: "Healthy and considered normal.", score: 95 };
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
    if (!left && !right) return { summary: "—", note: "No data", comment: "No eye test.", score: 0 };
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

// ── 7-scan test data ──
const sampleData = {
    patient: { name: "Faizan Khan", age: "22", gender: "Male", email: "khanfaizan3234@gmail.com", phone: "9876543210", scanCount: 3, maxScans: 7 },
    vitals: { systolic: 120, diastolic: 77, bpm: 72, oxygen: 98, temperature: 98.4, leftEye: 6, rightEye: 5 },
    bodyComposition: { weight: 68, height: 172, bmi: 23.0, bodyFat: 18.5, muscleMass: 52.3, waterPercentage: 58.2, boneMass: 2.8, bmr: 1650, visceralFat: 6 },
    history: [
        { date: "2026-03-20", systolic: 135, diastolic: 88, bpm: 84, oxygen: 96 },
        { date: "2026-03-25", systolic: 132, diastolic: 86, bpm: 82, oxygen: 97 },
        { date: "2026-04-01", systolic: 129, diastolic: 84, bpm: 80, oxygen: 97 },
        { date: "2026-04-06", systolic: 128, diastolic: 82, bpm: 78, oxygen: 98 },
        { date: "2026-04-10", systolic: 125, diastolic: 80, bpm: 76, oxygen: 98 },
        { date: "2026-04-14", systolic: 122, diastolic: 78, bpm: 74, oxygen: 98 },
        { date: "2026-04-18", systolic: 120, diastolic: 77, bpm: 72, oxygen: 98 },
    ]
};
const ecoStats = { individual: { water: 12, co2: 45 }, total: { water: 8500, co2: 32000, paper: 4200 } };

// ═══════════════════════════════════════════════════════
//  generateReportPdf  —  Premium Design
// ═══════════════════════════════════════════════════════
function generateReportPdf(data, ecoStats) {
    return new Promise((resolve) => {
        const doc = new PDFDocument({ size: "A4", margin: 0, compress: true });
        const bufs = [];
        doc.on("data", bufs.push.bind(bufs));
        doc.on("end", () => resolve(Buffer.concat(bufs)));

        const { patient, vitals, bodyComposition: bc, history } = data;
        const W = 595.28, H = 841.89, M = 40, CW = W - M * 2;
        let pageNum = 0;
        const patientHeight = bc?.height || vitals.height || null;

        // ── Palette ──
        const C = {
            brand: "#F97316", brandDark: "#EA580C", brandDeep: "#C2410C", brandLight: "#FFF7ED", brandPale: "#FFFBF5",
            green: "#16A34A", greenBg: "#F0FDF4", greenLight: "#DCFCE7",
            yellow: "#CA8A04", yellowBg: "#FEFCE8",
            red: "#DC2626", redBg: "#FEF2F2",
            blue: "#2563EB", blueBg: "#EFF6FF", blueLight: "#DBEAFE",
            text: "#0F172A", textMid: "#334155", textLight: "#64748B", textMuted: "#94A3B8",
            border: "#E2E8F0", borderLight: "#F1F5F9", white: "#FFFFFF", bg: "#F8FAFC",
            dark: "#1E293B",
        };

        // ── Computed assessments ──
        const comp = {
            bp: assessBP(vitals.systolic, vitals.diastolic),
            o2: assessSpO2(vitals.oxygen),
            hr: assessPulse(vitals.bpm),
            temp: assessTempF(vitals.temperature),
            eyes: assessEyes(vitals.leftEye, vitals.rightEye),
            bmi: assessBMI(bc?.bmi),
        };

        // ── Health Score ──
        const scores = [comp.bp, comp.o2, comp.hr, comp.temp, comp.eyes, comp.bmi].filter(s => s.score > 0);
        const healthScore = scores.length ? Math.round(scores.reduce((a, s) => a + s.score, 0) / scores.length) : 0;
        function scoreColor(s) {
            if (s >= 85) return C.green;
            if (s >= 65) return C.yellow;
            return C.red;
        }
        function scoreLabel(s) {
            if (s >= 90) return "Excellent";
            if (s >= 80) return "Very Good";
            if (s >= 70) return "Good";
            if (s >= 60) return "Fair";
            return "Needs Attention";
        }

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
            doc.moveTo(M, H - 46).lineTo(W - M, H - 46).lineWidth(0.4).stroke(C.border);
            doc.fontSize(5.5).fillColor(C.textMuted).font("Helvetica")
               .text("This report is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment.", M, H - 38, { width: CW * 0.72 });
            doc.fontSize(6.5).fillColor(C.textLight)
               .text(`Page ${pageNum}`, W - M - 50, H - 38, { width: 50, align: "right" });
            doc.fontSize(6.5).fillColor(C.brand).font("Helvetica-Bold")
               .text("Reliv Health", W - M - 50, H - 28, { width: 50, align: "right" });
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

        // ═══════════════════════════════════════════
        //  HEADER — split design: white left + orange right
        // ═══════════════════════════════════════════
        const hdrH = 120;
        const splitX = 170; // where white meets orange

        // Full orange background first
        doc.rect(0, 0, W, hdrH).fill(C.brand);

        // White zone on left for logo — with curved right edge
        doc.save();
        doc.moveTo(0, 0).lineTo(splitX - 20, 0)
           .bezierCurveTo(splitX + 15, 0, splitX + 15, hdrH, splitX - 20, hdrH)
           .lineTo(0, hdrH).closePath().fill(C.white);
        doc.restore();

        // Subtle texture on orange side
        doc.save().opacity(0.05);
        doc.circle(W - 50, 25, 70).fill(C.white);
        doc.circle(W - 120, 100, 40).fill(C.white);
        doc.circle(splitX + 80, 10, 30).fill(C.white);
        doc.restore();

        // Logo on white area
        if (RELIV_LOGO_BUFFER) {
            try {
                const lH = 38;
                const lImg = doc.openImage(RELIV_LOGO_BUFFER);
                const lW = (lImg.width / lImg.height) * lH;
                const lX = (splitX - 30) / 2 - lW / 2 + 5;
                const lY = (hdrH - lH) / 2;
                doc.image(RELIV_LOGO_BUFFER, lX, lY, { height: lH });
            } catch {
                doc.fontSize(22).font("Helvetica-Bold").fillColor(C.brand).text("Reliv", 30, hdrH / 2 - 12);
            }
        } else {
            doc.fontSize(22).font("Helvetica-Bold").fillColor(C.brand).text("Reliv", 30, hdrH / 2 - 12);
        }

        // Title on orange area
        const txStart = splitX + 20;
        const txW = W - txStart - M;
        doc.fontSize(20).font("Helvetica-Bold").fillColor(C.white)
           .text("Health Report", txStart, 22, { width: txW });
        doc.save().opacity(0.9);
        doc.fontSize(9).font("Helvetica").fillColor(C.white)
           .text("Your Personalized Wellness Summary", txStart, 48, { width: txW });
        doc.restore();
        const reportDate = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
        doc.save().opacity(0.8);
        doc.fontSize(8).font("Helvetica").fillColor(C.white)
           .text(reportDate, txStart, 63, { width: txW });
        doc.restore();

        // Scan tracker on orange side — dots
        const scansDone = patient.scanCount || 1;
        const maxScans = patient.maxScans || 7;
        const scansLeft = Math.max(0, maxScans - scansDone);
        const dotY = 86;
        doc.fontSize(7).font("Helvetica-Bold").fillColor(C.white)
           .text(`${scansDone}/${maxScans} Scans`, txStart, dotY - 1);
        const dotStartX = txStart + 55;
        for (let i = 0; i < maxScans; i++) {
            const dx = dotStartX + i * 14;
            if (i < scansDone) {
                doc.circle(dx, dotY + 4, 4.5).fill(C.white);
                doc.fontSize(5.5).fillColor(C.brand).font("Helvetica-Bold")
                   .text("✓", dx - 3, dotY + 1, { width: 6, align: "center" });
            } else {
                doc.circle(dx, dotY + 4, 4.5).lineWidth(1).strokeColor(C.white).fillOpacity(0.3).fill(C.white).strokeOpacity(1).stroke();
                doc.fillOpacity(1).strokeOpacity(1);
            }
        }
        doc.fillOpacity(1).strokeOpacity(1);
        if (scansLeft > 0) {
            doc.save().opacity(0.85);
            doc.fontSize(6.5).font("Helvetica").fillColor(C.white)
               .text(`${scansLeft} remaining`, dotStartX + maxScans * 14 + 4, dotY);
            doc.restore();
        }

        // Smooth wave transition
        doc.save();
        const wt = hdrH - 14;
        doc.moveTo(0, wt)
           .bezierCurveTo(W * 0.3, wt + 18, W * 0.7, wt - 6, W, wt + 10)
           .lineTo(W, hdrH + 6).lineTo(0, hdrH + 6).closePath().fill(C.white);
        doc.restore();

        let y = hdrH + 14;

        // ═══════════════════════════════════════════
        //  HEALTH SCORE + PATIENT INFO — side by side
        // ═══════════════════════════════════════════
        y = ensure(y, 78);
        const scoreW = 110;
        const infoW = CW - scoreW - 12;

        // Health Score card
        const scX = M, scY = y;
        doc.roundedRect(scX, scY, scoreW, 74, 8).fillAndStroke(C.white, C.border);
        // Score circle
        const ctrX = scX + scoreW / 2, ctrY = scY + 32;
        const radius = 22;
        const sColor = scoreColor(healthScore);
        // Background ring
        doc.save();
        doc.circle(ctrX, ctrY, radius + 3).lineWidth(5).strokeOpacity(0.12).strokeColor(sColor).stroke();
        doc.strokeOpacity(1);
        // Score arc — draw as a thick partial circle
        const arcAngle = (healthScore / 100) * 360;
        // We'll draw the filled circle and score text
        doc.circle(ctrX, ctrY, radius).lineWidth(4.5).strokeColor(sColor).stroke();
        doc.restore();
        // Score number
        doc.fontSize(20).font("Helvetica-Bold").fillColor(sColor)
           .text(`${healthScore}`, ctrX - 18, ctrY - 10, { width: 36, align: "center" });
        doc.fontSize(6).font("Helvetica").fillColor(C.textMuted)
           .text("/ 100", ctrX - 12, ctrY + 10, { width: 24, align: "center" });
        // Label
        doc.fontSize(8).font("Helvetica-Bold").fillColor(sColor)
           .text(scoreLabel(healthScore), scX, scY + 60, { width: scoreW, align: "center" });
        doc.fontSize(6).font("Helvetica").fillColor(C.textMuted)
           .text("HEALTH SCORE", scX, scY + 4, { width: scoreW, align: "center" });

        // Patient info card
        const piX = M + scoreW + 12, piY = y;
        doc.roundedRect(piX, piY, infoW, 74, 8).fillAndStroke(C.white, C.border);
        const p1 = piX + 14, p2 = piX + infoW * 0.52;
        doc.fontSize(6.5).fillColor(C.textMuted).font("Helvetica").text("PATIENT NAME", p1, piY + 8);
        doc.fontSize(11).fillColor(C.text).font("Helvetica-Bold").text(patient.name || "—", p1, piY + 18);
        doc.fontSize(6.5).fillColor(C.textMuted).font("Helvetica").text("AGE / GENDER", p2, piY + 8);
        doc.fontSize(11).fillColor(C.text).font("Helvetica-Bold").text([patient.age, patient.gender].filter(Boolean).join(" / ") || "—", p2, piY + 18);
        doc.fontSize(6.5).fillColor(C.textMuted).font("Helvetica").text("EMAIL", p1, piY + 38);
        doc.fontSize(8.5).fillColor(C.textMid).font("Helvetica").text(patient.email || "—", p1, piY + 48);
        doc.fontSize(6.5).fillColor(C.textMuted).font("Helvetica").text("PHONE", p2, piY + 38);
        doc.fontSize(8.5).fillColor(C.textMid).font("Helvetica").text(patient.phone || "—", p2, piY + 48);
        // Height & Weight quick chips at bottom
        if (patientHeight || bc?.weight) {
            const chipY = piY + 60;
            let cx = p1;
            if (patientHeight) {
                doc.roundedRect(cx, chipY, 52, 12, 6).fill(C.brandLight);
                doc.fontSize(6.5).fillColor(C.textMid).font("Helvetica-Bold").text(`${patientHeight} cm`, cx + 5, chipY + 2);
                cx += 57;
            }
            if (bc?.weight) {
                doc.roundedRect(cx, chipY, 48, 12, 6).fill(C.brandLight);
                doc.fontSize(6.5).fillColor(C.textMid).font("Helvetica-Bold").text(`${bc.weight} kg`, cx + 5, chipY + 2);
            }
        }

        y += 86;

        // ═══════════════════════════════════════════
        //  VITAL SIGNS — 2×2 grid
        // ═══════════════════════════════════════════
        y = sectionTitle("Vital Signs", y);
        const vArr = [
            { label: "Blood Pressure", val: `${vitals.systolic || "—"}/${vitals.diastolic || "—"}`, unit: "mmHg", st: comp.bp.label, adv: comp.bp.advice, sc: comp.bp.score },
            { label: "Oxygen Saturation", val: `${vitals.oxygen || "—"}`, unit: "%", st: comp.o2.label, adv: comp.o2.advice, sc: comp.o2.score },
            { label: "Pulse Rate", val: `${vitals.bpm || "—"}`, unit: "BPM", st: comp.hr.label, adv: comp.hr.advice, sc: comp.hr.score },
            { label: "Body Temperature", val: `${vitals.temperature || "—"}`, unit: "°F", st: comp.temp.label, adv: comp.temp.advice, sc: comp.temp.score },
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
            // Mini score indicator
            if (v.sc > 0) {
                const msX = x + cW2 - 28, msY = ty;
                doc.fontSize(12).font("Helvetica-Bold").fillColor(scoreColor(v.sc))
                   .text(`${v.sc}`, msX, msY, { width: 20, align: "right" });
                doc.fontSize(5).fillColor(C.textMuted).font("Helvetica")
                   .text("/100", msX + 4, msY + 12, { width: 20, align: "right" });
            }
            doc.fontSize(6.5).fillColor(C.textMid).font("Helvetica")
               .text(v.adv || "", tx, ty + 53, { width: cW2 - 24, lineGap: 0.5 });
            if (col === 1) y += cH2 + 8;
        }
        if (vArr.length % 2 === 0 && vArr.length > 0) { /* y already advanced */ }
        y += 2;

        // ═══ EYESIGHT ═══
        y = ensure(y, 52);
        const eSc = statusClr(comp.eyes.note);
        doc.roundedRect(M, y, CW, 48, 6).fillAndStroke(C.white, C.border);
        doc.roundedRect(M, y, 3.5, 48, 2).fill(eSc.dot);
        doc.fontSize(6.5).fillColor(C.textMuted).font("Helvetica").text("VISUAL ACUITY", M + 12, y + 6);
        doc.fontSize(14).fillColor(C.text).font("Helvetica-Bold").text(comp.eyes.summary || "—", M + 12, y + 16);
        badge(comp.eyes.note || "—", M + 12, y + 33, eSc);
        if (comp.eyes.score > 0) {
            doc.fontSize(12).font("Helvetica-Bold").fillColor(scoreColor(comp.eyes.score))
               .text(`${comp.eyes.score}`, M + CW - 38, y + 6, { width: 26, align: "right" });
            doc.fontSize(5).fillColor(C.textMuted).font("Helvetica")
               .text("/100", M + CW - 30, y + 18, { width: 26, align: "right" });
        }
        doc.fontSize(6.5).fillColor(C.textMid).font("Helvetica")
           .text(comp.eyes.comment || "", M + CW * 0.5, y + 8, { width: CW * 0.38, lineGap: 0.5 });
        y += 58;

        // ═══ BODY COMPOSITION ═══
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

            // Progress bars
            const mets = [];
            if (bc.bodyFat != null) mets.push({ label: "Body Fat", value: `${Number(bc.bodyFat).toFixed(1)}%`, pct: Math.min(bc.bodyFat / 40 * 100, 100), color: bc.bodyFat > 25 ? C.yellow : C.brand });
            if (bc.muscleMass != null) mets.push({ label: "Muscle Mass", value: `${Number(bc.muscleMass).toFixed(1)} kg`, pct: Math.min(bc.muscleMass / 80 * 100, 100), color: C.green });
            if (bc.waterPercentage != null) mets.push({ label: "Body Water", value: `${Number(bc.waterPercentage).toFixed(1)}%`, pct: Math.min(bc.waterPercentage / 80 * 100, 100), color: C.blue });
            if (bc.boneMass != null) mets.push({ label: "Bone Mass", value: `${Number(bc.boneMass).toFixed(1)} kg`, pct: Math.min(bc.boneMass / 5 * 100, 100), color: "#6366F1" });
            if (bc.bmr != null) mets.push({ label: "BMR", value: `${Math.round(bc.bmr)} kcal`, pct: Math.min(bc.bmr / 2500 * 100, 100), color: C.brand });
            if (bc.visceralFat != null) mets.push({ label: "Visceral Fat", value: `${bc.visceralFat}`, pct: Math.min(bc.visceralFat / 20 * 100, 100), color: bc.visceralFat > 12 ? C.red : C.brand });

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

        // ═══ INSIGHTS ═══
        y = sectionTitle("What It Means — In Simple Words", y);
        const ins = [];
        if (vitals.systolic && vitals.diastolic) {
            const s = comp.bp.label;
            if (s === "Normal") ins.push({ t: "Your blood pressure is healthy. Keep it up!", c: C.green });
            else if (s === "Low") ins.push({ t: "Blood pressure is low. Stay hydrated, eat well.", c: C.yellow });
            else ins.push({ t: "Blood pressure is elevated. Reduce salt, manage stress.", c: C.red });
        }
        if (vitals.oxygen) {
            const o = Number(vitals.oxygen);
            ins.push(o >= 95 ? { t: `Oxygen ${o}% — healthy.`, c: C.green } : { t: `Oxygen ${o}% — try deep breathing.`, c: C.red });
        }
        if (vitals.bpm) {
            const h = Number(vitals.bpm);
            ins.push(h >= 60 && h <= 100 ? { t: `Heart rate ${h} BPM — normal range.`, c: C.green } : { t: `Heart rate ${h} BPM — outside normal. Rest & hydrate.`, c: h < 60 ? C.yellow : C.red });
        }
        if (vitals.temperature) {
            const t = Number(vitals.temperature);
            ins.push(t >= 97 && t <= 99 ? { t: `Temperature ${t}°F — normal.`, c: C.green } : { t: `Temperature ${t}°F — outside normal. Monitor.`, c: t > 99 ? C.red : C.yellow });
        }
        if (bc?.bmi) {
            const b = Number(bc.bmi);
            if (b < 18.5) ins.push({ t: `BMI ${b.toFixed(1)} — underweight. Focus on nutrition.`, c: C.yellow });
            else if (b < 25) ins.push({ t: `BMI ${b.toFixed(1)} — healthy range!`, c: C.green });
            else if (b < 30) ins.push({ t: `BMI ${b.toFixed(1)} — above ideal. 30 min daily walk helps.`, c: C.yellow });
            else ins.push({ t: `BMI ${b.toFixed(1)} — elevated. Diet + exercise recommended.`, c: C.red });
        }
        if (!ins.length) ins.push({ t: "More tests needed for insights.", c: C.textLight });

        const iH = ins.length * 16 + 12;
        y = ensure(y, iH + 4);
        doc.roundedRect(M, y, CW, iH, 6).fill(C.bg);
        let iy = y + 7;
        ins.forEach((i) => {
            iy = ensure(iy, 16);
            doc.circle(M + 14, iy + 4, 2.5).fill(i.c);
            doc.fontSize(8).fillColor(C.textMid).font("Helvetica").text(i.t, M + 24, iy, { width: CW - 40 });
            iy += 16;
        });
        y = iy + 8;

        // ═══ HEALTH TREND — improved ═══
        const hist = (history && Array.isArray(history)) ? history.slice(-7) : [];
        if (hist.length > 1) {
            y = ensure(y, 200);
            y = sectionTitle("Health Trend", y);
            y = ensure(y, 175);

            // Chart box
            const boxW = CW, boxH = 120;
            const padL = 30, padR = 10, padT = 10, padB = 24;
            doc.roundedRect(M, y, boxW, boxH, 6).fillAndStroke(C.white, C.border);

            const cL = M + padL, cR = M + boxW - padR, cT = y + padT, cBt = y + boxH - padB;
            const cWd = cR - cL, cHt = cBt - cT;
            const n = hist.length;

            // Auto Y range
            const allVals = hist.flatMap(h => [h.systolic || 0, h.bpm || 0]).filter(v => v > 0);
            const dMin = Math.min(...allVals), dMax = Math.max(...allVals);
            const yMin = Math.floor((dMin - 10) / 10) * 10;
            const yMax = Math.ceil((dMax + 10) / 10) * 10;
            const mapYv = (v) => cBt - ((v - yMin) / (yMax - yMin)) * cHt;

            // Grid
            const steps = 4;
            for (let i = 0; i <= steps; i++) {
                const tick = yMin + ((yMax - yMin) * i) / steps;
                const gy = mapYv(tick);
                doc.moveTo(cL, gy).lineTo(cR, gy).lineWidth(0.3).strokeColor(C.borderLight).stroke();
                doc.fontSize(5).fillColor(C.textMuted).font("Helvetica")
                   .text(`${Math.round(tick)}`, M + 2, gy - 3, { width: 25, align: "right" });
            }

            // Normal BP zone highlight
            const z1 = Math.max(mapYv(Math.min(130, yMax)), cT);
            const z2 = Math.min(mapYv(Math.max(110, yMin)), cBt);
            if (z2 > z1) {
                doc.save().opacity(0.06);
                doc.rect(cL, z1, cWd, z2 - z1).fill(C.green);
                doc.restore();
                // Label
                doc.save().opacity(0.4);
                doc.fontSize(4.5).fillColor(C.green).font("Helvetica")
                   .text("Normal", cR - 28, z1 + 2);
                doc.restore();
            }

            const sX = n > 1 ? cWd / (n - 1) : 0;

            // Systolic area fill
            doc.save().opacity(0.08);
            doc.moveTo(cL, mapYv(hist[0].systolic || 120));
            for (let i = 1; i < n; i++) doc.lineTo(cL + i * sX, mapYv(hist[i].systolic || 120));
            doc.lineTo(cL + (n - 1) * sX, cBt).lineTo(cL, cBt).closePath().fill(C.brand);
            doc.restore();

            // Systolic line + dots
            doc.lineWidth(2).strokeColor(C.brand).lineJoin("round").lineCap("round");
            for (let i = 0; i < n; i++) {
                const px = cL + i * sX, py = mapYv(hist[i].systolic || 120);
                if (i === 0) doc.moveTo(px, py); else doc.lineTo(px, py);
            }
            doc.stroke();
            for (let i = 0; i < n; i++) {
                const px = cL + i * sX, py = mapYv(hist[i].systolic || 120);
                doc.circle(px, py, 3).fill(C.white);
                doc.circle(px, py, 2).fill(C.brand);
            }

            // HR line + dots
            doc.lineWidth(1.5).strokeColor(C.green).lineJoin("round").lineCap("round");
            for (let i = 0; i < n; i++) {
                const px = cL + i * sX, py = mapYv(hist[i].bpm || 72);
                if (i === 0) doc.moveTo(px, py); else doc.lineTo(px, py);
            }
            doc.stroke();
            for (let i = 0; i < n; i++) {
                const px = cL + i * sX, py = mapYv(hist[i].bpm || 72);
                doc.circle(px, py, 2.5).fill(C.white);
                doc.circle(px, py, 1.5).fill(C.green);
            }

            // X-axis date labels
            for (let i = 0; i < n; i++) {
                const px = cL + i * sX;
                const lbl = hist[i].date ? new Date(hist[i].date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : `#${i + 1}`;
                doc.fontSize(5).fillColor(C.textMuted).font("Helvetica")
                   .text(lbl, px - 16, cBt + 4, { width: 32, align: "center" });
            }

            // Legend
            const lgX = cR - 110, lgY = cBt + 4;
            doc.circle(lgX, lgY + 3, 2.5).fill(C.brand);
            doc.fontSize(5.5).fillColor(C.textMid).font("Helvetica").text("Systolic BP (mmHg)", lgX + 5, lgY);
            doc.circle(lgX + 75, lgY + 3, 2.5).fill(C.green);
            doc.text("Heart Rate (BPM)", lgX + 80, lgY);
            y += boxH + 6;

            // ── Data table below chart ──
            y = ensure(y, n * 13 + 20);
            const colWidths = [55, 55, 55, 55, 55];
            const tblW = colWidths.reduce((a, b) => a + b, 0);
            const tblX = M + (CW - tblW) / 2;

            // Header row
            doc.roundedRect(tblX, y, tblW, 13, 3).fill(C.dark);
            const headers = ["Date", "Systolic", "Diastolic", "Pulse", "SpO2"];
            let hx = tblX;
            headers.forEach((h, i) => {
                doc.fontSize(6).fillColor(C.white).font("Helvetica-Bold")
                   .text(h, hx + 3, y + 3, { width: colWidths[i] - 6, align: "center" });
                hx += colWidths[i];
            });
            y += 13;

            // Data rows
            hist.forEach((h, ri) => {
                const bg = ri % 2 === 0 ? C.white : C.bg;
                doc.rect(tblX, y, tblW, 12).fill(bg);
                const row = [
                    h.date ? new Date(h.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }) : `#${ri + 1}`,
                    `${h.systolic || "—"}`,
                    `${h.diastolic || "—"}`,
                    `${h.bpm || "—"}`,
                    `${h.oxygen || "—"}%`,
                ];
                let rx = tblX;
                row.forEach((val, ci) => {
                    doc.fontSize(6).fillColor(C.textMid).font("Helvetica")
                       .text(val, rx + 3, y + 2.5, { width: colWidths[ci] - 6, align: "center" });
                    rx += colWidths[ci];
                });
                y += 12;
            });
            y += 8;
        }

        // ═══ ACTION PLAN ═══
        y = ensure(y, 60);
        y = sectionTitle("Your 7-Day Action Plan", y);
        const acts = [];
        if (comp.bp.label === "High") acts.push("Reduce salt to under 5g/day. Avoid pickles, papad, processed snacks.");
        if (comp.bp.label === "Low") acts.push("Stay hydrated — 8+ glasses of water daily.");
        if (Number(vitals.bpm) > 100) acts.push("Limit caffeine. Try 10 min of meditation before sleep.");
        if (Number(vitals.oxygen) < 95) acts.push("Deep breathing: inhale 4s, hold 4s, exhale 6s — 5 times daily.");
        if (bc?.bmi && Number(bc.bmi) >= 25) acts.push("Walk briskly 30 min daily. Replace sugary drinks with water.");
        if (bc?.bmi && Number(bc.bmi) < 18.5) acts.push("Eat nutrient-dense foods: nuts, eggs, paneer, bananas.");
        acts.push("Come back for your next checkup — your trend graph grows with each visit!");
        acts.push("Save this report. Follow these steps for 7 days and compare your numbers.");

        const aH = acts.length * 18 + 12;
        y = ensure(y, aH + 4);
        doc.roundedRect(M, y, CW, aH, 6).fill(C.bg);
        let ay = y + 7;
        acts.forEach((a, i) => {
            ay = ensure(ay, 16);
            doc.circle(M + 14, ay + 4, 6.5).fill(C.brand);
            doc.fontSize(7).fillColor(C.white).font("Helvetica-Bold")
               .text(`${i + 1}`, M + 10, ay + 1, { width: 9, align: "center" });
            doc.fontSize(7.5).fillColor(C.textMid).font("Helvetica")
               .text(a, M + 26, ay + 0.5, { width: CW - 38 });
            ay += 18;
        });
        y = ay + 6;

        // ═══ ECO STATS ═══
        if (ecoStats) {
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
    });
}

// ═══ RUN ═══
console.log("Generating premium PDF (7 scans)...");
const buf = await generateReportPdf(sampleData, ecoStats);
const out = path.join(__dirname, "test-report.pdf");
createWriteStream(out).end(buf);
console.log(`Saved: ${out}`);
console.log(`Size: ${(buf.length / 1024).toFixed(1)} KB (${(buf.length / 1048576).toFixed(3)} MB)`);
exec(`start "" "${out}"`);
