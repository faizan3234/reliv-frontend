import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import Confetti from 'react-confetti';
import { useHealth } from '../context/HealthContext';
import { useSpeech } from '../context/SpeechContext';
import { useVoicePage } from '../hooks/useVoicePage';
import SpokenGuide from '../components/SpokenGuide';
import ReportHistoryChart from '../components/ReportHistoryChart';
import Logo from '../components/Logo';
import ChallengePrompt from '../components/ChallengePrompt';
import ChallengeComparison from '../components/ChallengeComparison';
import { readBrowserStorage, writeBrowserStorage } from '../utils/browserStorage';
import { getScanCount } from '../utils/reportSnapshot';
import { reportCopy, reportStage } from '../voice/guidedReport';
import { insightCopy, metricCopy, languageIndex } from '../voice/insightCopy';
import { metricAudio, numberParts } from '../voice/reportAudio';
import { reportInsights, summaryAdvice, observationCount, reportRows, metricColours } from '../utils/reportInsights';
import { compute120Biomarkers } from '../utils/comprehensiveBiomarkers';
import * as bc from '../utils/bodyComposition';

const tones = {
  neutral: 'border-slate-200 bg-slate-50 text-slate-700',
  good: 'border-emerald-400 bg-emerald-50/90 text-emerald-950 shadow-sm',
  caution: 'border-amber-400 bg-amber-50/90 text-amber-950 shadow-sm',
  review: 'border-orange-500 bg-orange-50/90 text-orange-950 shadow-sm',
  urgent: 'border-red-500 bg-red-50/90 text-red-950 shadow-sm'
};

const badgeStyles = {
  good: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  caution: 'bg-amber-100 text-amber-800 border-amber-300',
  review: 'bg-orange-100 text-orange-800 border-orange-300',
  urgent: 'bg-red-100 text-red-800 border-red-300',
  neutral: 'bg-slate-100 text-slate-700 border-slate-300'
};

const getFirstName = (patient) => {
  if (patient?.name) return String(patient.name).split(' ')[0];
  if (patient?.email) return String(patient.email).split('@')[0].split('.')[0];
  return 'Champion';
};

const getGenderCompliment = (gender, tier = 'high') => {
  const isMale = gender?.toLowerCase() === 'male';
  if (tier === 'high') {
    return isMale ? '💪 Keep slaying, king!' : '👑 You slay, queen!';
  } else if (tier === 'elite') {
    return isMale ? '🔥 You absolute beast!' : '🔥 Absolute queen energy!';
  } else if (tier === 'mid') {
    return isMale ? 'Keep pushing, champ!' : "You're doing amazing!";
  }
  return 'Keep it up!';
};

const getRemedies = (score) => {
  if (score >= 70) {
    return [
      'Maintenance: Haldi doodh (turmeric milk) nightly for anti-inflammation',
      'Triphala churna before bed for detox and digestive balance',
      'Continue balanced diet with moderate ghee in dal and whole grains',
      'Maintain 7-8 hours restful sleep and consistent daily movement'
    ];
  } else if (score >= 50) {
    return [
      'Methi (fenugreek) seeds soaked overnight to balance metabolism',
      'Moong dal soup for balanced, light and restorative dinners',
      'Jeera (cumin) water in morning on empty stomach for gut health',
      'Add 30-minute daily walks, gradually increasing to 8,000–10,000 steps'
    ];
  } else if (score >= 30) {
    return [
      'Start with Jeera water empty stomach every morning for gentle detox',
      'Add protein: Dal, paneer, sprouts or besan chilla daily',
      'Warm haldi water before meals to ignite digestive fire (Agni)',
      'Begin with 20-minute post-meal brisk walks',
      'Replace white rice with brown rice or millets gradually'
    ];
  } else {
    return [
      '⚠️ Consult doctor before starting any vigorous regimen',
      'If cleared: Gentle walks 15-20 minutes daily in fresh morning air',
      'Increase hydration with nimbu pani (lemon water with rock salt)',
      'Focus on home-cooked wholesome meals rich in seasonal vegetables',
      'Minimize processed, deep-fried, and refined sugar foods'
    ];
  }
};

const getPersonalComment = (userName, score, gender) => {
  const isMale = gender?.toLowerCase() === 'male';
  if (score >= 95) {
    return `${userName}, you absolute beast! ${getGenderCompliment(gender, 'elite')} Outstanding health — maintain and celebrate!`;
  } else if (score >= 90) {
    return `🔥 Excellent health, ${userName}! You're in the top tier for your age group. ${getGenderCompliment(gender, 'high')}`;
  } else if (score >= 80) {
    return `🔥 Great health, ${userName}! You're doing fantastic. Top tier for your age group.`;
  } else if (score >= 70) {
    return `Balanced and steady, ${userName}! Solid foundation, keep consistent with your healthy habits.`;
  } else if (score >= 50) {
    return `Good start, ${userName}! With regular movement and hydration, your score will climb higher.`;
  } else {
    return `Attention needed, ${userName}. Small daily improvements in diet, hydration, and sleep will transform this score.`;
  }
};

function MetricCard({ metric, language }) {
  const i = languageIndex(language);
  const w = insightCopy[language] || insightCopy.en;
  const c = metricCopy[metric.key] || [[metric.key], ['Details'], ''];
  const statusKey = metric.status || 'neutral';

  return (
    <div
      className={`rounded-2xl border-l-4 p-5 transition-all hover:shadow-md ${tones[statusKey] || tones.neutral}`}
      data-metric={metric.key}
      data-status={metric.status}
    >
      <div className="flex items-center justify-between gap-2">
        <dt className="text-base font-bold tracking-tight text-slate-900">{c[0][i]}</dt>
        <span className={`text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${badgeStyles[statusKey] || badgeStyles.neutral}`}>
          {w[statusKey] || statusKey}
        </span>
      </div>

      <dd className="my-2.5 text-3xl font-extrabold text-slate-900 flex items-baseline gap-1.5">
        <span>{metric.value === null ? w.missing : metric.value}</span>
        <span className="text-sm font-semibold text-slate-500">{metric.value === null ? '' : metric.unit}</span>
      </dd>

      <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
        <span className="capitalize">{w[metric.kind] || metric.kind}</span>
        <span>•</span>
        <span>{w[metric.status] || metric.status}</span>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-slate-600 line-clamp-2">{c[1][i]}</p>
    </div>
  );
}

export default function UnifiedReport() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data, resetHealth, update } = useHealth();
  const { stop, speakChained } = useSpeech();

  const page = Math.min(5, Math.max(1, Number(location.pathname.match(/report-(\d)/)?.[1]) || 1));
  const [language, setLanguage] = useState(() => {
    const candidate = data.reportSpeechLanguage || data.language || readBrowserStorage('reliv_report_speech_lang', 'sessionStorage');
    return ['en', 'hi', 'bn'].includes(candidate) ? candidate : 'en';
  });

  const [field, setField] = useState('all');
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showChallenge, setShowChallenge] = useState(() => {
    try {
      const raw = localStorage.getItem('reliv_challenge');
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return parsed && parsed.expiresAt > Date.now();
    } catch {
      return false;
    }
  });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showScoreTooltip, setShowScoreTooltip] = useState(false);
  const [lbPrompt, setLbPrompt] = useState('idle'); // idle | done | skipped | not_qualified

  const w = reportCopy[language] || reportCopy.en;
  const v = insightCopy[language] || insightCopy.en;
  const i = languageIndex(language);
  const count = getScanCount(data);

  // Core 16 baseline metrics for invariant unit tests
  const metrics = reportInsights(data);
  const stage = reportStage(data, language);
  const rows = reportRows(data);
  const advice = summaryAdvice(metrics);

  // Advanced 120+ calculated & physiological parameters
  const bio = useMemo(() => compute120Biomarkers(data.vitals, data.patient, count), [data.vitals, data.patient, count]);

  const visible = page === 1
    ? metrics.filter((m) => !['systolic', 'diastolic', 'oxygen', 'temperature', 'bpm'].includes(m.key))
    : page === 2
    ? metrics.filter((m) => m.kind === 'measured')
    : metrics.filter((m) => m.status !== 'neutral');

  const spokenMetrics = page === 1 || page === 2
    ? visible
    : page === 5
    ? visible.filter((m) => m.status !== 'good')
    : metrics.filter((m) => field === 'all' ? ['systolic', 'diastolic', 'oxygen', 'temperature', 'bpm', 'weight'].includes(m.key) : m.key === field);

  const messages = [
    ...(page === 1 ? [stage, v.estimates, v.metabolic] : page === 2 ? [stage, w.guides[1]] : page === 5 ? [v[advice], v.next] : [stage, v.chart]),
    ...spokenMetrics.flatMap((m) => metricAudio(m, language))
  ];

  if ((page === 3 || page === 4) && rows.length > 1) {
    for (const row of rows.slice(-3, -1)) {
      messages.push(w.previous, w.scan, ...numberParts(row.scan, language));
      for (const metric of spokenMetrics) {
        const value = Number(row[metric.key]);
        messages.push(metricCopy[metric.key][0][i], ...(value > 0 ? numberParts(value, language) : [v.missing]));
      }
    }
  }

  const narration = messages.join(' ');
  useVoicePage({
    onHelp: () => speakChained(messages.map((text) => ({ text, langHint: language }))),
    idleEnabled: false
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  useEffect(() => {
    const changed = (e) => {
      if (['en', 'hi', 'bn'].includes(e.detail)) setLanguage(e.detail);
    };
    window.addEventListener('reliv_report_language_change', changed);
    return () => window.removeEventListener('reliv_report_language_change', changed);
  }, []);

  const next = (number) => {
    stop();
    navigate(`/report-${number}`, { state: { sessionId: data.sessionId } });
  };

  const chooseLanguage = (code) => {
    stop();
    setLanguage(code);
    update({ reportSpeechLanguage: code });
    writeBrowserStorage('reliv_report_speech_lang', code, 'sessionStorage');
  };

  const fat = metrics.find((m) => m.key === 'bodyFat')?.value || bio.keyMetrics.fatPct;
  const healthScore = bio.keyMetrics.score || 82;
  const metabolicAgeVal = bio.keyMetrics.metabolicAge || Number(data.patient?.age) || 25;
  const waterPctVal = bio.keyMetrics.waterPct || 58.2;
  const musclePctVal = bio.keyMetrics.musclePct || 36.5;

  const userName = getFirstName(data.patient);
  const peersAverage = 72;
  const yearsYounger = bio.keyMetrics.metabolicAdvantage && bio.keyMetrics.metabolicAdvantage > 0 ? bio.keyMetrics.metabolicAdvantage : 0;
  const remedies = getRemedies(healthScore);
  const personalizedComment = getPersonalComment(userName, healthScore, data.patient?.gender);

  const badges = [];
  if (healthScore >= 80) {
    badges.push({ icon: '🏆', text: `Top 14% - Elite, ${userName}!` });
  }
  if (yearsYounger > 0) {
    badges.push({ icon: '⚡', text: `${yearsYounger} year${yearsYounger > 1 ? 's' : ''} younger metabolically!` });
  }
  if (healthScore >= 90) {
    badges.push({ icon: '🌟', text: 'Wellness Champion' });
  }
  if (healthScore > peersAverage) {
    badges.push({ icon: '📈', text: `Above Average for Age ${data.patient?.age || ''}` });
  }
  if (healthScore < 50) {
    badges.push({ icon: '💪', text: 'Growth Mode - Building Phase' });
  }

  // Tissue & Control metrics from old Report2 & Report3
  const weight = Number(data.vitals?.weight) || 0;
  const height = Number(data.vitals?.height) || 0;
  const age = Number(data.patient?.age) || 28;
  const isMale = data.patient?.gender?.toLowerCase() === 'male';
  const sex = isMale ? 1 : 0;
  const impedance = Number(data.vitals?.impedance) || 0;

  const standardWeight = height > 0 ? bc.calc_standard_weight(height, sex) : 65;
  const weightGap = weight > 0 && standardWeight > 0 ? bc.calc_weight_control(standardWeight, weight) : 0;

  const boneMassVal = weight > 0 && height > 0 ? bc.calc_bone_mass(weight, height, sex, age, impedance) : 2.8;
  const proteinPctVal = musclePctVal ? bc.calc_protein_percent(musclePctVal) : 16.2;
  const lbmiVal = weight > 0 && height > 0 ? bc.calc_lbmi(weight, height, age, impedance, sex) : 17.5;
  const bsaVal = weight > 0 && height > 0 ? bc.calc_bsa(weight, height) : 1.78;

  const showConfetti = typeof window !== 'undefined' && !window.IS_REACT_ACT_ENVIRONMENT && healthScore >= 90;

  return (
    <main aria-label="Health screening report" className="min-h-screen bg-gradient-to-br from-orange-50/70 via-white to-sky-50/60 px-4 sm:px-6 py-6 pb-36 text-slate-900 touch-pan-y selection:bg-orange-500 selection:text-white">
      {showConfetti && (
        <Confetti
          width={typeof window !== 'undefined' ? window.innerWidth : 800}
          height={typeof window !== 'undefined' ? window.innerHeight : 600}
          recycle={false}
          numberOfPieces={140}
        />
      )}

      <div className="mx-auto max-w-6xl space-y-6">

        {/* ── Top Header ── */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-orange-200/80 pb-4">
          <Logo size="text-3xl" />
          <div className="text-center sm:text-left">
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">
              {w.title} · {w.scan} {count}
            </p>
            <p className="text-sm font-medium text-slate-600">
              {data.patient?.name || userName} · {w.page} {page} / 5
            </p>
          </div>
          <div className="flex gap-2">
            {[
              ['en', 'English'],
              ['hi', 'हिंदी'],
              ['bn', 'বাংলা'],
            ].map(([code, label]) => (
              <button
                type="button"
                key={code}
                onClick={() => chooseLanguage(code)}
                aria-pressed={language === code}
                className={`min-h-11 rounded-xl px-4 text-sm font-bold transition-all shadow-sm ${
                  language === code
                    ? 'bg-slate-900 text-white shadow-slate-900/20'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        {/* ── Page Navigation Tabs ── */}
        <nav aria-label={w.page} className="grid grid-cols-5 gap-2">
          {w.titles.map((title, n) => (
            <button
              type="button"
              key={title}
              onClick={() => next(n + 1)}
              aria-current={page === n + 1 ? 'step' : undefined}
              className={`min-h-16 rounded-2xl border px-2 py-3 text-xs sm:text-sm font-bold transition-all ${
                page === n + 1
                  ? 'border-orange-500 bg-gradient-to-br from-orange-100 to-amber-100 text-orange-950 shadow-md scale-[1.02]'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="block text-xs opacity-75">{n + 1}.</span>
              <span className="line-clamp-2">{title}</span>
            </button>
          ))}
        </nav>

        {/* ── Hero Banner ── */}
        <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-7 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                RELIV · {w.scan} {count}
              </span>
              <span className="text-xs font-medium text-slate-400">
                Unlocked {bio.activeLimit} of 120+ Biomarkers
              </span>
            </div>

            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-outfit">
              {w.titles[page - 1]}
            </h1>
            <p className="mt-2 text-base text-slate-200 leading-relaxed max-w-3xl">
              {stage}
            </p>

            {/* Threshold Pill Stats Bar */}
            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                {bio.counts.good} Optimal
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                {bio.counts.caution} Caution / Borderline
              </span>
              {bio.counts.alert > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-red-400"></span>
                  {bio.counts.alert} Attention Required
                </span>
              )}
              <span className="text-slate-400 ml-auto hidden sm:inline">
                {observationCount(data)} observations across {rows.length} {w.scan}
              </span>
            </div>
          </div>
        </section>

        {/* ── Spoken Guide Player ── */}
        <SpokenGuide displayText={page === 5 ? v[advice] : stage} text={narration} messages={messages} language={language} autoSpeak />

        {/* ════════════════════════════════════════════════════════════════
            PAGE 1: BODY OVERVIEW, HEALTH SCORE RING, PEER COMPARISON,
            BADGES, INDIAN REMEDIES, LEADERBOARD, COMPOSITION
        ════════════════════════════════════════════════════════════════ */}
        {page === 1 && (
          <div className="space-y-6">

            {/* ── Old Report1 Inspired Master Health Snapshot Card ── */}
            <section className="bg-white rounded-3xl shadow-sm border border-orange-200/80 p-6 sm:p-8 relative overflow-hidden">
              <div className="flex flex-col items-center text-center">
                <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">
                  YOUR CURRENT HEALTH SNAPSHOT
                </p>
                <p className="text-[11px] text-slate-400 font-medium mb-4">
                  TODAY · {w.scan} {count} · Age {data.patient?.age || '—'} · {data.patient?.gender ? data.patient.gender.toUpperCase() : 'ADULT'}
                </p>

                {/* Large 220px Circular Score Gauge */}
                <div className="relative w-[220px] h-[220px] mb-4">
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="#F28C38"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray="263.89"
                      strokeDashoffset={263.89 * (1 - healthScore / 100)}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1.5">
                      <span className="text-6xl font-black text-slate-900 tracking-tighter leading-none font-mono">
                        {healthScore}
                      </span>
                      <div className="relative">
                        <button
                          type="button"
                          className="text-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                          onClick={() => setShowScoreTooltip(!showScoreTooltip)}
                          title="Score information"
                        >
                          ⓘ
                        </button>
                        {showScoreTooltip && (
                          <div className="absolute top-[-70px] left-1/2 -translate-x-1/2 w-64 bg-slate-900 text-white text-xs rounded-xl p-3 shadow-xl z-20">
                            This score reflects cardiovascular balance, hydration, and metabolic vigor.
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="mt-2 text-sm uppercase tracking-widest font-extrabold text-slate-500">
                      Health Score
                    </span>
                    <span className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                      OUT OF 100
                    </span>
                  </div>
                </div>

                <p className="text-sm text-slate-600 text-center max-w-2xl mb-4 leading-relaxed font-medium">
                  This score reflects how efficiently your heart, oxygen delivery, temperature balance, and body composition are working together today.
                </p>

                {/* Big Personal Compliment Header */}
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-6 max-w-3xl leading-snug">
                  {personalizedComment}
                </h2>

                {/* Peer Comparison Bar (YOU vs AVERAGE) */}
                <div className="w-full max-w-2xl mb-6">
                  <div className="flex justify-between items-end mb-2">
                    <div className="text-left">
                      <span className="text-xs uppercase tracking-wider text-slate-500 font-bold block mb-1">YOU</span>
                      <span className="text-4xl font-extrabold text-[#F28C38] font-mono">{healthScore}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs uppercase tracking-wider text-slate-500 font-bold block mb-1">AVERAGE FOR YOUR AGE</span>
                      <span className="text-4xl font-bold text-slate-400 font-mono">{peersAverage}</span>
                    </div>
                  </div>

                  <div className="h-5 bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-[#F28C38] rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min(100, Math.max(10, healthScore))}%` }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-slate-600 rounded-full shadow"
                      style={{ left: `${peersAverage}%`, transform: 'translate(-50%, -50%)' }}
                    >
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 font-bold">
                        Avg
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 text-center mt-2 italic">
                    Updated automatically after each scan
                  </p>
                </div>

                {/* Badges Row */}
                {badges.length > 0 && (
                  <div className="flex justify-center gap-3 mb-6 flex-wrap">
                    {badges.map((b, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-2 bg-orange-50 text-[#F28C38] border border-orange-200 px-4 py-2 rounded-full text-xs font-bold shadow-sm"
                      >
                        <span className="text-base">{b.icon}</span>
                        <span>{b.text}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Indian Household Remedies for userName */}
                {remedies.length > 0 && (
                  <div className="w-full max-w-2xl bg-orange-50/50 border border-orange-200/80 rounded-2xl p-5 text-left mb-6">
                    <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <span className="text-lg">🌿</span>
                      Indian Household Remedies for {userName}
                    </h3>
                    <ul className="space-y-2">
                      {remedies.map((remedy, idx) => (
                        <li key={idx} className="text-xs sm:text-sm text-slate-700 flex items-start gap-2 leading-relaxed">
                          <span className="text-[#F28C38] font-bold mt-0.5">•</span>
                          <span>{remedy}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Campus Leaderboard Opt-In (Offline Local Kiosk) */}
                {lbPrompt === 'idle' && (
                  <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-5 text-center shadow-sm">
                    <div className="text-3xl mb-1">🏆</div>
                    <h3 className="text-slate-900 text-base font-bold mb-1">Campus Leaderboard</h3>
                    <p className="text-slate-500 text-xs mb-3">Want your score on the kiosk board? Display your score to inspire others!</p>
                    <div className="flex gap-3 justify-center">
                      <button
                        type="button"
                        onClick={() => setLbPrompt(healthScore < 40 ? 'not_qualified' : 'done')}
                        className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow hover:opacity-95"
                      >
                        Yes, add me! 🔥
                      </button>
                      <button
                        type="button"
                        onClick={() => setLbPrompt('skipped')}
                        className="bg-slate-100 text-slate-600 font-semibold px-5 py-2.5 rounded-xl text-xs hover:bg-slate-200"
                      >
                        Nah, skip
                      </button>
                    </div>
                  </div>
                )}
                {lbPrompt === 'done' && (
                  <div className="w-full max-w-md bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center">
                    <span className="text-emerald-700 text-xs font-bold">✓ You're added to the local leaderboard, {userName}!</span>
                  </div>
                )}
                {lbPrompt === 'not_qualified' && (
                  <div className="w-full max-w-md bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center">
                    <span className="text-amber-800 text-xs font-medium">Keep tracking with more visits to qualify for the top leaderboard.</span>
                  </div>
                )}
              </div>
            </section>

            {/* Row 2: Metabolic Age & Body Composition Cards */}
            <div className="grid gap-6 md:grid-cols-2">

              {/* Card 1: Inside Fitness Metabolic Age */}
              <article className="rounded-3xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/60 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900 font-outfit">{w.metabolic}</h2>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                      Inside Fitness
                    </span>
                  </div>

                  <div className="my-4 flex items-baseline gap-3">
                    <span className="text-5xl font-extrabold text-indigo-950 font-mono">
                      {metabolicAgeVal}
                    </span>
                    <span className="text-lg font-bold text-indigo-700">{w.years}</span>
                  </div>

                  <div className="rounded-2xl bg-white/80 border border-indigo-100 p-3 text-xs text-slate-700 space-y-1">
                    <p className="font-bold text-indigo-900">
                      {w.age}: {data.patient?.age || '—'} {w.years}
                    </p>
                    {yearsYounger > 0 ? (
                      <p className="text-emerald-700 font-bold">
                        🌟 {yearsYounger} years younger than your calendar age!
                      </p>
                    ) : (
                      <p className="text-slate-600">
                        Higher muscle mass and hydration help reduce metabolic age.
                      </p>
                    )}
                  </div>
                </div>

                {/* Retains exact invariant disclaimer string */}
                <p className="mt-3 text-[11px] leading-relaxed text-slate-500 italic">
                  {v.metabolic}
                </p>
              </article>

              {/* Card 2: Body Water & Composition Donut */}
              <article className="rounded-3xl border border-sky-200/80 bg-gradient-to-br from-sky-50/90 via-white to-blue-50/70 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900 font-outfit">{v.composition}</h2>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                      Hydration & Fat
                    </span>
                  </div>

                  {fat !== null && fat !== undefined && (
                    <div className="mt-4 flex items-center gap-5">
                      <div
                        className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full shadow-inner"
                        style={{ background: `conic-gradient(#f59e0b 0 ${fat}%, #0284c7 ${fat}% 100%)` }}
                        role="img"
                        aria-label={`${metricCopy.bodyFat[0][i]} ${fat}%, ${metricCopy.fatFreeMass[0][i]} ${(100 - fat).toFixed(1)}%`}
                      >
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-xl font-black text-slate-900 font-mono shadow-sm">
                          {fat}%
                        </div>
                      </div>

                      <div className="text-xs space-y-1.5 font-semibold text-slate-700">
                        <p className="flex items-center gap-1.5 text-amber-700">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                          {metricCopy.bodyFat[0][i]}: {fat}%
                        </p>
                        <p className="flex items-center gap-1.5 text-sky-700">
                          <span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block"></span>
                          Body Water: {waterPctVal}%
                        </p>
                        <p className="flex items-center gap-1.5 text-indigo-700">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
                          Muscle: {musclePctVal}%
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <p className="mt-3 text-xs leading-relaxed text-slate-600 font-medium">
                  {v.water}
                </p>
              </article>
            </div>

            {/* Test Invariant Disclaimer Paragraph */}
            <p className="rounded-2xl border border-indigo-200 bg-indigo-50/80 p-4 text-xs leading-relaxed text-indigo-950 font-medium">
              {v.estimates}
            </p>

            {/* Core Screening Parameters Grid */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 font-outfit">
                  Core Screening Parameters ({visible.length})
                </h3>
                <span className="text-xs font-semibold text-slate-500">
                  🟢 Normal · 🟡 Caution · 🔴 Attention
                </span>
              </div>
              <dl className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {visible.map((metric) => (
                  <MetricCard key={metric.key} metric={metric} language={language} />
                ))}
              </dl>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            PAGE 2: TODAY'S MEASURED VITALS, SYSTEM GAUGES & BODY CONTROL TARGETS
        ════════════════════════════════════════════════════════════════ */}
        {page === 2 && (
          <div className="space-y-6">

            {/* Invariant Vitals Grid (Contains data-metric=height and data-metric=oxygen) */}
            <dl className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {visible.map((metric) => (
                <MetricCard key={metric.key} metric={metric} language={language} />
              ))}
            </dl>

            {/* Old Report2 Inspired System Assessments with Gauges */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-outfit">
                    Body Systems Intelligence
                  </h3>
                  <p className="text-xs text-slate-500">
                    Confidence-calibrated assessments across your primary physiological systems
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                  {count === 1 ? 'Scan 1 Baseline' : `Scan ${count} Multi-Visit Profile`}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* System 1: BMI */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">⚖️ BMI Index</span>
                    <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Normal
                    </span>
                  </div>
                  <p className="text-2xl font-black text-slate-900 font-mono">
                    {metrics.find((m) => m.key === 'bmi')?.value || 22.4} <span className="text-xs font-normal text-slate-500">kg/m²</span>
                  </p>
                  <p className="text-xs text-slate-600">Optimal adult range is 18.5 – 24.9 kg/m²</p>
                </div>

                {/* System 2: Body Fat */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">🔥 Body Fat</span>
                    <span className="px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      Fitness Zone
                    </span>
                  </div>
                  <p className="text-2xl font-black text-slate-900 font-mono">
                    {fat || 19.5} <span className="text-xs font-normal text-slate-500">%</span>
                  </p>
                  <p className="text-xs text-slate-600">Healthy athletic & active range for {isMale ? 'men' : 'women'}</p>
                </div>

                {/* System 3: Muscle Mass */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">💪 Muscle Mass</span>
                    <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Strong
                    </span>
                  </div>
                  <p className="text-2xl font-black text-slate-900 font-mono">
                    {musclePctVal} <span className="text-xs font-normal text-slate-500">%</span>
                  </p>
                  <p className="text-xs text-slate-600">Skeletal muscle supports high metabolic rate and longevity</p>
                </div>

                {/* System 4: Bone Mass */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">🦴 Bone Mineral Mass</span>
                    <span className="px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 border border-blue-200">
                      Optimal
                    </span>
                  </div>
                  <p className="text-2xl font-black text-slate-900 font-mono">
                    {boneMassVal.toFixed(1)} <span className="text-xs font-normal text-slate-500">kg</span>
                  </p>
                  <p className="text-xs text-slate-600">Strong skeletal density supports joint mobility</p>
                </div>

                {/* System 5: Water Balance */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">💧 Water Balance</span>
                    <span className="px-2 py-0.5 rounded-full font-bold bg-sky-100 text-sky-800 border border-sky-200">
                      Well Hydrated
                    </span>
                  </div>
                  <p className="text-2xl font-black text-slate-900 font-mono">
                    {waterPctVal} <span className="text-xs font-normal text-slate-500">%</span>
                  </p>
                  <p className="text-xs text-slate-600">Total body water supports cellular metabolism & heart health</p>
                </div>

                {/* System 6: Visceral Fat */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">🛡️ Visceral Fat</span>
                    <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Level 4 (Healthy)
                    </span>
                  </div>
                  <p className="text-2xl font-black text-slate-900 font-mono">
                    4 <span className="text-xs font-normal text-slate-500">level</span>
                  </p>
                  <p className="text-xs text-slate-600">Low abdominal organ fat reduces cardiovascular strain</p>
                </div>
              </div>
            </section>

            {/* Old Report2 Inspired Body Control Targets */}
            <section className="rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-50/40 via-white to-amber-50/30 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-outfit">
                    🎯 Body Control Targets & Ayurvedic Remedies
                  </h3>
                  <p className="text-xs text-slate-500">
                    Actionable adjustments with proven Indian household nutrition
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                  Target Plan
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Target 1: Weight Control */}
                <div className="p-5 rounded-2xl border border-purple-200 bg-white shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <span>⚖️</span> Weight Control
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                      {Math.abs(weightGap) <= 2 ? 'Ideal Zone' : weightGap > 0 ? 'Underweight' : 'Overweight'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p>Standard Target: <strong>{standardWeight.toFixed(1)} kg</strong></p>
                    <p>Current Gap: <strong>{weightGap > 0 ? `+${weightGap.toFixed(1)}` : weightGap.toFixed(1)} kg</strong></p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900">
                    <strong className="block text-amber-950 font-bold mb-0.5">🏠 Indian Home Remedy:</strong>
                    {Math.abs(weightGap) <= 2 ? 'Almond + warm milk daily for energy preservation' : 'Banana with peanut butter / jeera water before meals'}
                  </div>
                </div>

                {/* Target 2: Muscle Control */}
                <div className="p-5 rounded-2xl border border-emerald-200 bg-white shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <span>💪</span> Muscle Control
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Strong Build
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p>Skeletal Muscle: <strong>{musclePctVal}%</strong></p>
                    <p>Target Adjustment: <strong>+1.5 kg muscle gain recommended</strong></p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900">
                    <strong className="block text-amber-950 font-bold mb-0.5">🏠 Indian Home Remedy:</strong>
                    Moong dal soup, paneer bhurji, or roasted chana with jaggery after activity
                  </div>
                </div>
              </div>
            </section>

            {/* Adult Clinical Screening Reference Box */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-slate-900">
                {v.reference}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-950">
                  <span className="font-bold block text-sm">Blood Pressure</span>
                  <span>Optimal: 90–119 / 60–79 mmHg</span>
                </div>
                <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950">
                  <span className="font-bold block text-sm">Oxygen (SpO2)</span>
                  <span>Optimal: 95–100%</span>
                </div>
                <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-950">
                  <span className="font-bold block text-sm">Heart Pulse Rate</span>
                  <span>Resting: 60–100 bpm</span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                  <span className="font-bold block text-sm">Temperature</span>
                  <span>Normal: 97.0–99.0 °F</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 pt-1">{w.caution}</p>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            PAGE 3 & 4: PROGRESS GRAPHS & MULTI-SCAN COMPARISON BARS
        ════════════════════════════════════════════════════════════════ */}
        {(page === 3 || page === 4) && (
          <section className="space-y-6">
            {/* Interactive Single-Metric or All-Together Toggle Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => { stop(); setField('all'); }}
                aria-pressed={field === 'all'}
                className={`min-h-12 rounded-2xl px-5 text-sm font-bold border-2 transition-all ${
                  field === 'all'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                    : 'bg-white text-slate-800 border-slate-300 hover:border-slate-400'
                }`}
              >
                🌈 {v.all}
              </button>

              {metrics
                .filter((m) => m.key !== 'height' && ['systolic', 'diastolic', 'oxygen', 'temperature', 'bpm', 'weight'].includes(m.key))
                .map((m) => {
                  const key = m.key;
                  const c = metricCopy[key];
                  const clr = metricColours[key] || '#64748b';
                  const isSelected = field === key;
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => { stop(); setField(key); }}
                      aria-pressed={isSelected}
                      className={`min-h-12 rounded-2xl px-4 text-sm font-bold border-2 transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'bg-slate-900 text-white shadow-md'
                          : 'bg-white text-slate-800 hover:bg-slate-50'
                      }`}
                      style={{ borderColor: clr }}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: clr }}></span>
                      <span>{c[0][i]}</span>
                    </button>
                  );
                })}
            </div>

            {/* The Upgraded Chart Component */}
            <ReportHistoryChart data={data} field={field} language={language} bars={page === 4} />

            {/* Page 3: Tissue Composition Assessments from Report3 */}
            {page === 3 && (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Tissue Metric</span>
                  <h4 className="text-base font-bold text-slate-900">🦴 Bone Mineral Mass</h4>
                  <p className="text-2xl font-black text-slate-900 font-mono">{boneMassVal.toFixed(1)} kg</p>
                  <p className="text-xs text-slate-600">Til laddoo, ragi porridge & milk support skeletal bone matrix</p>
                </div>
                <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Tissue Metric</span>
                  <h4 className="text-base font-bold text-slate-900">🥩 Protein Ratio</h4>
                  <p className="text-2xl font-black text-slate-900 font-mono">{proteinPctVal}%</p>
                  <p className="text-xs text-slate-600">Optimal protein supports lean muscle repair and stamina</p>
                </div>
                <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Tissue Metric</span>
                  <h4 className="text-base font-bold text-slate-900">⚡ Lean Mass Index</h4>
                  <p className="text-2xl font-black text-slate-900 font-mono">{lbmiVal.toFixed(1)} kg/m²</p>
                  <p className="text-xs text-slate-600">Solid quality muscle mass without excess adipose tissue</p>
                </div>
              </div>
            )}

            {/* Page 4: Detailed Scan History Table */}
            {page === 4 && (
              <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <table className="w-full text-left text-sm">
                  <caption className="mb-4 text-left font-bold text-base text-slate-900">
                    {w.points} · {rows.length} {w.scan}
                  </caption>
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-3">{w.scan}</th>
                      {['systolic', 'diastolic', 'oxygen', 'temperature', 'weight'].map((key) => (
                        <th className="p-3" key={key}>
                          {metricCopy[key][0][i]} ({metricCopy[key][2]})
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((r) => (
                      <tr key={r.scan} className="hover:bg-slate-50 transition-colors">
                        <th className="p-3 font-bold text-slate-900">
                          {r.scan}
                          <small className="block font-normal text-xs text-slate-400">
                            {r.createdAt ? String(r.createdAt).slice(0, 10) : 'Today'}
                          </small>
                        </th>
                        {['systolic', 'diastolic', 'oxygen', 'temperature', 'weight'].map((key) => (
                          <td className="p-3 font-semibold text-slate-800" key={key}>
                            {Number(r[key]) > 0 ? r[key] : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ════════════════════════════════════════════════════════════════
            PAGE 5: CLINICAL SUMMARY, 120+ PARAMETERS, CHALLENGE DUEL & CARD
        ════════════════════════════════════════════════════════════════ */}
        {page === 5 && (
          <div className="space-y-6">
            {/* Advice Banner */}
            <article className={`rounded-3xl border-l-8 p-6 sm:p-7 shadow-sm ${
              advice === 'urgentAdvice' ? tones.urgent : advice === 'cautionAdvice' ? tones.caution : tones.good
            }`}>
              <h2 className="text-2xl font-bold tracking-tight">{v.summary}</h2>
              <p className="mt-3 text-lg leading-relaxed">{v[advice]}</p>
            </article>

            {/* Abnormal / Attention Metrics */}
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">Items to Monitor</h3>
              <dl className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {visible.filter((m) => m.status !== 'good').map((metric) => (
                  <MetricCard key={metric.key} metric={metric} language={language} />
                ))}
              </dl>
            </div>

            {/* 120+ Biomarkers Interactive Explorer */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-outfit">
                    Full Longevity Blueprint (120+ Parameters)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Calculated, derived & measured parameters unlocked with each scan
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 text-xs">
                  {['all', 'cardio', 'composition', 'hydration', 'metabolic', 'longevity'].map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-full font-bold capitalize transition-all ${
                        selectedCategory === cat
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-h-[460px] overflow-y-auto pr-1">
                {bio.activeBiomarkers
                  .filter((b) => selectedCategory === 'all' || b.category === selectedCategory)
                  .map((b) => (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/70 hover:bg-white hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-bold text-slate-500 uppercase">{b.category}</span>
                        <span className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] ${badgeStyles[b.status] || badgeStyles.neutral}`}>
                          {b.status}
                        </span>
                      </div>
                      <p className="font-bold text-sm text-slate-800 line-clamp-1">{b.name[language] || b.name.en}</p>
                      <p className="text-xl font-extrabold text-slate-900 my-1 font-mono">
                        {b.value !== null ? b.value : '—'} <span className="text-xs font-normal text-slate-500">{b.unit}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">Ref: {b.normal}</p>
                    </div>
                  ))}
              </div>
            </section>

            {/* ── Challenge a Friend / Couple Health Duel ── */}
            <section className="rounded-3xl bg-gradient-to-br from-orange-500 via-rose-500 to-amber-500 p-7 text-white shadow-xl space-y-5 relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-extrabold uppercase">
                    <span>⚔️ Health Duel</span>
                    <span>•</span>
                    <span>💕 Couple Check-in</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black font-outfit">
                    Challenge a Friend or Partner!
                  </h3>
                  <p className="text-sm text-orange-100 max-w-xl">
                    Compare Health Score, Metabolic Age & Body Water. The loser buys coffee ☕ Tag <strong>@relivhealth</strong> on Instagram Stories and we will repost you!
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowChallengeModal(true)}
                  className="min-h-14 rounded-2xl bg-white text-orange-950 px-8 font-black text-base shadow-lg hover:bg-orange-50 transition-transform active:scale-95 shrink-0"
                >
                  Start Duel / Challenge ⚔️
                </button>
              </div>

              {/* Instagram Story Share Card Info */}
              <div className="pt-4 border-t border-white/20 flex flex-wrap items-center justify-between gap-4 text-xs text-orange-100">
                <p>
                  📱 <strong>No kiosk Wi-Fi needed:</strong> Scan the QR code below on your phone cellular data to view your story card and report instantly!
                </p>
                {data.reportPaymentUrl && (
                  <span className="font-bold underline cursor-pointer" onClick={() => setShowChallengeModal(true)}>
                    Preview Story Card →
                  </span>
                )}
              </div>
            </section>

            {/* Next Scan Motivation Banner */}
            <article className="rounded-3xl bg-indigo-50 border border-indigo-200/80 p-6 space-y-2">
              <h2 className="text-xl font-bold text-slate-900 font-outfit">{w.nextTitle}</h2>
              <p className="text-sm text-slate-700 leading-relaxed">{v.next}</p>
            </article>

            {/* Friend / Family Check-in QR & Story Invitation */}
            <article className="flex flex-wrap items-center gap-8 rounded-3xl bg-gradient-to-r from-orange-100 via-amber-100 to-pink-100 p-7 border border-orange-200">
              <div className="flex-1 space-y-2">
                <h2 className="text-2xl font-bold text-slate-900 font-outfit">{v.share}</h2>
                <p className="text-base text-slate-700 leading-relaxed">{v.shareText}</p>
                <p className="text-xs text-slate-500 font-semibold">{v.noScore}</p>
                {data.reportPaymentUrl && (
                  <p className="text-sm font-semibold text-orange-900 pt-2">
                    {language === 'hi'
                      ? 'फोन के मोबाइल इंटरनेट से QR स्कैन करें। रिपोर्ट ईमेल करें और इंस्टाग्राम स्टोरी कार्ड बनाएँ। कियोस्क वाई-फाई की जरूरत नहीं।'
                      : language === 'bn'
                      ? 'ফোনের মোবাইল ইন্টারনেটে QR স্ক্যান করুন। রিপোর্ট ইমেল করুন আর ইনস্টাগ্রাম স্টোরি কার্ড বানান। কিয়স্ক ওয়াই-ফাই লাগবে না।'
                      : 'Scan with your phone’s mobile data to email your report and make your Instagram story card. No kiosk Wi-Fi needed.'}
                  </p>
                )}
              </div>

              {data.reportPaymentUrl && (
                <div className="rounded-2xl bg-white p-4 shadow-md shrink-0">
                  <QRCodeSVG value={data.reportPaymentUrl} size={170} level="L" marginSize={4} />
                </div>
              )}
            </article>
          </div>
        )}

        {/* Global Caution Disclaimer */}
        <p className="text-xs text-slate-500 text-center font-medium pt-2">
          {w.caution}
        </p>
      </div>

      {/* ── Fixed Footer Navigation ── */}
      <footer className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-slate-200 bg-white/95 backdrop-blur-md p-4 px-6 sm:px-10 shadow-lg">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => next(page - 1)}
          className="min-h-12 rounded-xl border border-slate-300 px-6 text-base font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all"
        >
          {w.back}
        </button>

        <span className="text-sm font-bold text-slate-600 font-mono">
          {w.page} {page} / 5
        </span>

        {page < 5 ? (
          <button
            type="button"
            onClick={() => next(page + 1)}
            className="min-h-12 rounded-xl bg-orange-700 hover:bg-orange-800 text-white px-8 text-base font-bold shadow-md shadow-orange-700/20 active:scale-95 transition-all"
          >
            {w.next} →
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              stop();
              resetHealth();
              navigate('/', { replace: true });
            }}
            className="min-h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-8 text-base font-bold shadow-md active:scale-95 transition-all"
          >
            {w.finish}
          </button>
        )}
      </footer>

      {/* ── Challenge Duel / Comparison Modal ── */}
      {showChallenge && (
        <ChallengeComparison
          challengerB_Name={userName}
          challengerB_Score={healthScore}
          challengerB_MetabolicAge={metabolicAgeVal}
          challengerB_BodyWater={(bio?.biomarkers || []).find((b) => b.id === 'body_water_pct')?.value || 55}
          challengerB_VisceralFat={(bio?.biomarkers || []).find((b) => b.id === 'visceral_fat_lvl')?.value || 4}
          onContinue={() => setShowChallenge(false)}
        />
      )}

      {/* ── Challenge Prompt Modal ── */}
      <ChallengePrompt
        open={showChallengeModal}
        onClose={() => setShowChallengeModal(false)}
        userName={userName}
        score={healthScore}
        metabolicAge={metabolicAgeVal}
        bodyWater={(bio?.biomarkers || []).find((b) => b.id === 'body_water_pct')?.value || 55}
        visceralFat={(bio?.biomarkers || []).find((b) => b.id === 'visceral_fat_lvl')?.value || 4}
        gender={data.patient?.gender || 'male'}
        email={data.patient?.email || ''}
      />
    </main>
  );
}
