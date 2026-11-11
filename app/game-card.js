/* One game card for the whole app (owner: Gold): Home, the Board and the Lounge's pinned game draw the same card,
 * in the team's own look (founder 11:40: the team's sizing, type and contrast; only the mechanics come from the Rush app's board cards): a header with the clock or kickoff,
 * two team rows (team mark, code, name and record, score), and the price cells while the game is open.
 * GameCard.html(game, opts) is a pure string function: no DOM work, no listeners.
 *   opts.cell(g, spec, top, odds, label, cls): the Board passes its own cell builder; otherwise GameCard.cell registers the pick in GameCard.REG.
 *   opts.who: {away:[faces html], home:[...], over:[...], under:[...], sealed:n}: the quiet line of who is on it.
 *   opts.href: where the header opens (default the game page).
 * Picks match the Board and game page exactly: key = league|id|JSON(spec), mkt = JSON(spec with side, over and o zeroed). */
(function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fo = o => { o = Math.round(+o); return isFinite(o) && o ? (o > 0 ? '+' + o : String(o)) : ''; };
  const ln = v => v == null ? '' : (v > 0 ? '+' + v : String(v));
  const open = g => g && g.state === 'pre' && Date.now() < g.date;
  const REG = new Map();
  const key = (g, sp) => g.league + '|' + g.id + '|' + JSON.stringify(sp);
  function reg(g, sp, label, odds) { const k = key(g, sp); REG.set(k, { key: k, mkt: JSON.stringify(Object.assign({}, sp, { side: 0, over: 0, o: 0 })), league: g.league, gameId: String(g.id), game: g.away.abbr + ' at ' + g.home.abbr, start: g.date, spec: sp, label, odds, market: sp.k }); return k; }
  function cell(g, sp, top, odds, label, cls) {
    if (odds == null || odds === '') return `<span class="rb-c rgc-off${cls ? ' ' + cls : ''}">${top ? esc(top) : ''}<b>&ndash;</b></span>`;
    const ok = open(g), k = reg(g, sp, label, odds);
    let sel = false; try { sel = !!(window.Rush && Rush.slip && Rush.slip.has && Rush.slip.has(k)); } catch (e) {}
    return `<button type="button" class="rb-c${cls ? ' ' + cls : ''}${ok ? '' : ' rgc-off'}${sel ? ' rgc-sel' : ''}" data-k="${esc(k)}"${ok ? '' : ' disabled'} aria-label="${esc(label + ' ' + fo(odds))}">${top ? esc(top) : ''}<b>${esc(fo(odds))}</b></button>`;
  }
  // The home spread from the feed: details reads "FAV -x"; the favourite gives the line its sign.
  function homeSpread(g) {
    const L = g.line || {}, d = String(L.details || '');
    const m = d.match(/([A-Za-z]{2,5})\s*([-+]?\d+(?:\.\d+)?)/);
    if (m) { let v = Math.abs(+m[2]); if (/^pk|even/i.test(d)) return 0; if (v >= 50) { if (L.spread == null) return null; v = Math.abs(+L.spread); } /* hockey and baseball details carry the moneyline favourite: the line comes from spread */ return m[1].toUpperCase() === String(g.home.abbr).toUpperCase() ? -v : v; }
    return L.spread != null ? +L.spread : null;
  }
  const mark = (g, t) => window.TeamMark ? TeamMark.svg(g.league, t, 46) : `<span class="rgc-dot">${esc(t.abbr)}</span>`;
  function when(g) {
    if (g.state === 'in') return `<span class="rgc-live">${esc(g.detail || 'LIVE')}</span>`;
    if (g.done || g.state === 'post') return '<span class="rgc-fin">FINAL</span>';
    return `<span class="rgc-time">${esc(new Date(g.date).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }))}</span>`;
  }
  function html(g, opts) {
    opts = opts || {}; const C = opts.cell || cell, st = g.state !== 'pre' || g.done, L = g.line || {}, hs = homeSpread(g), w = opts.who || null;
    const faces = list => list && list.length ? `<span class="rgc-who">${list.slice(0, 4).join('')}${list.length > 4 ? `<em>+${list.length - 4}</em>` : ''}</span>` : '';
    const row = side => {
      const t = g[side], sp = side === 'home' ? hs : (hs == null ? null : -hs), win = st && g.away.score != null && g.home.score != null && (side === 'home' ? g.home.score > g.away.score : g.away.score > g.home.score);
      const cells = st ? '' : `<span class="rgc-cells">${C(g, { k: 'spread', side, line: sp }, sp == null ? '' : ln(sp), sp == null ? null : -110, t.abbr + ' ' + ln(sp))}${C(g, { k: 'total', side: side === 'away' ? 'o' : 'u', line: L.ou }, L.ou == null ? '' : (side === 'away' ? 'O ' : 'U ') + L.ou, L.ou == null ? null : -110, (side === 'away' ? 'Over ' : 'Under ') + L.ou)}${C(g, { k: 'ml', side }, '', side === 'home' ? L.hml : L.aml, t.abbr + ' moneyline', 'ml')}</span>`;
      return `<div class="rgc-row${win ? ' rgc-w' : ''}">${mark(g, t)}<div class="rgc-t"><b>${esc(t.abbr)}</b><small>${esc(t.name || '')}${t.record ? ' · ' + esc(t.record) : ''}</small>${w ? faces(w[side]) : ''}</div>${st ? `<span class="rgc-sc">${esc(t.score == null ? '' : t.score)}</span>` : cells}</div>`;
    };
    const href = opts.href || `game.html?id=${encodeURIComponent(g.id)}&league=${encodeURIComponent(g.league || '')}`;
    const tot = w && ((w.over && w.over.length) || (w.under && w.under.length)) ? `<div class="rgc-tot">${w.over && w.over.length ? `<span>OVER</span>${faces(w.over)}` : ''}${w.under && w.under.length ? `<span>UNDER</span>${faces(w.under)}` : ''}</div>` : '';
    const seal = w && w.sealed ? `<div class="rgc-seal"><span>${w.sealed} sealed</span>${faces(w.sealedFaces)}</div>` : '';
    return `<div class="rgc${g.state === 'in' ? ' rgc-islive' : ''}"><a class="rgc-h" href="${href}"><span class="rgc-lg">${esc(String(g.league || '').toUpperCase())}</span>${when(g)}${st ? '' : '<span class="rgc-cols"><i>SPREAD</i><i>TOTAL</i><i>ML</i></span>'}</a>${row('away')}${row('home')}${tot}${seal}${opts.foot || ''}</div>`;
  }
  const CSS = `.rgc{background:#141C26;border:1px solid rgba(255,255,255,.09);border-radius:20px;margin-top:10px;overflow:hidden;font:400 15px/1.35 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#F4F7FA}
.rgc.rgc-islive{border-color:rgba(255,107,107,.4)}
.rgc-h{display:flex;align-items:center;gap:8px;padding:14px 16px 6px;color:inherit!important;text-decoration:none}
.rgc-lg,.rgc-time,.rgc-fin,.rgc-live{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:#1B2531;font:800 13px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;letter-spacing:.6px;color:#A3AFBD}
.rgc-live{background:rgba(255,107,107,.16);color:#FF6B6B}.rgc-live::before{content:"";width:7px;height:7px;border-radius:50%;background:#FF6B6B;animation:gcb 1.4s infinite}
.rgc-cols{margin-left:auto;display:grid;grid-template-columns:repeat(3,62px);gap:4px;text-align:center}.rgc-cols i{font:800 13px/1 "Barlow Condensed",sans-serif;font-style:normal;letter-spacing:1px;color:#A3AFBD}
.rgc-row{display:flex;align-items:center;gap:10px;padding:8px 14px}
.rgc-row .tmk{flex:none;filter:drop-shadow(0 2px 3px rgba(0,0,0,.45))}
.rgc-t{flex:1;min-width:0}.rgc-t b{display:block;font:800 30px/1.05 "Barlow Condensed",sans-serif;letter-spacing:.3px}.rgc-t small{display:block;font-size:13px;color:#A3AFBD;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rgc-sc{font:800 40px/1 "Barlow Condensed",sans-serif;font-variant-numeric:tabular-nums;color:#A3AFBD;min-width:40px;text-align:right}.rgc-row.rgc-w .rgc-sc{color:#F4F7FA}
.rgc-cells{display:grid;grid-template-columns:repeat(3,62px);gap:4px;flex:none}
.rgc .rb-c{width:62px;height:54px;border-radius:12px;border:1px solid rgba(255,255,255,.09);background:#1B2531;color:#A3AFBD;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font:700 13px/1 -apple-system,sans-serif;padding:0;cursor:pointer}
.rgc .rb-c b{font:800 19px/1 "Barlow Condensed",sans-serif;color:#3DB8FF}.rgc .rb-c.rgc-sel{background:#3DB8FF;border-color:#3DB8FF;color:#0A0F15}.rgc .rb-c.rgc-sel b{color:#0A0F15}.rgc .rb-c.rgc-off{opacity:.45;cursor:default}
.rgc-dot{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:#1B2531;font:800 13px sans-serif}
.rgc-who{display:flex;align-items:center;margin-top:4px}.rgc-who>*{margin-right:-6px}.rgc-who em{font-style:normal;font:700 13px/1 -apple-system,sans-serif;color:#A3AFBD;margin-left:12px}
.rgc-tot,.rgc-seal{display:flex;align-items:center;gap:8px;padding:8px 16px 12px;border-top:1px solid rgba(255,255,255,.06);font:800 13px/1 -apple-system,sans-serif;letter-spacing:.6px;color:#A3AFBD}.rgc-tot .rgc-who,.rgc-seal .rgc-who{margin-top:0;margin-right:8px}
.rgc-seal span:first-child{background:rgba(242,193,78,.14);color:#F2C14E;padding:4px 10px;border-radius:999px}
.rgc>*:last-child{padding-bottom:12px}
@keyframes gcb{50%{opacity:.3}}@media (prefers-reduced-motion:reduce){.rgc-live::before{animation:none}}`;
  if (typeof document !== 'undefined') { const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); }
  window.GameCard = { html, cell, REG, key, homeSpread };
})();
