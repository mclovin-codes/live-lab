// node test.mjs [path-to-jsonl] [--events]   (reads logs from their own path, never copies feed data here)
// Plain ticks {t,sgo,espn} get synthetic Rush and push lanes; relay logs (events) are used as they are.
import { readFileSync } from 'node:fs';
import { createEngine, lagTable, scoreRuns, cadence, baselineVsBest, LANE_NAME, KINDS } from './core.js';
import { createLock } from './lock.js';
import { ticksToEvents, synthRush, synthFastcast, merge } from './synth.js';

const path = process.argv[2] || 'C:/Users/nross/Rush/reports/live-compare/tnf-2026-11-05.jsonl';
const tapArg = process.argv.find((a) => a.startsWith('--tap='));
const lines = readFileSync(path, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
let events;
if (lines[0].lane) events = lines;
else {
  const base = ticksToEvents(lines);
  events = merge(base, synthRush(base), synthFastcast(base));
}
const cfg = tapArg ? { tap: +tapArg.split('=')[1] } : {};
const lock = createLock(cfg);
const eng = lock.engine;
let checks = 0;
for (const ev of events) {
  lock.ingest(ev);
  if (++checks % 50 === 0) {
    const st = lock.status(Date.parse(ev.t));
    for (const v of Object.values(st.markets)) if (v && (Number.isNaN(v.line) || Number.isNaN(v.odds))) throw new Error('NaN in markets');
  }
}
const S = eng.S;
const tEnd = S.tNow;
const fmt = (q) => (q ? `med ${q.med.toFixed(1)} p90 ${q.p90.toFixed(1)} worst ${q.worst.toFixed(1)} n ${q.n}` : 'no data');
console.log('events', events.length, 'lanes', S.counts, 'seq', events[0].seq, '-', events[events.length - 1].seq);
const lt = lagTable(S, tEnd);
for (const k of KINDS) for (const lane of Object.keys(lt[k])) if (lt[k][lane].q) console.log('lag', k.padEnd(6), LANE_NAME[lane].padEnd(18), fmt(lt[k][lane].q));
console.log('stale meter', JSON.stringify({ windows: S.stale.windows, secs: +S.stale.secs.toFixed(1), edgeSecs: +S.stale.edgeSecs.toFixed(1), maxEdge: +S.stale.maxEdge.toFixed(1) }));
console.log('event stale', JSON.stringify({ windows: S.evStale.windows, secs: +S.evStale.secs.toFixed(1) }));
console.log('price changes', S.records.length);
for (const r of S.records) console.log('  ', new Date(r.t).toISOString().slice(11, 19), r.market.padEnd(6), `${r.from} -> ${r.to}`, 'dLine', r.dLine, 'dProb', r.dProb?.toFixed(1), 'edge', r.edge?.toFixed(1), 'rushOld', r.rushLeftOld ? ((r.rushLeftOld - r.t) / 1000).toFixed(1) : (r.superseded ? 'superseded' : 'open'));
console.log('cadence', JSON.stringify(cadence(S)));
const bvb = baselineVsBest(S);
for (const k of KINDS) console.log('baseline vs best', k, bvb[k].bestLane, 'saved med', bvb[k].saved?.toFixed(1), 'p90', bvb[k].savedP90?.toFixed(1));
const tMax = tEnd - 10000;
for (const name of ['gold', 'start', 'rush']) {
  const s = scoreRuns(S, name, tMax);
  console.log('lock', name.padEnd(5), `open ${(100 * (s.openShare || 0)).toFixed(1)}% (${s.openS}/${s.seconds}s) badOpen ${s.badOpenS}s in ${s.badWindows} windows (live ${s.liveOpen}, stale ${s.staleOpen}) taps ${s.taps} clean ${s.clean} refused ${s.refused} badAccept ${s.badAccept}`);
}
const why = {};
for (const r of S.runs.gold) why[r.why.replace(/\d+%/, 'n%')] = (why[r.why.replace(/\d+%/, 'n%')] || 0) + Math.round((r.t1 - r.t0) / 1000) + 1;
console.log('gold reasons (s)', JSON.stringify(why));
