# Touch operation with optional voice help

Names, ages, gender, language, service selection, and payment codes are entered
by touch. Speech never fills these fields, accepts terms, chooses a service,
submits a form, starts a measurement, or authorizes payment.

| Situation | Behavior |
| --- | --- |
| Customer asks what to do | Instructions for the current screen in the selected English, Hindi, or Bengali language. |
| Name keyboard closes | Guide asks the customer to select gender and check age. |
| Four seconds without touch, typing, or scrolling | One relevant reminder. A second is allowed after at least 30 seconds; then the assistant waits for interaction. |
| Speech or recognition is in progress | Automatic reminders wait. Mic frames are suppressed while the assistant speaks, with an acoustic tail. |
| Measurement is running | No automatic reminder that would interrupt the measurement. Explicit help gives the current measurement instruction. |
| Payment QR becomes ready | Explain phone internet, scan, payment, return, and code entry. Ask whether payment is complete after seven quiet seconds following guidance. |
| Payment answer is no | Explain the QR steps again. Ask again after seven quiet seconds. |
| Payment answer is yes | Open the keypad. Explain code recovery through the same QR and caution against paying again. |
| Payment is preparing/verifying, expired, locked, or complete | Ignore yes/no as actions. Help describes the visible wait/recovery/completion state. |
| Code-entry screen | Code is entered by touch. Help explains the keypad and same-QR recovery. |
| Unrecognized or unrelated speech | No action, no form change, no retry-apology loop. |
| Mic is disconnected | Touch operation and speaker guidance continue. |
| Admin or phone routes | Kiosk mic commands and automatic guidance are disabled. |

The payment-specific seven-second timer replaces the general four-second timer
while the QR is waiting. Neither timer cuts off a spoken prompt. The backend
still validates the four-digit code and actual payment state; a spoken yes is
not proof of payment. Reopening a QR alone does not debit money.

## Recorded audio

The bundle includes 105 required static guidance recordings across the three
languages. Voices are Neerja (English), Swara (Hindi), and Tanishaa (Bengali), all
female. The files are served locally from `public/assets/audio`; kiosk playback
does not require an online speech service. Existing report/custom prompts retain
their recording or browser-speech fallback. Custom speech without a bundled
recording still depends on the installed local browser voices.

To regenerate changed guidance at development/build time (internet needed here):

```bash
python3 -m venv .tts-venv
.tts-venv/bin/python -m pip install edge-tts
RELIV_TTS_PYTHON="$PWD/.tts-venv/bin/python" node scripts/generate_guidance_audio.mjs
npm run build
```

The generator preserves the existing manifest, passes text without a shell,
checks output, and publishes the manifest only after all recordings succeed.
Deploy the rebuilt frontend including its audio assets, deploy the backend voice
changes, and restart the existing `reliv-voice.service`. No Pi system configuration
is changed by these commits.

## Validation and physical acceptance

Automated checks cover multilingual intent/negation, touch entry and service
selection, speaker gating, reminder timing, stale replies, duplicate payment
submissions, recovery, route rendering, microphone selection, sample conversion,
partial audio, and disconnect cleanup. These use synthetic services and mocked
microphone hardware; they do not certify live payments or the physical Pi.

On the actual kiosk, check each language: enter details by touch; pause to hear
guidance; ask for help; say an unrelated name/service and confirm no action; wait
for the payment question; answer no, then yes; verify that only an actual valid
code completes payment. Re-scan the same paid request to recover its code without
paying again. Confirm the assistant's own playback never produces a reply. Unplug
and reconnect the mic while keeping touch navigation available. Check the browser
console and the voice-service journal for device errors.
