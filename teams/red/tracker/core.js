// Red tracker core: event alignment. Pure logic, no DOM, no network.
// Runs in the browser (imported by app.js) and in node (tests).
// Idea: every lane is a stream of discrete events (clock reading, score,
// play, price, period). An event has a signature. The same signature seen on
// two lanes is one matched event; each lane's lag is its first-seen wall time
// minus the earliest data lane's first-seen wall time for that event.

export const VERSION = 'v5';

export const LABEL = {
  sgo: 'Odds feed',
  rush: 'Rush',
  espn: 'Score feed (poll)',
  fastcast: 'Score feed (push)',
  tv: 'TV',
  field: 'Field stamp',
};
export const DATA_LANES = ['sgo', 'rush', 'espn', 'fastcast'];
export const RAW_LANES = ['sgo', 'espn', 'fastcast'];
export const KINDS = ['clock', 'score', 'play', 'price'];

// Tunables for the lock rule (seconds). Documented in NOTES.md.
export const PARAMS = {
  settle: 30,          // founder starting rule: no open within 30 s of a price, line or score change
  timeoutWin: 75,      // team or TV timeout: open until play stamp + 75 s
  twoMinWin: 100,      // two-minute warning
  quarterWin: 100,     // end of 1st or 3rd quarter
  halfWin: 12 * 60,    // end of 2nd quarter
  scoreWin: 75,        // after a field goal or a conversion: score first seen + 75 s
  liveBefore: 8,       // truth: ball live from play stamp - 8 s
  liveAfter: 2,        // truth: to play stamp + 2 s
  staleLead: 10,       // truth: price was already stale 10 s before the book moved it
  incidentCap: 30,     // stale meter: an incident makes Rush stale for at most 30 s
  priceCap: 60,        // stale meter: a raw-lane price move makes Rush stale for at most 60 s
  matchWindow: 180,    // same signature on two lanes within 180 s is one event
};

// ---------- parsing ----------
export function num(x) {
  if (x === null || x === undefined || x === '') return null;
  if (typeof x === 'number') return Number.isFinite(x) ? x : null;
  const s = String(x).trim().replace(/^\+/, '');
  if (/^even$/i.test(s)) return 100;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
export function parsePeriod(p) {
  if (p === null || p === undefined || p === '') return { period: null, half: false };
  if (typeof p === 'number') return { period: p, half: false };
  const s = String(p).toLowerCase();
  if (/half|^ht$/.test(s)) return { period: 2, half: true };
  const m = s.match(/(\d)/);
  if (m) return { period: Number(m[1]), half: false };
  if (/ot/.test(s)) return { period: 5, half: false };
  return { period: null, half: false };
}
export function parseClock(c) {
  if (c === null || c === undefined || c === '') return null;
  if (typeof c === 'number') return c;
  const m = String(c).match(/(\d+):(\d{1,2})(?:\.(\d))?/);
  if (!m) {
    // under a minute some leagues show "45.3"
    const u = String(c).trim().match(/^(\d{1,2})(?:\.\d+)?$/);
    return u ? Number(u[1]) : null;
  }
  return Number(m[1]) * 60 + Number(m[2]);
}
export function fmtClock(s) {
  if (s === null || s === undefined) return null;
  const m = Math.floor(s / 60), r = Math.round(s % 60);
  return m + ':' + String(r).padStart(2, '0');
}
function priceObj(o) {
  if (o === null || o === undefined) return null;
  if (typeof o === 'number' || typeof o === 'string') {
    const odds = num(o);
    return odds === null ? null : { line: null, odds, available: null };
  }
  const line = num(o.line), odds = num(o.odds);
  if (line === null && odds === null) return null;
  return { line, odds, available: o.available === undefined ? null : o.available };
}
export function toMs(t) {
  if (t === null || t === undefined) return null;
  if (typeof t === 'number') return t;
  const v = Date.parse(t);
  return Number.isFinite(v) ? v : null;
}

// Classify a play by its type or text.
export function classifyPlay(p) {
  const s = ((p && p.type) || '') + ' | ' + ((p && p.text) || '');
  if (/two-minute warning/i.test(s)) return 'twomin';
  if (/end (of )?(the )?(quarter|1st|2nd|3rd|4th|half|game|regulation)|end period|end of half|halftime/i.test(s)) return 'endq';
  if (/timeout/i.test(s) && !/reported in/i.test(s.split('|')[0])) {
    // "Timeout" as a play type, or text that is only a timeout call
    if (/^\s*timeout/i.test(p.type || '') || /^\s*timeout/i.test(p.text || '') || /timeout #\d.*$/i.test(p.text || '') && (p.text || '').length < 60) return 'timeout';
  }
  if (/extra point|two-point|2pt|conversion/i.test(s)) return 'pat';
  if (/field goal (is )?good/i.test(s)) return 'fg';
  if (/kicks \d+ yards|kickoff/i.test(s)) return 'kickoff';
  return 'snap';
}

// Normalize one relay event into a lane snapshot. Returns null when unusable.
export function normalize(ev) {
  const lane = ev.lane;
  const d = ev.data || {};
  const t = toMs(d.origT ?? ev.t); // replay events carry the original wall time
  if (t === null) return null;
  const out = { lane, t, seq: ev.seq ?? null, error: d.error || null, period: null, half: false, clockS: null,
    home: null, away: null, plays: [], prices: {}, available: null, pickable: null, started: null, ended: null, raw: d };
  if (d.error) return out;
  if (lane === 'sgo' || lane === 'rush') {
    const pp = parsePeriod(d.period);
    out.period = pp.period; out.half = pp.half || /half/i.test(d.display || '');
    out.clockS = parseClock(d.clock);
    out.home = num(d.homeScore); out.away = num(d.awayScore);
    out.started = d.started ?? null; out.ended = d.ended ?? null;
    const S = priceObj(d.spreadHome), T = priceObj(d.total), M = priceObj(d.mlHome);
    if (S) out.prices.S = S; if (T) out.prices.T = T; if (M) out.prices.M = M;
    if (lane === 'sgo') {
      const av = [S, T, M].filter(Boolean).map(x => x.available);
      out.available = av.length ? !av.some(a => a === false) : null;
    } else {
      out.pickable = d.pickable ?? null;
      out.available = d.pickable ?? null;
    }
  } else if (lane === 'espn') {
    out.period = num(d.period);
    out.half = /halftime/i.test(d.detail || '');
    out.clockS = parseClock(d.clock);
    out.home = num(d.homeScore); out.away = num(d.awayScore);
    out.started = d.state ? d.state !== 'pre' : null;
    out.ended = d.completed ?? (d.state === 'post' ? true : null);
    const plays = Array.isArray(d.plays) && d.plays.length ? d.plays
      : (d.lastPlayId ? [{ id: d.lastPlayId, text: d.lastPlayText, wallclock: d.lastPlayWallclock, type: d.lastPlayType }] : []);
    out.plays = plays.filter(p => p && p.id).map(p => ({ id: String(p.id), text: p.text || '', type: p.type || '', wallclock: toMs(p.wallclock) }));
    // the relay lists plays newest first: process oldest first so a later snap closes an earlier break
    out.plays.sort((x, y) => (x.wallclock ?? 0) - (y.wallclock ?? 0));
  } else if (lane === 'fastcast') {
    const f = extractFastcast(d.payload ?? d);
    Object.assign(out, f);
    const ct = toMs(d.clientT);
    if (ct !== null && Math.abs(ct - t) < 5000) out.t = ct; // the moment the page heard it
  } else if (lane === 'mark') {
    out.mark = { kind: d.kind, note: d.note, source: d.source };
    const ct = toMs(d.clientT);
    if (ct !== null && Math.abs(ct - t) < 5000) out.t = ct;
    if (d.kind === 'fastcast') { Object.assign(out, extractFastcast(d.payload)); out.lane = 'fastcast'; }
  }
  return out;
}

// Best effort read of a push payload: a normalized object from a helper,
// or JSON patch operations. Unknown shapes yield nothing (never NaN).
export function extractFastcast(p) {
  const out = { period: null, clockS: null, home: null, away: null, plays: [], prices: {} };
  if (!p || typeof p !== 'object') return out;
  if (!Array.isArray(p)) {
    if (p.period !== undefined) out.period = parsePeriod(p.period).period;
    if (p.clock !== undefined || p.displayClock !== undefined) out.clockS = parseClock(p.clock ?? p.displayClock);
    if (p.homeScore !== undefined) out.home = num(p.homeScore);
    if (p.awayScore !== undefined) out.away = num(p.awayScore);
    const pl = p.play || p.lastPlay;
    if (pl && pl.id) out.plays.push({ id: String(pl.id), text: pl.text || '', type: (pl.type && pl.type.text) || pl.type || '', wallclock: toMs(pl.wallclock) });
    if (Array.isArray(p.plays)) for (const q of p.plays) if (q && q.id) out.plays.push({ id: String(q.id), text: q.text || '', type: (q.type && q.type.text) || q.type || '', wallclock: toMs(q.wallclock) });
    // a full game package (checkpoint)
    const doc = p.doc || (p.header ? p : null);
    if (doc && doc.header) {
      const c = doc.header.competitions && doc.header.competitions[0];
      if (c) {
        const st = c.status || {};
        if (st.period !== undefined) out.period = num(st.period);
        if (st.displayClock !== undefined) out.clockS = parseClock(st.displayClock);
        for (const x of c.competitors || []) { if (x.homeAway === 'home') out.home = num(x.score); if (x.homeAway === 'away') out.away = num(x.score); }
      }
      const cur = doc.drives && doc.drives.current && doc.drives.current.plays;
      if (Array.isArray(cur)) for (const q of cur.slice(-5)) if (q && q.id) out.plays.push(playOf(q));
    }
    const ops = p.list || p.ops || p.patch || p.pl;
    if (Array.isArray(ops)) { const x = extractFastcast(ops); for (const k of ['period', 'clockS', 'home', 'away']) if (x[k] !== null) out[k] = x[k]; out.plays = out.plays.concat(x.plays); Object.assign(out.prices, x.prices); }
    return out;
  }
  // JSON patch operations on the game package. Assumption: competitors/0 is
  // home and competitors/1 is away, as in the package header.
  for (const op of p) {
    if (!op || typeof op !== 'object') continue;
    const path = String(op.path || ''), v = op.value;
    if (/status\/displayClock$/i.test(path) || /\/displayClock$/i.test(path)) out.clockS = parseClock(v);
    else if (/status\/period$/i.test(path)) out.period = num(v);
    else if (/header\/competitions\/0\/competitors\/0\/score$/i.test(path)) out.home = num(v);
    else if (/header\/competitions\/0\/competitors\/1\/score$/i.test(path)) out.away = num(v);
    // v5: the push lane carries live prices, e.g. /pickcenter/0/pointSpread/home/live/odds
    const pm = path.match(/^\/pickcenter\/0\/(pointSpread|spread|total|moneyline)\/(home|over)\/live\/(odds|line|point|total)$/i);
    if (pm) {
      const K = /total/i.test(pm[1]) ? 'T' : /moneyline/i.test(pm[1]) ? 'M' : 'S';
      const x = (out.prices[K] ||= { line: null, odds: null, available: null });
      const val = num(String(v ?? '').replace(/^[ou]/i, ''));
      if (/odds/i.test(pm[3])) x.odds = val; else x.line = val;
    }
    if (v && typeof v === 'object') {
      if (v.id && (v.text || v.wallclock)) out.plays.push(playOf(v));
      else if (Array.isArray(v.plays)) for (const q of v.plays.slice(-5)) if (q && q.id) out.plays.push(playOf(q));
    }
  }
  return out;
}
function playOf(q) {
  return { id: String(q.id), text: q.text || '', type: (q.type && q.type.text) || (typeof q.type === 'string' ? q.type : ''), wallclock: toMs(q.wallclock) };
}

// ---------- stats ----------
export function quantile(arr, q) {
  if (!arr.length) return null;
  const a = arr.slice().sort((x, y) => x - y);
  const i = (a.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i);
  return a[lo] + (a[hi] - a[lo]) * (i - lo);
}
export function summarize(arr) {
  if (!arr.length) return { n: 0, now: null, med: null, p90: null, worst: null };
  return { n: arr.length, now: arr[arr.length - 1], med: quantile(arr, 0.5), p90: quantile(arr, 0.9), worst: Math.max(...arr) };
}

// ---------- the tracker ----------
export class Tracker {
  constructor(params = {}) {
    this.P = Object.assign({}, PARAMS, params);
    this.entries = [];          // matched events, newest last, capped
    this.bySig = new Map();     // sig -> entries (recent)
    this.snap = {};             // lane -> newest normalized snapshot
    this.prevSig = {};          // lane -> kind/market -> last sig
    this.lastChange = {};
    this.lastPriceChange = {};  // lane -> t of its last price change       // lane -> t of the last price or score change on that lane
    this.feed = [];             // discrete event list for the page, capped
    this.playsSeen = new Map(); // play id -> {firstT, wallclock, cls, text}
    this.marks = [];            // TV taps
    this.picks = [];            // pick test attempts (from /mark kind pick)
    this.priceHist = { S: [], T: [], M: [] }; // freshest-lane price history: [t, line, odds]
    this.counts = {};
    this.state = { started: false, ended: false, startT: null, endT: null, lastPriceT: null, lastScoreT: null,
      available: null, brk: null, pendingTD: false, lastSnapSignalT: null, lastScoreDelta: 0 };
    this.rules = {
      red: { name: 'Red break rule', fn: (now) => this.redOpen(now) },
      settle30: { name: '30 s rule (starting rule)', fn: (now) => this.settleOpen(now) },
      today: { name: 'Rush today', fn: (now) => this.todayOpen(now) },
    };
    this.timeline = { red: [], settle30: [], today: [] };
    this.stale = { windows: 0, seconds: 0, on: false, since: null, reason: null, lastT: null, byReason: { price: 0, incident: 0 }, byPeriod: {} };
    this.lastIncident = null; // {t, what}
    this.lastTick = null;
  }

  // ----- ingest -----
  ingest(ev) {
    const n = normalize(ev);
    if (!n) return;
    // Replay: lanes carry the original time; live posts (taps, picks, push)
    // carry today's time. Shift those onto the replayed timeline.
    if (ev.data && ev.data.origT) { const rt = toMs(ev.t); if (rt !== null) this.replayOffset = rt - n.t; }
    else if (this.replayOffset) n.t -= this.replayOffset;
    const lane = n.lane === 'mark' ? 'tv' : n.lane;
    this.counts[lane] = (this.counts[lane] || 0) + 1;
    if (n.error) { (this.snap[lane] ||= {}).error = n.error; (this.snap[lane]).errorT = n.t; return; }
    if (lane === 'tv') return this.ingestMark(n);
    const prev = this.snap[lane];
    if (lane === 'fastcast' && prev) {
      // patches are partial: carry forward what this one did not say
      for (const k of ['period', 'clockS', 'home', 'away']) if (n[k] === null && prev[k] !== null && prev[k] !== undefined) n[k] = prev[k];
      if (!n.plays.length && prev.plays) n.lastPlays = prev.plays;
      for (const K of ['S', 'T', 'M']) {
        const a = n.prices[K], b = prev.prices && prev.prices[K];
        if (!b) continue;
        if (!a) n.prices[K] = { ...b };
        else { if (a.line === null) a.line = b.line; if (a.odds === null) a.odds = b.odds; }
      }
    }
    this.snap[lane] = n;
    const ps = (this.prevSig[lane] ||= {});

    if (lane === 'sgo') {
      if (n.started) { if (!this.state.started) { this.state.started = true; this.state.startT = n.t; } }
      if (n.ended && !this.state.ended) { this.state.ended = true; this.state.endT = n.t; }
      this.state.available = n.available;
    }
    if (lane === 'espn' && n.started && !this.state.started && n.ended === false) { this.state.started = true; this.state.startT = n.t; }
    if (lane === 'espn' && n.ended && !this.state.ended && this.state.started) { this.state.ended = true; this.state.endT = n.t; }

    // clock and period
    if (n.period !== null) {
      const qs = 'q:' + n.period + (n.half ? 'h' : '');
      if (ps.q !== qs) {
        const hadPrev = ps.q !== undefined;
        ps.q = qs;
        const e = this.match(qs, 'clock', lane, n.t);
        if (hadPrev && e.firstLane === lane && e.lanes[lane] === n.t && lane !== 'rush') this.onPeriod(n, e);
      }
    }
    if (n.clockS !== null && n.period !== null) {
      const cs = 'c:' + n.period + ':' + n.clockS;
      if (ps.c !== cs) {
        const before = ps.cS;
        ps.c = cs; ps.cS = { period: n.period, clockS: n.clockS };
        const e = this.match(cs, 'clock', lane, n.t);
        if (before && before.period === n.period && n.clockS < before.clockS && lane !== 'rush' && e.firstLane === lane) {
          this.onSnapSignal(n.t, 'clock ran on ' + LABEL[lane]);
        }
      }
    }
    // score
    if (n.home !== null && n.away !== null) {
      const ss = 's:' + n.home + '-' + n.away;
      if (ps.s !== ss) {
        const hadPrev = ps.s !== undefined;
        const oldTotal = ps.sTot;
        ps.s = ss; ps.sTot = n.home + n.away;
        if (hadPrev) {
          this.lastChange[lane] = n.t;
          const e = this.match(ss, 'score', lane, n.t);
          if (e.firstLane === lane && e.lanes[lane] === n.t && lane !== 'rush') this.onScore(n, e, (n.home + n.away) - (oldTotal ?? 0));
        }
      }
    }
    // plays
    for (const p of n.plays) {
      const sig = 'p:' + p.id;
      const known = this.playsSeen.get(p.id);
      const e = this.match(sig, 'play', lane, n.t);
      if (p.wallclock !== null && e.lanes.field === undefined && (known ? !known.initial : !!prev)) e.lanes.field = p.wallclock; // a play already up when a lane starts has no honest lag
      if (!known) {
        const cls = classifyPlay(p);
        this.playsSeen.set(p.id, { firstT: n.t, wallclock: p.wallclock, cls, text: p.text, lane, initial: !prev });
        if (prev || this.playsSeen.size > 1) this.onPlay(p, cls, n.t, lane);
        if (this.playsSeen.size > 3000) this.playsSeen.delete(this.playsSeen.keys().next().value);
      }
    }
    // prices (only lanes that carry live prices)
    if (lane === 'sgo' || lane === 'rush' || lane === 'fastcast') {
      for (const k of ['S', 'T', 'M']) {
        const pr = n.prices[k];
        if (!pr) continue;
        const sig = 'x:' + k + ':' + pr.line + ':' + pr.odds;
        if (ps['x' + k] !== sig) {
          const hadPrev = ps['x' + k] !== undefined;
          ps['x' + k] = sig;
          if (hadPrev) {
            this.lastChange[lane] = n.t;
            this.lastPriceChange[lane] = n.t;
            const e = this.match(sig, 'price', lane, n.t);
            if (lane !== 'rush' && e.firstLane === lane && e.lanes[lane] === n.t) {
              this.state.lastPriceT = n.t;
              const h = this.priceHist[k]; h.push([n.t, pr.line, pr.odds]); if (h.length > 3000) h.splice(0, 500);
              this.pushFeed(n.t, lane, 'price', marketName(k) + ' ' + fmtPrice(k, pr));
            }
          }
        }
      }
    }
    this.tick(n.t);
  }

  match(sig, kind, lane, t) {
    let list = this.bySig.get(sig);
    if (!list) { list = []; this.bySig.set(sig, list); }
    let best = null;
    for (let i = list.length - 1; i >= 0; i--) {
      const e = list[i];
      if (Math.abs(t - e.firstT) > this.P.matchWindow * 1000) continue;
      if (e.lanes[lane] !== undefined) { if (best === null) best = 'dup'; break; }
      best = e; break;
    }
    if (best && best !== 'dup') {
      best.lanes[lane] = t;
      if (t < best.firstT) { best.firstT = t; best.firstLane = lane; }
      return best;
    }
    if (best === 'dup') {
      // same lane already holds this signature in a recent entry: no new event
      return list[list.length - 1];
    }
    const e = { sig, kind, firstT: t, firstLane: lane, lanes: { [lane]: t } };
    list.push(e);
    if (list.length > 6) list.shift();
    this.entries.push(e);
    if (this.entries.length > 6000) {
      const old = this.entries.splice(0, 1000);
      for (const o of old) { const l = this.bySig.get(o.sig); if (l && l[0] === o) { l.shift(); if (!l.length) this.bySig.delete(o.sig); } }
    }
    return e;
  }

  ingestMark(n) {
    const k = n.mark && n.mark.kind;
    if (k === 'pick') {
      const p = (n.raw && n.raw.payload) || {};
      this.picks.push({ t: n.t, market: p.market, side: p.side, shownLine: num(p.shownLine), shownOdds: num(p.shownOdds), accepted: !!p.accepted, reason: p.reason || '', source: n.raw && n.raw.source });
      if (this.picks.length > 500) this.picks.shift();
      this.pushFeed(n.t, 'tv', 'pick', 'Pick test ' + (p.accepted ? 'accepted' : 'refused') + ': ' + (p.market || '') + ' ' + (p.side || ''));
      return;
    }
    if (!['snap', 'whistle', 'score'].includes(k)) { this.pushFeed(n.t, 'tv', 'note', (n.mark && n.mark.note) || k || 'mark'); return; }
    this.marks.push({ t: n.t, kind: k });
    if (this.marks.length > 500) this.marks.shift();
    this.pushFeed(n.t, 'tv', k, 'TV tap: ' + k);
    if (k === 'snap') this.onSnapSignal(n.t, 'TV snap tap');
  }

  // Attach TV taps to matched events after the fact (taps lead or trail the data).
  tvAlign() {
    const out = [];
    for (const m of this.marks) {
      let best = null, bestD = Infinity;
      for (let i = this.entries.length - 1; i >= 0; i--) {
        const e = this.entries[i];
        if (e.firstT < m.t - 120000) break;
        let ref = null;
        if (m.kind === 'score' && e.kind === 'score') ref = dataMin(e);
        if ((m.kind === 'whistle' || m.kind === 'snap') && e.kind === 'play') ref = e.lanes.field ?? null;
        if (ref === null) continue;
        const d = m.t - ref;
        const ok = m.kind === 'score' ? (d > -120000 && d < 30000) : Math.abs(d) < 30000;
        if (ok && Math.abs(d) < bestD) { bestD = Math.abs(d); best = { e, d }; }
      }
      if (best) out.push({ kind: m.kind, t: m.t, vsData: m.t - dataMin(best.e), vsField: best.e.lanes.field !== undefined ? m.t - best.e.lanes.field : null });
    }
    return out;
  }

  // ----- event state -----
  onPlay(p, cls, t, lane) {
    const W = p.wallclock ?? t;
    const P = this.P;
    this.pushFeed(t, lane, 'play', clsLabel(cls) + ': ' + (p.text || '').slice(0, 90), W);
    const set = (kind, end) => { this.state.brk = { kind, startT: t, anchor: W, endT: end }; };
    if (cls === 'timeout') set('timeout', W + P.timeoutWin * 1000);
    else if (cls === 'twomin') set('two-minute warning', W + P.twoMinWin * 1000);
    else if (cls === 'endq') {
      const per = (this.snap.espn && this.snap.espn.period) || (this.snap.sgo && this.snap.sgo.period);
      if (/half/i.test(p.text || '') || per === 2) set('halftime', W + P.halfWin * 1000);
      else if (/game|regulation/i.test(p.text || '')) set('end', W + P.halfWin * 1000);
      else set('quarter break', W + P.quarterWin * 1000);
    } else if (cls === 'pat' || cls === 'fg') {
      this.state.pendingTD = false;
      set(cls === 'pat' ? 'after conversion' : 'after field goal', Math.max(W, this.state.lastScoreT ?? 0) + P.scoreWin * 1000);
    } else {
      // a live snap or kickoff: closes any break whose anchor is older than this play
      this.state.lastSnapSignalT = Math.max(this.state.lastSnapSignalT ?? 0, W);
      this.lastIncident = { t, what: 'play' };
      if (this.state.brk && W >= this.state.brk.anchor) this.state.brk = null;
    }
  }
  onSnapSignal(t, why) {
    this.state.lastSnapSignalT = Math.max(this.state.lastSnapSignalT ?? 0, t);
    this.lastIncident = { t, what: 'snap' };
    const b = this.state.brk;
    if (b && t > b.startT + 5000 && b.kind !== 'halftime') { this.state.brk = null; this.pushFeed(t, 'calc', 'lock', 'Break closed: ' + why); }
  }
  onScore(n, e, delta) {
    this.state.lastScoreT = n.t;
    this.state.lastScoreDelta = delta;
    this.lastIncident = { t: n.t, what: 'score' };
    this.pushFeed(n.t, n.lane, 'score', 'Score ' + n.away + ' to ' + n.home + ' (away to home), +' + delta);
    if (delta === 6) { this.state.pendingTD = true; this.state.brk = null; }
    else if (delta >= 1) { this.state.pendingTD = false; this.state.brk = { kind: delta === 3 ? 'after field goal' : 'after score', startT: n.t, anchor: n.t, endT: n.t + this.P.scoreWin * 1000 }; }
  }
  onPeriod(n, e) {
    this.pushFeed(n.t, n.lane, 'period', 'Period ' + n.period + (n.half ? ' half' : ''));
    if (!this.state.brk || this.state.brk.endT < n.t) {
      const half = n.half || n.period === 3;
      this.state.brk = { kind: half ? 'halftime' : 'quarter break', startT: n.t, anchor: n.t, endT: n.t + (half ? this.P.halfWin : this.P.quarterWin) * 1000 };
    }
  }

  // ----- lock rules -----
  inGame() { return this.state.started && !this.state.ended; }
  // v5: which raw lane can show a live price move right now (null: none)
  livePriceSource(now) {
    const g = this.snap.sgo, f = this.snap.fastcast;
    if (g && g.prices && Object.keys(g.prices).length && now - g.t < 30000) return 'sgo';
    if (f && f.prices && Object.keys(f.prices).length && now - f.t < 120000) return 'fastcast';
    return null;
  }
  settleOpen(now) {
    if (!this.inGame()) return null;
    if (!this.livePriceSource(now)) return false; // blind to price moves: never open
    if (this.state.available === false) return false;
    const s = this.P.settle * 1000;
    if (this.state.lastPriceT !== null && now - this.state.lastPriceT < s) return false;
    if (this.state.lastScoreT !== null && now - this.state.lastScoreT < s) return false;
    return true;
  }
  todayOpen(now) {
    if (!this.inGame()) return null;
    const r = this.snap.rush;
    if (r && r.pickable === false) return false;
    return true;
  }
  redOpen(now) {
    if (!this.inGame()) return null;
    const base = this.settleOpen(now);
    if (!base) return false;
    if (this.state.pendingTD) return false;
    const b = this.state.brk;
    if (!b || now > b.endT) return false;
    if (this.state.lastSnapSignalT !== null && this.state.lastSnapSignalT > b.startT + 5000 && b.kind !== 'halftime') return false;
    return true;
  }
  lockReason(now) {
    if (!this.state.started) return 'Pregame: not measured';
    if (this.state.ended) return 'Final';
    if (!this.livePriceSource(now)) return 'No live price feed: locked until one reports';
    if (this.state.available === false) return 'Book shows the line off';
    const s = this.P.settle * 1000;
    if (this.state.lastPriceT !== null && now - this.state.lastPriceT < s) return 'Price moved ' + Math.round((now - this.state.lastPriceT) / 1000) + ' s ago';
    if (this.state.lastScoreT !== null && now - this.state.lastScoreT < s) return 'Score changed ' + Math.round((now - this.state.lastScoreT) / 1000) + ' s ago';
    if (this.state.pendingTD) return 'Touchdown: waiting for the conversion';
    const b = this.state.brk;
    if (!b) return 'Ball may be live: no break known';
    if (now > b.endT) return 'Break window over (' + b.kind + ')';
    return 'Open in ' + b.kind + ', ' + Math.max(0, Math.round((b.endT - now) / 1000)) + ' s left';
  }

  // Advance time: record rule timelines and the stale meter.
  tick(now) {
    if (this.lastTick !== null && now < this.lastTick) return;
    for (const k of Object.keys(this.rules)) {
      const open = this.rules[k].fn(now);
      const tl = this.timeline[k];
      const last = tl[tl.length - 1];
      if (last && last.open === open) last.end = now;
      else {
        if (last) last.end = now;
        tl.push({ start: now, end: now, open });
        if (tl.length > 8000) tl.splice(0, 1000);
      }
    }
    this.tickStale(now);
    this.lastTick = now;
  }

  staleNow(now) {
    const r = this.snap.rush;
    if (!r || !this.inGame() || r.pickable === false) return null;
    // By timing, not value (v4): Rush and the odds feed can post different
    // numbers for the same market, so equality reads Rush stale all game.
    // Rush is stale from a raw-lane price move until Rush next changes its own
    // price, capped at P.priceCap seconds per move.
    const gp = this.state.lastPriceT, rp = this.lastPriceChange.rush ?? 0;
    if (gp !== null && gp > rp && now - gp < this.P.priceCap * 1000) return 'price';
    const inc = this.lastIncident;
    if (inc && now - inc.t < this.P.incidentCap * 1000 && (this.lastChange.rush ?? 0) < inc.t) return 'incident';
    return null;
  }
  tickStale(now) {
    const st = this.stale;
    const why = this.staleNow(now);
    if (st.on && st.lastT !== null) { const dt = (now - st.lastT) / 1000; st.seconds += dt; st.byReason[st.reason] = (st.byReason[st.reason] || 0) + dt; const g = this.snap.sgo || this.snap.espn; const q = g && g.period ? 'Q' + g.period : 'Q?'; st.byPeriod[q] = (st.byPeriod[q] || 0) + dt; }
    if (why && !st.on) { st.windows++; st.since = now; }
    st.on = !!why; st.reason = why || st.reason; st.lastT = now;
  }

  pushFeed(t, lane, kind, text, stamp) {
    this.feed.push({ t, lane, kind, text, stamp: stamp ?? null });
    if (this.feed.length > 400) this.feed.splice(0, 100);
  }

  // ----- reports -----
  lagTable() {
    const out = {};
    for (const lane of DATA_LANES) {
      out[lane] = {};
      for (const kind of KINDS) out[lane][kind] = [];
      out[lane].field = [];
    }
    for (const e of this.entries) {
      const dm = dataMin(e);
      const lanes = DATA_LANES.filter(l => e.lanes[l] !== undefined);
      if (lanes.length >= 2) for (const l of lanes) out[l][e.kind].push((e.lanes[l] - dm) / 1000);
      if (e.kind === 'play' && e.lanes.field !== undefined) for (const l of lanes) out[l].field.push((e.lanes[l] - e.lanes.field) / 1000);
    }
    const res = {};
    for (const lane of DATA_LANES) {
      res[lane] = {};
      for (const kind of KINDS) res[lane][kind] = summarize(out[lane][kind]);
      res[lane].field = summarize(out[lane].field);
    }
    return res;
  }
  // Baseline (Rush lane) against the best raw lane per event.
  baseline() {
    const res = {};
    for (const kind of KINDS) {
      const saved = [];
      for (const e of this.entries) {
        if (e.kind !== kind || e.lanes.rush === undefined) continue;
        const raw = RAW_LANES.map(l => e.lanes[l]).filter(v => v !== undefined);
        if (!raw.length) continue;
        saved.push((e.lanes.rush - Math.min(...raw)) / 1000);
      }
      res[kind] = summarize(saved);
    }
    return res;
  }
  // Truth intervals, built after the fact from what every lane revealed.
  truth() {
    const P = this.P, live = [], stale = [];
    for (const [, p] of this.playsSeen) {
      if (p.wallclock === null || p.wallclock === undefined) continue;
      if (['snap', 'kickoff', 'pat', 'fg'].includes(p.cls)) live.push([p.wallclock - P.liveBefore * 1000, p.wallclock + P.liveAfter * 1000]);
    }
    for (const e of this.entries) {
      if (e.kind === 'price') { const t0 = rawMin(e); if (t0 !== null) stale.push([t0 - P.staleLead * 1000, t0]); }
      if (e.kind === 'score') { const t0 = rawMin(e); if (t0 !== null) stale.push([t0 - P.staleLead * 1000, t0]); }
    }
    for (const m of this.marks) if (m.kind === 'snap') live.push([m.t, m.t + 8000]);
    return { live: mergeIv(live), stale: mergeIv(stale) };
  }
  score(ruleKey, truth = this.truth()) {
    const tl = this.timeline[ruleKey];
    let inGame = 0, open = 0, badSec = 0, badWins = 0, wins = 0, liveSec = 0;
    const bad = mergeIv(truth.live.concat(truth.stale));
    for (const s of tl) {
      if (s.open === null) continue;
      const d = s.end - s.start;
      inGame += d;
      if (!s.open) continue;
      open += d; wins++;
      const ov = overlap([s.start, s.end], bad);
      const ovl = overlap([s.start, s.end], truth.live);
      if (ov > 0) { badWins++; badSec += ov; }
      liveSec += ovl;
    }
    return { openShare: inGame ? open / inGame : null, openSec: open / 1000, inGameSec: inGame / 1000, windows: wins, badWindows: badWins, badSec: badSec / 1000, badLiveSec: liveSec / 1000 };
  }
  // Grade pick test attempts after the fact. Past-posted when, at the tap,
  // the ball was live, or a fresher price for that market was already out,
  // or the price moved inside the next 10 s.
  gradePicks(truth = this.truth()) {
    const res = { attempts: this.picks.length, accepted: 0, clean: 0, pastPosted: 0, pending: 0, rows: [] };
    const lastT = this.lastTick ?? 0;
    for (const p of this.picks) {
      if (!p.accepted) { res.rows.push({ ...p, grade: 'refused' }); continue; }
      res.accepted++;
      if (lastT - p.t < 10000) { res.pending++; res.rows.push({ ...p, grade: 'grading' }); continue; }
      const k = p.market === 'spread' ? 'S' : p.market === 'total' ? 'T' : 'M';
      const h = this.priceHist[k];
      let atTap = null, movedSoon = false;
      for (const x of h) { if (x[0] <= p.t) atTap = x; else if (x[0] <= p.t + 10000) movedSoon = true; }
      const why = [];
      if (truth.live.some(iv => p.t >= iv[0] && p.t <= iv[1])) why.push('ball live');
      if (atTap && p.side !== 'away' && p.side !== 'under') {
        if ((p.shownLine !== null && atTap[1] !== null && p.shownLine !== atTap[1]) || (p.shownOdds !== null && atTap[2] !== null && p.shownOdds !== atTap[2])) why.push('fresher price out');
      }
      if (movedSoon) why.push('price moved inside 10 s');
      if (why.length) res.pastPosted++; else res.clean++;
      res.rows.push({ ...p, grade: why.length ? 'past-posted: ' + why.join(', ') : 'clean' });
    }
    return res;
  }
  ranking() {
    const lt = this.lagTable();
    const rows = DATA_LANES.map(l => {
      const all = [];
      for (const k of KINDS) if (lt[l][k].med !== null) all.push(lt[l][k].med);
      return { lane: l, med: all.length ? quantile(all, 0.5) : null };
    });
    const tv = this.tvAlign().map(x => x.vsData / 1000);
    rows.push({ lane: 'tv', med: tv.length ? quantile(tv, 0.5) : null, n: tv.length });
    return rows.filter(r => r.med !== null).sort((a, b) => a.med - b.med);
  }
}

export function dataMin(e) {
  let m = Infinity;
  for (const l of DATA_LANES) if (e.lanes[l] !== undefined && e.lanes[l] < m) m = e.lanes[l];
  return m === Infinity ? null : m;
}
function rawMin(e) {
  let m = Infinity;
  for (const l of RAW_LANES) if (e.lanes[l] !== undefined && e.lanes[l] < m) m = e.lanes[l];
  return m === Infinity ? null : m;
}
export function mergeIv(iv) {
  const a = iv.filter(x => x[1] > x[0]).sort((x, y) => x[0] - y[0]);
  const out = [];
  for (const x of a) { const l = out[out.length - 1]; if (l && x[0] <= l[1]) l[1] = Math.max(l[1], x[1]); else out.push([x[0], x[1]]); }
  return out;
}
function overlap(seg, ivs) {
  let s = 0;
  for (const iv of ivs) { if (iv[0] >= seg[1]) break; const a = Math.max(seg[0], iv[0]), b = Math.min(seg[1], iv[1]); if (b > a) s += b - a; }
  return s;
}
export function marketName(k) { return k === 'S' ? 'Spread' : k === 'T' ? 'Total' : 'Moneyline'; }
export function fmtOdds(o) { return o === null || o === undefined ? '' : (o > 0 ? '+' + o : String(o)); }
export function fmtPrice(k, p) {
  if (!p) return null;
  if (k === 'M') return fmtOdds(p.odds);
  const line = p.line === null ? '' : (k === 'S' && p.line > 0 ? '+' + p.line : String(p.line));
  return (k === 'T' ? 'O/U ' : '') + line + (p.odds !== null ? ' (' + fmtOdds(p.odds) + ')' : '');
}
function clsLabel(c) {
  return { timeout: 'Timeout', twomin: 'Two-minute warning', endq: 'Period end', pat: 'Conversion', fg: 'Field goal', kickoff: 'Kickoff', snap: 'Play' }[c] || 'Play';
}
