// src/components/ReportHistoryChart.jsx
// Premium Multi-Series Physiological Tracking Chart (All-in-One Graph)
// Blood Pressure (Red/Orange), Oxygen (Blue), Temperature (Green), Pulse (Purple), Weight (Teal)
// Unified multi-metric canvas for full physiological correlation & single-metric focused zoom

import React from 'react';
import { metricCopy, insightCopy, languageIndex } from '../voice/insightCopy';
import { metricColours, reportRows } from '../utils/reportInsights';
import { reportCopy } from '../voice/guidedReport';

export default function ReportHistoryChart({ data, field, language = 'en', bars = false }) {
  const rows = reportRows(data).slice(-12);
  const i = languageIndex(language);
  const w = reportCopy[language] || reportCopy.en;
  const v = insightCopy[language] || insightCopy.en;

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
  const chartH = 240;
  const plotLeft = 65;
  const plotRight = 810;
  const plotTop = 40;
  const plotBottom = 280;

  const x = (n) => rows.length <= 1 ? (plotLeft + plotRight) / 2 : plotLeft + (n * (plotRight - plotLeft)) / (rows.length - 1);
  const y = (val) => plotBottom - ((val - min) / Math.max(0.1, max - min)) * (plotBottom - plotTop);

  // Group bar sizing
  const barGroupWidth = 60;
  const activeKeyCount = keys.length;
  const barWidth = Math.max(6, Math.min(18, Math.floor((barGroupWidth - (activeKeyCount - 1) * 3) / activeKeyCount)));
  const barGap = 3;

  return (
    <figure className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all duration-300">
      {/* Header with Title and Unified Multi-Series Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
        <div>
          <figcaption className="text-xl font-extrabold text-slate-900 tracking-tight font-outfit">
            {v.chart}
          </figcaption>
          <p className="text-xs text-slate-500 mt-1">
            {bars ? 'Unified scan-by-scan comparative vitals distribution' : 'All-in-one longitudinal physiological trajectory'}
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
                className="flex items-center gap-1.5 rounded-full px-3 py-1 bg-slate-50 border shadow-xs"
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

      {/* Unified Single SVG Chart Canvas */}
      <div className="relative rounded-2xl bg-gradient-to-b from-slate-50/40 via-white to-slate-50/20 p-2 sm:p-4 border border-slate-100 overflow-hidden">
        <svg
          viewBox={`0 0 ${chartW} 330`}
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
            // Connect contiguous valid scans with lines
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
                    const clr = distinctColours[key] || metricColours[key] || '#64748b';
                    const bx = startX + kIdx * (barWidth + barGap);
                    const by = y(val);
                    const bh = Math.max(4, plotBottom - by);

                    return (
                      <rect
                        key={`bar-${key}-${r.scan}`}
                        x={bx}
                        y={by}
                        width={barWidth}
                        height={bh}
                        rx="4"
                        fill={clr}
                        className="transition-all duration-300 hover:brightness-110"
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
                    const cx = x(n);
                    const cy = y(val);

                    return (
                      <g key={`pt-${key}-${r.scan}`} className="cursor-pointer group">
                        <circle
                          cx={cx}
                          cy={cy}
                          r="6"
                          fill={clr}
                          stroke="#ffffff"
                          strokeWidth="2.5"
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
              y={plotBottom + 26}
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
              className="p-3 rounded-2xl border bg-slate-50/60 flex flex-col justify-between"
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
