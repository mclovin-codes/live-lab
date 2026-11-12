// Gold lock: "hold or hide". ES module, no DOM, no fetch.
// A price is shown only when it is fresh, quiet, and likely to survive the
// player's tap time. Otherwise every market is hidden (null) and picks are refused
// at the tap with the reason. Never pending, never voided later.
import { createEngine, priceKey, num } from './core.js';

export const LOCK_VERSION = 'gold-lock-1';

const WHY = {
  'feed silent': 'Prices paused: the odds feed has gone quiet',
  'final': 'Game over',
  'book off': 'Prices paused: the market is off',
  'score': 'Prices paused: a score just happened',
  'play': 'Prices paused: a play is on',
  'price moved': 'Prices paused: the line just moved',
  'clock running': 'Prices paused: the clock is running',
};
export function plainReason(why) {
  if (!why) return '';
  if (WHY[why]) return WHY[why];
  if (why.startsWith('hold')) return `Prices paused: likely to move before a tap lands (${why})`;
  return why;
}

export function createLock(options = {}) {
  const eng = options.engine || createEngine(options);
  const S = eng.S;
  let lastState = null, lastChange = null;

  function marketsOpen() { return markets({ open: true }); }
  function markets(st) {
    if (!st.open) return { spreadHome: null, spreadAway: null, totalOver: null, totalUnder: null, mlHome: null, mlAway: null };
    const h = (m) => S.pHead[m]?.p || null;
    const sp = h('spread'), to = h('total'), mh = h('mlHome'), ma = h('mlAway');
    return {
      spreadHome: sp ? { line: sp.line, odds: sp.odds } : null,
      spreadAway: sp && sp.line !== null ? { line: -sp.line, odds: null } : null,
      totalOver: to ? { line: to.line, odds: to.odds } : null,
      totalUnder: to ? { line: to.line, odds: null } : null,
      mlHome: mh ? { line: null, odds: mh.odds } : null,
      mlAway: ma ? { line: null, odds: ma.odds } : null,
    };
  }

  function status(nowMs = Date.now()) {
    eng.tick(nowMs);
    const st = eng.goldLock(nowMs);
    if (!lastState || lastState.open !== st.open) lastChange = nowMs;
    if (st.open) lastOpenAt = nowMs;
    lastState = st;
    const reason = st.open ? `Open: prices likely to hold through a ${eng.cfg.tap} s tap (${st.why})` : plainReason(st.why);
    return { open: st.open, reason, code: st.why, sinceMs: nowMs - (lastChange ?? nowMs), markets: markets(st) };
  }

  // Last time the lock was open, so a tap already in flight survives a soft close (the hold forecast only).
  let lastOpenAt = null;
  function tryPick(pick, nowMs = Date.now()) {
    let s = status(nowMs);
    const inFlight = !s.open && s.code && s.code.startsWith('hold') && lastOpenAt !== null && nowMs - lastOpenAt <= eng.cfg.tap * 1000;
    if (!s.open && !inFlight) return { accepted: false, reason: s.reason };
    if (inFlight) s = { ...s, markets: marketsOpen() };
    const key = pick.market && pick.side ? `${pick.market}${pick.side[0].toUpperCase()}${pick.side.slice(1)}` : pick.market;
    const cur = s.markets[key] || s.markets[pick.market];
    if (!cur) return { accepted: false, reason: 'That price is not on the Board right now' };
    const sl = num(pick.shownLine), so = num(pick.shownOdds);
    if (cur.line !== null && sl !== null && cur.line !== sl) return { accepted: false, reason: `The line moved to ${cur.line}` };
    if (cur.odds !== null && so !== null && cur.odds !== so) return { accepted: false, reason: `The price moved to ${cur.odds > 0 ? '+' : ''}${cur.odds}` };
    return { accepted: true, reason: 'Accepted at the price shown' };
  }

  return { ingest: (ev) => eng.ingest(ev), status, tryPick, engine: eng };
}
