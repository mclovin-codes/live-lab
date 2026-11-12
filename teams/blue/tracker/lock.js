// Blue lock: the game clock as a ruler. ES module, no DOM, no fetch.
// createLock(options) -> { ingest(event), status(nowMs), tryPick(pick, nowMs) }
//
// Rule in plain words: the line is LOCKED by default while the game is live. It OPENS only inside a
// known dead ball window: the newest play on the score feed is a clock stopping play (timeout, two
// minute warning, end of quarter, score, kick, incompletion, penalty, review), the window measured
// from that play's own wallclock stamp has not run out, no lane's game clock has moved since the
// stop was known, no TV snap tap came after it, the odds feed is fresh and says available, and no
// price, line or score moved in the last few seconds. A TV whistle tap opens a short window too.

export const LOCK_VERSION = 'blue-lock v1';

const DEFAULTS = {
  settle: 10, // seconds a price, line or score change keeps the lock shut
  feedFresh: 6, // seconds before the odds feed reading counts as old
  guard: 3, // seconds taken off the end of every window
  whistleWindow: 15, // seconds a TV whistle tap opens for
  unknownLag: 45, // assumed feed lag when a play carries no wallclock stamp
  durations: null, // override window lengths by stop kind
  rulerFrom: 0, // seconds after an odds feed clock change when the ruler window opens
  rulerTo: 8, // seconds after an odds feed clock change when it closes (next snap seen at 12 s or more on 2026-11-05)
  ruler: true,
  rulerMinDrop: 3, // game seconds
};

// Window length in wall seconds from the stop play's wallclock stamp to the earliest likely next snap.
const STOP_RULES = [
  { re: /end of (half|game)|halftime/i, kind: 'half', dur: 600 },
  { re: /end (of )?(quarter|period|1st|3rd)/i, kind: 'quarter', dur: 100 },
  // 2026-11-05: the warning's stamp came 35 s before the next snap, so the stamp marks the end of the break
  { re: /two.minute warning/i, kind: 'twomin', dur: 25 },
  { re: /timeout/i, kind: 'timeout', dur: 60 },
  { re: /official review|challenge|replay|injur/i, kind: 'review', dur: 60 },
  { re: /touchdown/i, kind: 'td', dur: 45 },
  { re: /field goal (is )?good|extra point|kick is good|safety/i, kind: 'score', dur: 45 },
  { re: /kicks? \d+ yards|kickoff|punts?\b/i, kind: 'kick', dur: 25 },
  { re: /incomplete|incompletion/i, kind: 'incomplete', dur: 22 },
  { re: /penalty/i, kind: 'penalty', dur: 25 },
];
export function stopRule(type, text) {
  const s = (type || '') + ' ' + (text || '');
  for (const r of STOP_RULES) if (r.re.test(s)) return r;
  return null;
}


// Score feed (push) reducer. Folds a patch list or a full game package into a flat state:
// { period, clock, homeScore, awayScore, state, lastPlayId, lastPlayText, lastPlayType, lastPlayWallclock }.
// Paths follow the game package (header.competitions[0]...). The home side index is learned from a
// full package when one is seen, else assumed to be 0. Unknown paths are ignored.
export function fastcastReduce(prev, payload) {
  const st = Object.assign({ period: null, clock: null, homeScore: null, awayScore: null, state: null, lastPlayId: null, lastPlayText: null, lastPlayType: null, lastPlayWallclock: null, homeIdx: 0 }, prev || {});
  if (!payload) return st;
  const doc = payload.doc || (payload.header ? payload : null);
  const takePlay = (pl) => {
    if (!pl || typeof pl !== 'object' || !pl.id) return;
    const w = pl.wallclock ? Date.parse(pl.wallclock) : null;
    const cur = st.lastPlayWallclock ? Date.parse(st.lastPlayWallclock) : null;
    if (cur && w && w < cur) return;
    st.lastPlayId = String(pl.id); st.lastPlayText = pl.text || null;
    st.lastPlayType = pl.type && typeof pl.type === 'object' ? pl.type.text : pl.type || null;
    st.lastPlayWallclock = pl.wallclock || null;
  };
  if (doc && doc.header) {
    const c = doc.header.competitions && doc.header.competitions[0];
    if (c) {
      const s = c.status || {};
      if (s.period !== undefined) st.period = s.period;
      if (s.displayClock !== undefined) st.clock = s.displayClock;
      if (s.type && s.type.state) st.state = s.type.state;
      (c.competitors || []).forEach((cp, i) => {
        if (cp.homeAway === 'home') { st.homeIdx = i; st.homeScore = Number(cp.score); }
        if (cp.homeAway === 'away') st.awayScore = Number(cp.score);
      });
    }
    const plays = doc.drives && doc.drives.current && doc.drives.current.plays;
    if (Array.isArray(plays)) plays.forEach(takePlay);
  }
  const list = Array.isArray(payload) ? payload : Array.isArray(payload.list) ? payload.list : null;
  if (list) {
    for (const op of list) {
      if (!op || typeof op.path !== 'string') continue;
      const p = op.path; const v = op.value;
      let m;
      if (/status\/displayClock$/.test(p)) st.clock = v;
      else if (/status\/period$/.test(p)) st.period = v;
      else if (/status\/type\/state$/.test(p)) st.state = v;
      else if ((m = p.match(/competitions\/0\/competitors\/(\d+)\/score$/))) {
        if (+m[1] === st.homeIdx) st.homeScore = Number(v); else st.awayScore = Number(v);
      } else if (/plays\/(\d+|-)$/.test(p) && v && typeof v === 'object') takePlay(v);
      else if (/status$/.test(p) && v && typeof v === 'object') {
        if (v.displayClock !== undefined) st.clock = v.displayClock;
        if (v.period !== undefined) st.period = v.period;
        if (v.type && v.type.state) st.state = v.type.state;
      }
    }
  }
  return st;
}

const toMs = (t) => (typeof t === 'number' ? t : Date.parse(t));
// Event time. A replay relay re-stamps t; its data.origT keeps the recorded time, so replays at any speed measure true gaps.
export const eventTime = (ev) => toMs(ev && ev.data && ev.data.origT ? ev.data.origT : ev.t);
const num = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/^\+/, ''));
  return Number.isFinite(n) ? n : null;
};
const signed = (n) => (n === null ? null : n > 0 ? '+' + n : String(n));
function clockSec(c) {
  if (c === null || c === undefined) return null;
  if (typeof c === 'number') return Math.round(c);
  const m = String(c).match(/(\d+):(\d{1,2})/);
  return m ? +m[1] * 60 + +m[2] : null;
}
function periodNum(p) {
  if (p === null || p === undefined || p === '') return null;
  if (typeof p === 'number') return p;
  const s = String(p).toLowerCase();
  if (s.includes('ot')) return 5;
  const m = s.match(/(\d)/);
  return m ? +m[1] : null;
}
function elapsed(period, c) {
  if (period === null || c === null) return null;
  return period <= 4 ? (period - 1) * 900 + (900 - c) : 3600 + (period - 5) * 600 + (600 - c);
}
function mk(o) {
  if (!o || typeof o !== 'object') return null;
  const line = num(o.line);
  const odds = num(o.odds);
  if (line === null && odds === null) return null;
  return { line: signed(line), odds: signed(odds), available: o.available };
}

export function createLock(options = {}) {
  const cfg = Object.assign({}, DEFAULTS, options);
  const st = {
    odds: null, // { t, available, markets, key, scoreKey, state }
    lastRawChangeT: null,
    lastPlay: null, // { id, wall, firstKnown, stop }
    playsSeen: new Set(),
    clocks: {}, // lane -> { e, since, prevE }
    snapTap: null,
    whistleTap: null,
    live: { sgo: null, espn: null, fastcast: null }, // 'pre' | 'in' | 'post'
    openSince: null,
    lastOpen: null,
  };

  function noteChange(t) { st.lastRawChangeT = t; }

  function onClock(lane, period, clock, t) {
    const e = elapsed(periodNum(period), clockSec(clock));
    if (e === null) return;
    const c = st.clocks[lane] || (st.clocks[lane] = { e: null, since: null, prevE: null });
    if (c.e === e) return;
    c.prevE = c.e; c.e = e; c.since = t;
  }

  function onPlay(p, t) {
    if (!p || !p.id) return;
    const id = String(p.id);
    if (st.playsSeen.has(id)) return;
    st.playsSeen.add(id);
    if (st.playsSeen.size > 600) st.playsSeen.delete(st.playsSeen.values().next().value);
    const type = p.type && typeof p.type === 'object' ? p.type.text : p.type;
    const wall = p.wallclock ? toMs(p.wallclock) : null;
    const cand = { id, wall, firstKnown: t, stop: stopRule(type, p.text), text: p.text || null };
    // keep the play with the newest stamp; plays can arrive out of order inside one read
    if (!st.lastPlay || (wall && st.lastPlay.wall ? wall >= st.lastPlay.wall : true)) st.lastPlay = cand;
  }

  function ingest(ev) {
    if (!ev || !ev.lane || !ev.data) return;
    const t = eventTime(ev);
    if (!Number.isFinite(t)) return;
    const d = ev.data;
    if (d.error) return;
    if (ev.lane === 'sgo') {
      const markets = { spread: mk(d.spreadHome), total: mk(d.total), mlHome: mk(d.mlHome), mlAway: mk(d.mlAway) };
      const key = JSON.stringify([markets.spread, markets.total, markets.mlHome, markets.mlAway].map((x) => (x ? [x.line, x.odds] : null)));
      const scoreKey = d.awayScore + '-' + d.homeScore;
      const av = [d.spreadHome, d.total, d.mlHome].filter(Boolean).map((x) => x.available);
      const prev = st.odds;
      if (prev && (prev.key !== key || prev.scoreKey !== scoreKey)) noteChange(t);
      st.odds = { t, available: av.length ? !av.includes(false) : null, markets, key, scoreKey };
      st.live.sgo = d.ended || d.finalized ? 'post' : d.started ? 'in' : 'pre';
      onClock('sgo', d.period, d.clock, t);
    } else if (ev.lane === 'espn' || ev.lane === 'fastcast') {
      const p = ev.lane === 'fastcast' ? d.payload || d : d;
      if (ev.lane === 'espn') {
        st.live.espn = d.completed ? 'post' : d.state || null;
        const sk = d.awayScore + '-' + d.homeScore;
        if (st.espnScore && st.espnScore !== sk) noteChange(t);
        st.espnScore = sk;
        onClock('espn', d.period, d.clock, t);
        const list = Array.isArray(d.plays) && d.plays.length ? d.plays : d.lastPlayId ? [{ id: d.lastPlayId, text: d.lastPlayText, type: d.lastPlayType, wallclock: d.lastPlayWallclock }] : [];
        for (const pl of list) onPlay(pl, t);
      } else {
        const f = (st.fc = fastcastReduce(st.fc, p));
        onClock('fastcast', f.period, f.clock, t);
        if (f.lastPlayId) onPlay({ id: f.lastPlayId, text: f.lastPlayText, type: f.lastPlayType, wallclock: f.lastPlayWallclock }, t);
        if (f.state) st.live.fastcast = f.state;
        const sk = f.awayScore + '-' + f.homeScore;
        if (f.homeScore !== null && st.fcScore && st.fcScore !== sk) noteChange(t);
        if (f.homeScore !== null) st.fcScore = sk;
      }
    } else if (ev.lane === 'mark') {
      if (d.kind === 'snap') st.snapTap = t;
      if (d.kind === 'whistle') st.whistleTap = t;
      if (d.kind === 'score') noteChange(t);
    }
  }

  function inPlay() {
    const v = Object.values(st.live);
    return v.includes('in') && !v.includes('post');
  }

  function windowNow(now) {
    const p = st.lastPlay;
    let end = null; let kind = null; let blocked = null;
    if (p && p.stop) {
      const anchor = p.wall || p.firstKnown - cfg.unknownLag * 1000;
      const dur = (cfg.durations && cfg.durations[p.stop.kind]) || p.stop.dur;
      end = anchor + (dur - cfg.guard) * 1000;
      kind = p.stop.kind;
      for (const c of Object.values(st.clocks)) {
        if (c.since !== null && c.since > p.firstKnown + 1000 && c.prevE !== null && c.e > c.prevE) { end = null; blocked = 'the game clock moved after the stop'; break; }
      }
    }
    if (st.whistleTap && (!st.snapTap || st.whistleTap > st.snapTap) && (!p || st.whistleTap > p.firstKnown)) {
      const e2 = st.whistleTap + (cfg.whistleWindow - cfg.guard) * 1000;
      if (end === null || e2 > end) { end = e2; kind = 'TV whistle'; blocked = null; }
    }
    // The ruler window: the odds feed clock just changed, so a play just ended; the next snap is at least
    // about 12 s away (2026-11-05: 12 to 36 s after the update). Open a short slice right after it.
    const oc = st.clocks.sgo;
    // A drop under rulerMinDrop game seconds means the clock just started on a ready signal: ball about to be live.
    if (cfg.ruler && oc && oc.since !== null && oc.prevE !== null && oc.e - oc.prevE >= cfg.rulerMinDrop) {
      const a = oc.since + cfg.rulerFrom * 1000; const b = oc.since + cfg.rulerTo * 1000;
      if (now >= a && now < b && (end === null || now >= end || blocked)) { end = b; kind = 'clock ruler'; blocked = null; }
    }
    if (st.snapTap && st.snapTap > Math.max(p ? p.firstKnown : 0, oc && oc.since ? oc.since : 0) && (!st.whistleTap || st.snapTap > st.whistleTap)) { end = null; blocked = 'TV saw a snap'; }
    return { end, kind, blocked, play: p };
  }

  function status(now) {
    if (now === undefined) now = Date.now();
    const o = st.odds;
    const markets = { spreadHome: null, spreadAway: null, totalOver: null, totalUnder: null, mlHome: null, mlAway: null };
    if (o && o.available !== false) {
      const m = o.markets;
      if (m.spread) { markets.spreadHome = { line: m.spread.line, odds: m.spread.odds }; markets.spreadAway = { line: signed(-num(m.spread.line)), odds: null }; }
      if (m.total) { markets.totalOver = { line: m.total.line ? String(num(m.total.line)) : null, odds: m.total.odds }; markets.totalUnder = { line: m.total.line ? String(num(m.total.line)) : null, odds: null }; }
      if (m.mlHome) markets.mlHome = { line: null, odds: m.mlHome.odds };
      if (m.mlAway) markets.mlAway = { line: null, odds: m.mlAway.odds };
    }
    let reason = null;
    const w = windowNow(now);
    if (!inPlay()) reason = st.odds || st.live.espn ? 'Game is not live' : 'No data yet';
    else if (!o) reason = 'No odds feed reading yet';
    else if (o.available === false) reason = 'The odds feed has the line off';
    else if ((now - o.t) / 1000 > cfg.feedFresh) reason = 'Odds feed reading is ' + Math.round((now - o.t) / 1000) + ' s old';
    else if (st.lastRawChangeT !== null && (now - st.lastRawChangeT) / 1000 < cfg.settle) reason = 'Price, line or score moved ' + Math.round((now - st.lastRawChangeT) / 1000) + ' s ago';
    else if (w.blocked) reason = 'Locked: ' + w.blocked;
    else if (w.end === null) reason = 'Ball live or about to be: no known stop';
    else if (now >= w.end) reason = 'Dead ball window (' + w.kind + ') ran out';
    const open = reason === null;
    if (open !== st.lastOpen) { st.openSince = now; st.lastOpen = open; }
    return {
      open,
      reason: open ? 'Open: ' + w.kind + ' window, ' + Math.max(0, Math.round((w.end - now) / 1000)) + ' s left' : reason,
      sinceMs: st.openSince,
      markets,
      windowLeft: open ? (w.end - now) / 1000 : null,
      windowKind: w.kind,
      live: inPlay(),
    };
  }

  function tryPick(pick, now) {
    if (now === undefined) now = Date.now();
    const s = status(now);
    if (!s.open) return { accepted: false, reason: s.reason };
    const key = { spread: pick.side === 'away' ? 'spreadAway' : 'spreadHome', total: pick.side === 'under' ? 'totalUnder' : 'totalOver', ml: pick.side === 'away' ? 'mlAway' : 'mlHome', moneyline: pick.side === 'away' ? 'mlAway' : 'mlHome' }[pick.market];
    const cur = key ? s.markets[key] : null;
    if (!cur) return { accepted: false, reason: 'That market is not on the Board right now' };
    const same = (a, b) => (a === null || a === undefined || b === null || b === undefined ? true : num(a) === num(b));
    if (!same(pick.shownLine, cur.line)) return { accepted: false, reason: 'The line moved to ' + cur.line };
    if (!same(pick.shownOdds, cur.odds)) return { accepted: false, reason: 'The price moved to ' + cur.odds };
    return { accepted: true, reason: s.reason };
  }

  return { ingest, status, tryPick, _state: st, config: cfg };
}
