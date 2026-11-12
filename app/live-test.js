/* Live test strip for the game page (lab only, f1117).
 *
 * Loaded by game.html as a module. On tonight's game (NFL event 401873052, or any
 * game with ?livetest=1) it looks for the laptop relay. With no relay it does
 * nothing at all and the page is exactly as before. With a relay it shows a slim
 * strip: relay state, the lock in charge (Red, Blue, Gold or Rush today), OPEN or
 * LOCKED with the reason, the freshest main lines, and six pick buttons.
 *
 * A pick on spread, total or moneyline (from the strip, or from the page's own
 * main market buttons while the game is live) goes through the chosen lock's
 * tryPick at the tap. Refused: the reason is shown and nothing is placed.
 * Accepted: placed through Rush.wallet.place as a lab pick at the shown price.
 * Every attempt is POSTed to the relay /mark as kind "pick".
 *
 * Lab picks live in this browser only (the app store in localStorage). Nothing
 * here talks to Rush.
 */
import { relayUrl, relayBase, relayKey } from '../tracker/shared/fastcast.js'

export const VERSION = 'f1117'
export const TONIGHT = { league: 'nfl', id: '401873052' }
export const LOCKS = ['red', 'blue', 'gold', 'rush']
export const LOCK_NAMES = { red: 'Red', blue: 'Blue', gold: 'Gold', rush: 'Rush today' }
const BUFFER = 3000

const num = (x) => {
  if (x === null || x === undefined || x === '') return null
  const v = Number(String(typeof x === 'object' ? x.odds : x).replace('+', ''))
  return Number.isFinite(v) ? v : null
}

/* ---------- Rush today: what the Rush app does now, built in ----------
 * Open whenever the Rush lane has a main line posted. The engine already blanks a
 * live market it considers closed or stale, so "posted" is the whole rule. */
export function createRushTodayLock() {
  let last = null
  const EMPTY = { spreadHome: null, spreadAway: null, totalOver: null, totalUnder: null, mlHome: null, mlAway: null }
  function markets() {
    const d = last && last.data
    if (!d || d.error != null || d.ended === true) return { ...EMPTY }
    const rm = (d.raw && d.raw.markets) || {}
    const sp = rm.spread || null
    const tot = rm.total || null
    const mh = num(d.mlHome)
    const ma = num(d.mlAway)
    return {
      spreadHome: sp && sp.home ? { line: num(sp.home.point), odds: num(sp.home.payout) } : null,
      spreadAway: sp && sp.away ? { line: num(sp.away.point), odds: num(sp.away.payout) } : null,
      totalOver: tot ? { line: num(tot.line), odds: num(tot.over_payout) } : null,
      totalUnder: tot ? { line: num(tot.line), odds: num(tot.under_payout) } : null,
      mlHome: mh != null ? { line: null, odds: mh } : null,
      mlAway: ma != null ? { line: null, odds: ma } : null,
    }
  }
  let lastOpen = null
  let sinceMs = null
  function status(nowMs) {
    const m = markets()
    const open = Object.values(m).some(Boolean)
    if (open !== lastOpen) { lastOpen = open; sinceMs = nowMs ?? Date.now() }
    const reason = !last ? 'No Rush reading yet' : last.data && last.data.error != null ? 'Rush lane error' : open ? 'A line is posted' : 'No line posted'
    return { open, reason, sinceMs, markets: m }
  }
  function tryPick(pick, nowMs) {
    const s = status(nowMs)
    if (!s.open) return { accepted: false, reason: 'Locked: ' + s.reason }
    const m = s.markets[marketKey(pick)]
    if (!m || m.odds == null) return { accepted: false, reason: 'No price posted for this side' }
    const sl = num(pick.shownLine)
    const so = num(pick.shownOdds)
    if (m.line != null && sl != null && sl !== m.line) return { accepted: false, reason: 'Line changed to ' + m.line }
    if (so != null && so !== m.odds) return { accepted: false, reason: 'Price changed to ' + fmtOdds(m.odds) }
    return { accepted: true, reason: 'Accepted at the shown price' }
  }
  return {
    ingest(ev) { if (ev && ev.lane === 'rush') last = ev },
    status,
    tryPick,
  }
}

export function marketKey(pick) {
  const away = pick.side === 'away'
  const under = pick.side === 'under' || pick.side === 'u'
  if (pick.market === 'spread') return away ? 'spreadAway' : 'spreadHome'
  if (pick.market === 'total') return under ? 'totalUnder' : 'totalOver'
  return away ? 'mlAway' : 'mlHome'
}
export function fmtOdds(o) {
  const n = num(o)
  return n == null ? '-' : (n > 0 ? '+' : '') + n
}
function fmtLine(l) {
  const n = num(l)
  return n == null ? '' : (n > 0 ? '+' : '') + n
}

/* ---------- lock loading: a missing or throwing module never breaks the page ---------- */
export async function loadLock(name, importer = (u) => import(u)) {
  if (name === 'rush') return { name, lock: createRushTodayLock(), error: null }
  try {
    const url = new URL(`../teams/${name}/tracker/lock.js`, import.meta.url).href
    const mod = await importer(url)
    if (!mod || typeof mod.createLock !== 'function') return { name, lock: null, error: 'not shipped yet' }
    const lock = mod.createLock({})
    if (!lock || typeof lock.ingest !== 'function' || typeof lock.status !== 'function' || typeof lock.tryPick !== 'function') {
      return { name, lock: null, error: 'not shipped yet' }
    }
    return { name, lock, error: null }
  } catch (e) {
    return { name, lock: null, error: 'not shipped yet' }
  }
}

/* ---------- the host: buffer, lock switching, safe calls ---------- */
export function createHost({ importer, now = () => Date.now() } = {}) {
  const buf = []
  let cur = { name: null, lock: null, error: null }
  let broken = null
  let loadToken = 0
  const latest = {}
  const host = {
    get name() { return cur.name },
    get error() { return cur.error || broken },
    get lock() { return cur.lock },
    latest,
    ingest(ev) {
      if (!ev || typeof ev !== 'object') return
      buf.push(ev)
      if (buf.length > BUFFER) buf.splice(0, buf.length - BUFFER)
      latest[ev.lane] = ev
      if (cur.lock && !broken) {
        try { cur.lock.ingest(ev) } catch (e) { broken = 'lock error' }
      }
    },
    async use(name) {
      const tok = ++loadToken
      const r = await loadLock(name, importer)
      if (tok !== loadToken) return host
      cur = r
      broken = null
      if (cur.lock) {
        for (const ev of buf) {
          try { cur.lock.ingest(ev) } catch (e) { broken = 'lock error'; break }
        }
      }
      return host
    },
    status() {
      if (!cur.lock) return { open: false, reason: cur.error || 'No lock loaded', markets: null, missing: true }
      if (broken) return { open: false, reason: 'This lock hit an error', markets: null, missing: false }
      try {
        const s = cur.lock.status(now()) || {}
        return { open: !!s.open, reason: String(s.reason || ''), sinceMs: s.sinceMs ?? null, markets: s.markets || null }
      } catch (e) {
        broken = 'lock error'
        return { open: false, reason: 'This lock hit an error', markets: null }
      }
    },
    tryPick(pick) {
      if (!cur.lock) return { accepted: false, reason: 'No lock loaded' }
      if (broken) return { accepted: false, reason: 'This lock hit an error' }
      try {
        const r = cur.lock.tryPick(pick, now()) || {}
        return { accepted: r.accepted === true, reason: String(r.reason || (r.accepted ? 'Accepted' : 'Refused')) }
      } catch (e) {
        broken = 'lock error'
        return { accepted: false, reason: 'This lock hit an error' }
      }
    },
  }
  return host
}

/* ---------- the feed: stream first, /log polling every 500 ms as the fallback ---------- */
export function createFeed({ onEvent, onMode = () => {}, fetchImpl = (...a) => fetch(...a), EventSourceImpl = typeof EventSource === 'function' ? EventSource : null, url = relayUrl, startSeq = 0 } = {}) {
  let seq = startSeq
  let es = null
  let pollTimer = null
  let silentTimer = null
  let stopped = false
  let mode = 'starting'
  let polling = false
  const setMode = (m) => { if (m !== mode) { mode = m; onMode(m) } }
  const take = (ev) => {
    if (!ev || typeof ev.seq !== 'number' || ev.seq <= seq) return
    seq = ev.seq
    onEvent(ev)
  }
  async function pollOnce() {
    if (stopped || polling) return
    polling = true
    try {
      const r = await fetchImpl(url('/log', { since: seq, shape: 'obj', limit: 2000 }), { cache: 'no-store' })
      if (r.status === 401) { setMode('key needed'); return }
      if (!r.ok) { setMode('offline'); return }
      const j = await r.json()
      const list = Array.isArray(j) ? j : j.events || []
      for (const ev of list) take(ev)
      setMode('polling')
    } catch (e) {
      setMode('offline')
    } finally {
      polling = false
    }
  }
  function startPolling() {
    if (es) { try { es.close() } catch (e) {} es = null }
    clearTimeout(silentTimer)
    if (pollTimer) return
    pollOnce()
    pollTimer = setInterval(pollOnce, 500)
  }
  function armSilence() {
    clearTimeout(silentTimer)
    silentTimer = setTimeout(startPolling, 5000)
  }
  function startStream() {
    if (!EventSourceImpl) return startPolling()
    try {
      es = new EventSourceImpl(url('/stream', { since: seq }))
    } catch (e) {
      return startPolling()
    }
    armSilence()
    es.onmessage = (m) => {
      armSilence()
      setMode('stream')
      try { take(JSON.parse(m.data)) } catch (e) {}
    }
    es.onerror = () => startPolling()
  }
  startStream()
  return {
    get mode() { return mode },
    get seq() { return seq },
    stop() {
      stopped = true
      clearInterval(pollTimer)
      clearTimeout(silentTimer)
      if (es) try { es.close() } catch (e) {}
    },
  }
}

/* ---------- one pick attempt: the lock decides, the store places, the relay hears ---------- */
export async function attemptPick({ host, pick, place, post, clientT = new Date().toISOString() }) {
  const st = host.status()
  const r = host.tryPick({ market: pick.market, side: pick.side, shownLine: pick.shownLine, shownOdds: pick.shownOdds })
  let placed = null
  let reason = r.reason
  if (r.accepted) {
    try {
      placed = place ? place(pick) : null
    } catch (e) {
      placed = null
    }
    if (place && !(placed && placed.ok)) reason = r.reason + '. Not placed: ' + ((placed && placed.why) || 'the store refused it')
  }
  const payload = {
    team: LOCK_NAMES[host.name] || host.name,
    source: 'app',
    market: pick.market,
    side: pick.side,
    shownLine: pick.shownLine ?? null,
    shownOdds: pick.shownOdds ?? null,
    accepted: r.accepted,
    reason: r.reason,
    lockState: { open: st.open, reason: st.reason },
    clientT,
    placed: !!(placed && placed.ok),
    via: pick.via || null,
  }
  try { await post(payload) } catch (e) {}
  return { accepted: r.accepted, reason, placed: !!(placed && placed.ok), payload }
}

/* ======================= browser only below ======================= */
if (typeof document !== 'undefined' && typeof window !== 'undefined') boot()

function boot() {
  const Q = new URLSearchParams(location.search)
  const lg = (Q.get('league') || 'nfl').toLowerCase()
  const id = Q.get('id') || ''
  const forced = Q.get('livetest') === '1'
  if (!forced && !(lg === TONIGHT.league && id === TONIGHT.id)) return
  relayBase()
  relayKey()
  probe(lg, id)
}

async function getJson(path, params) {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), 3000)
  try {
    const r = await fetch(relayUrl(path, params), { cache: 'no-store', signal: ctl.signal })
    if (!r.ok) return null
    return await r.json()
  } catch (e) {
    return null
  } finally {
    clearTimeout(t)
  }
}

// Quiet search for the relay. Nothing on screen until it answers.
async function probe(lg, id) {
  const st = await getJson('/state')
  if (!st || !st.config) {
    setTimeout(() => probe(lg, id), 15000)
    return
  }
  mount(lg, id, st)
}

function mount(lg, id, st0) {
  let skew = st0.now ? Date.parse(st0.now) - Date.now() : 0
  const relayNow = () => Date.now() + skew
  const host = createHost({ now: relayNow })
  const cfg = st0.config || {}
  let feedMode = 'starting'
  let connected = true
  let lastEventAt = Date.now()

  const css = document.createElement('style')
  css.textContent = `
#lt{margin:8px 12px;padding:10px;border:1px solid var(--line,#243241);border-radius:12px;background:var(--panel,#141C26);color:var(--ink,#fff);font:14px/1.35 var(--body,system-ui,sans-serif);display:grid;gap:8px}
#lt .lt-top{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}
#lt .lt-top b{font-size:13px;letter-spacing:.04em}
#lt .lt-dim{color:var(--dim,#8A9BAD);font-size:12px}
#lt select{min-height:44px;min-width:130px;border-radius:10px;border:1px solid var(--line,#243241);background:var(--panel2,#1B2531);color:var(--ink,#fff);font:600 14px var(--body,system-ui,sans-serif);padding:0 10px}
#lt .lt-state{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
#lt .lt-badge{font:800 13px var(--num,system-ui,sans-serif);padding:4px 10px;border-radius:999px}
#lt .lt-open{background:rgba(57,227,154,.18);color:var(--win,#39E39A)}
#lt .lt-locked{background:rgba(255,92,92,.18);color:var(--loss,#FF5C5C)}
#lt .lt-feed{font-variant-numeric:tabular-nums;font-size:13px}
#lt .lt-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}
#lt .lt-grid button{min-height:48px;border-radius:8px;border:1px solid var(--line,#243241);background:var(--panel2,#1B2531);color:var(--ink,#fff);font:600 13px var(--body,system-ui,sans-serif);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;touch-action:manipulation}
#lt .lt-grid button b{font:800 15px var(--num,system-ui,sans-serif)}
#lt .lt-grid button:disabled{opacity:.4}
#lt .lt-msg{min-height:18px;font-size:13px}
#lt .lt-ok{color:var(--win,#39E39A)}#lt .lt-no{color:var(--loss,#FF5C5C)}
`
  document.head.appendChild(css)
  const box = document.createElement('section')
  box.id = 'lt'
  box.setAttribute('aria-label', 'Live test')
  box.innerHTML = `
<div class="lt-top"><b>LIVE TEST <span class="lt-dim">${VERSION}</span></b><span class="lt-dim" id="lt-conn"></span></div>
<div class="lt-state"><select id="lt-lock" aria-label="Lock in charge">${LOCKS.map((k) => `<option value="${k}">${LOCK_NAMES[k]}</option>`).join('')}</select><span class="lt-badge" id="lt-badge"></span><span id="lt-reason"></span></div>
<div class="lt-feed" id="lt-feed"></div>
<div class="lt-grid" id="lt-grid"></div>
<div class="lt-msg" id="lt-msg"></div>
<div class="lt-dim">Lab picks stay on this device. They never reach Rush.</div>`
  const anchor = document.getElementById('gview')
  if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(box, anchor)
  else document.body.insertBefore(box, document.body.firstChild)
  const $ = (x) => document.getElementById(x)

  let chosen = 'red'
  try { const c = localStorage.getItem('liveLab.lock'); if (LOCKS.includes(c)) chosen = c } catch (e) {}
  $('lt-lock').value = chosen
  $('lt-lock').addEventListener('change', async (e) => {
    chosen = e.target.value
    try { localStorage.setItem('liveLab.lock', chosen) } catch (x) {}
    await host.use(chosen)
    paint()
  })

  const clean = (v, d) => String(v || d).replace(/[^A-Za-z0-9 .-]/g, '').slice(0, 12) || d
  const homeAb = clean(cfg.home, 'Home')
  const awayAb = clean(cfg.away, 'Away')
  const BTN = [
    ['spread', 'away', 'spreadAway', awayAb], ['spread', 'home', 'spreadHome', homeAb],
    ['total', 'over', 'totalOver', 'Over'], ['total', 'under', 'totalUnder', 'Under'],
    ['ml', 'away', 'mlAway', awayAb + ' to win'], ['ml', 'home', 'mlHome', homeAb + ' to win'],
  ]
  const shown = {}

  function feedLine() {
    const g = host.latest.sgo
    const r = host.latest.rush
    const src = g && g.data && g.data.error == null ? ['Odds feed', g] : r && r.data && r.data.error == null ? ['Rush', r] : null
    if (!src) return 'No lines from the relay yet'
    const [label, ev] = src
    const d = ev.data
    const age = Math.max(0, (relayNow() - Date.parse(ev.t)) / 1000).toFixed(1)
    const sp = d.spreadHome ? fmtLine(d.spreadHome.line) + ' ' + fmtOdds(d.spreadHome.odds) : '-'
    const tot = d.total ? num(d.total.line) + ' ' + fmtOdds(d.total.odds) : '-'
    const ml = fmtOdds(d.mlHome && typeof d.mlHome === 'object' ? d.mlHome.odds : d.mlHome)
    return `${label}: ${homeAb} ${sp}, total ${tot}, ${homeAb} ${ml} (${age} s old)`
  }
  function paint() {
    const conn = !connected ? 'Laptop relay not connected' : feedMode === 'stream' ? 'Relay connected (stream)' : feedMode === 'polling' ? 'Relay connected (polling)' : feedMode === 'key needed' ? 'Relay needs the access key (?k=)' : 'Relay connecting'
    $('lt-conn').textContent = conn
    const s = host.status()
    const missing = !host.lock
    const badge = $('lt-badge')
    badge.textContent = missing ? 'NOT SHIPPED YET' : s.open ? 'OPEN' : 'LOCKED'
    badge.className = 'lt-badge ' + (s.open && !missing ? 'lt-open' : 'lt-locked')
    $('lt-reason').textContent = missing ? (LOCK_NAMES[chosen] + ' has not shipped its lock yet') : s.reason
    $('lt-feed').textContent = feedLine()
    const m = s.markets || {}
    $('lt-grid').innerHTML = BTN.map(([mk, side, key, label]) => {
      const x = m[key]
      shown[key] = x || null
      const ok = !!x && x.odds != null && connected
      const line = mk === 'ml' ? '' : mk === 'total' ? (x && x.line != null ? num(x.line) : '') : (x ? fmtLine(x.line) : '')
      return `<button type="button" data-lt="${key}" data-m="${mk}" data-s="${side}" ${ok ? '' : 'disabled'}><span>${label} ${line}</span><b>${x ? fmtOdds(x.odds) : 'Locked'}</b></button>`
    }).join('')
  }

  function toastMsg(text, good) {
    const el = $('lt-msg')
    el.textContent = text
    el.className = 'lt-msg ' + (good ? 'lt-ok' : 'lt-no')
    try { if (typeof window.toast === 'function') window.toast(text) } catch (e) {}
  }

  const post = (payload) => fetch(relayUrl('/mark'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind: 'pick', source: 'app', clientT: payload.clientT, payload }) })

  function liveNow() {
    try { if (typeof game === 'function') return !!game().live } catch (e) {}
    const e = host.latest.espn
    return !!(e && e.data && e.data.state === 'in')
  }
  function gameStart() {
    try { if (typeof game === 'function') return game().start } catch (e) {}
    return null
  }
  function gameName() {
    try { if (typeof team === 'function') return team('away').abbr + ' at ' + team('home').abbr } catch (e) {}
    return awayAb + ' at ' + homeAb
  }
  function placeLab(pick) {
    const R = window.Rush
    if (!R || !R.wallet) return { ok: false, why: 'the app store is not loaded' }
    const odds = num(pick.shownOdds)
    if (odds == null) return { ok: false, why: 'no price shown' }
    const line = num(pick.shownLine)
    const side = pick.market === 'total' ? (pick.side === 'under' ? 'u' : 'o') : pick.side
    const spec = pick.market === 'ml' ? { k: 'ml', side } : { k: pick.market, side, line }
    const who = pick.market === 'total' ? (side === 'o' ? 'Over ' : 'Under ') + line : (pick.side === 'home' ? homeAb : awayAb) + (pick.market === 'ml' ? ' to win' : ' ' + fmtLine(line))
    let stake = 25
    try { stake = +(R.settings().lastStake) || 25 } catch (e) {}
    return R.wallet.place('rush', {
      live: liveNow(), league: lg, gameId: String(id), start: gameStart(), game: gameName(), spec, label: who, odds, stake,
      lab: true, labLock: LOCK_NAMES[host.name] || host.name, note: 'Lab pick (' + (LOCK_NAMES[host.name] || host.name) + ' lock)',
    })
  }
  async function run(pick) {
    const r = await attemptPick({ host, pick, place: placeLab, post })
    if (r.accepted && r.placed) toastMsg('Placed as a lab pick at ' + fmtOdds(pick.shownOdds) + '. ' + r.reason, true)
    else if (r.accepted) toastMsg(r.reason, false)
    else toastMsg('Not placed: ' + r.reason, false)
    try { if (typeof render === 'function') render() } catch (e) {}
    paint()
  }

  $('lt-grid').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-lt]')
    if (!b || b.disabled) return
    const x = shown[b.dataset.lt]
    if (!x) return
    run({ market: b.dataset.m, side: b.dataset.s, shownLine: x.line ?? null, shownOdds: x.odds ?? null, via: 'strip' })
  })

  // The page's own main market buttons, while the game is live: the lock answers at the tap.
  let down = null
  const mainSpec = (el) => {
    const t = el && el.closest && el.closest('[data-a="slip"]')
    if (!t || !host.lock || !connected || !liveNow()) return null
    let sp
    try { sp = JSON.parse(t.dataset.k) } catch (e) { return null }
    if (!sp || !['spread', 'total', 'ml'].includes(sp.k)) return null
    return { t, sp }
  }
  window.addEventListener('pointerdown', (e) => {
    const h = mainSpec(e.target)
    if (!h) { down = null; return }
    e.stopImmediatePropagation()
    down = { ...h, x: e.clientX, y: e.clientY }
  }, true)
  window.addEventListener('pointerup', (e) => {
    if (!down) return
    const d = down
    down = null
    e.stopImmediatePropagation()
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 12) return
    const b = d.t.querySelector('b')
    const shownOdds = num(b && b.textContent && b.textContent.replace(/[^0-9+-]/g, ''))
    const sp = d.sp
    const side = sp.k === 'total' ? (sp.side === 'u' ? 'under' : 'over') : sp.side
    run({ market: sp.k, side, shownLine: sp.k === 'ml' ? null : sp.line ?? null, shownOdds, via: 'page' })
  }, true)

  host.use(chosen).then(paint)
  const startSeq = Math.max(0, (st0.seq || 0) - 2000)
  createFeed({
    startSeq,
    onEvent: (ev) => { lastEventAt = Date.now(); connected = true; host.ingest(ev) },
    onMode: (m) => { feedMode = m; connected = m !== 'offline'; paint() },
  })
  setInterval(async () => {
    const st = await getJson('/state')
    if (st && st.now) { skew = Date.parse(st.now) - Date.now(); connected = true } else if (Date.now() - lastEventAt > 10000) connected = false
  }, 10000)
  setInterval(paint, 1000)
  paint()
}
