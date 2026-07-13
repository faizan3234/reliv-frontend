import { useState, useEffect, useRef } from "react";

/* ─── FONTS ─────────────────────────────────────────────── */
const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,700&family=Bebas+Neue&family=Dancing+Script:wght@700&display=swap');
`;

/* ─── GLOBAL CSS ─────────────────────────────────────────── */
const CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --or:   #F4610A;
  --orm:  #F97316;
  --orl:  #FB923C;
  --orp:  #FED7AA;
  --orf:  #FFF7ED;
  --wh:   #FFFFFF;
  --ow:   #FFFBF7;
  --dk:   #1C0D00;
  --g3:   #8C7B6E;
  --g1:   #E8DDD5;
  /* Instagram brand gradient */
  --ig1: #f09433; --ig2: #e6683c; --ig3: #dc2743; --ig4: #cc2366; --ig5: #bc1888;
}
body {
  font-family: 'DM Sans', sans-serif;
  background: var(--ow);
  color: var(--dk);
  min-height: 100vh;
  overflow-x: hidden;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
button { font-family: 'DM Sans', sans-serif; cursor: pointer; border: none; }
input, textarea { font-family: 'DM Sans', sans-serif; }

/* ── MESH BG ── */
.mesh {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background:
    radial-gradient(ellipse 600px 500px at 110% -5%,  rgba(249,115,22,.18) 0%, transparent 60%),
    radial-gradient(ellipse 400px 400px at -5% 105%,  rgba(251,146,60,.13) 0%, transparent 60%),
    var(--ow);
}
.grid-lines {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  opacity: .035;
  background-image: linear-gradient(var(--or) 1px,transparent 1px),
                    linear-gradient(90deg,var(--or) 1px,transparent 1px);
  background-size: 56px 56px;
}

/* ── NAV ── */
.nav {
  position: relative; z-index: 20;
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 36px;
  background: rgba(255,255,255,.8);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(244,97,10,.1);
}
.nav-logo {
  font-family: 'Playfair Display', serif;
  font-size: 26px; font-weight: 900; color: var(--dk);
}
.nav-logo span { color: var(--or); }
.nav-price {
  display: flex; align-items: center; gap: 10px;
}
.nav-rs {
  background: linear-gradient(135deg,var(--or),var(--orl));
  color: #fff; font-size: 20px; font-weight: 700;
  padding: 8px 22px; border-radius: 50px;
  box-shadow: 0 4px 20px rgba(244,97,10,.35);
  animation: priceGlow 2.5s ease-in-out infinite;
}
@keyframes priceGlow {
  0%,100% { box-shadow: 0 4px 20px rgba(244,97,10,.35); }
  50%      { box-shadow: 0 4px 32px rgba(244,97,10,.6); }
}
.nav-live {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600; color: var(--or);
  background: var(--orf); border: 1px solid var(--orp);
  padding: 7px 14px; border-radius: 50px;
}
.ldot { width: 7px; height: 7px; background: var(--or); border-radius: 50%; animation: blink 1s infinite; }
@keyframes blink { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(.8)} }

/* ── ATTRACT SCREEN ── */
.attract { position: relative; z-index: 1; }

.attract-hero {
  text-align: center;
  padding: 52px 24px 40px;
  max-width: 900px;
  margin: 0 auto;
}
.attract-eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  background: #fff; border: 1.5px solid var(--orp); border-radius: 50px;
  padding: 9px 22px; font-size: 14px; font-weight: 600; color: var(--or);
  text-transform: uppercase; letter-spacing: .08em;
  margin-bottom: 32px;
  box-shadow: 0 4px 16px rgba(244,97,10,.12);
}
.attract-h1 {
  font-family: 'Playfair Display', serif;
  font-size: clamp(56px,9vw,110px);
  font-weight: 900; line-height: .9; color: var(--dk);
  margin-bottom: 24px;
  animation: fadeUp .7s ease both;
}
.attract-h1 em {
  font-style: italic;
  background: linear-gradient(135deg,var(--or) 0%,var(--orl) 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.attract-sub {
  font-size: clamp(16px,2.5vw,22px);
  color: var(--g3); font-weight: 300; line-height: 1.6;
  max-width: 520px; margin: 0 auto 48px;
  animation: fadeUp .7s ease .15s both;
}

@keyframes fadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:none} }

/* Value props */
.vprops {
  display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;
  margin-bottom: 48px;
  animation: fadeUp .7s ease .25s both;
}
.vprop {
  display: flex; align-items: center; gap: 8px;
  background: #fff; border: 1px solid var(--orp); border-radius: 50px;
  padding: 10px 20px; font-size: 14px; font-weight: 500; color: var(--dk);
  box-shadow: 0 3px 12px rgba(244,97,10,.08);
}
.vprop-icon { font-size: 18px; }

/* CTA */
.cta-btn {
  display: block;
  background: linear-gradient(135deg,var(--or) 0%,var(--orl) 100%);
  color: #fff; font-size: 28px; font-weight: 700;
  padding: 26px 64px; border-radius: 24px;
  box-shadow: 0 12px 48px rgba(244,97,10,.45);
  margin: 0 auto 24px;
  letter-spacing: .02em;
  transition: transform .2s, box-shadow .2s;
  position: relative; overflow: hidden;
  animation: fadeUp .7s ease .35s both;
  -webkit-tap-highlight-color: transparent;
}
.cta-btn::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(180deg,rgba(255,255,255,.15) 0%,transparent 50%);
}
.cta-btn:active { transform: scale(.97); box-shadow: 0 6px 24px rgba(244,97,10,.4); }
.cta-price {
  display: block; font-size: 16px; font-weight: 400; opacity: .85; margin-top: 4px;
}

/* Live counter */
.live-ticker {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  font-size: 14px; color: var(--g3);
  animation: fadeUp .7s ease .45s both;
  margin-bottom: 64px;
}
.ticker-num { font-weight: 700; color: var(--or); font-size: 16px; }

/* ── CURRENT SHOUTOUTS DISPLAY ── */
.board-section { padding: 0 24px 80px; max-width: 1000px; margin: 0 auto; position: relative; z-index: 1; }
.board-title {
  text-align: center;
  font-family: 'Playfair Display', serif;
  font-size: 28px; font-weight: 700; color: var(--dk);
  margin-bottom: 8px;
}
.board-sub { text-align: center; font-size: 14px; color: var(--g3); margin-bottom: 32px; }

.board-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

/* Mini shoutout preview cards */
.mini-card {
  background: #fff; border-radius: 20px; overflow: hidden;
  border: 1px solid var(--orp);
  box-shadow: 0 8px 32px rgba(244,97,10,.1);
  animation: fadeUp .5s ease both;
}
.mini-card-ig { border-top: 4px solid; border-image: linear-gradient(90deg,#f09433,#dc2743,#bc1888) 1; }
.mini-card-bd { border-top: 4px solid var(--or); }
.mini-card-st { border-top: 4px solid var(--or); }

.mini-head {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px 10px;
}
.mini-avi {
  width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg,var(--or),var(--orl));
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 15px; color: #fff;
}
.mini-avi-ig {
  background: linear-gradient(135deg,var(--ig1),var(--ig3),var(--ig5));
}
.mini-name { font-weight: 700; font-size: 15px; color: var(--dk); }
.mini-type { font-size: 12px; color: var(--g3); }
.mini-badge {
  margin-left: auto;
  display: flex; align-items: center; gap: 4px;
  background: var(--orf); border: 1px solid var(--orp);
  color: var(--or); font-size: 11px; font-weight: 600;
  padding: 3px 9px; border-radius: 50px;
}
.mini-dot { width: 5px; height: 5px; background: var(--or); border-radius: 50%; animation: blink .8s infinite; }

.mini-body {
  padding: 10px 16px 16px;
  font-size: 13px; color: var(--g3); line-height: 1.5;
  border-top: 1px solid var(--g1);
}
.mini-timer {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 15px; color: var(--or); letter-spacing: .04em; margin-top: 4px;
}

/* ── TYPE SELECT ── */
.type-screen {
  position: relative; z-index: 1;
  max-width: 900px; margin: 0 auto;
  padding: 48px 24px 80px;
}
.screen-title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(36px,6vw,60px); font-weight: 900; color: var(--dk);
  margin-bottom: 10px; text-align: center;
}
.screen-sub {
  text-align: center; font-size: 17px; color: var(--g3);
  margin-bottom: 48px; font-weight: 300;
}
.type-grid-3 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px,1fr));
  gap: 20px; margin-bottom: 40px;
}
.type-tile {
  background: #fff; border-radius: 24px; padding: 36px 28px 32px;
  border: 2px solid var(--g1);
  box-shadow: 0 6px 24px rgba(244,97,10,.07);
  text-align: center;
  transition: transform .22s, border-color .22s, box-shadow .22s;
  position: relative; overflow: hidden;
  min-height: 260px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.type-tile::after {
  content: ''; position: absolute; bottom: 0; left: 0; right: 0;
  height: 4px;
  background: linear-gradient(90deg,var(--or),var(--orl));
  transform: scaleX(0); transform-origin: left; transition: transform .3s;
}
.type-tile:active { transform: scale(.97); }
.type-tile.sel {
  border-color: var(--or);
  background: var(--orf);
  box-shadow: 0 12px 48px rgba(244,97,10,.2);
}
.type-tile.sel::after { transform: scaleX(1); }

/* Instagram logo SVG in tile */
.ig-logo-wrap {
  width: 64px; height: 64px; margin: 0 auto 16px;
}
.tile-emoji { font-size: 52px; margin-bottom: 16px; display: block; }
.tile-name {
  font-family: 'Playfair Display', serif;
  font-size: 22px; font-weight: 700; color: var(--dk); margin-bottom: 8px;
}
.tile-desc { font-size: 14px; color: var(--g3); line-height: 1.5; margin-bottom: 16px; }
.tile-tag {
  display: inline-block;
  background: var(--orf); border: 1px solid var(--orp);
  color: var(--or); font-size: 12px; font-weight: 600;
  padding: 5px 14px; border-radius: 50px;
}
.type-tile.sel .tile-tag { background: var(--or); color: #fff; border-color: var(--or); }

/* ── FORM SCREEN ── */
.form-screen {
  position: relative; z-index: 1;
  max-width: 640px; margin: 0 auto;
  padding: 40px 24px 80px;
}
.form-card {
  background: #fff; border-radius: 28px;
  border: 1px solid var(--orp);
  padding: 44px 40px;
  box-shadow: 0 24px 72px rgba(244,97,10,.18);
  position: relative; overflow: hidden;
}
.form-card::before {
  content: ''; position: absolute;
  top: 0; left: 0; right: 0; height: 5px;
  background: linear-gradient(90deg,var(--or),var(--orl),var(--orp));
}

.step-pips { display: flex; gap: 8px; justify-content: center; margin-bottom: 36px; }
.pip { height: 5px; border-radius: 3px; background: var(--g1); transition: all .3s; }
.pip.done { background: var(--orl); width: 28px; }
.pip.act  { background: var(--or); width: 44px; }
.pip.wait { width: 28px; }

.form-eyebrow { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: .1em; color: var(--or); margin-bottom: 8px; }
.form-h { font-family: 'Playfair Display', serif; font-size: 30px; font-weight: 700; color: var(--dk); margin-bottom: 32px; }

.field { margin-bottom: 24px; }
.flabel { display: block; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: .07em; color: var(--g3); margin-bottom: 10px; }
.finput {
  width: 100%;
  background: var(--orf); border: 1.5px solid var(--g1);
  border-radius: 16px; padding: 18px 20px;
  font-size: 18px; color: var(--dk); outline: none;
  transition: all .2s;
}
.finput:focus { border-color: var(--or); background: #fff; box-shadow: 0 0 0 4px rgba(244,97,10,.1); }
.finput::placeholder { color: var(--orp); }
.ftextarea { resize: vertical; min-height: 100px; line-height: 1.5; }

/* Duration pills */
.dur-row { display: flex; gap: 10px; flex-wrap: wrap; }
.dur-pill {
  flex: 1; min-width: 58px;
  padding: 16px 8px; border-radius: 14px;
  border: 1.5px solid var(--g1); background: var(--orf);
  color: var(--g3); font-size: 16px; font-weight: 700;
  text-align: center;
  transition: all .22s cubic-bezier(.34,1.56,.64,1);
}
.dur-pill:active { transform: scale(.95); }
.dur-pill.on {
  background: linear-gradient(135deg,var(--or),var(--orl));
  border-color: transparent; color: #fff;
  box-shadow: 0 6px 20px rgba(244,97,10,.35);
  transform: scale(1.06);
}

.submit-btn {
  width: 100%; margin-top: 12px;
  padding: 22px; border-radius: 18px;
  background: linear-gradient(135deg,var(--or),var(--orl));
  color: #fff; font-size: 20px; font-weight: 700;
  letter-spacing: .02em;
  box-shadow: 0 10px 40px rgba(244,97,10,.4);
  transition: transform .2s, box-shadow .2s;
  position: relative; overflow: hidden;
}
.submit-btn::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(180deg,rgba(255,255,255,.15) 0%,transparent 50%);
}
.submit-btn:active { transform: scale(.98); box-shadow: 0 4px 20px rgba(244,97,10,.35); }

.back-btn {
  display: inline-flex; align-items: center; gap: 8px;
  background: #fff; border: 1.5px solid var(--g1);
  color: var(--g3); font-size: 16px; font-weight: 500;
  padding: 12px 24px; border-radius: 50px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(244,97,10,.06);
}
.back-btn:active { background: var(--orf); color: var(--or); border-color: var(--orp); }

/* ── RESULT SCREEN ── */
.result-screen {
  position: relative; z-index: 1;
  max-width: 560px; margin: 0 auto;
  padding: 40px 24px 80px;
}
.result-header { text-align: center; margin-bottom: 32px; }
.result-badge {
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--or); color: #fff;
  font-size: 14px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
  padding: 10px 22px; border-radius: 50px;
  box-shadow: 0 6px 24px rgba(244,97,10,.45);
  margin-bottom: 16px;
}
.result-h2 {
  font-family: 'Playfair Display', serif;
  font-size: 38px; font-weight: 900; color: var(--dk); margin-bottom: 6px;
}
.result-h2 em { font-style: italic; color: var(--or); }
.result-sub { font-size: 15px; color: var(--g3); }

/* ═══ INSTAGRAM CARD ══════════════════════════════════ */
.ig-card {
  background: #fff;
  border-radius: 24px; overflow: hidden;
  border: 1px solid #E1E1E1;
  box-shadow: 0 32px 80px rgba(0,0,0,.14);
  animation: cardPop .7s cubic-bezier(.34,1.56,.64,1) both;
}
@keyframes cardPop {
  from { opacity:0; transform:scale(.87) translateY(24px); }
  to   { opacity:1; transform:none; }
}

/* IG story-style gradient ring at top */
.ig-story-ring {
  height: 6px;
  background: linear-gradient(90deg,var(--ig1),var(--ig2),var(--ig3),var(--ig4),var(--ig5));
}

.ig-header {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 18px;
}
/* Real IG-gradient avatar ring */
.ig-avi-ring {
  padding: 2px; border-radius: 50%;
  background: linear-gradient(135deg,var(--ig1),var(--ig3),var(--ig5));
  flex-shrink: 0;
}
.ig-avi-inner {
  width: 44px; height: 44px; border-radius: 50%;
  background: linear-gradient(135deg,var(--or),var(--orl));
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 17px; color: #fff;
  border: 2px solid #fff;
}
.ig-handle-row { flex: 1; }
.ig-handle-name {
  font-size: 14px; font-weight: 700; color: #262626;
  display: flex; align-items: center; gap: 5px;
}
.ig-verified { color: #0095F6; font-size: 14px; }
.ig-handle-sub { font-size: 12px; color: #8E8E8E; }
/* Official Instagram logo icon */
.ig-logo-icon {
  width: 28px; height: 28px; flex-shrink: 0;
}

/* The main visual */
.ig-visual {
  background: linear-gradient(160deg,#FFF7ED 0%,#fff 40%,#FFF0E8 100%);
  min-height: 280px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; padding: 40px 24px;
  position: relative; overflow: hidden;
}
/* radial glow */
.ig-visual::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(ellipse 60% 50% at 50% 50%,rgba(244,97,10,.08) 0%,transparent 70%);
}
.ig-visual-label {
  font-size: 12px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase;
  color: var(--orl); margin-bottom: 12px; position: relative;
}
.ig-visual-name {
  font-family: 'Playfair Display', serif;
  font-size: clamp(38px,10vw,62px); font-weight: 900; font-style: italic;
  color: var(--dk); line-height: 1.05; margin-bottom: 14px;
  position: relative;
}
.ig-name-accent {
  background: linear-gradient(135deg,var(--or) 0%,var(--orl) 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.ig-visual-msg {
  font-size: 14px; color: var(--g3); line-height: 1.6;
  max-width: 280px; position: relative;
}
/* corner sparkles */
.sp { position: absolute; font-size: 22px; animation: spAnim 3s ease-in-out infinite; }
.sp1{top:16px;left:16px;animation-delay:0s}
.sp2{top:16px;right:16px;animation-delay:.9s}
.sp3{bottom:16px;left:22px;animation-delay:.45s}
.sp4{bottom:16px;right:22px;animation-delay:1.35s}
@keyframes spAnim {
  0%,100%{transform:rotate(0deg) scale(1);opacity:.65}
  50%{transform:rotate(18deg) scale(1.25);opacity:1}
}

.ig-actions {
  display: flex; align-items: center;
  padding: 13px 18px 8px;
  font-size: 24px; gap: 14px;
}
.ig-heart { animation: heartIdle 2.5s ease-in-out infinite; }
@keyframes heartIdle {
  0%,80%,100%{transform:scale(1)} 85%{transform:scale(1.18)} 90%{transform:scale(.95)}
}

.ig-caption {
  padding: 0 18px 14px;
  font-size: 13.5px; color: #262626; line-height: 1.55;
}
.ig-caption strong { font-weight: 700; }
.ig-tags { margin-top: 5px; color: #00376B; font-size: 13px; }

/* QR + follow section — the key to viewer→follower conversion */
.ig-qr-section {
  margin: 0 18px 16px;
  background: linear-gradient(135deg,var(--orf) 0%,#fff 100%);
  border: 1.5px solid var(--orp); border-radius: 18px;
  padding: 16px 20px;
  display: flex; align-items: center; gap: 16px;
}
.ig-qr-img {
  width: 80px; height: 80px; border-radius: 10px;
  background: var(--g1);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; flex-shrink: 0;
}
.ig-qr-img img { width: 80px; height: 80px; border-radius: 10px; }
.ig-qr-text { flex: 1; }
.ig-qr-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--or); margin-bottom: 4px; }
.ig-qr-handle {
  font-family: 'Playfair Display', serif;
  font-size: 20px; font-weight: 700; color: var(--dk); margin-bottom: 3px;
}
.ig-qr-hint { font-size: 12px; color: var(--g3); }

.ig-footer {
  border-top: 1px solid #EFEFEF;
  padding: 12px 18px;
  display: flex; align-items: center; justify-content: space-between;
}
.ig-footer-live {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 600; color: var(--or);
}
.ig-timer {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 18px; letter-spacing: .04em; color: var(--or);
}
.dur-tag {
  background: var(--orf); border: 1px solid var(--orp);
  color: var(--or); font-size: 12px; font-weight: 600;
  padding: 5px 12px; border-radius: 50px;
}

/* ═══ BIRTHDAY CARD ════════════════════════════════════ */
.bday-wrap {
  position: relative;
  border-radius: 24px; overflow: hidden;
  box-shadow: 0 32px 80px rgba(244,97,10,.22);
  animation: cardPop .7s cubic-bezier(.34,1.56,.64,1) both;
}

/* Confetti layer */
.confetti-layer {
  position: absolute; inset: 0; pointer-events: none; z-index: 2; overflow: hidden;
}
.cf {
  position: absolute; top: -20px;
  border-radius: 2px;
  animation: cfFall linear infinite;
}
@keyframes cfFall {
  0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
}

.bday-card {
  background: #fff;
  border: 1.5px solid var(--orp);
  position: relative; z-index: 1;
}
.bday-ribbon {
  background: linear-gradient(135deg,var(--or) 0%,var(--orl) 100%);
  padding: 24px; text-align: center; position: relative; overflow: hidden;
}
.bday-ribbon-pattern {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-size: 20px; letter-spacing: 10px; opacity: .15;
  white-space: nowrap; overflow: hidden;
}
.bday-ribbon-text {
  font-family: 'Dancing Script', cursive;
  font-size: 30px; color: #fff;
  text-shadow: 0 2px 8px rgba(0,0,0,.2); position: relative;
}
.bday-body { padding: 30px 28px; text-align: center; }
.bday-crown {
  font-size: 60px; display: block; margin-bottom: 4px;
  animation: crownWig 2.5s ease-in-out infinite;
}
@keyframes crownWig {
  0%,100%{transform:rotate(-7deg) translateY(0)} 50%{transform:rotate(7deg) translateY(-8px)}
}
.bday-happy {
  font-family: 'Dancing Script', cursive;
  font-size: 22px; color: var(--orl); margin-bottom: 6px;
}
.bday-name {
  font-family: 'Playfair Display', serif;
  font-size: clamp(40px,11vw,66px); font-weight: 900; color: var(--dk);
  line-height: 1.05; margin-bottom: 10px;
}
.bday-name em { font-style: italic; color: var(--or); }
.bday-age {
  display: inline-flex; align-items: center; justify-content: center;
  width: 72px; height: 72px; border-radius: 50%;
  background: linear-gradient(135deg,var(--or),var(--orl));
  color: #fff; font-family: 'Bebas Neue', sans-serif; font-size: 34px;
  box-shadow: 0 8px 32px rgba(244,97,10,.4);
  margin: 12px auto 20px;
  animation: agePulse 2s ease-in-out infinite;
}
@keyframes agePulse {
  0%,100%{box-shadow:0 8px 32px rgba(244,97,10,.4)} 50%{box-shadow:0 8px 56px rgba(244,97,10,.7)}
}
.bday-msg { font-size: 15px; color: var(--g3); line-height: 1.65; margin-bottom: 22px; font-style: italic; }

.bday-balloons { display: flex; justify-content: center; gap: 12px; font-size: 34px; margin-bottom: 22px; }
.bday-balloons span { display: inline-block; animation: ballSway 3s ease-in-out infinite; }
.bday-balloons span:nth-child(2){animation-delay:.2s}
.bday-balloons span:nth-child(3){animation-delay:.4s}
.bday-balloons span:nth-child(4){animation-delay:.6s}
.bday-balloons span:nth-child(5){animation-delay:.8s}
@keyframes ballSway {
  0%,100%{transform:translateY(0) rotate(-5deg)} 50%{transform:translateY(-12px) rotate(5deg)}
}
.bday-countdown {
  background: var(--orf); border: 1.5px solid var(--orp);
  border-radius: 16px; padding: 14px 20px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  font-size: 14px; color: var(--or); font-weight: 600;
  margin-bottom: 6px;
}
.bday-time { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: .05em; }

/* QR for birthday */
.bday-qr {
  display: flex; align-items: center; gap: 14px;
  background: #fff; border: 1px solid var(--g1); border-radius: 14px;
  padding: 12px 16px; margin: 12px 0 4px;
  text-align: left;
}
.bday-qr img { width: 64px; height: 64px; border-radius: 8px; }
.bday-qr-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--or); }
.bday-qr-h { font-weight: 700; font-size: 16px; color: var(--dk); margin-top: 2px; }
.bday-qr-hint { font-size: 12px; color: var(--g3); margin-top: 2px; }

.bday-footer {
  background: var(--g1); padding: 12px 24px;
  display: flex; justify-content: space-between; align-items: center;
  font-size: 12px; color: var(--g3);
}
.bday-footer strong { color: var(--or); }

/* ═══ STAR CARD ══════════════════════════════════════ */
.star-card {
  background: #fff; border-radius: 24px; overflow: hidden;
  border: 1px solid var(--orp);
  box-shadow: 0 32px 80px rgba(244,97,10,.2);
  animation: cardPop .7s cubic-bezier(.34,1.56,.64,1) both;
}
.star-banner {
  background: linear-gradient(135deg,var(--or) 0%,var(--orl) 100%);
  padding: 24px 28px;
  display: flex; align-items: center; justify-content: space-between;
}
.star-word {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 56px; color: #fff; letter-spacing: .06em; line-height: 1;
  text-shadow: 0 3px 12px rgba(0,0,0,.2);
}
.star-icon { font-size: 44px; }
.star-body { padding: 28px 28px 20px; }
.star-name { font-family:'Playfair Display',serif; font-size:44px; font-weight:900; color:var(--dk); line-height:1; margin-bottom:4px; }
.star-handle { font-size:15px; color:var(--or); font-weight:600; margin-bottom:20px; }
.star-msg { font-size:15px; color:var(--g3); line-height:1.65; border-left:4px solid var(--or); padding-left:16px; margin-bottom:24px; }
.star-stats { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:20px; }
.stat-box { background:var(--orf); border:1px solid var(--orp); border-radius:16px; padding:18px; text-align:center; }
.stat-v { font-family:'Bebas Neue',sans-serif; font-size:34px; color:var(--or); line-height:1; }
.stat-l { font-size:11px; color:var(--g3); text-transform:uppercase; letter-spacing:.1em; margin-top:3px; }
.star-qr {
  display: flex; align-items: center; gap: 14px;
  background: var(--orf); border: 1px solid var(--orp); border-radius: 14px;
  padding: 14px 16px;
}
.star-qr img { width: 70px; height: 70px; border-radius: 8px; }
.star-qr-lbl { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:var(--or); }
.star-qr-h { font-weight:700; font-size:16px; color:var(--dk); margin-top:3px; }
.star-qr-hint { font-size:12px; color:var(--g3); margin-top:2px; }
.star-foot { padding:14px 28px; border-top:1px solid var(--g1); display:flex; justify-content:space-between; align-items:center; }
.star-site { font-size:12px; color:var(--g3); letter-spacing:.06em; text-transform:uppercase; }

/* ── RESULT ACTIONS ── */
.action-row { display:flex; gap:12px; margin-top:22px; flex-wrap:wrap; }
.act-btn {
  flex:1; padding:16px;
  border-radius:16px; border:1.5px solid var(--orp);
  background:#fff; color:var(--g3);
  font-size:15px; font-weight:500;
  display:flex; align-items:center; justify-content:center; gap:8px;
  box-shadow:0 3px 12px rgba(244,97,10,.08);
  transition:all .2s;
}
.act-btn:active { border-color:var(--or); color:var(--or); background:var(--orf); }
.act-primary {
  background:linear-gradient(135deg,var(--or),var(--orl));
  border-color:transparent; color:#fff;
  box-shadow:0 8px 28px rgba(244,97,10,.4);
  font-weight:700;
}
.act-primary:active { opacity:.9; }

.footer-note { text-align:center; font-size:12px; color:var(--orp); margin-top:28px; letter-spacing:.06em; text-transform:uppercase; }

/* ── WHY PAY SECTION (on attract screen) ── */
.why-section { padding: 0 24px 64px; max-width:900px; margin:0 auto; }
.why-title {
  font-family:'Playfair Display',serif;
  font-size:28px; font-weight:700; color:var(--dk);
  text-align:center; margin-bottom:8px;
}
.why-sub { text-align:center; font-size:14px; color:var(--g3); margin-bottom:28px; }
.why-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:16px; }
.why-card {
  background:#fff; border-radius:20px; padding:24px 20px;
  border:1px solid var(--orp);
  box-shadow:0 4px 16px rgba(244,97,10,.08);
  text-align:center;
}
.why-icon { font-size:38px; margin-bottom:12px; display:block; }
.why-card-title { font-size:15px; font-weight:700; color:var(--dk); margin-bottom:6px; }
.why-card-body { font-size:13px; color:var(--g3); line-height:1.5; }

/* ── KIOSK IDLE / INACTIVITY NOTE ── */
.idle-bar {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
  background: linear-gradient(135deg,var(--or),var(--orl));
  padding: 12px 24px;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  font-size: 14px; font-weight: 600; color: #fff;
}
.idle-bar span { opacity: .8; }

/* Responsive */
@media(max-width:480px){
  .nav{padding:14px 18px;}
  .form-card{padding:28px 20px;}
  .type-grid-3{grid-template-columns:1fr;}
  .attract-h1{font-size:52px;}
}
`;

/* ─── CONSTANTS ─────────────────────────────────────────── */
const TYPES = [
  { id:"instagram", name:"Instagram Shoutout", desc:"IG-style card with your handle & QR — viewers can follow you on the spot", tag:"Up to 7 days", max:7 },
  { id:"birthday",  name:"Birthday Special",   desc:"Full confetti celebration with your name on this screen & a QR to your profile", tag:"Up to 2 days", max:2 },
  { id:"general",   name:"Star Shoutout",      desc:"Bold feature card for any achievement, milestone or big moment", tag:"Up to 7 days", max:7 },
];

/* Mock "live" shoutouts visible on attract screen */
const DEMO_SHOUTOUTS = [
  { name:"Priya S.",   handle:"priya_creates",  type:"instagram", days:2, msg:"Hit 5K followers! 🙌",   t:7200  },
  { name:"Raj Mehta",  handle:"rajmehtavibes",  type:"birthday",  days:1, msg:"Turning 25 today! 🎂",   t:3600  },
  { name:"Sara K.",    handle:"sara.clicks",    type:"instagram", days:3, msg:"New café opened! ☕",      t:14400 },
  { name:"Arjun D.",   handle:"arjundesigns",   type:"general",   days:1, msg:"Got my first client! 💼",  t:9000  },
];

/* ─── HELPERS ────────────────────────────────────────────── */
const pad = n => String(n).padStart(2,"0");

function useTimer(seconds) {
  const ref = useRef(seconds);
  const [t, setT] = useState({ h: Math.floor(seconds/3600), m: Math.floor((seconds%3600)/60), s: seconds%60 });
  useEffect(() => {
    ref.current = seconds;
    const id = setInterval(() => {
      ref.current = Math.max(0, ref.current - 1);
      const v = ref.current;
      setT({ h: Math.floor(v/3600), m: Math.floor((v%3600)/60), s: v%60 });
    }, 1000);
    return () => clearInterval(id);
  }, [seconds]);
  return t;
}

/* ─── INSTAGRAM LOGO SVG ─────────────────────────────────── */
const InstagramLogo = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className="ig-logo-icon">
    <defs>
      <radialGradient id="igGrad" cx="30%" cy="107%" r="150%">
        <stop offset="0%"   stopColor="#fdf497"/>
        <stop offset="5%"   stopColor="#fdf497"/>
        <stop offset="45%"  stopColor="#fd5949"/>
        <stop offset="60%"  stopColor="#d6249f"/>
        <stop offset="90%"  stopColor="#285AEB"/>
      </radialGradient>
    </defs>
    <rect width="48" height="48" rx="12" fill="url(#igGrad)"/>
    <circle cx="24" cy="24" r="9" fill="none" stroke="white" strokeWidth="3"/>
    <circle cx="34.5" cy="13.5" r="2.5" fill="white"/>
    <rect x="6" y="6" width="36" height="36" rx="10" fill="none" stroke="white" strokeWidth="2.5" opacity=".5"/>
  </svg>
);

/* ─── CONFETTI ───────────────────────────────────────────── */
const COLORS = ["#F4610A","#FB923C","#FED7AA","#FFD700","#FF6090","#4CAF50","#2196F3","#9C27B0"];
const CONFETTI_PIECES = Array.from({length:48},(_,i)=>({
  id:i,
  left:`${Math.random()*100}%`,
  width:`${6+Math.random()*8}px`,
  height:`${8+Math.random()*10}px`,
  color: COLORS[Math.floor(Math.random()*COLORS.length)],
  delay:`${Math.random()*4}s`,
  duration:`${3+Math.random()*4}s`,
  shape: Math.random()>.5?"circle":"rect",
}));

function Confetti() {
  return (
    <div className="confetti-layer">
      {CONFETTI_PIECES.map(p=>(
        <div key={p.id} className="cf" style={{
          left:p.left,
          width:p.shape==="circle"?p.width:p.width,
          height:p.shape==="circle"?p.width:p.height,
          borderRadius:p.shape==="circle"?"50%":"2px",
          background:p.color,
          animationDuration:p.duration,
          animationDelay:p.delay,
        }}/>
      ))}
    </div>
  );
}

/* ─── QR CODE URL ────────────────────────────────────────── */
function qrUrl(handle) {
  const url = encodeURIComponent(`https://instagram.com/${handle || "shouthouse"}`);
  return `https:/api.qrserver.com/v1/create-qr-code/?size=200x200&color=1C0D00&bgcolor=FFF7ED&margin=6&data=${url}`;
}

/* ─── MINI LIVE CARD (attract board) ────────────────────── */
function MiniCard({ data, delay }) {
  const { h, m, s } = useTimer(data.t);
  const init = data.name.split(" ").map(x=>x[0]).join("").toUpperCase().slice(0,2);
  const typeLabel = data.type==="instagram"?"📸 Instagram":data.type==="birthday"?"🎂 Birthday":"⭐ Star";
  return (
    <div className={`mini-card mini-card-${data.type}`} style={{animationDelay:delay}}>
      <div className="mini-head">
        <div className={`mini-avi${data.type==="instagram"?" mini-avi-ig":""}`}>{init}</div>
        <div>
          <div className="mini-name">{data.name}</div>
          <div className="mini-type">{typeLabel}</div>
        </div>
        <div className="mini-badge"><span className="mini-dot"/>Live</div>
      </div>
      <div className="mini-body">
        {data.msg && <div>{data.msg}</div>}
        {data.handle && <div style={{color:"var(--or)",fontSize:12,marginTop:4}}>@{data.handle}</div>}
        <div className="mini-timer">⏱ {pad(h)}:{pad(m)}:{pad(s)}</div>
      </div>
    </div>
  );
}

/* ─── IG CARD ────────────────────────────────────────────── */
function IgCard({ d }) {
  const { h, m, s } = useTimer(d.days * 86400);
  const handle = d.handle || d.name.toLowerCase().replace(/\s+/g,"_");
  const init = d.name.split(" ").map(x=>x[0]).join("").toUpperCase().slice(0,2);
  return (
    <div className="ig-card">
      <div className="ig-story-ring"/>
      <div className="ig-header">
        <div className="ig-avi-ring">
          <div className="ig-avi-inner">{init}</div>
        </div>
        <div className="ig-handle-row">
          <div className="ig-handle-name">
            @{handle}
            <span className="ig-verified">✔</span>
          </div>
          <div className="ig-handle-sub">✨ Featured Shoutout · Sponsored</div>
        </div>
        <InstagramLogo size={28}/>
      </div>

      <div className="ig-visual">
        <span className="sp sp1">✨</span><span className="sp sp2">⭐</span>
        <span className="sp sp3">💫</span><span className="sp sp4">🌟</span>
        <div className="ig-visual-label">🔥 Shoutout to</div>
        <div className="ig-visual-name">
          <span className="ig-name-accent">{d.name}</span>
        </div>
        {d.message && <div className="ig-visual-msg">{d.message}</div>}
      </div>

      <div className="ig-actions">
        <span className="ig-heart">❤️</span>
        <span>💬</span>
        <span>📤</span>
        <span style={{marginLeft:"auto"}}>🔖</span>
      </div>

      <div className="ig-caption">
        <strong>shouthouse</strong> Sending major love to{" "}
        <strong>@{handle}</strong> 🙌
        {d.message && <> — {d.message}</>}
        <div className="ig-tags">#ShoutOut #Featured #Spotlight #ShoutHouse</div>
      </div>

      {/* KEY FEATURE: QR code so viewers can follow without kiosk navigating away */}
      <div className="ig-qr-section">
        <div className="ig-qr-img">
          <img src={qrUrl(handle)} alt="QR" onError={e=>{e.target.style.display="none"}}/>
        </div>
        <div className="ig-qr-text">
          <div className="ig-qr-label">📱 Scan to Follow on Instagram</div>
          <div className="ig-qr-handle">@{handle}</div>
          <div className="ig-qr-hint">Use your phone camera → tap the link</div>
        </div>
      </div>

      <div className="ig-footer">
        <div className="ig-footer-live">
          <span className="ldot"/>
          Live · expires in <span className="ig-timer" style={{marginLeft:5}}>{pad(h)}:{pad(m)}:{pad(s)}</span>
        </div>
        <div className="dur-tag">🕐 {d.days} day{d.days>1?"s":""}</div>
      </div>
    </div>
  );
}

/* ─── BIRTHDAY CARD ──────────────────────────────────────── */
function BdayCard({ d }) {
  const { h, m, s } = useTimer(d.days * 86400);
  const handle = d.handle || d.name.toLowerCase().replace(/\s+/g,"_");
  return (
    <div className="bday-wrap">
      <Confetti/>
      <div className="bday-card">
        <div className="bday-ribbon">
          <div className="bday-ribbon-pattern">🎉🎊🎈🎁🎀</div>
          <div className="bday-ribbon-text">Happy Birthday! 🎂</div>
        </div>
        <div className="bday-body">
          <span className="bday-crown">👑</span>
          <div className="bday-happy">Wishing you the very best,</div>
          <div className="bday-name"><em>{d.name}</em></div>
          {d.age && <div className="bday-age">{d.age}</div>}
          {d.message && <div className="bday-msg">"{d.message}"</div>}
          <div className="bday-balloons">
            {"🎈🎈🎈🎈🎈".split("").map((c,i)=><span key={i}>{c}</span>)}
          </div>
          <div className="bday-countdown">
            🎂 Celebrating for&nbsp;
            <span className="bday-time">{pad(h)}:{pad(m)}:{pad(s)}</span>
            &nbsp;more
          </div>
          {handle && (
            <div className="bday-qr">
              <img src={qrUrl(handle)} alt="QR" onError={e=>{e.target.style.display="none"}}/>
              <div>
                <div className="bday-qr-label">📱 Send birthday wishes on Instagram</div>
                <div className="bday-qr-h">@{handle}</div>
                <div className="bday-qr-hint">Scan with your phone camera</div>
              </div>
            </div>
          )}
        </div>
        <div className="bday-footer">
          <span>Powered by <strong>ShoutHouse</strong></span>
          <span>🎂 {d.days} day spotlight</span>
        </div>
      </div>
    </div>
  );
}

/* ─── STAR CARD ──────────────────────────────────────────── */
function StarCard({ d }) {
  const { h, m, s } = useTimer(d.days * 86400);
  const handle = d.handle || d.name.toLowerCase().replace(/\s+/g,"_");
  return (
    <div className="star-card">
      <div className="star-banner">
        <div className="star-word">SHOUTOUT</div>
        <div className="star-icon">⭐</div>
      </div>
      <div className="star-body">
        <div className="star-name">{d.name}</div>
        <div className="star-handle">@{handle} · Featured Member</div>
        {d.message && <div className="star-msg">{d.message}</div>}
        <div className="star-stats">
          <div className="stat-box">
            <div className="stat-v">{d.days}</div>
            <div className="stat-l">Days Featured</div>
          </div>
          <div className="stat-box">
            <div className="stat-v">{pad(h)}:{pad(m)}</div>
            <div className="stat-l">Time Left</div>
          </div>
        </div>
        {handle && (
          <div className="star-qr">
            <img src={qrUrl(handle)} alt="QR" onError={e=>{e.target.style.display="none"}}/>
            <div>
              <div className="star-qr-lbl">📱 Follow on Instagram</div>
              <div className="star-qr-h">@{handle}</div>
              <div className="star-qr-hint">Scan the QR with your phone</div>
            </div>
          </div>
        )}
      </div>
      <div className="star-foot">
        <div className="star-site">SHOUTHOUSE.CO</div>
        <div className="dur-tag">🔥 Live · {d.days}d</div>
      </div>
    </div>
  );
}

/* ─── APP ────────────────────────────────────────────────── */
export default function App() {
  const [step, setStep]         = useState(0); // 0=attract, 1=types, 2=form, 3=result
  const [typeId, setTypeId]     = useState(null);
  const [form, setForm]         = useState({ name:"", handle:"", message:"", age:"", days:1 });
  const [result, setResult]     = useState(null);

  const type = TYPES.find(t=>t.id===typeId);
  const upd  = k => e => setForm(f=>({...f,[k]:e.target.value}));

  const pickType = id => { setTypeId(id); setForm(f=>({...f,days:1})); setStep(2); };
  const submit   = ()  => { if(!form.name.trim()) return; setResult({...form,type:typeId}); setStep(3); };
  const reset    = ()  => { setStep(0); setTypeId(null); setResult(null); setForm({name:"",handle:"",message:"",age:"",days:1}); };

  return (
    <>
      <style>{FONTS+CSS}</style>
      <div style={{minHeight:"100vh",position:"relative"}}>
        <div className="mesh"/><div className="grid-lines"/>

        {/* NAV */}
        <nav className="nav">
          <div className="nav-logo">Shout<span>House</span></div>
          <div className="nav-price">
            <div className="nav-live"><span className="ldot"/>Live Shoutouts</div>
            <div className="nav-rs">₹100</div>
          </div>
        </nav>

        {/* ══ STEP 0: ATTRACT ══ */}
        {step===0 && (
          <div className="attract">
            <div className="attract-hero">
              <div className="attract-eyebrow">
                <span className="ldot"/>KIOSK DISPLAY · Get Seen by Everyone Here
              </div>
              <h1 className="attract-h1">
                Your Name.<br/><em>Their Screen.</em>
              </h1>
              <p className="attract-sub">
                For just ₹100 — get your name, Instagram handle, and a personal message
                displayed on this screen for every single person who walks past.
                Real followers. Real visibility. Real pride.
              </p>

              {/* Value props */}
              <div className="vprops">
                <div className="vprop"><span className="vprop-icon">📍</span>500+ people see this screen daily</div>
                <div className="vprop"><span className="vprop-icon">📱</span>QR code = real Instagram followers</div>
                <div className="vprop"><span className="vprop-icon">🎂</span>Birthday? Make it unforgettable</div>
                <div className="vprop"><span className="vprop-icon">⏱</span>Up to 7 days live</div>
              </div>

              <button className="cta-btn" onClick={()=>setStep(1)}>
                ✨ Get MY Shoutout Now
                <span className="cta-price">Only ₹100 · Takes 30 seconds</span>
              </button>

              <div className="live-ticker">
                <span className="ldot"/>
                <span><span className="ticker-num">24</span> shoutouts live right now</span>
                <span>·</span>
                <span><span className="ticker-num">500+</span> people have used ShoutHouse</span>
              </div>
            </div>

            {/* Live Board */}
            <div className="board-section">
              <div className="board-title">🔴 Live Shoutouts Right Now</div>
              <div className="board-sub">These people are being seen by everyone visiting — you could be next</div>
              <div className="board-grid">
                {DEMO_SHOUTOUTS.map((d,i)=>(
                  <MiniCard key={d.handle} data={d} delay={`${i*0.1}s`}/>
                ))}
              </div>
            </div>

            {/* Why Pay ₹100 */}
            <div className="why-section">
              <div className="why-title">Why does anyone pay ₹100 for this?</div>
              <div className="why-sub">Here's what you actually get — and why it's worth every rupee</div>
              <div className="why-grid">
                {[
                  {icon:"🏆",title:"Social Pride",body:"YOUR name on a public screen. Everyone in this area sees you. It feels amazing — like being famous for a day."},
                  {icon:"📲",title:"Real Followers",body:"The QR code on your card lets anyone scan and follow your Instagram instantly. Real local followers for ₹100."},
                  {icon:"🎂",title:"Unforgettable Birthday",body:"Imagine walking in and seeing your name with confetti on the big screen. Your family will talk about it for years."},
                  {icon:"💼",title:"Free Publicity",body:"Small shop? New business? Your name here reaches hundreds of people — cheaper than any pamphlet or ad."},
                  {icon:"📸",title:"Screenshot-worthy",body:"The card looks so beautiful people screenshot it and post it to Instagram stories — giving you even MORE reach."},
                  {icon:"💰",title:"₹100 = Nothing",body:"That's one chai + samosa. But this gets your name, face and Instagram in front of hundreds of real people."},
                ].map(w=>(
                  <div className="why-card" key={w.title}>
                    <span className="why-icon">{w.icon}</span>
                    <div className="why-card-title">{w.title}</div>
                    <div className="why-card-body">{w.body}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ STEP 1: TYPE SELECT ══ */}
        {step===1 && (
          <div className="type-screen">
            <button className="back-btn" onClick={()=>setStep(0)}>← Back</button>
            <div className="screen-title">Choose your spotlight</div>
            <div className="screen-sub">Pick the shoutout style that's right for you</div>
            <div className="type-grid-3">
              {TYPES.map(t=>(
                <div key={t.id} className={`type-tile${typeId===t.id?" sel":""}`} onClick={()=>pickType(t.id)}>
                  {t.id==="instagram"
                    ? <div className="ig-logo-wrap"><InstagramLogo size={64}/></div>
                    : <span className="tile-emoji">{t.id==="birthday"?"🎂":"⭐"}</span>
                  }
                  <div className="tile-name">{t.name}</div>
                  <div className="tile-desc">{t.desc}</div>
                  <span className="tile-tag">{t.tag}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ STEP 2: FORM ══ */}
        {step===2 && type && (
          <div className="form-screen">
            <button className="back-btn" onClick={()=>setStep(1)}>← Back</button>
            <div className="form-card">
              <div className="step-pips">
                <div className="pip done"/><div className="pip done"/><div className="pip act"/><div className="pip wait"/>
              </div>
              <div className="form-eyebrow">
                {typeId==="instagram"?<><InstagramLogo size={16}/> Instagram Shoutout</>
                 :typeId==="birthday"?"🎂 Birthday Special":"⭐ Star Shoutout"}
              </div>
              <div className="form-h">Tell us about you ✨</div>

              <div className="field">
                <label className="flabel">Your Name *</label>
                <input className="finput" placeholder="e.g. Priya Sharma" value={form.name} onChange={upd("name")}/>
              </div>

              <div className="field">
                <label className="flabel">Instagram Handle</label>
                <input className="finput" placeholder="yourhandle  (without @)" value={form.handle} onChange={upd("handle")}/>
              </div>

              {typeId==="birthday" && (
                <div className="field">
                  <label className="flabel">Age (optional)</label>
                  <input className="finput" type="number" min="1" max="120" placeholder="e.g. 25" value={form.age} onChange={upd("age")}/>
                </div>
              )}

              <div className="field">
                <label className="flabel">Personal Message (optional)</label>
                <textarea className="finput ftextarea"
                  placeholder={typeId==="birthday"
                    ?"e.g. Grateful for all the love today! 🎉"
                    :"e.g. Just hit 10K — couldn't have done it without you 🙏"}
                  value={form.message} onChange={upd("message")}/>
              </div>

              <div className="field">
                <label className="flabel">Duration — max {type.max} day{type.max>1?"s":""}</label>
                <div className="dur-row">
                  {Array.from({length:type.max},(_,i)=>i+1).map(d=>(
                    <button key={d} className={`dur-pill${form.days===d?" on":""}`}
                      onClick={()=>setForm(f=>({...f,days:d}))}>
                      {d}d
                    </button>
                  ))}
                </div>
              </div>

              <button className="submit-btn" onClick={submit}>
                🚀 Launch My Shoutout for ₹100 →
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 3: RESULT ══ */}
        {step===3 && result && (
          <div className="result-screen">
            <div className="result-header">
              <div className="result-badge"><span className="ldot" style={{background:"#fff"}}/>You're LIVE!</div>
              <h2 className="result-h2">Your shoutout is <em>live</em> 🎉</h2>
              <p className="result-sub">Visible to every visitor for {result.days} day{result.days>1?"s":""}</p>
            </div>

            {result.type==="instagram" && <IgCard d={result}/>}
            {result.type==="birthday"  && <BdayCard d={result}/>}
            {result.type==="general"   && <StarCard d={result}/>}

            <div className="action-row">
              <button className="act-btn">📋 Copy Link</button>
              <button className="act-btn">📱 Share</button>
              <button className="act-btn act-primary" onClick={reset}>✨ New Shoutout</button>
            </div>
            <div className="footer-note">ShoutHouse · Premium Spotlight Platform</div>
          </div>
        )}

        {/* Kiosk idle bar — always visible so users know they can interact */}
        {step===0 && (
          <div className="idle-bar">
            <span className="ldot" style={{background:"#fff"}}/>
            <span>Touch <strong>"Get MY Shoutout"</strong> above to get started</span>
            <span>·</span>
            <span>₹100 only · 30 seconds to go live</span>
          </div>
        )}
      </div>
    </>
  );
}
