/* One Slip card (owner: Gold), used wherever a pick shows: Home, profiles, Slips, and the Lounge if Red loads it.
 * window.SlipCard.html(slip, opts) -> HTML string. opts.sealed: hide legs that have not kicked off (another player's Slip).
 * Accepts the store's Slip shape {legs:[{label, market, line, price|odds, gameId, game, player, stat, status}], stake, price|odds, toPay|pay|win, status}
 * and the older single pick {label, market|t, odds, stake, win, pay, status, gameId, legs?}. A parlay is one card with every leg on it. */
(function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => Math.round(+n || 0).toLocaleString('en-US');
  const am = o => { o = Math.round(+o); return isFinite(o) && o ? (o > 0 ? '+' + o : String(o)) : ''; };
  const dec = o => o > 0 ? 1 + o / 100 : 1 + 100 / -o;
  const games = () => { try { return (window.RW && RW.cached && RW.cached()) || []; } catch (e) { return []; } };
  const gameOf = (id, g) => g || games().find(x => String(x.id) === String(id)) || null;
  const started = g => !!g && (g.state !== 'pre' || Date.now() >= g.date);
  function until(t) { const d = Math.max(0, t - Date.now()), h = Math.floor(d / 36e5), m = Math.floor(d % 36e5 / 6e4); return h >= 24 ? Math.floor(h / 24) + 'd ' + (h % 24) + 'h' : h ? h + 'h ' + m + 'm' : m + 'm'; }
  const MK = { ml: 'Moneyline', moneyline: 'Moneyline', spread: 'Spread', total: 'Total', prop: 'Player prop', props: 'Player prop' };
  const legState = s => s === 'won' || s === 'hit' ? 'hit' : s === 'lost' || s === 'miss' ? 'miss' : s === 'push' || s === 'void' ? 'push' : 'open';
  function norm(p) {
    const raw = p.raw || p;
    const legs = (raw.legs && raw.legs.length ? raw.legs : [raw]).map(l => {
      const g = gameOf(l.gameId, l.g);
      return { label: l.label || l.sel || 'Pick', market: l.market || MK[l.t] || MK[l.kind] || (l.player ? 'Player prop' : ''), line: l.line, price: l.price != null ? l.price : l.odds, player: l.player, stat: l.stat,
        game: l.game || (g ? g.away.abbr + ' at ' + g.home.abbr : ''), g, st: legState(l.status || l.st || (raw.legs ? 'open' : raw.status)) };
    });
    const price = raw.price != null ? raw.price : raw.odds != null ? raw.odds : (legs.length > 1 ? (() => { const d = legs.reduce((a, l) => a * dec(+l.price || -110), 1); return d >= 2 ? (d - 1) * 100 : -100 / (d - 1); })() : legs[0].price);
    const stake = +raw.stake || 0, toPay = raw.toPay != null ? +raw.toPay : raw.pay != null && raw.status !== 'open' ? +raw.pay : stake + (raw.win != null ? +raw.win : (price ? stake * (dec(+price) - 1) : 0));
    return { legs, stake, price, toPay, status: legState(raw.status), paid: raw.pay };
  }
  const ICON = { hit: '<i class="sc-i hit">✓</i>', miss: '<i class="sc-i miss">✗</i>', push: '<i class="sc-i push">=</i>', open: '<i class="sc-i open"></i>', live: '<i class="sc-i live"></i>', sealed: '<i class="sc-i sealed"><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></i>' };
  function html(p, opts) {
    opts = opts || {}; const s = norm(p), n = s.legs.length, parlay = n > 1;
    const anySealed = !!opts.sealed && s.legs.some(l => !started(l.g));
    const kind = parlay ? (new Set(s.legs.map(l => l.game)).size === 1 ? 'Same-game parlay · ' + n + ' legs' : 'Parlay · ' + n + ' legs') : (s.legs[0].player ? 'Player prop' : s.legs[0].market || 'Straight');
    const head = s.status === 'hit' ? '<span class="sc-st hit">HIT</span>' : s.status === 'miss' ? '<span class="sc-st miss">MISSED</span>' : s.status === 'push' ? '<span class="sc-st">PUSH</span>' : anySealed ? '<span class="sc-st sealed">SEALED</span>' : s.legs.some(l => l.g && l.g.state === 'in') ? '<span class="sc-st live">LIVE</span>' : '<span class="sc-st">OPEN</span>';
    const legs = s.legs.map(l => {
      if (opts.sealed && !started(l.g)) return `<div class="sc-leg">${ICON.sealed}<div class="sc-l"><b>${esc(l.game || 'Sealed leg')}</b><small>Sealed until kickoff${l.g ? ', in ' + until(l.g.date) : ''}</small></div></div>`;
      const live = l.st === 'open' && l.g && l.g.state === 'in';
      const sub = [l.player && l.stat ? esc(l.stat) : esc(l.market), esc(l.game), live ? esc((l.g.away.score || 0) + '-' + (l.g.home.score || 0) + ' ' + (l.g.detail || '')) : l.st === 'open' && l.g && !started(l.g) ? 'in ' + until(l.g.date) : ''].filter(Boolean).join(' · ');
      return `<div class="sc-leg ${l.st}">${ICON[live ? 'live' : l.st]}<div class="sc-l"><b>${esc(l.player ? l.player + ' ' + l.label.replace(l.player, '').trim() : l.label)}${l.line != null && String(l.label).indexOf(String(l.line)) < 0 ? ' ' + esc(l.line) : ''}</b><small>${sub}</small></div><span class="sc-p">${esc(am(l.price))}</span></div>`;
    }).join('');
    const foot = anySealed ? `<div class="sc-f"><div><small>STAKE</small><b>Sealed</b></div><div><small>PRICE</small><b>Sealed</b></div><div><small>PAYS</small><b>Sealed</b></div></div>`
      : `<div class="sc-f"><div><small>STAKE</small><b>${fmt(s.stake)}</b></div><div><small>${parlay ? 'PARLAY PRICE' : 'PRICE'}</small><b>${esc(am(s.price))}</b></div><div><small>${s.status === 'hit' ? 'PAID' : s.status === 'miss' ? 'PAID' : 'PAYS'}</small><b class="${s.status === 'hit' ? 'hit' : s.status === 'miss' ? 'miss' : ''}">${s.status === 'miss' ? '0' : fmt(s.status === 'hit' && s.paid != null ? s.paid : s.toPay)}</b></div></div>`;
    return `<div class="sc ${s.status}${parlay ? ' par' : ''}"><div class="sc-h"><span class="sc-k">${esc(kind)}</span>${head}</div>${legs}${foot}</div>`;
  }
  const CSS = `.sc{background:#141C26;border:1px solid rgba(255,255,255,.1);border-radius:18px;margin-top:10px;overflow:hidden;font:400 15px/1.35 -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,sans-serif;color:#F4F7FA}
.sc.par{border-color:rgba(155,140,255,.4)}.sc.hit{border-color:rgba(61,214,140,.5)}.sc.miss{border-color:rgba(255,107,107,.35)}
.sc-h{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#1B2531}
.sc-k{font-size:13px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;color:#A3AFBD}
.sc-st{font-size:12px;font-weight:800;letter-spacing:.8px;padding:3px 9px;border-radius:999px;background:rgba(255,255,255,.08);color:#A3AFBD}
.sc-st.hit{background:rgba(61,214,140,.18);color:#3DD68C}.sc-st.miss{background:rgba(255,107,107,.16);color:#FF6B6B}.sc-st.live{background:rgba(255,107,107,.16);color:#FF6B6B}.sc-st.sealed{background:rgba(242,193,78,.14);color:#F2C14E}
.sc-leg{display:flex;align-items:center;gap:10px;padding:10px 14px;border-top:1px solid rgba(255,255,255,.06)}
.sc-leg:first-of-type{border-top:0}
.sc-l{flex:1;min-width:0}.sc-l b{display:block;font-size:16px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sc-l small{display:block;color:#A3AFBD;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sc-p{font:800 18px/1 "Barlow Condensed",-apple-system,sans-serif;font-variant-numeric:tabular-nums;color:#F4F7FA}
.sc-leg.miss .sc-l b{color:#A3AFBD;text-decoration:line-through;text-decoration-color:rgba(255,107,107,.7)}
.sc-i{width:22px;height:22px;flex:none;border-radius:50%;display:grid;place-items:center;font-style:normal;font-weight:900;font-size:13px}
.sc-i.open{box-shadow:inset 0 0 0 2px #A3AFBD}.sc-i.live{background:#FF6B6B;box-shadow:0 0 0 4px rgba(255,107,107,.2);animation:scb 1.4s infinite}.sc-i.hit{background:#3DD68C;color:#0A0F15}.sc-i.miss{background:#FF6B6B;color:#0A0F15}.sc-i.push{background:#A3AFBD;color:#0A0F15}
.sc-i.sealed{background:rgba(242,193,78,.14)}.sc-i.sealed svg{width:13px;height:13px;stroke:#F2C14E;fill:none;stroke-width:2.4}
@keyframes scb{50%{opacity:.35}}
.sc-f{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:10px 14px 12px;border-top:1px dashed rgba(255,255,255,.14)}
.sc-f small{display:block;font-size:11px;font-weight:800;letter-spacing:1px;color:#A3AFBD}.sc-f b{font:800 22px/1.1 "Barlow Condensed",-apple-system,sans-serif;font-variant-numeric:tabular-nums}.sc-f div:last-child{text-align:right}.sc-f div:nth-child(2){text-align:center}
.sc-f b.hit{color:#3DD68C}.sc-f b.miss{color:#FF6B6B}
@media (prefers-reduced-motion:reduce){.sc-i.live{animation:none}}`;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  window.SlipCard = { html, norm };
})();
