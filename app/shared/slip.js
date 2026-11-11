/* Rush Slip (Blue, one product): one Slip across every game, minimized until you open it.
 * Loaded by shared/nav.js on every page. A tap on a price (game page) calls Rush.slip.toggle(pick); the bar above the
 * tab bar shows the count and, when the picks combine, the parlay price. Tap the bar: Parlay and Straights tabs,
 * quick-add chips and a number pad, one button that reads the stake and what it pays, then a receipt.
 * A pick: { key, league, gameId, game, start, spec, label, odds, market }. Stored on this phone under 'rush-slip-v1'.
 * Rules kept: no Max chip; the other side of a market you already hold replaces it; nothing places without a stake.
 */
(function () {
  const R = window.Rush = window.Rush || {}, K = 'rush-slip-v1';
  const load = () => { try { return JSON.parse(localStorage.getItem(K)) || []; } catch (e) { return []; } };
  const save = l => { try { localStorage.setItem(K, JSON.stringify(l)); } catch (e) {} draw(); subs.forEach(f => { try { f(l); } catch (e) {} }); };
  const subs = [];
  const fo = o => (o > 0 ? '+' : '') + Math.round(o);
  const dec = o => o > 0 ? 1 + o / 100 : 1 + 100 / Math.abs(o);
  const amer = d => d >= 2 ? Math.round((d - 1) * 100) : Math.round(-100 / (d - 1));
  const pays = (stake, o) => Math.round(stake * dec(o));
  const stk = n => Math.round(+n || 0).toLocaleString('en-US');
  const esc = x => String(x == null ? '' : x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const live = l => l.filter(p => !p.start || p.start > Date.now());
  /* ONE list of short market names for the Board, the Slip and every Slip card (the founder's 12:35 AM note). */
  const STAT = { passingYards: 'Pass yds', rushingYards: 'Rush yds', receivingYards: 'Rec yds', receptions: 'Receptions', points: 'Points', rebounds: 'Rebounds', assists: 'Assists', threePointFieldGoalsMade: 'Threes', goals: 'Goals', shots: 'Shots', saves: 'Saves' };
  function kindOf(p) { const sp = p.spec || {}; const k = sp.k || p.market || ''; if (k === 'td' || /anytime/i.test(p.label || '')) return 'td'; if (/first td|first touchdown/i.test(p.label || '')) return 'ftd'; if (k === 'prop' || p.player) return 'prop'; if (k === 'ml' || /moneyline/i.test(p.label || '')) return 'ml'; if (k === 'spread') return 'spread'; if (k === 'total' || /^(over|under) /i.test(p.label || '')) return 'total'; if (k === 'tt') return 'tt'; if (k === 'qt') return 'qt'; return k || 'pick'; }
  function mktName(p) { const sp = p.spec || {}, k = kindOf(p); if (p.mname) return p.mname; if (k === 'td') return 'Anytime TD'; if (k === 'ftd') return 'First TD'; if (k === 'prop') { const st = STAT[sp.key] || sp.stat || p.stat || 'Prop'; const ln = sp.line != null ? sp.line : p.line; return ln != null ? st + ' ' + (sp.side === 'u' || p.side === 'under' ? 'under ' : 'over ') + ln : st; } return { ml: 'Moneyline', spread: 'Spread', total: 'Total', tt: 'Team total', qt: 'Period total' }[k] || 'Pick'; }
  function selName(p) { const sp = p.spec || {}, k = kindOf(p); if (p.player) return p.player; if (p.sample) return (p.team || '') + ' sample'; if ((k === 'prop' || k === 'td' || k === 'ftd') && sp.name) return sp.name; if (k === 'ml') return String(p.label || '').replace(/ moneyline$/i, ''); return p.label || ''; }
  const games = () => { try { return (window.RW && RW.cached && RW.cached()) || []; } catch (e) { return []; } };
  const gameOf = p => games().find(g => String(g.id) === String(p.gameId) && (!p.league || g.league === p.league)) || null;
  function tm(league, t, n) { try { if (window.TeamMark && t) return '<span class="mk" style="width:' + n + 'px;height:' + n + 'px">' + TeamMark.svg(league, { abbr: t.abbr, color: t.color, alt: t.alt }, n) + '</span>'; } catch (e) {} return '<span class="mk mk0" style="width:' + n + 'px;height:' + n + 'px">' + esc((t && t.abbr) || '') + '</span>'; }
  function legMark(p) { const g = gameOf(p), k = kindOf(p), sp = p.spec || {}; if (!g) return '<span class="mk mk0" style="width:36px;height:36px"></span>';
    const side = sp.side === 'home' || sp.side === 'away' ? sp.side : null; let team = side ? g[side] : null;
    if (k === 'prop' || k === 'td' || k === 'ftd') { const ab = p.team || sp.team || ''; team = [g.home, g.away].find(t => t && (t.abbr === ab || t.id === ab)) || (sp.t === 'home' || sp.t === 'away' ? g[sp.t] : null); try { if (window.TeamMark && TeamMark.player) return '<span class="mk" style="width:36px;height:36px">' + TeamMark.player(g.league, team ? { abbr: team.abbr, color: team.color, alt: team.alt } : { abbr: '', color: '2A3644', alt: 'A3AFBD' }, String(p.jersey || ''), 36) + '</span>'; } catch (e) {} }
    if (k === 'total' || k === 'qt') return '<span class="mk mk0" style="width:36px;height:36px">' + (sp.side === 'u' || /^under/i.test(p.label || '') ? 'U' : 'O') + '</span>';
    return tm(g.league, team, 36); }
  function groups(l) { const m = new Map(); l.forEach(p => { const k = (p.league || '') + '|' + p.gameId; if (!m.has(k)) m.set(k, []); m.get(k).push(p); }); return [...m.values()]; }
  const kick = t => t ? new Date(t).toLocaleString('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', minute: '2-digit' }) : '';
  function gHead(p) { const g = gameOf(p); return '<div class="gh">' + (g ? tm(g.league, g.away, 22) + tm(g.league, g.home, 22) : '') + '<b>' + esc(p.game || '') + '</b><small>' + esc(kick(p.start)) + '</small></div>'; }
  /* picks that cannot share a parlay: a spread and a moneyline in one game (they say the same thing twice) */
  function conflict(l) { for (const gp of groups(l)) { const sp = gp.find(p => kindOf(p) === 'spread'), ml = gp.find(p => kindOf(p) === 'ml'); if (sp && ml) return selName(sp) + ' and ' + selName(ml) + ' moneyline cannot share a parlay. Place them as straights.'; } return ''; }
  function combines(l) { return l.length >= 2 && !conflict(l); }
  const hasSample = l => l.some(p => p.sample);
  function parlayOdds(l) { return amer(l.reduce((d, p) => d * dec(p.odds), 1)); }
  /* the same market on the same game replaces the other side; the same pick twice removes it */
  function toggle(p) { if ((window.Rush && window.Rush.entered && !window.Rush.entered())) { enterGate(p); return false; } let l = load(); if (l.some(x => x.key === p.key)) { l = l.filter(x => x.key !== p.key); save(l); return false; } l = l.filter(x => !(x.league === p.league && String(x.gameId) === String(p.gameId) && x.mkt && x.mkt === p.mkt)); l.push(p); save(l); return true; }
  const has = key => load().some(x => x.key === key);
  const remove = key => save(load().filter(x => x.key !== key));
  const clear = () => save([]);
  let tab = null, stake = 0, stakes = {}, receipt = null, keyTarget = 'all';
  const CSS = `body.has-slip{padding-bottom:calc(140px + env(safe-area-inset-bottom,0px))!important}
#rslip{position:fixed;left:0;right:0;bottom:calc(60px + env(safe-area-inset-bottom,0px));z-index:38;padding:6px max(12px,env(safe-area-inset-right,0px)) 6px max(12px,env(safe-area-inset-left,0px));pointer-events:none}
#rslip button{pointer-events:auto;width:100%;display:flex;align-items:center;gap:10px;min-height:52px;padding:8px 14px;border:0;border-radius:16px;background:#3DB8FF;color:#06121C;font:800 15px/18px -apple-system,BlinkMacSystemFont,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.5);cursor:pointer;text-align:left}
#rslip .rs-n{display:grid;place-items:center;min-width:28px;height:28px;border-radius:14px;background:#06121C;color:#3DB8FF;font-size:14px}#rslip .rs-t{flex:1;min-width:0}#rslip .rs-t small{display:block;font-weight:700;font-size:12px;opacity:.8}#rslip .rs-o{font-size:17px}
#rss{position:fixed;inset:0;z-index:90;background:rgba(0,0,0,.6)}html:has(#rsh){overflow:hidden}#rsh{position:fixed;left:0;right:0;bottom:0;z-index:91;max-height:90%;max-height:90dvh;display:flex;flex-direction:column;overflow:hidden;background:#141C26;border-radius:20px 20px 0 0;padding:8px max(16px,env(safe-area-inset-right,0px)) calc(16px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px));color:#F4F7FA;font:400 15px/20px -apple-system,BlinkMacSystemFont,sans-serif}
#rsh .grab{width:40px;height:5px;border-radius:3px;background:rgba(255,255,255,.25);margin:4px auto 10px}#rsh h3{margin:0 0 10px;font:800 20px/24px -apple-system,BlinkMacSystemFont,sans-serif}
#rsh .tabs{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:3px;border-radius:12px;background:#1B2531;margin-bottom:12px}#rsh .tabs button{min-height:40px;border:0;border-radius:10px;background:none;color:#A3AFBD;font:800 14px -apple-system,BlinkMacSystemFont,sans-serif}#rsh .tabs button.on{background:#2A3644;color:#F4F7FA}#rsh .tabs button:disabled{opacity:.4}
#rsh .leg{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;padding:10px 0;border-top:1px solid rgba(255,255,255,.08)}#rsh .leg b{display:block;font-weight:800}#rsh .leg small{display:block;color:#A3AFBD;font-size:13px}#rsh .leg .od{font-weight:800}
#rsh .x{width:34px;height:34px;border-radius:17px;border:0;background:#1B2531;color:#A3AFBD;font:800 16px sans-serif}
#rsh .sb{display:flex;align-items:center;gap:6px}#rsh .sb input{width:72px;padding:8px;border-radius:10px;border:2px solid #2A3A4A;background:#0A0F15;color:#F4F7FA;font:800 16px sans-serif;text-align:right}#rsh .sb input.on{border-color:#3DB8FF}
#rsh .note{color:#A3AFBD;font-size:13px;margin:8px 0}#rsh .chips{display:flex;gap:8px;margin:12px 0 8px}#rsh .chips button{flex:1;min-height:40px;border-radius:12px;border:1px solid #2A3A4A;background:#1B2531;color:#F4F7FA;font:800 14px sans-serif}
#rsh .pad{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:6px 0 12px}#rsh .pad button{min-height:46px;border-radius:12px;border:0;background:#1B2531;color:#F4F7FA;font:800 19px sans-serif}
#rsh .go{width:100%;min-height:54px;border:0;border-radius:16px;background:#3DB8FF;color:#06121C;font:800 17px/20px -apple-system,BlinkMacSystemFont,sans-serif}#rsh .go:disabled{background:#2A3644;color:#A3AFBD}
#rsh .more{display:block;width:100%;margin-top:8px;min-height:44px;border-radius:14px;border:1px solid #2A3A4A;background:none;color:#F4F7FA;font:800 15px sans-serif}
#rsh .top{flex:none}#rsh .mid{flex:1 1 auto;min-height:60px;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;margin:0 -4px;padding:0 4px}#rsh .foot{flex:none;padding-top:8px;border-top:1px solid rgba(255,255,255,.1)}
#rsh .hd{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin:0 0 10px}#rsh .hd h3{margin:0}#rsh .hd .po{font:800 20px/24px -apple-system,BlinkMacSystemFont,sans-serif;color:#3DB8FF}#rsh .clr{border:0;background:none;color:#A3AFBD;font:700 13px sans-serif;cursor:pointer;padding:6px 0}#rsh .cfm{display:flex;gap:8px;align-items:center;justify-content:space-between;padding:8px 10px;margin:0 0 10px;border-radius:12px;background:#1B2531;font-weight:700}#rsh .cfm button{min-height:36px;padding:0 12px;border-radius:10px;border:0;font:800 14px sans-serif;cursor:pointer}#rsh .cfm .y{background:#FF6B6B;color:#1A0606}#rsh .cfm .n{background:#2A3644;color:#F4F7FA}
#rsh .gh{display:flex;align-items:center;gap:6px;padding:12px 0 4px;color:#A3AFBD}#rsh .gh b{color:#F4F7FA;font-size:14px;margin-left:4px}#rsh .gh small{margin-left:auto;font-size:12px}
#rsh .mk{display:inline-grid;place-items:center;flex:none;overflow:hidden}#rsh .mk svg{width:100%;height:100%}#rsh .mk0{border-radius:50%;background:#1B2531;color:#A3AFBD;font:800 13px sans-serif}
#rsh .lg{display:grid;grid-template-columns:36px minmax(0,1fr) auto auto;gap:10px;align-items:center;padding:8px 0;border-top:1px solid rgba(255,255,255,.06)}#rsh .lg .t{min-width:0}#rsh .lg b{display:block;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#rsh .lg small{display:block;color:#A3AFBD;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#rsh .lg .od{font-weight:800;font-variant-numeric:tabular-nums}
#rsh .lg .ring{width:18px;height:18px;border-radius:50%;border:2px solid #66768A}#rsh .rcp .lg{grid-template-columns:18px 36px minmax(0,1fr) auto}
#rsh .warn{margin:8px 0;padding:10px 12px;border-radius:12px;background:rgba(245,158,11,.12);color:#F5C66B;font-size:13px;font-weight:700}
#rsh .srow{display:flex;gap:8px;align-items:center;margin:4px 0 8px}#rsh .srow .chips{flex:1;margin:0}#rsh .sbx{flex:none;min-width:92px;min-height:40px;padding:0 12px;border-radius:12px;border:2px solid #2A3A4A;background:#0A0F15;color:#F4F7FA;font:800 16px sans-serif;text-align:right;cursor:pointer}#rsh .sbx.on{border-color:#3DB8FF}
#rsh .padw{display:none}#rsh.padon .padw{display:block}#rsh .padw .pad{margin:4px 0 8px}#rsh .done{width:100%;min-height:40px;margin-bottom:8px;border-radius:12px;border:0;background:#2A3644;color:#F4F7FA;font:800 15px sans-serif}
#rsh .stakeall{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-top:1px solid rgba(255,255,255,.08);font-weight:800}`;
  function bar() { const l = live(load()); let b = document.getElementById('rslip'); document.body.classList.toggle('has-slip', !!l.length); if (!l.length || document.getElementById('rsh')) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement('div'); b.id = 'rslip'; document.body.appendChild(b); b.addEventListener('click', () => open()); }
    const c = combines(l), o = c ? parlayOdds(l) : l.length === 1 ? l[0].odds : null, s = (R.settings && R.settings().lastStake) || 25;
    b.innerHTML = `<button type="button" aria-label="Open your Slip"><span class="rs-n">${l.length}</span><span class="rs-t">${l.length === 1 ? esc(selName(l[0]) + ' · ' + mktName(l[0])) : c ? l.length + '-pick parlay' : l.length + ' straights'}<small>${o != null ? stk(s) + ' stake pays ' + stk(pays(s, o)) : 'Tap to set each stake'}</small></span>${o != null ? `<span class="rs-o">${fo(o)}</span>` : ''}</button>`; }
  function draw() { bar(); const sh = document.getElementById('rsh'); if (sh) paint(); }
  function enterGate(p) { if (document.getElementById('rsg')) return; const sc = document.createElement('div'); sc.id = 'rsg'; sc.innerHTML = '<div class="rsg-bk"></div><div class="rsg-sh" role="dialog" aria-label="Enter the week"><b>Enter the week to pick</b><span>Free. You get 1,000 Stack.</span><button type="button" class="rsg-go">Enter</button><button type="button" class="rsg-no">Not now</button></div>'; const st = document.createElement('style'); st.textContent = '#rsg{position:fixed;inset:0;z-index:95}html:has(#rsg){overflow:hidden}#rsg .rsg-bk{position:absolute;inset:0;background:rgba(0,0,0,.55)}#rsg .rsg-sh{position:absolute;left:0;right:0;bottom:0;display:flex;flex-direction:column;gap:10px;padding:20px max(16px,env(safe-area-inset-right,0px)) calc(20px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px));background:#141C26;border-radius:20px 20px 0 0;color:#F4F7FA;font:400 15px/20px -apple-system,BlinkMacSystemFont,sans-serif}#rsg b{font-size:20px;line-height:24px}#rsg span{color:#A3AFBD}#rsg button{min-height:48px;border-radius:12px;border:0;font:800 16px sans-serif;cursor:pointer}#rsg .rsg-go{background:#3DB8FF;color:#04121C}#rsg .rsg-no{background:none;color:#A3AFBD}'; sc.appendChild(st); document.body.appendChild(sc); const done = () => sc.remove(); sc.querySelector('.rsg-bk').addEventListener('click', done); sc.querySelector('.rsg-no').addEventListener('click', done); sc.querySelector('.rsg-go').addEventListener('click', () => { try { window.Rush.enter(); } catch (e) {} done(); toggle(p); }); }
  function close() { padOn = false; confirmClear = false; ['rsh', 'rss'].forEach(id => { const n = document.getElementById(id); if (n) n.remove(); }); receipt = null; draw(); }
  function open() { const l = live(load()); if (!l.length) return; tab = combines(l) ? (tab || 'parlay') : 'straight'; const last = (R.settings && +R.settings().lastStake) || 25; stake = last; stakes = {}; l.forEach(p => { stakes[p.key] = last; }); keyTarget = 'all'; receipt = null;
    const sc = document.createElement('div'); sc.id = 'rss'; sc.addEventListener('click', close); const sh = document.createElement('div'); sh.id = 'rsh'; sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-label', 'Your Slip');
    document.body.appendChild(sc); document.body.appendChild(sh); sh.addEventListener('click', onClick); sh.addEventListener('input', onInput); sh.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('input')) { e.preventDefault(); e.target.blur(); } if (e.key === 'Escape') close(); }); paint(); bar(); }
  function cash() { try { return R.me().stack; } catch (e) { return 0; } }
  let confirmClear = false, padOn = false;
  function legRow(p, rm, ring) { return '<div class="lg">' + (ring ? '<span class="ring" aria-hidden="true"></span>' : '') + legMark(p) + '<span class="t"><b>' + esc(selName(p)) + '</b><small>' + esc(mktName(p)) + '</small></span><span class="od">' + fo(p.odds) + '</span>' + (rm ? '<button class="x" data-x="' + esc(p.key) + '" aria-label="Remove ' + esc(selName(p)) + '">&#215;</button>' : '') + '</div>'; }
  function legsBy(l, rm, ring) { return groups(l).map(gp => gHead(gp[0]) + gp.map(p => legRow(p, rm, ring)).join('')).join(''); }
  function paint() { const sh = document.getElementById('rsh'); if (!sh) return; const l = live(load()), c = combines(l), why = l.length >= 2 ? conflict(l) : '';
    sh.classList.toggle('padon', padOn && !receipt);
    if (receipt) { sh.innerHTML = '<div class="top"><div class="grab"></div><div class="hd"><h3>Placed</h3><span class="po">' + (receipt.rows.length > 1 && receipt.parlay ? fo(receipt.odds) : '') + '</span></div></div><div class="mid rcp">' + (receipt.parlay ? '<div class="note" style="margin:0">' + receipt.rows.length + '-pick parlay</div>' : '') + legsBy(receipt.rows, false, true) + '</div><div class="foot"><div class="stakeall"><span>Stake ' + stk(receipt.stake) + '</span><span>Pays ' + stk(receipt.pays) + '</span></div><div class="note">' + new Date(receipt.at).toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' }) + ' ET · sealed until each kickoff</div><button class="more" data-r="keep">Keep picks in Slip</button><button class="go" data-r="done" style="margin-top:8px">Done</button></div>'; return; }
    if (!l.length) { close(); return; }
    if (tab === 'parlay' && !c) tab = 'straight';
    const o = c ? parlayOdds(l) : null;
    let top = '<div class="grab"></div><div class="hd"><h3>' + (tab === 'parlay' && c ? l.length + '-pick parlay' : l.length === 1 ? 'Your Slip' : l.length + ' straights') + '</h3><span class="po">' + (tab === 'parlay' && c ? fo(o) : l.length === 1 ? fo(l[0].odds) : '') + '</span></div>';
    top += confirmClear ? '<div class="cfm"><span>Clear all ' + l.length + ' picks?</span><span style="display:flex;gap:6px"><button class="n" data-r="keepall">Keep</button><button class="y" data-r="clearyes">Clear</button></span></div>' : '<div style="display:flex;justify-content:flex-end;margin:-6px 0 4px"><button class="clr" data-r="clear">Clear all</button></div>';
    top += '<div class="tabs"><button data-t="parlay" class="' + (tab === 'parlay' ? 'on' : '') + '"' + (c ? '' : ' disabled') + '>Parlay</button><button data-t="straight" class="' + (tab === 'straight' ? 'on' : '') + '">Straights</button></div>';
    let mid = '';
    if (l.length === 1) mid += '<div class="note" style="margin:0">Add another pick and this becomes a parlay.</div>';
    if (why) mid += '<div class="warn">' + esc(why) + '</div>';
    if (hasSample(l)) mid += '<div class="warn">Sample lines show the layout until the week&#39;s lines post. Remove them to place.</div>';
    let foot = '';
    if (tab === 'parlay' && c) { mid += legsBy(l, true, false);
      foot = '<div class="srow">' + chips() + '<button class="sbx' + (padOn ? ' on' : '') + '" data-s="all" aria-label="Stake">' + (stake ? stk(stake) : 'Stake') + '</button></div>' + pad() + '<button class="go" data-go="parlay"' + (stake > 0 && stake <= cash() && !hasSample(l) ? '' : ' disabled') + '>' + (stake > cash() ? 'Your Stack is ' + stk(cash()) : stake > 0 ? 'Place parlay · ' + stk(stake) + ' pays ' + stk(pays(stake, o)) : 'Enter stake') + '</button>'; }
    else { const tot = l.reduce((t, p) => t + (+stakes[p.key] || 0), 0), win = l.reduce((t, p) => t + (stakes[p.key] ? pays(stakes[p.key], p.odds) : 0), 0), n = l.filter(p => stakes[p.key] > 0).length;
      mid += groups(l).map(gp => gHead(gp[0]) + gp.map(p => '<div class="lg">' + legMark(p) + '<span class="t"><b>' + esc(selName(p)) + ' <span class="od">' + fo(p.odds) + '</span></b><small>' + esc(mktName(p)) + (stakes[p.key] ? ' · pays ' + stk(pays(stakes[p.key], p.odds)) : '') + '</small></span><button class="sbx' + (padOn && keyTarget === p.key ? ' on' : '') + '" data-s="' + esc(p.key) + '" aria-label="Stake for ' + esc(selName(p)) + '">' + (stakes[p.key] ? stk(stakes[p.key]) : 'Stake') + '</button><button class="x" data-x="' + esc(p.key) + '" aria-label="Remove">&#215;</button></div>').join('')).join('');
      foot = '<div class="srow">' + chips() + (l.length > 1 ? '<button class="sbx' + (padOn && keyTarget === 'all' ? ' on' : '') + '" data-s="all" aria-label="Stake all">' + (stake ? stk(stake) : 'All') + '</button>' : '') + '</div>' + pad() + '<button class="go" data-go="straight"' + (tot > 0 && tot <= cash() && !hasSample(l) ? '' : ' disabled') + '>' + (tot > cash() ? 'Your Stack is ' + stk(cash()) : tot > 0 ? 'Place ' + n + ' straight' + (n > 1 ? 's' : '') + ' · ' + stk(tot) + ' pays ' + stk(win) : 'Enter stake') + '</button>'; }
    foot += '<button class="more" data-r="add">Add picks</button>';
    const old = sh.querySelector('.mid'), y = old ? old.scrollTop : 0;
    sh.innerHTML = '<div class="top">' + top + '</div><div class="mid">' + mid + '</div><div class="foot">' + foot + '</div>';
    const nm = sh.querySelector('.mid'); if (nm) nm.scrollTop = y; }
  function chips() { return '<div class="chips">' + [10, 25, 50, 100].map(v => '<button data-c="' + v + '">+' + v + '</button>').join('') + '</div>'; }
  function pad() { return '<div class="padw"><div class="pad">' + ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '&#9003;'].map(k => '<button data-k="' + (k === '&#9003;' ? 'del' : k) + '">' + k + '</button>').join('') + '</div><button class="done" data-r="paddone">Done</button></div>'; }
  function keypad() { return `<div class="chips">${[10, 25, 50, 100].map(v => `<button data-c="${v}">+${v}</button>`).join('')}</div><div class="pad">${['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '&#9003;'].map(k => `<button data-k="${k === '&#9003;' ? 'del' : k}">${k}</button>`).join('')}</div>`; }
  function setStake(v) { v = Math.max(0, Math.min(99999, Math.round(v))); const l = live(load());
    if (tab === 'parlay') { stake = v; return; }
    if (keyTarget === 'all' || l.length === 1) { stake = v; l.forEach(p => { stakes[p.key] = v; }); } else stakes[keyTarget] = v; }
  function current() { const l = live(load()); if (tab === 'parlay') return stake; if (keyTarget === 'all' || l.length === 1) return stake || (l.length === 1 ? (stakes[l[0].key] || 0) : 0); return stakes[keyTarget] || 0; }
  function onInput(e) { const k = e.target.dataset && e.target.dataset.s; if (!k) return; keyTarget = k; const v = +String(e.target.value).replace(/[^0-9]/g, '') || 0; setStake(v); const pos = e.target.selectionStart; paint(); const n = document.querySelector(`#rsh input[data-s="${k.replace(/"/g, '\\"')}"]`); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) {} } }
  /* the price check at Place (ruling: a better price is taken, a worse one asks). Runs for picks on the game page that is open. */
  let asked = false;
  function recheck() { let q = null; try { if (typeof quote === 'function' && typeof LG !== 'undefined' && typeof ID !== 'undefined') q = sp => quote(sp); } catch (e) {} if (!q) return { ok: true };
    const l = load(); let worse = [], locked = []; l.forEach(p => { try { if (p.league !== LG || String(p.gameId) !== String(ID)) return; } catch (e) { return; } const r = q(p.spec); if (!r || !r.ok) { locked.push(p.label); return; } if (r.odds !== p.odds) { if (dec(r.odds) < dec(p.odds)) worse.push(p.label + ' ' + fo(p.odds) + ' to ' + fo(r.odds)); p.odds = r.odds; } });
    try { localStorage.setItem(K, JSON.stringify(l)); } catch (e) {}
    if (locked.length) return { ok: false, why: locked.join(', ') + ' is locked. Remove it to place.' };
    if (worse.length && !asked) { asked = true; return { ok: false, why: 'Price moved: ' + worse.join(', ') + '. Tap again to place at the new price.' }; }
    return { ok: true }; }
  function place() { if (hasSample(live(load()))) return msg('Remove the sample lines to place.'); const ck = recheck(); if (!ck.ok) { paint(); return msg(ck.why); } asked = false; const l = live(load()); const at = Date.now(); let rows = [], st = 0, py = 0;
    if (tab === 'parlay') { const o = parlayOdds(l); const p = R.place({ league: l[0].league, gameId: l[0].gameId, start: Math.min.apply(null, l.map(x => x.start || at)), game: l.map(x => x.game).join(' + '), spec: { k: 'parlay' }, label: l.length + '-leg parlay', odds: o, stake: stake, legs: l.map(x => ({ league: x.league, gameId: x.gameId, game: x.game, spec: x.spec, label: x.label, odds: x.odds, st: 'open' })) });
      if (!p) return msg('That stake is more than your Stack.'); rows = l; st = stake; py = pays(stake, o); receipt = { rows, stake: st, pays: py, at, parlay: true, odds: o }; paint(); try { R.set && R.set('lastStake', stake); } catch (e) {} return; }
    else { for (const x of l) { const s = +stakes[x.key] || 0; if (!s) continue; const p = R.place({ league: x.league, gameId: x.gameId, start: x.start, game: x.game, spec: x.spec, label: x.label, odds: x.odds, stake: s }); if (p) { rows.push(x); st += s; py += pays(s, x.odds); } } if (!rows.length) return msg('That stake is more than your Stack.'); }
    try { R.set && R.set('lastStake', tab === 'parlay' ? stake : (rows.length ? +stakes[rows[0].key] : 25)); } catch (e) {}
    receipt = { rows, stake: st, pays: py, at }; paint(); }
  function msg(t) { const sh = document.getElementById('rsh'); if (!sh) return; let n = sh.querySelector('.err'); if (!n) { n = document.createElement('div'); n.className = 'note err'; n.style.color = '#FF6B6B'; sh.appendChild(n); } n.textContent = t; }
  function onClick(e) { const b = e.target.closest('button,input'); if (!b) return;
    if (b.dataset.t && !b.disabled) { tab = b.dataset.t; paint(); return; }
    if (b.dataset.x) { remove(b.dataset.x); delete stakes[b.dataset.x]; if (!combines(live(load()))) tab = 'straight'; paint(); return; }
    if (b.dataset.s) { keyTarget = b.dataset.s; padOn = true; paint(); return; }
    if (b.dataset.c) { setStake(current() + +b.dataset.c); paint(); return; }
    if (b.dataset.k) { const k = b.dataset.k, cur = String(current() || ''); setStake(k === 'C' ? 0 : k === 'del' ? +cur.slice(0, -1) || 0 : +(cur + k)); paint(); return; }
    if (b.dataset.go) { place(); return; }
    if (b.dataset.r === 'paddone') { padOn = false; paint(); return; }
    if (b.dataset.r === 'clear') { confirmClear = true; paint(); return; }
    if (b.dataset.r === 'keepall') { confirmClear = false; paint(); return; }
    if (b.dataset.r === 'clearyes') { confirmClear = false; clear(); close(); return; }
    if (b.dataset.r === 'add') { close(); return; }
    if (b.dataset.r === 'keep') { close(); return; }
    if (b.dataset.r === 'done') { clear(); close(); return; } }
  function init() { if (!window.TeamMark && !document.querySelector('script[src^="team-mark.js"]')) { const tmk = document.createElement('script'); tmk.src = 'team-mark.js?v=m5'; tmk.onload = () => draw(); document.body.appendChild(tmk); } const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); draw(); window.addEventListener('storage', e => { if (e.key === K) draw(); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  R.slip = { list: () => live(load()), toggle, has, remove, clear, open, on: f => subs.push(f), combines, parlayOdds, conflict };
  R.mktName = mktName; R.selName = selName;
})();
