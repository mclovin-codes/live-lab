// Blue tracker core: the game clock as a ruler.
// Pure ES module. Works in the browser and in node. Events in, metrics out.
// Event shape: { seq, t (ISO or ms), lane, ms, data }.
// Lanes: sgo (Odds feed), rush (Rush), espn (Score feed poll), fastcast (Score feed push), mark (TV and notes).

import { createLock, stopRule, fastcastReduce, eventTime, periodNum, elapsedFor, LEAGUES } from './lock.js';
export { LEAGUES };
let LEAGUE = 'NFL'; // set by createModel({ league })
export { eventTime };
export { stopRule };

export const VERSION = 'v4';

export const LANE_NAMES = {
  sgo: 'Odds feed',
  rush: 'Rush',
  espn: 'Score feed (poll)',
  fastcast: 'Score feed (push)',
  tv: 'TV',
};
export const LANES = ['sgo', 'rush', 'espn', 'fastcast', 'tv'];
// Lanes the shadow lock may use. Rush is the baseline and never feeds the shadow lock.
export const RAW_LANES = ['sgo', 'espn', 'fastcast', 'tv'];

const CLOCK_TOL = 8; // game seconds: a lane within this of the frontier is not counted as behind right now
const SAMPLE_TOL = 2; // game seconds: tolerance when matching a new reading to the frontier for a lag sample
const CAP_RECORDS = 600; // token records kept per kind
const CAP_SAMPLES = 2000;

// ---------- small helpers ----------
export const toMs = (t) => (typeof t === 'number' ? t : Date.parse(t));
const num = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/^\+/, ''));
  return Number.isFinite(n) ? n : null;
};
const oddsStr = (v) => {
  const n = num(v && typeof v === 'object' ? v.odds ?? v.price ?? v.american : v);
  if (n === null) return null;
  return n > 0 ? '+' + n : String(n);
};
const lineStr = (v) => {
  const n = num(v);
  if (n === null) return null;
  return n > 0 ? '+' + n : String(n);
};
export function parseClock(c) {
  if (c === null || c === undefined) return null;
  if (typeof c === 'number') return Math.max(0, Math.round(c));
  const m = String(c).match(/(\d+):(\d{1,2})/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}
export function parsePeriod(p, league = LEAGUE) { return periodNum(p, league); }
export function fmtClock(sec) {
  if (sec === null || sec === undefined) return null;
  const s = Math.max(0, Math.round(sec));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}
// Elapsed game seconds since the start, by the league's period lengths.
export function elapsedOf(period, clockSec, league = LEAGUE) { return elapsedFor(period, clockSec, league); }
export function quantile(arr, q) {
  if (!arr.length) return null;
  const a = [...arr].sort((x, y) => x - y);
  const i = Math.min(a.length - 1, Math.max(0, Math.round(q * (a.length - 1))));
  return a[i];
}
export function stats(arr) {
  if (!arr || !arr.length) return { n: 0, median: null, p90: null, worst: null };
  return { n: arr.length, median: quantile(arr, 0.5), p90: quantile(arr, 0.9), worst: Math.max(...arr) };
}

// ---------- lane normalisation ----------
function priceObj(o) {
  if (!o) return null;
  if (typeof o !== 'object') return { line: null, odds: oddsStr(o) };
  return { line: lineStr(o.line ?? o.point ?? o.spread ?? null), odds: oddsStr(o.odds ?? o.price ?? o.american ?? null), available: o.available };
}
function priceKey(p) {
  if (!p) return null;
  const parts = [p.spread?.line, p.spread?.odds, p.total?.line, p.total?.odds, p.mlHome?.odds, p.mlAway?.odds];
  if (parts.every((x) => x === null || x === undefined)) return null;
  return parts.map((x) => (x === null || x === undefined ? '-' : x)).join('|');
}
// Rush and the odds feed share the main lines; this key compares only spread and total lines plus spread odds,
// the fields both carry.
function lineKey(p) {
  if (!p) return null;
  const parts = [p.spread?.line, p.spread?.odds, p.total?.line];
  if (parts.every((x) => x === null || x === undefined)) return null;
  return parts.map((x) => (x === null || x === undefined ? '-' : x)).join('|');
}

// Find a value by key anywhere in a small object (FastCast payloads vary).
function deepFind(o, keys, depth = 0) {
  if (!o || typeof o !== 'object' || depth > 6) return undefined;
  for (const k of keys) if (o[k] !== undefined && o[k] !== null && typeof o[k] !== 'object') return o[k];
  for (const v of Object.values(o)) {
    if (v && typeof v === 'object') {
      const r = deepFind(v, keys, depth + 1);
      if (r !== undefined) return r;
    }
  }
  return undefined;
}

export function normalize(lane, d) {
  if (!d || d.error) return { error: d ? d.error : 'empty' };
  const r = { period: null, clockSec: null, home: null, away: null, playId: null, playText: null, playType: null, playWall: null, prices: null, available: null, pickable: null, state: null, ended: null };
  if (lane === 'sgo') {
    r.period = parsePeriod(d.period);
    r.clockSec = parseClock(d.clock);
    r.home = num(d.homeScore); r.away = num(d.awayScore);
    r.prices = { spread: priceObj(d.spreadHome), total: priceObj(d.total), mlHome: priceObj(d.mlHome), mlAway: priceObj(d.mlAway) };
    const av = [d.spreadHome, d.total, d.mlHome].filter(Boolean).map((x) => x.available);
    r.available = av.length ? !av.includes(false) : null;
    r.ended = !!(d.ended || d.finalized);
    r.state = r.ended ? 'post' : d.started ? 'in' : 'pre';
    r.stamp = d.oddsStampMax ? toMs(d.oddsStampMax) : null;
  } else if (lane === 'rush') {
    r.period = parsePeriod(d.period);
    r.clockSec = parseClock(d.clock);
    r.home = num(d.homeScore); r.away = num(d.awayScore);
    r.prices = { spread: priceObj(d.spreadHome), total: priceObj(d.total), mlHome: priceObj(d.mlHome), mlAway: priceObj(d.mlAway) };
    r.pickable = d.pickable === undefined ? null : d.pickable;
    r.ended = !!d.ended;
    r.liveUpdatedAt = d.liveUpdatedAt ? toMs(d.liveUpdatedAt) : null;
    r.state = r.ended ? 'post' : r.period ? 'in' : null;
  } else if (lane === 'espn') {
    r.period = parsePeriod(d.period);
    r.clockSec = parseClock(d.clock);
    r.home = num(d.homeScore); r.away = num(d.awayScore);
    r.state = d.state || null;
    r.ended = !!d.completed;
    const newest = Array.isArray(d.plays) && d.plays.length ? d.plays[d.plays.length - 1] : null;
    r.playId = d.lastPlayId || (newest && newest.id) || null;
    r.playText = d.lastPlayText || (newest && newest.text) || null;
    r.playType = d.lastPlayType || (newest && newest.type) || null;
    r.playWall = d.lastPlayWallclock ? toMs(d.lastPlayWallclock) : newest && newest.wallclock ? toMs(newest.wallclock) : null;
    r.plays = Array.isArray(d.plays) ? d.plays : null;
    r.detail = d.detail || null;
    // The poll feed carries no in-play price. Kept for display only, never compared.
    const co = d.coreOdds || {};
    r.displayPrices = { spread: { line: lineStr(co.curSpread ?? co.spread), odds: null }, total: { line: lineStr(co.curTotal ?? co.overUnder), odds: null }, mlHome: { odds: oddsStr(co.curMlHome ?? co.mlHome) }, mlAway: { odds: oddsStr(co.curMlAway ?? co.mlAway) } };
  } else if (lane === 'fastcast') {
    // d here is the reduced state from fastcastReduce
    r.period = parsePeriod(d.period);
    r.clockSec = parseClock(d.clock);
    r.home = num(d.homeScore); r.away = num(d.awayScore);
    r.state = d.state || null;
    r.ended = d.state === 'post';
    r.playId = d.lastPlayId || null; r.playText = d.lastPlayText || null; r.playType = d.lastPlayType || null;
    r.playWall = d.lastPlayWallclock ? toMs(d.lastPlayWallclock) : null;
  }
  // a total is a plain number, never signed
  for (const pr of [r.prices, r.displayPrices]) if (pr && pr.total && pr.total.line) pr.total.line = String(pr.total.line).replace(/^\+/, '');
  r.elapsed = elapsedOf(r.period, r.clockSec);
  r.scoreKey = r.home !== null && r.away !== null ? r.away + '-' + r.home : null;
  r.priceKey = priceKey(r.prices);
  r.lineKey = lineKey(r.prices);
  return r;
}

// ---------- the model ----------
export function createModel(opts = {}) {
  if (opts.league && LEAGUES[opts.league]) LEAGUE = opts.league;
  const lock = createLock(Object.assign({ clock: 'event', league: LEAGUE }, opts.lock || {}));
  const m = {
    lanes: {}, // lane -> { r, t, firstT, n, lastChangeT, gaps[], changeGaps[], clock: {...} }
    frontier: [], // [{t, e, lane}] clock frontier steps, e strictly rising
    clockSamples: {}, // lane -> [lag s]
    tokens: { score: new Map(), play: new Map(), price: new Map() }, // token -> { first, lane, lanes: {lane: t} }
    marks: [], // TV and notes
    rushGaps: [], // engine pass gaps from Rush liveUpdatedAt
    lastRushLive: null,
    trace: [], // [{t, lags: {lane: clockLagNow}}] one per second, capped
    stale: { on: false, since: null, reason: null, windows: 0, seconds: 0, byReason: {} },
    lock: { state: 'NO DATA', reasons: [], since: null, openSec: 0, inPlaySec: 0, lastEval: null, opens: 0 },
    baseline: { state: 'NO DATA', openSec: 0 },
    lastT: null,
    lastRawChangeT: null, // newest price, line or score change on a raw lane
    plays: new Map(), // playId -> { wall, firstKnown, type, text, stop }
    lastSeq: 0,
    oddsLineChanges: [], // odds feed line change times
    rushLineChangeT: null, // newest Rush line change time
    rushPriceLag: [], // Rush line change minus the odds feed change it follows
  };

  function laneState(lane) {
    if (!m.lanes[lane]) m.lanes[lane] = { r: null, t: null, firstT: null, n: 0, errors: 0, lastErr: null, lastChangeT: null, gaps: [], changeGaps: [], sig: null, clock: { e: null, since: null, prevE: null, prevSince: null, running: null } };
    return m.lanes[lane];
  }

  function pushCap(arr, v, cap = CAP_SAMPLES) { arr.push(v); if (arr.length > cap) arr.splice(0, arr.length - cap); }

  function recordToken(kind, token, lane, t) {
    if (token === null || token === undefined) return;
    const map = m.tokens[kind];
    let rec = map.get(token);
    // A price can come back to an old value. Treat a sighting over 5 minutes after the first as a new episode.
    if (rec && rec.lanes[lane] === undefined && t - rec.first > 300000) { map.delete(token); rec = null; }
    if (!rec) {
      rec = { first: t, lane, lanes: {} };
      map.set(token, rec);
      if (map.size > CAP_RECORDS) map.delete(map.keys().next().value);
    }
    if (rec.lanes[lane] === undefined) rec.lanes[lane] = t;
    if (t < rec.first) { rec.first = t; rec.lane = lane; }
  }

  function frontierMax() { return m.frontier.length ? m.frontier[m.frontier.length - 1].e : null; }
  // First wall time the frontier reached at least e (within tolerance).
  function frontierTimeAtLeast(e) {
    for (const f of m.frontier) if (f.e >= e - SAMPLE_TOL) return f.t;
    return null;
  }
  function frontierTimeBeyond(e) {
    for (const f of m.frontier) if (f.e > e + CLOCK_TOL) return f.t;
    return null;
  }

  function onClock(lane, L, r, t) {
    const c = L.clock;
    if (r.elapsed === null) return;
    if (c.e === r.elapsed) return;
    // clock model: running if game time moved about as fast as wall time since the last change
    if (c.e !== null && c.since !== null) {
      const dg = r.elapsed - c.e; const dw = (t - c.since) / 1000;
      c.running = dg > 0 && dw > 0 ? dg / dw >= 0.6 : false;
      c.ratio = dw > 0 ? dg / dw : null;
    }
    c.prevE = c.e; c.prevSince = c.since; c.e = r.elapsed; c.since = t;
    // ruler sample: how long after the frontier first reached this place did this lane show it
    const ft = frontierTimeAtLeast(r.elapsed);
    if (ft !== null && r.elapsed > (c.prevE ?? -1)) {
      if (!m.clockSamples[lane]) m.clockSamples[lane] = [];
      pushCap(m.clockSamples[lane], Math.max(0, (t - ft) / 1000));
    }
    if (frontierMax() === null || r.elapsed > frontierMax()) {
      m.frontier.push({ t, e: r.elapsed, lane });
      if (m.frontier.length > 4000) m.frontier.splice(0, 1000);
      if (ft === null) { if (!m.clockSamples[lane]) m.clockSamples[lane] = []; pushCap(m.clockSamples[lane], 0); }
    }
  }

  function ingest(ev) {
    if (!ev || !ev.lane) return;
    const t = eventTime(ev);
    if (!Number.isFinite(t)) return;
    if (ev.seq && ev.seq > m.lastSeq) m.lastSeq = ev.seq;
    // Advance time based meters up to this event first.
    advance(t);
    lock.ingest(ev);
    if (ev.lane === 'mark') return onMark(ev, t);
    const lane = ev.lane;
    const L = laneState(lane);
    if (L.t !== null && inPlay()) pushCap(L.gaps, (t - L.t) / 1000);
    L.t = t; L.n++;
    if (L.firstT === null) L.firstT = t;
    let data = ev.data;
    if (lane === 'fastcast' && data && !data.error) { m.fc = fastcastReduce(m.fc, data.payload || data); data = m.fc; }
    const r = normalize(lane, data);
    if (r.error) { L.errors++; L.lastErr = { t, error: r.error }; return; }
    if (ev.data && ev.data.hopMs !== undefined) r.hopMs = ev.data.hopMs;
    r.ms = ev.ms;
    const prev = L.r;
    const sig = [r.elapsed, r.scoreKey, r.priceKey, r.playId, r.pickable, r.available].join('#');
    if (sig !== L.sig) {
      if (L.lastChangeT !== null) pushCap(L.changeGaps, (t - L.lastChangeT) / 1000);
      L.lastChangeT = t; L.sig = sig;
    }
    // per field "since" stamps for ages
    r.since = {
      clock: prev && prev.elapsed === r.elapsed ? prev.since.clock : t,
      score: prev && prev.scoreKey === r.scoreKey ? prev.since.score : t,
      play: prev && prev.playId === r.playId ? prev.since.play : t,
      price: prev && prev.priceKey === r.priceKey ? prev.since.price : t,
    };
    L.r = r;
    onClock(lane, L, r, t);
    recordToken('score', r.scoreKey, lane, t);
    if (lane === 'espn' || lane === 'fastcast') {
      const list = r.plays && r.plays.length ? r.plays : r.playId ? [{ id: r.playId, text: r.playText, type: r.playType, wallclock: r.playWall }] : [];
      for (const p of list) {
        if (!p || !p.id) continue;
        recordToken('play', String(p.id), lane, t);
        if (!m.plays.has(String(p.id))) {
          const typeText = typeof p.type === 'object' && p.type ? p.type.text : p.type;
          m.plays.set(String(p.id), { id: String(p.id), wall: p.wallclock ? toMs(p.wallclock) : null, firstKnown: t, lane, type: typeText || null, text: p.text || null, stop: stopRule(typeText, p.text) });
          if (m.plays.size > 400) m.plays.delete(m.plays.keys().next().value);
        }
      }
    }
    // Rush shows its own rounding of the line (2026-11-12: Rush -2 and 41 against the odds feed -2.5 and 40.5),
    // so Rush price lag and staleness go by timing: when each lane last changed its line, never by equal values.
    if (lane === 'sgo' || lane === 'fastcast') recordToken('price', r.lineKey, lane, t);
    if (r.lineKey && prev && prev.lineKey && prev.lineKey !== r.lineKey) {
      if (lane === 'sgo') { m.oddsLineChanges.push(t); if (m.oddsLineChanges.length > 2000) m.oddsLineChanges.shift(); }
      if (lane === 'rush') {
        // lag = this Rush change minus the earliest odds feed change since Rush's previous change (within 120 s)
        const from = m.rushLineChangeT ?? -Infinity;
        const src = m.oddsLineChanges.find((x) => x > from && x <= t && t - x <= 120000);
        if (src !== undefined) pushCap(m.rushPriceLag, (t - src) / 1000);
        m.rushLineChangeT = t;
      }
    }
    if (lane === 'rush' && r.lineKey && m.rushLineChangeT === null) m.rushLineChangeT = t;
    if (lane !== 'rush' && prev) {
      if (prev.scoreKey !== r.scoreKey || (r.lineKey && prev.lineKey !== r.lineKey) || (r.priceKey && prev.priceKey !== r.priceKey)) m.lastRawChangeT = t;
    }
    if (lane === 'rush' && r.liveUpdatedAt) {
      if (m.lastRushLive !== null && r.liveUpdatedAt > m.lastRushLive) pushCap(m.rushGaps, (r.liveUpdatedAt - m.lastRushLive) / 1000);
      if (m.lastRushLive === null || r.liveUpdatedAt > m.lastRushLive) m.lastRushLive = r.liveUpdatedAt;
    }
  }

  function onMark(ev, t) {
    const d = ev.data || {};
    if (d.kind === 'fastcast') return; // fastcast marks are re-emitted by the relay as the fastcast lane
    const mk = { t, kind: d.kind, note: d.note || null, source: d.source || null };
    m.marks.push(mk);
    if (m.marks.length > 500) m.marks.shift();
    const L = laneState('tv');
    L.t = t; L.n++;
    if (d.kind === 'score') {
      // match a TV score tap to the nearest score change within 120 s
      let best = null;
      for (const [tok, rec] of m.tokens.score) {
        const dt = Math.abs(rec.first - t);
        if (dt < 120000 && (!best || dt < best.dt)) best = { tok, dt };
      }
      if (best) recordToken('score', best.tok, 'tv', t);
      else recordToken('score', 'tv@' + t, 'tv', t);
    }
  }

  // ---------- lags ----------
  function clockLagNow(lane, now) {
    const L = m.lanes[lane];
    if (!L || L.clock.e === null || !m.frontier.length) return null;
    const tb = frontierTimeBeyond(L.clock.e);
    if (tb === null) return 0;
    return Math.max(0, (now - tb) / 1000);
  }
  function tokenLags(kind) {
    const out = {};
    for (const rec of m.tokens[kind].values()) {
      for (const [lane, lt] of Object.entries(rec.lanes)) {
        (out[lane] = out[lane] || []).push((lt - rec.first) / 1000);
      }
    }
    return out;
  }
  // Seconds since the odds feed changed its line while Rush has not changed since; null when Rush is level.
  function rushPriceBehind(now) {
    const last = m.oddsLineChanges.length ? m.oddsLineChanges[m.oddsLineChanges.length - 1] : null;
    if (last === null || m.rushLineChangeT === null || m.rushLineChangeT >= last) return null;
    const first = m.oddsLineChanges.find((x) => x > m.rushLineChangeT);
    return Math.max(0, (now - first) / 1000);
  }
  function tokenLagNow(kind, lane, now) {
    if (kind === 'price' && lane === 'rush') return m.lanes.rush ? rushPriceBehind(now) ?? 0 : null;
    const L = m.lanes[lane];
    if (!L || !L.r) return null;
    const cur = kind === 'score' ? L.r.scoreKey : kind === 'play' ? L.r.playId : L.r.lineKey;
    if (cur === null || cur === undefined) return null;
    // newest token whose first sighting came from another lane and this lane has not shown
    let newest = null;
    for (const [tok, rec] of m.tokens[kind]) if (!newest || rec.first > newest.rec.first) newest = { tok, rec };
    if (!newest || newest.tok === String(cur) || newest.rec.lanes[lane] !== undefined) return 0;
    return Math.max(0, (now - newest.rec.first) / 1000);
  }

  // ---------- time based meters: stale line and the two locks ----------
  function inPlay() {
    const s = m.lanes.sgo?.r; const e = m.lanes.espn?.r; const f = m.lanes.fastcast?.r;
    const anyIn = [s, e, f].some((r) => r && r.state === 'in') || (f && f.elapsed !== null && !f.ended);
    const anyPost = [s, e].some((r) => r && (r.state === 'post' || r.ended));
    return anyIn && !anyPost;
  }

  function newestPlay() {
    let best = null;
    for (const p of m.plays.values()) if (!best || p.firstKnown > best.firstKnown || (p.firstKnown === best.firstKnown && (p.wall || 0) > (best.wall || 0))) best = p;
    return best;
  }

  // The 2026-11-05 starting rule: refuse when price, line or score moved inside 30 s, or the line is unavailable.
  function evalBaseline(now) {
    if (!inPlay()) return 'NOT LIVE';
    const s = m.lanes.sgo;
    if (!s || !s.r) return 'LOCKED';
    if (s.r.available === false) return 'LOCKED';
    if (m.lastRawChangeT !== null && (now - m.lastRawChangeT) / 1000 < 30) return 'LOCKED';
    return 'OPEN';
  }

  function staleNow(now) {
    const R = m.lanes.rush;
    if (!R || !R.r) return null;
    if (R.r.pickable === false) return null;
    if (!inPlay()) return null;
    const reasons = [];
    const S = m.lanes.sgo;
    if (rushPriceBehind(now) !== null) reasons.push('price');
    const cl = clockLagNow('rush', now);
    if (cl !== null && cl > 0) reasons.push('clock');
    const sl = tokenLagNow('score', 'rush', now);
    if (sl) reasons.push('score');
    const lastTap = m.marks.length ? m.marks[m.marks.length - 1] : null;
    if (lastTap && ['snap', 'score', 'whistle'].includes(lastTap.kind) && R.clock.since !== null && R.clock.since < lastTap.t && R.r.since.score < lastTap.t) reasons.push('tv ' + lastTap.kind);
    return reasons.length ? reasons : null;
  }

  let lastAdvance = null;
  function advance(now) {
    if (lastAdvance === null) { lastAdvance = now; return; }
    // A jump back over a minute means the timeline changed (a replay began); restart the grid there.
    if (now < lastAdvance - 60000) { lastAdvance = now; return; }
    if (now <= lastAdvance) return;
    // step in 1 s slices so every meter integrates on the same grid
    let t = lastAdvance;
    while (t < now) {
      const step = Math.min(1000, now - t);
      const sec = step / 1000;
      const ls = lock.status(t);
      const lk = { state: !ls.live ? (m.lanes.sgo || m.lanes.espn ? 'NOT LIVE' : 'NO DATA') : ls.open ? 'OPEN' : 'LOCKED', reasons: [ls.reason], window: ls.open ? { kind: ls.windowKind, left: ls.windowLeft } : null };
      m.lock.lastEval = lk;
      if (lk.state === 'OPEN' || lk.state === 'LOCKED') {
        m.lock.inPlaySec += sec;
        if (lk.state === 'OPEN') m.lock.openSec += sec;
        if (lk.state !== m.lock.state) { m.lock.since = t; if (lk.state === 'OPEN') m.lock.opens++; }
      }
      m.lock.state = lk.state; m.lock.reasons = lk.reasons; m.lock.window = lk.window;
      const b = evalBaseline(t);
      if (b === 'OPEN') m.baseline.openSec += sec;
      m.baseline.state = b;
      const st = staleNow(t);
      if (st) {
        if (!m.stale.on) { m.stale.on = true; m.stale.windows++; m.stale.since = t; }
        m.stale.seconds += sec; m.stale.reason = st;
        for (const r of st) m.stale.byReason[r.split(' ')[0]] = (m.stale.byReason[r.split(' ')[0]] || 0) + sec;
      } else { m.stale.on = false; m.stale.reason = null; }
      t += step;
      if (Math.floor(t / 1000) !== Math.floor((t - step) / 1000)) {
        const lags = {};
        for (const lane of ['sgo', 'rush', 'espn', 'fastcast']) lags[lane] = clockLagNow(lane, t);
        m.trace.push({ t, lags, lock: lk.state });
        if (m.trace.length > 1800) m.trace.splice(0, m.trace.length - 1800);
      }
    }
    lastAdvance = now;
    m.lastT = now;
  }

  function snapshot(now) {
    if (now === undefined) now = m.lastT ?? Date.now();
    advance(now);
    const kinds = { clock: {}, score: tokenLags('score'), play: tokenLags('play'), price: Object.assign(tokenLags('price'), { rush: m.rushPriceLag }) };
    for (const [lane, arr] of Object.entries(m.clockSamples)) kinds.clock[lane] = arr;
    const lag = {};
    for (const lane of LANES) {
      lag[lane] = {};
      for (const kind of ['clock', 'score', 'play', 'price']) {
        const st = stats(kinds[kind][lane] || []);
        const nowLag = kind === 'clock' ? clockLagNow(lane, now) : tokenLagNow(kind, lane, now);
        lag[lane][kind] = Object.assign(st, { now: nowLag });
      }
    }
    // fastest lane per kind by median
    const leader = {};
    for (const kind of ['clock', 'score', 'play', 'price']) {
      let best = null;
      for (const lane of LANES) { const s = lag[lane][kind]; if (s.n && (best === null || s.median < lag[best][kind].median)) best = lane; }
      leader[kind] = best;
    }
    const lanes = {};
    for (const lane of LANES) {
      const L = m.lanes[lane];
      if (!L) { lanes[lane] = null; continue; }
      lanes[lane] = { r: L.r, t: L.t, age: L.t ? Math.max(0, (now - L.t) / 1000) : null, n: L.n, errors: L.errors, lastErr: L.lastErr, clock: L.clock, gaps: stats(L.gaps), changeGaps: stats(L.changeGaps), gapsOver8: L.gaps.filter((g) => g > 8).length };
    }
    const tv = tvRanking();
    return {
      now, live: inPlay(), lanes, lag, leader, lock: m.lock, baseline: m.baseline,
      stale: m.stale, rushGaps: Object.assign(stats(m.rushGaps), { over9: m.rushGaps.filter((g) => g >= 9).length }),
      trace: m.trace, marks: m.marks.slice(-20), plays: [...m.plays.values()].slice(-12), lastSeq: m.lastSeq, tv,
      saved: savedVsBaseline(lag),
      lockScore: liveLockScore(),
    };
  }

  // Live grade of the shadow lock on the kept trace: bad open seconds (open between a snap stamp and the first
  // clock or score change after it on any raw lane) and seconds open with a price move inside the next 10 s.
  function liveLockScore() {
    const plays = [...m.plays.values()].filter((p) => !(p.stop && ['twomin', 'timeout', 'quarter', 'half'].includes(p.stop.kind)));
    const after = (w) => { for (const f of m.frontier) if (f.t > w && f.lane !== 'rush') return f.t; return null; };
    const moves = [...m.tokens.price.values()].filter((r) => r.lane !== 'rush').map((r) => r.first).sort((a, b) => a - b);
    return scoreLock(m.trace, plays, after, moves);
  }

  // Baseline (Rush lane) against best raw lane, per kind: seconds saved at the median.
  function savedVsBaseline(lag) {
    const out = {};
    for (const kind of ['clock', 'score', 'play', 'price']) {
      const rush = lag.rush[kind];
      let best = null;
      for (const lane of RAW_LANES) { const s = lag[lane][kind]; if (s.n && (best === null || s.median < lag[best][kind].median)) best = lane; }
      out[kind] = { rush: rush.n ? rush.median : null, rushP90: rush.n ? rush.p90 : null, best, bestMedian: best ? lag[best][kind].median : null, saved: rush.n && best ? rush.median - lag[best][kind].median : null };
    }
    return out;
  }

  // TV against the play feed: snap taps against play wallclock stamps.
  function tvRanking() {
    const snaps = m.marks.filter((x) => x.kind === 'snap');
    const deltas = [];
    for (const p of m.plays.values()) {
      if (!p.wall) continue;
      let best = null;
      for (const s of snaps) { const d = (s.t - p.wall) / 1000; if (Math.abs(d) < 20 && (!best || Math.abs(d) < Math.abs(best))) best = d; }
      if (best !== null) deltas.push(best);
    }
    return { taps: m.marks.filter((x) => ['snap', 'whistle', 'score'].includes(x.kind)).length, snapVsStamp: stats(deltas.map((x) => x)), snapVsStampRaw: deltas.slice(-20) };
  }

  return { ingest, snapshot, advance, model: m, lock, evalBaseline };
}

// Evaluate a lock trace against ground truth snaps.
// unsafe = [snap stamp, first time any raw lane showed the result). Bad open = open inside that.
export function scoreLock(trace, plays, laneFirstChangeAfter, priceChangeTimes = []) {
  const unsafe = [];
  for (const p of plays) {
    if (!p.wall) continue;
    const known = Math.min(p.firstKnown, laneFirstChangeAfter(p.wall) ?? Infinity);
    if (known > p.wall) unsafe.push([p.wall, known, p.id]);
  }
  let badSec = 0; const badPlays = new Set(); let open = 0; let total = 0; let movedSec = 0; const movedSet = new Set();
  for (const s of trace) {
    if (s.lock !== 'OPEN' && s.lock !== 'LOCKED') continue;
    total++;
    if (s.lock === 'OPEN') {
      open++;
      for (const [a, b, id] of unsafe) if (s.t >= a && s.t < b) { badSec++; badPlays.add(id); }
      for (const pc of priceChangeTimes) if (pc > s.t && pc - s.t <= 10000) { movedSec++; movedSet.add(pc); break; }
    }
  }
  return { unsafeWindows: unsafe.length, badOpenSec: badSec, badOpenPlays: badPlays.size, movedNext10Sec: movedSec, movedNext10Changes: movedSet.size, openSec: open, inPlaySec: total, openShare: total ? open / total : null };
}
