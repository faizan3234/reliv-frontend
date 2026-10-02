// src/voice/voiceNarrationArchive.js
// ARCHIVED: Full Voice Narration Engine & Multi-lingual Report Audio Scripts
// Saved for future kiosk voice guidance activation or remote audio streaming.
// Contains complete narration generators for Page 1-5, multi-lingual audio mappings,
// and historical scan speech synthesizers in English, Hindi, and Bengali.

import { reportCopy, reportStage } from './guidedReport';
import { insightCopy, metricCopy, languageIndex } from './insightCopy';
import { metricAudio, numberParts } from './reportAudio';
import { reportInsights, summaryAdvice } from '../utils/reportInsights';

/**
 * Generate complete spoken narration script for any report page.
 * @param {Object} data - Health context data object
 * @param {number} page - Report page number (1 to 5)
 * @param {string} language - ISO language code ('en' | 'hi' | 'bn')
 * @param {string} [field='all'] - Selected metric filter
 * @returns {{ messages: string[], narration: string }}
 */
export function compileReportNarration(data, page, language = 'en', field = 'all') {
  const w = reportCopy[language] || reportCopy.en;
  const v = insightCopy[language] || insightCopy.en;
  const i = languageIndex(language);

  const metrics = reportInsights(data);
  const stage = reportStage(data, language);
  const rows = (data.history || []).slice(-12);
  const advice = summaryAdvice(metrics);

  const visible = page === 1
    ? metrics.filter((m) => !['systolic', 'diastolic', 'oxygen', 'temperature', 'bpm'].includes(m.key))
    : page === 2
    ? metrics.filter((m) => m.kind === 'measured')
    : metrics.filter((m) => m.status !== 'neutral');

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

  return {
    messages,
    narration: messages.join(' ')
  };
}

/**
 * Pre-recorded audio clip manifest reference.
 */
export const ARCHIVED_AUDIO_PATHS = {
  en: '/assets/audio/en/',
  hi: '/assets/audio/hi/',
  bn: '/assets/audio/bn/'
};

export default compileReportNarration;
