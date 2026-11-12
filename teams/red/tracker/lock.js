// Red lock module. ES module, no DOM, no fetch.
// createLock(options) -> { ingest(event), status(nowMs), tryPick(pick, nowMs) }
// The Red tracker page uses this same module, so the page and the lab app agree.
import { Tracker, VERSION } from './core.js';

export { VERSION };

export function createLock(options = {}) {
  const tr = options.tracker || new Tracker(options.params || {});
  let sinceMs = null, lastOpen = null;

  const N = (x) => { if (x === null || x === undefined || x === '') return null; const v = Number(String(typeof x === 'object' ? x.odds : x).replace('+', '')); return Number.isFinite(v) ? v : null; };
  const EMPTY = { spreadHome: null, spreadAway: null, totalOver: null, totalUnder: null, mlHome: null, mlAway: null };
  // Prices come from the freshest lane that carries them: the odds feed when it
  // has read inside 20 s, else the Rush lane.
  function markets(now) {
    if (tr.state.available === false || tr.state.ended) return { ...EMPTY };
    const g = tr.snap.sgo, r = tr.snap.rush;
    const fresh = g && g.prices && Object.keys(g.prices).length && (now - g.t) < 20000;
    const src = fresh ? g : (r && r.prices && Object.keys(r.prices).length ? r : null);
    if (!src) return { ...EMPTY };
    const S = src.prices.S, T = src.prices.T, M = src.prices.M;
    const raw = src.raw || {};
    const rm = (raw.raw && raw.raw.markets) || {};
    const spreadAwayOdds = rm.spread && rm.spread.away ? N(rm.spread.away.payout) : (raw.spreadAway ? N(raw.spreadAway) : null);
    const underOdds = rm.total ? N(rm.total.under_payout) : (raw.totalUnder ? N(raw.totalUnder) : null);
    return {
      spreadHome: S ? { line: S.line, odds: S.odds } : null,
      spreadAway: S && S.line !== null ? { line: -S.line, odds: spreadAwayOdds } : null,
      totalOver: T ? { line: T.line, odds: T.odds } : null,
      totalUnder: T ? { line: T.line, odds: underOdds } : null,
      mlHome: M ? { line: null, odds: M.odds } : null,
      mlAway: N(raw.mlAway) !== null ? { line: null, odds: N(raw.mlAway) } : null,
    };
  }

  function status(nowMs) {
    const now = nowMs ?? tr.lastTick ?? Date.now();
    const o = tr.redOpen(now);
    const open = o === true || (o === null && !tr.state.started && !!(tr.snap.sgo || tr.snap.rush));
    if (open !== lastOpen) { lastOpen = open; sinceMs = now; }
    return { open, reason: open ? (tr.state.started ? tr.lockReason(now) : 'Pregame line') : tr.lockReason(now), sinceMs, markets: markets(now) };
  }

  function tryPick(pick, nowMs) {
    const now = nowMs ?? tr.lastTick ?? Date.now();
    const s = status(now);
    if (!s.open) return { accepted: false, reason: 'Locked: ' + s.reason };
    const key = pick.market === 'spread' ? (pick.side === 'away' ? 'spreadAway' : 'spreadHome')
      : pick.market === 'total' ? (pick.side === 'under' ? 'totalUnder' : 'totalOver')
      : (pick.side === 'away' ? 'mlAway' : 'mlHome');
    const m = s.markets[key];
    if (!m) return { accepted: false, reason: 'No live price for this side' };
    const sl = pick.shownLine === undefined || pick.shownLine === null ? null : Number(pick.shownLine);
    const so = pick.shownOdds === undefined || pick.shownOdds === null ? null : Number(pick.shownOdds);
    if (m.line !== null && sl !== null && sl !== m.line) return { accepted: false, reason: 'Line changed to ' + m.line + ': take the new line' };
    if (m.odds !== null && so !== null && so !== m.odds) return { accepted: false, reason: 'Price changed to ' + (m.odds > 0 ? '+' : '') + m.odds + ': take the new price' };
    return { accepted: true, reason: 'Accepted at the shown price' };
  }

  return { ingest: (ev) => tr.ingest(ev), status, tryPick, tracker: tr };
}
