/* Rush r4 shell: shared/nav.js (owner: Team Blue)
 * Include after shared/state.js on every page.
 * - Signed-in stand-in: the account "nickr" is assumed everywhere and enters the open week on first load (no name step).
 * - Top bar on every page: your avatar (opens your profile) and your Stack (opens the Stack sheet: Stack, rank,
 *   matchup, open Slips, Reload). Slips live here and on your profile, not in a tab.
 * - Five tabs: Home, Board, Contest (Ranks and your matchup), Lounge, Me.
 * Optional: <body data-tab="board"> forces the active tab. Exposes Rush.nav.refresh() and Rush.nav.openStack().
 */
(function () {
  const ME = 'nickr';
  /* The honest view: exactly 7 players (you, your matchup opponent, the next five by id), ranks 1 to 7, about 6 picks
     per stand-in. ?field=7 turns it on, ?field=all off; Gold's honest.js keeps it in localStorage 'rush-field'. */
  const HONEST = (() => { const q = new URLSearchParams(location.search).get('field'); try { if (q === '7') localStorage.setItem('rush-field', '7'); else if (q === 'all') localStorage.setItem('rush-field', 'all'); return localStorage.getItem('rush-field') === '7'; } catch (e) { return q === '7'; } })();
  window.Rush = window.Rush || {}; window.Rush.honest = () => HONEST;
  const RIVK = 'rush-rival-v1';
  function seven(rows) { if (!HONEST || !rows || rows.length <= 7) return rows; let pin = null; try { pin = JSON.parse(localStorage.getItem(RIVK) || 'null'); } catch (e) {}
    const me = rows.find(r => r.me), others = rows.filter(r => !r.me), riv = pin && others.find(r => String(r.id) === String(pin.id) || r.name === pin.name);
    const rest = others.filter(r => r !== riv).sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));
    const keep = [me].concat(riv ? [riv] : []).concat(rest).filter(Boolean).slice(0, 7); return rows.filter(r => keep.includes(r)); }
  function honestField() { const W = window.RW; if (W && W.field && !W.field._seven) { const of = W.field; W.field = function () { const r = seven(of.apply(W, arguments)); try { r.forEach(x => { x.rank = 1 + r.filter(y => (+y.units || 0) > (+x.units || 0) + 1e-9).length; }); } catch (e) {} return r; }; W.field._seven = true; }
    if (W && W.playerPicks && !W.playerPicks._six) { const op = W.playerPicks; W.playerPicks = function (id, games) { const ps = op.apply(W, arguments); if (!HONEST || id === 'me' || !Array.isArray(ps) || ps.length <= 6) return ps; const now = Date.now(); return ps.slice().sort((a, b) => Math.abs((a.g ? a.g.date : 0) - now) - Math.abs((b.g ? b.g.date : 0) - now)).slice(0, 6).sort((a, b) => (a.g ? a.g.date : 0) - (b.g ? b.g.date : 0)); }; W.playerPicks._six = true; } }
  honestField();
  /* Ties share a rank everywhere: rank = 1 + players with a higher Stack. */
  (function shareRanks() { const R = window.Rush; if (!R || !R.field || R.field._shared) return; const orig = R.field;
    R.field = function () { const f = seven(orig.apply(R, arguments)); try { f.forEach(r => { r.rank = 1 + f.filter(x => (+x.units || 0) > (+r.units || 0) + 1e-9).length; }); } catch (e) {} return f; };
    R.field._shared = true;
    if (R.me && !R.me._shared) { const om = R.me; R.me = function () { const m = om.apply(R, arguments); try { const f = R.field(), r = f.find(x => x.me); if (r && m) { m.rank = r.rank; m.of = f.length; } } catch (e) {} return m; }; R.me._shared = true; } })();
  /* One opponent per week: the first pairing computed is pinned, so every page shows the same matchup. */
  (function pinRival() { const R = window.Rush; if (!R || !R.rival || R.rival._pinned) return; const orig = R.rival; const K = 'rush-rival-v1';
    R.rival = function () { let wk = ''; try { wk = R.week().id; } catch (e) {} let pin = null; try { pin = JSON.parse(localStorage.getItem(K) || 'null'); } catch (e) {}
      let f = []; try { f = R.field(); } catch (e) {}
      if (pin && pin.wk === wk) { const row = f.find(r => r.sim && (r.id === pin.id || r.name === pin.name)); return row || { id: pin.id, name: pin.name, sim: true, units: 0 }; }
      const r = orig.apply(R, arguments); if (r && r.sim !== false) { try { localStorage.setItem(K, JSON.stringify({ wk, id: r.id, name: r.name })); } catch (e) {} } return r; };
    R.rival._pinned = true; })();
  const TABS = [
    ['home', 'Home', 'index.html', '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'],
    ['board', 'Board', 'board.html', '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 10h18M3 15h18M12 10v10"/>'],
    ['contest', 'Contest', 'ranks.html', '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>'],
    ['lounge', 'Lounge', 'lounge.html', '<path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4V6a1 1 0 0 1 1-1z"/><path d="M8 10h8M8 13h5"/>'],
    ['me', 'Me', 'player.html', '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>'],
  ];
  const PAGE = { 'index.html': 'home', 'board.html': 'board', 'game.html': 'board', 'ranks.html': 'contest', 'lounge.html': 'lounge', 'player.html': 'me', 'slips.html': 'me', };
  const F = '-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,sans-serif';
  const CSS = `#rnav{position:fixed;left:0;right:0;bottom:0;z-index:40;display:grid;grid-template-columns:repeat(5,1fr);background:rgba(10,15,21,.94);-webkit-backdrop-filter:saturate(180%) blur(20px);backdrop-filter:saturate(180%) blur(20px);border-top:1px solid rgba(255,255,255,.12);padding-bottom:env(safe-area-inset-bottom,0px);padding-left:env(safe-area-inset-left,0px);padding-right:env(safe-area-inset-right,0px)}
#rnav a{position:relative;min-height:56px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font:600 11px/13px ${F};color:rgba(255,255,255,.55);text-decoration:none;-webkit-tap-highlight-color:transparent}
#rnav a svg{width:26px;height:26px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
#rnav a.on{color:#3CC8FF}#rnav a.on::before{content:"";position:absolute;top:0;left:28%;right:28%;height:3px;border-radius:0 0 3px 3px;background:#3CC8FF}#rnav a:active{transform:scale(.92)}
#rnav em{position:absolute;top:5px;left:calc(50% + 8px);font:700 11px/18px ${F};font-style:normal;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#E5484D;color:#fff;text-align:center}
#rnav em.rk{background:#26323F}
body.has-rnav{padding-bottom:calc(66px + env(safe-area-inset-bottom,0px))}
#rtop{position:sticky;top:0;z-index:39;display:flex;text-align:left;align-items:center;gap:10px;padding:calc(8px + env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right,0px)) 8px max(16px,env(safe-area-inset-left,0px));background:rgba(10,15,21,.96);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,.08);font:500 14px/18px ${F};color:#fff}
#rtop a.av{display:flex;align-items:center;gap:10px;min-width:0;flex:1;color:#fff;text-decoration:none}
.rav{flex:none;display:grid;place-items:center;width:38px;height:38px;border-radius:50%;font:800 14px/1 ${F};color:#06121C;letter-spacing:.02em}
.rav.sm{width:28px;height:28px;font-size:11px}
#rtop .who{min-width:0;display:flex;flex-direction:column;align-items:flex-start;text-align:left}#rtop .who .nm{display:block;font:700 17px/21px ${F};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#rtop .who .sub{display:block;color:rgba(255,255,255,.62);font:600 12px/16px ${F};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#rtop button.stk{flex:none;display:flex;flex-direction:column;align-items:flex-end;gap:1px;min-height:44px;padding:4px 12px;border-radius:12px;border:1px solid rgba(60,200,255,.35);background:#0F2232;color:#fff;cursor:pointer;-webkit-tap-highlight-color:transparent}
#rtop button.stk:active{transform:scale(.97)}#rtop .stk b{font:800 20px/22px ${F};font-variant-numeric:tabular-nums}#rtop .stk small{font:700 10px/12px ${F};letter-spacing:.1em;color:#3CC8FF}
#rtop .stk .d{font:700 11px/12px ${F}}.up{color:#3DDC84}.dn{color:#FF6B6B}
#rsx-scrim{position:fixed;inset:0;z-index:80;background:rgba(0,0,0,.6)}
#rsx{position:fixed;left:0;right:0;bottom:0;z-index:81;max-height:86%;overflow-y:auto;background:#101821;border-radius:20px 20px 0 0;border-top:1px solid rgba(255,255,255,.12);padding:8px max(16px,env(safe-area-inset-right,0px)) calc(20px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px));color:#fff;font:400 15px/21px ${F}}
#rsx .grab{width:40px;height:5px;border-radius:3px;background:rgba(255,255,255,.25);margin:4px auto 12px}
#rsx .big{display:flex;align-items:flex-end;justify-content:space-between;gap:12px}#rsx .big b{font:800 44px/46px ${F};font-variant-numeric:tabular-nums}#rsx .lbl{font:700 11px/14px ${F};letter-spacing:.12em;color:rgba(255,255,255,.55);text-transform:uppercase}
#rsx .bar{height:10px;border-radius:5px;background:#1E2A36;margin:12px 0 4px;overflow:hidden}#rsx .bar i{display:block;height:100%;border-radius:5px}
#rsx .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0}#rsx .grid div{background:#17222D;border-radius:12px;padding:10px}#rsx .grid b{display:block;font:800 20px/24px ${F}}
#rsx h4{margin:16px 0 6px;font:700 13px/16px ${F};letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.6)}
#rsx .sl{display:grid;grid-template-columns:1fr auto;gap:10px;padding:12px 0;border-top:1px solid rgba(255,255,255,.08)}#rsx .sl b{font-weight:700}#rsx .sl small{display:block;color:rgba(255,255,255,.6);font-size:13px}
#rsx .mu{display:flex;align-items:center;gap:10px;background:#17222D;border-radius:14px;padding:12px;color:#fff;text-decoration:none}
#rsx a.btn,#rsx button.btn{display:block;width:100%;margin-top:10px;padding:14px;border:0;border-radius:14px;background:#3CC8FF;color:#06121C;text-align:center;text-decoration:none;font:800 16px/20px ${F};cursor:pointer}
#rsx a.btn.ghost{background:#1E2A36;color:#fff}`;
  const esc = x => String(x == null ? '' : x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const stk = n => Math.round(+n || 0).toLocaleString('en-US');
  const HUES = ['#3CC8FF', '#3DDC84', '#FFB020', '#FF7AB6', '#A78BFA', '#5EEAD4', '#F97316', '#FDE047'];
  function hue(s) { let h = 0; for (const c of String(s || '')) h = (h * 31 + c.charCodeAt(0)) >>> 0; return HUES[h % HUES.length]; }
  function ini(s) { const w = String(s || '?').replace(/[^A-Za-z0-9 _]/g, '').split(/[ _]+/).filter(Boolean); return ((w[0] || '?')[0] + (w[1] ? w[1][0] : (w[0] || '').slice(1, 2))).toUpperCase(); }
  /* one avatar everywhere: Rush.nav.avatar(name, small) */
  function avatar(name, small) { return `<span class="rav${small ? ' sm' : ''}" style="background:${hue(name)}" aria-hidden="true">${esc(ini(name))}</span>`; }
  function signIn() { if (!window.Rush || !Rush.me) return; try { if (Rush.wallet && Rush.wallet.setActive && Rush.wallet.active && Rush.wallet.active() !== 'rush') Rush.wallet.setActive('rush'); const m = Rush.me(); if (!m.handle || m.handle === 'You') Rush.setHandle(ME); if (!Rush.me().entered && Rush.week().phase === 'open') Rush.enter(ME); } catch (e) {} }
  function mine() { let m = { handle: ME, stack: 1000, entered: false }, rank = null, of = 0, rival = null, open = []; try { m = Rush.me(); const f = Rush.field(); const r = f.find(x => x.me); rank = (m && m.rank) || (r ? 1 + f.filter(x => (+x.units || 0) > (+r.units || 0)).length : null); of = f.length; rival = Rush.rival ? Rush.rival() : null; open = Rush.picks({ status: 'open', week: Rush.week().id }); } catch (e) {} return { m, rank, of, rival, open }; }
  function current() { const forced = document.body && document.body.dataset.tab; if (forced) return forced; const f = (location.pathname.split('/').pop() || 'index.html').toLowerCase(); if (f === 'player.html') { const u = new URLSearchParams(location.search).get('u'); return !u || u === 'me' ? 'me' : 'contest'; } return PAGE[f] || 'home'; }
  function draw() {
    let nav = document.getElementById('rnav'); if (!nav) { nav = document.createElement('nav'); nav.id = 'rnav'; nav.setAttribute('aria-label', 'Rush'); document.body.appendChild(nav); document.body.classList.add('has-rnav'); }
    const cur = current(), d = mine(); let live = ''; try { const l = JSON.parse(localStorage.getItem('rw.live') || 'null'); if (l && Date.now() - l.at < 3e5 && l.n > 0) live = String(Math.min(99, +l.n || 0)); } catch (e) {}
    const b = { lounge: live, contest: d.rank ? '#' + d.rank : '', me: d.open.length ? String(d.open.length) : '' };
    const h = TABS.map(([k, label, href, path]) => `<a href="${href}${k === 'me' ? '?u=me' : ''}" class="${k === cur ? 'on' : ''}"${k === cur ? ' aria-current="page"' : ''}><svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg><span>${label}</span>${b[k] ? `<em class="${k === 'contest' ? 'rk' : ''}">${b[k]}</em>` : ''}</a>`).join('');
    if (nav._h !== h) { nav.innerHTML = h; nav._h = h; }
  }
  function drawTop() {
    let t = document.getElementById('rtop'); if (!t) { t = document.createElement('header'); t.id = 'rtop'; document.body.insertBefore(t, document.body.firstChild); t.addEventListener('click', e => { if (e.target.closest('.stk')) openStack(); }); }
    const d = mine(), s = (d.m.entered ? (Rush.units ? 1000 + Math.round(Rush.units() * 10) : d.m.stack) : 1000), dl = s - 1000;
    const h = `<a class="av" href="player.html?u=me" aria-label="Your profile">${avatar(d.m.handle || ME)}<span class="who"><span class="nm">${esc(d.m.handle || ME)}</span><span class="sub">${HONEST ? 'Honest view, 7 players' : d.rank ? 'Rank ' + d.rank + ' of ' + d.of : 'The Field'}${d.rival ? ' · vs ' + esc(d.rival.name) : ''}</span></span></a><button type="button" class="stk" aria-label="Your Stack, ${stk(s)}. Open"><small>STACK</small><b>${stk(s)}</b><span class="d ${dl > 0 ? 'up' : dl < 0 ? 'dn' : ''}">${dl > 0 ? '+' : ''}${dl ? stk(dl) : 'even'}</span></button>`;
    if (t._h !== h) { t.innerHTML = h; t._h = h; }
  }
  function closeStack() { ['rsx', 'rsx-scrim'].forEach(id => { const n = document.getElementById(id); if (n) n.remove(); }); }
  function openStack() {
    closeStack(); const d = mine(), s = (d.m.entered ? (Rush.units ? 1000 + Math.round(Rush.units() * 10) : d.m.stack) : 1000), dl = s - 1000, pct = Math.max(2, Math.min(100, s / 20));
    const atStake = d.open.reduce((a, p) => a + (+p.stake || 0), 0);
    let rv = ''; if (d.rival) { const rs = d.rival.stack != null ? d.rival.stack : 1000 + Math.round((d.rival.units || 0) * 10); const lead = s - rs; rv = `<h4>Your matchup</h4><a class="mu" href="ranks.html">${avatar(d.m.handle, 1)}<b>${stk(s)}</b><span style="flex:1;text-align:center;font-weight:800;color:${lead >= 0 ? '#3DDC84' : '#FF6B6B'}">${lead === 0 ? 'Level' : (lead > 0 ? 'Up ' : 'Down ') + stk(Math.abs(lead))}</span><b>${stk(rs)}</b>${avatar(d.rival.name, 1)}</a>`; }
    const sc = document.createElement('div'); sc.id = 'rsx-scrim'; sc.addEventListener('click', closeStack);
    const sh = document.createElement('div'); sh.id = 'rsx'; sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-label', 'Your Stack');
    sh.innerHTML = `<div class="grab"></div><div class="lbl">Your Stack this week</div><div class="big"><b>${stk(s)}</b><span class="${dl > 0 ? 'up' : dl < 0 ? 'dn' : ''}" style="font:800 18px/24px ${F}">${dl > 0 ? '+' : ''}${dl ? stk(dl) : 'Even'} from 1,000</span></div>
<div class="bar"><i style="width:${pct}%;background:${dl >= 0 ? '#3DDC84' : '#FF6B6B'}"></i></div><div class="lbl" style="display:flex;justify-content:space-between"><span>0</span><span>1,000 start</span><span>2,000</span></div>
<div class="grid"><div><span class="lbl">Rank</span><b>${d.rank ? d.rank : '-'}<small style="font-size:13px;color:rgba(255,255,255,.55)"> of ${d.of}</small></b></div><div><span class="lbl">At stake</span><b>${stk(atStake)}</b></div><div><span class="lbl">Open</span><b>${d.open.length}</b></div></div>${rv}
<h4>Open Slips</h4>${d.open.length ? d.open.slice(0, 6).map(p => `<div class="sl"><span><b>${esc(p.label || p.market || 'Pick')}</b><small>${esc(p.game || p.matchup || '')}</small></span><span style="text-align:right"><b>${stk(p.stake)}</b><small>stake</small></span></div>`).join('') : '<p style="color:rgba(255,255,255,.6);margin:6px 0">No open Slips. Make a pick on the Board.</p>'}
<a class="btn ghost" href="slips.html">All your Slips</a>${(Rush.canReload && Rush.canReload()) ? '<button type="button" class="btn" id="rsx-rl">Use your free Reload (+1,000)</button>' : `<a class="btn" href="board.html">Go to the Board</a>`}`;
    sh.addEventListener('click', e => { if (e.target.id === 'rsx-rl') { Rush.reload(); closeStack(); refresh(); } });
    document.body.appendChild(sc); document.body.appendChild(sh);
  }
  function refresh() { draw(); drawTop(); }
  function init() { honestField(); if (!document.querySelector('script[src="shared/events.js"]')) { const es = document.createElement('script'); es.src = 'shared/events.js'; document.body.appendChild(es); } if (!document.querySelector('script[src="honest.js"]')) { const hs = document.createElement('script'); hs.src = 'honest.js'; document.body.appendChild(hs); }
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); signIn(); ['rpill-band'].forEach(id => { const n = document.getElementById(id); if (n) n.remove(); }); refresh(); if (window.Rush && Rush.on) Rush.on(refresh); setInterval(refresh, 30000); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.Rush = window.Rush || {}; window.Rush.nav = { refresh, openStack, openSwitch: openStack, avatar, hue, ini };
})();
