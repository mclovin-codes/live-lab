// node test-relay.mjs [relayBase] [seconds]
// Reads /config, refills from /log?since=0, then follows /stream with ?since, feeding lock.js
// exactly as the page does. Reconnects and refills from /log?since=<seq> if the stream drops.
import { createLock } from './lock.js';
import { scoreRuns, lagTable, cadence } from './core.js';

const BASE = process.argv[2] || 'http://127.0.0.1:4483';
const SECS = +(process.argv[3] || 30);
let lock = createLock(), lastSeq = 0, pass = null, reconnects = 0, got = 0, maxGap = 0, lastAt = Date.now();
function ingest(ev) {
  if (ev.seq <= lastSeq) return;
  lastSeq = ev.seq; got++;
  const p = ev.data?.replayPass ?? 0;
  if (ev.data?.origT && pass !== null && p !== pass) { console.log('replay pass', p, 'reset engine'); lock = createLock(); }
  if (ev.data?.origT) pass = p;
  lock.ingest(ev);
}
async function refill() {
  const r = await fetch(`${BASE}/log?since=${lastSeq}&limit=5000`);
  const arr = await r.json();
  arr.forEach(ingest);
  return arr.length;
}
async function follow() {
  const ctl = new AbortController();
  const r = await fetch(`${BASE}/stream?since=${lastSeq}`, { signal: ctl.signal });
  const dec = new TextDecoder();
  let buf = '';
  for await (const chunk of r.body) {
    buf += dec.decode(chunk, { stream: true });
    let i;
    while ((i = buf.indexOf('\n\n')) >= 0) {
      const block = buf.slice(0, i); buf = buf.slice(i + 2);
      const line = block.split('\n').find((l) => l.startsWith('data: '));
      if (line) { const now = Date.now(); maxGap = Math.max(maxGap, now - lastAt); lastAt = now; ingest(JSON.parse(line.slice(6))); }
    }
  }
}
let cfg = await (await fetch(`${BASE}/config`)).json();
console.log('config mode', cfg.mode, 'startedAt', cfg.startedAt);
console.log('refill', await refill(), 'events, lastSeq', lastSeq);
const stopAt = Date.now() + SECS * 1000;
while (Date.now() < stopAt) {
  try { await Promise.race([follow(), new Promise((_, rej) => setTimeout(() => rej(new Error('window')), stopAt - Date.now()))]); }
  catch (e) { if (e.message === 'window') break; }
  reconnects++;
  await new Promise((r) => setTimeout(r, 1000));
  try {
    const c = await (await fetch(`${BASE}/config`)).json();
    if (c.startedAt !== cfg.startedAt) { console.log('relay restarted, rebuilding from /log?since=0'); cfg = c; lastSeq = 0; pass = null; lock = createLock(); }
    console.log('reconnect', reconnects, 'refill', await refill(), 'lastSeq', lastSeq);
  } catch { console.log('relay down, retry'); }
}
const S = lock.engine.S;
const st = lock.status(S.tNow);
console.log('got', got, 'lastSeq', lastSeq, 'max gap between stream messages ms', maxGap, 'reconnects', reconnects);
console.log('lanes', S.counts, 'lock', st.open ? 'OPEN' : 'LOCKED', st.reason, 'markets', JSON.stringify(st.markets));
console.log('price lag rush', JSON.stringify(lagTable(S, S.tNow).price.rush.q), 'stale', S.stale.secs.toFixed(1), 'windows', S.stale.windows);
console.log('cadence', JSON.stringify(cadence(S).poll));
for (const n of ['gold', 'start', 'rush']) { const s = scoreRuns(S, n, S.tNow - 10000); console.log(n, 'open', (100 * s.openShare).toFixed(1), 'badOpenS', s.badOpenS, 'windows', s.badWindows); }
const pk = lock.tryPick({ market: 'spread', side: 'home', shownLine: st.markets.spreadHome?.line, shownOdds: st.markets.spreadHome?.odds }, S.tNow);
console.log('tryPick at shown price', JSON.stringify(pk));
process.exit(0);
