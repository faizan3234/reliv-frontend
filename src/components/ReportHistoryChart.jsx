import { useState } from 'react';
import { metricCopy, languageIndex } from '../voice/insightCopy';
import { metricColours, reportRows } from '../utils/reportInsights';
import { reportCopy } from '../voice/guidedReport';
import { positiveReading } from '../utils/reportPresentation';

const overviewKeys = ['systolic', 'diastolic', 'oxygen', 'temperature', 'bpm', 'weight'];

function MeasurementChart({ rows, field, language, bars }) {
  const [selectedScan, setSelectedScan] = useState(null);
  const w = reportCopy[language] || reportCopy.en;
  const copy = metricCopy[field];
  const label = copy[0][languageIndex(language)];
  const unit = copy[2];
  const colour = metricColours[field] || '#bf480c';
  const values = rows.map(row => positiveReading(row[field]));
  const available = values.filter(value => value !== null);
  const latest = values.at(-1) ?? null;
  const selectedIndex = rows.findIndex(row => row.scan === selectedScan);
  const index = selectedIndex >= 0 ? selectedIndex : rows.length - 1;
  const selected = values[index] ?? null;
  const previous = index > 0 ? values[index - 1] : null;
  const difference = selected !== null && previous !== null ? Number((selected - previous).toFixed(1)) : null;
  const low = available.length ? Math.min(...available) : 0;
  const high = available.length ? Math.max(...available) : 1;
  const padding = Math.max((high - low) * .2, high * .04, 1);
  const min = bars ? 0 : Math.max(0, low - padding);
  const max = Math.max(min + 1, high + padding);
  const left = 48, right = 444, top = 30, bottom = 202;
  const x = n => left + (n + .5) * (right - left) / Math.max(rows.length, 1);
  const y = value => bottom - (value - min) / (max - min) * (bottom - top);
  const barWidth = Math.min(34, (right - left) / Math.max(rows.length, 1) * .48);
  const select = (event, scan) => {
    if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
    if (event.type === 'keydown') event.preventDefault();
    setSelectedScan(scan);
  };
  return <figure className="report-card report-chart" data-chart-field={field}>
    <div className="report-chart-head">
      <div><figcaption>{label}</figcaption><p className="report-muted">{w.current}</p></div>
      <span className="report-badge">{unit}</span>
    </div>
    <div className="report-chart-value">{latest ?? '—'} <small>{latest === null ? w.missing : unit}</small></div>
    {available.length ? <svg viewBox="0 0 468 242" role="group" aria-label={`${label} · ${w.chart} · ${unit}`}>
      {[0, .5, 1].map(fraction => {
        const value = min + fraction * (max - min);
        const cy = y(value);
        return <g key={fraction} aria-hidden="true"><line x1={left} x2={right} y1={cy} y2={cy} stroke="#e8e8ed" strokeDasharray="3 5"/><text x={left-9} y={cy+4} textAnchor="end" fill="#6e6e76" fontSize="12">{Number(value.toFixed(1))}</text></g>;
      })}
      {!bars && rows.map((row,n) => n > 0 && values[n] !== null && values[n-1] !== null
        ? <line key={row.scan} x1={x(n-1)} x2={x(n)} y1={y(values[n-1])} y2={y(values[n])} stroke={colour} strokeWidth="3" strokeLinecap="round"/> : null)}
      {rows.map((row,n) => <g key={row.scan}>
        {values[n] !== null && <g tabIndex={0} role="button" aria-label={`${w.scan} ${row.scan}: ${values[n]} ${unit}`} aria-pressed={row.scan === rows[index]?.scan}
          onClick={event => select(event,row.scan)} onKeyDown={event => select(event,row.scan)} style={{cursor:'pointer'}}>
          <title>{w.scan} {row.scan}: {values[n]} {unit}</title>
          {bars ? <rect data-reading="bar" x={x(n)-barWidth/2} y={y(values[n])} width={barWidth} height={bottom-y(values[n])} rx="6" fill={colour} opacity={row.scan === rows[index]?.scan ? 1 : .5}/>
            : <circle data-reading="point" cx={x(n)} cy={y(values[n])} r={row.scan === rows[index]?.scan ? 6 : 5} fill={colour} stroke="white" strokeWidth="2"/>}
          <path d={`M ${x(n)-22} ${bars ? top : y(values[n])-22} h 44 v ${bars ? bottom-top : 44} h -44 Z`} fill="transparent"/>
        </g>}
        <text x={x(n)} y="228" textAnchor="middle" fill="#62626a" fontSize="13">{row.scan}</text>
      </g>)}
    </svg> : <div className="report-note">{w.missing}</div>}
    <p className="report-muted">{w.scan} · {unit}</p>
    <div className="report-chart-detail" aria-live="polite">
      <strong>{w.scan} {rows[index]?.scan}: {selected ?? w.missing} {selected !== null ? unit : ''}</strong><br/>
      {difference === null ? w.none : `${w.previous}: ${previous} ${unit} · ${w.difference}: ${difference > 0 ? '+' : ''}${difference} ${unit}`}
    </div>
    <p className="report-muted" style={{marginTop:12}}>{w.privacy}</p>
  </figure>;
}

export default function ReportHistoryChart({ data, field, language = 'en', bars = false }) {
  const rows = reportRows(data).slice(-7);
  const keys = field === 'all' ? overviewKeys : [field];
  return <div className={keys.length > 1 ? 'report-grid' : ''}>
    {keys.filter(key => metricCopy[key]).map(key => <MeasurementChart key={`${key}-${bars}`} rows={rows} field={key} language={language} bars={bars}/>) }
  </div>;
}
