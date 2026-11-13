// Final tracker page, v1. Reads the laptop relay only (localhost), never writes
// anything but /mark kind "pick" from the pick test.
import { createLock, createScorer, num, pushMarkets } from './lock.js'
import { fastcastReduce } from '../../teams/blue/tracker/lock.js'
import { relayBase, relayUrl, isLocalRelay, connectFastcast } from '../shared/fastcast.js'

const $ = (id) => document.getElementById(id)
const esc = (v) => String(v === null || v === undefined || (typeof v === 'number' && !Number.isFinite(v)) ? '-' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const txt = (id, v) => { const el = $(id); if (el) el.textContent = v === null || v === undefined || (typeof v === 'number' && !Number.isFinite(v)) ? '-' : String(v) }
const sec = (ms) => (Number.isFinite(ms) ? (ms / 1000).toFixed(1) + ' s' : '-')
const odds = (o) => (Number.isFinite(o) ? (o > 0 ? '+' : '') + o : '-')
const line = (l) => (Number.isFinite(l) ? (l > 0 ? '+' : '') + l : '')
const LANE = { sgo: 'Odds feed', rush: 'Rush', espn: 'Score feed (poll)', fastcast: 'Score feed (push)', mark: 'TV' }

const base = relayBase()
const local = isLocalRelay(base)
const lock = createLock()
const score = createScorer()
let seq = 0
let skew = 0
let connected = false
let live = false
let fc = null
let pushMsgs = 0
let pushLaneT = null
let espnId = '401873052'
let pushStarted = false
function startPush() {
  if (pushStarted) return
  pushStarted = true
  try {
    connectFastcast({ eventId: espnId, league: 'NFL', post: true, source: 'final', onMessage: (m) => { if (m && m.op === 'P') pushMsgs++ } })
  } catch (e) { pushStarted = false }
}
let home = 'Home', away = 'Away'
const now = () => Date.now() + skew

// ---------- lag tracking: Rush behind the fastest lane ----------
const first = { clock: {}, score: {}, price: {} } // kind -> key -> {lane: firstT}
const lags = { clock: [], score: [], price: [] }
// Prices repeat, so a price lag compares onsets: the moment a lane switched TO a value.
const onsets = {} // key -> {lane: [t, ...]}
const curPrice = {} // lane|market -> key
function priceSee(key, lane, t) {
  const mkt = key.split('|')[0]
  if (curPrice[lane + '|' + mkt] === key) return
  curPrice[lane + '|' + mkt] = key
  const o = (onsets[key] ||= {})
  ;(o[lane] ||= []).push(t)
  if (lane !== 'rush') return
  let best = null
  for (const [l, ts] of Object.entries(o)) if (l !== 'rush') for (const x of ts) if (x <= t && (best === null || x > best)) best = x
  void best
}
// Price timing (Gold's method): when the book price on the push lane moves a market,
// how long until Rush's price for that market next changes. Capped at 60 s; a move
// Rush has not followed inside 60 s counts as never followed.
const FOLLOW_CAP = 60000
const moves = [] // {m, t, done}
let neverFollowed = 0
const pushKey = {}, rushKey = {}
function pushMove(m, key, t) {
  if (pushKey[m] !== undefined && pushKey[m] !== key) moves.push({ m, t, done: false })
  pushKey[m] = key
}
function rushMove(m, key, t) {
  const changed = rushKey[m] !== undefined && rushKey[m] !== key
  rushKey[m] = key
  for (const mv of moves) {
    if (mv.done) continue
    if (t - mv.t > FOLLOW_CAP) { mv.done = true; neverFollowed++; continue }
    if (changed && mv.m === m && t > mv.t) { mv.done = true; lags.price.push(t - mv.t) }
  }
  if (moves.length > 2000) moves.splice(0, moves.length - 2000)
}
function expireMoves(t) { for (const mv of moves) if (!mv.done && t - mv.t > FOLLOW_CAP) { mv.done = true; neverFollowed++ } }
const cur = {} // lane -> {clock: {p, c, key, el}, score}
function clockKey(period, clock) {
  const p = num(period)
  const m = /(\d+):(\d{1,2})/.exec(String(clock || ''))
  if (p === null || !m) return null
  return { key: p + '|' + Number(m[1]) + ':' + m[2].padStart(2, '0'), p, label: 'Q' + p + ' ' + Number(m[1]) + ':' + m[2].padStart(2, '0'), el: (p - 1) * 900 + (900 - (Number(m[1]) * 60 + Number(m[2]))) }
}
function see(kind, key, lane, t) {
  if (!key) return
  const rec = (first[kind][key] ||= {})
  if (rec[lane] !== undefined) return
  rec[lane] = t
  if (lane === 'rush') {
    const others = Object.entries(rec).filter(([l]) => l !== 'rush' && l !== 'mark').map(([, v]) => v)
    if (others.length) lags[kind].push(Math.max(0, t - Math.min(...others)))
  }
}
function rushPriceKeys(d) {
  const rm = (d.raw && d.raw.markets) || {}
  const out = []
  if (rm.spread && rm.spread.home) out.push('spreadHome|' + num(rm.spread.home.point) + '|' + num(rm.spread.home.payout))
  if (rm.total) out.push('totalOver|' + num(rm.total.line) + '|' + num(rm.total.over_payout))
  if (num(d.mlHome) !== null) out.push('mlHome|null|' + num(d.mlHome))
  return out
}
function pushPriceKeys(pc) {
  if (!pc) return []
  return [
    'spreadHome|' + num(pc['pointSpread.home.line']) + '|' + num(pc['pointSpread.home.odds']),
    'totalOver|' + num(pc['total.over.line']) + '|' + num(pc['total.over.odds']),
    'mlHome|null|' + num(pc['moneyline.home.odds']),
  ]
}

function take(ev) {
  if (!ev || typeof ev.seq !== 'number' || ev.seq <= seq) return
  seq = ev.seq
  lock.ingest(ev)
  const t = Date.parse(ev.t)
  const d = ev.data || {}
  if (!Number.isFinite(t) || d.error != null) return
  if (ev.lane === 'espn') {
    live = d.state === 'in'
    for (const p of d.plays || []) score.notePlay(p)
    const ck = clockKey(d.period, d.clock)
    cur.espn = { ck: ck || (cur.espn && cur.espn.ck) || null, sc: d.awayScore != null ? d.awayScore + '-' + d.homeScore : null, t }
    see('clock', ck && ck.key, 'espn', t)
    see('score', cur.espn.sc, 'espn', t)
  } else if (ev.lane === 'fastcast') {
    pushLaneT = t
    fc = fastcastReduce(fc, d.payload || d)
    const ck = clockKey(fc.period, fc.clock)
    cur.fastcast = { ck: ck || (cur.fastcast && cur.fastcast.ck) || null, sc: fc.homeScore != null ? fc.awayScore + '-' + fc.homeScore : null, t }
    see('clock', ck && ck.key, 'fastcast', t)
    see('score', cur.fastcast.sc, 'fastcast', t)
    const pm = pushMarkets(fc.pc)
    if (pm) for (const m of ['spreadHome', 'totalOver', 'mlHome']) if (pm[m]) pushMove(m, pm[m].line + '|' + pm[m].odds, t)
    if (fc.lastPlayWallclock) score.notePlay({ wallclock: fc.lastPlayWallclock, type: fc.lastPlayType, text: fc.lastPlayText })
  } else if (ev.lane === 'sgo') {
    const ck = clockKey(String(d.period || '').replace(/\D/g, ''), d.clock)
    cur.sgo = { ck: ck || (cur.sgo && cur.sgo.ck) || null, sc: d.awayScore != null ? d.awayScore + '-' + d.homeScore : null, t }
    see('clock', ck && ck.key, 'sgo', t)
    see('score', cur.sgo.sc, 'sgo', t)
    if (d.spreadHome) pushMove('spreadHome', num(d.spreadHome.line) + '|' + num(d.spreadHome.odds), t)
  } else if (ev.lane === 'rush') {
    const ck = clockKey(String(d.period || '').replace(/\D/g, ''), d.clock)
    cur.rush = { ck: ck || (cur.rush && cur.rush.ck) || null, sc: d.awayScore != null ? d.awayScore + '-' + d.homeScore : null, t }
    see('clock', ck && ck.key, 'rush', t)
    see('score', cur.rush.sc, 'rush', t)
    for (const k of rushPriceKeys(d)) { const [m, l, o] = k.split('|'); rushMove(m, l + '|' + o, t) }
  } else if (ev.lane === 'mark' && d.kind === 'snap') {
    score.noteSnap(t)
  }
}

const moveSeen = new Set()
function stepScore() {
  for (const v of Object.values(lock.changedAt)) if (!moveSeen.has(v)) { moveSeen.add(v); score.noteMove(v) }
  const st = lock.status(now())
  score.step(now(), st.open, live)
  return st
}

// ---------- relay reads ----------
async function getJson(path, params) {
  const ctl = new AbortController()
  const tm = setTimeout(() => ctl.abort(), 8000)
  try {
    const r = await fetch(relayUrl(path, params), { cache: 'no-store', signal: ctl.signal })
    if (!r.ok) return null
    return await r.json()
  } catch (e) {
    return null
  } finally {
    clearTimeout(tm)
  }
}
let polling = false
async function poll() {
  if (polling) return
  polling = true
  try {
    const j = await getJson('/log', { since: seq, limit: 2000, shape: 'obj' })
    if (j) { connected = true; for (const ev of j.events || []) take(ev) } else connected = false
  } finally {
    polling = false
  }
}
async function start() {
  if (!local) { connected = false; paint(); return }
  const st = await getJson('/state')
  if (!st) { connected = false; paint(); setTimeout(start, 5000); return }
  connected = true
  if (st.now) skew = Date.parse(st.now) - Date.now()
  const c = st.config || {}
  if (c.ids && /^\d+$/.test(String(c.ids.espn || ''))) espnId = String(c.ids.espn)
  startPush()
  home = String(c.home || 'Home').replace(/[^A-Za-z0-9 ]/g, '').slice(0, 8) || 'Home'
  away = String(c.away || 'Away').replace(/[^A-Za-z0-9 ]/g, '').slice(0, 8) || 'Away'
  // replay the whole log through the lock and the scorer, one second at a time
  const keep = take
  const all = []
  for (;;) {
    const j = await getJson('/log', { since: all.length ? all[all.length - 1].seq : 0, limit: 5000, shape: 'obj' })
    if (!j) break
    all.push(...(j.events || []))
    if (!(j.events || []).length || !j.more) break
  }
  if (all.length) {
    let i = 0
    const t0 = Date.parse(all[0].t), t1 = Date.parse(all[all.length - 1].t)
    for (let t = t0; t <= t1; t += 1000) {
      while (i < all.length && Date.parse(all[i].t) <= t) keep(all[i++])
      for (const v of Object.values(lock.changedAt)) if (!moveSeen.has(v)) { moveSeen.add(v); score.noteMove(v) }
      const s = lock.status(t)
      score.step(t, s.open, live)
    }
    while (i < all.length) keep(all[i++])
  }
  setInterval(poll, 500)
  setInterval(() => { stepScore(); paint() }, 1000)
  paint()
}

// ---------- paint ----------
const stats = (arr) => {
  if (!arr.length) return { now: null, med: null, worst: null, n: 0 }
  const s = [...arr].sort((a, b) => a - b)
  return { now: arr[arr.length - 1], med: s[Math.floor(s.length / 2)], worst: s[s.length - 1], n: arr.length }
}
function fastest() {
  let best = null
  for (const lane of ['fastcast', 'sgo', 'espn']) {
    const c = cur[lane]
    if (!c || !c.ck) continue
    if (!best || c.ck.el > best.ck.el || (c.ck.el === best.ck.el && c.ck.p > best.ck.p)) best = { lane, ...c }
  }
  return best
}
function paint() {
  txt('conn', !local ? 'Laptop relay not connected: only a relay on this computer is accepted' : connected ? 'Laptop relay connected' : 'Laptop relay not connected: licensed feed and Rush lanes are off')
  $('conn').className = connected && local ? 'ok' : 'off'
  txt('push', 'push lane: listening, ' + pushMsgs + ' messages')
  const quiet = pushLaneT === null ? null : (now() - pushLaneT) / 1000
  txt('pushWarn', live && quiet !== null && quiet > 60 ? 'Warning: the push lane has been silent for ' + Math.round(quiet) + ' s during live play' : '')
  const f = fastest()
  txt('fastClock', f ? f.ck.label : '-')
  txt('fastLane', f ? LANE[f.lane] : 'No clock yet')
  const r = cur.rush
  txt('rushClock', r && r.ck ? r.ck.label : '-')
  const lc = stats(lags.clock)
  txt('behind', lc.n ? (lc.now / 1000).toFixed(1) + ' s behind' : 'No shared clock yet')
  expireMoves(now())
  const rows = ['clock', 'score', 'price'].map((k) => {
    const s = stats(lags[k])
    const label = k === 'price' ? 'Price (time to follow a push price move, cap 60 s; never followed ' + neverFollowed + ')' : k[0].toUpperCase() + k.slice(1)
    return `<tr><td>${esc(label)}</td><td>${esc(sec(s.now))}</td><td>${esc(sec(s.med))}</td><td>${esc(sec(s.worst))}</td><td>${esc(s.n)}</td></tr>`
  })
  $('lagRows').innerHTML = rows.join('')

  const st = lock.status(now())
  const team = (name, s) => `<div class="lk ${s.open ? 'open' : 'shut'}"><b>${esc(name)}</b><span class="badge">${s.open ? 'OPEN' : 'LOCKED'}</span><small>${esc(s.reason)}</small></div>`
  $('teams').innerHTML = team('Red', st.teams.red) + team('Blue', st.teams.blue) + team('Gold', st.teams.gold)
  const res = score.result(now())
  $('final').className = 'final ' + (st.open ? 'open' : 'shut')
  txt('finalBadge', st.open ? 'OPEN' : 'LOCKED')
  txt('finalReason', st.reason)
  txt('openShare', (res.openShare * 100).toFixed(1) + '%')
  txt('badOpens', res.bad + ' of ' + res.opens)
  txt('snapsHit', res.snapsHit + ' of ' + res.snaps)
  txt('variant', 'Default rule: every break Red knows (all breaks and long breaks only both scored 2 bad opens on the first half; all breaks keeps more open time)')
  txt('priceNote', st.noOddsFeed ? 'No Odds feed lane tonight: prices come from the Score feed (push)' : 'Prices from the Odds feed')

  const B = [['spread', 'away', 'spreadAway', away], ['spread', 'home', 'spreadHome', home], ['total', 'over', 'totalOver', 'Over'], ['total', 'under', 'totalUnder', 'Under'], ['ml', 'away', 'mlAway', away + ' to win'], ['ml', 'home', 'mlHome', home + ' to win']]
  $('picks').innerHTML = B.map(([m, s, k, label]) => {
    const x = st.markets[k]
    const l = x && m !== 'ml' ? (m === 'total' ? (Number.isFinite(x.line) ? String(x.line) : '') : line(x.line)) : ''
    return `<button type="button" data-k="${k}" data-m="${m}" data-s="${s}" data-l="${esc(x ? x.line : '')}" data-o="${esc(x ? x.odds : '')}" ${x && connected ? '' : 'disabled'}><span>${esc(label)} ${esc(l)}</span><b>${x ? esc(odds(x.odds)) : 'Locked'}</b></button>`
  }).join('')
}

$('picks').addEventListener('click', async (e) => {
  const b = e.target.closest('button[data-k]')
  if (!b || b.disabled) return
  const clientT = new Date().toISOString()
  const pick = { market: b.dataset.m, side: b.dataset.s, shownLine: num(b.dataset.l), shownOdds: num(b.dataset.o) }
  const st = lock.status(now())
  const r = lock.tryPick(pick, now())
  txt('pickMsg', (r.accepted ? 'Accepted: ' : 'Not accepted: ') + r.reason)
  $('pickMsg').className = r.accepted ? 'ok' : 'off'
  const payload = { team: 'Final', source: 'final', market: pick.market, side: pick.side, shownLine: pick.shownLine, shownOdds: pick.shownOdds, accepted: r.accepted, reason: r.reason, lockState: { open: st.open, reason: st.reason }, clientT }
  try { await fetch(relayUrl('/mark'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind: 'pick', source: 'final', clientT, payload }) }) } catch (x) {}
})

paint()
start()
