/* Rush event source (Blue, one product): the weekly contest as a stream of events with the players on them.
 * Loaded by shared/nav.js on every page. Reads the store (Rush), the Field engine (RW) and its cached games.
 * Honest view: built from the same 7-player Field every page shows (Rush.honest()).
 *
 * Rush.events() -> newest first:
 *   { id, type, at, league, gameId, game, players, text, honest }
 *   type 'sealed'  a Slip was placed on a game. players: [{id, name}]. Nothing else: no side, line, market, price or stake.
 *   type 'reveal'  the game kicked off and every pick on it opened. players: [{id, name, side, label, stake, me}]
 *                  side is 'home' | 'away' | 'over' | 'under'.
 *   type 'settled' the game went final. players: [{id, name, side, label, stake, result, change, me}], change in Stack.
 *   type 'rank'    a settle moved players in the Ranks. players: [{id, name, from, to, me}]
 *   type 'lead'    the lead in your matchup changed hands. players: [{id, name, stack, me}] (leader first)
 *   type 'play'    a scoring play in a live NFL or NHL game the Field holds. players: [{id, name, side, team, me}] (team: the pick is on the scoring team)
 *   type 'live'    a game with picks on it is under way. players: [{id, name, side, me}] text: score and clock
 * Rush.onEvent(fn) calls fn(event) for each event that appears after the page opened (checked every 20 seconds).
 * Rush.eventsFor(gameId) -> the events on one game.
 * No tap changes anything here: events are read-only views of the contest.
 */
(function () {
  const R = window.Rush = window.Rush || {};
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
  const honest = () => !!(R.honest && R.honest());
  const gname = g => g.away.abbr + ' at ' + g.home.abbr;
  function sideOf(p) { if (['home', 'away', 'over', 'under'].includes(p.side)) return p.side; const g = p.g, l = String(p.label || ''); if (/^over/i.test(l)) return 'over'; if (/^under/i.test(l)) return 'under'; if (g && l.startsWith(g.home.abbr)) return 'home'; if (g && l.startsWith(g.away.abbr)) return 'away'; return null; }
  const started = g => g.state !== 'pre' || Date.now() >= g.date;
  const ended = g => g.state === 'post' || g.done;
  function build() {
    const W = window.RW; if (!W || !W.cached) return [];
    const games = W.cached() || []; if (!games.length) return [];
    let field = []; try { field = W.field(games); } catch (e) {}
    const now = Date.now(), ev = [], byGame = {};
    const H = honest();
    /* every player's Slips (stand-ins and yours), one entry per leg on each game */
    const bySlip = [];
    field.forEach(r => {
      let ps = []; try { ps = W.playerPicks(r.me ? 'me' : r.id, games) || []; } catch (e) {}
      const who = { id: r.me ? 'me' : String(r.id), name: r.me ? (r.name || 'You') : r.name, me: !!r.me };
      ps.forEach(sl => {
        const legs = (sl.legs && sl.legs.length ? sl.legs : [sl]).map(l => Object.assign({}, l, { g: l.g || games.find(x => x.league === l.league && String(x.id) === String(l.gameId)) })).filter(l => l.g);
        if (!legs.length) return;
        const slip = Object.assign({}, sl, { legs });
        const placed = r.me ? (sl.at || legs[0].g.date - 36e5) : (sl.at || legs[0].g.date - 36e5);
        bySlip.push({ who, slip });
        if (placed <= now) ev.push({ id: 's|' + who.id + '|' + (sl.id || legs[0].league + legs[0].gameId), type: 'sealed', at: Math.min(placed, now), league: legs[0].league, gameId: String(legs[0].gameId), game: [...new Set(legs.map(l => l.game))].join(' + '), players: [{ id: who.id, name: who.name, me: who.me, slipId: sl.id }], text: who.name + ' sealed a Slip on ' + [...new Set(legs.map(l => l.game))].join(', '), honest: H });
        legs.forEach(l => { const k = l.g.league + '|' + l.g.id; (byGame[k] = byGame[k] || { g: l.g, picks: [] }).picks.push({ who, p: l, slip }); });
      });
    });
    let riv = null; try { riv = R.rival ? R.rival() : null; } catch (e) {}
    /* what a Slip still needs, or why it missed */
    const need = sl => { const L = sl.legs || []; const lost = L.find(l => l.status === 'lost'); if (lost) return 'Missed: ' + lost.label; const open = L.filter(l => l.status === 'open'); if (!open.length) return sl.status === 'won' ? 'Hit' : ''; if (L.length === 1) return ''; const first = open.slice().sort((a, b) => a.g.date - b.g.date)[0]; return 'Needs ' + (started(first.g) ? first.label : first.game) + (open.length > 1 ? ' and ' + (open.length - 1) + ' more' : ''); };
    /* the game where a settled Slip was decided: the first leg that missed, else its last leg */
    const decidedOn = sl => { if (sl.status === 'open') return null; const L = sl.legs || []; const lost = L.filter(l => l.status === 'lost').sort((a, b) => a.g.date - b.g.date)[0]; const l = lost || L.slice().sort((a, b) => b.g.date - a.g.date)[0]; return l ? l.g.league + '|' + l.g.id : null; };
    Object.values(byGame).forEach(({ g, picks }) => {
      if (!started(g)) return;
      const k = g.league + '|' + g.id;
      const full = x => ({ id: x.who.id, name: x.who.name, me: x.who.me, slipId: x.slip.id, side: sideOf(x.p), label: x.p.label, market: x.p.market, leg: x.p, stake: R.sealView(x.slip).stake, slip: x.who.me ? x.slip : R.sealView(x.slip) });
      ev.push({ id: 'r|' + g.league + g.id, type: 'reveal', at: g.date, league: g.league, gameId: String(g.id), game: gname(g), players: picks.map(full), text: 'Seal broken on ' + gname(g) + ': ' + picks.length + ' pick' + (picks.length > 1 ? 's' : ''), honest: H });
      if (!ended(g)) ev.push({ id: 'l|' + g.league + g.id + '|' + (g.detail || ''), type: 'live', at: Math.max(g.date, now - 6e4), league: g.league, gameId: String(g.id), game: gname(g), players: picks.map(x => ({ id: x.who.id, name: x.who.name, me: x.who.me, side: sideOf(x.p), market: x.p.market, slipId: x.slip.id })), text: g.away.abbr + ' ' + (g.away.score ?? '') + ', ' + g.home.abbr + ' ' + (g.home.score ?? '') + (g.detail ? ' · ' + g.detail : ''), honest: H });
      else {
        const done = picks.filter(x => ['won', 'lost', 'push'].includes(x.p.status));
        if (done.length) ev.push({ id: 'f|' + g.league + g.id, type: 'settled', at: Math.min(now, g.date + 3 * 36e5), league: g.league, gameId: String(g.id), game: gname(g), players: done.map(x => Object.assign(full(x), { result: x.p.status, slipStatus: x.slip.status, change: decidedOn(x.slip) === k ? Math.round((x.slip.units || 0) * 10) : 0, need: need(x.slip) })), text: gname(g) + ' is final', honest: H });
      }
    });

    /* big plays: scoring plays in live or final NFL and NHL games the Field holds picks on (fetched below) */
    let PL = {}; try { PL = JSON.parse(localStorage.getItem('rush-plays-v1') || '{}'); } catch (e) {}
    Object.values(byGame).forEach(({ g, picks }) => { if (!started(g)) return; (PL[g.league + '|' + g.id] || []).forEach(pl => {
      const tm = pl.team, on = picks.map(x => ({ id: x.who.id, name: x.who.name, me: x.who.me, side: sideOf(x.p), team: x.p.label && tm && String(x.p.label).startsWith(tm) }));
      ev.push({ id: 'p|' + g.league + g.id + '|' + pl.id, type: 'play', at: pl.at, league: g.league, gameId: String(g.id), game: gname(g), team: tm, players: on, text: (tm ? tm + ': ' : '') + pl.text, honest: H }); }); });
    /* rank moves and matchup lead changes: replay the settles in order */
    const settles = ev.filter(e => e.type === 'settled').sort((a, b) => a.at - b.at);
    if (settles.length) {
      const total = {}; field.forEach(r => { total[r.me ? 'me' : String(r.id)] = 0; });
      const rankOf = () => { const ids = Object.keys(total); const out = {}; ids.forEach(i => { out[i] = 1 + ids.filter(j => total[j] > total[i]).length; }); return out; };
      const name = id => { const r = field.find(x => (x.me ? 'me' : String(x.id)) === id); return r ? (r.me ? (r.name || 'You') : r.name) : id; };
      /* start from today's Stacks minus everything these settles changed */
      field.forEach(r => { const id = r.me ? 'me' : String(r.id); total[id] = Math.round((r.units || 0) * 10); });
      settles.forEach(s => s.players.forEach(p => { if (p.id in total) total[p.id] -= p.change || 0; }));
      let before = rankOf(), lead = null;
      const rv = riv ? String(riv.id) : null;
      const leadOf = () => rv && rv in total ? (total.me > total[rv] ? 'me' : total.me < total[rv] ? rv : null) : null;
      lead = leadOf();
      settles.forEach(s => {
        s.players.forEach(p => { if (p.id in total) total[p.id] += p.change || 0; });
        const after = rankOf(), moved = Object.keys(after).filter(id => after[id] !== before[id] && (id === 'me' || after[id] <= 3 || before[id] <= 3 || Math.abs(after[id] - before[id]) >= 3));
        const top = moved.sort((x, y) => (x === 'me' ? -1 : y === 'me' ? 1 : Math.min(after[x], before[x]) - Math.min(after[y], before[y]))).slice(0, 3);
        if (top.length) ev.push({ id: 'k|' + s.gameId, type: 'rank', at: s.at + 1, league: s.league, gameId: s.gameId, game: s.game, players: top.map(id => ({ id, name: name(id), from: before[id], to: after[id], me: id === 'me' })), text: 'The Ranks moved after ' + s.game, honest: H });
        const nl = leadOf(); if (rv && nl && nl !== lead) ev.push({ id: 'd|' + s.gameId, type: 'lead', at: s.at + 2, league: s.league, gameId: s.gameId, game: s.game, players: [nl, nl === 'me' ? rv : 'me'].map(id => ({ id, name: name(id), stack: 1000 + total[id], me: id === 'me' })), text: name(nl) + ' leads the matchup', honest: H });
        if (nl) lead = nl; before = after;
      });
    }
    return ev.sort((a, b) => b.at - a.at);
  }
  let memo = { k: '', v: [] };
  function events() { let raw = ''; try { raw = (localStorage.getItem('rw.games') || '').length + '|' + (localStorage.getItem('rush-v2') || localStorage.getItem('rush') || '').length; } catch (e) {} const k = raw + '|' + honest() + '|' + Math.floor(Date.now() / 15e3); if (memo.k !== k) memo = { k, v: build() }; return memo.v; }
  const subs = []; let seen = null;
  function tick() { const list = events(); if (!seen) { seen = new Set(list.map(e => e.id)); return; } list.slice().reverse().forEach(e => { if (!seen.has(e.id)) { seen.add(e.id); subs.forEach(f => { try { f(e); } catch (x) {} }); } }); }
  /* a Slip as another player may see it: legs whose game has not kicked off show only the game; the stake, price and pays stay sealed while any leg is sealed */
  R.sealView = function (sl) { if (!sl) return sl; const legs = (sl.legs && sl.legs.length ? sl.legs : [sl]); let any = false; const L = legs.map(l => { const g = l.g || { date: l.start, state: 'pre' }; if (started(g)) return l; any = true; return { league: l.league, gameId: l.gameId, game: l.game, start: l.start || g.date, sealed: true }; }); return Object.assign({}, sl, { legs: L, sealed: any, stake: any ? null : sl.stake, odds: any ? null : sl.odds, win: any ? null : sl.win, label: any ? (L.length > 1 ? L.length + '-leg parlay' : 'Sealed') : sl.label }); };
  R.events = events;
  R.eventsFor = gameId => events().filter(e => String(e.gameId) === String(gameId));
  R.onEvent = fn => { subs.push(fn); if (!seen) tick(); };
  /* fetch scoring plays for games under way (or just final) that someone in the Field holds */
  async function fetchPlays() { const W = window.RW; if (!W || !W.cached) return; const games = (W.cached() || []).filter(g => (g.league === 'nfl' || g.league === 'nhl') && (g.state === 'in' || (g.state === 'post' && Date.now() - g.date < 6 * 36e5)));
    if (!games.length) return; let PL = {}; try { PL = JSON.parse(localStorage.getItem('rush-plays-v1') || '{}'); } catch (e) {}
    const path = { nfl: 'football/nfl', nhl: 'hockey/nhl' };
    await Promise.all(games.slice(0, 6).map(async g => { try { const d = await (await fetch('https://site.api.espn.com/apis/site/v2/sports/' + path[g.league] + '/summary?event=' + g.id)).json();
      let list = []; if (g.league === 'nfl') list = (d.scoringPlays || []).map(p => ({ id: String(p.id), text: p.text || p.type && p.type.text || 'Score', team: p.team && p.team.abbreviation }));
      else { const TM = {}; (((d.header || {}).competitions || [])[0] || { competitors: [] }).competitors.forEach(c => { if (c.team) TM[String(c.team.id || c.id)] = c.team.abbreviation; if (c.id) TM[String(c.id)] = c.team && c.team.abbreviation; }); list = (d.plays || []).filter(p => p.scoringPlay).map(p => ({ id: String(p.id), text: p.text || 'Goal', team: p.team && (p.team.abbreviation || TM[String(p.team.id)] || '') })); }
      const k = g.league + '|' + g.id, old = PL[k] || [];
      PL[k] = list.slice(-12).map(p => { const o = old.find(x => x.id === p.id); return Object.assign(p, { at: o ? o.at : Date.now() }); }); } catch (e) {} }));
    try { localStorage.setItem('rush-plays-v1', JSON.stringify(PL)); } catch (e) {} memo.k = ''; tick(); }
  setTimeout(fetchPlays, 1500); setInterval(fetchPlays, 60000);
  setInterval(tick, 20000);
})();
