// Data for the 1080 × 1920 Instagram Story card shown under the paid kiosk code.
// Only verified report scores are shown; a missing score is displayed as —.
// A second person’s name never implies access to their health report.

export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;

export const STORY_DESIGNS = {
  solo: {
    label: 'Individual',
    headlineTop: "MY TODAY'S",
    belongs: 'This check belongs to:',
    tagline: 'Better habits for me. ♡',
    scoresTitle: 'My Health Score',
    focusTitle: 'My Next Focus',
    quote: 'Same me, a healthier tomorrow. ♡',
    noteLeft: 'Today I chose\nmy health. ♡',
    noteRight: 'Little steps.\nReal change. ♡',
    hashtag: '#MyRelivCheck',
  },
  friends: {
    label: 'Friends',
    headlineTop: "OUR TODAY'S",
    belongs: 'This check belongs to us:',
    tagline: 'Healthier together. ♡',
    scoresTitle: 'Health Score',
    focusTitle: 'Our Next Focus',
    quote: 'Same goals, brighter days together. ♡',
    noteLeft: 'Friends who\ncheck in, glow up. ♡',
    noteRight: 'Healthy friends,\nhappier lives. ♡',
    hashtag: '#RelivFriends',
  },
  couple: {
    label: 'Couple',
    headlineTop: "OUR TODAY'S",
    belongs: 'This check belongs to us:',
    tagline: 'Better habits together. ♡',
    scoresTitle: 'Health Score',
    focusTitle: 'Our Next Focus',
    quote: 'Same journey, healthier together. ♡',
    noteLeft: 'A healthier\nus starts here ♡',
    noteRight: 'Little steps.\nBig love. ♡',
    hashtag: '#RelivTogether',
  },
};

const clean = (value, max) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '');

export function validScore(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100 ? Math.round(value) : null;
}

// Score band wording describes the score only; it is not a diagnosis.
export function scoreStatus(score) {
  if (score === null) return null;
  if (score >= 85) return { text: 'Excellent overall wellness', tone: 'great' };
  if (score >= 70) return { text: 'Good overall wellness', tone: 'good' };
  if (score >= 50) return { text: 'Fair — room to grow', tone: 'fair' };
  return { text: 'Starting point — small steps count', tone: 'low' };
}

export function buildStoryCard({ design = 'solo', name = '', partner = '', note = '' }, summary) {
  const copy = STORY_DESIGNS[design] || STORY_DESIGNS.solo;
  const solo = design === 'solo' || !STORY_DESIGNS[design];
  const score = validScore(summary?.score);
  return {
    design: STORY_DESIGNS[design] ? design : 'solo',
    copy,
    name: clean(name, 30),
    // The partner's own report is never linked here, so only their name is shown.
    partner: solo ? '' : clean(partner, 30),
    score,
    status: scoreStatus(score),
    win: clean(summary?.win, 120),
    focus: clean(summary?.focus, 120),
    // A blank note falls back to the design's original quote.
    quote: clean(note, 100) || copy.quote,
  };
}
