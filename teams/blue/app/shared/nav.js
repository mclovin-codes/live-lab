/* Rush five-tab bar: shared/nav.js (owner: Team Blue)
 * Include after shared/state.js:  <script src="shared/nav.js"></script>
 * Injects a bottom tab bar (Home, Board, Slips, Ranks, Lounge) into document.body, marks the current page,
 * shows the open-pick count on Slips and the weekly rank on Ranks, and pads the page so content clears the bar.
 * Optional: <body data-tab="board"> to force the active tab (game.html marks Board).
 * Exposes Rush.nav.refresh() to redraw badges.
 *
 * Contest switcher (3:05 AM addendum): a pill with the active contest's colour dot, name and its own Stack
 * ("The Rush · 952 Stack"), plus its rank. Tap it for a sheet of every contest you are in, each with its own Stack,
 * rank and clock; tap one to make it active (Rush.wallet.setActive), and every page redraws inside it.
 * The pill sits at the top of the page in normal flow, so it never covers a page's own fixed bars. A page can host it
 * in its header instead: put an empty <span data-rush-pill></span> where it should go.
 * Slips and Ranks badges count the active contest.
 */
(function () {
  const TABS = [
    ['home', 'Home', 'index.html', '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'],
    ['board', 'Board', 'board.html', '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 10h18M3 15h18M12 10v10"/>'],
    ['slips', 'Slips', 'slips.html', '<path d="M5 3h14a1 1 0 0 1 1 1v17l-2.67-2-2.66 2L12 19l-2.67 2-2.66-2L4 21V4a1 1 0 0 1 1-1z"/><path d="M8 8h8M8 12h8M8 15.5h5"/>'],
    ['ranks', 'Ranks', 'ranks.html', '<path d="M9 21V9h6v12M3 21v-7h6M15 21v-5h6v5M2 21h20"/>'],
    ['crew', 'Crew', 'crew.html', '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M14.5 14.2c.8-.3 1.6-.4 2.5-.4 2.8 0 5 2.2 5 5"/>'],
    ['lounge', 'Lounge', 'lounge.html', '<path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4V6a1 1 0 0 1 1-1z"/><path d="M8 10h8M8 13h5"/>'],
  ];
  const CSS = `#rnav{position:fixed;left:0;right:0;bottom:0;z-index:40;display:grid;grid-template-columns:repeat(5,1fr);background:rgba(18,26,35,.86);-webkit-backdrop-filter:saturate(180%) blur(20px);backdrop-filter:saturate(180%) blur(20px);border-top:.5px solid rgba(255,255,255,.1);padding-bottom:env(safe-area-inset-bottom,0px);padding-left:env(safe-area-inset-left,0px);padding-right:env(safe-area-inset-right,0px)}
#rnav a{position:relative;min-height:49px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font:500 10px/12px -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,sans-serif;color:rgba(255,255,255,.45);text-decoration:none;-webkit-tap-highlight-color:transparent}
#rnav a svg{width:26px;height:26px;fill:none;stroke:currentColor;stroke-width:1.75;stroke-linecap:round;stroke-linejoin:round}
#rnav a.on{color:#00BFFF}#rnav a:active{transform:scale(.92)}
#rnav em{position:absolute;top:4px;left:calc(50% + 8px);font:700 11px/18px -apple-system,BlinkMacSystemFont,sans-serif;font-style:normal;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#D95151;color:#fff;text-align:center}
#rnav em.rk{background:#1A2530}
body.has-rnav{padding-bottom:calc(60px + env(safe-area-inset-bottom,0px))}
#rpill-band{padding:calc(6px + env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right,0px)) 6px max(16px,env(safe-area-inset-left,0px));background:#0B1118}
.rpill{display:inline-flex;align-items:center;gap:8px;max-width:100%;min-height:32px;padding:4px 12px 4px 10px;border-radius:16px;border:.5px solid rgba(255,255,255,.14);background:#121A23;color:#fff;font:600 13px/18px -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent}
.rpill:active{transform:scale(.97)}.rpill b{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}.rpill small{color:rgba(255,255,255,.55);font-weight:500;white-space:nowrap}
.rdot{width:10px;height:10px;border-radius:50%;flex:none;box-shadow:0 0 0 2px rgba(255,255,255,.08)}
.rpill svg{width:12px;height:12px;flex:none;stroke:rgba(255,255,255,.55);fill:none;stroke-width:2.2}
#rcx-scrim{position:fixed;inset:0;z-index:80;background:rgba(0,0,0,.5)}
#rcx{position:fixed;left:0;right:0;bottom:0;z-index:81;max-height:80%;overflow-y:auto;background:#121A23;border-radius:16px 16px 0 0;padding:8px max(16px,env(safe-area-inset-right,0px)) calc(16px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px));color:#fff;font:400 14px/20px -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,sans-serif}
#rcx h3{margin:8px 0 4px;font-size:17px;font-weight:700}#rcx p{margin:0 0 10px;color:rgba(255,255,255,.55);font-size:13px}
#rcx .grab{width:36px;height:5px;border-radius:3px;background:rgba(255,255,255,.2);margin:4px auto 8px}
#rcx button.row{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;width:100%;padding:12px 4px;border:0;border-top:.5px solid rgba(255,255,255,.08);background:none;color:inherit;font:inherit;text-align:left;cursor:pointer}
#rcx .row b{display:block;font-weight:600}#rcx .row small{display:block;color:rgba(255,255,255,.55);font-size:12px}
#rcx .row .st{text-align:right;font-weight:600;white-space:nowrap}#rcx .row.on .st::after{content:" ✓";color:#00BFFF}
#rcx a.more{display:block;margin-top:10px;padding:12px;border-radius:12px;background:#1A2530;color:#00BFFF;text-align:center;text-decoration:none;font-weight:600}`;
  function current() { const forced = document.body && document.body.dataset.tab; if (forced) return forced; const f = (location.pathname.split('/').pop() || 'index.html').toLowerCase(); const t = TABS.find(x => x[2] === f); return t ? t[0] : f === 'game.html' ? 'board' : 'home'; }
  function badges() { if (!window.Rush) return {}; let open = 0, rank = null; try { const cur = Rush.wallet && Rush.wallet.current ? Rush.wallet.current() : null; if (cur) { open = cur.open || 0; rank = cur.entered ? cur.rank : null; } else { open = Rush.picks({ status: 'open', week: Rush.week().id }).length; const m = Rush.me(); rank = m.entered ? m.rank : null; } } catch (e) {} let live = ''; try { const l = JSON.parse(localStorage.getItem('rw.live') || 'null'); if (l && Date.now() - l.at < 3e5 && l.n > 0) live = String(Math.min(99, +l.n || 0)); } catch (e) {} /* Crew badge: hours left when the boost is under 24 h, or COLD */
    let crew = ''; try { const c = Rush.crew && Rush.crew.get(); if (c && (c.stage === 'warn' || c.stage === 'hot')) crew = Math.max(1, Math.ceil(c.left / 36e5)) + 'h'; else if (c && c.stage === 'cold') crew = '!'; } catch (e) {}
    return { slips: open ? String(open) : '', ranks: rank ? '#' + rank : '', board: live, crew }; }
  function draw() { let nav = document.getElementById('rnav'); if (!nav) { nav = document.createElement('nav'); nav.id = 'rnav'; nav.setAttribute('aria-label', 'Rush'); document.body.appendChild(nav); document.body.classList.add('has-rnav'); } const cur = current(), b = badges(); nav.innerHTML = TABS.map(([k, label, href, path]) => `<a href="${href}" class="${k === cur ? 'on' : ''}"${k === cur ? ' aria-current="page"' : ''}><svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg><span>${label}</span>${b[k] ? `<em class="${k === 'ranks' ? 'rk' : ''}">${b[k]}</em>` : ''}</a>`).join(''); }
  const esc = x => String(x == null ? '' : x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const okColor = c => /^#[0-9a-f]{6}$/i.test(String(c)) ? c : '#00BFFF';
  const stk = n => Math.round(+n || 0).toLocaleString('en-US');
  function clockOf(e) { const t = Date.now(), C = window.Rush && Rush.clock ? Rush.clock : (ms => Math.round(ms / 36e5) + 'h'); if (e.phase === 'settled') return 'Settled'; if (e.phase === 'upcoming') return 'Opens in ' + C(e.opens - t); return 'Settles in ' + C(e.settles - t); }
  function pillHTML(e) { return `<span class="rdot" style="background:${okColor(e.color)}"></span><b>${esc(e.name)}</b><small>· ${e.entered ? stk(e.stack) + ' Stack' : 'Not entered'}${e.rank ? ' · #' + e.rank : ''}</small><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5"/></svg>`; }
  function drawPill() {
    if (!window.Rush || !Rush.wallet) return; let e; try { e = Rush.wallet.current(); } catch (x) { return; } if (!e) return;
    let host = document.querySelector('[data-rush-pill]');
    if (!host) { host = document.getElementById('rpill-band'); if (!host) { host = document.createElement('div'); host.id = 'rpill-band'; document.body.insertBefore(host, document.body.firstChild); } }
    let b = host.querySelector('.rpill'); if (!b) { b = document.createElement('button'); b.type = 'button'; b.className = 'rpill'; b.addEventListener('click', openSwitch); host.appendChild(b); }
    const h = pillHTML(e); if (b._h !== h) { b.innerHTML = h; b._h = h; b.setAttribute('aria-label', 'Active contest ' + e.name + ', ' + stk(e.stack) + ' Stack. Switch contest'); }
  }
  function closeSwitch() { ['rcx', 'rcx-scrim'].forEach(id => { const n = document.getElementById(id); if (n) n.remove(); }); }
  function openSwitch() {
    closeSwitch(); let L = []; try { L = Rush.wallet.list(); } catch (x) {} const a = Rush.wallet.active();
    const sc = document.createElement('div'); sc.id = 'rcx-scrim'; sc.addEventListener('click', closeSwitch);
    const sh = document.createElement('div'); sh.id = 'rcx'; sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-label', 'Switch contest');
    sh.innerHTML = `<div class="grab"></div><h3>Your contests</h3><p>Each contest has its own Stack. The Board, game pages and your Slip work inside the one you pick.</p>` +
      L.map(e => `<button type="button" class="row${e.id === a ? ' on' : ''}" data-cx="${esc(e.id)}"><span class="rdot" style="background:${okColor(e.color)}"></span><span><b>${esc(e.name)}</b><small>${e.rank ? '#' + e.rank + (e.of ? ' of ' + e.of : '') + ' · ' : ''}${esc(clockOf(e))}</small></span><span class="st">${e.entered ? stk(e.stack) + ' Stack' : 'Not entered'}</span></button>`).join('') +
      '<a class="more" href="contests.html">Find or start a contest</a>';
    sh.addEventListener('click', ev => { const r = ev.target.closest('[data-cx]'); if (!r) return; Rush.wallet.setActive(r.dataset.cx); closeSwitch(); drawPill(); draw(); });
    document.body.appendChild(sc); document.body.appendChild(sh);
  }
  function init() { const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); draw(); drawPill(); if (window.Rush && Rush.on) Rush.on(() => { draw(); drawPill(); }); setInterval(() => { draw(); drawPill(); }, 30000); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.Rush = window.Rush || {}; window.Rush.nav = { refresh: () => { draw(); drawPill(); }, openSwitch };
})();
