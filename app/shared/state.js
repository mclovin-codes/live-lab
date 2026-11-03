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
 *                pay, note, settled, live (true when placed while the game was in progress),
 *                legs?:[{league, gameId, game, spec, label, odds, st}]}
 *   Rush.place(pick)           -> deducts stake, stores pick, returns stored pick or null (no Stack / entry closed / not entered)
 *   Rush.picks(filter?)        -> array, newest first. filter: {status, league, gameId, week, contest}. The Rush only unless
 *                                 contest is given (an id, or "*" for every contest). See CONTESTS below.
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
 *   Rush.grade.sync() grades weekly and contest picks alike.
 *
 * CONTESTS: ONE PLAYER, SEVERAL CONTESTS (3:05 AM addendum)
 * Contest definitions (name, schedule, rules, entrants, Ranks) live in Team Red's app/contest-kit.js (window.RC,
 * localStorage "rush-contests-v1"). This store keeps each contest's own Stack and Slip. Every pick belongs to exactly
 * one contest. The Rush weekly is the contest with id 'rush', always first. Its picks are the weekly picks above.
 * Stacks are never summed: each contest's Stack, clocks and Ranks stand alone.
 *   Rush.wallet.list()         -> [entry, ...], The Rush first, then every RC contest you own or joined (not archived or removed)
 *     entry = {id, name, color ('#00BFFF' for The Rush; each contest keeps its colour for good), weekly, owner,
 *              stack, units, rank, of, entered, opens, entryClose (ms or null), settles (ms),
 *              sports:['nfl',..], days:['YYYYMMDD',..] ([] = every day), phase:'upcoming'|'open'|'settled', open (open picks), canReload}
 *     A contest's clocks come from its own days: opens 00:00 ET on the first day, settles 4 AM ET after the last day.
 *     Days empty means the Rush week's clocks. entryClose is the contest's join deadline (null = open while it runs).
 *   Rush.wallet.get(id)        -> one entry, or null
 *   Rush.wallet.active()       -> the active contest id ('rush' by default, and if the active contest is gone)
 *   Rush.wallet.setActive(id)  -> true/false. Fires Rush.on, so every page redraws inside the new contest.
 *   Rush.wallet.current()      -> entry of the active contest
 *   Rush.wallet.color(id)      -> the contest's dot colour
 *   Rush.wallet.covers(id, {league, start}) -> {ok} or {ok:false, why}: does the contest cover this game?
 *                                 why: "Friends League: Thursday only", "Office Hoops: NBA only", "Friends League: has ended"
 *                                 The Board shows only games that covers(active, game).ok.
 *   Rush.wallet.allows(id, pick) -> covers() plus markets (live picks, parlays, player props, game lines),
 *                                 Rush.rules limits and the contest's Stack. pick = {league, gameId, start, spec, live, odds,
 *                                 label, legs?, stake?}. Without a stake, stake limits and Stack are skipped (for greying rows).
 *   Rush.wallet.place(id, pick) -> {ok, pick} or {ok:false, why}. 'rush' goes through Rush.place; a contest pick is stored
 *                                 with pick.contest = id and paid from that contest's Stack.
 *   Rush.wallet.placeMany([{id, stake}], pick) -> [{id, ok, pick?, why?}]: one confirm, several contests.
 *   Rush.wallet.picks(id, filter?) -> that contest's picks ('rush' = the weekly picks). filter as Rush.picks.
 *   Rush.wallet.reload(id)     -> The Rush: the weekly Reload. A contest: once, under 50 Stack, if its rules allow Reload.
 *   Rush.picks() stays The Rush only. Rush.picks({contest:id}) is one contest; Rush.picks({contest:'*'}) is every pick.
 *   Rush.grade.sync() grades every contest's picks and credits each contest's own Stack.
 *
 * CONTEST RULES (store side of the 2:55 AM addendum; RC keeps these on c.rules, Red's forms set them)
 *   Rush.rules.norm(r)   -> clamped copy: {stakeMin (0 = none), stakeMax (null = No max), lineMin, lineMax, slipMin, slipMax
 *                           (American odds or null = no limit; min = shortest price allowed, -200 refuses -250; max = longest,
 *                           +500 refuses +600; min and max swap if typed the wrong way round), injury:'none'|'h1'|'full',
 *                           fields:[joiner field keys], showFields:'commish'|'contest', size (typed Field size, 2..1000),
 *                           stack (typed Stack per entry, 1..1,000,000)}. Call it on create, update and decode.
 *   Rush.rules.check(r, pick) -> {ok} or {ok:false, why}. pick = {stake, odds, label, legs?:[{odds, label}]}. Stake against
 *                           stakeMin/stakeMax; each line (a single, or every parlay leg) against lineMin/lineMax; the slip's
 *                           total odds against slipMin/slipMax. why reads like "Stake over the 50 maximum".
 *   Rush.wallet.allows() and place() run check() for the contest; the pick sheet greys a contest out with the reason.
 *   Rush.rules.result(r, pick) -> {status, units, note?}: the pick's result inside a contest. With injury protection a
 *                           player prop (prop, td) whose player left injured and did not return is void, units 0
 *                           (h1: left before halftime; full: any time). In a parlay that leg is dropped and the rest
 *                           rescored. Game lines are never protected. The weekly Slip result does not change.
 *   pick.inj (and leg.inj on parlays) = {exit:true, half:1|2, at:'Q2 3:10', returned, who}: set by grade.sync on props
 *                           whose player had an injury exit. Rush.grade.injuryExits(summary, league) is the parser.
 *                           NFL play text says "SEA-L.Williams was injured during the play" and "Injury Update: CHI-J.Johnson
 *                           has returned to the game"; any later play naming him also counts as a return. NBA and NHL feeds
 *                           rarely say "injured", so there protection only applies when the text does.
 *
 * JOINER NOTE (founder ruling 3:00 AM: no payment handles of any kind; only an optional free-text note)
 *   Rush.joiner.FIELDS   -> [{k:'note', label:'Note'}]. rules.fields is ['note'] or [].
 *   Rush.joiner.NOTE     -> "Your note is shared with the commissioner." (show it on the join form)
 *   Rush.joiner.clean(f, allowed) -> {note} only: tags, links and "$" dropped, 140 chars. Any other key is discarded.
 *   Rush.joiner.get() / set(f)    -> this phone's saved note, to prefill the join form.
 *   Rush.joiner.card(contestId, f, allowed) -> code a joiner sends the commissioner (no backend);
 *   Rush.joiner.readCard(code, allowed)     -> {contest, name, fields:{note?}, at} cleaned, or null.
 *
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
  const wallets = () => Object.values(S.weeks).concat(Object.values(S.contests || {}), Object.values(S.cw || {}));
  function picks(f) { f = f || {}; const out = []; wallets().forEach(w => (w.picks || []).forEach(p => out.push(p))); return out.filter(p => ((!f.status || p.status === f.status) && (!f.league || p.league === f.league) && (!f.gameId || p.gameId == f.gameId) && (!f.week || p.week === f.week) && (f.contest === undefined ? !p.contest : f.contest === '*' || p.contest === f.contest))).sort((a, b) => b.at - a.at); }
  function findPick(id) { for (const w of wallets()) { const p = (w.picks || []).find(x => x.id === id); if (p) return [w, p]; } return [null, null]; }
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
    let exits = {}; try { exits = injuryExits(s, league); } catch (e) {}
    return { done: !!st.completed, hs: +side('home').score || 0, as: +side('away').score || 0, line: { home: ls(side('home')), away: ls(side('away')) }, box: parseBox(s), exits };
  }
  /* injury exit facts on a graded prop (pick or leg), read by contests with injury protection */
  const tagInj = (x, f) => { if (f && f.done && isProp(x.spec) && x.spec.aid && f.exits && f.exits[x.spec.aid]) x.inj = f.exits[x.spec.aid]; };
  async function sync() {
    const open = picks({ status: 'open', contest: '*' }); const games = new Map();
    // parlays settled lost early still grade their open legs, so a contest's injury protection can rescore them
    const tail = picks({ contest: '*' }).filter(p => p.status !== 'open' && p.legs && p.legs.some(l => !l.st || l.st === 'open'));
    open.concat(tail).forEach(p => (p.legs || [p]).forEach(x => { if (x.league && x.gameId) games.set(x.league + ':' + x.gameId, [x.league, x.gameId]); }));
    const finals = {}; for (const [k, [lg, id]] of games) { try { finals[k] = await finalOf(lg, id); } catch (e) {} }
    let n = 0;
    tail.forEach(p => { let ch = false; p.legs.forEach(l => { if (l.st && l.st !== 'open') return; const f = finals[l.league + ':' + l.gameId], r = finalGrade(l.spec, f); if (r) { l.st = r; tagInj(l, f); ch = true; } }); if (ch) save(); });
    open.forEach(p => {
      if (p.legs) { let ch = false; p.legs.forEach(l => { if (l.st && l.st !== 'open') return; const f = finals[l.league + ':' + l.gameId], r = finalGrade(l.spec, f); if (r) { l.st = r; tagInj(l, f); ch = true; } }); if (ch) save(); if (p.legs.some(l => l.st === 'lost')) { settle(p.id, 'lost'); n++; return; } if (p.legs.some(l => !l.st || l.st === 'open')) return; const won = p.legs.filter(l => l.st === 'won'); if (!won.length) { settle(p.id, 'push', 'All legs pushed'); n++; return; } const d = won.reduce((a, l) => a * fmt.dec(l.odds), 1), odds = d >= 2 ? Math.round((d - 1) * 100) : Math.round(-100 / (d - 1)); settle(p.id, 'won', won.length < p.legs.length ? 'Pushed legs removed' : '', p.stake + fmt.toWin(p.stake, odds)); n++; return; }
      const f = finals[p.league + ':' + p.gameId], r = finalGrade(p.spec, f); if (r) { tagInj(p, f); settle(p.id, r, r === 'void' ? 'Did not play' : 'Final'); n++; }
    });
    return n;
  }

  /* ---------- contests: one wallet (Stack and Slip) per contest the player is in; The Rush weekly is contest 'rush' ----------
     Contest definitions (name, schedule, rules, entrants) live in Red's app/contest-kit.js (window.RC, localStorage
     rush-contests-v1). This store keeps each contest's own Stack and picks, the active contest and each contest's colour. */
  const b64 = { enc: s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''), dec: s => decodeURIComponent(escape(atob(String(s).replace(/-/g, '+').replace(/_/g, '/')))) };
  const SPORTS = ['nfl', 'nba', 'nhl'], RCKEY = 'rush-contests-v1', RUSH_COLOR = '#00BFFF';
  const PALETTE = ['#F5A524', '#A78BFA', '#34D399', '#F472B6', '#FB923C', '#60A5FA', '#FACC15', '#F87171', '#2DD4BF', '#C084FC'];
  const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const ETD = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });
  const ETH = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: 'numeric', hour12: false });
  const etDay = ms => ETD.format(new Date(ms)).replace(/-/g, '');
  /* 00:00 ET on a YYYYMMDD day */
  const dayStart = d => { const s = String(d), noon = Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8), 12); const [h, m] = ETH.format(new Date(noon)).split(':').map(Number); return noon - ((h % 24) * 60 + m) * 6e4; };
  const dayName = d => DOW[new Date(dayStart(d) + 12 * 36e5).getUTCDay()];
  const dayLabel = d => { const s = String(d); return MON[+s.slice(4, 6) - 1] + ' ' + +s.slice(6, 8); };
  const ok = { ok: true }, no = why => ({ ok: false, why });
  const rid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  function defs() {
    let a = null; try { if (window.RC && typeof window.RC.list === 'function') a = window.RC.list(); } catch (e) {}
    if (!a) { try { a = Object.values((JSON.parse(localStorage.getItem(RCKEY) || '{}') || {}).c || {}); } catch (e) { a = []; } }
    return (a || []).filter(c => c && c.id && (c.owner || c.joined) && c.status !== 'archived' && !(c.removed || []).includes('me'));
  }
  const def = id => defs().find(c => c.id === id) || null;
  const cname = c => String((c && c.name) || 'Contest').slice(0, 40);
  function color(id) {
    if (id === 'rush') return RUSH_COLOR; S.colors = S.colors || {}; if (S.colors[id]) return S.colors[id];
    const used = new Set(Object.values(S.colors)); const c = PALETTE.find(x => !used.has(x)) || PALETTE[Object.keys(S.colors).length % PALETTE.length];
    S.colors[id] = c; save(); return c;
  }
  /* a contest's wallet, made the first time it is needed, with that contest's Stack per entry */
  function cw(id) {
    if (id === 'rush') return W(); const c = def(id); if (!c) return null; S.cw = S.cw || {};
    if (!S.cw[id]) { const st = Math.round(numIn((c.rules || {}).stack, 1, 1e6, 1000)); S.cw[id] = { cash: st, s0: st, debt: 0, reloaded: false, picks: [], joined: Date.now() }; save(); }
    return S.cw[id];
  }
  function span(c) { const ds = ((c.schedule || {}).days || []).slice().sort(); if (!ds.length) { const wk = week(); return { opens: wk.opens, settles: wk.settles }; } return { opens: dayStart(ds[0]), settles: dayStart(ds[ds.length - 1]) + DAY + 4 * 36e5 }; }
  function entryOf(id) {
    if (id === 'rush') { const wk = week(), m = me(); return { id, name: 'The Rush', color: RUSH_COLOR, weekly: true, owner: false, stack: m.stack, units: m.units, rank: m.entered ? m.rank : null, of: field().length, entered: m.entered, opens: wk.opens, entryClose: wk.entryCloses, settles: wk.settles, sports: SPORTS.slice(), days: [], phase: wk.phase, open: picks({ status: 'open' }).length, canReload: canReload() }; }
    const c = def(id); if (!c) return null; const w = cw(id), sp = span(c), open = w.picks.filter(p => p.status === 'open'), t = Date.now(); let rank = null, of = null;
    try { if (window.RC && window.RC.standings) { const st = window.RC.standings(c), r = st.find(x => x.me); if (r) { rank = r.finish; of = st.length; } } } catch (e) {}
    return { id, name: cname(c), color: color(id), weekly: false, owner: !!c.owner, stack: Math.round(w.cash * 100) / 100, units: Math.round(w.cash + open.reduce((a, p) => a + p.stake, 0) - w.debt - w.s0) / 10, rank, of, entered: true,
      opens: sp.opens, entryClose: +(c.schedule || {}).entryClose || null, settles: sp.settles, sports: ((c.schedule || {}).leagues || SPORTS).filter(s => SPORTS.includes(s)), days: ((c.schedule || {}).days || []).slice(),
      phase: c.status === 'closed' || t > sp.settles ? 'settled' : t < sp.opens ? 'upcoming' : 'open', open: open.length, canReload: !!(c.rules || {}).reload && !w.reloaded && w.cash < 50 };
  }
  function walletList() { return [entryOf('rush')].concat(defs().map(c => entryOf(c.id))).filter(Boolean); }
  function active() { const a = S.active; return a && a !== 'rush' && def(a) ? a : 'rush'; }
  function setActive(id) { if (id !== 'rush' && !def(id)) return false; S.active = id; save(); return true; }
  /* does this contest cover this game? g = {league, start (ms)} */
  function covers(id, g) {
    g = g || {}; if (id === 'rush') return week().phase === 'settled' ? no('The Rush: this week has settled') : ok;
    const c = def(id); if (!c) return no('You are not in that contest'); const nm = cname(c), sch = c.schedule || {}, lg = (sch.leagues || SPORTS).filter(s => SPORTS.includes(s));
    if (c.status === 'closed') return no(nm + ': closed');
    if (g.league && lg.length && !lg.includes(g.league)) return no(nm + ': ' + lg.map(x => x.toUpperCase()).join(' and ') + ' only');
    const ds = (sch.days || []).slice().sort();
    if (g.start && ds.length && !ds.includes(etDay(g.start))) { const names = [...new Set(ds.map(dayName))]; return no(nm + ': ' + (ds.length <= 2 || names.length === 1 ? names.join(' and ') + ' only' : dayLabel(ds[0]) + ' to ' + dayLabel(ds[ds.length - 1]))); }
    if (Date.now() > span(c).settles) return no(nm + ': has ended');
    return ok;
  }
  /* can this pick go in this contest? p = {league, start, spec, live, stake?, odds, label, legs?}. Without a stake, stake limits are skipped. */
  function allowsIn(id, p) {
    const cv = covers(id, p); if (!cv.ok) return cv;
    if (id === 'rush') { const w = W(); if (!w.entered) return no('The Rush: enter the week first'); if (week().phase === 'settled') return no('The Rush: this week has settled'); if (p.stake != null && +p.stake > w.cash + 1e-9) return no('The Rush: only ' + fmt.stack(w.cash) + ' Stack left'); return ok; }
    const c = def(id), nm = cname(c), m = (c.rules || {}).markets || {}, k = (p.spec && p.spec.k) || '', props = /^(prop|td)$/;
    if (p.live && m.live === false) return no(nm + ': live picks are off');
    if (k === 'parlay') { if (m.parlays === false) return no(nm + ': parlays are off'); if (m.props === false && (p.legs || []).some(l => l.spec && props.test(l.spec.k))) return no(nm + ': player props are off'); }
    else if (props.test(k)) { if (m.props === false) return no(nm + ': player props are off'); }
    else if (m.lines === false) return no(nm + ': game lines are off');
    const r = checkRules(c.rules, p, p.stake == null); if (!r.ok) return no(nm + ': ' + r.why);
    const w = cw(id); if (p.stake != null && +p.stake > w.cash + 1e-9) return no(nm + ': only ' + fmt.stack(w.cash) + ' Stack left');
    return ok;
  }
  function placeIn(id, p) {
    const a = allowsIn(id, p); if (!a.ok) return { ok: false, why: a.why };
    if (id === 'rush') { const pk = place(p); return pk ? { ok: true, pick: pk } : { ok: false, why: 'The Rush: entry is closed' }; }
    const w = cw(id), stake = Math.round(+p.stake * 100) / 100; if (!(stake > 0) || p.odds == null) return { ok: false, why: cname(def(id)) + ': enter a stake' };
    const pick = Object.assign({ id: rid(), at: Date.now(), status: 'open' }, p, { stake, win: fmt.toWin(stake, p.odds), contest: id }); delete pick.ex;
    w.cash -= stake; w.picks.unshift(pick); save(); return { ok: true, pick };
  }
  /* one confirm, several contests: targets = [{id, stake}] */
  function placeMany(targets, p) { return (targets || []).map(t => Object.assign({ id: t.id }, placeIn(t.id, Object.assign({}, p, { stake: t.stake })))); }
  function reloadIn(id) { if (id === 'rush') return reload(); const e = entryOf(id); if (!e || !e.canReload || e.phase === 'settled') return false; const w = cw(id); w.reloaded = true; w.debt += w.s0; w.cash += w.s0; save(); return true; }
  const walletPicks = (id, f) => picks(Object.assign({}, f || {}, { contest: id === 'rush' ? undefined : id }));

  /* ---------- contest rules for Red's contest-kit.js: stake and odds limits, injury protection, joiner fields ---------- */
  const amer = x => { if (x === null || x === undefined || x === '') return null; const n = Math.round(+x); return isFinite(n) && Math.abs(n) >= 100 && Math.abs(n) <= 100000 ? n : null; };
  const numIn = (x, lo, hi, d) => { if (x === null || x === undefined || x === '') return d; const n = +x; return isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d; };
  const INJ = ['none', 'h1', 'full'];
  const JFIELDS = [{ k: 'note', label: 'Note' }];
  function normRules(r) {
    r = r || {}; const fk = JFIELDS.map(f => f.k);
    const o = { stakeMin: Math.round(numIn(r.stakeMin, 0, 1e6, 0) * 100) / 100, stakeMax: r.stakeMax == null || r.stakeMax === '' ? null : Math.round(numIn(r.stakeMax, 1, 1e6, 1e6) * 100) / 100,
      lineMin: amer(r.lineMin), lineMax: amer(r.lineMax), slipMin: amer(r.slipMin), slipMax: amer(r.slipMax),
      injury: INJ.includes(r.injury) ? r.injury : 'none',
      fields: Array.isArray(r.fields) ? fk.filter(k => r.fields.includes(k)) : [], showFields: r.showFields === 'contest' ? 'contest' : 'commish',
      size: Math.round(numIn(r.size, 2, 1000, 12)), stack: Math.round(numIn(r.stack, 1, 1e6, 1000)) };
    if (o.stakeMax != null && o.stakeMax < o.stakeMin) o.stakeMax = o.stakeMin;
    [['lineMin', 'lineMax'], ['slipMin', 'slipMax']].forEach(([a, b]) => { if (o[a] != null && o[b] != null && fmt.dec(o[a]) > fmt.dec(o[b])) { const t = o[a]; o[a] = o[b]; o[b] = t; } });
    return o;
  }
  /* min odds = the shortest price allowed (-200 refuses -250), max odds = the longest (+500 refuses +600); compared as decimals */
  function checkRules(r, p, noStake) {
    r = normRules(r); const no = why => ({ ok: false, why }), st = +p.stake || 0, fo = fmt.odds, dec = fmt.dec;
    if (!noStake && st < r.stakeMin - 1e-9) return no('Stake under the ' + fmt.stack(r.stakeMin) + ' minimum');
    if (!noStake && r.stakeMax != null && st > r.stakeMax + 1e-9) return no('Stake over the ' + fmt.stack(r.stakeMax) + ' maximum');
    for (const l of (p.legs && p.legs.length ? p.legs : [p])) {
      if (l.odds == null) continue; const d = dec(l.odds), lab = l.label || 'A line';
      if (r.lineMin != null && d < dec(r.lineMin) - 1e-9) return no(lab + ' at ' + fo(l.odds) + ' is shorter than the ' + fo(r.lineMin) + ' line limit');
      if (r.lineMax != null && d > dec(r.lineMax) + 1e-9) return no(lab + ' at ' + fo(l.odds) + ' is longer than the ' + fo(r.lineMax) + ' line limit');
    }
    if (p.odds != null) { const d = dec(p.odds);
      if (r.slipMin != null && d < dec(r.slipMin) - 1e-9) return no('The slip at ' + fo(p.odds) + ' is shorter than the ' + fo(r.slipMin) + ' slip limit');
      if (r.slipMax != null && d > dec(r.slipMax) + 1e-9) return no('The slip at ' + fo(p.odds) + ' is longer than the ' + fo(r.slipMax) + ' slip limit'); }
    return { ok: true };
  }
  /* a pick's result inside a contest: injury protection voids a player prop (or a parlay leg) whose player left injured
     and did not return (h1: left before halftime; full: any time). Weekly Slip results are not changed. */
  const isProp = sp => !!sp && (sp.k === 'prop' || sp.k === 'td');
  function contestResult(r, p) {
    r = normRules(r); const prot = x => r.injury !== 'none' && isProp(x.spec) && x.inj && x.inj.exit && !x.inj.returned && (r.injury === 'full' || x.inj.half === 1);
    const plain = () => ({ status: p.status, units: p.status === 'open' ? null : ((p.pay || 0) - p.stake) / 10 });
    const why = x => 'Injury protection: ' + (x.inj.who || 'the player') + ' left injured in ' + x.inj.at + ' and did not return';
    if (!p.legs) return p.status !== 'open' && prot(p) ? { status: 'void', units: 0, note: why(p) } : plain();
    const hit = p.legs.filter(prot); if (!hit.length) return plain();
    const legs = p.legs.map(l => prot(l) ? Object.assign({}, l, { st: 'void' }) : l), note = why(hit[0]);
    if (legs.some(l => l.st === 'lost')) return { status: 'lost', units: -p.stake / 10, note };
    if (legs.some(l => !l.st || l.st === 'open')) return { status: 'open', units: null, note };
    const won = legs.filter(l => l.st === 'won'); if (!won.length) return { status: 'void', units: 0, note };
    return { status: 'won', units: p.stake * (won.reduce((a, l) => a * fmt.dec(l.odds), 1) - 1) / 10, note };
  }
  /* injury exits from the play feed. NFL writes "SEA-L.Williams was injured during the play." and
     "** Injury Update: CHI-J.Johnson has returned to the game."; a later play naming the player also counts as a return.
     NBA and NHL feeds rarely say "injured", so there protection only applies when the text does. */
  const nn = s => String(s || '').toLowerCase().replace(/[^a-z]/g, '');
  function injuryExits(sum, league) {
    const byTeam = {}, byName = {}, out = {};
    // play text names players "L.Williams"; the box has displayName "Leonard Williams", so key on initial + last name (with and without Jr/Sr/II)
    const keysOf = at => { const d = String(at.displayName || ''), i = d.indexOf(' '), last = i > 0 ? d.slice(i + 1) : d, ini = d.charAt(0); return [nn(at.shortName), nn(d), nn(ini + last), nn(ini + last.replace(/\s+(jr|sr|ii|iii|iv|v)\.?$/i, ''))]; };
    ((sum.boxscore && sum.boxscore.players) || []).forEach(t => { const ab = t.team && t.team.abbreviation; (t.statistics || []).forEach(g => (g.athletes || []).forEach(a => { const at = a.athlete; if (!at || !at.id) return; new Set(keysOf(at)).forEach(k => { if (!k) return; if (ab) byTeam[ab + ':' + k] = at; (byName[k] = byName[k] || new Set()).add(at); }); })); });
    const short = at => { if (at.shortName) return at.shortName; const d = String(at.displayName || ''), i = d.indexOf(' '); return i > 0 ? d.charAt(0) + '. ' + d.slice(i + 1) : d; };
    const find = (ab, raw) => { const k = nn(raw); if (ab && byTeam[ab + ':' + k]) return byTeam[ab + ':' + k]; const s = byName[k]; return s && s.size === 1 ? [...s][0] : null; };
    const plays = ((sum.drives && sum.drives.previous) || []).flatMap(d => d.plays || []).concat(sum.plays || []);
    const half = p => { const n = (p.period && p.period.number) || 0; if (league !== 'nhl') return n <= 2 ? 1 : 2; const c = String(p.clock && p.clock.displayValue || '0:00').split(':'); return n === 1 || (n === 2 && (+c[0] * 60 + (+c[1] || 0)) > 600) ? 1 : 2; };
    const per = p => { const n = (p.period && p.period.number) || 0; return (league === 'nhl' ? 'P' : 'Q') + n + ' ' + ((p.clock && p.clock.displayValue) || ''); };
    plays.forEach(p => {
      const t = String(p.text || ''); let m;
      Object.values(out).forEach(x => { if (!x.returned && x.raw && t.includes(x.raw)) x.returned = true; }); // a new injury line below resets it
      const rx = /(?:([A-Z]{2,4})-)?([A-Z][A-Za-z.'\-]*(?: [A-Z][A-Za-z.'\-]+)?) (?:was|is) injured/g; while ((m = rx.exec(t))) { const at = find(m[1], m[2]); if (at) out[at.id] = { exit: true, half: half(p), at: per(p).trim(), returned: false, who: short(at), raw: m[2] }; }
      const rr = /Injury Update: (?:([A-Z]{2,4})-)?([A-Z][A-Za-z.'\-]*(?: [A-Z][A-Za-z.'\-]+)?) has returned/g; while ((m = rr.exec(t))) { const at = find(m[1], m[2]); if (at && out[at.id]) out[at.id].returned = true; }
    });
    Object.values(out).forEach(x => delete x.raw); return out;
  }
  /* joiner note: optional free text for the commissioner. Text only, never a link; no "$". */
  const cleanField = (k, v) => String(v == null ? '' : v).replace(/[\u0000-\u001f<>"`$]/g, '').replace(/[a-z]+:\/\/|www\./gi, '').trim().slice(0, 140);
  function cleanFields(f, allowed) { const keys = JFIELDS.map(x => x.k).filter(k => !allowed || allowed.includes(k)), o = {}; keys.forEach(k => { const v = cleanField(k, f && f[k]); if (v) o[k] = v; }); return o; }
  function joinerCard(contestId, fields, allowed) { return b64.enc(JSON.stringify({ v: 1, c: String(contestId || '').replace(/[^a-z0-9-]/gi, '').slice(0, 40), n: String(S.handle || 'Player').slice(0, 18), f: cleanFields(fields, allowed), t: Date.now() })); }
  function readJoinerCard(code, allowed) { try { const j = JSON.parse(b64.dec(String(code).slice(0, 4000))); if (!j || j.v !== 1) return null; return { contest: String(j.c || '').replace(/[^a-z0-9-]/gi, '').slice(0, 40), name: String(j.n || 'Player').replace(/[<>"`]/g, '').slice(0, 18), fields: cleanFields(j.f || {}, allowed), at: +j.t || Date.now() }; } catch (e) { return null; } }

  window.Rush = {
    week, weekOf, clock, me, enter, setHandle: n => { S.handle = String(n || '').slice(0, 18); save(); }, stack: () => W().cash, units, reload, canReload,
    place, picks, settle, cashOut, updatePick, field, rival, season, closeWeek,
    settings: () => Object.assign({}, S.settings, { handle: S.handle }), set: (k, v) => { if (k === 'handle') S.handle = v; else S.settings[k] = v; save(); },
    on: fn => { subs.push(fn); return () => subs.splice(subs.indexOf(fn), 1); },
    fmt, grade: { sync, final: finalGrade, finalOf, injuryExits }, SPORT, _raw: () => S,
    rules: { norm: normRules, check: checkRules, result: contestResult, INJURY: INJ.slice() },
    joiner: { FIELDS: JFIELDS.map(f => Object.assign({}, f)), NOTE: 'Your note is shared with the commissioner.',
      get: () => cleanFields(S.joiner || {}), set: f => { S.joiner = cleanFields(f); save(); return Object.assign({}, S.joiner); },
      clean: cleanFields, card: joinerCard, readCard: readJoinerCard },
    wallet: { list: walletList, get: entryOf, active, setActive, current: () => entryOf(active()), color, covers, allows: allowsIn, place: placeIn, placeMany, reload: reloadIn, picks: walletPicks, etDay },
  };
})();
