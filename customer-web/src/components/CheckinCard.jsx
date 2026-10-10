import React, { useRef, useState, useEffect, useMemo } from 'react';
import { exportStoryCard } from './exportStoryCard';
import { InstagramStoryCard } from './InstagramStoryCard';
import { buildStoryCard } from './storyCardData';
import './storyCard.css';

export function CheckinCard({ onChange, summary }) {
  const previewRef = useRef(null);
  const cardRef = useRef(null);
  const saving = useRef(false);

  const [alias, setAlias] = useState('');
  const [partner, setPartner] = useState('');
  const [relationship, setRelationship] = useState('solo');
  const [note, setNote] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [scale, setScale] = useState(0.36);

  const solo = relationship === 'solo';

  // Responsive scale calculation: preview scales proportionally while 1080x1920 DOM remains native
  useEffect(() => {
    if (!previewRef.current) return;
    const updateScale = () => {
      if (!previewRef.current) return;
      const width = previewRef.current.clientWidth;
      if (width > 0) {
        setScale(width / 1080);
      }
    };
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(updateScale) : null;
    observer?.observe(previewRef.current);
    window.addEventListener('resize', updateScale);
    updateScale();
    return () => { observer?.disconnect(); window.removeEventListener('resize', updateScale); };
  }, []);

  // Initialize alias from verified check-in name
  useEffect(() => {
    setAlias(String(summary?.name || '').slice(0, 30));
    setConsent(false);
  }, [summary?.name]);

  // Keep legacy email attachments isolated from editable designs
  useEffect(() => {
    if (onChange) onChange(null);
  }, [onChange]);

  // Build reactive story card data
  const storyData = useMemo(() => {
    return buildStoryCard(
      {
        design: relationship,
        name: alias,
        partner,
        note,
      },
      summary
    );
  }, [relationship, alias, partner, note, summary]);

  const ready = consent && !!alias.trim() && (solo || !!partner.trim());

  // Export 1080 × 1920 Native Instagram Story
  const save = async (share) => {
    if (!ready || saving.current) return;
    saving.current = true;
    setBusy(true);
    setError('');

    try {
      const blob = await exportStoryCard(cardRef.current);

      const filename = `Reliv-${relationship}-Story.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      if (share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My Reliv Check-in Story' });
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error('[CheckinCard] Save error:', e);
        setError('Could not save your card. Please try Save card image again.');
      }
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };

  const change = (setter) => (e) => {
    setter(e.target.value);
    setConsent(false);
  };

  return (
    <section
      className="rounded-3xl border border-orange-200 bg-white p-4 sm:p-5 shadow-sm space-y-4"
      aria-label="Optional Reliv story card"
    >
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-slate-900">Your Reliv share card</h3>
        <p className="text-sm text-slate-700">
          Personalize your share card. Your verified health score and Today’s Win are automatically linked
          from your check-in report.
        </p>
      </div>

      <fieldset disabled={busy} className="space-y-3.5 min-w-0">
        <label className="block text-xs font-semibold text-slate-700">
          Card type
          <select
            aria-label="Card type"
            value={relationship}
            onChange={change(setRelationship)}
            className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm font-medium text-slate-900 outline-none focus:border-orange-500 focus:bg-white"
          >
            <option value="solo">Individual</option>
            <option value="friends">Friends</option>
            <option value="couple">Couple</option>
          </select>
        </label>

        <label className="block text-xs font-semibold text-slate-700">
          Name to show on the card
          <input
            aria-label="Name to show on the card"
            autoComplete="given-name"
            placeholder="Type your name"
            maxLength={30}
            value={alias}
            onChange={change(setAlias)}
            className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm font-medium text-slate-900 outline-none focus:border-orange-500 focus:bg-white"
          />
        </label>

        {!solo && (
          <label className="block text-xs font-semibold text-slate-700">
            {relationship === 'friends' ? 'Friend’s name' : 'Partner’s name'}
            <input
              aria-label={relationship === 'friends' ? 'Friend’s name' : 'Partner’s name'}
              placeholder="Type their name"
              maxLength={30}
              value={partner}
              onChange={change(setPartner)}
              className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm font-medium text-slate-900 outline-none focus:border-orange-500 focus:bg-white"
            />
          </label>
        )}

        <label className="block text-xs font-semibold text-slate-700">
          My note (optional)
          <textarea
            aria-label="My note"
            maxLength={100}
            value={note}
            onChange={change(setNote)}
            placeholder="Leave blank to use the design’s original quote"
            className="mt-1 min-h-16 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm font-medium text-slate-900 outline-none focus:border-orange-500 focus:bg-white resize-none"
          />
        </label>
      </fieldset>

      {!solo && (
        <p className="text-xs text-slate-600 bg-orange-50/60 p-2.5 rounded-xl border border-orange-100">
          The score, win and focus belong to <strong>{alias.trim() || 'your check-in'}</strong>. Adding your
          partner’s name creates a shared memory card; their private score is kept unlinked.
        </p>
      )}

      {/* 9:16 Instagram Story Preview Frame */}
      <div
        ref={previewRef}
        className="story-preview-container"
        style={{ height: `${Math.round(1920 * scale)}px` }}
      >
        <div
          className="story-preview-inner"
          style={{ transform: `scale(${scale})` }}
        >
          <InstagramStoryCard
            ref={cardRef}
            design={relationship}
            name={alias}
            partner={partner}
            score={storyData.score}
            partnerScore={null}
            win={storyData.win}
            focus={storyData.focus}
            note={note}
          />
        </div>
      </div>

      <div className="space-y-3 pt-1">
        <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={consent}
            disabled={busy}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
          />
          <span>
            {solo
              ? 'I agree to include my name and report highlights on this shareable card.'
              : 'We both agree to include our names and my report highlights on this shareable card.'}
          </span>
        </label>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            disabled={!ready || busy}
            onClick={() => save(false)}
            className="min-h-12 flex-1 rounded-xl bg-orange-700 hover:bg-orange-800 px-4 font-bold text-sm text-white shadow-sm transition disabled:opacity-40 cursor-pointer"
          >
            {busy ? 'Creating 1080×1920 image…' : 'Save card image'}
          </button>
          <button
            type="button"
            disabled={!ready || busy}
            onClick={() => save(true)}
            className="min-h-12 flex-1 rounded-xl border-2 border-orange-700 hover:bg-orange-50 px-4 font-bold text-sm text-orange-800 transition disabled:opacity-40 cursor-pointer"
          >
            Share card
          </button>
        </div>

        <p className="text-[11px] text-slate-500 leading-normal text-center">
          1080 × 1920 image with the complete card and photos. Your original quote is used when the note is blank.
        </p>

        {error && <p className="text-xs text-red-600 text-center font-medium" role="alert">{error}</p>}
      </div>
    </section>
  );
}
