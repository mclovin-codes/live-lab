// Score feed (push) helper for the live tracker pages. Browser only ES module.
//
//   import { connectFastcast, relayBase, relayKey, relayUrl } from '../../../tracker/shared/fastcast.js'
//   const fc = connectFastcast({ eventId: '401873052', league: 'NFL', onMessage: (m) => {...} })
//   fc.close()
//
// onMessage gets { topic, op, mid, clientT, list, doc, ts }:
//   op 'P'  a patch: `list` is the decoded JSON patch array for the game package
//   op 'CP' a checkpoint: `doc` is the full game package (fetched from the CDN)
//   op 'S'  subscribed; op 'close' the socket closed (it reconnects by itself)
// When post is true each patch is POSTed to the relay /mark with kind
// "fastcast" (checkpoints are not posted: too large). The relay drops a
// duplicate posted inside 2 s, so several pages may all post.
//
// Handshake lifted from teams/one/index.html (worked 2026-11-02):
// GET websockethost, wss://<ip>:<securePort>/FastcastService/pubsub/profiles/12000,
// send {op:'C'}, answer {op:'S', sid, tc:'gp-<sport>-<league>-<id>'}, heartbeat
// {op:'H', sid}; a patch message is {op:'P', mid, pl} where pl is JSON
// {ts, '~c', pl}: when '~c' is set pl is base64 deflate of the patch list.
// UNTESTED as a module: written against that code, not run in a browser here.

const SPORT = { NFL: 'football-nfl', NBA: 'basketball-nba', NHL: 'hockey-nhl', NCAAF: 'football-college-football', NCAAB: 'basketball-mens-college-basketball' }
const LS_RELAY = 'liveLab.relay'
const LS_KEY = 'liveLab.relayKey'

function ls(get, k, v) {
  try {
    if (get) return localStorage.getItem(k)
    localStorage.setItem(k, v)
  } catch {}
  return null
}

// Relay base. The relay only ever runs on this computer, so the only bases
// accepted are localhost, 127.0.0.1 and [::1] (security review 2026-11-12: a
// link must never point the page, or a saved key, at another host). ?relay=
// may change the port. Anything else is ignored and forgotten.
export function isLocalRelay(base) {
  try {
    const u = new URL(base)
    return (u.protocol === 'http:' || u.protocol === 'https:') && ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname)
  } catch {
    return false
  }
}
export function relayBase() {
  const q = new URLSearchParams(location.search)
  const fromQ = (q.get('relay') || '').replace(/\/+$/, '')
  if (fromQ && isLocalRelay(fromQ)) {
    ls(false, LS_RELAY, fromQ)
    return fromQ
  }
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return location.origin
  const saved = ls(true, LS_RELAY)
  if (saved && isLocalRelay(saved)) return saved
  return 'http://localhost:4477'
}

// Access key: ?k= (saved), else saved, else none.
export function relayKey() {
  const q = new URLSearchParams(location.search)
  const k = q.get('k')
  if (k) {
    ls(false, LS_KEY, k)
    return k
  }
  return ls(true, LS_KEY) || ''
}

// Full URL for a relay route with the key attached.
export function relayUrl(route, params = {}) {
  const u = new URL(relayBase() + route)
  for (const [k, v] of Object.entries(params)) if (v != null) u.searchParams.set(k, String(v))
  const key = relayKey()
  if (key) u.searchParams.set('k', key)
  return u.toString()
}

async function inflate64(b64) {
  const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
  const st = new Blob([bin]).stream().pipeThrough(new DecompressionStream('deflate'))
  return new Response(st).text()
}

const MAX_POST = 60 * 1024

export function connectFastcast({ eventId, league = 'NFL', onMessage = () => {}, post = true, source = 'page' } = {}) {
  const sport = SPORT[String(league).toUpperCase()] || 'football-nfl'
  const topic = `gp-${sport}-${eventId}`
  let ws = null
  let sid = null
  let hb = null
  let watchdog = null
  let backoff = 1000
  let closed = false
  let lastMsgAt = 0
  let reconnectTimer = null
  let chain = Promise.resolve()

  const say = (m) => {
    try { onMessage({ topic, clientT: new Date().toISOString(), ...m }) } catch (e) { console.warn('fastcast onMessage threw', e) }
  }

  function postMark(payload, clientT) {
    if (!post) return
    let body = JSON.stringify({ kind: 'fastcast', topic, clientT, source, payload })
    if (body.length > MAX_POST) {
      const paths = Array.isArray(payload?.list) ? payload.list.map((p) => p.path).slice(0, 200) : null
      body = JSON.stringify({ kind: 'fastcast', topic, clientT, source, payload: { mid: payload?.mid ?? null, ts: payload?.ts ?? null, truncated: true, paths } })
    }
    fetch(relayUrl('/mark'), { method: 'POST', headers: { 'content-type': 'application/json' }, body }).catch(() => {})
  }

  function scheduleReconnect() {
    if (closed || reconnectTimer) return
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      connect()
    }, backoff)
    backoff = Math.min(30000, backoff * 2)
  }

  async function checkpoint(url, mid) {
    try {
      const doc = await (await fetch(url, { cache: 'no-store' })).json()
      if (doc && doc.header) say({ op: 'CP', mid, doc })
    } catch {}
  }

  function onPatch(m) {
    const clientT = new Date().toISOString()
    chain = chain.then(async () => {
      let list = null
      let ts = null
      try {
        const o = JSON.parse(m.pl)
        ts = o.ts ?? null
        list = o['~c'] ? JSON.parse(await inflate64(o.pl)) : o.pl
      } catch {
        return
      }
      if (!Array.isArray(list)) return
      say({ op: 'P', mid: m.mid, ts, list, clientT })
      postMark({ mid: m.mid, ts, list }, clientT)
    })
  }

  async function connect() {
    if (closed) return
    if (ws && ws.readyState < 2) return
    try {
      const host = await (await fetch('https://fastcast.semfs.engsvc.go.com/public/websockethost', { cache: 'no-store' })).json()
      const sock = new WebSocket(`wss://${host.ip}:${host.securePort}/FastcastService/pubsub/profiles/12000?TrafficManager-Token=${encodeURIComponent(host.token)}`)
      ws = sock
      sock.onopen = () => sock.send(JSON.stringify({ op: 'C' }))
      sock.onclose = () => {
        clearInterval(hb)
        if (ws === sock) ws = null
        say({ op: 'close' })
        scheduleReconnect()
      }
      sock.onerror = () => {
        try { sock.close() } catch {}
      }
      sock.onmessage = (e) => {
        lastMsgAt = Date.now()
        let m
        try { m = JSON.parse(e.data) } catch { return }
        if (m.op === 'C') {
          sid = m.sid
          sock.send(JSON.stringify({ op: 'S', sid, tc: topic }))
          clearInterval(hb)
          hb = setInterval(() => {
            try { sock.send(JSON.stringify({ op: 'H', sid })) } catch {}
          }, Math.max(10, (m.hbi || 30) - 5) * 1000)
        } else if (m.op === 'S') {
          backoff = 1000
          say({ op: 'S' })
        } else if (m.op === 'H') {
          if (/^https/.test(m.pl || '')) checkpoint(m.pl, m.mid)
        } else if (m.op === 'P' || m.op === 'R') {
          onPatch(m)
        }
      }
    } catch {
      scheduleReconnect()
    }
  }

  // A socket that goes quiet for 90 s is treated as dead.
  watchdog = setInterval(() => {
    if (closed || !ws || ws.readyState !== 1) return
    if (lastMsgAt && Date.now() - lastMsgAt > 90000) {
      try { ws.close() } catch {}
    }
  }, 15000)

  connect()

  return {
    topic,
    close() {
      closed = true
      clearInterval(hb)
      clearInterval(watchdog)
      clearTimeout(reconnectTimer)
      try { ws && ws.close() } catch {}
    },
    // Fetch the full package now (for a page that wants a fresh base doc).
    checkpointUrl(mid) {
      return `https://fcast.espncdn.com/FastcastService/pubsub/profiles/12000/topic/${topic}/message/${mid}/checkpoint`
    },
  }
}
