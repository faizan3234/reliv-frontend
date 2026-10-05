import React from 'react';
import { scoreStatus, STORY_DESIGNS } from './storyCardData';

/**
 * 1080 × 1920 Native Instagram Story Card Component
 * Strictly adheres to 9:16 aspect ratio with safe margins.
 */
export const InstagramStoryCard = React.forwardRef(function InstagramStoryCard(
  { design = 'solo', name = '', partner = '', score = null, partnerScore = null, win = '', focus = '', note = '' },
  ref
) {
  const isSolo = design === 'solo';
  const copy = STORY_DESIGNS[design] || STORY_DESIGNS.solo;

  const displayName = name.trim() || (isSolo ? 'Your Name' : 'Me');
  const displayPartner = partner.trim() || 'Partner';
  const displayScore = score !== null && score !== undefined && score !== '' ? String(score) : '—';
  const status = scoreStatus(score);

  const displayWin = win.trim() || 'Good overall wellness';
  const displayFocus = focus.trim() || 'Stay active + hydration';
  const displayQuote = note.trim() || copy.quote;

  // For privacy: only render second score circle if partner score is a real number
  const hasPartnerScore = partnerScore !== null && partnerScore !== undefined && partnerScore !== '' && partnerScore !== '—';

  return (
    <div id="story-card" ref={ref} className="story-card" data-design={design}>
      {/* Foliage shadow background accent */}
      <div aria-hidden="true" className="foliage-shadow-decor">
        <svg fill="#4d693a" viewBox="0 0 100 100">
          <path d="M10,80 Q30,40 85,20 C70,45 50,75 10,80 Z" />
          <path d="M25,60 Q55,45 80,45 C65,65 40,75 25,60 Z" opacity="0.8" />
          <path d="M5,95 Q25,80 50,75 C35,90 20,95 5,95 Z" opacity="0.6" />
        </svg>
      </div>

      {/* Top Right Coffee Latte Flatlay Element */}
      <div aria-hidden="true" className="latte-decor">
        <img src="/assets/coffee-latte.jpg" alt="Cozy Flatlay" />
      </div>

      {/* Top Floating Sticky Notes */}
      <div className="top-decoration">
        <span className="note note-left">{copy.noteLeft}</span>
        <span className="note note-right">{copy.noteRight}</span>
      </div>

      {/* Reliv Logo */}
      <div className="reliv-logo-wrap">
        <div className="sun-sparkle" aria-hidden="true">☼</div>
        <h1 className="reliv-logo-text">
          <span className="re">Re</span>
          <span className="liv">
            l<span className="dot-wrapper">ı<span className="orange-dot"></span></span>v
          </span>
          <span className="tm">TM</span>
        </h1>
      </div>

      {/* Hero Header */}
      <section className="hero">
        <h1>
          {copy.headlineTop}
          <br />
          CHECK AT <span>RELIV</span>
        </h1>
        <div className="hero-tagline" id="note-pill" data-default={copy.tagline}>
          {copy.tagline}
        </div>
      </section>

      {/* Main Central Paper Card */}
      <main className="paper-card">
        {/* Paperclip Decor */}
        <div aria-hidden="true" className="paperclip-decor">
          <div className="paperclip-inner"></div>
        </div>

        {/* Washi Tape Decor */}
        <div aria-hidden="true" className="washi-tape-decor"></div>

        <p className="belongs-title">{copy.belongs}</p>

        {isSolo ? (
          <div className="names-row solo">
            <div className="name-pill person-one">
              <span data-field="name">{displayName}</span>
            </div>
          </div>
        ) : (
          <div className="names-row">
            <div className="name-pill person-one">
              <span data-field="name">{displayName}</span>
            </div>
            <div className="heart-between">♡</div>
            <div className="name-pill person-two">
              <span data-field="partner">{displayPartner}</span>
            </div>
          </div>
        )}

        <h2 className="section-title">{copy.scoresTitle}</h2>

        <div className={`scores-row ${hasPartnerScore ? 'two-scores' : 'single-score'}`}>
          <div className="score-card-col">
            <div className="score score-one">
              <strong>
                <span data-field="score">{displayScore}</span>
              </strong>
              <span>/100</span>
            </div>
            {status && (
              <div className={`score-status-pill ${status.tone}`}>
                <span>{status.icon || '⭐'}</span>
                <span>{status.text}</span>
              </div>
            )}
          </div>

          {hasPartnerScore && (
            <div className="score-card-col">
              <div className="score score-two">
                <strong>
                  <span data-field="partnerScore">{String(partnerScore)}</span>
                </strong>
                <span>/100</span>
              </div>
            </div>
          )}
        </div>

        {/* Result Block: Today's Win */}
        <section className="result-block">
          <h3>🏆 Today's Win</h3>
          <div className="result-box">
            <span data-field="win">{displayWin}</span>
          </div>
        </section>

        {/* Result Block: Next Focus */}
        <section className="result-block">
          <h3>🎯 {copy.focusTitle}</h3>
          <div className="result-box focus">
            <span data-field="goal">{displayFocus}</span>
          </div>
        </section>

        {/* Quote / Custom Note */}
        <blockquote>"{displayQuote}"</blockquote>
      </main>

      {/* Floating Memorabilia Row: Kraft note, Polaroid, Grateful sticker */}
      <div className="floating-memorabilia-row" aria-hidden="true">
        <div className="kraft-notebook-decor">
          <div className="ruled-line"></div>
          <div className="ruled-line"></div>
          <div className="ruled-line"></div>
          <p>{isSolo ? 'Healthy\nHabits\nHappier\nMe ♡' : design === 'friends' ? 'Better\nHabits\nWith\nFriends ♡' : 'Little\nsteps.\nBig love. ♡'}</p>
        </div>

        <div className="polaroid-decor">
          <div className="polaroid-img-wrap">
            <img src={isSolo ? '/assets/polaroid-solo.jpg' : design === 'friends' ? '/assets/polaroid-friends.jpg' : '/assets/polaroid-couple.jpg'} alt="" />
          </div>
          <p>{isSolo ? 'me time ♡' : design === 'friends' ? 'besties ♡' : 'together ♡'}</p>
        </div>

        <div className="grateful-sticker-decor">
          <span>✨ Grateful<br />for today ♡</span>
        </div>
      </div>

      {/* Decorative Warm Knit Blanket in bottom corner */}
      <div aria-hidden="true" className="knit-blanket-decor">
        <img src="/assets/knit-blanket.jpg" alt="" />
      </div>

      {/* Footer Branding */}
      <footer>
        <span>{copy.hashtag}</span>
        <span>•</span>
        <span>@reliv_care</span>
      </footer>
    </div>
  );
});
