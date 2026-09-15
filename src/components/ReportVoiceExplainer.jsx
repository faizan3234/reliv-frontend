import React, { useState } from 'react';
import { Volume2, VolumeX, Sparkles, X, RotateCcw } from 'lucide-react';
import { useSpeech } from '../context/SpeechContext';
import { METRIC_EXPLAINERS, getMetricLaymanExplainer } from '../voice/reportVoice';

export default function ReportVoiceExplainer({
  reportSpeechLanguage = 'hi',
  onLanguageChange,
  availableMetrics = ['metabolicAge', 'bodyScore'],
  healthData = {},
  onReplayOverview
}) {
  const { speakText, stop, isSpeaking } = useSpeech();
  const [activeMetric, setActiveMetric] = useState(null);
  const [showExplainerPanel, setShowExplainerPanel] = useState(false);

  const lang = reportSpeechLanguage || 'hi';

  const handleSelectMetric = (metricKey) => {
    setActiveMetric(metricKey);
    stop();
    const explainerText = getMetricLaymanExplainer(metricKey, healthData, lang);
    if (explainerText) {
      speakText(explainerText, { langHint: lang });
    }
  };

  const handleCloseExplainer = () => {
    setActiveMetric(null);
    stop();
  };

  const handleReplayMetric = () => {
    if (!activeMetric) return;
    stop();
    const explainerText = getMetricLaymanExplainer(activeMetric, healthData, lang);
    if (explainerText) {
      speakText(explainerText, { langHint: lang });
    }
  };

  const currentMetricData = activeMetric ? METRIC_EXPLAINERS[activeMetric] : null;

  return (
    <div className="w-full max-w-4xl mx-auto px-1 sm:px-2 mb-4">
      {/* Top Floating / Inline Voice Bar */}
      <div className="bg-gradient-to-r from-orange-50/90 via-amber-50/90 to-white backdrop-blur-md rounded-2xl border border-orange-200/80 p-2.5 sm:p-3 shadow-md flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Left: Replay & Stop */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              handleCloseExplainer();
              if (onReplayOverview) onReplayOverview();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-extrabold text-xs shadow-sm shadow-orange-500/25 transition-all cursor-pointer"
          >
            <RotateCcw size={13} className="stroke-[2.5]" />
            <span>
              {lang === 'hi' ? 'शुरू से सुनें' : lang === 'bn' ? 'শুরু থেকে শুনুন' : 'Replay Voice Guide'}
            </span>
          </button>

          {isSpeaking && (
            <button
              type="button"
              onClick={stop}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs active:scale-95 transition-all cursor-pointer"
            >
              <VolumeX size={13} />
              <span>{lang === 'hi' ? 'रुकें' : lang === 'bn' ? 'থামুন' : 'Stop'}</span>
            </button>
          )}
        </div>

        {/* Center: "What does this mean?" / "सरल भाषा में समझें" Toggle */}
        <button
          type="button"
          onClick={() => setShowExplainerPanel(!showExplainerPanel)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer border ${
            showExplainerPanel || activeMetric
              ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm'
              : 'bg-white hover:bg-amber-50 text-amber-800 border-amber-300 shadow-xs'
          }`}
        >
          <Sparkles size={13} className="text-amber-700" />
          <span>
            {lang === 'hi'
              ? '💡 सरल शब्दों में समझें'
              : lang === 'bn'
              ? '💡 সহজ কথায় জানুন'
              : '💡 What Does This Mean?'}
          </span>
        </button>

        {/* Right: Language Switch Pills */}
        <div className="flex items-center gap-1 bg-white/80 p-1 rounded-xl border border-slate-200 shadow-xs">
          {[
            { code: 'hi', label: 'हिंदी' },
            { code: 'en', label: 'Eng' },
            { code: 'bn', label: 'বাংলা' },
          ].map(({ code, label }) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                if (onLanguageChange) onLanguageChange(code);
              }}
              className={`px-2 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                lang === code
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Explainer Metric Chips (Shown when panel open or active) */}
      {(showExplainerPanel || activeMetric) && (
        <div className="mt-2.5 p-3 rounded-2xl bg-gradient-to-b from-amber-50/95 to-orange-50/70 border border-amber-200 shadow-lg animate-fadeIn space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <span>👇</span>
              <span>
                {lang === 'hi'
                  ? 'जिस चीज़ के बारे में आसान भाषा में जानना चाहते हैं, उसे छुएं:'
                  : lang === 'bn'
                  ? 'সহজ ভাষায় অর্থ জানতে নিচের যেকোনো বোতামে চাপুন:'
                  : 'Tap any metric below to hear what it means in simple everyday terms:'}
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                setShowExplainerPanel(false);
                handleCloseExplainer();
              }}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-white/80 transition-all cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          {/* Metric Chips */}
          <div className="flex flex-wrap gap-2">
            {availableMetrics.map((key) => {
              const item = METRIC_EXPLAINERS[key];
              if (!item) return null;
              const isSelected = activeMetric === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectMetric(key)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-orange-500 text-white border-orange-600 shadow-md scale-102'
                      : 'bg-white hover:bg-amber-100/70 text-slate-800 border-slate-200 shadow-xs'
                  }`}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.title[lang] || item.title.en}</span>
                </button>
              );
            })}
          </div>

          {/* Active Explainer Detail Card */}
          {currentMetricData && (
            <div className="mt-2.5 p-4 rounded-2xl bg-white border-2 border-orange-300 shadow-md space-y-2 animate-scaleUp">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{currentMetricData.icon}</span>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      {currentMetricData.title[lang] || currentMetricData.title.en}
                    </h4>
                    <p className="text-[11px] text-orange-600 font-semibold">
                      {currentMetricData.subtitle[lang] || currentMetricData.subtitle.en}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleReplayMetric}
                    className="p-1.5 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-700 transition-all cursor-pointer"
                    title="Replay Audio"
                  >
                    <Volume2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseExplainer}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Spoken Text in Simple Layman Words */}
              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-amber-50/50 p-3 rounded-xl border border-amber-200/60 font-medium">
                {getMetricLaymanExplainer(activeMetric, healthData, lang)}
              </div>

              {/* Sub-badge */}
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 font-medium">
                <span>🔊 {lang === 'hi' ? 'आवाज़ सुनकर समझें' : lang === 'bn' ? 'অডিও শুনে জানুন' : 'Listening aloud'}</span>
                <button
                  type="button"
                  onClick={handleCloseExplainer}
                  className="text-orange-600 font-bold hover:underline cursor-pointer"
                >
                  {lang === 'hi' ? 'समझ गए ✓' : lang === 'bn' ? 'বুঝেছি ✓' : 'Got it ✓'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
