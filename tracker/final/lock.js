// Final lock, v1. ES module, no DOM, no fetch.
// createLock(options) returns { ingest(event), status(nowMs), tryPick(pick, nowMs) } like the team locks.
//
// Rule: OPEN only when Red reports a known break window AND Blue reports open.
// At the tap it also refuses when the shown price moved inside the last 10 s, or
// differs from the newest price in any live price lane (Odds feed when present,
// Score feed (push) always). Gold's own lock stays shut without the Odds feed, so
// Gold's survival idea is used here as the tap-time guard instead.
import { createLock as createRed } from '../../teams/red/tracker/lock.js'
import { createLock as createBlue, fastcastReduce } from '../../teams/blue/tracker/lock.js'
import { createLock as createGold } from '../../teams/gold/tracker/lock.js'

export const VERSION = 'v1'
export const KEYS = ['spreadAway', 'spreadHome', 'totalOver', 'totalUnder', 'mlAway', 'mlHome']
const QUIET_MS = 10000
const FRESH_MS = 20000

export const num = (v) => {
  if (v === null || v === undefined || v === '') return null
  const m = String(typeof v === 'object' ? v.odds : v).match(/[+-]?\d+(\.\d+)?/)
  if (!m) return null
  const n = Number(m[0])
  return Number.isFinite(n) ? n : null
}
const tOf = (ev) => {
  const t = Date.parse(ev && ev.t)
  return Number.isFinite(t) ? t : null
}

// Main market prices from one push feed state (pickcenter patches).
export function pushMarkets(pc) {
  if (!pc) return null
  const p = (line, odds) => {
    const l = num(pc[line]), o = num(pc[odds])
    return l === null && o === null ? null : { line: l, odds: o }
  }
  const m = {
    spreadAway: p('pointSpread.away.line', 'pointSpread.away.odds'),
    spreadHome: p('pointSpread.home.line', 'pointSpread.home.odds'),
    totalOver: p('total.over.line', 'total.over.odds'),
    totalUnder: p('total.under.line', 'total.under.odds'),
    mlAway: num(pc['moneyline.away.odds']) === null ? null : { line: null, odds: num(pc['moneyline.away.odds']) },
    mlHome: num(pc['moneyline.home.odds']) === null ? null : { line: null, odds: num(pc['moneyline.home.odds']) },
  }
  return Object.values(m).some(Boolean) ? m : null
}
// Main market prices from an Odds feed event.
export function oddsFeedMarkets(d) {
  if (!d || d.error != null) return null
  const sp = d.spreadHome, to = d.total
  const m = {
    spreadHome: sp ? { line: num(sp.line), odds: num(sp.odds) } : null,
    spreadAway: sp && num(sp.line) !== null ? { line: -num(sp.line), odds: null } : null,
    totalOver: to ? { line: num(to.line), odds: num(to.odds) } : null,
    totalUnder: to ? { line: num(to.line), odds: null } : null,
    mlHome: d.mlHome ? { line: null, odds: num(d.mlHome) } : null,
    mlAway: d.mlAway ? { line: null, odds: num(d.mlAway) } : null,
  }
  return Object.values(m).some(Boolean) ? m : null
}
export function marketKey(pick) {
  const away = pick.side === 'away', under = pick.side === 'under'
  if (pick.market === 'spread') return away ? 'spreadAway' : 'spreadHome'
  if (pick.market === 'total') return under ? 'totalUnder' : 'totalOver'
  return away ? 'mlAway' : 'mlHome'
}
const same = (a, b) => a === null || a === undefined || b === null || b === undefined || num(a) === num(b)
const fmt = (o) => (o === null || o === undefined ? '' : (o > 0 ? '+' : '') + o)

export function createLock(options = {}) {
  const red = options.red || createRed(options.redOptions || {})
  const blue = options.blue || createBlue(options.blueOptions || {})
  let gold = null
  try { gold = options.gold || createGold(options.goldOptions || {}) } catch (e) { gold = null }
  const safe = (fn, d) => { try { return fn() } catch (e) { return d } }

  let fc = null
  const lanes = { sgo: { m: null, t: null }, fastcast: { m: null, t: null } }
  const changedAt = {} // market key -> last time any live price lane changed it
  const last = {} // lane:key -> 'line|odds'
  let lastNow = null

  function notePrices(lane, m, t) {
    if (!m) return
    lanes[lane] = { m, t }
    for (const k of KEYS) {
      const v = m[k] ? m[k].line + '|' + m[k].odds : 'none'
      const id = lane + ':' + k
      if (last[id] !== undefined && last[id] !== v) changedAt[k] = Math.max(changedAt[k] || 0, t)
      last[id] = v
    }
  }

  function ingest(ev) {
    if (!ev || !ev.lane) return
    safe(() => red.ingest(ev))
    safe(() => blue.ingest(ev))
    if (gold) safe(() => gold.ingest(ev))
    const t = tOf(ev)
    if (t === null || !ev.data || ev.data.error != null) return
    lastNow = Math.max(lastNow || 0, t)
    if (ev.lane === 'fastcast') {
      fc = safe(() => fastcastReduce(fc, ev.data.payload || ev.data), fc)
      if (fc) notePrices('fastcast', pushMarkets(fc.pc), t)
    } else if (ev.lane === 'sgo') {
      notePrices('sgo', oddsFeedMarkets(ev.data), t)
    }
  }

  // The freshest price source: the Odds feed when it read inside 20 s, else the push feed.
  function source(now) {
    const s = lanes.sgo
    if (s.m && now - s.t < FRESH_MS) return { name: 'Odds feed', m: s.m, t: s.t }
    const f = lanes.fastcast
    if (f.m) return { name: 'Score feed (push)', m: f.m, t: f.t }
    return null
  }

  function teams(now) {
    const r = safe(() => red.status(now), null)
    const b = safe(() => blue.status(now), null)
    const g = gold ? safe(() => gold.status(now), null) : null
    const pick = (s) => (s ? { open: !!s.open, reason: String(s.reason || '') } : { open: false, reason: 'Lock not loaded' })
    return { red: pick(r), blue: pick(b), gold: pick(g) }
  }

  function status(nowMs) {
    const now = nowMs ?? lastNow ?? Date.now()
    const tm = teams(now)
    const src = source(now)
    const held = []
    if (!tm.red.open) held.push('Red: ' + tm.red.reason)
    if (!tm.blue.open) held.push('Blue: ' + tm.blue.reason)
    if (!src) held.push('No live prices yet')
    const open = held.length === 0
    const markets = {}
    for (const k of KEYS) markets[k] = open && src && src.m[k] && src.m[k].odds !== null ? { line: src.m[k].line, odds: src.m[k].odds } : null
    return {
      open,
      reason: open ? 'Open: Red has a known break and Blue is open' : held.join('. '),
      priceSource: src ? src.name : null,
      noOddsFeed: !(lanes.sgo.m && now - lanes.sgo.t < FRESH_MS),
      sinceMs: null,
      markets,
      teams: tm,
    }
  }

  function tryPick(pick, nowMs) {
    const now = nowMs ?? lastNow ?? Date.now()
    const s = status(now)
    if (!s.open) return { accepted: false, reason: 'Locked: ' + s.reason }
    const k = marketKey(pick)
    const cur = s.markets[k]
    if (!cur) return { accepted: false, reason: 'That price is not on the Board right now' }
    if (changedAt[k] && now - changedAt[k] < QUIET_MS) return { accepted: false, reason: 'Refused: this price moved ' + Math.round((now - changedAt[k]) / 1000) + ' s ago, wait for 10 s of quiet' }
    for (const [lane, label] of [['sgo', 'Odds feed'], ['fastcast', 'Score feed (push)']]) {
      const L = lanes[lane]
      if (!L.m || now - L.t > FRESH_MS) continue
      const x = L.m[k]
      if (!x) continue
      if (!same(pick.shownLine, x.line)) return { accepted: false, reason: 'Refused: the ' + label + ' line is now ' + x.line }
      if (!same(pick.shownOdds, x.odds)) return { accepted: false, reason: 'Refused: the ' + label + ' price is now ' + fmt(x.odds) }
    }
    return { accepted: true, reason: 'Accepted at the price shown' }
  }

  return { ingest, status, tryPick, teams, lanes, changedAt, version: VERSION }
}

// ---------- scoring: open share and bad opens ----------
// An open is bad if a snap or a price move lands inside it. Snaps are play stamps
// (wallclock, known late) and TV snap taps; price moves are first-seen changes.
const NOT_SNAP = /timeout|end of|end period|two-minute|end game|coin toss|official/i
export function createScorer() {
  const opens = [] // [start, end|null]
  const snaps = new Set()
  const moves = []
  let inGameMs = 0, lastT = null, wasOpen = false, live = false
  return {
    noteSnap(ms) { if (Number.isFinite(ms)) snaps.add(ms) },
    notePlay(p) {
      if (!p || !p.wallclock) return
      const type = p.type && typeof p.type === 'object' ? p.type.text : p.type
      if (NOT_SNAP.test(String(type || '')) || NOT_SNAP.test(String(p.text || '').slice(0, 30))) return
      this.noteSnap(Date.parse(p.wallclock))
    },
    noteMove(ms) { if (Number.isFinite(ms)) moves.push(ms) },
    step(t, isOpen, isLive) {
      if (lastT !== null && live) inGameMs += t - lastT
      live = isLive
      const o = isOpen && isLive
      if (o && !wasOpen) opens.push([t, null])
      if (!o && wasOpen) opens[opens.length - 1][1] = t
      wasOpen = o
      lastT = t
    },
    result(now) {
      const iv = opens.map(([a, b]) => [a, b === null ? now : b])
      const openMs = iv.reduce((s, [a, b]) => s + (b - a), 0)
      const sn = [...snaps]
      let bad = 0, hit = 0
      for (const [a, b] of iv) if (sn.some((x) => x >= a && x < b) || moves.some((x) => x >= a && x < b)) bad++
      for (const x of sn) if (iv.some(([a, b]) => x >= a && x < b)) hit++
      return { opens: iv.length, bad, openShare: inGameMs > 0 ? openMs / inGameMs : 0, openSec: openMs / 1000, snaps: sn.length, snapsHit: hit }
    },
  }
}
