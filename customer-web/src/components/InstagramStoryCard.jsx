import { fitStoryCard } from './fitStoryCard';
import React, { useLayoutEffect, useRef } from 'react';
import solo from './templates/solo.html?raw';
import friends from './templates/friends.html?raw';
import couple from './templates/couple.html?raw';
import { STORY_DESIGNS, validScore } from './storyCardData';
import './cardFonts.css';
import './referenceTemplates.css';

const templates = { solo, friends, couple };
export const InstagramStoryCard = React.forwardRef(function InstagramStoryCard(
  { design = 'solo', name = '', partner = '', score, win = '', focus = '', note = '' }, ref
) {
  const art = useRef(null);
  const selected = templates[design] ? design : 'solo';
  useLayoutEffect(() => {
    const host = art.current;
    if (!host) return;
    // Only trusted repository HTML is inserted; all user/report text uses textContent.
    host.innerHTML = templates[selected];
    const fields = {
      name: name.trim() || 'Your name',
      partner: partner.trim() || (selected === 'friends' ? 'Friend’s name' : 'Partner’s name'),
      score: validScore(score) === null ? '—' : String(validScore(score)),
      win: win.trim() || 'Completed my check-in',
      focus: focus.trim() || 'Choose my next step',
      quote: note.trim() || STORY_DESIGNS[selected].quote,
    };
    host.querySelectorAll('[data-field]').forEach(el => {
      el.textContent = fields[el.dataset.field] || '';
    });
    const canvas = host.querySelector('.reference-art');
    const layout = document.createElement('div');
    layout.className = canvas.className.replace(/\breference-art\b|\bh-full\b|\bmin-h-full\b/g, '') + ' reference-layout';
    while (canvas.firstChild) layout.appendChild(canvas.firstChild);
    canvas.className = 'reference-art';
    canvas.appendChild(layout);
    let active = true;
    const fit = () => { if (active) fitStoryCard(canvas); };
    fit();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(fit) : null;
    observer?.observe(layout);
    window.addEventListener('resize', fit);
    document.fonts?.ready.then(fit);
    return () => { active = false; observer?.disconnect(); window.removeEventListener('resize', fit); };
  }, [selected, name, partner, score, win, focus, note]);

  return (
    <div ref={ref} className="story-card reliv-reference" data-design={selected}>
      <div ref={art} className="reference-position" />
    </div>
  );
});
