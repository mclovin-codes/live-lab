/* One Slip card (owner: Gold), used wherever a Slip shows: Me, slips.html, other players' profiles, the Lounge, the Stack sheet.
 * Structure after the founder's 12:35 AM reference (behaviour only; the team's own look and scale; Rush words):
 *   head: the title ("5-pick parlay", or for a straight the one selection with its mark), the combined price, a status pill
 *         (Open, Live, Won, Lost), and stake and pays on one line;
 *   a parlay is collapsed to one line of its leg names, with View legs / Hide legs; a straight shows in full;
 *   a leg: a status ring, the mark (player mark with the number for a prop, team mark for a side, a neutral O/U disc for a total),
 *          the short name in bold, the market in small text, the price at the right; under it a game strip with both marks and codes
 *          and the kickoff before, the score and clock during, FINAL and the score after;
 *   same-game legs sit under a sub-header with their own price, and share one game strip;
 *   footer: when it was placed.
 * Sealed rules: opts.sealed (another player's Slip) shows a leg as its game only until that leg's kickoff, and stake, price and pays stay
 * sealed while any leg is. A visitor (not entered) sees another player's Slip as its games only, even after kickoff.
 * API: SlipCard.html(slip, {sealed, open}) -> string. SlipCard.filter(slips, 'all'|'open'|'live'|'settled'). SlipCard.chips(active, counts?).
 * Accepts the store's Slip {legs:[{league, gameId, g, label, market|t, line, odds|price, side, spec, player, playerId, stat, status|st}],
 * stake, odds|price, win|toPay|pay, status, at, kind, same} and the older single pick shape. Short market names: Rush.mktName(leg) when present. */
(function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => Math.round(+n || 0).toLocaleString('en-US');
  const am = o => { o = Math.round(+o); return isFinite(o) && o ? (o > 0 ? '+' + o : String(o)) : ''; };
  const dec = o => o > 0 ? 1 + o / 100 : 1 + 100 / -o;
  const toAm = d => d >= 2 ? (d - 1) * 100 : -100 / (d - 1);
  const games = () => { try { return (window.RW && RW.cached && RW.cached()) || []; } catch (e) { return []; } };
  const gameOf = (id, g) => g || games().find(x => String(x.id) === String(id)) || null;
  const started = g => !!g && (g.state !== 'pre' || Date.now() >= g.date);
  function until(t) { const d = Math.max(0, t - Date.now()), h = Math.floor(d / 36e5), m = Math.floor(d % 36e5 / 6e4); return h >= 24 ? Math.floor(h / 24) + 'd ' + (h % 24) + 'h' : h ? h + 'h ' + m + 'm' : m + 'm'; }
  const when = t => new Date(t).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });
  const legState = s => s === 'won' || s === 'hit' ? 'hit' : s === 'lost' || s === 'miss' ? 'miss' : s === 'push' || s === 'void' ? 'push' : 'open';
  const cap = s => String(s || '').replace(/(^|\s)\S/g, c => c.toUpperCase());
  const STAT = { points: 'Points', rebounds: 'Rebounds', assists: 'Assists', threes: '3-pointers', goals: 'Goals', shots: 'Shots on goal', saves: 'Saves', passYds: 'Passing yards', rushYds: 'Rushing yards', recYds: 'Receiving yards', receptions: 'Receptions', td: 'Anytime TD', anytd: 'Anytime TD' };
  const sideOf = l => { const s = l.side != null ? l.side : l.spec && l.spec.side; return s === 'o' ? 'over' : s === 'u' ? 'under' : s; };
  const kindOf = l => { const k = l.market || l.t || (l.spec && l.spec.k) || (l.player ? 'prop' : ''); return k === 'moneyline' ? 'ml' : k === 'props' ? 'prop' : k; };
  // The player's number and team come from the game's leaders (the store's feed), matched by id, then by name.
  function who(l, g) {
    if (!g) return null; const L = [];
    ['away', 'home'].forEach(s => (g[s] && g[s].leaders || []).forEach(x => L.push(Object.assign({ side: s }, x))));
    (g.propsFrom || []).forEach(x => L.push(Object.assign({ side: x.team }, x)));
    const hit = L.find(x => l.playerId && String(x.id) === String(l.playerId)) || L.find(x => x.name && l.player && x.name === l.player);
    return hit ? { num: hit.jersey, team: g[hit.side] } : null;
  }
  function selName(l) { try { if (window.Rush && Rush.selName) return Rush.selName(l) || null; } catch (e) {} return null; }
  function mkName(l) { try { if (window.Rush && Rush.mktName) { const n = String(Rush.mktName(l) || ''); if (n) return n[0].toUpperCase() + n.slice(1); } } catch (e) {} return null; }
  // Short name, market and mark for one leg.
  function view(l) {
    const g = l.g, k = kindOf(l), s = sideOf(l), line = l.line != null && l.line !== 'null' ? +l.line : null;
    const team = g && (s === 'home' || s === 'away') ? g[s] : null, TM = window.TeamMark;
    if (l.player) {
      const p = who(l, g), num = l.num != null ? l.num : l.jersey != null ? l.jersey : p && p.num;
      let tm = (l.team && typeof l.team === 'object') ? l.team : null;
      if (!tm && typeof l.team === 'string') tm = (g && [g.home, g.away].find(t => t && String(t.abbr).toUpperCase() === l.team.toUpperCase())) || { abbr: l.team, color: l.teamColor, alt: l.teamAlt };
      if (!tm && p) tm = p.team;
      const st = STAT[l.stat] || cap(String(l.stat || '').replace(/([a-z])([A-Z])/g, '$1 $2'));
      const mk = mkName(l) || (s === 'over' || s === 'under' ? cap(s) + ' ' + (line != null ? line : '') + ' ' + st : st || 'Player prop');
      const safeNum = /^d{1,3}$/.test(String(num == null ? '' : num)) ? String(num) : null;
      if (tm) tm = { abbr: String(tm.abbr || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 4), name: tm.name, color: tm.color, alt: tm.alt };
      const mark = TM ? TM.player(l.league || (g && g.league), tm || {}, safeNum != null ? safeNum : (tm ? null : '#'), 40) : '';
      return { name: l.player, market: (l.mname || mk).trim(), mark };
    }
    if (k === 'total') {
      const ou = s === 'under' ? 'Under' : 'Over';
      return { name: ou + (line != null ? ' ' + line : ''), market: mkName(l) || 'Total', mark: `<span class="sc-ou">${ou[0]}</span>` };
    }
    const ab = team ? team.abbr : String(l.label || '').split(' ')[0];
    const mark = TM && team ? TM.svg(l.league || g.league, team, 40) : `<span class="sc-ou">${esc(String(ab).slice(0, 3))}</span>`;
    if (k === 'spread') return { name: selName(l) || ab + (line != null ? ' ' + (line > 0 ? '+' : '') + line : ''), market: mkName(l) || 'Spread', mark };
    if (k === 'ml') return { name: ab, market: mkName(l) || 'Moneyline', mark };
    return { name: String(l.label || 'Pick').replace(/ to win$/, ''), market: mkName(l) || cap(k) || 'Pick', mark };
  }
  function norm(p) {
    const raw = p.raw || p;
    const legs = (raw.legs && raw.legs.length ? raw.legs : [raw]).map(l => {
      const g = gameOf(l.gameId, l.g);
      const game = l.game || (g ? g.away.abbr + ' at ' + g.home.abbr : '');
      if (l.sealed) return { sealed: true, game: game || 'Sealed leg', gameId: l.gameId, g: g || (l.start ? { state: 'pre', date: +l.start } : null), st: 'open' };
      return Object.assign({}, l, { g, game, label: l.label || l.sel || 'Pick', price: l.price != null ? l.price : l.odds, st: legState(l.status || l.st || (raw.legs ? 'open' : raw.status)) });
    });
    const price = raw.price != null ? raw.price : raw.odds != null ? raw.odds : (legs.length > 1 ? toAm(legs.reduce((a, l) => a * dec(+l.price || -110), 1)) : legs[0].price);
    const stake = +raw.stake || 0, toPay = raw.toPay != null ? +raw.toPay : raw.pay != null && raw.status !== 'open' ? +raw.pay : raw.kind && raw.win != null ? +raw.win : stake + (raw.win != null ? +raw.win : (price ? stake * (dec(+price) - 1) : 0));
    return { legs, stake, price, toPay, status: legState(raw.status), paid: raw.pay, kind: raw.kind, same: raw.same, at: raw.at, id: raw.id, livePick: !!(raw.live || legs.some(l => l.live)) };
  }
  const LOCK = '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
  const ring = st => `<i class="sc-r sr-${st}">${st === 'hit' ? '✓' : st === 'miss' ? '✗' : st === 'push' ? '=' : st === 'sealed' ? LOCK : ''}</i>`;
  const isLive = s => s.status === 'open' && s.legs.some(l => l.g && l.g.state === 'in' && l.st === 'open');
  // The game strip under a leg (or a same-game group).
  function strip(g) {
    if (!g || !g.home) return '';
    const TM = window.TeamMark, m = t => TM ? TM.svg(g.league, t, 28) : '';
    const live = g.state === 'in', fin = g.done || g.state === 'post', sc = live || fin;
    const mid = live ? `<span class="sc-gl">${esc(g.detail || 'LIVE')}</span>` : fin ? '<span class="sc-gf">FINAL</span>' : `<span class="sc-gt">${esc(when(g.date))}</span>`;
    return `<div class="sc-g">${m(g.away)}<b>${esc(g.away.abbr)}</b>${sc ? `<em>${esc(g.away.score == null ? '' : g.away.score)}</em>` : ''}${mid}${sc ? `<em>${esc(g.home.score == null ? '' : g.home.score)}</em>` : ''}<b>${esc(g.home.abbr)}</b>${m(g.home)}</div>`;
  }
  function html(p, opts) {
    opts = opts || {}; const s = norm(p), n = s.legs.length, parlay = n > 1;
    let vis = false; try { vis = !!opts.sealed && !!(window.Rush && Rush.entered && !Rush.entered()); } catch (e) {}
    const sealedLeg = l => l.sealed || vis || (opts.sealed && !started(l.g));
    const anySealed = s.legs.some(sealedLeg), allSealed = s.legs.every(sealedLeg);
    const live = isLive(s);
    const pill = vis ? '<span class="sc-st sp-sealed">ENTER TO SEE</span>' : s.status === 'hit' ? '<span class="sc-st sp-hit">Won</span>' : s.status === 'miss' ? '<span class="sc-st sp-miss">Lost</span>' : s.status === 'push' ? '<span class="sc-st">Push</span>' : allSealed ? '<span class="sc-st sp-sealed">Sealed</span>' : live ? '<span class="sc-st sp-live">Live</span>' : '<span class="sc-st sp-open">Open</span>';
    const V = s.legs.map(l => sealedLeg(l) ? null : view(l));
    const lp = s.livePick && !anySealed ? '<span class="sc-lp">Live pick</span>' : '';
    const paysWord = s.status === 'hit' || s.status === 'miss' ? 'Paid' : 'Pays';
    const money = vis ? `<div class="sc-m sc-vb" aria-hidden="true">Stake <b>000</b> · Pays <b>0,000</b></div>`
      : anySealed ? '<div class="sc-m">Stake <b>sealed</b> · Pays <b>sealed</b></div>'
      : `<div class="sc-m">${lp}Stake <b>${fmt(s.stake)}</b> · ${paysWord} <b class="${s.status === 'hit' ? 'sm-hit' : s.status === 'miss' ? 'sm-miss' : ''}">${s.status === 'miss' ? '0' : fmt(s.status === 'hit' && s.paid != null ? s.paid : s.toPay)}</b></div>`;
    const placed = s.at && !opts.sealed ? `<div class="sc-ft">Placed ${esc(when(s.at))}</div>` : '';
    const priceTxt = anySealed ? '' : `<span class="sc-pr">${esc(am(s.price))}</span>`;
    const cls = `sc rsc ${vis || anySealed ? 'sc-x-sealed' : 'sc-x-' + s.status}${!vis && !anySealed && live ? ' sc-x-live' : ''}${parlay ? ' sc-x-par' : ''}${opts.open ? ' sc-xp' : ''}`;
    // A straight: the selection is the title, with its mark; the game strip under it.
    if (!parlay) {
      const l = s.legs[0], v = V[0];
      if (!v) return `<div class="${cls}"><div class="sc-hd">${ring('sealed')}<div class="sc-t"><b>Slip</b><small>${vis ? 'Sides and stakes open when you enter' : 'Opens at kickoff' + (l.g && !started(l.g) ? ', in ' + until(l.g.date) : '')}</small></div>${pill}</div>${money}${strip(l.g)}${placed}</div>`;
      return `<div class="${cls}"><div class="sc-hd">${ring(l.g && l.g.state === 'in' && l.st === 'open' ? 'live' : l.st)}<span class="sc-mk">${v.mark}</span><div class="sc-t"><b>${esc(v.name)}</b><small>${esc(v.market)}</small></div><div class="sc-rt">${priceTxt}${pill}</div></div>${money}${strip(l.g)}${placed}</div>`;
    }
    // A parlay: title, price, pill, money, the summary line, then the legs (collapsed by default).
    const names = s.legs.map((l, i) => V[i] ? V[i].name : l.game).filter(Boolean);
    const groups = []; s.legs.forEach((l, i) => { const k = l.gameId || l.game || i; let gr = groups.find(x => x.k === k); if (!gr) groups.push(gr = { k, g: l.g, idx: [] }); gr.idx.push(i); });
    const legRow = i => { const l = s.legs[i], v = V[i];
      if (!v) return `<div class="sc-leg">${ring('sealed')}<span class="sc-mk"><span class="sc-ou">?</span></span><div class="sc-t"><b>${esc(l.game || 'Sealed leg')}</b><small>${vis ? 'Opens when you enter' : 'Sealed until kickoff' + (l.g && !started(l.g) ? ', in ' + until(l.g.date) : '')}</small></div></div>`;
      const lv = l.g && l.g.state === 'in' && l.st === 'open';
      return `<div class="sc-leg sc-x-${l.st}">${ring(lv ? 'live' : l.st)}<span class="sc-mk">${v.mark}</span><div class="sc-t"><b>${esc(v.name)}</b><small>${esc(v.market)}</small></div><span class="sc-p">${esc(am(l.price))}</span></div>`; };
    const body = groups.map(gr => {
      if (gr.idx.length < 2) return legRow(gr.idx[0]) + strip(gr.g);
      const sealedG = gr.idx.some(i => !V[i]), gp = sealedG ? '' : ` · ${esc(am(toAm(gr.idx.reduce((a, i) => a * dec(+s.legs[i].price || -110), 1))))}`;
      return `<div class="sc-sg">${gr.idx.length}-pick same game${gp}</div>` + gr.idx.map(legRow).join('') + strip(gr.g);
    }).join('');
    const title = vis || allSealed ? `Parlay · ${n} legs` : `${n}-pick parlay`;
    return `<div class="${cls}"><div class="sc-hd"><div class="sc-t"><b class="sc-ti">${esc(title)}${priceTxt ? ' ' + priceTxt : ''}</b><small class="sc-sum">${esc(names.join(', '))}</small></div>${pill}</div>${money}<div class="sc-body">${body}</div><button type="button" class="sc-tog" aria-expanded="${opts.open ? 'true' : 'false'}"><span class="v">View legs</span><span class="h">Hide legs</span></button>${placed}</div>`;
  }
  // The Slips list filters: All, Open, Live, Settled.
  function filter(slips, f) {
    f = f || 'all'; return (slips || []).filter(p => { const s = norm(p); if (f === 'all') return true; if (f === 'settled') return s.status !== 'open'; const lv = isLive(s); return f === 'live' ? lv : s.status === 'open' && !lv; });
  }
  function chips(active, counts) {
    active = active || 'all'; counts = counts || {};
    return `<div class="sc-chips" role="tablist">${[['all', 'All'], ['open', 'Open'], ['live', 'Live'], ['settled', 'Settled']].map(([k, t]) => `<button type="button" role="tab" data-scf="${k}" class="${k === active ? 'on' : ''}" aria-selected="${k === active}">${t}${counts[k] != null ? ' · ' + counts[k] : ''}</button>`).join('')}</div>`;
  }
  // View legs / Hide legs: one listener for every card on the page.
  if (typeof document !== 'undefined') document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('.sc-tog'); if (!b) return; const c = b.closest('.sc'); if (!c) return; const o = c.classList.toggle('sc-xp'); b.setAttribute('aria-expanded', o ? 'true' : 'false'); });
  const CSS = `div.sc.rsc{display:block;position:static;gap:0;text-decoration:none;background:#141C26;border:1px solid rgba(255,255,255,.09);border-radius:20px;margin-top:10px;overflow:hidden;font:400 15px/1.35 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#F4F7FA;padding:4px 0 2px}
.sc.sc-x-hit{border-color:rgba(61,214,140,.45)}.sc.sc-x-miss{border-color:rgba(255,107,107,.3)}.sc.sc-x-live{border-color:rgba(255,107,107,.45)}
.sc-hd{display:flex;align-items:center;gap:10px;padding:12px 14px 4px}
.sc-t{flex:1;min-width:0}.sc-t b{display:block;font-size:17px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sc-t small{display:block;color:#A3AFBD;font-size:13px;margin-top:1px}
.sc-ti{font:800 22px/1.1 "Barlow Condensed",-apple-system,sans-serif!important;letter-spacing:.2px}.sc-ti .sc-pr{color:#3DB8FF;margin-left:6px}
.sc-sum{white-space:normal!important;display:-webkit-box!important;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.sc-rt{display:flex;flex-direction:column;align-items:flex-end;gap:5px}.sc-pr{font:800 20px/1 "Barlow Condensed",-apple-system,sans-serif;font-variant-numeric:tabular-nums;color:#3DB8FF}
.sc-st{flex:none;font-size:13px;font-weight:800;letter-spacing:.4px;padding:4px 11px;border-radius:999px;background:rgba(255,255,255,.08);color:#A3AFBD}
.sc-st.sp-open{background:rgba(61,184,255,.14);color:#3DB8FF}.sc-st.sp-hit{background:rgba(61,214,140,.18);color:#3DD68C}.sc-st.sp-miss{background:rgba(255,107,107,.16);color:#FF6B6B}.sc-st.sp-live{background:rgba(255,107,107,.16);color:#FF6B6B}.sc-st.sp-sealed{background:rgba(242,193,78,.14);color:#F2C14E}
.sc-m{padding:6px 14px 8px;color:#A3AFBD;font-size:15px}.sc-m b{font:800 20px/1 "Barlow Condensed",-apple-system,sans-serif;font-variant-numeric:tabular-nums;color:#F4F7FA;margin-left:3px}.sc-m b.sm-hit{color:#3DD68C}.sc-m b.sm-miss{color:#FF6B6B}
.sc-mk{flex:none;width:40px;height:40px;display:grid;place-items:center}.sc-mk .tmk{filter:drop-shadow(0 2px 3px rgba(0,0,0,.45))}
.sc-ou{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:#1B2531;border:1px solid rgba(255,255,255,.12);font:800 17px/1 "Barlow Condensed",sans-serif;color:#C9D2DC}
.sc-r{width:26px;height:26px;flex:none;border-radius:50%;display:grid;place-items:center;font-style:normal;font-weight:900;font-size:14px;box-shadow:inset 0 0 0 2px #5E6A77}
.sc-r.sr-live{box-shadow:inset 0 0 0 2px #FF6B6B;animation:scb 1.4s infinite}.sc-r.sr-hit{background:#3DD68C;color:#0A0F15;box-shadow:none}.sc-r.sr-miss{background:#FF6B6B;color:#0A0F15;box-shadow:none}.sc-r.sr-push{background:#A3AFBD;color:#0A0F15;box-shadow:none}
.sc-r.sr-sealed{background:rgba(242,193,78,.14);box-shadow:none}.sc-r.sr-sealed svg{width:13px;height:13px;stroke:#F2C14E;fill:none;stroke-width:2.4}
.sc-leg{display:flex;align-items:center;gap:10px;padding:10px 14px 6px}
.sc-p{font:800 19px/1 "Barlow Condensed",-apple-system,sans-serif;font-variant-numeric:tabular-nums;color:#F4F7FA}
.sc-leg.sc-x-miss .sc-t b{color:#A3AFBD;text-decoration:line-through;text-decoration-color:rgba(255,107,107,.7)}
.sc-g{display:flex;align-items:center;gap:7px;margin:4px 14px 8px 50px;padding:7px 10px;border-radius:12px;background:#1B2531;font-size:14px}
.sc-g b{font:800 17px/1 "Barlow Condensed",sans-serif;letter-spacing:.3px}.sc-g em{font:800 19px/1 "Barlow Condensed",sans-serif;font-style:normal;font-variant-numeric:tabular-nums}
.sc-gt,.sc-gl,.sc-gf{flex:1;text-align:center;color:#A3AFBD;font-weight:700;font-size:13px;white-space:nowrap}.sc-gl{color:#FF6B6B}
.sc-sg{margin:10px 14px 0;padding-top:10px;border-top:1px solid rgba(255,255,255,.07);font:800 16px/1 "Barlow Condensed",sans-serif;letter-spacing:.4px;color:#C9D2DC}
.sc.sc-x-par .sc-body{display:none;border-top:1px solid rgba(255,255,255,.07);margin-top:4px}.sc.sc-x-par.sc-xp .sc-body{display:block}
.sc-tog{display:block;margin:6px 14px 8px auto;min-height:36px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:none;color:#F4F7FA;font-weight:700;font-size:14px;cursor:pointer}
.sc-tog .h{display:none}.sc.sc-xp .sc-tog .h{display:inline}.sc.sc-xp .sc-tog .v{display:none}.sc-tog .v::after{content:" \\25BE"}.sc-tog .h::after{content:" \\25B4"}
.sc-lp{display:inline-block;margin-right:8px;padding:2px 8px;border-radius:999px;background:rgba(255,107,107,.16);color:#FF6B6B;font-size:13px;font-weight:800;vertical-align:2px}
.sc-ft{padding:0 14px 10px;color:#7F8B99;font-size:13px}
.sc-vb{filter:blur(6px);user-select:none;pointer-events:none}
.sc-chips{display:flex;gap:8px;overflow-x:auto;padding:2px 0 6px;scrollbar-width:none;overscroll-behavior-x:contain}.sc-chips::-webkit-scrollbar{display:none}
.sc-chips button{flex:none;min-height:38px;padding:0 16px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:none;color:#C9D2DC;font-weight:700;font-size:15px;cursor:pointer}.sc-chips button.on{background:#F4F7FA;color:#0A0F15;border-color:#F4F7FA}
@keyframes scb{50%{opacity:.35}}@media (prefers-reduced-motion:reduce){.sc-r.sr-live{animation:none}}`;
  if (typeof document !== 'undefined') { const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); }
  window.SlipCard = { html, norm, filter, chips, view };
})();
