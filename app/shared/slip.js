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
  function combines(l) { return l.length >= 2; }
  function parlayOdds(l) { return amer(l.reduce((d, p) => d * dec(p.odds), 1)); }
  /* the same market on the same game replaces the other side; the same pick twice removes it */
  function toggle(p) { let l = load(); if (l.some(x => x.key === p.key)) { l = l.filter(x => x.key !== p.key); save(l); return false; } l = l.filter(x => !(x.league === p.league && String(x.gameId) === String(p.gameId) && x.mkt && x.mkt === p.mkt)); l.push(p); save(l); return true; }
  const has = key => load().some(x => x.key === key);
  const remove = key => save(load().filter(x => x.key !== key));
  const clear = () => save([]);
  let tab = null, stake = 0, stakes = {}, receipt = null, keyTarget = 'all';
  const CSS = `body.has-slip{padding-bottom:calc(140px + env(safe-area-inset-bottom,0px))!important}
#rslip{position:fixed;left:0;right:0;bottom:calc(60px + env(safe-area-inset-bottom,0px));z-index:38;padding:6px max(12px,env(safe-area-inset-right,0px)) 6px max(12px,env(safe-area-inset-left,0px));pointer-events:none}
#rslip button{pointer-events:auto;width:100%;display:flex;align-items:center;gap:10px;min-height:52px;padding:8px 14px;border:0;border-radius:16px;background:#3DB8FF;color:#06121C;font:800 15px/18px -apple-system,BlinkMacSystemFont,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.5);cursor:pointer;text-align:left}
#rslip .rs-n{display:grid;place-items:center;min-width:28px;height:28px;border-radius:14px;background:#06121C;color:#3DB8FF;font-size:14px}#rslip .rs-t{flex:1;min-width:0}#rslip .rs-t small{display:block;font-weight:700;font-size:12px;opacity:.8}#rslip .rs-o{font-size:17px}
#rss{position:fixed;inset:0;z-index:90;background:rgba(0,0,0,.6)}html:has(#rsh){overflow:hidden}#rsh{position:fixed;left:0;right:0;bottom:0;z-index:91;max-height:90%;max-height:90dvh;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;background:#141C26;border-radius:20px 20px 0 0;padding:8px max(16px,env(safe-area-inset-right,0px)) calc(16px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px));color:#F4F7FA;font:400 15px/20px -apple-system,BlinkMacSystemFont,sans-serif}
#rsh .grab{width:40px;height:5px;border-radius:3px;background:rgba(255,255,255,.25);margin:4px auto 10px}#rsh h3{margin:0 0 10px;font:800 20px/24px -apple-system,BlinkMacSystemFont,sans-serif}
#rsh .tabs{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:3px;border-radius:12px;background:#1B2531;margin-bottom:12px}#rsh .tabs button{min-height:40px;border:0;border-radius:10px;background:none;color:#A3AFBD;font:800 14px -apple-system,BlinkMacSystemFont,sans-serif}#rsh .tabs button.on{background:#2A3644;color:#F4F7FA}#rsh .tabs button:disabled{opacity:.4}
#rsh .leg{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;padding:10px 0;border-top:1px solid rgba(255,255,255,.08)}#rsh .leg b{display:block;font-weight:800}#rsh .leg small{display:block;color:#A3AFBD;font-size:13px}#rsh .leg .od{font-weight:800}
#rsh .x{width:34px;height:34px;border-radius:17px;border:0;background:#1B2531;color:#A3AFBD;font:800 16px sans-serif}
#rsh .sb{display:flex;align-items:center;gap:6px}#rsh .sb input{width:72px;padding:8px;border-radius:10px;border:2px solid #2A3A4A;background:#0A0F15;color:#F4F7FA;font:800 16px sans-serif;text-align:right}#rsh .sb input.on{border-color:#3DB8FF}
#rsh .note{color:#A3AFBD;font-size:13px;margin:8px 0}#rsh .chips{display:flex;gap:8px;margin:12px 0 8px}#rsh .chips button{flex:1;min-height:40px;border-radius:12px;border:1px solid #2A3A4A;background:#1B2531;color:#F4F7FA;font:800 14px sans-serif}
#rsh .pad{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:6px 0 12px}#rsh .pad button{min-height:46px;border-radius:12px;border:0;background:#1B2531;color:#F4F7FA;font:800 19px sans-serif}
#rsh .go{width:100%;min-height:54px;border:0;border-radius:16px;background:#3DB8FF;color:#06121C;font:800 17px/20px -apple-system,BlinkMacSystemFont,sans-serif}#rsh .go:disabled{background:#2A3644;color:#A3AFBD}
#rsh .more{display:block;width:100%;margin-top:8px;min-height:44px;border-radius:14px;border:1px solid #2A3A4A;background:none;color:#F4F7FA;font:800 15px sans-serif}
#rsh .stakeall{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-top:1px solid rgba(255,255,255,.08);font-weight:800}`;
  function bar() { const l = live(load()); let b = document.getElementById('rslip'); document.body.classList.toggle('has-slip', !!l.length); if (!l.length || document.getElementById('rsh')) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement('div'); b.id = 'rslip'; document.body.appendChild(b); b.addEventListener('click', () => open()); }
    const c = combines(l), o = c ? parlayOdds(l) : l.length === 1 ? l[0].odds : null, s = (R.settings && R.settings().lastStake) || 25;
    b.innerHTML = `<button type="button" aria-label="Open your Slip"><span class="rs-n">${l.length}</span><span class="rs-t">${l.length === 1 ? esc(l[0].label) : c ? l.length + '-pick parlay' : l.length + ' straights'}<small>${o != null ? stk(s) + ' stake pays ' + stk(pays(s, o)) : 'Tap to set each stake'}</small></span>${o != null ? `<span class="rs-o">${fo(o)}</span>` : ''}</button>`; }
  function draw() { bar(); const sh = document.getElementById('rsh'); if (sh) paint(); }
  function close() { ['rsh', 'rss'].forEach(id => { const n = document.getElementById(id); if (n) n.remove(); }); receipt = null; draw(); }
  function open() { const l = live(load()); if (!l.length) return; tab = combines(l) ? (tab || 'parlay') : 'straight'; const last = (R.settings && +R.settings().lastStake) || 25; stake = last; stakes = {}; l.forEach(p => { stakes[p.key] = last; }); keyTarget = 'all'; receipt = null;
    const sc = document.createElement('div'); sc.id = 'rss'; sc.addEventListener('click', close); const sh = document.createElement('div'); sh.id = 'rsh'; sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-label', 'Your Slip');
    document.body.appendChild(sc); document.body.appendChild(sh); sh.addEventListener('click', onClick); sh.addEventListener('input', onInput); sh.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('input')) { e.preventDefault(); e.target.blur(); } if (e.key === 'Escape') close(); }); paint(); bar(); }
  function cash() { try { return R.me().stack; } catch (e) { return 0; } }
  function paint() { const sh = document.getElementById('rsh'); if (!sh) return; const l = live(load()), c = combines(l);
    if (receipt) { sh.innerHTML = `<div class="grab"></div><h3>Placed</h3>${receipt.rows.map(r => `<div class="leg"><span><b>${esc(r.label)}</b><small>${esc(r.game)}</small></span><span class="od">${fo(r.odds)}</span><span></span></div>`).join('')}<div class="stakeall"><span>Stake ${stk(receipt.stake)}</span><span>Pays ${stk(receipt.pays)}</span></div><div class="note">${new Date(receipt.at).toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' })} ET · sealed until each kickoff</div><button class="more" data-r="keep">Keep picks in Slip</button><button class="go" data-r="done" style="margin-top:8px">Done</button>`; return; }
    if (!l.length) { close(); return; }
    let h = `<div class="grab"></div><h3>Your Slip</h3><div class="tabs"><button data-t="parlay" class="${tab === 'parlay' ? 'on' : ''}"${c ? '' : ' disabled'}>Parlay</button><button data-t="straight" class="${tab === 'straight' ? 'on' : ''}">Straights</button></div>`;
    if (l.length === 1) h += `<div class="note">Add another pick and this becomes a parlay.</div>`;
    if (tab === 'parlay' && c) { const o = parlayOdds(l); h += l.map(p => `<div class="leg"><span><b>${esc(p.label)}</b><small>${esc(p.game)}</small></span><span class="od">${fo(p.odds)}</span><button class="x" data-x="${esc(p.key)}" aria-label="Remove">&#215;</button></div>`).join('') + `<div class="stakeall"><span>${l.length}-pick parlay</span><span>${fo(o)}</span></div>` + keypad() + `<button class="go" data-go="parlay"${stake > 0 && stake <= cash() ? '' : ' disabled'}>${stake > cash() ? 'Your Stack is ' + stk(cash()) : stake > 0 ? 'Place parlay · ' + stk(stake) + ' pays ' + stk(pays(stake, o)) : 'Enter stake'}</button>`; }
    else { const tot = l.reduce((t, p) => t + (+stakes[p.key] || 0), 0), win = l.reduce((t, p) => t + (stakes[p.key] ? pays(stakes[p.key], p.odds) : 0), 0);
      h += l.map(p => `<div class="leg"><span><b>${esc(p.label)} <span class="od">${fo(p.odds)}</span></b><small>${esc(p.game)}${stakes[p.key] ? ' · pays ' + stk(pays(stakes[p.key], p.odds)) : ''}</small></span><span class="sb"><input inputmode="numeric" data-s="${esc(p.key)}" class="${keyTarget === p.key ? 'on' : ''}" value="${stakes[p.key] || ''}" placeholder="Stake" aria-label="Stake for ${esc(p.label)}"></span><button class="x" data-x="${esc(p.key)}" aria-label="Remove">&#215;</button></div>`).join('');
      if (l.length > 1) h += `<div class="stakeall"><span>Stake all</span><span class="sb"><input inputmode="numeric" data-s="all" class="${keyTarget === 'all' ? 'on' : ''}" value="${stake || ''}" placeholder="Stake"></span></div>`;
      h += keypad() + `<button class="go" data-go="straight"${tot > 0 && tot <= cash() ? '' : ' disabled'}>${tot > cash() ? 'Your Stack is ' + stk(cash()) : tot > 0 ? 'Place ' + l.filter(p => stakes[p.key] > 0).length + ' straight' + (l.filter(p => stakes[p.key] > 0).length > 1 ? 's' : '') + ' · ' + stk(tot) + ' pays ' + stk(win) : 'Enter stake'}</button>`; }
    h += `<button class="more" data-r="add">Add picks</button>`;
    const y = sh.scrollTop; sh.innerHTML = h; sh.scrollTop = y; }
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
  function place() { const ck = recheck(); if (!ck.ok) { paint(); return msg(ck.why); } asked = false; const l = live(load()); const at = Date.now(); let rows = [], st = 0, py = 0;
    if (tab === 'parlay') { const o = parlayOdds(l); const p = R.place({ league: l[0].league, gameId: l[0].gameId, start: Math.min.apply(null, l.map(x => x.start || at)), game: l.map(x => x.game).join(' + '), spec: { k: 'parlay' }, label: l.length + '-leg parlay', odds: o, stake: stake, legs: l.map(x => ({ league: x.league, gameId: x.gameId, game: x.game, spec: x.spec, label: x.label, odds: x.odds, st: 'open' })) });
      if (!p) return msg('That stake is more than your Stack.'); rows = l; st = stake; py = pays(stake, o); }
    else { for (const x of l) { const s = +stakes[x.key] || 0; if (!s) continue; const p = R.place({ league: x.league, gameId: x.gameId, start: x.start, game: x.game, spec: x.spec, label: x.label, odds: x.odds, stake: s }); if (p) { rows.push(x); st += s; py += pays(s, x.odds); } } if (!rows.length) return msg('That stake is more than your Stack.'); }
    try { R.set && R.set('lastStake', tab === 'parlay' ? stake : (rows.length ? +stakes[rows[0].key] : 25)); } catch (e) {}
    receipt = { rows, stake: st, pays: py, at }; paint(); }
  function msg(t) { const sh = document.getElementById('rsh'); if (!sh) return; let n = sh.querySelector('.err'); if (!n) { n = document.createElement('div'); n.className = 'note err'; n.style.color = '#FF6B6B'; sh.appendChild(n); } n.textContent = t; }
  function onClick(e) { const b = e.target.closest('button,input'); if (!b) return;
    if (b.dataset.t && !b.disabled) { tab = b.dataset.t; paint(); return; }
    if (b.dataset.x) { remove(b.dataset.x); delete stakes[b.dataset.x]; if (!combines(live(load()))) tab = 'straight'; paint(); return; }
    if (b.dataset.s) { keyTarget = b.dataset.s; paint(); return; }
    if (b.dataset.c) { setStake(current() + +b.dataset.c); paint(); return; }
    if (b.dataset.k) { const k = b.dataset.k, cur = String(current() || ''); setStake(k === 'C' ? 0 : k === 'del' ? +cur.slice(0, -1) || 0 : +(cur + k)); paint(); return; }
    if (b.dataset.go) { place(); return; }
    if (b.dataset.r === 'add') { close(); return; }
    if (b.dataset.r === 'keep') { close(); return; }
    if (b.dataset.r === 'done') { clear(); close(); return; } }
  function init() { const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); draw(); window.addEventListener('storage', e => { if (e.key === K) draw(); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  R.slip = { list: () => live(load()), toggle, has, remove, clear, open, on: f => subs.push(f), combines, parlayOdds };
})();
