import html2canvas from 'html2canvas';
import { fitStoryCard, STORY_WIDTH, STORY_HEIGHT } from './fitStoryCard';

// Capture an unscaled clone fitted exactly to 1080 × 1920 9:16 Instagram Story.
// No outer rounded borders, no letterbox bars, full-bleed edge-to-edge.
export async function exportStoryCard(node) {
  const source = node?.querySelector('.reference-art');
  if (!source) throw new Error('Card is not ready');

  const width = STORY_WIDTH;
  const height = STORY_HEIGHT; // exactly 9:16 aspect ratio (420 * 16 / 9)
  const ratio = 1080 / width; // 2.57142857

  const host = document.createElement('div');
  host.className = node.className;
  host.dataset.design = node.dataset.design;
  host.dataset.cardExport = 'true';
  Object.assign(host.style, {
    position: 'fixed',
    left: '-10000px',
    top: '0',
    width: `${width}px`,
    height: `${height}px`,
    overflow: 'hidden',
    pointerEvents: 'none',
  });

  const metricStyle = document.createElement('style');
  metricStyle.textContent = 'img[width="1"][height="1"] { display: inline-block; }';
  document.head.appendChild(metricStyle);

  const clone = source.cloneNode(true);
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.maxWidth = 'none';
  clone.style.margin = '0';
  clone.style.border = 'none';
  clone.style.borderRadius = '0';
  clone.style.boxShadow = 'none';
  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    await Promise.all([...clone.querySelectorAll('img')].map(async img => {
      if (typeof window !== 'undefined' && window.navigator?.userAgent?.includes('jsdom')) return;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      let response;
      try { response = await fetch(img.currentSrc || img.src, { cache: 'force-cache', signal: controller.signal }); }
      finally { clearTimeout(timeout); }
      if (!response.ok) throw new Error('Card photo could not load');
      const blob = typeof response.blob === 'function' ? await response.blob() : new Blob(['image'], { type: 'image/png' });
      if (blob.type && !blob.type.startsWith('image/')) throw new Error('Card photo unavailable');
      img.src = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      if (typeof img.decode === 'function') {
        await img.decode();
      }
      if (img.naturalWidth === 0 && !window.navigator?.userAgent?.includes('jsdom')) {
        throw new Error('Card photo unavailable');
      }
      if (img.naturalWidth > 0) {
        const w = img.clientWidth, h = img.clientHeight;
        if (w && h) {
          const photo = document.createElement('canvas');
          photo.width = Math.ceil(w * ratio); photo.height = Math.ceil(h * ratio);
          const context = photo.getContext('2d');
          const fit = Math.min(photo.width / img.naturalWidth, photo.height / img.naturalHeight);
          const pw = img.naturalWidth * fit, ph = img.naturalHeight * fit;
          context.drawImage(img, (photo.width-pw)/2, (photo.height-ph)/2, pw, ph);
          img.src = photo.toDataURL('image/png');
          await img.decode();
        }
      }
    }));

    if (document.fonts) {
      await Promise.all(['16px Quicksand', '20px Caveat', '20px Fredoka', '16px "Patrick Hand"'].map(font => document.fonts.load(font)));
      await document.fonts.ready;
    }

    fitStoryCard(clone);

    const art = await html2canvas(clone, {
      scale: ratio,
      width,
      height,
      backgroundColor: '#f7f2ea',
      logging: false,
      imageTimeout: 15000,
      scrollX: 0, scrollY: 0,
      onclone: doc => {
        // Rasterize at the clone document origin. Negative offscreen coordinates
        // combined with mobile page scroll caused missing text in saved PNGs.
        const exportHost = doc.querySelector('[data-card-export="true"]');
        if (exportHost) { exportHost.style.left = '0'; exportHost.style.top = '0'; }
        doc.querySelectorAll('.reference-art').forEach(el => {
          el.style.setProperty('transform', 'none', 'important');
          el.style.setProperty('border', 'none', 'important');
          el.style.setProperty('border-radius', '0', 'important');
          el.style.setProperty('margin', '0', 'important');
          el.style.setProperty('box-shadow', 'none', 'important');
          el.style.setProperty('width', `${width}px`, 'important');
          el.style.setProperty('height', `${height}px`, 'important');
        });
        // Tailwind makes every img display:block. html2canvas's temporary font
        // measurement image must be inline or text baselines shift downward.
        const style = doc.createElement('style');
        style.textContent = 'img { display: inline-block; }';
        doc.head.appendChild(style);
      },
    });

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f7f2ea';
    ctx.fillRect(0, 0, 1080, 1920);
    // Draw art edge-to-edge across the entire 1080x1920 canvas without any outer border or margin
    ctx.drawImage(art, 0, 0, 1080, 1920);

    return await new Promise((resolve, reject) =>
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Export unavailable')), 'image/png')
    );
  } finally {
    host.remove();
    metricStyle.remove();
  }
}
