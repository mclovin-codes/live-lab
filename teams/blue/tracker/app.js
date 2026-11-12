// Blue tracker page. Loads the same lock module the lab app loads (lock.js) through core.js.
import { createModel, LANE_NAMES, fmtClock, VERSION, toMs, eventTime } from './core.js';

const $ = (id) => document.getElementById(id);
const ESPN_EVENT = '401873052';
const LANE_ORDER = ['sgo', 'rush', 'espn', 'fastcast', 'tv'];
const KINDS = ['clock', 'score', 'play', 'price'];
$('ver').textContent = VERSION;

// ---------- storage helpers (per viewer conveniences only) ----------
const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

// ---------- theme ----------
const savedTheme = lsGet('blue.theme');
if (savedTheme) document.documentElement.dataset.theme = savedTheme;
$('theme').onclick = () => {
  const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  lsSet('blue.theme', next);
};

// ---------- relay base and key ----------
const q = new URLSearchParams(location.search);
// Relay only on this computer (security review 2026-11-12): any other host in ?relay= or in storage is ignored.
const isLocalRelay = (b) => { try { const u = new URL(b); return (u.protocol === 'http:' || u.protocol === 'https:') && ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname); } catch { return false; } };
function resolveBase() {
  const fromQ = (q.get('relay') || '').replace(/\/+$/, '');
  if (fromQ && isLocalRelay(fromQ)) { lsSet('liveLab.relay', fromQ); return fromQ; }
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return location.origin;
  const saved = lsGet('liveLab.relay');
  if (saved && isLocalRelay(saved)) return saved;
  return 'http://localhost:4477';
}
function resolveKey() {
  const k = q.get('k');
  if (k) { lsSet('liveLab.relayKey', k); return k; }
  return lsGet('liveLab.relayKey') || '';
}
const BASE = resolveBase();
const KEY = resolveKey();
function rurl(route, params = {}) {
  const u = new URL(BASE + route);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null) u.searchParams.set(k, v);
  if (KEY) u.searchParams.set('k', KEY);
  return u.toString();
}

// ---------- model ----------
let model = createModel();
let lastSeq = 0;
let skew = 0; // event clock minus browser clock, learned from events
let relayUp = false;
let mode = 'Starting';
let lastEventAt = 0;
const seen = new Set();
const oddsHist = []; // odds feed spread and total lines by time, for grading picks

function ingest(ev) {
  if (!ev || !ev.lane) return;
  if (ev.seq) {
    if (seen.has(ev.seq)) return;
    seen.add(ev.seq);
    if (seen.size > 5000) { const it = seen.values(); for (let i = 0; i < 1000; i++) seen.delete(it.next().value); }
    if (ev.seq > lastSeq) lastSeq = ev.seq;
  }
  // On a replay relay every lane runs on the recorded clock (data.origT). Live posts with no origT
  // (push lane, other pages) would mix two timelines, so they are dropped; our own taps are moved onto the replay clock.
  if (relayMode === 'replay' && !(ev.data && ev.data.origT)) {
    if (ev.lane !== 'mark') return;
    ev = { ...ev, data: { ...ev.data, origT: new Date(nowMs()).toISOString() } };
  }
  // A replay restart begins again from the top; a fresh model keeps the ruler honest.
  if (ev.data && ev.data.replayPass && ev.data.replayPass !== model._pass) { model = createModel(); model._pass = ev.data.replayPass; }
  const t = eventTime(ev);
  const d = t - Date.now();
  if (Math.abs(d - skew) > 3000) skew = d;
  // newest event time; a jump back over a minute means a new timeline (replay restart)
  if (t > lastEvT || lastEvT - t > 60000) lastEvT = t;
  lastEventAt = Date.now();
  model.ingest(ev);
  if (ev.lane === 'sgo' && ev.data && !ev.data.error) {
    const d = ev.data;
    oddsHist.push({ t, spread: d.spreadHome ? parseFloat(d.spreadHome.line) : null, total: d.total ? parseFloat(d.total.line) : null });
    if (oddsHist.length > 3000) oddsHist.splice(0, 1000);
  }
  if (ev.lane === 'mark' && ev.data && ev.data.kind === 'pick') notePickFromLog(ev);
}
// Page clock: the event clock, never behind the newest event, so no age reads negative (replay or live).
let lastEvT = 0;
const nowMs = () => Math.max(Date.now() + skew, lastEvT);

// ---------- relay transport: SSE first, /log polling fallback ----------
let es = null; let pollTimer = null; let silentTimer = null; let retryTimer = null; let streamRetry = null;
function setMode(m) { mode = m; }
async function refill() {
  const r = await fetch(rurl('/log', { since: lastSeq, limit: 5000 }), { cache: 'no-store' });
  if (!r.ok) throw new Error('log ' + r.status);
  const body = await r.json();
  const events = Array.isArray(body) ? body : body.events || [];
  for (const ev of events) ingest(ev);
  return events.length;
}
function startPolling() {
  if (pollTimer) return;
  if (es) { es.close(); es = null; }
  setMode('Polling every 0.5 s');
  // Step back up to the stream after 60 s of polling; if the stream fails again we land back here.
  clearTimeout(streamRetry);
  streamRetry = setTimeout(() => { if (pollTimer) { stopPolling(); connect(); } }, 60000);
  pollTimer = setInterval(async () => {
    try { await refill(); relayUp = true; } catch (e) { console.warn("poll failed", e && e.message); relayUp = false; stopPolling(); scheduleRetry(); }
  }, 500);
}
function stopPolling() { if (pollTimer) clearInterval(pollTimer); pollTimer = null; }
function scheduleRetry() {
  if (retryTimer) return;
  setMode('Relay not connected');
  retryTimer = setTimeout(() => { retryTimer = null; connect(); }, 5000);
}
let relayStartedAt = null;
let relayMode = null;
async function connect() {
  try {
    // A relay restart without a log file starts seq again at 1: start a fresh model so nothing is dropped as seen.
    const cfg = await (await fetch(rurl('/config'), { cache: 'no-store' })).json();
    if (relayStartedAt && cfg.startedAt !== relayStartedAt && (cfg.seq || 0) < lastSeq) { lastSeq = 0; seen.clear(); model = createModel(); }
    relayStartedAt = cfg.startedAt;
    relayMode = cfg.mode || null;
    if (relayMode !== 'replay') startFastcast();
    await refill();
    relayUp = true;
  } catch {
    relayUp = false;
    startFastcast();
    scheduleRetry();
    return;
  }
  if (typeof EventSource === 'undefined') return startPolling();
  try {
    es = new EventSource(rurl('/stream', { since: lastSeq }));
  } catch { return startPolling(); }
  setMode('Live stream');
  lastEventAt = Date.now();
  es.onmessage = (m) => { try { ingest(JSON.parse(m.data)); } catch {} };
  es.onerror = () => { if (es) { es.close(); es = null; } startPolling(); };
  clearInterval(silentTimer);
  silentTimer = setInterval(() => {
    if (es && Date.now() - lastEventAt > 5000) startPolling();
  }, 1000);
}
connect();

// ---------- browser side lanes when the relay is off ----------
// Score feed (poll): read straight from the public score feed every 2 s while the relay is down.
let browserPoll = null;
function startBrowserPoll() {
  if (browserPoll) return;
  browserPoll = setInterval(async () => {
    if (relayUp || relayMode === 'replay') return;
    const t0 = performance.now();
    try {
      const r = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=' + ESPN_EVENT + '&_=' + Date.now(), { cache: 'no-store' });
      const j = await r.json();
      const c = j.header && j.header.competitions && j.header.competitions[0];
      if (!c) return;
      const home = (c.competitors || []).find((x) => x.homeAway === 'home') || {};
      const away = (c.competitors || []).find((x) => x.homeAway === 'away') || {};
      const plays = j.drives && j.drives.current && Array.isArray(j.drives.current.plays) ? j.drives.current.plays.slice(-5) : [];
      const last = plays[plays.length - 1] || null;
      ingest({ t: new Date().toISOString(), lane: 'espn', ms: Math.round(performance.now() - t0), data: {
        state: c.status && c.status.type && c.status.type.state, completed: c.status && c.status.type && c.status.type.completed,
        period: c.status && c.status.period, clock: c.status && c.status.displayClock, detail: c.status && c.status.type && c.status.type.detail,
        homeScore: home.score, awayScore: away.score,
        lastPlayId: last && last.id, lastPlayText: last && last.text, lastPlayType: last && last.type && last.type.text, lastPlayWallclock: last && last.wallclock,
        plays: plays.map((p) => ({ id: p.id, text: p.text, type: p.type && p.type.text, wallclock: p.wallclock, clock: p.clock && p.clock.displayValue, period: p.period && p.period.number })),
      } });
    } catch {}
  }, 2000);
}
startBrowserPoll();

// Score feed (push): the shared helper. When the relay is up the helper posts and the relay echoes the lane
// back to us, so direct messages are used only while the relay is down.
let fcStarted = false;
function startFastcast() {
if (fcStarted) return;
fcStarted = true;
import('../../../tracker/shared/fastcast.js').then((mod) => {
  try {
    mod.connectFastcast({ eventId: ESPN_EVENT, league: 'NFL', post: true, source: 'blue', onMessage: (msg) => {
      if (relayUp && relayMode !== 'replay') return;
      if (relayMode === 'replay') return;
      if (msg.op === 'P' || msg.op === 'CP') ingest({ t: new Date().toISOString(), lane: 'fastcast', ms: null, data: { topic: msg.topic, clientT: msg.clientT, payload: msg.op === 'CP' ? { doc: msg.doc } : { list: msg.list } } });
    } });
  } catch (e) { console.warn('fastcast helper failed', e); }
}).catch(() => {});
}

// ---------- TV taps ----------
for (const b of document.querySelectorAll('[data-tap]')) {
  b.addEventListener('click', () => postMark({ kind: b.dataset.tap, note: null, source: 'blue', clientT: new Date().toISOString() }, true));
}
async function postMark(body, localEcho) {
  if (relayUp) {
    try { await fetch(rurl('/mark'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); return; } catch {}
  }
  if (localEcho) ingest({ t: new Date().toISOString(), lane: 'mark', data: body });
}

// Team labels: tonight's names live, neutral names over a replay of another game.
const TEAMS = () => (relayMode === 'replay' ? { a: 'Away', h: 'Home' } : { a: 'WSH', h: 'NYG' });

// ---------- pick test ----------
const picks = []; // {id, clientT, tMs, market, side, shownLine, shownOdds, accepted, reason, lockState, grade}
const PICK_BUTTONS = [
  ['spread', 'away', 'spreadAway', 'a', ' spread'], ['total', 'over', 'totalOver', '', 'Over'], ['ml', 'away', 'mlAway', 'a', ' to win'],
  ['spread', 'home', 'spreadHome', 'h', ' spread'], ['total', 'under', 'totalUnder', '', 'Under'], ['ml', 'home', 'mlHome', 'h', ' to win'],
];
function renderPickButtons(status) {
  const box = $('picks');
  if (!box.childElementCount) {
    for (const [market, side, key, team, label] of PICK_BUTTONS) {
      const b = document.createElement('button');
      b.dataset.key = key; b.dataset.market = market; b.dataset.side = side; b.dataset.team = team; b.dataset.label = label;
      b.innerHTML = '<span class="small"></span><b>-</b>';
      b.onclick = () => tapPick(b);
      box.appendChild(b);
    }
  }
  for (const b of box.children) {
    const m = status.markets[b.dataset.key];
    const txt = m ? [m.line, m.odds].filter(Boolean).join('  ') || 'shown' : 'not on the Board';
    b.querySelector('b').textContent = txt;
    b.querySelector('span').textContent = (b.dataset.team ? TEAMS()[b.dataset.team] : '') + b.dataset.label;
    b.dataset.line = m && m.line ? m.line : '';
    b.dataset.odds = m && m.odds ? m.odds : '';
    b.disabled = !m;
  }
}
function tapPick(b) {
  const now = nowMs();
  const pick = { market: b.dataset.market, side: b.dataset.side, shownLine: b.dataset.line || null, shownOdds: b.dataset.odds || null };
  const st = model.lock.status(now);
  const res = model.lock.tryPick(pick, now);
  const clientT = new Date().toISOString();
  const rec = { id: clientT + Math.random(), clientT, tMs: now, ...pick, team: pick.side === 'home' ? TEAMS().h : pick.side === 'away' ? TEAMS().a : null, accepted: res.accepted, reason: res.reason, lockState: st.open ? 'OPEN' : 'LOCKED', grade: null, mine: true };
  picks.unshift(rec);
  if (picks.length > 200) picks.pop();
  $('pickmsg').innerHTML = (res.accepted ? '<b class="ok">Accepted</b> ' : '<b class="bad">Refused</b> ') + esc(res.reason);
  postMark({ kind: 'pick', note: null, source: 'blue', clientT, payload: { team: rec.team, market: pick.market, side: pick.side, shownLine: pick.shownLine, shownOdds: pick.shownOdds, accepted: res.accepted, reason: res.reason, lockState: rec.lockState, clientT } }, false);
}
function notePickFromLog(ev) {
  const p = ev.data.payload || {};
  if (ev.data.source === 'blue' && picks.some((x) => x.clientT === p.clientT)) return;
  picks.unshift({ id: ev.seq, clientT: p.clientT, tMs: eventTime(ev), market: p.market, side: p.side, shownLine: p.shownLine, shownOdds: p.shownOdds, team: p.team, accepted: p.accepted, reason: p.reason, lockState: p.lockState, grade: null, source: ev.data.source });
  if (picks.length > 200) picks.pop();
}
// Grade an accepted pick once 60 s have passed: fresher price out at the tap, ball live at the tap, line moved in the next 10 s.
function gradePicks(now) {
  const mm = model.model;
  const priceRecs = [...mm.tokens.price.values()];
  if (!picks.length) return;
  for (const p of picks) {
    if (!p.accepted || p.grade || now - p.tMs < 60000) continue;
    const reasons = [];
    // fresher line: the odds feed's line at the tap differs from the line shown on the button
    let atTap = null;
    for (const h of oddsHist) { if (h.t <= p.tMs) atTap = h; else break; }
    const shown = p.shownLine !== null && p.shownLine !== undefined && p.shownLine !== '' ? parseFloat(p.shownLine) : null;
    if (atTap && shown !== null) {
      if (p.market === 'spread' && atTap.spread !== null && (p.side === 'away' ? -atTap.spread : atTap.spread) !== shown) reasons.push('fresher line out');
      if (p.market === 'total' && atTap.total !== null && atTap.total !== shown) reasons.push('fresher line out');
    }
    // ball live: a snap stamp before the tap whose result no raw lane showed until after the tap
    for (const pl of mm.plays.values()) {
      if (!pl.wall || (pl.stop && ['twomin', 'timeout', 'quarter', 'half'].includes(pl.stop.kind))) continue;
      if (pl.wall <= p.tMs && pl.firstKnown > p.tMs) {
        const sg = mm.frontier.find((f) => f.t > pl.wall);
        if (!sg || sg.t > p.tMs) { reasons.push('ball was live'); break; }
      }
    }
    if (priceRecs.some((r) => r.lane !== 'rush' && r.first > p.tMs && r.first - p.tMs <= 10000)) reasons.push('line moved within 10 s');
    p.grade = reasons.length ? (reasons.some((r) => r !== 'line moved within 10 s') ? 'past-posted: ' : 'moved: ') + reasons.join(', ') : 'clean';
  }
}

// ---------- rendering ----------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const f1 = (x) => (x === null || x === undefined || !Number.isFinite(x) ? '-' : x < 10 ? x.toFixed(1) : String(Math.round(x)));
const css = (lane) => 'var(--' + lane + ')';
const dot = (lane) => '<span class="dot" style="background:' + css(lane) + '"></span>';

function render() {
  const now = nowMs();
  const s = model.snapshot(now);
  gradePicks(now);
  // header
  $('wall').textContent = new Date(now).toLocaleTimeString('en-US', { timeZone: 'America/New_York' }) + ' ET';
  const pill = $('mode');
  pill.textContent = relayUp ? mode : 'Relay not connected';
  pill.className = 'pill ' + (relayUp ? (mode.startsWith('Live') ? 'ok' : '') : 'bad');
  $('norelay').hidden = relayUp;
  const g = s.lanes.sgo?.r || s.lanes.espn?.r || s.lanes.fastcast?.r;
  const T = TEAMS();
  const replayTag = relayMode === 'replay' ? 'Replay of a recorded game: ' : '';
  $('game').textContent = replayTag + (g && g.home !== null ? T.a + ' ' + g.away + '  ' + T.h + ' ' + g.home + (g.period ? '  Q' + g.period + ' ' + (fmtClock(g.clockSec) || '') : '') : (relayMode === 'replay' ? 'waiting for data' : 'WSH at NYG  ' + (s.lanes.sgo || s.lanes.espn ? 'Pregame' : 'No game data yet')));

  // hero: lock first, then clock lag now per lane, then stale meter
  const lk = s.lock;
  const lst = model.lock.status(now);
  const lockCls = lk.state === 'OPEN' ? 'open' : lk.state === 'LOCKED' ? 'locked' : '';
  let hero = '<div class="big lock ' + lockCls + '"><div class="k">Shadow lock</div><div class="v">' + esc(lk.state) + '</div><div class="s">' + esc(lst.reason) + '</div></div>';
  for (const lane of ['sgo', 'rush', 'espn', 'fastcast']) {
    const L = s.lanes[lane]; const c = s.lag[lane].clock;
    const has = L && L.r && L.r.elapsed !== null;
    hero += '<div class="big"><div class="k">' + dot(lane) + esc(LANE_NAMES[lane]) + ' clock behind</div><div class="v num">' + (has ? f1(c.now) + '<span class="small"> s</span>' : '<span class="small">' + (L && L.r && !s.live ? 'pregame, no clock yet' : 'no data yet') + '</span>') + '</div><div class="s num">' + (c.n ? 'median ' + f1(c.median) + '  90th ' + f1(c.p90) + '  worst ' + f1(c.worst) : 'no samples yet') + '</div></div>';
  }
  hero += '<div class="big ' + (s.stale.on ? 'locked' : '') + '"><div class="k">Rush stale line</div><div class="v num">' + (s.lanes.rush ? Math.round(s.stale.seconds) + '<span class="small"> s</span>' : '<span class="small">no data yet</span>') + '</div><div class="s num">' + s.stale.windows + ' windows' + (s.stale.on ? '  now: ' + esc(s.stale.reason.join(', ')) : '') + '</div></div>';
  $('hero').innerHTML = hero;

  // lanes
  let lh = '';
  for (const lane of LANE_ORDER) {
    const L = s.lanes[lane];
    if (lane === 'tv') {
      lh += '<div class="lane' + (s.marks.length ? '' : ' empty') + '"><div class="name">' + dot('tv') + 'TV</div><div class="row"><span>Taps</span><span class="num">' + s.tv.taps + '</span></div>' + (s.marks.length ? '<div class="row"><span>Last</span><span class="num">' + esc(s.marks[s.marks.length - 1].kind) + ' ' + f1(Math.max(0, (now - s.marks[s.marks.length - 1].t) / 1000)) + ' s ago</span></div>' : '<div class="play">No taps yet</div>') + '</div>';
      continue;
    }
    if (!L || !L.r) { lh += '<div class="lane empty"><div class="name">' + dot(lane) + esc(LANE_NAMES[lane]) + '</div><div class="play">No data yet' + (L && L.lastErr ? ': error ' + esc(L.lastErr.error) : '') + '</div></div>'; continue; }
    const r = L.r; const p = r.prices || r.displayPrices || {};
    const run = L.clock.running === true ? '<span class="run on">RUN</span>' : L.clock.running === false ? '<span class="run off">STOP</span>' : '<span class="run unk">?</span>';
    const ageClock = r.since ? f1(Math.max(0, (now - r.since.clock) / 1000)) : '-';
    const ml = [p.mlAway && p.mlAway.odds, p.mlHome && p.mlHome.odds].map((x) => x || '-').join(' / ');
    lh += '<div class="lane"><div class="name">' + dot(lane) + esc(LANE_NAMES[lane]) + (lane === 'rush' && r.pickable === false ? ' <span class="run on">not pickable</span>' : '') + (lane === 'sgo' && r.available === false ? ' <span class="run on">line off</span>' : '') + '</div>'
      + '<div class="clock num">' + (r.period ? 'Q' + r.period + ' ' : '') + (fmtClock(r.clockSec) || '-') + run + '</div>'
      + '<div class="row"><span>Score</span><span class="num">' + (r.home !== null ? esc(T.a + ' ' + r.away + ' ' + T.h + ' ' + r.home) : '-') + '</span></div>'
      + '<div class="row"><span>' + esc(T.h) + ' spread</span><span class="num">' + esc([p.spread && p.spread.line, p.spread && p.spread.odds].filter(Boolean).join(' ') || '-') + '</span></div>'
      + '<div class="row"><span>Total</span><span class="num">' + esc([p.total && p.total.line, p.total && p.total.odds].filter(Boolean).join(' ') || '-') + '</span></div>'
      + '<div class="row"><span>Win ' + esc(T.a + ' / ' + T.h) + '</span><span class="num">' + esc(ml) + '</span></div>'
      + '<div class="row"><span>Reading age</span><span class="num">' + f1(L.age) + ' s</span></div>'
      + '<div class="row"><span>Clock held</span><span class="num">' + ageClock + ' s</span></div>'
      + (lane === 'espn' ? '<div class="small">No in-play price on this lane; lines shown are its own slow copy.</div>' : '')
      + (r.playText ? '<div class="play">' + esc(r.playText) + '</div>' : '')
      + '</div>';
  }
  $('lanes').innerHTML = lh;

  // lag table
  let th = '<tr><th>Lane</th>' + KINDS.map((k) => '<th>' + k + '</th>').join('') + '</tr>';
  for (const lane of LANE_ORDER) {
    th += '<tr><td>' + dot(lane) + esc(LANE_NAMES[lane]) + '</td>';
    for (const k of KINDS) {
      const x = s.lag[lane][k];
      const lead = s.leader[k] === lane ? ' class="lead"' : '';
      th += '<td' + lead + '>' + (x.n || x.now !== null ? '<span class="n num">' + f1(x.now) + '</span><span class="d num">' + f1(x.median) + ' / ' + f1(x.p90) + ' / ' + f1(x.worst) + '  n' + x.n + '</span>' : '<span class="d">no data yet</span>') + '</td>';
    }
    th += '</tr>';
  }
  $('lagtable').innerHTML = th;

  drawTrace(s, now);

  // lock box
  const ls = model.lock.status(now);
  $('lockbox').innerHTML = '<div class="big ' + lockCls + '"><div class="v">' + esc(lk.state) + '</div><div class="s">' + esc(ls.reason) + '</div></div>'
    + '<table style="margin-top:8px"><tr><td>Open share (in play)</td><td class="num">' + (lk.inPlaySec ? (100 * lk.openSec / lk.inPlaySec).toFixed(1) + '%' : 'no data yet') + '</td></tr>'
    + '<tr><td>Open seconds / in-play seconds</td><td class="num">' + Math.round(lk.openSec) + ' / ' + Math.round(lk.inPlaySec) + '</td></tr>'
    + '<tr><td>Times opened</td><td class="num">' + lk.opens + '</td></tr>'
    + '<tr><td>Bad opens: seconds open while the ball was live (plays hit)</td><td class="num">' + (s.lockScore.unsafeWindows ? s.lockScore.badOpenSec + ' s (' + s.lockScore.badOpenPlays + ' of ' + s.lockScore.unsafeWindows + ' snaps)' : 'no snaps yet') + '</td></tr>'
    + '<tr><td>Seconds open with a line move in the next 10 s</td><td class="num">' + s.lockScore.movedNext10Sec + '</td></tr>'
    + '<tr><td>Picks past-posted through the lock</td><td class="num">' + picks.filter((p) => p.accepted && p.grade && p.grade.startsWith('past')).length + '</td></tr>'
    + '<tr><td>Starting rule (30 s, available) open share</td><td class="num">' + (lk.inPlaySec ? (100 * s.baseline.openSec / lk.inPlaySec).toFixed(1) + '%' : '-') + '  now ' + esc(s.baseline.state) + '</td></tr></table>'
    + '<div class="small" style="margin-top:6px">Opens only inside a known dead ball: a clock stopping play (window from its own stamp), or the first seconds after the odds feed clock jumps (a play just ended). Any lane clock moving after the stop, a TV snap tap, a price move in the last 10 s, an old odds reading or the line off all lock it.</div>';

  // stale box
  const by = s.stale.byReason;
  $('stalebox').innerHTML = s.lanes.rush ? '<table><tr><td>Windows</td><td class="num">' + s.stale.windows + '</td></tr><tr><td>Total seconds</td><td class="num">' + Math.round(s.stale.seconds) + '</td></tr>'
    + Object.entries(by).map(([k, v]) => '<tr><td>' + esc(k === 'price' ? 'Price did not match the odds feed' : k === 'clock' ? 'Behind the game clock' : k === 'score' ? 'Behind the score' : 'After a TV ' + k) + '</td><td class="num">' + Math.round(v) + ' s</td></tr>').join('')
    + '<tr><td>Now</td><td class="num ' + (s.stale.on ? 'bad' : 'ok') + '">' + (s.stale.on ? 'STALE ' + esc(s.stale.reason.join(', ')) : 'matches') + '</td></tr></table>' : '<div class="small">No Rush lane data yet.</div>';

  // pick test
  renderPickButtons(ls);
  const acc = picks.filter((p) => p.accepted);
  $('picktally').textContent = 'Attempts ' + picks.length + '  accepted ' + acc.length + '  clean ' + acc.filter((p) => p.grade === 'clean').length + '  past-posted ' + acc.filter((p) => p.grade && p.grade.startsWith('past')).length + '  moved after ' + acc.filter((p) => p.grade && p.grade.startsWith('moved')).length + '  grading ' + acc.filter((p) => !p.grade).length;
  $('picklog').innerHTML = picks.slice(0, 30).map((p) => '<li class="num">' + new Date(p.tMs).toLocaleTimeString('en-US', { timeZone: 'America/New_York' }) + '  ' + esc([p.team, p.market, p.side, p.shownLine, p.shownOdds].filter(Boolean).join(' ')) + '  <b class="' + (p.accepted ? 'ok' : 'bad') + '">' + (p.accepted ? 'accepted' : 'refused') + '</b>  ' + esc(p.reason) + (p.accepted ? '  <span class="' + (p.grade === 'clean' ? 'ok' : p.grade ? 'bad' : 'warn') + '">' + esc(p.grade || 'grading after 60 s') + '</span>' : '') + '</li>').join('');

  // baseline vs best
  let sv = '<tr><th>Kind</th><th>Rush median</th><th>Best raw</th><th>Saved</th></tr>';
  for (const k of KINDS) { const x = s.saved[k]; sv += '<tr><td>' + k + '</td><td class="num">' + f1(x.rush) + '</td><td class="num">' + (x.best ? esc(LANE_NAMES[x.best]) + ' ' + f1(x.bestMedian) : '-') + '</td><td class="num">' + (x.saved !== null ? f1(x.saved) + ' s' : 'no data yet') + '</td></tr>'; }
  $('saved').innerHTML = sv;
  let gp = '<tr><th>Lane</th><th>Read gap med / 90th / max</th><th>Over 8 s</th><th>Change gap med</th></tr>';
  for (const lane of ['sgo', 'rush', 'espn', 'fastcast']) {
    const L = s.lanes[lane];
    gp += '<tr><td>' + dot(lane) + esc(LANE_NAMES[lane]) + '</td>' + (L && L.gaps.n ? '<td class="num">' + f1(L.gaps.median) + ' / ' + f1(L.gaps.p90) + ' / ' + f1(L.gaps.worst) + '</td><td class="num">' + L.gapsOver8 + '</td><td class="num">' + f1(L.changeGaps.median) + '</td>' : '<td colspan="3" class="small">no data yet</td>') + '</tr>';
  }
  gp += '<tr><td>Rush engine passes</td>' + (s.rushGaps.n ? '<td class="num">' + f1(s.rushGaps.median) + ' / ' + f1(s.rushGaps.p90) + ' / ' + f1(s.rushGaps.worst) + '</td><td class="num">' + s.rushGaps.over9 + ' (9 s+)</td><td></td>' : '<td colspan="3" class="small">no data yet</td>') + '</tr>';
  $('gaps').innerHTML = gp;

  // TV
  const tv = s.tv;
  if (tv.taps) {
    const sc = s.lag.tv.score;
    $('tvbox').innerHTML = 'Taps ' + tv.taps + '. Score: TV median ' + f1(sc.median) + ' s behind the first lane (n' + sc.n + ')' + (s.leader.score === 'tv' ? ', TV is the fastest score lane' : '') + '. Snap taps against the score feed play stamp: median ' + f1(tv.snapVsStamp.median) + ' s (n' + tv.snapVsStamp.n + '; positive means the tap came after the stamp).';
  }

  // plays
  $('plays').innerHTML = s.plays.slice().reverse().map((p) => '<li class="num">' + (p.wall ? new Date(p.wall).toLocaleTimeString('en-US', { timeZone: 'America/New_York' }) : '-') + '  known +' + (p.wall ? f1((p.firstKnown - p.wall) / 1000) + ' s' : '-') + (p.stop ? '  <b>' + esc(p.stop.kind) + '</b>' : '') + '  ' + esc((p.text || '').slice(0, 120)) + '</li>').join('');

  renderLimits(s);
  renderVerdict(s);
}

function drawTrace(s, now) {
  const cv = $('trace'); const ctx = cv.getContext('2d');
  const w = cv.clientWidth || 900; const h = 180;
  if (cv.width !== w * devicePixelRatio) { cv.width = w * devicePixelRatio; cv.height = h * devicePixelRatio; }
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const cs = getComputedStyle(document.documentElement);
  const span = 600000; const t0 = now - span;
  const pts = s.trace.filter((p) => p.t >= t0);
  let ymax = 30;
  for (const p of pts) for (const v of Object.values(p.lags)) if (v !== null && v > ymax) ymax = Math.min(180, v);
  ctx.strokeStyle = cs.getPropertyValue('--line'); ctx.fillStyle = cs.getPropertyValue('--muted'); ctx.font = '11px system-ui';
  for (const y of [0, 15, 30, 60, 120]) { if (y > ymax) continue; const yy = h - 16 - (y / ymax) * (h - 24); ctx.beginPath(); ctx.moveTo(30, yy); ctx.lineTo(w, yy); ctx.stroke(); ctx.fillText(y + ' s', 0, yy + 4); }
  // lock band along the bottom
  for (const p of pts) { const x = 30 + ((p.t - t0) / span) * (w - 30); ctx.fillStyle = p.lock === 'OPEN' ? cs.getPropertyValue('--open') : p.lock === 'LOCKED' ? cs.getPropertyValue('--lock') : cs.getPropertyValue('--line'); ctx.fillRect(x, h - 8, Math.max(1, (w - 30) / 600), 6); }
  if (!pts.length) { ctx.fillStyle = cs.getPropertyValue('--muted'); ctx.fillText('No data yet', 40, h / 2); return; }
  for (const lane of ['sgo', 'rush', 'espn', 'fastcast']) {
    ctx.strokeStyle = cs.getPropertyValue('--' + lane); ctx.lineWidth = 2; ctx.beginPath(); let on = false;
    for (const p of pts) {
      const v = p.lags[lane]; if (v === null || v === undefined) { on = false; continue; }
      const x = 30 + ((p.t - t0) / span) * (w - 30); const y = h - 16 - (Math.min(v, ymax) / ymax) * (h - 24);
      if (on) ctx.lineTo(x, y); else ctx.moveTo(x, y); on = true;
    }
    ctx.stroke();
  }
  $('legend').innerHTML = ['sgo', 'rush', 'espn', 'fastcast'].map((l) => dot(l) + esc(LANE_NAMES[l])).join('  ') + '  bottom band: lock (green open, red locked)';
}

// Limits list: each limit, the fix, the in-game test, the result so far (live numbers fill in).
function renderVerdict(s) {
  const lines = [];
  const rc = s.lag.rush.clock; const rp = s.lag.rush.price; const rs = s.lag.rush.score;
  if (rc.n || rp.n) lines.push('Rush shows the game late: clock ' + f1(rc.median) + ' s at the median (worst ' + f1(rc.worst) + ' s), price ' + f1(rp.median) + ' s, score ' + f1(rs.median) + ' s behind the fastest lane; it held a stale pickable line ' + Math.round(s.stale.seconds) + ' s over ' + s.stale.windows + ' windows.');
  else lines.push('Rush lag: no in-play Rush readings yet.');
  const ls = s.lockScore; const lk = s.lock;
  if (lk.inPlaySec > 0) lines.push('The Blue lock would let players pick ' + (100 * lk.openSec / lk.inPlaySec).toFixed(1) + '% of live time, open ' + ls.badOpenSec + ' s while the ball was live (' + ls.badOpenPlays + ' of ' + ls.unsafeWindows + ' snaps); the 30 s starting rule would allow ' + (100 * s.baseline.openSec / lk.inPlaySec).toFixed(1) + '%.');
  else lines.push('Lock: the game is not live yet, nothing to grade.');
  const pl = s.plays.filter((p) => p.wall).map((p) => (p.firstKnown - p.wall) / 1000).sort((a, b) => a - b);
  const plMed = pl.length ? pl[Math.floor(pl.length / 2)] : null;
  lines.push('Still unsolved: no lane shows the snap itself' + (plMed !== null ? ', plays arrive ' + f1(plMed) + ' s after their stamp at the median' : '') + (s.tv.taps ? '' : ', and no TV taps yet to rank the TV') + '.');
  $('verdict').innerHTML = lines.map((l) => '<li>' + esc(l) + '</li>').join('');
}
function renderLimits(s) {
  const L = [
    ['Score feed (poll) publishes a play 30 to 80 s after its stamp (2026-11-05 replay)', 'Lock from the odds feed clock jump, not from plays', 'Compare play known-lag below against the odds feed clock lag', 'Score feed clock median ' + f1(s.lag.espn.clock.median) + ' s behind'],
    ['Rush reads every 5 s on top of engine passes with a 10 s hole each minute', 'Read the odds feed every 1 s in the engine and push to the app', 'Rush clock and price lag against the odds feed', 'Rush price median ' + f1(s.lag.rush.price.median) + ' s, engine gaps over 9 s: ' + s.rushGaps.over9],
    ['No lane shows a snap; the clock only moves after a play ends', 'TV snap taps and the push feed as the snap signal', 'TV snap tap against play stamp', s.tv.snapVsStamp.n ? 'median ' + f1(s.tv.snapVsStamp.median) + ' s' : 'no taps yet'],
    ['Ruler window length (8 s after a clock jump) fitted on 17 minutes of garbage time', 'Retune from the full game at each quarter break', 'Pick test past-posted count', picks.filter((p) => p.grade && p.grade.startsWith('past')).length + ' past-posted of ' + picks.filter((p) => p.accepted).length + ' accepted'],
    ['The book can move the line before its own score field (2026-11-05)', '10 s settle after any price, line or score move', 'Accepted picks with a move inside 10 s', picks.filter((p) => p.grade && p.grade.startsWith('moved')).length + ' moved'],
  ];
  $('limits').innerHTML = '<tr><th>Limit</th><th>Fix</th><th>Test</th><th>Result</th></tr>' + L.map((r) => '<tr>' + r.map((c) => '<td>' + esc(c) + '</td>').join('') + '</tr>').join('');
}

setInterval(() => { try { render(); } catch (e) { console.error(e); } }, 500);
render();
