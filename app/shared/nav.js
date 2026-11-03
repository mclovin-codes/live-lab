/* Rush five-tab bar: shared/nav.js (owner: Team Blue)
 * Include after shared/state.js:  <script src="shared/nav.js"></script>
 * Injects a bottom tab bar (Home, Board, Slips, Ranks, Lounge) into document.body, marks the current page,
 * shows the open-pick count on Slips and the weekly rank on Ranks, and pads the page so content clears the bar.
 * Optional: <body data-tab="board"> to force the active tab (game.html marks Board).
 * Exposes Rush.nav.refresh() to redraw badges.
 */
(function () {
  const TABS = [
    ['home', 'Home', 'index.html', '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'],
    ['board', 'Board', 'board.html', '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 10h18M3 15h18M12 10v10"/>'],
    ['slips', 'Slips', 'slips.html', '<path d="M5 3h14a1 1 0 0 1 1 1v17l-2.67-2-2.66 2L12 19l-2.67 2-2.66-2L4 21V4a1 1 0 0 1 1-1z"/><path d="M8 8h8M8 12h8M8 15.5h5"/>'],
    ['ranks', 'Ranks', 'ranks.html', '<path d="M9 21V9h6v12M3 21v-7h6M15 21v-5h6v5M2 21h20"/>'],
    ['lounge', 'Lounge', 'lounge.html', '<path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4V6a1 1 0 0 1 1-1z"/><path d="M8 10h8M8 13h5"/>'],
  ];
  const CSS = `#rnav{position:fixed;left:0;right:0;bottom:0;z-index:40;display:grid;grid-template-columns:repeat(5,1fr);background:rgba(18,26,35,.86);-webkit-backdrop-filter:saturate(180%) blur(20px);backdrop-filter:saturate(180%) blur(20px);border-top:.5px solid rgba(255,255,255,.1);padding-bottom:env(safe-area-inset-bottom,0px);padding-left:env(safe-area-inset-left,0px);padding-right:env(safe-area-inset-right,0px)}
#rnav a{position:relative;min-height:49px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font:500 10px/12px -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,sans-serif;color:rgba(255,255,255,.45);text-decoration:none;-webkit-tap-highlight-color:transparent}
#rnav a svg{width:26px;height:26px;fill:none;stroke:currentColor;stroke-width:1.75;stroke-linecap:round;stroke-linejoin:round}
#rnav a.on{color:#00BFFF}#rnav a:active{transform:scale(.92)}
#rnav em{position:absolute;top:4px;left:calc(50% + 8px);font:700 11px/18px -apple-system,BlinkMacSystemFont,sans-serif;font-style:normal;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#D95151;color:#fff;text-align:center}
#rnav em.rk{background:#1A2530}
body.has-rnav{padding-bottom:calc(60px + env(safe-area-inset-bottom,0px))}`;
  function current() { const forced = document.body && document.body.dataset.tab; if (forced) return forced; const f = (location.pathname.split('/').pop() || 'index.html').toLowerCase(); const t = TABS.find(x => x[2] === f); return t ? t[0] : f === 'game.html' ? 'board' : 'home'; }
  function badges() { if (!window.Rush) return {}; let open = 0, rank = null; try { open = Rush.picks({ status: 'open', week: Rush.week().id }).length; const m = Rush.me(); rank = m.entered ? m.rank : null; } catch (e) {} return { slips: open ? String(open) : '', ranks: rank ? '#' + rank : '' }; }
  function draw() { let nav = document.getElementById('rnav'); if (!nav) { nav = document.createElement('nav'); nav.id = 'rnav'; nav.setAttribute('aria-label', 'Rush'); document.body.appendChild(nav); document.body.classList.add('has-rnav'); } const cur = current(), b = badges(); nav.innerHTML = TABS.map(([k, label, href, path]) => `<a href="${href}" class="${k === cur ? 'on' : ''}"${k === cur ? ' aria-current="page"' : ''}><svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg><span>${label}</span>${b[k] ? `<em class="${k === 'ranks' ? 'rk' : ''}">${b[k]}</em>` : ''}</a>`).join(''); }
  function init() { const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); draw(); if (window.Rush && Rush.on) Rush.on(draw); setInterval(draw, 30000); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.Rush = window.Rush || {}; window.Rush.nav = { refresh: draw };
})();
