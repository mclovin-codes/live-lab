/* Top bar (owner: Gold), drawn by shared/nav.js through window.RushTopbar.draw(headerEl, data).
 * As the Rush app does it (rush-arena components/AppHeader.tsx): your face and the page title on the left,
 * ONE Stack pill on the right with the real Stack mark (components/CreditCoin.tsx). No subtitle, no rank line.
 * The pill is alive: when the Stack changes it counts to the new figure and flashes green or red once; a tap opens the Stack sheet.
 * data = {handle, stack, delta, rank, of, opponent, honest, openStack()} */
(function () {
  const MARK = '<svg class="rt-mark" viewBox="0 0 100 92" aria-hidden="true"><rect x="0" y="48" width="100" height="44" rx="22" fill="#075A8F"/><rect x="0" y="24" width="100" height="44" rx="22" fill="#0A6FB0"/><rect x="0.75" y="0.75" width="98.5" height="42.5" rx="21.25" fill="#00BFFF" stroke="#5FD8FF" stroke-width="1.5"/><rect x="12" y="6" width="34" height="14" rx="7" fill="#BFEFFF" opacity="0.75"/></svg>';
  const TITLES = { 'index.html': 'HOME', '': 'HOME', 'board.html': 'BOARD', 'game.html': 'GAME', 'ranks.html': 'CONTEST', 'lounge.html': 'LOUNGE', 'slips.html': 'SLIPS', 'player.html': 'PROFILE' };
  const fmt = n => Math.round(+n || 0).toLocaleString('en-US');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CSS = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@600;700;800&display=swap');
#rtop.rt{position:sticky;top:0;z-index:39;display:flex;align-items:center;gap:10px;padding:calc(8px + env(safe-area-inset-top,0px)) 16px 8px;background:#0B1118;border-bottom:1px solid rgba(255,255,255,.07)}
#rtop.rt .rt-me{display:flex;align-items:center;gap:10px;flex:1;min-width:0;text-decoration:none}
#rtop.rt .rt-title{font:400 22px/1 'Bebas Neue',sans-serif;letter-spacing:2px;color:rgba(255,255,255,.85);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#rtop.rt .rt-pill{flex:none;display:flex;align-items:center;gap:6px;height:36px;padding:0 14px 0 12px;border-radius:999px;background:#1A2530;border:1px solid rgba(255,255,255,.1);color:#fff;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:background .25s,border-color .25s,transform .1s}
#rtop.rt .rt-pill:active{transform:scale(.96)}
#rtop.rt .rt-mark{width:20px;height:18px;flex:none}
#rtop.rt .rt-fig{font:400 24px/1 'Bebas Neue',sans-serif;letter-spacing:.5px;font-variant-numeric:tabular-nums;color:#fff;min-width:3ch;text-align:right}
#rtop.rt .rt-pill.rt-in0{background:#00BFFF;border-color:#00BFFF}#rtop.rt .rt-pill.rt-in0 .rt-fig{color:#0B1118;letter-spacing:1.5px}#rtop.rt .rt-pill.up{background:rgba(16,185,129,.22);border-color:#10B981}#rtop.rt .rt-pill.up .rt-fig{color:#10B981}
#rtop.rt .rt-pill.dn{background:rgba(239,68,68,.2);border-color:#EF4444}#rtop.rt .rt-pill.dn .rt-fig{color:#EF4444}
@media (prefers-reduced-motion:reduce){#rtop.rt .rt-pill{transition:none}}`;
  let styled = false, shown = null, timer = null;
  function face(handle, size) {
    if (window.RushFace) return RushFace.html({ id: 'me', me: true, name: handle }, size, true);
    return `<span style="width:${size}px;height:${size}px;border-radius:50%;display:inline-grid;place-items:center;background:#00BFFF22;border:1.5px solid #00BFFF66;color:#00BFFF;font:800 13px sans-serif">${esc(String(handle || 'P')[0].toUpperCase())}</span>`;
  }
  // Load the faces once, then redraw so the header shows your chosen preset.
  if (!window.RushFace && !document.querySelector('script[data-rushface]')) { const s = document.createElement('script'); s.src = 'faces.js?v=f1'; s.dataset.rushface = '1'; s.onload = () => { if (window._rtLast) draw.apply(null, window._rtLast); }; document.head.appendChild(s); }
  function count(el, from, to) {
    clearInterval(timer); const t0 = Date.now(), dur = 900;
    timer = setInterval(() => { const k = Math.min(1, (Date.now() - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(from + (to - from) * e); if (k >= 1) clearInterval(timer); }, 30);
  }
  function isIn(d) { if (d && typeof d.entered === 'boolean') return d.entered; try { if (window.GU && GU.entered) return GU.entered(); } catch (e) {} return true; }
  // The Enter moment: one tap, then the Stack counts up from 0 and the page's own Enter animation runs (window event rush:entered).
  function enterNow(d) { try { if (d && d.enter) d.enter(); else if (window.GU && GU.enter) GU.enter(); } catch (e) {} try { window.dispatchEvent(new Event('rush:entered')); } catch (e) {} setTimeout(() => { if (window._rtLast) draw.apply(null, window._rtLast); }, 60); }
  function draw(el, data) {
    window._rtLast = [el, data];
    if (!el) return; data = data || {};
    if (!styled) { const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); styled = true; }
    el.classList.add('rt');
    const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase(), q = new URLSearchParams(location.search).get('u');
    const title = page === 'player.html' && q && q !== 'me' ? 'PLAYER' : (TITLES[page] || 'RUSH');
    const stack = Math.round(+data.stack || 0);
    if (!el.querySelector('.rt-pill')) {
      el.innerHTML = `<a class="rt-me" href="player.html" aria-label="Your profile">${face(data.handle, 30)}<span class="rt-title">${esc(title)}</span></a><button class="rt-pill" type="button" aria-label="Your Stack, ${fmt(stack)}. Open">${MARK}<span class="rt-fig">${fmt(stack)}</span></button>`;
      el.querySelector('.rt-pill').addEventListener('click', () => { const d = window._rtLast && window._rtLast[1]; if (!isIn(d)) { enterNow(d); return; } try { if (d && d.openStack) d.openStack(); } catch (e) {} });
    } else {
      const me = el.querySelector('.rt-me'); const fh = face(data.handle, 30); const cur = me.firstElementChild; if (cur && cur.outerHTML !== fh) { cur.outerHTML = fh; }
      el.querySelector('.rt-title').textContent = title;
    }
    // Alive: a changed Stack counts to the new figure and flashes once (green up, red down). The last figure is kept per tab.
    const fig = el.querySelector('.rt-fig'), pill = el.querySelector('.rt-pill');
    // Not entered this week: the pill reads ENTER and a tap enters (as the app's header does).
    if (!isIn(data)) { fig.textContent = 'ENTER'; pill.classList.add('rt-in0'); pill.setAttribute('aria-label', 'Enter this week'); shown = 0; return; }
    if (pill.classList.contains('rt-in0')) { pill.classList.remove('rt-in0'); shown = 0; try { sessionStorage.setItem('rt-stack', '0'); } catch (e) {} }
    let last = shown; if (last == null) { try { const v = sessionStorage.getItem('rt-stack'); last = v == null ? null : +v; } catch (e) {} }
    if (last != null && last !== stack) {
      pill.classList.remove('up', 'dn'); void pill.offsetWidth; pill.classList.add(stack > last ? 'up' : 'dn');
      count(fig, last, stack); setTimeout(() => pill.classList.remove('up', 'dn'), 1600);
    } else if (shown == null) fig.textContent = fmt(stack);
    shown = stack; pill.setAttribute('aria-label', 'Your Stack, ' + fmt(stack) + '. Open');
    try { sessionStorage.setItem('rt-stack', String(stack)); } catch (e) {}
  }
  window.RushTopbar = { draw, MARK, enterNow };
})();
