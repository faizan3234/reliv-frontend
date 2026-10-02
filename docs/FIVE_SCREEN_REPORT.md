# Five-screen report and guided kiosk entry

## Behavior

All five paid report routes now have distinct content and Back/Next navigation:
1. Body overview, chronological age and metabolic age only when supplied by the authoritative report. Missing estimates are explicitly unavailable; no new metabolic-age formula or health score is invented.
2. Actual recorded measurements with localized names and spoken explanation.
3. Selectable history line graph, including one point on the first scan.
4. Per-metric comparison bars, including one bar on the first scan, plus previous/current/difference values. Missing observations remain gaps. No automatic good/bad diagnosis is inferred from a direction change.
5. Summary, next steps and what repeat measurements can and cannot tell the customer.

The report displays the latest seven privately linked scans with lifetime scan numbering. The backend companion fixes histories above 100 scans so the newest measurements stay in the returned window and total count remains accurate.

Entry uses large choice cards and a step at a time: name, age/gender, then one six-digit PIN entry. Returning customers use name then their existing PIN. Email and repeated PIN confirmation are removed. Age has no invented default. PIN instructions explicitly say to choose your own six numbers, not wait for a phone code. PIN remains protected by the existing backend hash and retry limits. Medicine-only entry does not create a health PIN. The existing authoritative service-selection step follows saved details.

## Audio and deployment

75 new MP3 files ship with the frontend. They cover five report explanations, first/repeat-visit guidance, name/PIN instructions, medicine guidance and the reason for paying for the report in English, Hindi and Bengali. These are generated speech recordings, not recordings of a clinician. Generation uses only fixed public text, never patient records, and runs at development time. The offline Pi needs only the deployed files to play them. It does not contact an online TTS service.

The speech provider waits for the recording manifest before selecting playback. A failed or silently stalled installed browser voice falls back to the local backend. One playback owner handles cancellation. Reports speak the page explanation, the scan-stage explanation, then the customer's measured data; later visits include more actual historical values on the graph pages. Listen repeats the page and Stop cancels it.

**Patient-specific spoken values still need a local language voice or the backend's espeak-ng engine.** The included fixed MP3 explanations do not synthesize arbitrary patient numbers. If neither local option works, explanations remain audible but the UI reports the number-reading failure. Do not interpret passing mocked audio tests as proof that the Pi's sound is working.

Deploy the current backend (including the local speech endpoint from backend PR #28), then the new frontend including `public/assets/audio` copied by Vite to `dist/assets/audio`. Deploy the companion history fix as well. Do not omit the MP3s or the updated manifest. Restart the manually running backend after backend changes. Preserve .env, SQLite data, payment secrets, admin credentials and existing media.

On the Pi, check `command -v espeak-ng`, `espeak-ng --voices=hi` and `espeak-ng --voices=bn`. Install the compatible engine/voice packages before offline use, or transfer the packages and dependencies from another machine. See OFFLINE_SPEECH_AND_DISPENSING.md for the local WAV endpoint and speaker test. Check Chromium/OS output device and mute separately. Automatic playback can still require a tap on Listen.

## Recovery

IdleReturn owns one inactivity policy: ordinary pages 2 minutes, reports 4 minutes, payment 10 minutes, then a visible 30-second warning. Continue retains the visit; expiry stops speech, clears in-memory patient data/session/profile access and returns to splash. Best-effort cancellation uses the existing endpoint for unpaid requests only; paid transaction and fulfillment records are not deleted. Phone advertising and admin pages are excluded. Pending physical medicine collection remains visible, since clearing it could hide an unresolved delivery.

Browser-level link/shortcut protection is not an operating-system lockdown. Deploy Chromium in kiosk mode for physical escape-key/window controls.

## Evidence and on-site checks

Frontend lint, build and the full test command passed. Report tests cover 60 interactions including direct routes, first/seventh-scan graphs, missing data, language selection, recorded playback without the speech engine and payment authorization. Speech tests cover 21 checks including broken browser voice fallback and cancellation. Idle tests cover 9 checks including private cleanup and payment/dispense exclusions. All 75 new MP3s decode through ffmpeg without errors.

Actual Pi speaker output, touchscreen layout, local microphone recognition, physical ESP32 dispensing and real payment remain on-site checks. Test each language with speakers, advance/back while speaking, repeat Listen, change language, leave an unpaid visit idle, and verify that another visitor cannot see previous private data.
