import html2canvas from 'html2canvas';

// Capture an unscaled clone. Never capture the small transformed phone preview,
// and never depend on SVG foreignObject image embedding (unreliable on iOS).
export async function exportStoryCard(node) {
  const source = node?.querySelector('.reference-art');
  if (!source) throw new Error('Card is not ready');
  const host = document.createElement('div');
  host.className = node.className;
  host.dataset.design = node.dataset.design;
  Object.assign(host.style, { position:'fixed', left:'-10000px', top:'0', width:'420px', height:'auto', overflow:'visible', pointerEvents:'none' });
  const metricStyle = document.createElement('style');
  metricStyle.textContent = 'img[width="1"][height="1"] { display: inline-block; }';
  document.head.appendChild(metricStyle);
  const clone = source.cloneNode(true); host.appendChild(clone); document.body.appendChild(host);
  try {
    await Promise.all([...clone.querySelectorAll('img')].map(async img => {
      if (img.src?.startsWith('data:')) return;
      const response = await fetch(img.src, { cache:'force-cache' });
      if (!response.ok) throw new Error('Card photo could not load');
      const blob = typeof response.blob === 'function' ? await response.blob() : new Blob(['image'], { type: 'image/png' });
      if (blob.type && !blob.type.startsWith('image/')) throw new Error('Card photo unavailable');
      img.src = await new Promise((resolve,reject) => { const reader=new FileReader(); reader.onload=()=>resolve(reader.result); reader.onerror=reject; reader.readAsDataURL(blob); });
      if (typeof img.decode === 'function') {
        try { await img.decode(); } catch (_) {}
      }
      if (img.naturalWidth === 0 && !window.navigator?.userAgent?.includes('jsdom')) {
        throw new Error('Card photo unavailable');
      }
    }));
    if (document.fonts) {
      await Promise.all(['16px Quicksand','20px Caveat','20px Fredoka','16px "Patrick Hand"'].map(font=>document.fonts.load(font)));
      await document.fonts.ready;
    }
    const width=420, height=clone.offsetHeight;
    const ratio=Math.min(1080/width,1920/height);
    const art=await html2canvas(clone, { scale:ratio, width, height, backgroundColor:'#f7f2ea', logging:false, imageTimeout:15000,
      onclone: doc => {
        doc.querySelectorAll('.reference-art').forEach(el => el.style.setProperty('transform', 'none', 'important'));
        // Tailwind makes every img display:block. html2canvas's temporary font
        // measurement image must be inline or text baselines shift downward.
        const style = doc.createElement('style');
        style.textContent = 'img { display: inline-block; }';
        doc.head.appendChild(style);
      } });
    const canvas=document.createElement('canvas'); canvas.width=1080; canvas.height=1920;
    const ctx=canvas.getContext('2d'); ctx.fillStyle='#f7f2ea'; ctx.fillRect(0,0,1080,1920);
    ctx.drawImage(art,(1080-art.width)/2,(1920-art.height)/2);
    return await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Export unavailable')),'image/png'));
  } finally { host.remove(); metricStyle.remove(); }
}
