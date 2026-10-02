// src/components/ReportHistoryChart.jsx
// Premium Multi-Series Physiological Tracking Chart
// Red (Blood Pressure), Blue (Oxygen), Green (Temperature), Purple (Pulse), Teal (Weight)
// Supports multi-metric concurrent overview & single-metric focused isolation

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
    systolic: '#dc2626',    // Vibrant Red (BP Systolic)
    diastolic: '#ea580c',   // Orange-Red (BP Diastolic)
    oxygen: '#2563eb',      // Ocean Blue (Oxygen)
    temperature: '#16a34a', // Emerald Green (Temperature)
    bpm: '#9333ea',         // Royal Purple (Pulse)
    weight: '#0891b2',      // Cyan/Teal (Weight)
    bmi: '#c026d3',
    bodyFat: '#d97706',
    bodyWater: '#0284c7',
    restingEnergy: '#7c3aed',
  };

  return (
    <figure className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
        <div>
          <figcaption className="text-xl font-bold text-slate-900 tracking-tight">
            {v.chart}
          </figcaption>
          <p className="text-xs text-slate-500 mt-0.5">
            {bars ? 'Comparative scan-by-scan bar distribution' : 'Longitudinal physiological trend trajectory'}
          </p>
        </div>

        {/* Multi-series Visual Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-red-50 text-red-700 border border-red-200">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block shadow-sm"></span>
            BP (Red)
          </span>
          <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block shadow-sm"></span>
            Oxygen (Blue)
          </span>
          <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block shadow-sm"></span>
            Temp (Green)
          </span>
          <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block shadow-sm"></span>
            Pulse (Purple)
          </span>
          <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-cyan-50 text-cyan-700 border border-cyan-200">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 inline-block shadow-sm"></span>
            Weight (Teal)
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {keys.map((key) => {
          const valid = rows.filter((r) => Number(r[key]) > 0);
          const c = metricCopy[key] || [[key, key, key], ['Metric'], ''];
          const colour = distinctColours[key] || metricColours[key] || '#0f766e';

          if (!valid.length) {
            return (
              <div key={key} className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-5 text-sm text-slate-500 text-center">
                <span className="font-semibold text-slate-700">{c[0][i]}</span> · {w.missing}
              </div>
            );
          }

          const rawValues = valid.map((r) => Number(r[key]));
          const minVal = Math.min(...rawValues);
          const maxVal = Math.max(...rawValues);
          const min = bars ? 0 : Math.max(0, minVal * 0.9);
          const max = maxVal === minVal ? maxVal * 1.2 : maxVal * 1.1;

          const x = (n) => 80 + (n * 680) / Math.max(1, rows.length - 1);
          const y = (val) => 138 - ((val - min) / Math.max(0.1, max - min)) * 100;
          const currentVal = rawValues[rawValues.length - 1];

          return (
            <div
              key={key}
              className="rounded-2xl border bg-gradient-to-b from-white to-slate-50/50 p-4 transition-all hover:shadow-sm"
              style={{ borderColor: `${colour}25` }}
            >
              {/* Metric Card Header */}
              <div className="flex items-center justify-between pb-2 mb-1 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: colour }}></span>
                  <span className="font-bold text-base text-slate-800 tracking-tight">{c[0][i]}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {c[2]}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-500">Latest:</span>
                  <span className="font-extrabold text-sm" style={{ color: colour }}>
                    {currentVal} {c[2]}
                  </span>
                </div>
              </div>

              {/* Chart SVG */}
              <svg
                viewBox="0 0 850 175"
                className="w-full select-none"
                role="img"
                aria-label={`${c[0][i]}: ${valid.map((r) => `${w.scan} ${r.scan}: ${r[key]} ${c[2]}`).join(', ')}`}
              >
                <defs>
                  <linearGradient id={`grad-${key}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={colour} stopOpacity="0.18" />
                    <stop offset="100%" stopColor={colour} stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal reference gridlines & scale values */}
                {[0, 0.5, 1].map((f) => (
                  <g key={f}>
                    <line
                      x1="60"
                      y1={138 - f * 100}
                      x2="790"
                      y2={138 - f * 100}
                      stroke="#e2e8f0"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x="50"
                      y={143 - f * 100}
                      textAnchor="end"
                      fontSize="12"
                      fontWeight="500"
                      fill="#94a3b8"
                    >
                      {Number((min + f * (max - min)).toFixed(1))}
                    </text>
                  </g>
                ))}

                {/* Area under curve for lines */}
                {!bars && valid.length > 1 && (
                  <path
                    d={`M ${x(rows.findIndex((r) => Number(r[key]) > 0))} 138 ` +
                      rows.map((r, n) => (Number(r[key]) > 0 ? `L ${x(n)} ${y(r[key])}` : '')).join(' ') +
                      ` L ${x(rows.findLastIndex((r) => Number(r[key]) > 0))} 138 Z`}
                    fill={`url(#grad-${key})`}
                  />
                )}

                {/* Bars or Line with Circles */}
                {rows.map((r, n) =>
                  Number(r[key]) > 0 ? (
                    <g key={r.scan} className="group">
                      {bars ? (
                        <rect
                          x={x(n) - 18}
                          y={y(r[key])}
                          width="36"
                          height={Math.max(4, 138 - y(r[key]))}
                          rx="6"
                          fill={colour}
                          className="transition-all duration-300 hover:brightness-110"
                        />
                      ) : (
                        <>
                          {n > 0 && Number(rows[n - 1][key]) > 0 && (
                            <line
                              x1={x(n - 1)}
                              y1={y(rows[n - 1][key])}
                              x2={x(n)}
                              y2={y(r[key])}
                              stroke={colour}
                              strokeWidth="3.5"
                              strokeLinecap="round"
                            />
                          )}
                          <circle
                            cx={x(n)}
                            cy={y(r[key])}
                            r="6"
                            fill={colour}
                            stroke="#ffffff"
                            strokeWidth="2.5"
                            className="shadow-sm"
                          />
                        </>
                      )}

                      {/* Value tag above point/bar */}
                      <text
                        x={x(n)}
                        y={y(r[key]) - 12}
                        textAnchor="middle"
                        fontSize="14"
                        fontWeight="700"
                        fill="#0f172a"
                      >
                        {r[key]}
                      </text>

                      {/* X-Axis Scan Label */}
                      <text
                        x={x(n)}
                        y="163"
                        textAnchor="middle"
                        fontSize="13"
                        fontWeight="600"
                        fill="#64748b"
                      >
                        {w.scan} {r.scan}
                      </text>
                    </g>
                  ) : (
                    <text
                      key={r.scan}
                      x={x(n)}
                      y="163"
                      textAnchor="middle"
                      fontSize="12"
                      fill="#cbd5e1"
                    >
                      {r.scan}: —
                    </text>
                  )
                )}
              </svg>
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
