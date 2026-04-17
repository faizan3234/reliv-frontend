import React, { useMemo, useState, useEffect, useRef } from "react";
import { useHealth } from "../context/HealthContext";
import { motion } from "framer-motion"; // eslint-disable-line no-unused-vars
import { useNavigate } from "react-router-dom";
import * as bodyCompositionUtils from "../utils/bodyComposition";
import Logo from "../components/Logo";
import Confetti from "react-confetti";
import { useSpeech } from "../context/SpeechContext";
import ChallengeComparison from "../components/ChallengeComparison";
import { supabase } from "../config/supabase";
import { QRCodeSVG } from "qrcode.react";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

// Helper: Extract first name from email or name field
const getFirstName = (patient) => {
  if (patient?.name) return patient.name.split(' ')[0];
  if (patient?.email) return patient.email.split('@')[0].split('.')[0];
  return 'Champion';
};

// Helper: Gender-specific compliments
const getGenderCompliment = (gender, tier = 'high') => {
  const isMale = gender?.toLowerCase() === 'male';
  if (tier === 'high') {
    return isMale ? '💪 Keep slaying, king!' : '👑 You slay, queen!';
  } else if (tier === 'elite') {
    return isMale ? '🔥 You absolute beast!' : '🔥 Absolute queen energy!';
  } else if (tier === 'mid') {
    return isMale ? 'Keep pushing, champ!' : 'You\'re doing amazing!';
  }
  return 'Keep it up!';
};

const Report1 = () => {
  const { speakText, stop } = useSpeech();
  const { data, refreshHistory } = useHealth();
  const { patient, vitals } = data;
  const navigate = useNavigate();
  const [showTooltip, setShowTooltip] = useState(false);

  const userName = getFirstName(patient);
  const scanCount = (data.history?.length || 0) + 1;

  // Leaderboard opt-in state
  const [lbPrompt, setLbPrompt] = useState("idle"); // idle | qr | done | skipped | not_qualified
  const [lbSessionId] = useState(() => `lb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const QR_BASE = import.meta.env.VITE_QR_BASE_URL || "https://mail-request-m33c.vercel.app";

  // Challenge state
  const [showChallenge, setShowChallenge] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("reliv_challenge");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.expiresAt > Date.now()) setShowChallenge(true);
      }
    } catch { /* ignore */ }
  }, []);

  const bodyScoreData = useMemo(() => {
    if (
      !vitals?.weight ||
      !patient?.age ||
      !patient?.gender ||
      !vitals?.height ||
      !vitals?.impedance
    ) {
      return { score: null, metabolicAge: null };
    }

    const sex = patient.gender.toLowerCase() === "male" ? 1 : 0;
    const { weight, height, impedance } = vitals;
    const { age } = patient;

    const body_score = bodyCompositionUtils.calc_body_score(weight, height, sex, age, impedance);
    const metabolic_age = bodyCompositionUtils.calc_metabolic_age(
      bodyCompositionUtils.calc_bmr(weight, height, sex, age),
      age,
      sex
    );

    return {
      score: Math.round(body_score),
      metabolicAge: Math.round(metabolic_age),
    };
  }, [vitals, patient]);

  const bodyComposition = useMemo(() => {
    if (
      !vitals?.weight ||
      !patient?.age ||
      !patient?.gender ||
      !vitals?.height ||
      !vitals?.impedance
    ) {
      return null;
    }

    const sex = patient.gender.toLowerCase() === "male" ? 1 : 0;
    const { weight, height, impedance } = vitals;
    const { age } = patient;

    const bmr = bodyCompositionUtils.calc_bmr(weight, height, sex, age);
    const body_score = bodyCompositionUtils.calc_body_score(weight, height, sex, age, impedance);
    const metabolic_age = bodyCompositionUtils.calc_metabolic_age(bmr, age, sex);

    return {
      weight,
      height,
      impedance,
      sex,
      age,
      bmr: Math.round(bmr),
      bodyScore: Math.round(body_score),
      metabolicAge: Math.round(metabolic_age),
    };
  }, [vitals, patient]);

  const hasSavedRef = useRef(false);
  const scanTimestampRef = useRef(Date.now());

  useEffect(() => {
    if (!patient?.email || !bodyComposition || hasSavedRef.current) return;

    hasSavedRef.current = true;

    (async () => {
      try {
        await fetch(`${API_BASE}/api/save-report`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            healthData: {
              patient,
              vitals,
              bodyComposition,
            },
            scanId: `${patient.email}-${scanTimestampRef.current}`,
          }),
        });

        await refreshHistory();
      } catch (err) {
        if (import.meta.env.DEV) console.error("Failed to save report:", err);
      }
    })();
  }, [bodyComposition, patient?.email, patient, vitals, refreshHistory]);

  // ── Dynamic speech: read user's name, score, elite status ──
  const speechFired = useRef(false);
  useEffect(() => {
    if (speechFired.current) return;
    speechFired.current = true;
    const timer = setTimeout(() => {
      const name = userName || "Champion";
      const score = bodyScoreData.score;
      const metAge = bodyScoreData.metabolicAge;
      let text = `${name}, this is your health score compared to an average person your age.`;
      if (score !== null) {
        text += ` Your body score is ${score} out of 100.`;
        if (score >= 80) text += ` You are an elite performer! Incredible.`;
        else if (score >= 60) text += ` Good score. Keep it up.`;
        else text += ` There is room to improve. Let's work on it.`;
      }
      if (metAge !== null) {
        text += ` Your metabolic age is ${metAge} years.`;
        if (patient?.age && metAge < patient.age) {
          text += ` That's ${patient.age - metAge} years younger than your actual age!`;
        }
      }
      text += ` Come back next time to see if it improved.`;
      speakText(text);
    }, 400);
    return () => { clearTimeout(timer); stop(); };
  }, []);

  const peersAverage = 72;
  const yearsYounger = bodyScoreData.metabolicAge
    ? Math.max(0, patient?.age - bodyScoreData.metabolicAge)
    : 0;

  const isTopPerformer = bodyScoreData.score ? bodyScoreData.score >= 80 : false;

  // Indian-specific household remedies based on score
  const getRemedies = (score) => {
    if (score >= 70) {
      return [
        'Maintenance: Haldi doodh (turmeric milk) nightly for anti-inflammation',
        'Triphala churna before bed for detox',
        'Continue balanced diet with moderate ghee in dal',
        'Maintain 7-8 hours sleep and consistent activity'
      ];
    } else if (score >= 50) {
      return [
        'Methi (fenugreek) seeds soaked overnight to control blood sugar',
        'Moong dal soup for balanced, light dinners',
        'Jeera (cumin) water in morning for metabolism boost',
        'Add 30-minute daily walks, gradually increase to 10k steps'
      ];
    } else if (score >= 30) {
      return [
        'Start with Jeera water empty stomach every morning',
        'Add protein: Dal, paneer, or besan chilla daily',
        'Haldi water before meals for metabolism',
        'Begin with 20-minute post-meal walks',
        'Replace white rice with brown rice or millets gradually'
      ];
    } else {
      return [
        '⚠️ Consult doctor before starting any regimen',
        'If cleared: Gentle walks 15-20 minutes daily',
        'Increase water intake with nimbu pani (lemon water)',
        'Focus on home-cooked balanced meals',
        'Avoid processed, fried, and high-sugar foods'
      ];
    }
  };

  const getComment = (score) => {
    const isMale = patient?.gender?.toLowerCase() === 'male';
    let pool = [];
    if (score >= 95) {
      // 95-100: Outstanding
      pool = [
        `${userName}, you absolute beast! ${getGenderCompliment(patient?.gender, 'elite')} Outstanding health – maintain and celebrate!`,
        `🔥 Elite level, ${userName}! Amazing discipline. ${isMale ? 'Top tier king status!' : 'Queen of wellness!'}`,
        `${userName}, you're crushing it! 95+ is rare excellence. ${isMale ? 'Beast mode activated!' : 'Slay every day!'}`
      ];
    } else if (score >= 90) {
      // 90-95: Excellent
      pool = [
        `🔥 Excellent health, ${userName}! You're in the top tier for your age group.`,
        `${userName}, strong and healthy! ${getGenderCompliment(patient?.gender, 'high')}`,
        `Amazing, ${userName}! Elite level performance. Keep pushing those boundaries!`
      ];
    } else if (score >= 80) {
      // 80-90: Great Health
      pool = [
        `🔥 Great health, ${userName}! You're doing fantastic.`,
        `${userName}, you're in excellent shape! Top tier for Indian ${isMale ? 'men' : 'women'} your age.`,
        `Strong and balanced, ${userName}! Fine-tune for peak – you're crushing it!`
      ];
    } else if (score >= 70) {
      // 70-80: Maintained
      pool = [
        `Balanced and steady, ${userName}! You're maintaining well.`,
        `${userName}, solid foundation! Keep consistent with your healthy habits.`,
        `Good work, ${userName}! You're on the right track.`
      ];
    } else if (score >= 60) {
      // 60-70: Building Phase
      pool = [
        `${userName}, you have potential! Building phase – keep at it.`,
        `Decent base, ${userName}! Focus on consistency.`,
        `You're building strong, ${userName}! Track weekly for progress.`
      ];
    } else if (score >= 50) {
      // 50-60: Solid Base
      pool = [
        `Solid base, ${userName}! You're building strong momentum.`,
        `${userName}, keep consistent with mindful eating and activity!`,
        `Great foundation, ${userName}! You're on the path to wellness.`
      ];
    } else if (score >= 40) {
      // 40-50: Can be improved
      pool = [
        `${userName}, you've got potential! Add more protein (dal, paneer, eggs) and home exercises.`,
        `You can improve, ${userName}! Track weekly – you're built for progress!`,
        `${userName}, time to level up! Start with gentle activity and balanced meals.`
      ];
    } else if (score >= 30) {
      // 30-40: Needs Work
      pool = [
        `${userName}, potential spotted! Add desi protein and increase activity gradually.`,
        `You can do this, ${userName}! Small consistent steps lead to big changes.`,
        `${userName}, improvement zone. Focus on basics: walk daily, cut sugar/fried foods.`
      ];
    } else if (score >= 20) {
      // 20-30: Poor
      pool = [
        `⚠️ ${userName}, high risk zone. Start gentle: 30-min daily walks, reduce sugar and fried foods.`,
        `${userName}, time for change. Doctor visit advised soon for personalized guidance.`,
        `⚠️ ${userName}, let's improve together. Small steps: more water, balanced meals, gentle movement.`
      ];
    } else {
      // 10-20: Critical
      pool = [
        `⚠️ ${userName}, this is a critical alert. Please consult a doctor urgently for blood tests and check-up.`,
        `⚠️ ${userName}, immediate medical attention recommended. Avoid self-diagnosis.`,
        `⚠️ ${userName}, severe imbalance detected. Professional healthcare guidance needed now.`
      ];
    }
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const comment = bodyScoreData.score !== null ? getComment(bodyScoreData.score) : `Analyzing your latest health scan, ${userName}...`;
  const remedies = bodyScoreData.score !== null ? getRemedies(bodyScoreData.score) : [];

  const badges = [];
  if (bodyScoreData.score !== null) {
    if (isTopPerformer) {
      badges.push({ 
        icon: "military_tech", 
        text: `Top 14% - Elite, ${userName}!` 
      });
    }
    if (yearsYounger > 0) {
      badges.push({
        icon: "bolt",
        text: `${yearsYounger} year${yearsYounger > 1 ? "s" : ""} younger metabolically!`
      });
    }
    if (bodyScoreData.score >= 90) {
      badges.push({ 
        icon: "workspace_premium", 
        text: "Wellness Champion" 
      });
    }
    if (bodyScoreData.score >= 95) {
      badges.push({ 
        icon: "emoji_events", 
        text: `Peak Performer, ${userName}!` 
      });
    }
    if (bodyScoreData.score > peersAverage) {
      badges.push({ 
        icon: "trending_up", 
        text: `Above Average for Age ${patient?.age || ''}` 
      });
    }
    if (bodyScoreData.score < 50 && bodyScoreData.score >= 30) {
      badges.push({ 
        icon: "fitness_center", 
        text: "Growth Mode - Building Phase" 
      });
    }
  }

  const showConfetti = bodyScoreData.score !== null && bodyScoreData.score >= 90;

  const genderDisplay = patient?.gender
    ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1).toLowerCase()
    : "—";

  return (
    <div className="h-screen bg-white overflow-y-auto scrollable-container">
      {showConfetti && <Confetti />}

      {/* Challenge / Couple comparison overlay */}
      {showChallenge && (
        <ChallengeComparison
          challengerB_Name={userName}
          challengerB_Score={bodyScoreData.score ?? 0}
          onContinue={() => setShowChallenge(false)}
        />
      )}
      <div className="w-full max-w-4xl mx-auto px-6 py-3">
        <div className="flex flex-col items-center mb-3">
          <Logo className="mb-2" size="text-2xl" />

          <p className="text-xs uppercase tracking-[0.28em] text-gray-500 font-medium mb-2">
            SCAN COMPLETED • 4 PARAMETERS ANALYZED • 2 INSIGHTS GENERATED
          </p>

          <p className="text-xs text-gray-400 font-light">
            Based on today’s scan • Age {patient?.age || "—"} • {genderDisplay}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="bg-white rounded-xl shadow-[0_15px_50px_-15px_rgba(0,0,0,0.07)] p-5 relative"
        >
          <div className="flex flex-col items-center">
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">
              YOUR CURRENT HEALTH SNAPSHOT
            </p>
            <p className="text-[10px] text-gray-400 mb-3">
              TODAY • 2 min scan • No needles
            </p>

            <div className="relative w-[220px] h-[220px] mb-4">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#f3f3f3" strokeWidth="14" />
                {bodyScoreData.score !== null && (
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#F28C38"
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray="263.89"
                    strokeDashoffset={263.89 * (1 - bodyScoreData.score / 100)}
                  />
                )}
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {bodyScoreData.score !== null ? (
                  <div className="relative flex flex-col items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-6xl font-extrabold text-gray-900 tracking-tighter leading-none">
                        {bodyScoreData.score}
                      </span>
                      <div className="relative">
                        <span
                          className="text-2xl text-gray-400 cursor-help"
                          onMouseEnter={() => setShowTooltip(true)}
                          onMouseLeave={() => setShowTooltip(false)}
                        >
                          ⓘ
                        </span>

                        {showTooltip && (
                          <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-80 bg-gray-900 text-white text-sm rounded-lg p-4 shadow-xl z-10">
                            This score changes with lifestyle, sleep, activity, and consistency over time.
                          </div>
                        )}
                      </div>
                    </div>

                    <span className="mt-3 text-xl uppercase tracking-widest font-semibold text-gray-500">
                      Health Score
                    </span>
                    <span className="mt-1.5 text-xs uppercase tracking-widest text-gray-400">
                      OUT OF 100
                    </span>
                  </div>
                ) : (
                  <span className="text-5xl font-medium text-gray-300">Calculating...</span>
                )}
              </div>
            </div>

            <p className="text-base text-gray-600 text-center max-w-3xl mb-12 leading-relaxed">
              This score reflects how efficiently your heart, oxygen delivery, temperature balance, and
              body composition are working together today.
            </p>

            <h1 className="text-4xl font-semibold text-gray-900 text-center mb-16 leading-tight max-w-4xl">
              {comment}
            </h1>

            {bodyScoreData.score !== null && (
              <div className="w-full max-w-4xl mb-16 relative">
                <div className="flex justify-between items-end mb-6">
                  <div className="text-left">
                    <div className="text-base uppercase tracking-wider text-gray-500 font-medium mb-2">YOU</div>
                    <div className="text-6xl font-bold text-[#F28C38]">{bodyScoreData.score}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-base uppercase tracking-wider text-gray-500 font-medium mb-2">
                      AVERAGE FOR YOUR AGE GROUP
                    </div>
                    <div className="text-6xl font-medium text-gray-400">{peersAverage}</div>
                  </div>
                </div>

                <div className="h-6 bg-gray-100 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-[#F28C38] rounded-full transition-all duration-1500 ease-out"
                    style={{ width: `${bodyScoreData.score}%` }}
                  />

                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-400 rounded-full shadow-sm opacity-70"
                    style={{ left: `${peersAverage}%`, transform: "translate(-50%, -50%)" }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-gray-500 font-medium">
                      Avg
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-400 text-center mt-4 italic">
                  Updated after each scan
                </p>
              </div>
            )}

            {badges.length > 0 && (
              <motion.div
                className="flex justify-center gap-10 mb-16 flex-wrap"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
                }}
              >
                {badges.map((badge, index) => (
                  <motion.div
                    key={index}
                    variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center gap-3 bg-orange-50/70 text-[#F28C38] border border-orange-200/60 px-7 py-3.5 rounded-full text-base font-semibold"
                  >
                    <span className="material-symbols-outlined text-xl">{badge.icon}</span>
                    {badge.text}
                  </motion.div>
                ))}
              </motion.div>
            )}

            {remedies.length > 0 && scanCount >= 2 && (
              <div className="w-full max-w-4xl mt-12 bg-orange-50/30 border border-orange-200/50 rounded-2xl p-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#F28C38]">local_hospital</span>
                  Indian Household Remedies for {userName}
                </h3>
                <ul className="space-y-2">
                  {remedies.map((remedy, idx) => (
                    <li key={idx} className="text-base text-gray-700 flex items-start gap-2">
                      <span className="text-[#F28C38] mt-1">•</span>
                      <span>{remedy}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ── Leaderboard Opt-In ── */}
            {lbPrompt === "idle" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="w-full max-w-md mt-10 bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-lg"
              >
                <div className="text-3xl mb-2">🏆</div>
                <h3 className="text-gray-900 text-lg font-bold mb-1">
                  Campus Leaderboard
                </h3>
                <p className="text-gray-500 text-sm mb-5">
                  Want your score on the leaderboard? Your name & score will be displayed on the kiosk.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={async () => {
                      const userScore = bodyScoreData.score ?? 0;
                      if (supabase) {
                        try {
                          // Only check top-7 qualification if user has a real score
                          if (userScore > 0) {
                            const { data: top7 } = await supabase
                              .from("leaderboard")
                              .select("score")
                              .order("score", { ascending: false })
                              .limit(7);

                            const minTop7 = top7 && top7.length >= 7
                              ? top7[top7.length - 1].score
                              : 0;

                            if (userScore < minTop7) {
                              setLbPrompt("not_qualified");
                              return;
                            }
                          }

                          await supabase.from("leaderboard").upsert({
                            session_id: lbSessionId,
                            name: patient?.name || userName,
                            email: patient?.email || "",
                            score: userScore,
                            scan_count: scanCount,
                            photo_path: null,
                          }, { onConflict: "email" });

                          setLbPrompt("qr");
                        } catch (err) {
                          console.error("Leaderboard save error:", err);
                          setLbPrompt("qr");
                        }
                      } else {
                        setLbPrompt("qr");
                      }
                    }}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold px-6 py-3 rounded-xl text-sm"
                  >
                    Yes, add me! 🔥
                  </button>
                  <button
                    onClick={() => setLbPrompt("skipped")}
                    className="bg-gray-100 text-gray-500 font-medium px-6 py-3 rounded-xl text-sm border border-gray-200"
                  >
                    Nah, skip
                  </button>
                </div>
              </motion.div>
            )}

            {/* Not in top 7 */}
            {lbPrompt === "not_qualified" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full max-w-md mt-6 bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-lg"
              >
                <div className="text-3xl mb-2">💪</div>
                <h3 className="text-gray-900 text-base font-bold mb-1">Almost there!</h3>
                <p className="text-gray-500 text-sm mb-3">
                  The top 7 have higher scores right now. Come back after improving your health — you've got this!
                </p>
                <button
                  onClick={() => setLbPrompt("skipped")}
                  className="bg-gray-100 text-gray-500 font-medium px-6 py-2.5 rounded-xl text-sm border border-gray-200"
                >
                  Got it →
                </button>
              </motion.div>
            )}

            {/* ── QR Code for Photo Upload ── */}
            {lbPrompt === "qr" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md mt-6 bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-lg"
              >
                <h3 className="text-gray-900 text-lg font-bold mb-1">
                  📸 Add Your Photo
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  Scan this QR with your phone to upload a photo for the leaderboard
                </p>
                <div className="bg-gray-50 rounded-xl p-3 inline-block mb-4 border border-gray-100">
                  <QRCodeSVG
                    value={`${QR_BASE}/photo-upload?sid=${lbSessionId}&name=${encodeURIComponent(userName)}`}
                    size={180}
                    level="M"
                  />
                </div>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setLbPrompt("done")}
                    className="bg-green-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm"
                  >
                    Done ✓
                  </button>
                  <button
                    onClick={() => setLbPrompt("done")}
                    className="bg-gray-100 text-gray-500 font-medium px-6 py-2.5 rounded-xl text-sm border border-gray-200"
                  >
                    Skip photo
                  </button>
                </div>
              </motion.div>
            )}

            {lbPrompt === "done" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 text-center"
              >
                <span className="text-green-500 text-lg font-semibold">✓ You're on the leaderboard!</span>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/report-2")}
              className="mt-8 bg-[#F28C38] text-white font-semibold text-xl px-16 py-5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Continue to Next Screen
            </motion.button>

            <p className="text-sm text-gray-400 text-center italic mt-10">
              This health score is recalculated with every new scan
            </p>
          </div>
        </motion.div>

        <div className="flex flex-col items-center mt-20">
          <p className="text-lg font-medium text-gray-600 mb-6">
            Next: Which body systems are strongest
          </p>

          <div className="flex gap-4">
            <div className="w-12 h-2 rounded-full bg-[#F28C38]" />
            <div className="w-6 h-2 rounded-full bg-gray-200" />
            <div className="w-6 h-2 rounded-full bg-gray-200" />
            <div className="w-6 h-2 rounded-full bg-gray-200" />
            <div className="w-6 h-2 rounded-full bg-gray-200" />
          </div>

          <span className="mt-6 text-sm font-medium uppercase tracking-widest text-gray-400">
            SCREEN 1 OF 5
          </span>
        </div>
      </div>
    </div>
  );
};

export default Report1;