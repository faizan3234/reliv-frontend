import React, { useEffect, useState } from "react";
import VirtualKeyboard from "../components/VirtualKeyboard";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useHealth } from "../context/HealthContext";
import { usePageSpeech } from "../context/SpeechContext";

export default function EyeSight() {
  usePageSpeech("eyesight");
  const navigate = useNavigate();
  const { update } = useHealth();

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      @keyframes slideIn{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:translateX(0)}}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
      @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}

      body{background:#fff;margin:0;font-family:'Inter',system-ui,sans-serif}

      .vision-container{
        height:100vh;
        display:flex;
        align-items:flex-start;
        justify-content:center;
        padding:16px;
        padding-bottom:32px;
        background:linear-gradient(135deg,#fff5eb 0%,#ffffff 50%,#fef3e8 100%);
        overflow-y:auto;
        overscroll-behavior:contain;
        -webkit-overflow-scrolling:touch;
        box-sizing:border-box;
      }
      .vision-container::before{content:'';position:fixed;top:0;left:0;right:0;bottom:0;background:radial-gradient(circle at 20% 50%,rgba(255,106,0,0.08),transparent 50%),radial-gradient(circle at 80% 80%,rgba(255,140,66,0.08),transparent 50%);pointer-events:none;z-index:0}

      .vision-app{
        max-width:560px;
        width:100%;
        margin:0 auto;
        background:#ffffff;
        border-radius:20px;
        box-shadow:0 20px 60px rgba(255,106,0,.12),0 0 0 1px rgba(255,106,0,.1);
        padding:28px 24px;
        position:relative;
        animation:fadeIn .6s ease-out;
        /* REMOVED transform:scale(1.05) — was causing overflow */
        z-index:1;
      }
      .vision-app::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#ff6a00,#ff8c42,#ff6a00);border-radius:20px 20px 0 0}

      .vision-back{
        position:fixed;
        top:16px;left:16px;
        width:44px;height:44px;
        background:#fff;
        border:2px solid #fed7aa;
        border-radius:50%;
        font-size:20px;
        cursor:pointer;
        color:#ea580c;
        box-shadow:0 4px 12px rgba(255,106,0,.15);
        transition:all .3s;
        display:flex;align-items:center;justify-content:center;
        z-index:999;
        font-weight:700;
      }
      .vision-back:hover{transform:scale(1.08);box-shadow:0 6px 20px rgba(255,106,0,.25);background:#fff5eb;border-color:#ff6a00}
      .vision-back:active{transform:scale(.95)}

      .vision-logo-container{display:flex;justify-content:center;margin-bottom:14px;animation:bounce 2s ease-in-out infinite}

      .vision-header{display:flex;justify-content:center;align-items:center;padding-bottom:14px;margin-bottom:18px;border-bottom:2px solid #fed7aa;animation:slideIn .5s ease-out}
      .vision-system{font-size:13px;color:#16a34a;font-weight:700;background:linear-gradient(135deg,#d1fae5,#a7f3d0);padding:7px 16px;border-radius:24px;display:inline-flex;align-items:center;gap:8px;box-shadow:0 2px 8px rgba(16,185,129,.2)}
      .vision-system::before{content:'●';font-size:11px;animation:pulse 2s ease-in-out infinite}

      .vision-subtitle{font-size:13px;color:#78716c;margin-bottom:18px;text-align:center;font-weight:600;letter-spacing:0.3px}

      .vision-info{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px;animation:fadeIn .7s ease-out .2s both}
      .vision-info-card{background:linear-gradient(135deg,#fff7ed 0%,#ffedd5 100%);border:2px solid #fed7aa;border-radius:12px;padding:10px 8px;text-align:center;font-size:11px;color:#9a3412;font-weight:600;transition:all .3s;box-shadow:0 2px 8px rgba(255,106,0,.08)}
      .vision-info-card b{display:block;font-size:15px;color:#ea580c;margin-top:4px}

      .vision-chart{border:2px solid #fed7aa;border-radius:16px;padding:18px 12px;background:linear-gradient(to bottom,#ffffff,#fffbf5);margin-bottom:22px;box-shadow:inset 0 2px 4px rgba(0,0,0,.02);animation:fadeIn .8s ease-out .3s both;overflow-x:hidden}

      .vision-row{display:flex;justify-content:center;align-items:center;gap:10px;margin:3px 0;padding:2px 0;transition:all .2s}
      .vision-row:hover{background:rgba(255,106,0,.06);border-radius:8px}
      .vision-no{width:28px;font-size:12px;color:#a8a29e;text-align:right;font-weight:700;flex-shrink:0}
      .vision-letter{min-width:0;flex:1;text-align:center;font-weight:700;letter-spacing:4px;color:#1c1917;overflow:hidden}

      .s1{font-size:40px}.s2{font-size:34px}.s3{font-size:28px}.s4{font-size:23px}.s5{font-size:19px}.s6{font-size:16px}.s7{font-size:13px}.s8{font-size:11px}.s9{font-size:10px}.s10{font-size:8.5px}.s11{font-size:7.5px}.s12{font-size:6.5px}.s13{font-size:6px}

      /* ── EYE SELECTS – FIXED ── */
      .vision-form{
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:14px;
        margin-bottom:22px;
        animation:fadeIn .9s ease-out .4s both;
      }
      .vision-field label{font-size:14px;font-weight:700;color:#292524;display:block;margin-bottom:6px}
      .vision-field p{font-size:11px;margin:0 0 8px;color:#78716c;font-style:italic}

      .vision-select{
        width:100%;
        padding:14px 12px;
        border-radius:12px;
        border:2px solid #fed7aa;
        font-size:17px;          /* bigger text so value is clearly visible */
        font-weight:700;
        color:#ea580c;
        background:#fff7ed;
        transition:all .3s;
        box-shadow:0 2px 6px rgba(255,106,0,.08);
        cursor:pointer;
        appearance:auto;         /* keep native arrow visible */
        -webkit-appearance:auto;
        box-sizing:border-box;
      }
      .vision-select:focus{outline:none;border-color:#ff6a00;box-shadow:0 0 0 4px rgba(255,106,0,.15)}

      .vision-input{
        width:100%;
        padding:13px 16px;
        border-radius:12px;
        border:2px solid #fed7aa;
        font-size:16px;
        font-weight:600;
        color:#1c1917;
        background:#fff;
        transition:all .3s;
        box-shadow:0 2px 6px rgba(255,106,0,.06);
        box-sizing:border-box;
      }
      .vision-input:focus{outline:none;border-color:#ff6a00;box-shadow:0 0 0 4px rgba(255,106,0,.15)}

      .vision-btn{
        width:100%;
        background:linear-gradient(135deg,#ff6a00 0%,#ff8c42 100%);
        color:#fff;border:none;
        padding:16px;
        border-radius:14px;
        font-size:16px;font-weight:700;
        cursor:pointer;
        transition:all .3s;
        box-shadow:0 8px 20px rgba(255,106,0,.3),inset 0 1px 0 rgba(255,255,255,.3);
        letter-spacing:0.5px;
        touch-action:manipulation;
      }
      .vision-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 12px 28px rgba(255,106,0,.4)}
      .vision-btn:active:not(:disabled){transform:translateY(0)}
      .vision-btn:disabled{background:linear-gradient(135deg,#d6d3d1,#a8a29e);cursor:not-allowed;transform:none;box-shadow:none;opacity:0.6}

      .vision-question{background:linear-gradient(135deg,#fefce8 0%,#fef9c3 100%);border:2px solid #fde047;border-radius:16px;padding:20px;margin-top:20px;animation:fadeIn .4s ease-out;box-shadow:0 8px 16px rgba(253,224,71,.2)}
      .vision-question>div{font-size:15px;font-weight:700;color:#713f12;margin-bottom:12px;line-height:1.6}

      .vision-status{margin-top:20px;padding:16px;border-radius:14px;font-size:14px;text-align:center;font-weight:700;transition:all .3s;animation:fadeIn .4s ease-out}
      .vision-status.vision-ok{background:linear-gradient(135deg,#d1fae5 0%,#a7f3d0 100%);border:2px solid #34d399;color:#065f46;box-shadow:0 8px 16px rgba(52,211,153,.25)}
      .vision-status.vision-fail{background:linear-gradient(135deg,#fee2e2 0%,#fecaca 100%);border:2px solid #f87171;color:#7f1d1d;box-shadow:0 8px 16px rgba(248,113,113,.25)}
      .vision-status:not(.vision-ok):not(.vision-fail){background:linear-gradient(135deg,#fff7ed,#ffedd5);border:2px solid #fed7aa;color:#78716c}

      .vision-footer{margin-top:24px;text-align:center;font-size:11px;color:#a8a29e;font-weight:500;letter-spacing:0.5px;padding-bottom:24px}

      .vision-container.kb-open{padding-bottom:320px}
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const base = [
    "E", "FP", "TOZ", "LPED", "PECFD", "EDFCZP",
    "FELOPZD", "DEFPOTEC", "LEFODPCT", "TDPLTCEO",
    "PEZOLCFD", "FDTCOPEL", "CLEPOTFD"
  ];

  const [lines, setLines] = useState([]);
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [userInput, setUserInput] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [status, setStatus] = useState("Pending Verification");
  const [statusType, setStatusType] = useState("pending");
  const [showQuestion, setShowQuestion] = useState(false);

  const shuffle = (s) => s.split("").sort(() => Math.random() - 0.5).join("");

  useEffect(() => {
    setLines(base.map(l => shuffle(l)));
  }, []);

  const startTest = () => {
    if (!left || !right) {
      alert("Please select results for both eyes");
      return;
    }
    const lv = parseInt(left, 10);
    const rv = parseInt(right, 10);
    const eye = lv <= rv ? "Left" : "Right";
    let lineNo = eye === "Left" ? lv - 2 : rv - 2;
    if (lineNo < 1) lineNo = 1;
    askQuestion(eye, lineNo);
  };

  const askQuestion = (eye, lineNo) => {
    const txt = lines[lineNo - 1];
    const pos = Math.floor(Math.random() * txt.length);
    setAnswer(txt[pos]);
    setQuestion(`${eye} Eye — Line ${lineNo}: What is the ${pos + 1}ᵗʰ letter?`);
    setUserInput("");
    setShowQuestion(true);
  };

  const checkAnswer = () => {
    if (userInput.toUpperCase() === answer) {
      setStatus(`✔ Verified | Left: ${left} | Right: ${right} | 19cm`);
      setStatusType("ok");

      const advice = (val) =>
        Number(val) >= 9 ? "Good eye sight, maintain healthy habits." :
        Number(val) >= 3 ? "Fair eye sight, consider regular check-ups." :
                           "Poor eye sight, consult a doctor.";

      update({
        vitals: {
          leftEye: left,
          rightEye: right,
          leftEyeAdvice: advice(left),
          rightEyeAdvice: advice(right),
        },
      });

      setTimeout(() => navigate("/body-temperature"), 2000);
    } else {
      setStatus("✖ Verification Failed. Please retry.");
      setStatusType("fail");
    }
    setShowQuestion(false);
  };

  const handleKeyboardChange = (inputName, value) => {
    setUserInput(value.toUpperCase().slice(0, 1));
  };

  return (
    <div className={`vision-container scrollable-container${keyboardVisible ? " kb-open" : ""}`}>
      <button className="vision-back" onClick={() => navigate(-1)} aria-label="back">←</button>

      <div className="vision-app">
        <div className="vision-logo-container"><Logo /></div>

        <div className="vision-header">
          <div className="vision-system">System Active</div>
        </div>

        <div className="vision-subtitle">Near Vision Screening • Clinical Mode • 19 cm</div>

        <div className="vision-info">
          <div className="vision-info-card">Distance<b>19 cm</b></div>
          <div className="vision-info-card">Chart<b>Randomized</b></div>
          <div className="vision-info-card">Mode<b>Single Eye</b></div>
        </div>

        <div className="vision-chart">
          {lines.map((t, i) => (
            <div className="vision-row" key={i}>
              <div className="vision-no">{i + 1}</div>
              <div className={`vision-letter s${i + 1}`}>{t.split("").join(" ")}</div>
            </div>
          ))}
        </div>

        <div className="vision-form">
          <div className="vision-field">
            <label>Left Eye</label>
            <p>Cover right eye completely</p>
            {/* KEY FIX: value is string, options are strings — consistent */}
            <select
              className="vision-select"
              value={left}
              onChange={e => setLeft(e.target.value)}
            >
              <option value="">— Select —</option>
              {Array.from({ length: 13 }, (_, i) => (
                <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
              ))}
            </select>
          </div>

          <div className="vision-field">
            <label>Right Eye</label>
            <p>Cover left eye completely</p>
            <select
              className="vision-select"
              value={right}
              onChange={e => setRight(e.target.value)}
            >
              <option value="">— Select —</option>
              {Array.from({ length: 13 }, (_, i) => (
                <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
              ))}
            </select>
          </div>
        </div>

        {statusType !== "ok" && (
          <button className="vision-btn" onClick={startTest} disabled={!left || !right}>
            Start Verification
          </button>
        )}

        {showQuestion && (
          <div className="vision-question">
            <div><b>{question}</b></div>
            <input
              className="vision-input"
              value={userInput}
              onFocus={() => setKeyboardVisible(true)}
              placeholder="Enter letter"
              style={{ marginTop: "8px", cursor: "pointer" }}
              maxLength={1}
              readOnly
              disabled={statusType === "ok"}
            />
            {keyboardVisible && (
              <div style={{ marginTop: 12 }}>
                <VirtualKeyboard
                  inputName="userInput"
                  inputs={{ userInput }}
                  onChange={handleKeyboardChange}
                  onClose={() => setKeyboardVisible(false)}
                />
              </div>
            )}
            {statusType !== "ok" && (
              <button
                className="vision-btn"
                style={{ marginTop: "8px" }}
                onClick={checkAnswer}
                disabled={!userInput}
              >
                Submit
              </button>
            )}
          </div>
        )}

        <div className={`vision-status ${statusType === "ok" ? "vision-ok" : statusType === "fail" ? "vision-fail" : ""}`}>
          Status: {status}
        </div>

        <div className="vision-footer">© Reliv Health Technologies • ISO Compliant Module</div>
      </div>
    </div>
  );
}
