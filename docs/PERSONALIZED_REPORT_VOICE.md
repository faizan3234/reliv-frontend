# Personalized offline report narration

The report uses a local rules-based narrator, not an online chatbot. Generic female recordings are selected and joined with numbers from the currently authorized report. No patient name, reading or history is sent to the build-time voice service. Generic explanations repeat where appropriate; patient results and the selected advice are dynamic.

## Actual routed report pages

`KioskApp` routes to `ReferenceReports` and Report1–5. Their existing `useReportNarration` hook automatically starts after entry and cancels on unmount. Replay and language changes call the same narrator. The alternate `UnifiedReport` is also aligned and its disabled autoplay is restored.

1. Body overview: the very same `bodyScoreData.score` displayed by Report1 is spoken, labelled an estimate. Missing input never becomes a sample score. This PR does not clinically validate the existing score formula.
2. Body composition: actual available estimates and meanings, using the visible report's existing formulas. No diagnosis of hydration from a water estimate.
3. Vitals: actual BP, oxygen, pulse, temperature and recorded dimensions, with status and applicable recheck instructions. Urgent guidance comes first.
4. History: today's readings versus the latest available earlier matching scan, with exact increase/decrease and units. Missing history cannot become a made-up comparison. An increase is not automatically called improvement.
5. Summary: flagged readings and their relevant next steps, followed by readings within reference. Incomplete or age-inapplicable data cannot produce an all-clear. The lower Read Aloud button uses the selected language and the same offline narration.

The metric explanation buttons now use this same bundled data-based path. Unsupported explanations announce their limitation instead of using the old blanket claims of excellent health. Some existing legacy visual cards/formulas remain outside this voice change; this PR does not validate the 120-parameter catalogue or metabolic-age/visceral-fat estimates.

## Voice assets

`personalizedReportCopy.js` contains conversational English/Hindi/Bengali generic phrases. Recordings use the established en-IN-NeerjaNeural, hi-IN-SwaraNeural and bn-IN-TanishaaNeural female voices. Existing numeric clips are reused; no runtime internet, model download or browser-installed language voice is required. Phrase boundaries can be audible; this is not unrestricted generated conversation or a promise of indistinguishable human speech.

Regenerate at build time only with `RELIV_TTS_PYTHON=/path/to/python node scripts/generate_personalized_audio.mjs` (`edge-tts` required). Deploy the complete `public/assets/audio` folder and matching manifest. Never regenerate or download voices on the offline Pi. No backend change is required.

## Guidance references

- BP positioning/recheck: https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings/monitoring-your-blood-pressure-at-home
- Oxygen measurement limitations: https://medlineplus.gov/lab-tests/pulse-oximetry/

Existing report status thresholds are reused. No medication, supplement or fluid dose is prescribed by the narrator. Translations, accent preference, real Pi speaker output and hardware measurement quality require on-site review.

## Verification

Tests cover five distinct page narrations, changed readings/score, missing data, matching historical records, directional changes, priority advice, all three languages and local-asset coverage. Routed-page browser tests exercise automatic playback for scan counts 1, 4, 6 and 7 without runtime TTS, alongside replay/cancellation regression tests. Physical speaker audibility cannot be established in a container.
