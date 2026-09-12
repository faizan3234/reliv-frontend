import { containsPhrase, normalizeVoiceText } from './voicePageProfiles.js';

// This only opens the keypad; the backend still verifies payment.
export function parsePaymentVoice(raw) {
  const text = normalizeVoiceText(raw);
  if (containsPhrase(text, ['no', 'not', 'nahi', 'nahin', 'nhi', 'problem', 'cannot', 'cant', "can't", 'failed', 'नहीं', 'না', 'হয়নি', 'হয়নি'])) return 'problem';
  if (containsPhrase(text, ['scan', 'scanned']) && containsPhrase(text, ['done', 'gaya', 'yes', 'haan'])) return 'scanned';
  if (containsPhrase(text, ['code', 'keypad', 'paid', 'done', 'ho gaya', 'yes', 'haan', 'ha', 'ji', 'হ্যাঁ', 'হয়ে গেছে', 'হয়েছে', 'हाँ', 'हां', 'हो गया', 'কোড', 'कोड'])) return 'code';
  return null;
}
