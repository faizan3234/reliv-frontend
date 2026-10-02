import { reportCopy } from './guidedReport.js';
import { insightCopy, metricCopy, languageIndex } from './insightCopy.js';
export const audioUnits = {
 en: {cm:'centimetres',kg:'kilograms',mmHg:'millimetres of mercury',bpm:'beats per minute','%':'percent','°F':'degrees Fahrenheit','kg/m²':'kilograms per square metre','m²':'square metres','kcal/day':'kilocalories per day',L:'litres',point:'point'},
 hi: {cm:'सेंटीमीटर',kg:'किलो',mmHg:'मिलीमीटर मरकरी',bpm:'धड़कन प्रति मिनट','%':'प्रतिशत','°F':'डिग्री फारेनहाइट','kg/m²':'किलो प्रति वर्ग मीटर','m²':'वर्ग मीटर','kcal/day':'किलो कैलोरी प्रति दिन',L:'लीटर',point:'दशमलव'},
 bn: {cm:'সেন্টিমিটার',kg:'কিলো',mmHg:'মিলিমিটার মার্কারি',bpm:'বিট প্রতি মিনিট','%':'শতাংশ','°F':'ডিগ্রি ফারেনহাইট','kg/m²':'কিলো প্রতি বর্গ মিটার','m²':'বর্গ মিটার','kcal/day':'কিলো ক্যালোরি প্রতি দিন',L:'লিটার',point:'দশমিক'},
};
export function numberParts(value, language) {
 if(!Number.isFinite(Number(value)) || Number(value)<0) return [];
 const [integer,fraction]=String(value).split('.');
 return [...(Number(integer)<=240?[integer]:integer.split('')), ...(fraction?[audioUnits[language].point,...fraction.split('')]:[])];
}
export function metricAudio(metric, language) {
 const i=languageIndex(language),w=insightCopy[language],c=metricCopy[metric.key];
 return [c[0][i],...(metric.value===null?[w.missing]:[...numberParts(metric.value,language),audioUnits[language][c[2]]]),w[metric.kind],w[metric.status],c[1][i]];
}
export function reportAudioVocabulary(language) {
 const i=languageIndex(language);
 return [reportCopy[language].scan,reportCopy[language].previous,reportCopy[language].current,...Array.from({length:241},(_,n)=>String(n)),...Object.values(audioUnits[language]),...Object.values(insightCopy[language]),...Object.values(metricCopy).flatMap(c=>[c[0][i],c[1][i]])];
}
