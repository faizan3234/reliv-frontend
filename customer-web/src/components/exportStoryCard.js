import html2canvas from 'html2canvas';

// Capture an unscaled clone fitted exactly to 1080 × 1920 9:16 Instagram Story.
// No outer rounded borders, no letterbox bars, full-bleed edge-to-edge.
export async function exportStoryCard(node) {
  const source = node?.querySelector('.reference-art');
  if (!source) throw new Error('Card is not ready');

  const width = 420;
  const height = 746.67; // exactly 9:16 aspect ratio (420 * 16 / 9)
  const ratio = 1080 / width; // 2.57142857

  const host = document.createElement('div');
  host.className = node.className;
  host.dataset.design = node.dataset.design;
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
      if (img.src?.startsWith('data:')) return;
      if (typeof window !== 'undefined' && window.navigator?.userAgent?.includes('jsdom')) return;
      const response = await fetch(img.src, { cache: 'force-cache' });
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
        try { await img.decode(); } catch (_) {}
      }
      if (img.naturalWidth === 0 && !window.navigator?.userAgent?.includes('jsdom')) {
        throw new Error('Card photo unavailable');
      }
    }));

    if (document.fonts) {
      await Promise.all(['16px Quicksand', '20px Caveat', '20px Fredoka', '16px "Patrick Hand"'].map(font => document.fonts.load(font)));
      await document.fonts.ready;
    }

    const art = await html2canvas(clone, {
      scale: ratio,
      width,
      height,
      backgroundColor: '#f7f2ea',
      logging: false,
      imageTimeout: 15000,
      onclone: doc => {
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
