// Synthetic lanes for tests. Pure: ticks in, relay-shaped events out.
// Used in node only; the page never loads this file.

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// Old logger ticks {t, sgo, espn} to relay events.
export function ticksToEvents(ticks) {
  const out = [];
  let seq = 0;
  for (const k of ticks) {
    if (k.sgo) {
      const { ms, ...rest } = k.sgo;
      out.push({ seq: ++seq, t: k.t, lane: 'sgo', ms: ms ?? null, data: rest });
    }
    if (k.espn) out.push({ seq: ++seq, t: k.t, lane: 'espn', ms: k.espn.msSummary ?? null, data: k.espn });
  }
  return out;
}

// Rush lane: the odds feed delayed by a jittered 5 to 15 s, read with a 5 s sample-and-hold.
export function synthRush(events, { seed = 7, minDelay = 5, maxDelay = 15, hold = 5 } = {}) {
  const r = rng(seed);
  const sgo = events.filter((e) => e.lane === 'sgo').map((e) => ({ ...e, ms0: Date.parse(e.t) }));
  if (!sgo.length) return [];
  const out = [];
  const t0 = sgo[0].ms0, t1 = sgo[sgo.length - 1].ms0 + maxDelay * 1000;
  let i = 0;
  for (let t = t0 + hold * 1000; t <= t1; t += hold * 1000) {
    const delay = (minDelay + r() * (maxDelay - minDelay)) * 1000;
    const asOf = t - delay;
    while (i + 1 < sgo.length && sgo[i + 1].ms0 <= asOf) i++;
    const s = sgo[i];
    if (s.ms0 > asOf) continue;
    const d = s.data;
    out.push({
      seq: null, t: new Date(t).toISOString(), lane: 'rush', ms: 120,
      data: {
        period: d.period, clock: d.clock, homeScore: d.homeScore, awayScore: d.awayScore, ended: d.ended,
        started: d.started, liveUpdatedAt: s.t,
        spreadHome: d.spreadHome ? { line: d.spreadHome.line, odds: d.spreadHome.odds } : null,
        total: d.total ? { line: d.total.line, odds: d.total.odds } : null,
        mlHome: d.mlHome ? { odds: d.mlHome.odds } : null, mlAway: d.mlAway ? { odds: d.mlAway.odds } : null,
        oddsUpdatedAt: s.t,
        pickable: !!(d.started && !d.ended && d.spreadHome?.available !== false),
      },
    });
  }
  return out;
}

// Score feed (push): the poll lane's new plays and scores, 2 to 8 s earlier than the poll saw them.
export function synthFastcast(events, { seed = 11, minLead = 2, maxLead = 8 } = {}) {
  const r = rng(seed);
  const out = [];
  let prev = null;
  for (const e of events) {
    if (e.lane !== 'espn') continue;
    const d = e.data;
    const key = `${d.lastPlayId}|${d.homeScore}-${d.awayScore}|${d.period}|${d.clock}`;
    if (key !== prev) {
      const lead = (minLead + r() * (maxLead - minLead)) * 1000;
      const t = new Date(Date.parse(e.t) - lead).toISOString();
      out.push({ seq: null, t, lane: 'fastcast', ms: null, data: { topic: 'synthetic', clientT: t, payload: {
        period: d.period, clock: d.clock, homeScore: d.homeScore, awayScore: d.awayScore,
        lastPlayId: d.lastPlayId, lastPlayText: d.lastPlayText, lastPlayWallclock: d.lastPlayWallclock, state: d.state,
      } } });
    }
    prev = key;
  }
  return out;
}

export function merge(...lists) {
  const all = lists.flat().sort((a, b) => Date.parse(a.t) - Date.parse(b.t));
  all.forEach((e, i) => { e.seq = i + 1; });
  return all;
}
