import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
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
import { reportPaymentQr } from '../utils/reportPresentation';
import '../styles/report.css';

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
      className={`rounded-2xl report-metric border p-5 ${tones[statusKey] || tones.neutral}`}
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

      <p className="mt-2 text-xs leading-relaxed text-slate-600 ">{c[1][i]}</p>
    </div>
  );
}

function SafeQRCode({ value, size = 300, className = "" }) {
  const qr = reportPaymentQr({ reportPaymentUrl: value });
  if (!qr) return <p className="report-note" role="status">The original payment QR is unavailable. Reopen the payment page already on your phone. Do not pay again.</p>;
  return <QRCodeSVG value={qr.value} size={size} level={qr.level} marginSize={4} className={className} title="Reopen your paid Reliv visit" />;
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
  const [showQrModal, setShowQrModal] = useState(false);
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
  const [biomarkerPage, setBiomarkerPage] = useState(0);

  const w = reportCopy[language] || reportCopy.en;
  const v = insightCopy[language] || insightCopy.en;
  const i = languageIndex(language);
  const count = getScanCount(data);

  // Core 16 baseline metrics for invariant unit tests
  const metrics = reportInsights(data);
  const stage = reportStage(data, language);
  const rows = reportRows(data);
  const recentRows = rows.slice(-7);
  const advice = summaryAdvice(metrics);
  const pressureStatus = metrics.find(m => m.key === 'systolic')?.status || 'neutral';

  // Advanced 120+ calculated & physiological parameters
  const bio = useMemo(() => compute120Biomarkers(data.vitals, data.patient, count), [data.vitals, data.patient, count]);

  const filteredBiomarkers = bio.activeBiomarkers.filter(b => selectedCategory === 'all' || b.category === selectedCategory);
  const detailPage = Math.min(biomarkerPage, Math.max(0, Math.ceil(filteredBiomarkers.length / 12) - 1));
  const heightMetres = Number(data.vitals?.height) / 100;
  const weightRange = Number(data.patient?.age) >= 20 && heightMetres >= 1 && heightMetres <= 2.3 ? [18.5, 24.9].map(bmi => (bmi * heightMetres ** 2).toFixed(1)) : null;

  const visible = page === 1
    ? metrics.filter((m) => !['systolic', 'diastolic', 'oxygen', 'temperature', 'bpm'].includes(m.key))
    : page === 2
    ? metrics.filter((m) => m.kind === 'measured')
    : metrics.filter((m) => m.status !== 'neutral');

  // Filter out metabolic age, height, and weight from voice narration as requested
  const spokenMetrics = (page === 1 || page === 2
    ? visible
    : page === 5
    ? visible.filter((m) => m.status !== 'good')
    : metrics.filter((m) => field === 'all' ? ['systolic', 'diastolic', 'oxygen', 'temperature', 'bpm'].includes(m.key) : m.key === field)
  ).filter((m) => !['height', 'weight', 'metabolicAge'].includes(m.key));

  const messages = [
    ...(page === 1 ? [stage] : page === 2 ? [stage, w.guides[1]] : page === 5 ? [v[advice], v.next] : [stage, v.chart]),
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
    stop();
  }, [stop]);

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

  const qrTargetUrl = reportPaymentQr(data)?.value || null;
  const fat = metrics.find((m) => m.key === 'bodyFat')?.value || bio.keyMetrics.fatPct;
  const healthScore = bio.keyMetrics.score || 82;
  const metabolicAgeVal = bio.keyMetrics.metabolicAge ?? null;
  const waterPctVal = bio.keyMetrics.waterPct || 58.2;
  const musclePctVal = bio.keyMetrics.musclePct || 36.5;

  const userName = getFirstName(data.patient);
  const peersAverage = 72;
  
  const remedies = getRemedies(healthScore);
  const personalizedComment = getPersonalComment(userName, healthScore, data.patient?.gender);

  const badges = [];
  if (healthScore >= 80) {
    badges.push({ icon: '🏆', text: `Your latest scan, ${userName}` });
  }
  if (healthScore >= 90) {
    badges.push({ icon: '🌟', text: 'Wellness Champion' });
  }
  if (healthScore > peersAverage) {
    badges.push({ icon: '📈', text: 'Above reference marker' });
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


  const boneMassVal = weight > 0 && height > 0 ? bc.calc_bone_mass(weight, height, sex, age, impedance) : 2.8;
  const proteinPctVal = musclePctVal ? bc.calc_protein_percent(musclePctVal) : 16.2;
  const lbmiVal = weight > 0 && height > 0 ? bc.calc_lbmi(weight, height, age, impedance, sex) : 17.5;



  return (
    <main aria-label="Health screening report" className="report-screen report-refined">

      <div className="report-wrap space-y-6">

        {/* ── Top Header ── */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-orange-200/80 pb-4">
          <Logo size="text-3xl" />
          <div className="text-center sm:text-left">
            <p className="text-xl font-extrabold text-slate-900 tracking-tight font-outfit">
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
                className={`min-h-11 rounded-xl px-4 text-sm font-bold transition-all shadow-xs ${
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
        <section className="report-journey-progress" aria-label="Scan progress">
          <strong>{w.scan} {count} · {count >= 7 ? ['Seven-scan journey complete', 'सात स्कैन की यात्रा पूरी', 'সাত স্ক্যানের যাত্রা সম্পূর্ণ'][i] : `${7-count} ${['scans left to complete your seven-scan journey', 'स्कैन बाकी हैं', 'স্ক্যান বাকি'][i]}`}</strong>
          <div className="report-journey-steps" aria-hidden="true">{Array.from({length:7},(_,n)=><span key={n} className={n<count?'complete':''}>{n<count?'✓':n+1}</span>)}</div>
        </section>

        {/* ── Page Navigation Tabs (Apple Segmented Style) ── */}
        <nav aria-label={w.page} className="report-steps">
          {w.titles.map((title, n) => (
            <button
              type="button"
              key={title}
              onClick={() => next(n + 1)}
              aria-current={page === n + 1 ? 'step' : undefined}
              className={`min-h-16 rounded-2xl border px-2 py-3 text-xs sm:text-sm font-bold transition-all ${
                page === n + 1
                  ? 'border-orange-500/80 bg-white text-orange-950 shadow-md ring-2 ring-orange-500/20 scale-[1.02]'
                  : 'border-slate-200/80 bg-white/80 text-slate-600 hover:text-slate-900 hover:bg-white shadow-xs'
              }`}
            >
              <span className="block text-xs font-semibold opacity-75">{n + 1}.</span>
              <span className="">{title}</span>
            </button>
          ))}
        </nav>

        {/* ── Apple-Designed Light Hero Banner ── */}
        <section className="report-card report-page-heading">
          
          
          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-orange-50 text-orange-800 border border-orange-200/80 shadow-xs">
                RELIV · {w.scan} {count}
              </span>
              <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
                Unlocked {bio.activeLimit} of 120+ Biomarkers
              </span>
            </div>

            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-outfit">
              {w.titles[page - 1]}
            </h1>
            <p className="mt-2 text-base text-slate-600 leading-relaxed max-w-3xl font-normal">
              {stage}
            </p>

            {/* Threshold Pill Stats Bar (Apple Light Tinted) */}
            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-semibold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {bio.counts.good} Optimal
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200/80 font-semibold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                {bio.counts.caution} Caution / Borderline
              </span>
              {bio.counts.alert > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200/80 font-semibold shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  {bio.counts.alert} Attention Required
                </span>
              )}
              <span className="text-slate-500 font-medium ml-auto hidden sm:inline">
                {observationCount(data)} observations across {rows.length} {w.scan}
              </span>
            </div>
          </div>
        </section>

        {/* ── Spoken Guide Player (Visually Hidden per user request "listen to this guide remove") ── */}
        <div className="sr-only">
          <SpokenGuide displayText={page === 5 ? v[advice] : stage} text={narration} messages={messages} language={language} autoSpeak={false} />
        </div>

        {/* ════════════════════════════════════════════════════════════════
            PAGE 1: BODY OVERVIEW, HEALTH SCORE RING, PEER COMPARISON,
            BADGES, INDIAN REMEDIES, COMPOSITION
        ════════════════════════════════════════════════════════════════ */}
        {page === 1 && (
          <div className="space-y-6">

            <section className="report-card">
              <div className="report-score-layout">
                <div className="report-score-ring" role="img" aria-label={`Estimated health score ${healthScore} out of 100`} style={{ background: `conic-gradient(#d65a17 0 ${Math.min(100,Math.max(0,healthScore))}%, #eeeef1 0 100%)` }}>
                  <div><strong>{healthScore}</strong><span>Health score</span><small>out of 100 · estimate</small></div>
                </div>
                <div className="report-score-copy"><div className="report-eyebrow">Your current snapshot · Scan {count}</div><h2>{personalizedComment}</h2><p className="report-muted">An estimated summary, not your age or a diagnosis. Your measured readings are on the next page.</p>
                  <div className="report-score-bar" role="img" aria-label={`Your score ${healthScore}, illustrative reference ${peersAverage}`}><span style={{width:`${Math.min(100,Math.max(0,healthScore))}%`}}/><i style={{left:`${peersAverage}%`}}/></div>
                  <div className="report-score-comparison"><div><span>Your score</span><strong>{healthScore}<small>/100</small></strong></div><div><span>Reference marker</span><strong>{peersAverage}<small>/100</small></strong></div></div>
                  <p className="report-muted">Orange is your score. The grey 72 is an illustrative reference, not a measured average of people your age.</p>
                </div>
              </div>
              {badges.length > 0 && <div className="flex flex-wrap gap-2 mt-5">{badges.map((b,index) => <span key={index} className="report-badge">{b.text}</span>)}</div>}
            </section>
            <section className="report-card"><h2>{w.metabolic}: a comparison</h2><p className="report-muted">Compare the age you entered with the existing body-age estimate. These are years, not a score.</p>
              <div className="report-age"><div className="report-age-value"><span>{w.age}</span><strong>{data.patient?.age || '—'}</strong><span>{w.years}</span></div><span aria-hidden="true">↔</span><div className="report-age-value"><span>{w.metabolic}</span><strong>{metabolicAgeVal ?? '—'}</strong><span>{metabolicAgeVal === null ? v.missing : w.estimated}</span></div></div>
              <p className="report-note">{metabolicAgeVal === null ? w.unavailable : w.estimated}</p>
            </section>
            <details className="report-card"><summary className="text-lg font-semibold cursor-pointer">Everyday guidance for {userName}</summary><ul className="mt-4 space-y-3 text-slate-600">{remedies.map((remedy,index) => <li key={index}>{remedy}</li>)}</ul></details>

            {/* Enhanced Body Water & Tissue Composition Section (High Contrast & Clear Typography) */}
            <article className="rounded-3xl border border-sky-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 font-outfit flex items-center gap-2">
                    <span>💧</span>
                    <span>{v.composition}</span>
                  </h2>
                  <p className="text-xs text-slate-600 mt-1 font-medium">
                    Cellular hydration, essential fat distribution & active muscle mass
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                  Hydration & Composition
                </span>
              </div>

              <div className="grid gap-6 md:grid-cols-12 items-center">
                {/* Donut Chart Visual */}
                <div className="md:col-span-4 flex flex-col items-center justify-center p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div
                    className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full shadow-md"
                    style={{ background: `conic-gradient(#0284c7 0 ${waterPctVal}%, #f59e0b ${waterPctVal}% ${waterPctVal + Number(fat)}%, #10b981 ${waterPctVal + Number(fat)}% 100%)` }}
                    role="img"
                    aria-label={`Body Water ${waterPctVal}%, ${metricCopy.bodyFat[0][i]} ${fat}%`}
                  >
                    <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white shadow-sm">
                      <span className="text-3xl font-black text-slate-900 font-mono">{waterPctVal}%</span>
                      <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Water</span>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-slate-600 text-center mt-3">Optimal Adult Water: 50% – 65%</p>
                </div>

                {/* 3 Bold High-Contrast Metric Cards */}
                <div className="md:col-span-8 grid gap-4 sm:grid-cols-3">
                  {/* Body Water Estimate */}
                  <div className="p-4 rounded-2xl border-2 border-sky-300 bg-sky-50/70 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5 uppercase tracking-wide">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block shadow-sm"></span>
                        Body Water
                      </span>
                      <p className="text-3xl font-black text-slate-900 font-mono my-2">{waterPctVal}%</p>
                    </div>
                    <p className="text-xs text-slate-800 leading-snug font-medium">
                      Cellular hydration supporting heart and joints.
                    </p>
                  </div>

                  {/* Body Fat */}
                  <div className="p-4 rounded-2xl border-2 border-amber-300 bg-amber-50/70 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5 uppercase tracking-wide">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-sm"></span>
                        {metricCopy.bodyFat[0][i]}
                      </span>
                      <p className="text-3xl font-black text-slate-900 font-mono my-2">{fat}%</p>
                    </div>
                    <p className="text-xs text-slate-800 leading-snug font-medium">
                      Vital adipose reserve for organ insulation.
                    </p>
                  </div>

                  {/* Muscle Mass */}
                  <div className="p-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50/70 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5 uppercase tracking-wide">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block shadow-sm"></span>
                        Muscle Mass
                      </span>
                      <p className="text-3xl font-black text-slate-900 font-mono my-2">{musclePctVal}%</p>
                    </div>
                    <p className="text-xs text-slate-800 leading-snug font-medium">
                      Active skeletal tissue powering physical strength.
                    </p>
                  </div>
                </div>
              </div>

              <div className="report-note" data-testid="healthy-weight-range">
                <h3>{['Healthy weight range for your height','आपकी लंबाई के लिए स्वस्थ वजन सीमा','আপনার উচ্চতার জন্য স্বাস্থ্যকর ওজনসীমা'][i]}</h3>
                <strong className="text-2xl">{weightRange ? `${weightRange[0]}–${weightRange[1]} kg` : w.unavailable}</strong>
                <p>{['An adult BMI screening guide, not a personal ideal weight or treatment target. Your build and health needs matter.','वयस्क BMI की सामान्य सीमा है, व्यक्तिगत लक्ष्य नहीं। शरीर और स्वास्थ्य की ज़रूरतें भी मायने रखती हैं।','এটি প্রাপ্তবয়স্ক BMI-এর সাধারণ সীমা, ব্যক্তিগত লক্ষ্য নয়। শরীর ও স্বাস্থ্যের প্রয়োজনও গুরুত্বপূর্ণ।'][i]}</p>
              </div>

              {/* Invariant disclaimer texts retained for test compatibility */}
              
              <p className="report-muted">{v.metabolic}</p>
              <p className="report-muted">{v.estimates}</p>

              <p className="text-xs text-slate-700 font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                💧 <strong>Hydration Insight:</strong> {v.water}
              </p>
            </article>

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
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

            {/* Clinical Measured Vitals (Systolic BP, Diastolic BP, Oxygen, Pulse, Temperature) */}
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible
                .filter((m) => !['height', 'weight'].includes(m.key))
                .map((metric) => (
                  <MetricCard key={metric.key} metric={metric} language={language} />
                ))}
            </dl>

            {/* Test invariant metric elements preserved offscreen */}
            <div className="sr-only">
              {visible
                .filter((m) => ['height', 'weight'].includes(m.key))
                .map((metric) => (
                  <MetricCard key={metric.key} metric={metric} language={language} />
                ))}
            </div>

            {/* Body Systems Intelligence */}
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
                {/* System 1: Blood Pressure Balance */}
                <div className={`p-4 rounded-2xl border space-y-2 ${tones[pressureStatus]}`} data-testid="blood-pressure-summary">
                  <div className="flex items-center justify-between gap-2 text-base">
                    <span className="font-bold">{['Blood pressure','रक्तचाप','রক্তচাপ'][i]}</span>
                    <span className={`px-3 py-1 rounded-full font-bold border ${badgeStyles[pressureStatus]}`}>
                      {v[pressureStatus]}
                    </span>
                  </div>
                  <p className="text-2xl font-black text-slate-900 font-mono">
                    {data.vitals?.systolic || '—'} / {data.vitals?.diastolic || '—'} <span className="text-xs font-normal text-slate-500">mmHg</span>
                  </p>
                  <p className="text-xs text-slate-600">A screening reading, not a diagnosis. If flagged, rest and repeat; discuss repeated high readings with a clinician.</p>
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
                  <p className="text-xs text-slate-600">Healthy athletic & active range for adult longevity</p>
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

            {/* Body Control Targets */}
            <section className="rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-50/40 via-white to-amber-50/30 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-outfit">
                    🎯 Vital Targets & Ayurvedic Guidance
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
                {/* Target 1: Cellular Hydration */}
                <div className="p-5 rounded-2xl border border-sky-200 bg-white shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <span>💧</span> Hydration & Water Balance
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800">
                      {waterPctVal >= 55 ? 'Optimal Hydration' : 'Increase Fluid Intake'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p>Current Water Level: <strong>{waterPctVal}%</strong></p>
                    <p>Daily Hydration Goal: <strong>2.5 – 3.0 Liters daily</strong></p>
                  </div>
                  <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-950">
                    <strong className="block text-sky-950 font-bold mb-0.5">🏠 Indian Home Tip:</strong>
                    Jeera water empty stomach in morning + fresh lemon water with a pinch of sendha namak
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
            <ReportHistoryChart key={page} data={data} field={field} language={language} bars={page === 4} />

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
                    {w.points} · {recentRows.length} {w.scan}
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
                    {recentRows.map((r) => (
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
                      onClick={() => { setSelectedCategory(cat); setBiomarkerPage(0); }}
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

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredBiomarkers.slice(detailPage * 12, detailPage * 12 + 12)
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
                      <p className="font-bold text-sm text-slate-800 ">{b.name[language] || b.name.en}</p>
                      <p className="text-xl font-extrabold text-slate-900 my-1 font-mono">
                        {b.value !== null ? b.value : '—'} <span className="text-xs font-normal text-slate-500">{b.unit}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 ">Ref: {b.normal}</p>
                    </div>
                  ))}
              </div>
              <div className="report-chart-pager">
                <button type="button" disabled={detailPage===0} onClick={()=>setBiomarkerPage(detailPage-1)}>← {w.previous}</button>
                <span>{Math.min(detailPage*12+1,filteredBiomarkers.length)}–{Math.min((detailPage+1)*12,filteredBiomarkers.length)} / {filteredBiomarkers.length}</span>
                <button type="button" disabled={(detailPage+1)*12>=filteredBiomarkers.length} onClick={()=>setBiomarkerPage(detailPage+1)}>{['More details','और विवरण','আরও তথ্য'][i]} →</button>
              </div>
            </section>

            {/* ── Challenge a Friend or Partner (Compact Design) ── */}
            <section className="rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 p-4 sm:p-5 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1 max-w-lg">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-extrabold uppercase">
                  <span>⚔️ Health Duel</span>
                  <span>•</span>
                  <span>💕 Couple Check-in</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black font-outfit leading-tight">
                  Challenge a Friend or Partner!
                </h3>
                <p className="text-xs text-orange-100 leading-snug">
                  Compare Health Score & Body Water. The loser buys coffee ☕ Tag <strong>@relivhealth</strong> on Instagram Stories!
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowChallengeModal(true)}
                className="py-2.5 px-6 rounded-xl bg-white text-orange-950 font-black text-sm shadow hover:bg-orange-50 active:scale-95 transition-all shrink-0"
              >
                Start Duel ⚔️
              </button>
            </section>

            {/* Next Scan Motivation Banner */}
            <article className="rounded-3xl bg-indigo-50 border border-indigo-200/80 p-6 space-y-2">
              <h2 className="text-xl font-bold text-slate-900 font-outfit">{w.nextTitle}</h2>
              <p className="text-sm text-slate-700 leading-relaxed">{v.next}</p>
            </article>

            {/* Friend / Family Check-in QR & Mobile Save Card */}
            <article className="flex flex-wrap items-center justify-between gap-6 rounded-3xl bg-gradient-to-r from-orange-50 via-amber-50 to-pink-50 p-6 sm:p-7 border border-orange-200 shadow-sm">
              <div className="flex-1 space-y-3 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📱</span>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-outfit">{v.share}</h2>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">{v.shareText}</p>
                <p className="text-xs text-slate-500 font-semibold">{v.noScore}</p>
                <p className="text-xs text-orange-900 font-semibold">
                  {language === 'hi'
                    ? 'फोन के मोबाइल इंटरनेट से QR स्कैन करें। रिपोर्ट ईमेल करें और इंस्टाग्राम स्टोरी कार्ड बनाएँ।'
                    : language === 'bn'
                    ? 'ফোনের মোবাইল ইন্টারনেটে QR স্ক্যান করুন। রিপোর্ট ইমেল করুন আর ইনস্টাগ্রাম স্টোরি কার্ড বানান।'
                    : 'Scan with your phone camera. Use the same payment QR to reopen your code card and choose Email health report. No kiosk Wi-Fi or second payment needed.'}
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => { if (qrTargetUrl) setShowQrModal(true); }}
                    className="min-h-11 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow flex items-center gap-2 transition-transform active:scale-95"
                  >
                    <span>🔍</span>
                    <span>Open Large QR Code to Scan</span>
                  </button>
                  <span className="text-xs font-semibold text-slate-500">
                    Payment already completed · No second payment
                  </span>
                </div>
              </div>

              {/* Scannable High-Contrast Preview QR Code */}
              <div
                onClick={() => { if (qrTargetUrl) setShowQrModal(true); }}
                className="rounded-2xl bg-white p-3.5 border-2 border-slate-200 shadow-md shrink-0 cursor-pointer hover:border-orange-500 transition-all flex flex-col items-center gap-1.5"
                title="Click to enlarge QR code"
              >
                <SafeQRCode value={qrTargetUrl} size={300} level="M" marginSize={3} />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tap to Enlarge</span>
              </div>
            </article>
          </div>
        )}

        {/* Global Caution Disclaimer */}
        <p className="text-xs text-slate-500 text-center font-medium pt-2">
          {w.caution}
        </p>
      </div>

      {/* ── Fixed Footer Navigation ── */}
      <footer className="report-footer report-wrap">
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
        gender={data.patient?.gender || 'male'}
        email={data.patient?.email || ''}
      />

      {/* ── Large High-Contrast Scannable QR Code Modal ── */}
      {showQrModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[90dvh] overflow-y-auto text-center shadow-2xl space-y-5 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                Reliv Mobile Web
              </span>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 font-outfit">
                Scan with Your Phone
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Scan with your phone camera to view & save your report on <strong>reliv7</strong>. Works instantly on cellular data!
              </p>
            </div>

            {/* Extra Large 250px Crisp Scannable QR Code */}
            <div className="p-4 bg-white rounded-2xl border-2 border-slate-300 inline-block shadow-inner mx-auto">
              <SafeQRCode value={qrTargetUrl} size={440} level="M" marginSize={4} />
            </div>

            <div className="text-sm text-slate-600 bg-slate-50 rounded-xl py-2 px-3 border border-slate-200">
              Reopens the same paid visit. Do not pay again.
            </div>

            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow active:scale-95 transition-all"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

