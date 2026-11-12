// Gold tracker core: pure functions, events in, metrics out.
// Runs in the browser and in node (ES module). No DOM, no fetch.
// Angle: follow the price itself, and model the player who needs time to tap.

export const LANES = ['sgo', 'fastcast', 'espn', 'rush', 'mark'];
export const LANE_NAME = {
  sgo: 'Odds feed', rush: 'Rush', espn: 'Score feed (poll)',
  fastcast: 'Score feed (push)', mark: 'TV',
};
export const PRICE_LANES = ['sgo', 'fastcast'];
export const MARKETS = ['spread', 'total', 'mlHome', 'mlAway'];
export const KINDS = ['clock', 'score', 'play', 'line', 'price'];

export const DEFAULTS = {
  tap: 6,            // seconds from seeing a price to tapping confirm (player model, 3 to 8)
  holdConf: 0.8,     // open only if P(price survives the tap) >= this
  quietPrice: 8,     // s after a price or line change on the odds feed
  quietScore: 30,    // s after a score change on any lane
  quietPlay: 10,     // s after a snap, whistle, play or score signal
  quietClock: 20,    // s after the odds feed game clock moved (clock running)
  feedMaxAge: 4,     // s, newest odds feed reading must be younger than this
  truthLead: 5,      // hindsight: the true price at t is the odds feed price at t + truthLead
  liveBefore: 8,     // hindsight: ball live from wallclock - liveBefore
  liveAfter: 2,      //            to wallclock + liveAfter
  priorGap: 40,      // s, prior mean gap between price changes before enough data
  maxRecords: 400,
  maxSamples: 20000,
};

// ---------- small maths ----------
export const num = (v) => {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v).trim().toLowerCase();
  if (s === 'even' || s === 'ev') return 100;
  const n = parseFloat(s.replace(/^\+/, ''));
  return Number.isFinite(n) ? n : null;
};
export function implied(odds) {
  const o = num(odds);
  if (o === null || o === 0) return null;
  return o > 0 ? 100 / (o + 100) : -o / (-o + 100);
}
export function phi(z) { // standard normal cdf
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}
export function invPhi(p) {
  p = Math.min(Math.max(p, 1e-6), 1 - 1e-6);
  let lo = -8, hi = 8;
  for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (phi(m) < p) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
export function quantiles(arr) {
  if (!arr || !arr.length) return null;
  const a = [...arr].sort((x, y) => x - y);
  const q = (f) => a[Math.min(a.length - 1, Math.floor(f * (a.length - 1) + 0.5))];
  return { n: a.length, med: q(0.5), p90: q(0.9), worst: a[a.length - 1], min: a[0] };
}

// ---------- normalisation ----------
export function periodNum(p) {
  if (p === null || p === undefined || p === '') return null;
  if (typeof p === 'number') return p;
  const s = String(p).toLowerCase();
  if (s.startsWith('ot')) return 5;
  if (s === 'ht' || s === 'half') return 2.5;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}
export function clockSecs(c) {
  if (c === null || c === undefined || c === '') return null;
  if (typeof c === 'number') return c;
  const m = String(c).match(/^(\d+):(\d{1,2})/);
  if (m) return +m[1] * 60 + +m[2];
  const n = parseFloat(c);
  return Number.isFinite(n) ? n : null;
}
function priceObj(x) {
  if (x === null || x === undefined) return null;
  if (typeof x !== 'object') { const o = num(x); return o === null ? null : { line: null, odds: o, available: null }; }
  const line = num(x.line ?? x.pointSpread ?? x.total);
  const odds = num(x.odds ?? x.price ?? x.american);
  if (line === null && odds === null) return null;
  return { line, odds, available: x.available ?? null, updatedAt: x.updatedAt ?? null };
}
export const priceKey = (p) => (p ? `${p.line ?? ''}@${p.odds ?? ''}` : null);
export const lineKey = (p) => (p && p.line !== null ? `${p.line}` : null);

// One relay event to one normalized reading. Every field may be null.
export function normalize(ev) {
  const d = ev.data || {};
  // Replay keeps the original time in data.origT; use it so quiet windows and play wallclocks line up.
  const tSrc = d.origT ?? ev.t;
  const t = typeof tSrc === 'number' ? tSrc : Date.parse(tSrc);
  const r = { lane: ev.lane, t, seq: ev.seq ?? null, error: d.error ?? null, raw: d };
  if (r.error) return r;
  let src = d;
  if (ev.lane === 'fastcast' && d.payload && typeof d.payload === 'object') src = { ...d.payload, ...d };
  if (ev.lane === 'mark') {
    r.mark = d.kind || null; r.note = d.note || null;
    return r;
  }
  const p = periodNum(src.period), c = clockSecs(src.clock);
  r.period = p; r.clockS = c;
  r.clock = p !== null && c !== null ? `${p}|${c}` : null;
  const hs = num(src.homeScore), as = num(src.awayScore);
  r.score = hs !== null && as !== null ? `${hs}-${as}` : null;
  r.play = src.lastPlayId ? String(src.lastPlayId) : null;
  r.playWallclock = src.lastPlayWallclock ? Date.parse(src.lastPlayWallclock) : null;
  r.plays = Array.isArray(src.plays) ? src.plays : null;
  r.playText = src.lastPlayText || null;
  r.ended = src.ended ?? (src.completed ?? null);
  r.started = src.started ?? (src.state ? src.state !== 'pre' : null);
  r.state = src.state ?? null;
  r.detail = src.detail ?? src.display ?? null;
  r.prices = {};
  if (ev.lane === 'espn') {
    // ESPN's REST odds are not in-play; keep the line only so the lag table can match it.
    const co = src.coreOdds || {};
    const sp = num(co.curSpread ?? co.spread), to = num(co.curTotal ?? co.overUnder);
    if (sp !== null) r.prices.spread = { line: sp, odds: null };
    if (to !== null) r.prices.total = { line: to, odds: null };
  } else {
    r.prices.spread = priceObj(src.spreadHome);
    r.prices.total = priceObj(src.total);
    r.prices.mlHome = priceObj(src.mlHome);
    r.prices.mlAway = priceObj(src.mlAway);
  }
  r.pickable = ev.lane === 'rush' ? (src.pickable ?? null) : null;
  const st = src.oddsStampMax ?? src.oddsUpdatedAt ?? null;
  r.stamp = st ? Date.parse(st) : null;
  r.hopMs = src.hopMs ?? null;
  r.ms = ev.ms ?? null;
  const av = [r.prices.spread, r.prices.total].filter(Boolean).map((x) => x.available).filter((x) => x !== null && x !== undefined);
  r.available = av.length ? av.every(Boolean) : null;
  return r;
}

// Seconds left in regulation, for the edge model.
export function secondsLeft(period, clockS) {
  if (period === null || clockS === null) return 1800;
  if (period >= 5) return Math.max(clockS, 60);
  return Math.max((4 - Math.min(period, 4)) * 900 + clockS, 60);
}

// Player edge in percentage points if a stale price is picked while the market is at the fresh one.
// Spread: home line. Total: odds read as the over. Moneyline: odds only. Vig ignored.
export function edgePP(market, stale, fresh, secLeft) {
  if (!stale || !fresh) return null;
  const pOld = implied(stale.odds), pNew = implied(fresh.odds);
  if (market === 'mlHome' || market === 'mlAway') {
    if (pOld === null || pNew === null) return null;
    return Math.abs(pOld - pNew) * 100;
  }
  const sd = Math.max(4, 13.86 * Math.sqrt(secLeft / 3600));
  const lo = stale.line, ln = fresh.line;
  if (lo === null || ln === null) return pOld !== null && pNew !== null ? Math.abs(pOld - pNew) * 100 : null;
  const z = invPhi(pNew ?? 0.5);
  const dir = market === 'total' ? -1 : 1;
  const pTrueAtOld = phi(z + dir * (lo - ln) / sd);
  return Math.abs(pTrueAtOld - (pOld ?? 0.5)) * 100;
}

// ---------- the engine ----------
export function createEngine(cfgIn = {}) {
  const cfg = { ...DEFAULTS, ...cfgIn };
  const S = {
    cfg,
    t0: null, tNow: null,
    latest: {},              // lane -> newest reading (non error)
    lastAny: {},             // lane -> newest event time incl. errors
    counts: {}, errors: {},
    firsts: new Map(),       // kind|value -> {first, firstLane, lanes:{}}
    head: {},                // kind -> entry with newest first
    samples: {},             // kind -> lane -> [s]
    // price heads per market, from price lanes only
    pHead: {},               // market -> {key, p, t, lane}
    pHist: {},               // market -> [{t, key, p}] (odds feed head history)
    records: [],             // per price change records
    // signals (first known)
    sig: { price: null, score: null, play: null, snap: null, whistle: null, clock: null, unavailable: false },
    gaps: [], lastPriceChangeT: null,
    // rush staleness
    stale: { on: false, since: null, windows: 0, secs: 0, edgeSecs: 0, maxEdge: 0, curEdge: 0 },
    evStale: { on: false, since: null, windows: 0, secs: 0, sigT: null },
    rushPriceSince: null,
    // lock timelines as runs
    runs: { gold: [], goldnf: [], start: [], rush: [] },
    gap: {},                // lane -> smoothed seconds between readings
    gridT: null,
    // truth
    wallclocks: new Set(),
    playsSeen: new Map(),
    // cadence
    cad: { sgoT: [], hashT: [], stampAge: [], lastHash: null, lastT: null, perMarketAge: [] },
    tv: [],                  // {kind, t, lagVsFirst}
    inPlay: { first: null, last: null },
    feed: [],                // recent rows for the event feed (capped)
  };

  function pushSample(kind, lane, v) {
    const k = (S.samples[kind] ||= {});
    const a = (k[lane] ||= []);
    a.push(v); if (a.length > cfg.maxSamples) a.shift();
  }
  function seen(kind, value, lane, t) {
    if (value === null || value === undefined) return false;
    const key = `${kind}|${value}`;
    let e = S.firsts.get(key);
    if (!e) {
      e = { kind, value, first: t, firstLane: lane, lanes: { [lane]: t } };
      S.firsts.set(key, e);
      if (!S.head[kind] || S.head[kind].first <= t) S.head[kind] = e;
      return true; // brand new value anywhere
    }
    if (e.lanes[lane] === undefined) {
      e.lanes[lane] = t;
      pushSample(kind, lane, (t - e.first) / 1000);
      if (Object.keys(e.lanes).length === 2) pushSample(kind, e.firstLane, 0);
    }
    return false;
  }
  function prune(t) {
    if (S.firsts.size < 4000) return;
    for (const [k, e] of S.firsts) if (t - e.first > 15 * 60e3) S.firsts.delete(k);
  }

  function rushMismatch() {
    const r = S.latest.rush;
    if (!r || !r.prices) return { stale: false, edge: 0 };
    let edge = 0, stale = false;
    const sl = secondsLeft(r.period ?? S.latest.sgo?.period ?? null, r.clockS ?? S.latest.sgo?.clockS ?? null);
    for (const m of MARKETS) {
      const h = S.pHead[m], rp = r.prices[m];
      if (!h || !rp) continue;
      if (priceKey(rp) !== h.key) { stale = true; edge = Math.max(edge, edgePP(m, rp, h.p, sl) ?? 0); }
    }
    return { stale, edge };
  }

  // ----- lock rules, decided only from what is known at time t -----
  function survival(q, tap) {
    const g = S.gaps;
    if (g.length < 8) return Math.exp(-tap / cfg.priorGap);
    const sCount = (x) => g.filter((v) => v > x).length;
    const a = sCount(q);
    if (a < 3) return Math.exp(-tap / cfg.priorGap);
    return sCount(q + tap) / a;
  }
  function since(x, t) { return x === null ? Infinity : (t - x) / 1000; }
  // over.holdConf lets the page score the rule with the hold forecast off (holdConf 0) side by side.
  function goldLock(t, over = {}) {
    const holdConf = over.holdConf ?? cfg.holdConf;
    const f = S.latest.sgo || S.latest.fastcast;
    if (f && f.ended) return { open: false, why: 'final' };
    if (!inPlayNow()) return { open: false, why: f ? 'pregame' : 'feed silent' };
    // freshness from the odds feed when it runs, else from the push lane's own prices
    const lastFeed = S.latest.sgo ? (S.lastAny.sgo ?? -Infinity) : (S.latest.fastcast?.t ?? -Infinity);
    const maxAge = S.latest.sgo ? cfg.feedMaxAge : Math.max(cfg.feedMaxAge, 30);
    if (!f || (t - lastFeed) / 1000 > maxAge) return { open: false, why: 'feed silent' };
    if (S.sig.unavailable) return { open: false, why: 'book off' };
    if (since(S.sig.score, t) < cfg.quietScore) return { open: false, why: 'score' };
    const playT = Math.max(S.sig.play ?? -Infinity, S.sig.snap ?? -Infinity, S.sig.whistle ?? -Infinity);
    if (since(playT === -Infinity ? null : playT, t) < cfg.quietPlay) return { open: false, why: 'play' };
    const q = since(S.sig.price, t);
    if (q < cfg.quietPrice) return { open: false, why: 'price moved' };
    if (since(S.sig.clock, t) < cfg.quietClock) return { open: false, why: 'clock running' };
    const hold = survival(q === Infinity ? 600 : q, cfg.tap);
    if (hold < holdConf) return { open: false, why: `hold ${Math.round(hold * 100)}%` };
    return { open: true, why: `hold ${Math.round(hold * 100)}%` };
  }
  function startLock(t) { // the 2026-11-05 starting rule: 30 s quiet on price, line or score, and available
    const f = S.latest.sgo;
    if (!f) return { open: false, why: 'feed silent' };
    if (f.ended) return { open: false, why: 'final' };
    if (S.sig.unavailable) return { open: false, why: 'book off' };
    if (since(S.sig.price, t) < 30 || since(S.sig.score, t) < 30) return { open: false, why: 'changed <30s' };
    return { open: true, why: 'quiet 30s' };
  }
  function rushLock() {
    const r = S.latest.rush;
    if (!r) return { open: false, why: 'no Rush data' };
    return { open: r.pickable === true, why: r.pickable ? 'pickable' : 'not pickable' };
  }
  function addRun(name, t, st) {
    const a = S.runs[name], last = a[a.length - 1];
    if (last && last.open === st.open && last.why === st.why) { last.t1 = t; return; }
    if (last) last.t1 = t - 1000;
    a.push({ t0: t, t1: t, open: st.open, why: st.why });
    if (a.length > 30000) a.shift();
  }
  function advanceGrid(tTo) {
    if (S.gridT === null) { S.gridT = tTo; return; }
    if (tTo - S.gridT > 3600e3) S.gridT = tTo - 1000; // never loop over a long gap
    while (S.gridT + 1000 <= tTo) {
      S.gridT += 1000;
      if (inPlayNow()) {
        addRun('gold', S.gridT, goldLock(S.gridT));
        addRun('goldnf', S.gridT, goldLock(S.gridT, { holdConf: 0 }));
        addRun('start', S.gridT, startLock(S.gridT));
        addRun('rush', S.gridT, rushLock());
      }
    }
  }
  function inPlayNow() {
    const f = S.latest.sgo || S.latest.fastcast || S.latest.espn || S.latest.rush;
    if (!f) return false;
    if (f.ended) return false;
    return f.started === true || f.state === 'in';
  }

  function integrate(t) {
    if (S.tNow === null) return;
    const dt = (t - S.tNow) / 1000;
    if (dt <= 0) return;
    if (S.stale.on) { S.stale.secs += dt; S.stale.edgeSecs += dt * S.stale.curEdge; }
    if (S.evStale.on) S.evStale.secs += dt;
  }
  function updateStale(t) {
    const r = S.latest.rush;
    const pick = r && r.pickable === true;
    const mm = rushMismatch();
    const on = !!(pick && mm.stale);
    if (on && !S.stale.on) { S.stale.windows++; S.stale.since = t; }
    if (!on) S.stale.since = null;
    S.stale.on = on; S.stale.curEdge = on ? mm.edge : 0;
    if (on) S.stale.maxEdge = Math.max(S.stale.maxEdge, mm.edge);
    // event staleness: a signal is known, Rush still shows a price it has held since before the signal
    const sigT = Math.max(S.sig.score ?? -Infinity, S.sig.play ?? -Infinity, S.sig.snap ?? -Infinity, S.sig.whistle ?? -Infinity);
    let eon = false;
    if (pick && sigT > -Infinity && S.rushPriceSince !== null && S.rushPriceSince < sigT && (t - sigT) < 60e3) eon = true;
    if (eon && !S.evStale.on) { S.evStale.windows++; S.evStale.since = t; S.evStale.sigT = sigT; }
    S.evStale.on = eon;
  }

  function addRecord(m, prev, cur, t, lane) {
    const sl = secondsLeft(S.latest.sgo?.period ?? null, S.latest.sgo?.clockS ?? null);
    const rec = {
      market: m, from: prev ? prev.key : null, to: cur.key, fromP: prev ? prev.p : null, toP: cur.p,
      t, lane, lanes: { [lane]: t },
      dLine: prev && prev.p.line !== null && cur.p.line !== null ? cur.p.line - prev.p.line : null,
      dProb: prev && implied(prev.p.odds) !== null && implied(cur.p.odds) !== null ? (implied(cur.p.odds) - implied(prev.p.odds)) * 100 : null,
      edge: prev ? edgePP(m, prev.p, cur.p, sl) : null,
      rushLeftOld: null, rushShowedNew: null, superseded: null,
    };
    // the previous record for this market is superseded now
    for (let i = S.records.length - 1; i >= 0; i--) {
      const o = S.records[i];
      if (o.market === m) { if (o.superseded === null) o.superseded = t; break; }
    }
    S.records.push(rec);
    if (S.records.length > cfg.maxRecords) S.records.shift();
  }

  function ingest(ev) {
    if (!ev || !LANES.includes(ev.lane)) return null; // unknown lanes never become object keys
    const r = normalize(ev);
    if (!Number.isFinite(r.t)) return null;
    if (S.t0 === null) S.t0 = r.t;
    advanceGrid(r.t);
    integrate(r.t);
    S.tNow = Math.max(S.tNow ?? r.t, r.t);
    const lane = r.lane;
    S.counts[lane] = (S.counts[lane] || 0) + 1;
    S.lastAny[lane] = r.t;
    if (r.error) { S.errors[lane] = (S.errors[lane] || 0) + 1; return r; }
    const t = r.t;

    if (lane === 'mark') {
      const k = r.mark;
      if (k === 'snap') S.sig.snap = t;
      if (k === 'whistle') S.sig.whistle = t;
      if (k === 'score' || k === 'snap' || k === 'whistle') {
        // TV place: lag of the tap against the first lane that showed the matching thing
        const ref = k === 'score' ? S.head.score : S.head.play;
        S.tv.push({ kind: k, t, ref: ref ? ref.first : null });
        if (k === 'score' && ref && t - ref.first < 120e3) pushSample('score', 'mark', (t - ref.first) / 1000);
        if (k === 'score') S.sig.score = Math.max(S.sig.score ?? -Infinity, t);
      }
      S.feed.push({ t, lane, text: `${k}${r.note ? ': ' + r.note : ''}` });
      updateStale(t);
      return r;
    }

    const g = S.lastAny[lane + '_prev'];
    if (g !== undefined) { const d = (t - g) / 1000; if (d > 0 && d < 120) S.gap[lane] = S.gap[lane] ? S.gap[lane] * 0.8 + d * 0.2 : d; }
    S.lastAny[lane + '_prev'] = t;
    // A posted push patch the page cannot read (no clock, score, play or price) is a heartbeat only.
    const empty = r.clock === null && r.score === null && !r.play && !MARKETS.some((m) => r.prices[m]) && r.state === null;
    if (empty) return r;
    const prevLatest = S.latest[lane];
    S.latest[lane] = r;
    if (r.started && !r.ended && lane !== 'rush') { S.inPlay.first ??= t; S.inPlay.last = t; }

    // lag kinds
    if (seen('clock', r.clock, lane, t) && lane === 'sgo' && prevLatest && prevLatest.clock !== null) S.sig.clock = t;
    if (seen('score', r.score, lane, t) && prevLatest && prevLatest.score !== null) {
      S.sig.score = t; S.feed.push({ t, lane, text: `score ${r.score}` });
    }
    if (r.play && seen('play', r.play, lane, t)) {
      if (lane !== 'rush') S.sig.play = t;
      if (r.playWallclock) S.wallclocks.add(r.playWallclock);
      S.feed.push({ t, lane, text: `play ${r.playText ? r.playText.slice(0, 90) : r.play}` });
    }
    if (r.plays) for (const p of r.plays) {
      if (p && p.id && !S.playsSeen.has(p.id)) {
        S.playsSeen.set(p.id, p.wallclock ? Date.parse(p.wallclock) : null);
        if (p.wallclock) S.wallclocks.add(Date.parse(p.wallclock));
      }
    }
    for (const m of MARKETS) {
      const p = r.prices[m];
      if (!p) continue;
      seen('line', lineKey(p) !== null ? `${m}|${lineKey(p)}` : null, lane, t);
      if (p.odds !== null) seen('price', `${m}|${priceKey(p)}`, lane, t);
    }

    // price heads (odds feed lanes only)
    // The push lane carries another book's numbers: it drives the price head only when the odds feed is absent.
    const sgoLive = S.latest.sgo && t - S.latest.sgo.t < 30000;
    if (PRICE_LANES.includes(lane) && !(lane === 'fastcast' && sgoLive)) {
      let anyChange = false;
      for (const m of MARKETS) {
        const p = r.prices[m];
        if (!p) continue;
        const key = priceKey(p);
        const h = S.pHead[m];
        if (!h || h.key !== key) {
          const isNew = !S.records.some((x) => x.market === m && x.to === key && t - x.t < 2000);
          if (h && isNew) { addRecord(m, h, { key, p }, t, lane); anyChange = true; }
          S.pHead[m] = { key, p, t, lane };
          const hist = (S.pHist[m] ||= []); hist.push({ t, key, p }); if (hist.length > 3000) hist.shift();
        } else {
          // same price shown by a second price lane: note when it showed
          const rec = [...S.records].reverse().find((x) => x.market === m && x.to === key);
          if (rec && rec.lanes[lane] === undefined) rec.lanes[lane] = t;
        }
      }
      if (anyChange) {
        if (S.lastPriceChangeT !== null) S.gaps.push((t - S.lastPriceChangeT) / 1000);
        if (S.gaps.length > 2000) S.gaps.shift();
        S.lastPriceChangeT = t; S.sig.price = t;
        S.feed.push({ t, lane, text: 'price ' + MARKETS.map((m) => S.pHead[m] ? `${m} ${S.pHead[m].key}` : '').filter(Boolean).join(', ') });
      }
      S.sig.unavailable = r.available === false;
    }
    if (lane === 'sgo') {
      const c = S.cad;
      c.sgoT.push(t); if (c.sgoT.length > 5000) c.sgoT.shift();
      const h = r.raw.oddsHash ?? MARKETS.map((m) => priceKey(r.prices[m])).join('/');
      if (c.lastHash !== null && h !== c.lastHash) { c.hashT.push(t); if (c.hashT.length > 5000) c.hashT.shift(); }
      c.lastHash = h;
      if (r.stamp) { c.stampAge.push((t - r.stamp) / 1000); if (c.stampAge.length > 5000) c.stampAge.shift(); }
      for (const m of MARKETS) {
        const u = r.prices[m]?.updatedAt;
        if (u) { c.perMarketAge.push((t - Date.parse(u)) / 1000); if (c.perMarketAge.length > 5000) c.perMarketAge.shift(); }
      }
    }
    if (lane === 'rush') {
      const prevKey = prevLatest ? MARKETS.map((m) => priceKey(prevLatest.prices?.[m])).join('/') : null;
      const key = MARKETS.map((m) => priceKey(r.prices[m])).join('/');
      if (key !== prevKey) S.rushPriceSince = t;
      for (const rec of S.records) {
        const rp = priceKey(r.prices[rec.market]);
        if (rp === null) continue;
        if (rec.rushLeftOld === null && rp !== rec.from) rec.rushLeftOld = t;
        if (rec.rushShowedNew === null && rp === rec.to) rec.rushShowedNew = t;
      }
    }
    updateStale(t);
    if (S.feed.length > 400) S.feed.splice(0, S.feed.length - 400);
    prune(t);
    return r;
  }

  function tick(t) { advanceGrid(t); integrate(t); S.tNow = Math.max(S.tNow ?? t, t); }

  return { S, cfg, ingest, tick, goldLock, startLock, rushLock, survival };
}

// ---------- lag view ----------
export function lagTable(S, now) {
  const out = {};
  for (const kind of KINDS) {
    out[kind] = {};
    const head = S.head[kind];
    for (const lane of LANES) {
      const s = S.samples[kind]?.[lane];
      const q = quantiles(s);
      let cur = null;
      if (head && head.lanes[lane] !== undefined) cur = (head.lanes[lane] - head.first) / 1000;
      else if (head && s && s.length) cur = (now - head.first) / 1000; // lane carries this kind and has not caught up
      out[kind][lane] = { q, now: cur, behind: head ? head.lanes[lane] === undefined : null };
    }
  }
  return out;
}

// ---------- hindsight scoring ----------
// Truth at t: ball live if t sits inside [wallclock - liveBefore, wallclock + liveAfter] of any play;
// price stale if the odds feed head at t differs from the head at t + truthLead for any market.
export function headAt(hist, t) {
  if (!hist || !hist.length) return null;
  let lo = 0, hi = hist.length - 1, ans = null;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (hist[m].t <= t) { ans = hist[m]; lo = m + 1; } else hi = m - 1; }
  return ans;
}
export function truthAt(S, t) {
  const c = S.cfg;
  let live = false;
  for (const w of S.wallclocks) if (t >= w - c.liveBefore * 1000 && t <= w + c.liveAfter * 1000) { live = true; break; }
  let stale = false;
  for (const m of MARKETS) {
    const a = headAt(S.pHist[m], t), b = headAt(S.pHist[m], t + c.truthLead * 1000);
    if (a && b && a.key !== b.key) { stale = true; break; }
  }
  return { live, stale };
}
// Score a lock timeline up to tMax (only seconds whose truth is already knowable).
export function scoreRuns(S, name, tMax) {
  const runs = S.runs[name];
  let total = 0, open = 0, badOpenS = 0, badWindows = 0, inBad = false, liveOpen = 0, staleOpen = 0;
  let taps = 0, clean = 0, refused = 0, badAccept = 0;
  const tapMs = S.cfg.tap * 1000;
  for (const r of runs) {
    for (let t = r.t0; t <= Math.min(r.t1, tMax); t += 1000) {
      total++;
      if (!r.open) { inBad = false; continue; }
      open++;
      const tr = truthAt(S, t);
      const bad = tr.live || tr.stale;
      if (bad) { badOpenS++; if (!inBad) badWindows++; inBad = true; if (tr.live) liveOpen++; if (tr.stale) staleOpen++; } else inBad = false;
      // player model: sees the price at t, taps at t + tap
      if (t + tapMs <= tMax) {
        taps++;
        const a = headAt(S.pHist.spread, t), b = headAt(S.pHist.spread, t + tapMs);
        const moved = a && b && a.key !== b.key;
        // in-flight hold: a tap that started on an open price is honoured if the only reason to close since is the soft hold forecast
        const at = runAt(runs, t + tapMs);
        const okAtTap = at && (at.open || (name === 'gold' && at.why.startsWith('hold')));
        if (!okAtTap || moved) refused++;
        else { const tr2 = truthAt(S, t + tapMs); if (tr2.live || tr2.stale) badAccept++; else clean++; }
      }
    }
  }
  return {
    seconds: total, openS: open, openShare: total ? open / total : null,
    badOpenS, badWindows, badShare: open ? badOpenS / open : null, liveOpen, staleOpen,
    taps, clean, refused, badAccept,
  };
}
export function runAt(runs, t) {
  let lo = 0, hi = runs.length - 1;
  while (lo <= hi) {
    const m = (lo + hi) >> 1, r = runs[m];
    if (t < r.t0) hi = m - 1; else if (t > r.t1 + 999) lo = m + 1; else return r;
  }
  return null;
}

// ---------- cadence: tests the 1.5 s refresh claim ----------
export function cadence(S) {
  const c = S.cad;
  const diffs = (a) => a.slice(1).map((v, i) => (v - a[i]) / 1000);
  return {
    poll: quantiles(diffs(c.sgoT)),
    change: quantiles(diffs(c.hashT)),
    changes: c.hashT.length,
    stampAge: quantiles(c.stampAge),
    marketAge: quantiles(c.perMarketAge),
    perMin: c.sgoT.length > 1 ? c.hashT.length / ((c.sgoT[c.sgoT.length - 1] - c.sgoT[0]) / 60000) : null,
  };
}

// Rush lag versus the shadow fast lane (best raw lane per kind), seconds saved.
export function baselineVsBest(S) {
  const out = {};
  for (const kind of KINDS) {
    const rush = quantiles(S.samples[kind]?.rush);
    let best = null, bestLane = null;
    for (const lane of LANES) {
      if (lane === 'rush' || lane === 'mark') continue;
      const q = quantiles(S.samples[kind]?.[lane]);
      if (q && (best === null || q.med < best.med)) { best = q; bestLane = lane; }
    }
    out[kind] = { rush, best, bestLane, saved: rush && best ? rush.med - best.med : null, savedP90: rush && best ? rush.p90 - best.p90 : null };
  }
  return out;
}

// ---------- pick test grading (hindsight, from the log) ----------
export const PICK_BASE = { spreadHome: 'spread', spreadAway: 'spread', totalOver: 'total', totalUnder: 'total', mlHome: 'mlHome', mlAway: 'mlAway' };
// pick: {t, key, accepted}. Ready once the log reaches t + 10 s.
export function gradePick(S, pick) {
  const m = PICK_BASE[pick.key] || pick.key;
  const hist = S.pHist[m];
  if (!hist || S.tNow === null || S.tNow < pick.t + 10000) return { ready: false };
  const atTap = headAt(hist, pick.t);
  const fresher = !!(atTap && headAt(hist, pick.t + S.cfg.truthLead * 1000)?.key !== atTap.key);
  const moved10 = hist.some((h) => h.t > pick.t && h.t <= pick.t + 10000 && h.key !== atTap?.key);
  const live = truthAt(S, pick.t).live;
  return { ready: true, fresher, live, moved10, pastPosted: !!(pick.accepted && (fresher || live)), clean: !!(pick.accepted && !fresher && !live) };
}
