import { weightGuidance } from './weightGuidance.js';
import { reportCopy, reportStage } from './guidedReport.js';
import { insightCopy, metricCopy, languageIndex } from './insightCopy.js';
import { personalizedReportCopy } from './personalizedReportCopy.js';
import { audioUnits, metricAudio, numberParts } from './reportAudio.js';
import { reportInsights, reportRows } from '../utils/reportInsights.js';
import { getScanCount } from '../utils/reportSnapshot.js';

const core = ['systolic', 'diastolic', 'oxygen', 'temperature', 'bpm', 'weight'];
const flagged = m => ['urgent', 'review', 'caution'].includes(m.status);
const valid = v => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v)) && Number(v) > 0;
export function displayedReportScore(data, calculated) {
  // No sample score, inferred age or inferred sex can become a person's result.
  if (!valid(data?.vitals?.height) || !valid(data?.vitals?.weight) || !valid(data?.patient?.age) || !['male','female','m','f'].includes(String(data?.patient?.gender).toLowerCase())) return null;
  return calculated !== null && calculated !== undefined && calculated !== '' && Number.isFinite(Number(calculated)) && Number(calculated) >= 0 && Number(calculated) <= 100 ? Number(calculated) : null;
}
export function personalizedActions(metrics, language) {
  const c = personalizedReportCopy[language] || personalizedReportCopy.en;
  const v = insightCopy[language] || insightCopy.en;
  if (metrics.some(m => m.status === 'urgent')) return [v.urgentAdvice];
  const actions = [];
  if (metrics.some(m => ['systolic', 'diastolic'].includes(m.key) && flagged(m))) actions.push(c.bp);
  for (const key of ['oxygen', 'bpm', 'temperature', 'bmi']) {
    const m = metrics.find(m => m.key === key);
    if (m && flagged(m)) actions.push(c[key === 'bpm' ? 'pulse' : key === 'bmi' ? (m.value < 18.5 ? 'bmiLow' : 'bmiHigh') : key]);
  }
  return actions;
}
export function buildPersonalizedReport({data = {}, page = 1, language = 'en', field = 'all', score = null, metricsOverride, intro, omitScore = false, overviewFields}) {
  language = ['en','hi','bn'].includes(language) ? language : 'en';
  const c = personalizedReportCopy[language], w = reportCopy[language], v = insightCopy[language], i = languageIndex(language);
  const metrics = metricsOverride || reportInsights(data), count = getScanCount(data);
  const messages = [intro || c.pages[page - 1], w.scan, ...numberParts(count, language)];
  const read = (m, explain = true) => explain ? metricAudio(m, language) : [metricCopy[m.key][0][i], c.today, ...(m.value === null ? [v.missing] : [...numberParts(m.value, language), audioUnits[language][m.unit]]), v[m.status]];
  if (page === 1) {
    const value = displayedReportScore(data, score);
    if (!omitScore) messages.push(c.score, ...(value === null ? [v.missing] : [...numberParts(value, language), c.scoreEnd]));
    messages.push(reportStage(data, language));
    if (intro !== c.estimates) messages.push(c.estimates);
    messages.push(...metrics.filter(m => overviewFields ? overviewFields.includes(m.key) : !['systolic','diastolic','oxygen','temperature','bpm'].includes(m.key)).flatMap(m => read(m)));
  } else if (page === 2) {
    const measured = metrics.filter(m => m.kind === 'measured');
    if (measured.some(m => m.status === 'urgent')) messages.push(v.urgentAdvice);
    messages.push(...measured.flatMap(m => read(m)));
    messages.push(...personalizedActions(measured, language).filter(text => text !== v.urgentAdvice));
  } else if (page === 3 || page === 4) {
    const selected = metrics.filter(m => field === 'all' ? core.includes(m.key) : m.key === field);
    // Only earlier scans are eligible. Never call today's row "previous".
    const prior = reportRows(data).filter(row => row.scan < count);
    messages.push(reportStage(data, language));
    for (const m of selected) {
      messages.push(...read(m, false));
      const available = prior.filter(row => valid(row[m.key]));
      const rows = page === 3 ? available.slice(-2) : available.slice(-1);
      if (!rows.length || m.value === null) { messages.push(c.noEarlier); continue; }
      for (const row of rows) messages.push(w.previous, w.scan, ...numberParts(row.scan, language), c.previous, ...numberParts(row[m.key], language), audioUnits[language][m.unit]);
      if (page === 4) {
        const difference = Number((m.value - Number(rows[0][m.key])).toFixed(2));
        messages.push(...(difference === 0 ? [c.same] : [difference > 0 ? c.higher : c.lower, ...numberParts(Math.abs(difference), language), audioUnits[language][m.unit]]));
      }
    }
  } else {
    const concerns = metrics.filter(flagged), good = metrics.filter(m => m.status === 'good');
    // Urgent action precedes a long list of numbers. Never reassure on an empty report.
    if (concerns.some(m => m.status === 'urgent')) messages.push(v.urgentAdvice);
    messages.push(...concerns.flatMap(m => read(m, false)));
    messages.push(...personalizedActions(metrics, language).filter(text => text !== v.urgentAdvice));
    if (good.length) messages.push(...good.flatMap(m => read(m, false)));
    if (!concerns.length) messages.push(good.length ? c.noFlags : c.noAssessment);
    if (metrics.some(m => m.kind === 'measured' && m.value === null)) messages.push(c.noAssessment);
    messages.push(c.next);
  }
  if (page===1 || page===5) messages.push(...weightGuidance(data, language));
  if(page===1)messages.push(...personalizedActions(metrics.filter(m=>m.key==='bmi'),language));
  return messages.filter(Boolean);
}
