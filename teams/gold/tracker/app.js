// Gold tracker page. Uses lock.js (the same module the lab app loads) and core.js.
import { createLock, plainReason } from './lock.js';
import { LANE_NAME, MARKETS, KINDS, lagTable, scoreRuns, cadence, baselineVsBest, gradePick, quantiles, DEFAULTS } from './core.js';

const VERSION = 'v1';
const $ = (id) => document.getElementById(id);
$('ver').textContent = VERSION;
document.title = `Gold Live Tracker ${VERSION}`;

// ---------- storage helpers ----------
const ls = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

// ---------- theme ----------
(function theme() {
  const saved = ls.get('gold.theme');
  if (saved) document.documentElement.dataset.theme = saved;
  $('theme').onclick = () => {
    const dark = matchMedia('(prefers-color-scheme: dark)').matches;
    const cur = document.documentElement.dataset.theme || (dark ? 'dark' : 'light');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next; ls.set('gold.theme', next);
  };
})();

// ---------- relay base and key ----------
const qs = new URLSearchParams(location.search);
// Relay only on this computer (security review 2026-11-12): any other host in ?relay= or in storage is ignored.
const isLocalRelay = (b) => { try { const u = new URL(b); return (u.protocol === 'http:' || u.protocol === 'https:') && ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname); } catch { return false; } };
const qRelay = (qs.get('relay') || '').replace(/\/+$/, '');
if (qRelay && isLocalRelay(qRelay)) ls.set('gold.relay', qRelay);
if (qs.get('k')) ls.set('gold.k', qs.get('k'));
const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);
const savedRelay = ls.get('gold.relay');
const RELAY = ((qRelay && isLocalRelay(qRelay) ? qRelay : null) || (isLocal ? location.origin : (savedRelay && isLocalRelay(savedRelay) ? savedRelay : null)) || 'http://localhost:4477').replace(/\/$/, '');
const KEY = qs.get('k') || ls.get('gold.k') || '';
function rurl(path, params = {}) {
  const u = new URL(RELAY + path);
  for (const [k, v] of Object.entries(params)) if (v !== null && v !== undefined) u.searchParams.set(k, v);
  if (KEY) u.searchParams.set('k', KEY);
  return u.toString();
}

// ---------- settings ----------
const cfg = { tap: +(ls.get('gold.tap') || DEFAULTS.tap), holdConf: +(ls.get('gold.hold') || DEFAULTS.holdConf) };
$('tap').value = cfg.tap; $('hold').value = cfg.holdConf;

// ---------- state ----------
const EV_CAP = 90000;
let EV = [];               // raw events kept for a rebuild when a setting changes
let lock = createLock(cfg);
let lastSeq = 0;
let relayStart = null;
let relayOk = false;
let mode = 'connecting';
let game = { home: 'NYG', away: 'WSH', espn: '401873052' };
const picks = [];
let scoreCache = null, scoreAt = 0;

let replayPass = null, replayMode = false, skew = null;
function ingest(ev) {
  // In replay, posted lanes (marks, picks, push) arrive on the wall clock: put them on the replay clock.
  if (replayMode && !ev.data?.origT && (ev.lane === 'mark' || ev.lane === 'fastcast') && lock.engine.S.tNow) {
    ev = { ...ev, data: { ...ev.data, origT: new Date(lock.engine.S.tNow).toISOString(), replayPass } };
  }
  if (ev.data?.origT) replayMode = true;
  if (ev.seq !== null && ev.seq !== undefined && !ev.data?.origT) {
    const d = Date.now() - Date.parse(ev.t); // page clock minus relay clock plus transit; the minimum is the skew
    if (Number.isFinite(d) && d > -600000 && d < 600000) skew = skew === null ? d : Math.min(skew, d);
  }
  const pass = ev.data?.replayPass ?? 0;
  if (ev.data?.origT && replayPass !== null && pass !== replayPass) { EV = []; lock = createLock(cfg); scoreAt = 0; }
  if (ev.data?.origT) replayPass = pass;
  if (ev.seq !== null && ev.seq !== undefined) {
    if (ev.seq <= lastSeq) return;
    lastSeq = ev.seq;
  }
  EV.push(ev);
  if (EV.length > EV_CAP) EV.splice(0, EV.length - EV_CAP);
  lock.ingest(ev);
}
function rebuild() {
  lock = createLock(cfg);
  for (const ev of EV) lock.ingest(ev);
  scoreAt = 0;
}
$('tap').oninput = () => { cfg.tap = +$('tap').value; ls.set('gold.tap', cfg.tap); rebuild(); };
$('hold').oninput = () => { cfg.holdConf = +$('hold').value; ls.set('gold.hold', cfg.holdConf); rebuild(); };

// ---------- relay connection: SSE first, /log polling fallback ----------
let es = null, lastMsgAt = 0, pollTimer = null, pollFails = 0, sseRetryAt = 0;
async function getConfig() {
  const r = await fetch(rurl('/config'), { cache: 'no-store' });
  if (!r.ok) throw new Error('config ' + r.status);
  return r.json();
}
async function connect() {
  try {
    const c = await getConfig();
    if (c.home) game.home = c.home;
    if (c.away) game.away = c.away;
    if (c.ids?.espn) game.espn = c.ids.espn;
    if (relayStart && c.startedAt !== relayStart) { // relay restarted: start clean
      EV = []; lastSeq = 0; lock = createLock(cfg); scoreAt = 0;
    }
    relayStart = c.startedAt;
    relayOk = true; pollFails = 0;
    stopBrowserLanes();
    await refill();
    startSSE();
  } catch {
    relayOk = false;
    mode = 'browser only';
    startBrowserLanes();
    setTimeout(connect, 5000);
  }
}
async function refill() {
  for (let i = 0; i < 40; i++) {
    const r = await fetch(rurl('/log', { since: lastSeq, limit: 5000 }), { cache: 'no-store' });
    if (!r.ok) throw new Error('log ' + r.status);
    const arr = await r.json();
    for (const ev of arr) ingest(ev);
    if (arr.length < 5000) break;
  }
}
// A relay restart resets seq; compare startedAt and rebuild from the whole log when it changed.
async function checkRestart() {
  try { const c = await getConfig(); if (c.startedAt !== relayStart) { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } connect(); } } catch { /* next tick */ }
}
function startSSE() {
  if (es) es.close();
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  mode = 'stream';
  lastMsgAt = Date.now();
  try { es = new EventSource(rurl('/stream', { since: lastSeq })); } catch { return startPolling(); }
  es.onmessage = (m) => { lastMsgAt = Date.now(); try { ingest(JSON.parse(m.data)); } catch { /* bad line */ } };
  let opened = false;
  es.onopen = () => { if (opened) checkRestart(); opened = true; };
  es.onerror = () => { if (es && es.readyState === 2) startPolling(); };
}
function startPolling() {
  if (es) { es.close(); es = null; }
  if (pollTimer) return;
  mode = 'polling every 0.5 s';
  sseRetryAt = Date.now() + 60000;
  pollTimer = setInterval(async () => {
    try {
      const r = await fetch(rurl('/log', { since: lastSeq, limit: 5000 }), { cache: 'no-store' });
      if (!r.ok) throw new Error(String(r.status));
      const top = +(r.headers.get('x-last-seq') ?? NaN);
      const arr = await r.json();
      pollFails = 0; relayOk = true;
      if (Number.isFinite(top) && top < lastSeq) { checkRestart(); return; }
      for (const ev of arr) ingest(ev);
      if (arr.length) lastMsgAt = Date.now();
    } catch {
      if (++pollFails >= 6) { clearInterval(pollTimer); pollTimer = null; relayOk = false; connect(); }
    }
  }, 500);
}
setInterval(() => {
  if (mode === 'stream' && Date.now() - lastMsgAt > 5000) startPolling();
  if (mode.startsWith('polling') && relayOk && Date.now() > sseRetryAt) { getConfig().then((c) => { if (c.startedAt === relayStart) startSSE(); else connect(); }).catch(() => {}); sseRetryAt = Date.now() + 60000; }
}, 1000);

// ---------- browser-only lane: score feed poll straight from the browser ----------
let browserTimer = null;
function startBrowserLanes() {
  if (browserTimer) return;
  const tickOnce = async () => {
    const t0 = performance.now();
    try {
      const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${game.espn}&_=${Date.now()}`, { cache: 'no-store' });
      const j = await r.json();
      const comp = j.header?.competitions?.[0] || {};
      const st = comp.status || {};
      const home = (comp.competitors || []).find((c) => c.homeAway === 'home') || {};
      const away = (comp.competitors || []).find((c) => c.homeAway === 'away') || {};
      const plays = j.drives?.current?.plays || [];
      const last = plays[plays.length - 1] || null;
      ingest({ seq: null, t: new Date().toISOString(), lane: 'espn', ms: Math.round(performance.now() - t0), data: {
        state: st.type?.state ?? null, completed: st.type?.completed ?? null, period: st.period ?? null, clock: st.displayClock ?? null,
        detail: st.type?.detail ?? null, homeScore: home.score ?? null, awayScore: away.score ?? null,
        lastPlayId: last?.id ?? null, lastPlayText: last?.text ?? null, lastPlayWallclock: last?.wallclock ?? null,
      } });
    } catch { /* stay quiet, retry */ }
  };
  tickOnce();
  browserTimer = setInterval(tickOnce, 2000);
}
function stopBrowserLanes() { if (browserTimer) { clearInterval(browserTimer); browserTimer = null; } }

// ---------- posting marks ----------
async function postMark(body) {
  if (!relayOk) return false;
  try {
    const r = await fetch(rurl('/mark'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    return r.ok;
  } catch { return false; }
}
document.querySelectorAll('[data-mark]').forEach((b) => {
  b.onclick = async () => {
    const kind = b.dataset.mark;
    const clientT = new Date().toISOString();
    const ok = await postMark({ kind, note: null, source: 'gold', clientT });
    if (!ok) ingest({ seq: null, t: clientT, lane: 'mark', data: { kind, source: 'gold', clientT } });
    b.textContent = `${kind[0].toUpperCase()}${kind.slice(1)} ✓`;
    setTimeout(() => { b.textContent = kind[0].toUpperCase() + kind.slice(1); }, 900);
  };
});

// ---------- formatting ----------
const fmtOdds = (o) => (o === null || o === undefined ? '' : (o > 0 ? '+' : '') + o);
const fmtLine = (l) => (l === null || l === undefined ? '' : (l > 0 ? '+' : '') + l);
const s1 = (v) => (v === null || v === undefined || !Number.isFinite(v) ? 'no data yet' : v.toFixed(1));
const pct = (v) => (v === null || v === undefined || !Number.isFinite(v) ? 'no data yet' : (v * 100).toFixed(0) + '%');
const hms = (ms) => new Date(ms).toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false });
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- pick test ----------
const PICK_DEFS = [
  { grp: 'Spread', key: 'spreadHome', market: 'spread', side: 'home', label: () => game.home },
  { grp: 'Spread', key: 'spreadAway', market: 'spread', side: 'away', label: () => game.away },
  { grp: 'Total', key: 'totalOver', market: 'total', side: 'over', label: () => 'Over' },
  { grp: 'Total', key: 'totalUnder', market: 'total', side: 'under', label: () => 'Under' },
  { grp: 'Moneyline', key: 'mlHome', market: 'ml', side: 'home', label: () => game.home },
  { grp: 'Moneyline', key: 'mlAway', market: 'ml', side: 'away', label: () => game.away },
];
(function buildPicks() {
  const host = $('picks');
  for (const g of ['Spread', 'Total', 'Moneyline']) {
    const d = document.createElement('div'); d.className = 'pickgrp';
    d.innerHTML = `<div class="lbl">${g}</div>`;
    for (const p of PICK_DEFS.filter((x) => x.grp === g)) {
      const b = document.createElement('button'); b.type = 'button'; b.id = 'pk_' + p.key;
      b.onclick = () => doPick(p);
      d.appendChild(b);
    }
    host.appendChild(d);
  }
})();
// The lock's clock: replay runs on the log's own time; live runs on the relay's clock.
function nowMs() {
  if (replayMode) return lock.engine.S.tNow ?? Date.now();
  return Date.now() - (skew ?? 0);
}
function isReplay() { return replayMode; }
async function doPick(p) {
  if (!EV.length) return;
  const t = nowMs();
  const st = lock.status(t);
  const shown = st.markets[p.key];
  const res = lock.tryPick({ market: p.market === 'ml' ? 'ml' : p.market, side: p.side, shownLine: shown?.line ?? null, shownOdds: shown?.odds ?? null }, t);
  const lineTxt = p.grp === 'Total' ? (shown?.line ?? '') : fmtLine(shown?.line);
  const rec = { t, key: p.key, label: `${p.grp} ${p.label()} ${lineTxt} ${fmtOdds(shown?.odds)}`.trim(), accepted: res.accepted, reason: res.reason };
  picks.unshift(rec); if (picks.length > 200) picks.pop();
  postMark({ kind: 'pick', note: null, source: 'gold', clientT: new Date().toISOString(), payload: {
    team: 'gold', market: p.market, side: p.side, shownLine: shown?.line ?? null, shownOdds: shown?.odds ?? null,
    accepted: res.accepted, reason: res.reason, lockState: st.open ? 'open' : 'locked', clientT: new Date().toISOString(),
  } });
  renderPicks();
}
function renderPicks() {
  const S = lock.engine.S;
  let acc = 0, clean = 0, past = 0, pending = 0;
  const rows = [];
  for (const p of picks.slice(0, 40)) {
    const g = gradePick(S, p);
    if (p.accepted) acc++;
    if (p.accepted && !g.ready) pending++;
    if (g.ready && g.clean) clean++;
    if (g.ready && g.pastPosted) past++;
    const grade = !p.accepted ? '' : !g.ready ? ' <span class="mute">grading in 10 s</span>' : g.pastPosted ? ` <b class="bad">past-posted</b>${g.fresher ? ' fresher price out' : ''}${g.live ? ' ball live' : ''}` : ` <b class="good">clean</b>${g.moved10 ? ' (line moved within 10 s)' : ''}`;
    rows.push(`<div>${hms(p.t)} ${esc(p.label)} <b class="${p.accepted ? 'good' : 'bad'}">${p.accepted ? 'accepted' : 'refused'}</b> <span class="mute">${esc(p.reason)}</span>${grade}</div>`);
  }
  $('pickstats').textContent = picks.length ? `Attempts ${picks.length} · accepted ${acc} · clean ${clean} · past-posted ${past}${pending ? ` · grading ${pending}` : ''}` : 'No attempts yet';
  $('picklog').innerHTML = rows.join('');
}

// ---------- render ----------
function render() {
  const S = lock.engine.S;
  const t = nowMs();
  $('wall').textContent = hms(Date.now()) + ' ET';
  $('conn').textContent = relayOk ? `Relay ${mode} · seq ${lastSeq} · ${EV.length} events kept${isReplay() ? ' · replay time ' + hms(S.tNow) : ''}` : 'Relay not connected, browser lanes only';
  const ban = $('banner');
  if (!relayOk && mode === 'browser only') { ban.hidden = false; ban.textContent = 'Laptop relay not connected: licensed feed and Rush lanes are off'; } else ban.hidden = true;

  // lock (never tick the engine before the first event, so the replay clock is not polluted)
  const st = EV.length ? lock.status(t) : { open: false, reason: '', sinceMs: 0, markets: {} };
  const hasFeed = !!(S.latest.sgo || S.latest.fastcast);
  $('lockstate').textContent = hasFeed ? (st.open ? 'OPEN' : 'LOCKED') : 'NO DATA YET';
  $('lockstate').className = 'lockstate ' + (hasFeed ? (st.open ? 'open' : 'locked') : '');
  $('lockwhy').textContent = hasFeed ? `${st.open ? 'Prices shown, likely to hold through a ' + cfg.tap + ' s tap' : st.reason} · ${Math.round(st.sinceMs / 1000)} s` : 'Waiting for the odds feed';

  // pick buttons
  for (const p of PICK_DEFS) {
    const b = $('pk_' + p.key), m = st.markets[p.key];
    b.disabled = !m;
    b.innerHTML = `<span>${esc(p.label())} ${m ? (p.grp === 'Total' ? (m.line ?? '') : fmtLine(p.grp === 'Moneyline' ? null : m.line)) : ''}</span><span>${m ? fmtOdds(m.odds) || 'line only' : 'paused'}</span>`;
  }

  // big numbers
  const lt = lagTable(S, t);
  const rp = lt.price.rush;
  const feedOn = !!(S.latest.sgo || S.latest.fastcast);
  $('bigRushPrice').textContent = S.latest.rush && feedOn ? (rp.now === null ? 'no data yet' : `${rp.now.toFixed(0)} s`) : 'no data yet';
  $('bigRushPriceSub').textContent = !feedOn ? 'odds feed lane is off' : rp.q ? `median ${s1(rp.q.med)} · p90 ${s1(rp.q.p90)} · worst ${s1(rp.q.worst)}` : 'Rush lane has not matched a price yet';
  const rs = lt.score.rush.q;
  $('bigRushScore').textContent = rs ? `${rs.med.toFixed(1)} s` : 'no data yet';
  $('bigRushScoreSub').textContent = rs ? `p90 ${s1(rs.p90)} · worst ${s1(rs.worst)} · n ${rs.n}` : 'no score change seen on two lanes yet';
  $('bigStale').textContent = S.latest.rush ? `${S.stale.secs.toFixed(0)} s` : 'no data yet';
  $('bigStaleSub').textContent = S.latest.rush ? `${S.stale.windows} windows · ${S.stale.on ? 'stale NOW' : 'matching now'} · edge-seconds ${S.stale.edgeSecs.toFixed(0)}` : '';

  renderLanes(S, t);
  renderLag(lt, feedOn);
  renderMeter(S);
  renderChanges(S, t);
  renderBvb(S);
  renderCadence(S);
  if (Date.now() - scoreAt > 10000) { scoreAt = Date.now(); scoreCache = ['gold', 'start', 'rush'].map((n) => [n, scoreRuns(S, n, (S.tNow || 0) - 10000)]); }
  renderScores();
  renderLimits(S, lt);
  renderPicks();
  renderFeed(S);
}

function renderLanes(S, t) {
  const rows = ['<tr><th>Lane</th><th>Clock</th><th>Score</th><th>Last play</th><th>Spread</th><th>Total</th><th>ML home / away</th><th class="r">Age s</th><th class="r">Reads</th></tr>'];
  for (const lane of ['sgo', 'rush', 'espn', 'fastcast']) {
    const r = S.latest[lane];
    if (!r) { rows.push(`<tr><td>${LANE_NAME[lane]}</td><td colspan="8" class="mute">no data yet</td></tr>`); continue; }
    const age = (t - (S.lastAny[lane] ?? r.t)) / 1000;
    const clock = r.period !== null && r.clockS !== null ? `Q${r.period} ${Math.floor(r.clockS / 60)}:${String(Math.round(r.clockS % 60)).padStart(2, '0')}` : (r.detail || '');
    const sc = r.score ? r.score.split('-') : null;
    const p = r.prices || {};
    const sp = p.spread ? `${game.home} ${fmtLine(p.spread.line)} ${fmtOdds(p.spread.odds)}` : '';
    const to = p.total ? `${p.total.line ?? ''} ${fmtOdds(p.total.odds)}` : '';
    const ml = p.mlHome || p.mlAway ? `${fmtOdds(p.mlHome?.odds) || ''} / ${fmtOdds(p.mlAway?.odds) || ''}` : '';
    rows.push(`<tr><td>${LANE_NAME[lane]}${lane === 'rush' && r.pickable !== null ? (r.pickable ? ' <span class="good">pickable</span>' : ' <span class="mute">closed</span>') : ''}</td><td>${esc(clock)}</td><td>${sc ? `${game.away} ${sc[1]} : ${game.home} ${sc[0]}` : ''}</td><td title="${esc(r.playText)}">${esc((r.playText || '').slice(0, 48))}</td><td>${esc(sp)}</td><td>${esc(to)}</td><td>${esc(ml)}</td><td class="r ${age > 10 ? 'bad' : ''}">${age.toFixed(1)}</td><td class="r">${S.counts[lane] || 0}${S.errors[lane] ? ` <span class="bad">${S.errors[lane]} err</span>` : ''}</td></tr>`);
  }
  const tv = S.tv[S.tv.length - 1];
  rows.push(`<tr><td>TV</td><td colspan="8" class="${tv ? '' : 'mute'}">${tv ? `last tap ${tv.kind} at ${hms(tv.t)}, ${S.tv.length} taps` : 'no taps yet'}</td></tr>`);
  $('lanes').innerHTML = rows.join('');
}
function renderLag(lt, feedOn) {
  const rows = ['<tr><th>Kind</th><th>Lane</th><th class="r">Now</th><th class="r">Median</th><th class="r">p90</th><th class="r">Worst</th><th class="r">n</th></tr>'];
  for (const k of ['clock', 'score', 'play', 'price', 'line']) {
    if ((k === 'price' || k === 'line') && !feedOn) { rows.push(`<tr><td>${k}</td><td colspan="6" class="mute">no data yet: odds feed lane is off</td></tr>`); continue; }
    let any = false;
    for (const lane of ['sgo', 'fastcast', 'espn', 'rush', 'mark']) {
      const c = lt[k][lane];
      if (!c.q && c.now === null) continue;
      if ((k === 'price' || k === 'line') && lane === 'espn' && !c.q) continue; // poll lane carries no in-play price
      any = true;
      rows.push(`<tr><td>${k}</td><td>${LANE_NAME[lane]}</td><td class="r ${c.behind ? 'warn' : ''}">${c.now === null ? '' : c.now.toFixed(1)}</td><td class="r">${c.q ? c.q.med.toFixed(1) : ''}</td><td class="r">${c.q ? c.q.p90.toFixed(1) : ''}</td><td class="r">${c.q ? c.q.worst.toFixed(1) : ''}</td><td class="r">${c.q ? c.q.n : 0}</td></tr>`);
    }
    if (!any) rows.push(`<tr><td>${k}</td><td colspan="6" class="mute">no data yet</td></tr>`);
  }
  $('lag').innerHTML = rows.join('');
}
function renderMeter(S) {
  if (!S.latest.rush) { $('meter').textContent = 'no data yet: the Rush lane has not reported'; return; }
  $('meter').innerHTML = `Price mismatch while pickable: <b>${S.stale.secs.toFixed(0)} s</b> in <b>${S.stale.windows}</b> windows, edge-seconds <b>${S.stale.edgeSecs.toFixed(0)}</b>, worst edge <b>${S.stale.maxEdge.toFixed(1)}%</b> ${S.stale.on ? '<span class="bad">STALE NOW</span>' : '<span class="good">matching now</span>'}<br>`
    + `Pickable after a score, snap, play or whistle was known elsewhere, before Rush refreshed: <b>${S.evStale.secs.toFixed(0)} s</b> in <b>${S.evStale.windows}</b> windows ${S.evStale.on ? '<span class="bad">NOW</span>' : ''}<br>`
    + '<span class="mute">Edge = how far the old price sits from the new one in win chance, in percent. Edge-seconds = edge times seconds Rush held it.</span>';
}
function renderChanges(S, t) {
  const recs = S.records.slice(-25).reverse();
  if (!recs.length) { $('changes').innerHTML = '<tr><td class="mute">no price change yet</td></tr>'; return; }
  const rows = ['<tr><th>Time</th><th>Market</th><th>Old to new</th><th>First</th><th class="r">Line move</th><th class="r">Win chance move</th><th class="r">Edge %</th><th class="r">Rush kept old s</th><th class="r">Cost %·s</th></tr>'];
  for (const r of recs) {
    let kept, cost = '';
    if (r.rushLeftOld !== null) { const k = (r.rushLeftOld - r.t) / 1000; kept = k.toFixed(1); if (r.edge !== null) cost = (k * r.edge).toFixed(0); }
    else if (!S.latest.rush) kept = 'no Rush data';
    else kept = r.superseded ? `skipped, ${((t - r.t) / 1000).toFixed(0)}+` : `<span class="bad">still old ${((t - r.t) / 1000).toFixed(0)}</span>`;
    rows.push(`<tr><td>${hms(r.t)}</td><td>${r.market}</td><td>${esc(r.from)} to ${esc(r.to)}</td><td>${LANE_NAME[r.lane]}</td><td class="r">${r.dLine === null ? '' : fmtLine(r.dLine)}</td><td class="r">${r.dProb === null ? '' : r.dProb.toFixed(1)}</td><td class="r">${r.edge === null ? '' : r.edge.toFixed(1)}</td><td class="r">${kept}</td><td class="r">${cost}</td></tr>`);
  }
  $('changes').innerHTML = rows.join('');
}
function renderBvb(S) {
  const b = baselineVsBest(S);
  const rows = ['<tr><th>Kind</th><th class="r">Rush median s</th><th class="r">Rush p90</th><th>Best lane</th><th class="r">Best median</th><th class="r">Saved median</th><th class="r">Saved p90</th></tr>'];
  for (const k of ['clock', 'score', 'play', 'price', 'line']) {
    const x = b[k];
    if (!x.rush && !x.best) { rows.push(`<tr><td>${k}</td><td colspan="6" class="mute">no data yet</td></tr>`); continue; }
    rows.push(`<tr><td>${k}</td><td class="r">${x.rush ? x.rush.med.toFixed(1) : 'none'}</td><td class="r">${x.rush ? x.rush.p90.toFixed(1) : ''}</td><td>${x.bestLane ? LANE_NAME[x.bestLane] : ''}</td><td class="r">${x.best ? x.best.med.toFixed(1) : ''}</td><td class="r good">${x.saved === null ? '' : x.saved.toFixed(1)}</td><td class="r">${x.savedP90 === null ? '' : x.savedP90.toFixed(1)}</td></tr>`);
  }
  $('bvb').innerHTML = rows.join('');
}
function renderCadence(S) {
  const c = cadence(S);
  if (!c.poll) { $('cadence').textContent = 'no data yet: needs two odds feed readings'; return; }
  const claim = c.stampAge ? (c.stampAge.med <= 3 ? '<span class="good">stamps fresh, claim holds so far</span>' : '<span class="bad">stamps older than the claim</span>') : '<span class="mute">no price stamp in the data yet</span>';
  $('cadence').innerHTML = `Reads every <b>${c.poll.med.toFixed(1)} s</b> (p90 ${c.poll.p90.toFixed(1)}) · price changed <b>${c.changes}</b> times, ${c.perMin ? c.perMin.toFixed(2) : '0'} per minute, median gap <b>${c.change ? c.change.med.toFixed(0) + ' s' : 'no data yet'}</b><br>`
    + `Price stamp age at read: <b>${c.stampAge ? c.stampAge.med.toFixed(1) + ' s' : 'no data yet'}</b>${c.stampAge ? ` (p90 ${c.stampAge.p90.toFixed(1)}, worst ${c.stampAge.worst.toFixed(0)})` : ''} · per market stamp age ${c.marketAge ? c.marketAge.med.toFixed(1) + ' s median' : 'no data yet'} · ${claim}`;
}
function renderScores() {
  if (!scoreCache) return;
  const names = { gold: 'Gold lock (hold or hide)', start: 'Starting rule (30 s quiet, market on)', rush: 'Rush today (pickable flag)' };
  const rows = ['<tr><th>Rule</th><th class="r">Open share</th><th class="r">Bad opens s</th><th class="r">Bad windows</th><th class="r">Bad share of open</th><th class="r">Taps clean</th><th class="r">Refused at tap</th><th class="r">Bad accepts</th></tr>'];
  for (const [n, s] of scoreCache) {
    if (!s.seconds) { rows.push(`<tr><td>${names[n]}</td><td colspan="7" class="mute">no data yet</td></tr>`); continue; }
    rows.push(`<tr><td>${names[n]}</td><td class="r">${pct(s.openShare)}</td><td class="r">${s.badOpenS}</td><td class="r">${s.badWindows}</td><td class="r">${pct(s.badShare)}</td><td class="r good">${s.clean}</td><td class="r">${s.refused}</td><td class="r bad">${s.badAccept}</td></tr>`);
  }
  $('lockscore').innerHTML = rows.join('');
  $('tapv').textContent = cfg.tap + ' s'; $('holdv').textContent = Math.round(cfg.holdConf * 100) + '%';
  $('lockrule').textContent = `Gold lock: show prices only when the odds feed read is under ${DEFAULTS.feedMaxAge} s old, the market is on, no score for ${DEFAULTS.quietScore} s, no play, snap or whistle for ${DEFAULTS.quietPlay} s, no price move for ${DEFAULTS.quietPrice} s, the odds feed clock still for ${DEFAULTS.quietClock} s, and the measured chance the price survives a ${cfg.tap} s tap is at least ${Math.round(cfg.holdConf * 100)}%. Otherwise hide every price. A tap is checked against the live price at the tap and refused if it moved. Bad open = open while the ball was live (play wallclock) or the price changed within ${DEFAULTS.truthLead} s.`;
}
function renderLimits(S, lt) {
  const c = cadence(S);
  const sc = scoreCache ? Object.fromEntries(scoreCache) : {};
  const L = [
    ['Rush shows prices 5 to 15 s late', 'Read the odds feed directly for the lock and hide prices while Rush lags', 'Rush price lag median vs Odds feed', lt.price.rush.q ? `${lt.price.rush.q.med.toFixed(1)} s median, ${lt.price.rush.q.p90.toFixed(1)} s p90` : 'no data yet'],
    ['Rush stays pickable on an old price', 'Gold lock hides every price that is not the newest', 'Stale meter while pickable', S.latest.rush ? `${S.stale.secs.toFixed(0)} s in ${S.stale.windows} windows` : 'no data yet'],
    ['No lane signals a snap in time', 'TV taps and the push score feed; lock on clock movement', 'Bad opens with the ball live', sc.gold ? `${sc.gold.liveOpen} s live while open` : 'no data yet'],
    ['Price can move inside the tap time', 'Check the price at the tap, refuse if it moved (never void later)', `Refused at a ${cfg.tap} s tap`, sc.gold ? `${sc.gold.refused} of ${sc.gold.taps}` : 'no data yet'],
    ['1.5 s refresh claim', 'Measure stamp age at each read', 'Stamp age median', c.stampAge ? `${c.stampAge.med.toFixed(1)} s` : 'no stamp yet'],
    ['Score feed posts plays late', 'Use it as truth after the fact only, never to open', 'Play lag of the poll lane', lt.play.espn.q ? `${lt.play.espn.q.med.toFixed(1)} s median vs fastest` : 'no data yet'],
  ];
  $('limits').innerHTML = '<tr><th>Limit</th><th>Proposed fix</th><th>In-game test</th><th>Result</th></tr>' + L.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('');
}
function renderFeed(S) {
  const rows = S.feed.slice(-60).reverse().map((f) => `<div>${hms(f.t)} <b>${LANE_NAME[f.lane]}</b> ${esc(f.text)}</div>`);
  $('feed').innerHTML = rows.join('') || '<div class="mute">no data yet</div>';
}

setInterval(() => { try { render(); } catch (e) { console.error(e); } }, 1000);
render();
connect();
