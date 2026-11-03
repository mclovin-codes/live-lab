/* Rush weekly contest store: shared/state.js (owner: Team Blue)
 *
 * One store for every page under app/. localStorage key "rush-app-v1". Include with
 *   <script src="shared/state.js"></script>   (pages in app/)   then use window.Rush.
 * Nothing here fetches ESPN except Rush.grade.sync(), which grades open picks on finals.
 *
 * WEEK
 *   Rush.week()                -> {n, id, season, opens, entryCloses, settles, label, phase}
 *                                 phase: 'open' (entry open), 'locked' (entry closed, MNF on), 'settled'
 *                                 Week 9: opens Tue 2026-11-03 00:00 ET, entry closes at MNF kickoff
 *                                 (BUF at MIN, 2026-11-09 8:15 PM ET), settles 4 h after kickoff.
 *   Rush.weekOf(date)          -> same shape for any date (weeks run Tuesday 00:00 ET to next Tuesday).
 *   Rush.clock(ms)             -> "2d 4h", "3h 12m", "4m 05s": time-left text for week clocks.
 *
 * PLAYER AND ENTRY
 *   Rush.me()                  -> {handle, entered, enteredAt, stack, units, s0, reloaded, rank, open, settled}
 *   Rush.enter(handle)         -> enters this week, 1,000 Stack. Returns false after entry closes.
 *   Rush.setHandle(name)
 *   Rush.stack()               -> Stack left to pick with (number)
 *   Rush.units()               -> Units this week = (Stack + value of open picks at stake - debt - 1,000) / 10,
 *                                 open picks counted at stake until graded.
 *   Rush.reload()              -> free once a week: 1,000 Stack back in play, Units keep counting. true/false.
 *   Rush.canReload()
 *
 * SLIP (picks across every game this week)
 *   Pick shape: {id, week, league:'nfl'|'nba'|'nhl', gameId, game:'CHI at SEA', spec:{k,...},
 *                label, odds (American), stake, win, at (ms), seq, status:'open'|'won'|'lost'|'push'|'void'|'cashed',
 *                pay, note, settled, legs?:[{league, gameId, game, spec, label, odds, st}]}
 *   Rush.place(pick)           -> deducts stake, stores pick, returns stored pick or null (no Stack / entry closed / not entered)
 *   Rush.picks(filter?)        -> array, newest first. filter: {status, league, gameId, week}
 *   Rush.settle(id, result, note, pay?) -> result 'won'|'lost'|'push'|'void'; pay defaults to stake+win, stake, 0
 *   Rush.cashOut(id, value)    -> "Close pick" at value, Stack credited
 *   Rush.updatePick(id, patch)
 *
 * FIELD (simulated, labelled SIM; same on every page and every reload)
 *   Rush.field()               -> [{id, name, sim:true, units, rank}, ..., {id:'me', name, me:true, units, rank}] sorted by Units
 *   Rush.rival()               -> this week's head-to-head opponent (a SIM row)
 *
 * SEASON
 *   Rush.season()              -> {season, weeks:[{n, units, result:'W'|'L'|'-'}], w, l, table:[{name, w, l, sim, me}]}
 *                                 A week above 1,000 at settle is a win, at or below with a settled pick a loss,
 *                                 no settled pick: not played.
 *   Rush.closeWeek()           -> records the week in the season once phase is 'settled' (idempotent).
 *
 * SETTINGS AND EVENTS
 *   Rush.settings() / Rush.set(key, value)   keys: pref ('ask'|'higher'|'any'), sound (bool), handle
 *   Rush.on(fn)                -> fn(state) after any change, in this tab and other tabs (storage event)
 *   Rush.fmt: {odds(o), stack(n), units(u), toWin(stake, odds), dec(odds)}
 *
 * GRADING
 *   Rush.grade.sync()          -> async. For each open pick whose game is final on ESPN, grades game lines
 *                                 (ml, spread, total, tt, wm, qt, qs) and props (prop, td) from the summary,
 *                                 and parlay legs. Timed markets (next, go, fd, drive, ns) are graded live by game.html.
 *   Rush.grade.final(spec, f)  -> 'won'|'lost'|'push'|'void'|null for f = {done, hs, as, line:{home:[q..], away:[q..]}, box}
 *                                 spec.side and spec.team use 'home' | 'away' (game.html maps ESPN team ids).
 */
(function () {
  const KEY = 'rush-app-v1', DAY = 864e5;
  const W9_OPEN = Date.parse('2026-11-03T05:00:00Z'); // Tue 00:00 ET
  const MNF = { 9: Date.parse('2026-11-10T01:15:00Z') }; // known MNF kickoffs; others default to Mon 8:15 PM ET
  const NAMES = ['Chalk Charlie','Dog Walker','Over Ollie','Under Ursula','Fade Frankie','Steam Stevie','Snap Sally','Ground Game Gus','Alt Line Al','Late Larry','Yolo Yuri','Heavy Favorite Hal','Plus Money Pam','Points Paulie','Dead Number Dee','Reverse Line Rex','Air Raid Ana','Goal Line Gil','Ladder Lou','Fourth Quarter Fay','All In Otis','Laying It Lena','Road Dog Ray','Rain Over Rita','Backdoor Bo','Middle Mike','Shotgun Sam','Dive Right Dot','Long Shot Lex','Closer Cass'];

  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  let S = Object.assign({ v: 1, handle: '', weeks: {}, season: {}, settings: { pref: 'ask', sound: true } }, load());
  const subs = [];
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} subs.forEach(f => { try { f(S); } catch (e) {} }); }
  window.addEventListener('storage', e => { if (e.key === KEY) { S = Object.assign(S, load()); subs.forEach(f => { try { f(S); } catch (x) {} }); } });

  /* ---------- week ---------- */
  function weekOf(d) {
    const t = d == null ? Date.now() : +new Date(d), n = 9 + Math.floor((t - W9_OPEN) / (7 * DAY));
    const opens = W9_OPEN + (n - 9) * 7 * DAY, entryCloses = MNF[n] || (opens + 6 * DAY + 20.25 * 36e5), settles = entryCloses + 4 * 36e5;
    const now = Date.now(), phase = now < entryCloses ? 'open' : now < settles ? 'locked' : 'settled';
    return { n, id: '2026-W' + String(n).padStart(2, '0'), season: 2026, opens, entryCloses, settles, label: 'Week ' + n, phase };
  }
  const week = () => weekOf();
  function clock(ms) { ms = Math.max(0, ms); const s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return d ? d + 'd ' + h + 'h' : h ? h + 'h ' + m + 'm' : m + 'm ' + String(x).padStart(2, '0') + 's'; }
  function W() { const w = week(); return S.weeks[w.id] = S.weeks[w.id] || { entered: false, s0: 1000, cash: 0, debt: 0, reloaded: false, picks: [] }; }

  /* ---------- odds ---------- */
  const fmt = {
    odds: o => o == null ? '-' : (o > 0 ? '+' : '') + o,
    stack: n => Math.round(n).toLocaleString('en-US'),
    units: u => (u >= 0 ? '+' : '-') + Math.abs(u).toFixed(1) + ' U',
    toWin: (st, o) => o > 0 ? st * o / 100 : st * 100 / -o,
    dec: o => o > 0 ? 1 + o / 100 : 1 + 100 / -o,
  };

  /* ---------- player ---------- */
  function units() { const w = W(); if (!w.entered) return 0; const open = w.picks.filter(p => p.status === 'open').reduce((a, p) => a + p.stake, 0); return (w.cash + open - (w.debt || 0) - w.s0) / 10; }
  function me() { const w = W(), f = field(), r = f.find(x => x.me); return { handle: S.handle || 'You', entered: w.entered, enteredAt: w.enteredAt, stack: w.cash, units: units(), s0: w.s0, reloaded: w.reloaded, rank: r ? r.rank : null, of: f.length, open: w.picks.filter(p => p.status === 'open').length, settled: w.picks.filter(p => p.status !== 'open').length }; }
  function enter(handle) { const wk = week(), w = W(); if (wk.phase !== 'open') return false; if (w.entered) return true; if (handle) S.handle = String(handle).slice(0, 18); w.entered = true; w.enteredAt = Date.now(); w.cash = 1000; w.s0 = 1000; save(); return true; }
  const canReload = () => { const w = W(); return w.entered && !w.reloaded && w.cash < 50 && week().phase === 'open'; };
  function reload() { const w = W(); if (!canReload()) return false; w.reloaded = true; w.debt = (w.debt || 0) + 1000; w.cash += 1000; save(); return true; }

  /* ---------- slip ---------- */
  function place(p) {
    const wk = week(), w = W(); if (!w.entered || wk.phase === 'settled') return null;
    const stake = Math.round(+p.stake * 100) / 100; if (!(stake > 0) || stake > w.cash + 1e-9 || p.odds == null) return null;
    const pick = Object.assign({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), week: wk.id, at: Date.now(), status: 'open' }, p, { stake, win: fmt.toWin(stake, p.odds) });
    w.cash -= stake; w.picks.unshift(pick); save(); return pick;
  }
  function picks(f) { const out = []; Object.values(S.weeks).forEach(w => (w.picks || []).forEach(p => out.push(p))); return out.filter(p => !f || ((!f.status || p.status === f.status) && (!f.league || p.league === f.league) && (!f.gameId || p.gameId == f.gameId) && (!f.week || p.week === f.week))).sort((a, b) => b.at - a.at); }
  function findPick(id) { for (const w of Object.values(S.weeks)) { const p = (w.picks || []).find(x => x.id === id); if (p) return [w, p]; } return [null, null]; }
  function settle(id, result, note, pay) { const [w, p] = findPick(id); if (!p || p.status !== 'open') return false; p.status = result; p.note = note || ''; p.settled = Date.now(); p.pay = pay != null ? pay : result === 'won' ? p.stake + p.win : (result === 'push' || result === 'void') ? p.stake : 0; w.cash += p.pay; save(); return true; }
  function cashOut(id, value) { const [w, p] = findPick(id); if (!p || p.status !== 'open') return false; p.status = 'cashed'; p.pay = Math.round(value); p.settled = Date.now(); w.cash += p.pay; save(); return true; }
  function updatePick(id, patch) { const [, p] = findPick(id); if (!p) return false; Object.assign(p, patch); save(); return true; }

  /* ---------- field: deterministic weekly random walk per SIM player, so every page agrees ---------- */
  function simUnits(name, wk, t) { const hours = Math.max(0, Math.min((t - wk.opens) / 36e5, (wk.settles - wk.opens) / 36e5)); let u = 0; const skill = (hash('skill' + name) - .5) * .5; for (let h = 1; h <= hours; h++) { const r = hash(name + wk.id + h); if (r < .35) u += (hash('s' + name + wk.id + h) - .48 + skill * .1) * 12; } return Math.round(u * 10) / 10; }
  /* When Red's app/week-games.js is on the page and has this week's games cached, the Field is its 30 SIM players
     picking real games and graded on real finals (RW.field). Otherwise the time-driven walk below. */
  let inSim = false; // re-entry guard: RW.field may call back into Rush.me() -> field()
  function simRows() { if (inSim) return NAMES.map((n, i) => ({ id: 'sim' + i, name: n, sim: true, units: 0 })); inSim = true; try { return simRows0(); } finally { inSim = false; } }
  function simRows0() { try { if (window.RW && RW.cached && RW.field) { const g = RW.cached(); if (g && g.length) { const r = RW.field(g); const rows = (r && r.rows || r || []).filter(x => x && x.sim !== false && x.id !== 'me'); if (rows.length) return rows.map(x => ({ id: x.id, name: x.name, sim: true, units: +x.units || 0, w: x.w, l: x.l, open: x.open })); } } } catch (e) {} const wk = week(), t = Date.now(); return NAMES.map((n, i) => ({ id: 'sim' + i, name: n, sim: true, units: simUnits(n, wk, t) })); }
  function field() { const rows = simRows(); const w = W(); if (w.entered) rows.push({ id: 'me', name: S.handle || 'You', me: true, units: units() }); rows.sort((a, b) => b.units - a.units); rows.forEach((r, i) => r.rank = i + 1); return rows; }
  function rival() { const wk = week(), f = field().filter(r => r.sim); if (!f.length) return null; const ids = f.map(r => r.id).sort(), id = ids[Math.floor(hash('rival' + (S.handle || '') + wk.id) * ids.length)]; return f.find(r => r.id === id); }

  /* ---------- season ---------- */
  function closeWeek() { const wk = week(); if (wk.phase !== 'settled') return false; const s = S.season[wk.season] = S.season[wk.season] || { weeks: {} }; if (s.weeks[wk.id]) return false; const w = S.weeks[wk.id]; const settled = w && (w.picks || []).some(p => p.status !== 'open'); s.weeks[wk.id] = { n: wk.n, units: units(), result: !w || !w.entered || !settled ? '-' : units() > 0 ? 'W' : 'L' }; save(); return true; }
  function season() {
    const wk = week(), s = S.season[wk.season] || { weeks: {} }, weeks = Object.values(s.weeks).sort((a, b) => a.n - b.n);
    const mw = weeks.filter(x => x.result === 'W').length, ml = weeks.filter(x => x.result === 'L').length;
    const done = []; for (let n = 9; n < wk.n; n++) done.push(n); // Season 1 opens Week 9
    const table = NAMES.map((n, i) => { let w = 0, l = 0; done.forEach(k => { const x = weekOf(W9_OPEN + (k - 9) * 7 * DAY + DAY), u = simUnits(n, x, x.settles); if (u > 0) w++; else l++; }); return { id: 'sim' + i, name: n, sim: true, w, l }; });
    table.push({ id: 'me', name: S.handle || 'You', me: true, w: mw, l: ml }); table.sort((a, b) => b.w - a.w || a.l - b.l); table.forEach((r, i) => r.rank = i + 1);
    return { season: wk.season, weeks, w: mw, l: ml, table };
  }

  /* ---------- grading on finals ---------- */
  const PROP = { 8: b => b.passingYards, 9: b => b.completions, 16: b => b.passingAttempts, 10: b => b.passingTouchdowns, 15: b => b.interceptions, 18: b => (b.passingYards || 0) + (b.rushingYards || 0), 12: b => b.rushingYards, 11: b => b.rushingAttempts, 21: b => b.longRushing, 13: b => b.receivingYards, 14: b => b.receptions, 19: b => b.longReception, 20: b => (b.rushingYards || 0) + (b.receivingYards || 0), 22: b => b.totalKickingPoints, 24: b => b.fieldGoalsMade, 27: b => b.totalTackles, pts: b => b.points, reb: b => b.rebounds, ast: b => b.assists, threes: b => b.threePointFieldGoalsMade, goals: b => b.goals, sog: b => b.shotsTotal };
  function finalGrade(sp, f) {
    if (!f || !f.done) return null; const hs = f.hs, as = f.as, mg = hs - as, sum = hs + as, cmp = (x, L, s) => x === L ? 'push' : (s === 'o' ? x > L : x < L) ? 'won' : 'lost';
    const H = s => s === 'home';
    switch (sp.k) {
      case 'ml': return mg === 0 ? 'push' : (H(sp.side) ? mg > 0 : mg < 0) ? 'won' : 'lost';
      case 'spread': { const x = (H(sp.side) ? mg : -mg) + sp.line; return x === 0 ? 'push' : x > 0 ? 'won' : 'lost'; }
      case 'total': return cmp(sum, sp.line, sp.side);
      case 'tt': return cmp(H(sp.team) ? hs : as, sp.line, sp.side);
      case 'wm': { if (sp.tie) return mg === 0 ? 'won' : 'lost'; const x = H(sp.side) ? mg : -mg; return x >= sp.a && x <= sp.b ? 'won' : 'lost'; }
      case 'qt': case 'qs': { const L = f.line || {}, rng = a => (a || []).slice(sp.from - 1, sp.to).reduce((s, v) => s + (+v || 0), 0), h = rng(L.home), a = rng(L.away); if (sp.k === 'qt') return cmp(h + a, sp.line, sp.side); const x = (H(sp.side) ? h - a : a - h) + sp.line; return x === 0 ? 'push' : x > 0 ? 'won' : 'lost'; }
      case 'prop': { const b = f.box && f.box[sp.aid]; if (!b) return 'void'; const v = (PROP[sp.t] || (() => null))(b); if (v == null) return 'void'; return cmp(v, sp.line, sp.side); }
      case 'td': { const b = f.box && f.box[sp.aid]; if (!b) return 'void'; return (b.rushingTouchdowns || 0) + (b.receivingTouchdowns || 0) > 0 ? 'won' : 'lost'; }
    }
    return null;
  }
  const SPORT = { nfl: 'football/nfl', nba: 'basketball/nba', nhl: 'hockey/nhl' };
  function parseBox(sum) { const box = {}; ((sum.boxscore && sum.boxscore.players) || []).forEach(t => (t.statistics || []).forEach(g => (g.athletes || []).forEach(a => { const id = a.athlete && a.athlete.id; if (!id) return; const b = box[id] = box[id] || {}; (g.keys || g.names || []).forEach((k, i) => { const v = a.stats[i]; if (String(k).includes('/') && !String(k).includes('-')) { const ks = k.split('/'), vs = String(v).split('/'); ks.forEach((x, n) => b[x] = +vs[n] || 0); } else if (String(k).includes('-') && String(v).includes('-')) { const ks = k.split('-'), vs = String(v).split('-'); b[ks[0]] = +vs[0] || 0; b[k] = v; } else b[k] = parseFloat(v) || 0; }); }))); return box; }
  async function finalOf(league, id) {
    const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${SPORT[league]}/summary?event=${id}&_=${Date.now()}`, { cache: 'no-store' }); const s = await r.json();
    const c = s.header && s.header.competitions[0]; if (!c) return null; const st = c.status.type, side = x => c.competitors.find(t => t.homeAway === x) || {};
    const ls = t => (t.linescores || []).map(l => +(l.displayValue || l.value || 0));
    return { done: !!st.completed, hs: +side('home').score || 0, as: +side('away').score || 0, line: { home: ls(side('home')), away: ls(side('away')) }, box: parseBox(s) };
  }
  async function sync() {
    const open = picks({ status: 'open' }); const games = new Map();
    open.forEach(p => (p.legs || [p]).forEach(x => { if (x.league && x.gameId) games.set(x.league + ':' + x.gameId, [x.league, x.gameId]); }));
    const finals = {}; for (const [k, [lg, id]] of games) { try { finals[k] = await finalOf(lg, id); } catch (e) {} }
    let n = 0;
    open.forEach(p => {
      if (p.legs) { let ch = false; p.legs.forEach(l => { if (l.st && l.st !== 'open') return; const r = finalGrade(l.spec, finals[l.league + ':' + l.gameId]); if (r) { l.st = r; ch = true; } }); if (ch) save(); if (p.legs.some(l => l.st === 'lost')) { settle(p.id, 'lost'); n++; return; } if (p.legs.some(l => !l.st || l.st === 'open')) return; const won = p.legs.filter(l => l.st === 'won'); if (!won.length) { settle(p.id, 'push', 'All legs pushed'); n++; return; } const d = won.reduce((a, l) => a * fmt.dec(l.odds), 1), odds = d >= 2 ? Math.round((d - 1) * 100) : Math.round(-100 / (d - 1)); settle(p.id, 'won', won.length < p.legs.length ? 'Pushed legs removed' : '', p.stake + fmt.toWin(p.stake, odds)); n++; return; }
      const r = finalGrade(p.spec, finals[p.league + ':' + p.gameId]); if (r) { settle(p.id, r, r === 'void' ? 'Did not play' : 'Final'); n++; }
    });
    return n;
  }

  window.Rush = {
    week, weekOf, clock, me, enter, setHandle: n => { S.handle = String(n || '').slice(0, 18); save(); }, stack: () => W().cash, units, reload, canReload,
    place, picks, settle, cashOut, updatePick, field, rival, season, closeWeek,
    settings: () => Object.assign({}, S.settings, { handle: S.handle }), set: (k, v) => { if (k === 'handle') S.handle = v; else S.settings[k] = v; save(); },
    on: fn => { subs.push(fn); return () => subs.splice(subs.indexOf(fn), 1); },
    fmt, grade: { sync, final: finalGrade, finalOf }, SPORT, _raw: () => S,
  };
})();
