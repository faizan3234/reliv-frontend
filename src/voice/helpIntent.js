import { containsPhrase, normalizeVoiceText } from './voicePageProfiles.js';

export const HELP_HINTS = [
  'what do I do now', 'how do I do it', 'what is the next step', 'help me', 'guide me',
  'ab kya karna hai', 'kaise karna hai', 'ki korbo', 'ki bhabe korbo',
  'अब क्या करना है', 'कैसे करना है', 'मदद कीजिए', 'কি করবো', 'কীভাবে করব', 'সাহায্য করুন',
];

const HELP_PHRASES = [
  ...HELP_HINTS, 'what now', 'what next', 'what to do', 'what do i do', 'what should i do',
  'what i need to do', 'how to do', 'how do i', 'how can i', 'how does this work',
  'next step', 'next process', 'help', 'guide', 'guidance', 'i am stuck', 'i m stuck',
  'i dont understand', 'i don t understand', 'i cannot see', 'i can t see',
  'code nahi mila', 'code nahi mil raha', 'code kothay', 'code pai ni', 'कोड नहीं', 'কোড পাইনি', 'where is the', 'where do i', 'ab kya', 'aage kya', 'age kya', 'kya karu', 'kya karun',
  'kya karoon', 'kya kare', 'kya karna', 'kya krna', 'kya kru', 'kaise karu', 'kaise kru',
  'kaise karna', 'kaise kare', 'samajh nahi', 'samjh nahi', 'samajh nhi', 'pata nahi',
  'pata nhi', 'madad', 'bataiye', 'batao', 'ki korbo', 'ki korob', 'ki korte',
  'ki bhabe', 'kibhabe', 'ki kerom', 'kemon kore', 'ki kore', 'bujhte parchi na',
  'bujhchi na', 'sahajyo', 'sahajjo', 'sahayata', 'gyuide me',
  'क्या करूं', 'क्या करूँ', 'क्या करें', 'क्या करना', 'कैसे करूं', 'कैसे करूँ', 'कैसे करना',
  'कैसे करें', 'अब क्या', 'आगे क्या', 'समझ नहीं', 'पता नहीं', 'मदद', 'बताइए',
  'कि करबो', 'কি করবো', 'কি করব', 'কী করব', 'কী করবো', 'কি করতে', 'কী করতে',
  'কি ভাবে', 'কী ভাবে', 'কীভাবে', 'কিভাবে', 'কি রকম', 'কেমন করে', 'কি করে',
  'এবার কি', 'এবার কী', 'এখন কি', 'এখন কী', 'বুঝতে পারছি না', 'সাহায্য',
];

export function isHelpRequest(raw) {
  const text = normalizeVoiceText(raw).replace(/([a-z])\1{2,}/g, '$1');
  if (!text || containsPhrase(text, ['no help', 'dont help', 'don t help', 'do not help',
    'help nahi chahiye', 'मदद नहीं चाहिए', 'সাহায্য লাগবে না'])) return false;
  return containsPhrase(text, HELP_PHRASES);
}
