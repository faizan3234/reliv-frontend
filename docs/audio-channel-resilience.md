# Audio channel regression fixes

Cancellation previously cleared the active Audio reference before stopActivePlayback could pause the element. A cancelled clip could therefore continue over the next page. Finalization now pauses its own element, and browser SpeechSynthesis fallback also releases HTML audio first.

Report audio unlock reuses one AudioContext, handles rejected resume promises and closes the context at provider teardown. Non-finite volume values are ignored; valid volume changes apply to active HTML audio.

`tests/speech-channel-browser.jsx` reproduces replacement, fallback, stop, repeated unlock, invalid volume and provider unmount with controlled media engines. It is part of npm test. The full suite covers report autoplay, review mode, idle ads, payment identity, measurement and offline voice behavior. These are browser-environment mocks, not acoustic verification of Pi speakers or real phone autoplay policies.

Validation: full npm test; lint with zero errors/warnings; kiosk production build; customer-web production build. Kiosk build still reports an outdated Browserslist dataset advisory. No layout redesign or medical calculation changes are included in this frontend PR.
