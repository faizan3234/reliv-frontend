// src/components/ReportHistoryChart.jsx
// Apple-Designed Multi-Series Physiological Tracking Chart (All-in-One Graph)
// Blood Pressure (Red/Orange), Oxygen (Blue), Temperature (Green), Pulse (Purple), Weight (Teal)
// Unified multi-metric canvas for full physiological correlation with interactive Apple Health touch tooltips

import React, { useState } from 'react';
import { metricCopy, insightCopy, languageIndex } from '../voice/insightCopy';
import { metricColours, reportRows } from '../utils/reportInsights';
import { reportCopy } from '../voice/guidedReport';

export default function ReportHistoryChart({ data, field, language = 'en', bars = false }) {
  const rows = reportRows(data).slice(-12);
  const i = languageIndex(language);
  const w = reportCopy[language] || reportCopy.en;
  const v = insightCopy[language] || insightCopy.en;

  const [activePoint, setActivePoint] = useState(null);

  const keys = field === 'all'
    ? ['systolic', 'diastolic', 'oxygen', 'temperature', 'bpm', 'weight']
    : [field];

  // Specific clinical palette
  const distinctColours = {
    systolic: '#ef4444',    // Red (BP Systolic)
    diastolic: '#f97316',   // Orange (BP Diastolic)
    oxygen: '#0284c7',      // Ocean Blue (Oxygen)
    temperature: '#10b981', // Emerald Green (Temperature)
    bpm: '#8b5cf6',         // Royal Purple (Pulse)
    weight: '#06b6d4',      // Teal (Weight)
    bmi: '#ec4899',
    bodyFat: '#d97706',
    bodyWater: '#0284c7',
    restingEnergy: '#7c3aed',
  };

  // Find all valid non-zero values across the displayed keys
  const allValues = [];
  keys.forEach((key) => {
    rows.forEach((r) => {
      const val = Number(r[key]);
      if (val > 0) allValues.push(val);
    });
  });

  // Calculate dynamic or calibrated bounds
  const hasValues = allValues.length > 0;
  const minVal = hasValues ? Math.min(...allValues) : 0;
  const maxVal = hasValues ? Math.max(...allValues) : 100;

  // Single metric mode gets custom tight bounds; all-in-one gets calibrated physiological span
  const min = bars ? 0 : keys.length === 1 ? Math.max(0, minVal * 0.9) : Math.min(40, minVal * 0.95);
  const max = keys.length === 1
    ? (maxVal === minVal ? maxVal * 1.2 : maxVal * 1.1)
    : Math.max(160, maxVal * 1.05);

  const chartW = 860;
  const plotLeft = 65;
  const plotRight = 810;
  const plotTop = 45;
  const plotBottom = 265;

  const x = (n) => rows.length <= 1 ? (plotLeft + plotRight) / 2 : plotLeft + (n * (plotRight - plotLeft)) / (rows.length - 1);
  const y = (val) => plotBottom - ((val - min) / Math.max(0.1, max - min)) * (plotBottom - plotTop);

  // Group bar sizing
  const barGroupWidth = 60;
  const activeKeyCount = keys.length;
  const barWidth = Math.max(6, Math.min(18, Math.floor((barGroupWidth - (activeKeyCount - 1) * 3) / activeKeyCount)));
  const barGap = 3;

  const handleSelect = (scan, key, val, prevVal) => {
    setActivePoint({ scan, key, val, prevVal });
  };

  const activeClr = activePoint ? (distinctColours[activePoint.key] || metricColours[activePoint.key] || '#0284c7') : '#0284c7';
  const activeCopy = activePoint ? (metricCopy[activePoint.key] || [[activePoint.key], [''], '']) : null;
  const activeDiff = activePoint && activePoint.prevVal > 0 ? Number((activePoint.val - activePoint.prevVal).toFixed(1)) : null;

  return (
    <figure className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all duration-300 relative">
      {/* Header with Title and Unified Multi-Series Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
        <div>
          <figcaption className="text-xl font-extrabold text-slate-900 tracking-tight font-outfit">
            {v.chart}
          </figcaption>
          <p className="text-xs text-slate-500 mt-1">
            {bars
              ? 'Touch any bar to view measurement details & previous scan delta'
              : 'Touch any point along the curve to inspect previous scan trajectory'}
          </p>
        </div>

        {/* Multi-series Visual Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          {keys.map((key) => {
            const clr = distinctColours[key] || metricColours[key] || '#64748b';
            const c = metricCopy[key] || [[key], [''], ''];
            return (
              <span
                key={key}
                className="flex items-center gap-1.5 rounded-full px-3 py-1 bg-slate-50 border shadow-xs transition-colors hover:bg-slate-100"
                style={{ borderColor: `${clr}40`, color: clr }}
              >
                <span className="w-2.5 h-2.5 rounded-full inline-block shadow-sm" style={{ backgroundColor: clr }}></span>
                <span>{c[0][i]}</span>
                <span className="text-[10px] opacity-75 font-normal">({c[2]})</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Interactive Apple-Style Floating Inspection Pill */}
      {activePoint && (
        <div className="mb-4 rounded-2xl bg-slate-900/95 text-white backdrop-blur-xl p-4 sm:p-5 shadow-xl border border-white/10 flex flex-wrap items-center justify-between gap-4 transition-all">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full inline-block shadow-sm" style={{ backgroundColor: activeClr }} />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {w.scan} {activePoint.scan} · {activeCopy?.[0]?.[i] || activePoint.key}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                ({activeCopy?.[2] || ''})
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                {activePoint.val}
                <span className="text-sm font-normal text-slate-400 ml-1">{activeCopy?.[2] || ''}</span>
              </span>

              {activePoint.prevVal > 0 ? (
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="text-slate-400">
                    Previous scan: <strong className="text-white font-mono">{activePoint.prevVal}</strong> {activeCopy?.[2] || ''}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                    activeDiff === 0
                      ? 'bg-slate-800 text-slate-300 border border-slate-700'
                      : activeDiff > 0
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {activeDiff > 0 ? `+${activeDiff}` : activeDiff} {activeCopy?.[2] || ''}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
                  Initial baseline · First recorded visit
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActivePoint(null)}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all"
          >
            Done ✕
          </button>
        </div>
      )}

      {/* Unified Single SVG Chart Canvas */}
      <div className="relative rounded-2xl bg-gradient-to-b from-slate-50/50 via-white to-slate-50/30 p-2 sm:p-4 border border-slate-100 overflow-hidden">
        <svg
          viewBox={`0 0 ${chartW} 370`}
          className="w-full select-none"
          role="img"
          aria-label={keys.map((k) => metricCopy[k]?.[0]?.[i] || k).join(', ')}
        >
          {/* Subtle Gridlines & Scale Values */}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const yLine = plotBottom - f * (plotBottom - plotTop);
            const valLabel = Math.round(min + f * (max - min));
            return (
              <g key={f}>
                <line
                  x1={plotLeft - 10}
                  y1={yLine}
                  x2={plotRight + 20}
                  y2={yLine}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={plotLeft - 18}
                  y={yLine + 4}
                  textAnchor="end"
                  fontSize="12"
                  fontWeight="600"
                  fill="#94a3b8"
                  fontFamily="monospace"
                >
                  {valLabel}
                </text>
              </g>
            );
          })}

          {/* If Line Chart: Plot multi-series lines first */}
          {!bars && keys.map((key) => {
            const clr = distinctColours[key] || metricColours[key] || '#64748b';
            return (
              <g key={`lines-${key}`}>
                {rows.map((r, n) => {
                  if (n === 0) return null;
                  const prevVal = Number(rows[n - 1][key]);
                  const currVal = Number(r[key]);
                  if (prevVal > 0 && currVal > 0) {
                    return (
                      <line
                        key={`seg-${r.scan}`}
                        x1={x(n - 1)}
                        y1={y(prevVal)}
                        x2={x(n)}
                        y2={y(currVal)}
                        stroke={clr}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        className="transition-all"
                      />
                    );
                  }
                  return null;
                })}
              </g>
            );
          })}

          {/* Plot Data Elements: Circles for lines, Rects for bars */}
          {bars ? (
            // GROUPED BAR CHART: side-by-side rects for each scan
            rows.map((r, n) => {
              const scanCenterX = x(n);
              const totalW = keys.length * barWidth + (keys.length - 1) * barGap;
              const startX = scanCenterX - totalW / 2;

              return (
                <g key={`scan-bar-${r.scan}`}>
                  {keys.map((key, kIdx) => {
                    const val = Number(r[key]);
                    if (!(val > 0)) return null;
                    const prevVal = n > 0 ? Number(rows[n - 1][key]) : 0;
                    const clr = distinctColours[key] || metricColours[key] || '#64748b';
                    const bx = startX + kIdx * (barWidth + barGap);
                    const by = y(val);
                    const bh = Math.max(4, plotBottom - by);
                    const isSelected = activePoint?.scan === r.scan && activePoint?.key === key;

                    return (
                      <rect
                        key={`bar-${key}-${r.scan}`}
                        x={bx}
                        y={by}
                        width={barWidth}
                        height={bh}
                        rx="4"
                        fill={clr}
                        opacity={activePoint && !isSelected ? 0.6 : 1}
                        stroke={isSelected ? '#0f172a' : 'none'}
                        strokeWidth={isSelected ? '2' : '0'}
                        className="transition-all duration-200 cursor-pointer hover:brightness-110 active:opacity-80"
                        onClick={() => handleSelect(r.scan, key, val, prevVal)}
                        onTouchStart={() => handleSelect(r.scan, key, val, prevVal)}
                      />
                    );
                  })}
                </g>
              );
            })
          ) : (
            // MULTI-SERIES LINE CHART: Circles for all valid points
            keys.map((key) => {
              const clr = distinctColours[key] || metricColours[key] || '#64748b';
              return (
                <g key={`pts-${key}`}>
                  {rows.map((r, n) => {
                    const val = Number(r[key]);
                    if (!(val > 0)) return null;
                    const prevVal = n > 0 ? Number(rows[n - 1][key]) : 0;
                    const cx = x(n);
                    const cy = y(val);
                    const isSelected = activePoint?.scan === r.scan && activePoint?.key === key;

                    return (
                      <g
                        key={`pt-${key}-${r.scan}`}
                        className="cursor-pointer group"
                        onClick={() => handleSelect(r.scan, key, val, prevVal)}
                        onTouchStart={() => handleSelect(r.scan, key, val, prevVal)}
                      >
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isSelected ? '8' : '6'}
                          fill={clr}
                          stroke="#ffffff"
                          strokeWidth={isSelected ? '3.5' : '2.5'}
                          className="shadow-sm transition-transform group-hover:scale-125"
                        />
                      </g>
                    );
                  })}
                </g>
              );
            })
          )}

          {/* X-Axis Scan Labels & Baseline Line */}
          <line
            x1={plotLeft - 10}
            y1={plotBottom}
            x2={plotRight + 20}
            y2={plotBottom}
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />

          {rows.map((r, n) => (
            <text
              key={`xlabel-${r.scan}`}
              x={x(n)}
              y={plotBottom + 28}
              textAnchor="middle"
              fontSize="13"
              fontWeight="700"
              fill="#475569"
            >
              {w.scan} {r.scan}
            </text>
          ))}
        </svg>
      </div>

      {/* Latest Values Summary Row */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {keys.map((key) => {
          const clr = distinctColours[key] || metricColours[key] || '#64748b';
          const c = metricCopy[key] || [[key], [''], ''];
          const valid = rows.filter((r) => Number(r[key]) > 0);
          const latestVal = valid.length > 0 ? valid[valid.length - 1][key] : null;

          return (
            <div
              key={key}
              className="p-3 rounded-2xl border bg-slate-50/60 flex flex-col justify-between transition-all hover:bg-slate-50"
              style={{ borderColor: `${clr}30` }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: clr }}></span>
                <span className="text-xs font-bold text-slate-700 truncate">{c[0][i]}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold font-mono" style={{ color: clr }}>
                  {latestVal !== null ? latestVal : '—'}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">{c[2]}</span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-slate-500 font-medium flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block"></span>
        {w.privacy}
      </p>
    </figure>
  );
}

