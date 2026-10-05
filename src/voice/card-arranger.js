/**
 * Reliv Card Arranger & Visual Lock System
 * Enables free dragging, positioning, and text pasting on all notes and card elements.
 * Automatically saves and synchronizes coordinates to disk via local sync server.
 */
(function () {
    const CARD_ID = window.__CARD_ID__ || (function () {
        const path = window.location.pathname.toLowerCase();
        if (path.includes('cards2')) return 'cards2';
        if (path.includes('cards3')) return 'cards3';
        return 'Untitled-1';
    })();

    const SYNC_SERVER_URL = 'http://127.0.0.1:4455/save-card';
    let isArrangeMode = true;

    // Inject styles
    function injectStyles() {
        if (document.getElementById('reliv-arranger-styles')) return;
        const style = document.createElement('style');
        style.id = 'reliv-arranger-styles';
        style.textContent = `
            .draggable-card-item {
                touch-action: none;
                cursor: grab;
                transition: box-shadow 0.15s ease, outline 0.15s ease;
            }
            .arrange-mode-on .draggable-card-item:hover {
                outline: 2px dashed #f26222 !important;
                outline-offset: 3px !important;
            }
            .draggable-card-item.is-dragging {
                cursor: grabbing !important;
                z-index: 100 !important;
                outline: 2.5px solid #f26222 !important;
                outline-offset: 4px !important;
                box-shadow: 0 20px 35px -8px rgba(0, 0, 0, 0.28) !important;
                opacity: 0.96 !important;
                transition: none !important;
            }
            .draggable-card-item [contenteditable="true"],
            .draggable-card-item input {
                cursor: text;
                user-select: text;
            }
        `;
        document.head.appendChild(style);
    }

    // Build Floating Toolbar
    function createToolbar() {
        if (document.getElementById('reliv-arrange-toolbar')) return;

        const toolbar = document.createElement('aside');
        toolbar.id = 'reliv-arrange-toolbar';
        toolbar.className = 'fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-[#1c1917]/95 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-2xl border border-white/15 flex items-center gap-3 font-sans text-xs select-none';
        toolbar.innerHTML = `
            <div class="flex items-center gap-1.5 font-bold text-[#f26222]">
                <span class="text-sm">✋</span>
                <span class="hidden sm:inline">Arranger:</span>
                <span class="text-white uppercase font-black tracking-wider">${CARD_ID}</span>
            </div>
            <span class="text-stone-600">|</span>
            <button id="btn-toggle-arrange" type="button" class="px-2.5 py-1 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold transition cursor-pointer flex items-center gap-1">
                <span id="arrange-status-dot" class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Drag: <strong id="arrange-mode-label">ON</strong></span>
            </button>
            <button id="btn-save-lock-layout" type="button" class="px-3.5 py-1 rounded-full bg-gradient-to-r from-[#f26222] to-[#e04f0f] hover:from-[#e04f0f] hover:to-[#c83e05] text-white font-bold transition cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95">
                <span>💾</span>
                <span>Save & Lock</span>
            </button>
            <button id="btn-reset-layout" type="button" class="px-2 py-1 rounded-full text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition cursor-pointer text-[11px]">
                Reset
            </button>
            <button id="btn-copy-layout" type="button" title="Copy layout JSON coordinates" class="p-1 rounded-full text-stone-400 hover:text-amber-300 transition cursor-pointer">
                📋
            </button>
        `;
        document.body.prepend(toolbar);

        // Toast Container
        const toast = document.createElement('div');
        toast.id = 'reliv-arrange-toast';
        toast.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 z-50 hidden bg-[#141414] text-white px-5 py-2.5 rounded-2xl shadow-2xl border border-[#f26222]/40 text-xs font-medium flex items-center gap-2 transition-all';
        document.body.appendChild(toast);

        document.body.classList.add('arrange-mode-on');

        // Toolbar Events
        document.getElementById('btn-toggle-arrange').addEventListener('click', () => {
            isArrangeMode = !isArrangeMode;
            document.body.classList.toggle('arrange-mode-on', isArrangeMode);
            document.getElementById('arrange-mode-label').textContent = isArrangeMode ? 'ON' : 'OFF';
            document.getElementById('arrange-status-dot').className = `w-2 h-2 rounded-full ${isArrangeMode ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'}`;
            showToast(isArrangeMode ? '✋ Move Mode Enabled: Drag any note or card freely' : '👁️ Preview Mode: Dragging disabled');
        });

        document.getElementById('btn-save-lock-layout').addEventListener('click', saveLayout);
        document.getElementById('btn-reset-layout').addEventListener('click', resetLayout);
        document.getElementById('btn-copy-layout').addEventListener('click', copyLayoutJSON);
    }

    function showToast(msg, isSuccess = true) {
        const toast = document.getElementById('reliv-arrange-toast');
        if (!toast) return;
        toast.innerHTML = (isSuccess ? '✅ ' : 'ℹ️ ') + msg;
        toast.classList.remove('hidden');
        toast.style.opacity = '1';
        clearTimeout(toast.__timer);
        toast.__timer = setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.classList.add('hidden'), 300);
        }, 3500);
    }

    // Apply translation + rotation to an element
    function applyTransform(el, tx, ty, rot) {
        el.setAttribute('data-tx', tx);
        el.setAttribute('data-ty', ty);
        const rotationStr = rot || el.getAttribute('data-rotation') || '';
        el.style.transform = `translate(${tx}px, ${ty}px) ${rotationStr}`.trim();
    }

    // Initialize all draggable items
    function setupDraggables() {
        document.querySelectorAll('.draggable-card-item').forEach(el => {
            if (!el.getAttribute('data-drag-id')) {
                el.setAttribute('data-drag-id', el.id || 'item-' + Math.random().toString(36).substr(2, 6));
            }

            // Restore from saved storage if available
            const savedLayout = getSavedLayout();
            const dragId = el.getAttribute('data-drag-id');
            if (savedLayout && savedLayout[dragId]) {
                const item = savedLayout[dragId];
                applyTransform(el, item.tx, item.ty, item.rotation);
                if (item.text && el.querySelector('.editable-note')) {
                    el.querySelector('.editable-note').innerHTML = item.text;
                }
            } else {
                const existingTx = parseFloat(el.getAttribute('data-tx') || 0);
                const existingTy = parseFloat(el.getAttribute('data-ty') || 0);
                if (existingTx || existingTy) {
                    applyTransform(el, existingTx, existingTy, el.getAttribute('data-rotation'));
                }
            }

            el.addEventListener('pointerdown', (e) => {
                if (!isArrangeMode) return;

                // If editing text inside input/textarea, do not drag
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                    return;
                }
                // If user is focused on editing contenteditable, only drag if clicked on borders/padding
                if (e.target.isContentEditable && document.activeElement === e.target) {
                    return;
                }

                const startX = e.clientX;
                const startY = e.clientY;
                const origTx = parseFloat(el.getAttribute('data-tx') || 0);
                const origTy = parseFloat(el.getAttribute('data-ty') || 0);
                const rot = el.getAttribute('data-rotation') || '';

                let hasMoved = false;

                function onPointerMove(moveEvent) {
                    const dx = moveEvent.clientX - startX;
                    const dy = moveEvent.clientY - startY;

                    if (!hasMoved && Math.hypot(dx, dy) > 3) {
                        hasMoved = true;
                        el.setPointerCapture(e.pointerId);
                        el.classList.add('is-dragging');
                    }

                    if (hasMoved) {
                        const curTx = Math.round(origTx + dx);
                        const curTy = Math.round(origTy + dy);
                        applyTransform(el, curTx, curTy, rot);
                    }
                }

                function onPointerUp(upEvent) {
                    if (hasMoved) {
                        try { el.releasePointerCapture(upEvent.pointerId); } catch (_) {}
                        el.classList.remove('is-dragging');
                        saveToLocalStorageOnly();
                    }
                    window.removeEventListener('pointermove', onPointerMove);
                    window.removeEventListener('pointerup', onPointerUp);
                }

                window.addEventListener('pointermove', onPointerMove);
                window.addEventListener('pointerup', onPointerUp);
            });
        });
    }

    // Clean paste handler for editable notes
    function setupPasteHandling() {
        document.querySelectorAll('.editable-note, [contenteditable="true"]').forEach(note => {
            note.addEventListener('paste', (e) => {
                e.preventDefault();
                const plain = (e.clipboardData || window.clipboardData).getData('text/plain');
                document.execCommand('insertText', false, plain);
            });
        });
    }

    // Read stored layout from localStorage
    function getSavedLayout() {
        try {
            const raw = localStorage.getItem('reliv_layout_' + CARD_ID);
            return raw ? JSON.parse(raw) : null;
        } catch (_) {
            return null;
        }
    }

    // Save to localStorage
    function saveToLocalStorageOnly() {
        const layout = collectCurrentLayout();
        try {
            localStorage.setItem('reliv_layout_' + CARD_ID, JSON.stringify(layout.items));
        } catch (_) {}
    }

    // Collect all coordinates and content
    function collectCurrentLayout() {
        const items = {};
        document.querySelectorAll('.draggable-card-item').forEach(el => {
            const id = el.getAttribute('data-drag-id') || el.id;
            const tx = parseFloat(el.getAttribute('data-tx') || 0);
            const ty = parseFloat(el.getAttribute('data-ty') || 0);
            const rotation = el.getAttribute('data-rotation') || '';
            const noteEl = el.querySelector('.editable-note');
            items[id] = {
                tx,
                ty,
                rotation,
                transform: `translate(${tx}px, ${ty}px) ${rotation}`.trim(),
                text: noteEl ? noteEl.innerHTML.trim() : null
            };
        });
        return {
            cardId: CARD_ID,
            savedAt: new Date().toISOString(),
            items
        };
    }

    // Save & Lock: POST to local sync server + update HTML on disk + localStorage
    async function saveLayout() {
        const saveBtn = document.getElementById('btn-save-lock-layout');
        if (saveBtn) {
            saveBtn.innerHTML = '<span>⏳</span> Saving...';
            saveBtn.disabled = true;
        }

        const layout = collectCurrentLayout();
        saveToLocalStorageOnly();

        const htmlToSave = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;

        try {
            const response = await fetch(SYNC_SERVER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cardId: CARD_ID,
                    items: layout.items,
                    fullHtml: htmlToSave
                })
            });

            const result = await response.json();
            if (result.ok) {
                showToast(`🎉 Saved! Arrangement locked in ${CARD_ID}.html on disk!`);
            } else {
                showToast(`Saved locally in browser! (${result.error || 'Server error'})`);
            }
        } catch (err) {
            console.warn('[Arranger] Sync server unreachable, saved to localStorage:', err);
            showToast('Saved to browser storage! (Sync server: 127.0.0.1:4455)', true);
        } finally {
            if (saveBtn) {
                saveBtn.innerHTML = '<span>💾</span> Save & Lock';
                saveBtn.disabled = false;
            }
        }
    }

    function resetLayout() {
        if (!confirm(`Reset ${CARD_ID} arrangement back to default positions?`)) return;
        localStorage.removeItem('reliv_layout_' + CARD_ID);
        document.querySelectorAll('.draggable-card-item').forEach(el => {
            el.setAttribute('data-tx', '0');
            el.setAttribute('data-ty', '0');
            const rot = el.getAttribute('data-rotation') || '';
            el.style.transform = rot ? `${rot}` : '';
        });
        showToast('↺ Positions reset to default!');
    }

    function copyLayoutJSON() {
        const layout = collectCurrentLayout();
        const jsonStr = JSON.stringify(layout, null, 2);
        navigator.clipboard.writeText(jsonStr).then(() => {
            showToast('📋 Layout JSON copied to clipboard!');
        }).catch(() => {
            prompt('Copy your layout JSON:', jsonStr);
        });
    }

    // Expose helpers on window
    window.RelivCardArranger = {
        saveLayout,
        resetLayout,
        collectCurrentLayout,
        getSavedLayout
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            injectStyles();
            createToolbar();
            setupDraggables();
            setupPasteHandling();
        });
    } else {
        injectStyles();
        createToolbar();
        setupDraggables();
        setupPasteHandling();
    }
})();
