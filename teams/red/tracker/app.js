// Red tracker page. Renders the core's matched-event metrics once a second.
import { createLock } from './lock.js';
import { Tracker, VERSION, LABEL, DATA_LANES, KINDS, fmtClock, fmtPrice, fmtOdds, marketName } from './core.js';

const $ = (id) => document.getElementById(id);
// Every lane string (play text, team names, reasons, notes, mark payloads) goes
// through esc() or textContent before it reaches the page.
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const f1 = (v) => (v === null || v === undefined || !Number.isFinite(v)) ? '-' : v.toFixed(1);
const NO = '<span class="muted">no data yet</span>';
$('ver').textContent = VERSION;

// ---------- theme ----------
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};
const th = store.get('red.theme');
if (th) document.documentElement.dataset.theme = th;
$('theme').onclick = () => {
  const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const nx = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = nx; store.set('red.theme', nx);
};

// ---------- relay base and key ----------
const qs = new URLSearchParams(location.search);
// same storage keys as the shared push helper, so both reach the same relay
// Relay only on this computer (security review 2026-11-12): any other host in ?relay= or in storage is ignored.
const isLocalRelay = (b) => { try { const u = new URL(b); return (u.protocol === 'http:' || u.protocol === 'https:') && ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname); } catch { return false; } };
const qRelay = (qs.get('relay') || '').replace(/\/+$/, '');
if (qRelay && isLocalRelay(qRelay)) store.set('liveLab.relay', qRelay);
if (qs.get('k')) store.set('liveLab.relayKey', qs.get('k'));
const KEY = qs.get('k') || store.get('liveLab.relayKey') || '';
const savedRelay = store.get('liveLab.relay');
const RELAY = ((qRelay && isLocalRelay(qRelay) ? qRelay : null) || ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? location.origin : null) || (savedRelay && isLocalRelay(savedRelay) ? savedRelay : null) || 'http://localhost:4477').replace(/\/$/, '');
const rurl = (p, params = {}) => {
  const u = new URL(RELAY + p);
  for (const [k, v] of Object.entries(params)) if (v !== null && v !== undefined) u.searchParams.set(k, v);
  if (KEY) u.searchParams.set('k', KEY);
  return u.toString();
};

// ---------- state ----------
let lock = createLock();
let tr = lock.tracker;
let lastSeq = 0;
let mode = 'connecting';     // stream, poll, browser
let relayUp = false;
let cfg = null;
let lastEvWall = 0, lastEvT = null, lastRecvWall = 0;
let es = null, pollTimer = null, silentTimer = null;

function reset() { lock = createLock(); tr = lock.tracker; }

function handle(ev) {
  if (!ev || typeof ev !== 'object') return;
  if (ev.seq && ev.seq <= lastSeq) return;
  if (ev.seq) lastSeq = ev.seq;
  // In a replay only replayed lanes (origT) move the clock; live posts such as
  // taps and picks carry today's time and are shifted by the core instead.
  const replaying = cfg && cfg.mode === 'replay';
  const t = replaying && !(ev.data && ev.data.origT) ? NaN : Date.parse((ev.data && ev.data.origT) || ev.t);
  // a replay that loops jumps back in time: start the tracker over
  if (Number.isFinite(t) && tr.lastTick !== null && t < tr.lastTick - 60000) reset();
  lock.ingest(ev);
  if (Number.isFinite(t)) { lastEvT = Math.max(lastEvT ?? 0, t); lastRecvWall = Date.now(); }
  lastEvWall = Date.now();
}
function nowMs() {
  if (cfg && cfg.mode === 'replay' && lastEvT !== null) {
    const sp = (cfg.replay && cfg.replay.speed) || 1;
    return lastEvT + (Date.now() - lastRecvWall) * sp;
  }
  return Date.now();
}

// ---------- relay connection ----------
async function probeRelay() {
  try {
    const r = await fetch(rurl('/config'), { cache: 'no-store' });
    if (!r.ok) throw new Error(String(r.status));
    cfg = await r.json();
    relayUp = true;
    return true;
  } catch { relayUp = false; return false; }
}
function startStream() {
  stopAll();
  mode = 'stream';
  try { es = new EventSource(rurl('/stream', { since: lastSeq })); } catch { return startPoll(); }
  const arm = () => { clearTimeout(silentTimer); silentTimer = setTimeout(() => startPoll(), 5000); };
  arm();
  es.onmessage = (m) => { arm(); try { handle(JSON.parse(m.data)); } catch { /* bad line */ } };
  es.onerror = () => { startPoll(); };
}
function startPoll() {
  stopAll();
  mode = 'poll';
  let busy = false, fails = 0;
  pollTimer = setInterval(async () => {
    if (busy) return; busy = true;
    try {
      const r = await fetch(rurl('/log', { since: lastSeq, limit: 2000 }), { cache: 'no-store' });
      if (!r.ok) throw new Error(String(r.status));
      const arr = await r.json();
      for (const ev of (Array.isArray(arr) ? arr : arr.events || [])) handle(ev);
      fails = 0; relayUp = true;
    } catch { if (++fails > 6) { relayUp = false; goBrowser(); } }
    busy = false;
  }, 500);
}
function stopAll() {
  if (es) { es.close(); es = null; }
  clearInterval(pollTimer); pollTimer = null; clearTimeout(silentTimer);
  stopBrowserPoll();
}
async function connect() {
  if (await probeRelay()) startStream(); else goBrowser();
}
// retry the stream every 60 s when on polling, and the relay every 10 s when off
setInterval(async () => {
  if (mode === 'poll' && relayUp) startStream();
}, 60000);
setInterval(async () => {
  if (mode === 'browser' && await probeRelay()) { reset(); lastSeq = 0; startStream(); }
}, 10000);

// ---------- browser-only lanes (no relay) ----------
const ESPN_ID = qs.get('espn') || '401873052';
let bTimer = null;
function goBrowser() {
  if (mode === 'browser') return;
  stopAll(); mode = 'browser';
  bTimer = setInterval(pollScore, 2000);
  pollScore();
}
function stopBrowserPoll() { clearInterval(bTimer); bTimer = null; }
async function pollScore() {
  const t0 = performance.now();
  try {
    const r = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=' + ESPN_ID + '&_=' + Date.now(), { cache: 'no-store' });
    const j = await r.json();
    const comp = j.header && j.header.competitions && j.header.competitions[0];
    if (!comp) return;
    const st = comp.status || {};
    const home = (comp.competitors || []).find((c) => c.homeAway === 'home') || {};
    const away = (comp.competitors || []).find((c) => c.homeAway === 'away') || {};
    const cur = (j.drives && j.drives.current && j.drives.current.plays) || [];
    const plays = cur.slice(-5).map((p) => ({ id: p.id, text: p.text, wallclock: p.wallclock, type: p.type && p.type.text, clock: p.clock && p.clock.displayValue, period: p.period && p.period.number }));
    const last = plays[plays.length - 1] || {};
    handle({ seq: 0, t: new Date().toISOString(), lane: 'espn', ms: Math.round(performance.now() - t0), data: {
      state: st.type && st.type.state, completed: st.type && st.type.completed, period: st.period, clock: st.displayClock, detail: st.type && st.type.detail,
      homeScore: home.score, awayScore: away.score, lastPlayId: last.id, lastPlayText: last.text, lastPlayWallclock: last.wallclock, lastPlayType: last.type, plays } });
  } catch { /* keep trying */ }
}

// ---------- push lane helper (shared) ----------
async function startPush() {
  try {
    const mod = await import('../../../tracker/shared/fastcast.js');
    if (typeof mod.connectFastcast !== 'function') { pushState = 'helper has no connect function'; return; }
    pushState = 'connecting';
    // the helper posts each patch to the relay itself (the relay drops duplicates)
    mod.connectFastcast({ eventId: ESPN_ID, league: 'NFL', onMessage: onPush, post: true, source: 'red' });
  } catch { pushState = 'helper not available yet'; }
}
let pushState = 'starting';
let pushMsgs = 0;
function onPush(m) {
  if (!m) return;
  if (m.op === 'S') { pushState = 'listening'; return; }
  if (m.op === 'close') { pushState = 'reconnecting'; return; }
  const clientT = m.clientT || new Date().toISOString();
  pushMsgs++; pushState = 'listening, ' + pushMsgs + ' messages';
  // checkpoints never reach the relay, so read them here; patches arrive
  // through the relay when it is up, and here when it is not
  if (m.op === 'CP') handle({ seq: 0, t: clientT, lane: 'fastcast', data: { topic: m.topic, clientT, payload: { doc: m.doc } } });
  else if (m.op === 'P' && !relayUp) handle({ seq: 0, t: clientT, lane: 'fastcast', data: { topic: m.topic, clientT, payload: { list: m.list, ts: m.ts } } });
}

// ---------- marks: TV taps and pick test ----------
async function postMark(body) {
  const clientT = new Date().toISOString();
  const b = { source: 'red', clientT, ...body };
  if (relayUp) {
    try { await fetch(rurl('/mark'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }); return true; } catch { /* fall through */ }
  }
  handle({ seq: 0, t: clientT, lane: 'mark', data: b });
  return false;
}
for (const b of document.querySelectorAll('.tv')) {
  b.onclick = async () => {
    const k = b.dataset.k;
    const sent = await postMark({ kind: k, note: 'TV ' + k });
    $('tvresult').textContent = 'TV ' + k + ' at ' + new Date().toLocaleTimeString() + (sent ? ', sent to the relay' : ', kept on this page');
  };
}
const PICKS = [
  ['spread', 'home', 'spreadHome', 'Home spread'], ['spread', 'away', 'spreadAway', 'Away spread'],
  ['total', 'over', 'totalOver', 'Over'], ['total', 'under', 'totalUnder', 'Under'],
  ['ml', 'home', 'mlHome', 'Home to win'], ['ml', 'away', 'mlAway', 'Away to win'],
];
function sideText(key, m) {
  if (!m) return 'no price';
  if (key.startsWith('spread')) return (m.line > 0 ? '+' : '') + m.line + (m.odds !== null ? ' (' + fmtOdds(m.odds) + ')' : '');
  if (key.startsWith('total')) return m.line + (m.odds !== null ? ' (' + fmtOdds(m.odds) + ')' : '');
  return m.odds !== null ? fmtOdds(m.odds) : 'no price';
}
function renderPickButtons(st) {
  const g = $('pickgrid');
  if (!g.children.length) {
    for (const [market, side, key, name] of PICKS) {
      const b = document.createElement('button');
      b.dataset.key = key; b.dataset.market = market; b.dataset.side = side;
      b.innerHTML = esc(name) + '<span class="p"></span>';
      b.onclick = () => tapPick(b);
      g.appendChild(b);
    }
  }
  for (const b of g.children) {
    const m = st.markets[b.dataset.key];
    b.querySelector('.p').textContent = sideText(b.dataset.key, m);
    b.disabled = !m;
    b.dataset.line = m && m.line !== null ? m.line : '';
    b.dataset.odds = m && m.odds !== null ? m.odds : '';
  }
}
async function tapPick(b) {
  const now = nowMs();
  const pick = { market: b.dataset.market, side: b.dataset.side, shownLine: b.dataset.line === '' ? null : Number(b.dataset.line), shownOdds: b.dataset.odds === '' ? null : Number(b.dataset.odds) };
  const st = lock.status(now);
  const r = lock.tryPick(pick, now);
  $('pickresult').innerHTML = (r.accepted ? '<span class="ok">Accepted</span> ' : '<span class="no">Refused</span> ') + esc(r.reason);
  const g = (cfg && cfg.home) ? { home: cfg.home, away: cfg.away } : { home: 'home', away: 'away' };
  const team = pick.side === 'home' ? g.home : pick.side === 'away' ? g.away : null;
  await postMark({ kind: 'pick', note: 'pick test', payload: { team, ...pick, accepted: r.accepted, reason: r.reason, lockState: st.open ? 'open' : 'locked', clientT: new Date().toISOString() } });
}

// Team names: /config first, then the Rush lane's game object, else a plain label.
function teamNames() {
  if (cfg && cfg.home && cfg.away) return String(cfg.away) + ' at ' + String(cfg.home);
  const rr = tr.snap.rush && tr.snap.rush.raw && tr.snap.rush.raw.raw;
  const h = rr && rr.home_team && rr.home_team.abbreviation, a = rr && rr.away_team && rr.away_team.abbreviation;
  if (h && a) return String(a) + ' at ' + String(h);
  return cfg && cfg.mode === 'replay' ? 'Replay (no team names in this log)' : 'Away at Home';
}
// Refresh /config so lane read gaps and team names follow the relay.
setInterval(async () => { if (relayUp) await probeRelay(); }, 15000);

// ---------- render ----------
function laneRow(l) {
  const s = tr.snap[l];
  if (!s || (!s.t && s.error)) return '<tr><th>' + esc(LABEL[l]) + '</th><td colspan="7">' + (s && s.error ? 'error ' + esc(s.error) : NO) + '</td></tr>';
  const age = (nowMs() - s.t) / 1000;
  // expected read gap from /config (the relay reads every 10 s before 8 PM ET, then 1 s)
  const lc = cfg && cfg.lanes && cfg.lanes[l];
  const every = lc ? (lc.currentSeconds || lc.seconds || 1) : (l === 'fastcast' ? 30 : 2);
  const late = age > Math.max(5, every * 3);
  const clock = s.period !== null && s.period !== undefined ? 'Q' + s.period + ' ' + (fmtClock(s.clockS) ?? '') : '-';
  const score = s.home !== null && s.away !== null && s.home !== undefined ? s.away + ' to ' + s.home : '-';
  const pl = s.plays && s.plays.length ? s.plays : (s.lastPlays || []);
  const lp = pl.length ? pl[pl.length - 1].text : '';
  const p = s.prices || {};
  const pc = (k) => p[k] ? esc(fmtPrice(k, p[k])) : '-';
  const err = s.error ? ' <span class="no">error ' + esc(s.error) + '</span>' : '';
  return '<tr><th>' + esc(LABEL[l]) + err + '</th><td>' + esc(clock) + '</td><td>' + esc(score) + '</td><td class="wrap">' + esc((lp || '-').slice(0, 110)) + '</td><td>' + pc('S') + '</td><td>' + pc('T') + '</td><td>' + pc('M') + '</td><td class="num' + (late ? ' no' : '') + '">' + f1(age) + ' s<br><span class="muted small">reads every ' + f1(every) + ' s</span></td></tr>';
}
function render() {
  const now = nowMs();
  tr.tick(now);
  const st = lock.status(now);
  // header
  const g = tr.snap.sgo || tr.snap.espn;
  const names = teamNames();
  $('game').textContent = g && g.home !== null && g.home !== undefined ? names + '  ' + g.away + ' to ' + g.home + (g.period ? '  Q' + g.period + ' ' + (fmtClock(g.clockS) ?? '') : '') : names + (Object.keys(tr.snap).length ? ': no score yet' : ': no game data yet');
  const modeText = { stream: 'Live stream', poll: 'Polling the log every 0.5 s', browser: 'Browser lanes only', connecting: 'Connecting' }[mode];
  $('conn').textContent = modeText + (cfg && cfg.mode === 'replay' ? ' (replay x' + ((cfg.replay && cfg.replay.speed) || 1) + ')' : '') + ' . push lane: ' + pushState;
  const ban = $('banner');
  if (mode === 'browser') { ban.hidden = false; ban.textContent = 'Laptop relay not connected: licensed feed and Rush lanes are off'; } else ban.hidden = true;

  // lock card
  const card = $('lockcard');
  const any = Object.keys(tr.snap).length > 0;
  card.className = 'lockcard ' + (any ? (st.open ? 'open' : 'locked') : '');
  $('lockstate').textContent = any ? (st.open ? 'OPEN' : 'LOCKED') : 'No data yet';
  $('lockwhy').textContent = any ? st.reason + (st.sinceMs ? ' (for ' + Math.round((now - st.sinceMs) / 1000) + ' s)' : '') : '';
  const truth = tr.truth();
  const red = tr.score('red', truth);
  $('locknums').innerHTML = red.openShare === null ? 'Bad opens and open share start at kickoff.' :
    'Bad opens <b>' + red.badWindows + '</b> (' + f1(red.badSec) + ' s) . Open share <b>' + (100 * red.openShare).toFixed(1) + '%</b> of ' + Math.round(red.inGameSec / 60) + ' min';

  // big numbers
  const lt = tr.lagTable();
  const base = tr.baseline();
  const big = [];
  for (const l of DATA_LANES) {
    const meds = KINDS.map((k) => lt[l][k]).filter((x) => x.n);
    const n = meds.reduce((a, x) => a + x.n, 0);
    const now1 = meds.length ? meds.map((x) => x.now).reduce((a, b) => Math.max(a, b)) : null;
    const med = meds.length ? meds.map((x) => x.med).sort((a, b) => a - b)[Math.floor((meds.length - 1) / 2)] : null;
    big.push('<div class="big"><div class="k">' + esc(LABEL[l]) + ' behind fastest</div><div class="v">' + (n ? f1(med) + ' s' : '-') + '</div><div class="s">' + (n ? 'median of kinds, ' + n + ' matched' : 'no data yet') + '</div></div>');
  }
  const pf = lt.espn.field.n ? lt.espn.field : lt.fastcast.field;
  big.push('<div class="big"><div class="k">Plays behind the field stamp</div><div class="v">' + (pf.n ? f1(pf.med) + ' s' : '-') + '</div><div class="s">' + (pf.n ? 'median, p90 ' + f1(pf.p90) + ' s, ' + pf.n + ' plays' : 'no data yet') + '</div></div>');
  $('bignums').innerHTML = big.join('');

  // pick test
  renderPickButtons(st);
  const gp = tr.gradePicks(truth);
  $('pickstats').innerHTML = 'Attempts <b>' + gp.attempts + '</b> . accepted <b>' + gp.accepted + '</b> . clean <b>' + gp.clean + '</b> . past-posted <b>' + gp.pastPosted + '</b>' + (gp.pending ? ' . grading ' + gp.pending : '') +
    (gp.rows.length ? '<br>' + gp.rows.slice(-2).reverse().map((r) => esc(new Date(r.t).toLocaleTimeString() + ' ' + r.market + ' ' + r.side + ': ' + r.grade)).join('<br>') : '');

  // lanes
  $('lanes').innerHTML = '<tr><th>Lane</th><th>Clock</th><th>Score (away to home)</th><th>Last play</th><th>Spread (home)</th><th>Total</th><th>Moneyline (home)</th><th class="num">Age</th></tr>' + DATA_LANES.map(laneRow).join('');

  // lags
  let h = '<tr><th>Lane</th>' + KINDS.map((k) => '<th class="num" colspan="4">' + k + '</th>').join('') + '<th class="num" colspan="2">behind field (plays)</th></tr><tr><th></th>' + KINDS.map(() => '<th class="num">now</th><th class="num">med</th><th class="num">p90</th><th class="num">worst</th>').join('') + '<th class="num">med</th><th class="num">p90</th></tr>';
  for (const l of DATA_LANES) {
    h += '<tr><th>' + esc(LABEL[l]) + '</th>';
    for (const k of KINDS) { const s = lt[l][k]; h += s.n ? '<td class="num">' + f1(s.now) + '</td><td class="num"><b>' + f1(s.med) + '</b></td><td class="num">' + f1(s.p90) + '</td><td class="num">' + f1(s.worst) + '</td>' : '<td class="num muted" colspan="4">no data yet</td>'; }
    const fs = lt[l].field;
    h += fs.n ? '<td class="num">' + f1(fs.med) + '</td><td class="num">' + f1(fs.p90) + '</td>' : '<td class="num muted" colspan="2">-</td>';
    h += '</tr>';
  }
  $('lags').innerHTML = h;
  const nm = tr.entries.filter((e) => Object.keys(e.lanes).filter((x) => DATA_LANES.includes(x)).length >= 2).length;
  $('laghint').textContent = 'Each number is one lane\'s first sight of an event minus the earliest lane\'s first sight of the same event. ' + nm + ' matched events of ' + tr.entries.length + ' seen. Clock events are exact game-clock readings, so a lane that skips a reading is not counted for it.';

  // stale meter
  const s = tr.stale;
  $('stale').innerHTML = !tr.snap.rush ? NO : '<div class="stalebig">' + Math.round(s.seconds) + ' s</div><div>' + s.windows + ' windows . now <b class="' + (s.on ? 'no' : 'ok') + '">' + (s.on ? 'stale (' + esc(s.reason) + ')' : 'matches') + '</b></div><div class="muted">price mismatch ' + Math.round(s.byReason.price || 0) + ' s . after a snap, score or play known elsewhere ' + Math.round(s.byReason.incident || 0) + ' s</div>';

  // baseline
  $('baseline').innerHTML = '<table><tr><th>Kind</th><th class="num">saved median</th><th class="num">p90</th><th class="num">worst</th><th class="num">events</th></tr>' + KINDS.map((k) => {
    const b = base[k];
    return '<tr><td>' + k + '</td>' + (b.n ? '<td class="num"><b>' + f1(b.med) + ' s</b></td><td class="num">' + f1(b.p90) + '</td><td class="num">' + f1(b.worst) + '</td><td class="num">' + b.n + '</td>' : '<td class="num muted" colspan="4">no data yet</td>') + '</tr>';
  }).join('') + '</table><p class="hint">Seconds the Rush lane trails the best raw lane on the same event. The shadow fast lane is the earliest of Odds feed, Score feed (poll) and Score feed (push).</p>';

  // rules
  $('rules').innerHTML = '<tr><th>Rule</th><th class="num">open share</th><th class="num">bad opens</th><th class="num">bad s</th><th class="num">live-ball s</th><th class="num">windows</th></tr>' + Object.keys(tr.rules).map((k) => {
    const r = tr.score(k, truth);
    return '<tr><td>' + esc(tr.rules[k].name) + '</td>' + (r.openShare === null ? '<td class="muted" colspan="5">starts at kickoff</td>' : '<td class="num"><b>' + (100 * r.openShare).toFixed(1) + '%</b></td><td class="num"><b>' + r.badWindows + '</b></td><td class="num">' + f1(r.badSec) + '</td><td class="num">' + f1(r.badLiveSec) + '</td><td class="num">' + r.windows + '</td>') + '</tr>';
  }).join('');

  // ranking
  const rk = tr.ranking();
  $('ranking').innerHTML = rk.length ? '<ol>' + rk.map((r) => '<li>' + esc(LABEL[r.lane]) + ': ' + f1(r.med) + ' s' + (r.lane === 'tv' ? ' (' + r.n + ' taps; negative means the TV led)' : '') + '</li>').join('') + '</ol>' + (rk.some((r) => r.lane === 'tv') ? '' : '<p class="hint">TV joins once taps match events.</p>') : NO;

  // limits
  renderLimits(lt, base, red, gp);

  // feed (capped at 60 rows)
  $('feed').innerHTML = tr.feed.slice(-60).reverse().map((x) => '<li><span class="tm">' + esc(new Date(x.t).toLocaleTimeString()) + '</span><span class="tag">' + esc(LABEL[x.lane] || 'Lock') + '</span>' + esc(x.text) + '</li>').join('') || '<li class="muted">no events yet</li>';
}

function renderLimits(lt, base, red, gp) {
  const pf = lt.espn.field;
  // Verdict so far: three plain lines from the page's own numbers (textContent only)
  const settle = tr.score('settle30');
  const v1 = base.price.n || base.clock.n || base.score.n
    ? 'Rush shows prices ' + f1(base.price.med) + ' s late, the clock ' + f1(base.clock.med) + ' s late and the score ' + f1(base.score.med) + ' s late (medians against the fastest raw lane).'
    : 'Rush lateness: no matched Rush events yet.';
  const v2 = red.openShare === null
    ? 'Lock: measured from kickoff. Before then the pregame line is open.'
    : 'The Red lock would allow picks ' + (100 * red.openShare).toFixed(1) + '% of game time with ' + red.badWindows + ' bad opens (' + f1(red.badSec) + ' s); the 30 s starting rule allows ' + (100 * (settle.openShare || 0)).toFixed(1) + '% with ' + settle.badWindows + ' bad opens.';
  const v3 = 'Unsolved: plays reach the free feeds ' + (pf.n ? f1(pf.med) + ' s' : 'an unmeasured time') + ' after the field, so picks between plays stay locked' + (tr.snap.rush ? '; Rush held a stale price for ' + Math.round(tr.stale.seconds) + ' s over ' + tr.stale.windows + ' windows.' : '.');
  const vd = $('verdict');
  if (vd && vd.children && vd.children.length === 3) { vd.children[0].textContent = v1; vd.children[1].textContent = v2; vd.children[2].textContent = v3; }
  const rows = [
    ['Plays reach every free feed late', pf.n ? 'Score feed (poll) median ' + f1(pf.med) + ' s behind the field stamp' : 'no data yet', 'Lock is built from break windows anchored on the play stamp, not on arrival, so lag shortens the window instead of stretching it', 'Watch bad opens on timeouts and quarter breaks', red.openShare === null ? 'pending kickoff' : red.badWindows + ' bad opens, ' + (100 * red.openShare).toFixed(1) + '% open'],
    ['Rush shows prices late', base.price.n ? 'median ' + f1(base.price.med) + ' s behind the best raw lane' : 'no data yet', 'Read prices from the fastest lane, not the 5 s app read', 'Rush lane against Odds feed on every price event', base.price.n ? 'would save ' + f1(base.price.med) + ' s median' : 'pending'],
    ['Book available flag lags the game', 'flag stayed on through scores on 2026-11-05', 'Rush owns the lock: 30 s settle on price and score, plus break windows', 'Count price moves inside open windows', red.openShare === null ? 'pending kickoff' : f1(red.badSec) + ' bad open s'],
    ['Next snap is invisible when the clock is stopped', 'a snap after an incompletion shows on no lane until the play posts', 'No open between plays; only timeouts, two-minute warning, quarter and half breaks, and after a field goal or conversion', 'Pick test from the TV during breaks', gp.attempts ? gp.clean + ' clean, ' + gp.pastPosted + ' past-posted of ' + gp.accepted + ' accepted' : 'no attempts yet'],
    ['Push lane shape not confirmed', pushState, 'Read plays, clock and score from the push payload, matched by play id', 'Compare push against poll on play events', lt.fastcast.play.n ? 'push median ' + f1(lt.fastcast.play.med) + ' s behind fastest' : 'no data yet'],
  ];
  $('limits').innerHTML = '<tr><th>Limit</th><th>Seen</th><th>Fix</th><th>In-game test</th><th>Result</th></tr>' + rows.map((r) => '<tr>' + r.map((c) => '<td class="wrap">' + esc(c) + '</td>').join('') + '</tr>').join('');
}

connect();
startPush();
render();
setInterval(() => { try { render(); } catch (e) { console.error(e); } }, 1000);
