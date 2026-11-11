/* Lounge (Red, one product): the one place. The game that is on with who is with you and against you, the kickoff
 * reveal as a moment, the Field's week moving with a face on every event, one-tap actions that land on a named player
 * who answers in one tap, and talk on top. Reads Blue's Rush.events when it exists, else derives events from the
 * week's games and picks. Honest view (?field=7 or the footer switch): exactly 7 players, nothing generated.
 * Expert lines: nothing of value moves, no tap changes a Stack, no copy button, nothing before kickoff shows a sealed
 * pick's side, line, market or stake (sealed events name only the player, the game and the kickoff). */
(function () {
  'use strict';
  const $ = id => document.getElementById(id), esc = x => String(x == null ? '' : x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => Math.round(+n || 0).toLocaleString('en-US');
  const h01 = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
  const ls = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }, lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const Q = new URLSearchParams(location.search);
  /* the honest view: Blue's Rush.honest(), Gold's honest.js (key 'rush-field', footer toggle on every page) */
  const honest = () => { try { if (window.Rush && typeof Rush.honest === 'function') return !!Rush.honest(); if (window.RushHonest) return !!RushHonest.on(); return localStorage.getItem('rush-field') === '7'; } catch (e) { return false; } };
  const AVC = ['#0EA5E9', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#64748B', '#14B8A6', '#F97316'];
  const av = (n, s, ring) => { const ini = String(n || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(); return `<span class="lg-av${ring ? ' ' + ring : ''}" style="width:${s}px;height:${s}px;font-size:${Math.round(s * .38)}px;background:${AVC[Math.floor(h01(n) * AVC.length)]}">${esc(ini)}</span>`; };
  const when = ms => { const d = new Date(ms), t = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); return d.toDateString() === new Date().toDateString() ? t : d.toLocaleDateString([], { weekday: 'short' }) + ' ' + t; };
  const clock = ms => (window.Rush && Rush.clock) ? Rush.clock(ms) : Math.ceil(ms / 60000) + 'm';
  const gname = g => g.away.abbr + ' at ' + g.home.abbr;
  const prof = (r, inner) => `<a class="lg-p" href="player.html?u=${encodeURIComponent(r.me ? 'me' : r.id)}">${inner}</a>`;
  let games = (window.RW && RW.cached && RW.cached()) || [], focus = Q.get('g') || null, BROKE = null, talkOpen = null;

  /* ---------- the Field this page shows ---------- */
  function field() {
    let rows = [];
    try { rows = (window.Rush && Rush.field) ? Rush.field() : []; } catch (e) {}
    const blocked = ls('rush-blocked-v1', {});
    rows = rows.filter(r => !blocked[r.id]);
    const me = rows.find(r => r.me), riv = (window.Rush && Rush.rival) ? Rush.rival() : null;
    let list = rows;
    if (honest()) {
      const others = rows.filter(r => !r.me && (!riv || r.id !== riv.id));
      list = [me, riv && rows.find(r => r.id === riv.id), ...others].filter(Boolean).slice(0, 7);
    }
    list = list.slice().sort((a, b) => (b.units || 0) - (a.units || 0));
    list.forEach((r, i) => { r.rk = i + 1; });
    return { list, me: list.find(r => r.me) || me, riv: riv && list.find(r => r.id === riv.id) };
  }
  /* a player's picks: mine from the store, everyone else's from the engine's stand-in Field */
  function picksOf(r) {
    if (r.me) { try { return (Rush.picks({ week: Rush.week().id }) || []).filter(p => p.gameId).map(p => Object.assign({}, p, { g: games.find(g => String(g.id) === String(p.gameId)) })); } catch (e) { return []; } }
    try { return (RW.playerPicks(r.id, games) || []).filter(p => p.g); } catch (e) { return []; }
  }
  const sideOf = p => { const g = p.g, L = String(p.label || ''); if (!g) return null; if (/^over\b/i.test(L)) return 'Over'; if (/^under\b/i.test(L)) return 'Under'; if (L.startsWith(g.home.abbr + ' ')) return g.home.abbr; if (L.startsWith(g.away.abbr + ' ')) return g.away.abbr; return null; };
  const isStarted = g => g && (g.state !== 'pre' || +g.date <= Date.now());
  /* who is on this game, and against whom (only after kickoff; before it, just who) */
  function onGame(g, F) {
    const rows = [];
    F.list.forEach(r => picksOf(r).filter(p => String(p.gameId) === String(g.id)).forEach(p => rows.push({ r, p, side: sideOf(p) })));
    return rows;
  }
  const opposite = (a, b, g) => { if (!a || !b) return false; const team = s => s === g.home.abbr || s === g.away.abbr; if (team(a) && team(b)) return a !== b; if (!team(a) && !team(b)) return a !== b; return false; };

  /* ---------- events: Blue's source first, else derived ---------- */
  function events(F) {
    if (window.Rush && typeof Rush.events === 'function') { try { const T = { sealed: 'sealed', reveal: 'revealed', settled: 'settled', rank: 'rank', lead: 'matchup', play: 'play' };
      const ev = (Rush.events() || []).map(e => { const p0 = (e.players || [])[0] || {}, r = F.list.find(x => String(x.id) === String(p0.id)) || (p0.name ? { id: p0.id, name: p0.name } : null), g = games.find(x => String(x.id) === String(e.gameId)) || null;
        return { type: T[e.type] || e.type, at: e.at, r, g, side: e.side || p0.side, text: e.text, p: { stake: p0.stake, label: p0.label || e.side || '', status: p0.result === 'won' || p0.result === 'lost' ? p0.result : e.result, win: p0.change, t: e.id }, from: e.from, to: e.to, lead: e.lead, src: 1 }; })
        .filter(e => e.type === 'play' ? e.g : (e.r && (e.type === 'rank' || e.type === 'matchup' || e.g)));
      if (ev.length) return ev.concat(BIG).sort((a, b) => b.at - a.at).slice(0, 40); } catch (e) {} }
    const out = [], now = Date.now();
    F.list.forEach(r => picksOf(r).forEach(p => {
      const g = p.g; if (!g) return;
      if (!isStarted(g) && p.at && now - p.at < 36 * 36e5) out.push({ type: 'sealed', at: p.at, r, g, p });
      if (isStarted(g) && now - g.date < 12 * 36e5) out.push({ type: 'revealed', at: +g.date, r, g, p, side: sideOf(p) });
      if ((p.status === 'won' || p.status === 'lost') && now - (p.settled || g.date) < 36 * 36e5) out.push({ type: 'settled', at: p.settled || (+g.date + 3 * 36e5), r, g, p });
    }));
    /* rank moves since this phone last looked */
    const last = ls('rush-lounge-ranks-' + (honest() ? '7' : 'all'), {}), nowR = {};
    F.list.forEach(r => { nowR[r.id] = r.rk; if (last[r.id] && last[r.id] !== r.rk && !r.me) out.push({ type: 'rank', at: now - 1, r, from: last[r.id], to: r.rk }); });
    lsSet('rush-lounge-ranks-' + (honest() ? '7' : 'all'), nowR);
    if (F.riv && F.me) { const d = (F.riv.units || 0) - (F.me.units || 0); if (d !== 0) out.push({ type: 'matchup', at: now - 2, r: F.riv, lead: d * 10 }); }
    BIG.forEach(b => out.push(b));
    return out.sort((a, b) => b.at - a.at).slice(0, 40);
  }
  /* one sealed card per player: who sealed, on which games; the matchup opponent's events lead */
  function group(list, F) {
    const seal = {}, out = [];
    list.forEach(e => { if (e.type === 'sealed' && e.r) { const k = e.r.id; if (!seal[k]) { seal[k] = { type: 'sealed', r: e.r, at: e.at, gs: [], g: e.g, p: e.p }; out.push(seal[k]); } const s0 = seal[k]; if (e.g && !s0.gs.some(g => g.id === e.g.id)) s0.gs.push(e.g); s0.at = Math.max(s0.at, e.at); } else out.push(e); });
    out.forEach(e => { if (e.gs) e.gs.sort((a, b) => a.date - b.date); });
    const riv = F.riv && F.riv.id, day = 864e5;
    return out.sort((a, b) => ((b.r && b.r.id === riv && Date.now() - b.at < day) - (a.r && a.r.id === riv && Date.now() - a.at < day)) || b.at - a.at).slice(0, 30);
  }
  /* big plays: score changes in the games the Field holds, seen by this page */
  const BIG = [], lastScore = {};
  function watchScores() {
    games.filter(g => g.state === 'in').forEach(g => { const k = g.league + g.id, s = (g.away.score || 0) + '-' + (g.home.score || 0);
      if (lastScore[k] && lastScore[k] !== s) { const [a0, h0] = lastScore[k].split('-').map(Number), team = (g.away.score || 0) > a0 ? g.away.abbr : g.home.abbr; BIG.unshift({ type: 'play', at: Date.now(), g, text: `${team} scored. ${g.away.abbr} ${g.away.score}, ${g.home.abbr} ${g.home.score}, ${g.detail || ''}` }); BIG.splice(8); }
      lastScore[k] = s; });
  }

  /* ---------- person to person: fixed taps, every one lands on a named player who answers in one tap ---------- */
  const ACT = {
    sealed: [['watching', 'Watching this one'], ['luck', 'Good luck']],
    revealed_against: [['bringit', 'Bring it']], revealed_with: [['riding', 'Riding with you']], revealed: [['bold', 'Bold call']],
    settled_won: [['nice', 'Nice hit']], settled_lost: [['tough', 'Tough beat']],
    rank: [['coming', 'Coming for you']], matchup: [['yourmove', 'Your move']]
  };
  const ANSWER = { watching: 'Watch this', luck: 'Thanks', bringit: "You're on", riding: "Let's ride", bold: 'We will see', nice: 'Your turn next', tough: 'Next one hits', coming: 'Catch me', yourmove: 'Watch me' };
  const SENT = 'rush-lounge-sent-v1';
  const evKey = e => e.type === 'sealed' ? ['sealed', e.r ? e.r.id : '', new Date().toDateString()].join('|') : [e.type, e.r ? e.r.id : '', e.g ? e.g.id : '', e.p ? (e.p.t || e.p.market || '') : '', e.to || ''].join('|');
  function actsFor(e, mySide) {
    if (e.type === 'revealed') return mySide ? (opposite(mySide, e.side, e.g) ? ACT.revealed_against : mySide === e.side ? ACT.revealed_with : ACT.revealed) : ACT.revealed;
    if (e.type === 'settled') return e.p.status === 'won' ? ACT.settled_won : ACT.settled_lost;
    return ACT[e.type] || [];
  }
  function answered(k, s) { if (!s) return ''; const ans = s.ans; return `<div class="lg-sent"><span>You: ${esc(s.label)}</span>${ans ? `<b>${esc(ans.who)}: ${esc(ans.text)}</b>` : `<i>${honest() ? 'Sent. They see it here and answer in one tap.' : 'Sent'}</i>`}</div>`; }

  /* ---------- render ---------- */
  function render() {
    const F = field(), now = Date.now(), sent = ls(SENT, {}), talk = ls('rush-lounge-talk-v1', {});
    const mine = F.me ? picksOf(F.me) : [];
    const mySide = g => { const p = mine.find(x => String(x.gameId) === String(g.id)); return p ? sideOf(p) : null; };
    /* the games the Field holds tonight and tomorrow */
    const held = {}; F.list.forEach(r => picksOf(r).forEach(p => { if (p.g && now - p.g.date < 5 * 36e5 && p.g.date - now < 36 * 36e5) held[p.g.league + ':' + p.g.id] = p.g; }));
    const gs = Object.values(held).sort((a, b) => (a.state === 'in' ? -1 : 0) - (b.state === 'in' ? -1 : 0) || a.date - b.date);
    let g0 = focus ? gs.find(g => g.league + ':' + g.id === focus) : null;
    if (!g0) g0 = gs.filter(g => g.state === 'in').sort((a, b) => onGame(b, F).length - onGame(a, F).length)[0] || gs.find(g => !isStarted(g));
    let h = `<div class="lg-top"><h1>Lounge</h1><span>${honest() ? '7 players' : F.list.length + ' in the Field'}</span></div>`;
    /* the field in faces, ranked by Stack (1 to 7 in the honest view) */
    h += `<div class="lg-faces">${F.list.map(r => prof(r, `<span class="lg-face${r.me ? ' me' : F.riv && r.id === F.riv.id ? ' riv' : ''}">${av(r.name, 44)}<b>#${r.rk}</b><small>${esc(r.me ? 'You' : r.name.split(' ')[0])}</small></span>`)).join('')}</div>`;
    /* the seal-broken moment */
    if (BROKE) { const ps = gs.filter(g => +g.date === BROKE.k); const rows = ps.flatMap(g => onGame(g, F).map(x => Object.assign(x, { g })));
      if (rows.length) h += `<div class="lg-sb"><small>SEAL BROKEN</small><b>${esc(ps.map(gname).join(', '))}</b>${rows.map(x => { const ms = mySide(x.g), tag = x.r.me ? 'you' : ms ? (opposite(ms, x.side, x.g) ? 'against you' : ms === x.side ? 'with you' : '') : ''; return `<div class="lg-flip">${prof(x.r, av(x.r.name, 36, x.r.me ? 'me' : F.riv && x.r.id === F.riv.id ? 'riv' : ''))}<span><b>${esc(x.r.me ? 'You' : x.r.name)} took ${esc(x.side || x.p.label)}</b><small>${esc(gname(x.g))}, ${fmt(x.p.stake)} Stack${tag ? ' &middot; ' + tag : ''}</small></span></div>`; }).join('')}<button class="lg-x" data-x="sb">Done</button></div>`; }
    /* the game that is on */
    if (g0) {
      const on = onGame(g0, F), started = isStarted(g0), ms = mySide(g0);
      h += `<div class="lg-chips">${gs.slice(0, 8).map(g => `<button class="${g === g0 ? 'on' : ''}" data-g="${esc(g.league + ':' + g.id)}">${g.state === 'in' ? '<i></i>' : ''}${esc(gname(g))}</button>`).join('')}</div>`;
      h += `<div class="lg-game${g0.state === 'in' ? ' lg-on' : ''}"><div class="lg-sc"><div><img alt="" src="${esc(g0.away.logo)}"><b>${esc(g0.away.abbr)}</b><strong>${started && g0.away.score != null ? esc(g0.away.score) : ''}</strong></div><div class="lg-mid">${g0.state === 'in' ? `<span class="lv">LIVE</span><small>${esc(g0.detail || '')}</small>` : g0.state === 'post' ? '<span class="fin">FINAL</span>' : `<span class="lk">SEALED</span><small>breaks in <b data-k="${+g0.date}">${clock(+g0.date - now)}</b></small>`}</div><div><img alt="" src="${esc(g0.home.logo)}"><b>${esc(g0.home.abbr)}</b><strong>${started && g0.home.score != null ? esc(g0.home.score) : ''}</strong></div></div>`;
      if (!started) h += `<div class="lg-who"><small>${on.length} ${on.length === 1 ? 'pick' : 'picks'} sealed on this game. Sides open at ${when(+g0.date)}.</small><div class="lg-row">${on.map(x => prof(x.r, av(x.r.name, 34, x.r.me ? 'me' : F.riv && x.r.id === F.riv.id ? 'riv' : ''))).join('') || '<span class="lg-mut">Nobody in this view has picked it yet.</span>'}</div>${ms ? '' : `<a class="lg-cta" href="game.html?league=${esc(g0.league)}&id=${encodeURIComponent(g0.id)}">Make a pick before it seals</a>`}</div>`;
      else { const groups = {}; on.forEach(x => { (groups[x.side || 'Other'] = groups[x.side || 'Other'] || []).push(x); });
        const keys = Object.keys(groups).sort((a, b) => (b === ms) - (a === ms));
        h += `<div class="lg-sides">${keys.map(k => `<div class="lg-side${ms ? (k === ms ? ' with' : opposite(ms, k, g0) ? ' vs' : '') : ''}"><small>${ms ? (k === ms ? 'WITH YOU ON ' : opposite(ms, k, g0) ? 'AGAINST YOU ON ' : 'ON ') : 'ON '}${esc(k.toUpperCase())}</small><div class="lg-row">${groups[k].map(x => prof(x.r, av(x.r.name, 34, x.r.me ? 'me' : F.riv && x.r.id === F.riv.id ? 'riv' : ''))).join('')}</div></div>`).join('') || '<span class="lg-mut">Nobody in this view holds a pick on this game.</span>'}</div>`;
        const plays = BIG.filter(b => b.g && b.g.id === g0.id).slice(0, 3); if (plays.length) h += `<div class="lg-plays">${plays.map(b => `<div>${esc(b.text)}</div>`).join('')}</div>`; }
      const gt = (talk['g:' + g0.league + ':' + g0.id] || []).slice(-3);
      h += `${gt.map(t => `<div class="lg-line"><b>${esc(t.who)}</b> ${esc(t.text)}</div>`).join('')}${talkOpen === 'g:' + g0.league + ':' + g0.id ? `<form class="lg-say" data-say="g:${esc(g0.league + ':' + g0.id)}"><input maxlength="120" placeholder="Say something about ${esc(gname(g0))}" autocomplete="off"><button>Post</button></form>` : `<button class="lg-talk" data-talk="g:${esc(g0.league + ':' + g0.id)}">Say something about this game</button>`}</div>`;
    }
    /* next seal to break, with a live clock */
    const next = gs.filter(g => !isStarted(g)).sort((a, b) => a.date - b.date)[0];
    if (next && next !== g0) h += `<button class="lg-next" data-g="${esc(next.league + ':' + next.id)}"><span><small>NEXT SEAL BREAKS</small><b>${esc(gname(next))}</b></span><b data-k="${+next.date}">${clock(+next.date - now)}</b></button>`;
    /* sent to you */
    const inbox = ls('rush-lounge-inbox-v1', []);
    h += `<div class="lg-sh"><h2>Sent to you</h2></div>${inbox.length ? inbox.slice(-4).reverse().map(m => `<div class="lg-ev">${av(m.who, 36)}<div><b>${esc(m.who)}: ${esc(m.text)}</b><small>${esc(m.about || '')}</small>${m.ans ? `<div class="lg-sent"><span>You: ${esc(m.ans)}</span></div>` : `<div class="lg-acts"><button data-reply="${esc(m.id)}">${esc(ANSWER[m.k] || 'Thanks')}</button></div>`}</div></div>`).join('') : `<div class="lg-empty">${honest() ? 'Nothing yet. When a player taps you, it lands here and you answer in one tap.' : 'Nothing yet.'}</div>`}`;
    /* the Field's week moving */
    const ev = group(events(F), F);
    h += `<div class="lg-sh"><h2>The Field this week</h2></div>`;
    h += ev.length ? ev.map(e => {
      const k = evKey(e), s = sent[k], r = e.r; let line = '', sub = '';
      if (e.src && e.text && e.type !== 'sealed' && e.type !== 'revealed' && e.type !== 'settled') { line = e.text; sub = ''; }
      else if (e.type === 'sealed') { const n = (e.gs || [e.g]).length; line = `${r.me ? 'You' : r.name} sealed ${n === 1 ? 'a pick on ' + gname(e.g) : n + ' picks'}`; sub = n === 1 ? `Sides open at ${when(+e.g.date)}` : (e.gs || []).slice(0, 4).map(g => gname(g) + ' ' + when(+g.date)).join(', ') + (n > 4 ? ', +' + (n - 4) : ''); }
      else if (e.type === 'revealed') { const ms = mySide(e.g); line = `${r.me ? 'You' : r.name} took ${e.side || e.p.label} in ${gname(e.g)}`; sub = `${fmt(e.p.stake)} Stack${ms && !r.me ? (opposite(ms, e.side, e.g) ? ', against you' : ms === e.side ? ', with you' : '') : ''}`; }
      else if (e.type === 'settled') { line = `${r.me ? 'Your' : r.name + "'s"} ${gname(e.g)} pick ${e.p.status === 'won' ? 'hit' : 'missed'}`; sub = `${e.p.label}, ${e.p.status === 'won' ? '+' + fmt(e.p.win || 0) : '-' + fmt(e.p.stake)} Stack`; }
      else if (e.type === 'rank') { line = `${r.name} moved ${e.to < e.from ? 'up' : 'down'} to #${e.to}`; sub = `from #${e.from} in Ranks`; }
      else if (e.type === 'matchup') { line = e.lead > 0 ? `${r.name} leads your matchup by ${fmt(e.lead)}` : `You lead ${r.name} by ${fmt(-e.lead)}`; sub = 'Higher Stack on Monday night takes it'; }
      else if (e.type === 'play') return `<div class="lg-ev lg-play"><span class="lg-bolt">&#9679;</span><div><b>${esc(e.text)}</b><small>${esc(gname(e.g))}</small></div></div>`;
      const acts = r && !r.me ? actsFor(e, e.g ? mySide(e.g) : null) : [];
      return `<div class="lg-ev${r && F.riv && r.id === F.riv.id ? ' riv' : ''}">${r ? prof(r, av(r.name, 40, r.me ? 'me' : F.riv && r.id === F.riv.id ? 'riv' : '')) : ''}<div><b>${esc(line)}</b><small>${esc(sub)}${e.at && e.type !== 'sealed' ? ' &middot; ' + when(e.at) : ''}</small>${s ? answered(k, s) : acts.length ? `<div class="lg-acts">${acts.map(([a, l]) => `<button data-act="${esc(a)}" data-k="${esc(k)}" data-who="${esc(r.name)}" data-l="${esc(l)}">${esc(l)}</button>`).join('')}</div>` : ''}</div></div>`;
    }).join('') : `<div class="lg-empty">The Field's week shows here: picks sealing, seals breaking, picks settling, Ranks moving.</div>`;
    /* the honest-view footer is Gold's honest.js, the same on every page */
    $('lg-main').innerHTML = h;
  }

  /* ---------- taps ---------- */
  document.addEventListener('click', e => {
    const t = e.target;
    const a = t.closest('[data-act]');
    if (a) { const S = ls(SENT, {}); S[a.dataset.k] = { k: a.dataset.act, label: a.dataset.l, to: a.dataset.who, at: Date.now() }; lsSet(SENT, S); render();
      /* only the full stand-in view answers for the stand-ins; the honest view waits for a real player */
      if (!honest()) setTimeout(() => { const S2 = ls(SENT, {}); if (S2[a.dataset.k]) { S2[a.dataset.k].ans = { who: a.dataset.who.split(' ')[0], text: ANSWER[a.dataset.act] || 'Thanks' }; lsSet(SENT, S2); render(); } }, 2500 + h01(a.dataset.k) * 2000);
      return; }
    const rp = t.closest('[data-reply]'); if (rp) { const I = ls('rush-lounge-inbox-v1', []), m = I.find(x => x.id === rp.dataset.reply); if (m) { m.ans = rp.textContent; lsSet('rush-lounge-inbox-v1', I); render(); } return; }
    const g = t.closest('[data-g]'); if (g) { focus = g.dataset.g; render(); scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const tk = t.closest('[data-talk]'); if (tk) { talkOpen = tk.dataset.talk; render(); const i = document.querySelector('.lg-say input'); if (i) i.focus(); return; }
    const x = t.closest('[data-x]'); if (x) { if (x.dataset.x === 'sb') BROKE = null; render(); return; }
  });
  document.addEventListener('submit', e => { const f = e.target.closest('[data-say]'); if (!f) return; e.preventDefault(); const i = f.querySelector('input'), v = (i.value || '').trim(); if (!v) return; const T = ls('rush-lounge-talk-v1', {}); (T[f.dataset.say] = T[f.dataset.say] || []).push({ who: 'You', text: v.slice(0, 120), at: Date.now() }); lsSet('rush-lounge-talk-v1', T); talkOpen = null; render(); });

  /* full stand-in view only: now and then a stand-in taps you, so the "Sent to you" answer loop can be tried */
  function standIns() { if (honest()) return; const I = ls('rush-lounge-inbox-v1', []); if (I.length && Date.now() - I[I.length - 1].at < 10 * 60e3) return; const F = field(), r = F.riv || F.list.find(x => !x.me); if (!r) return; const opts = [['yourmove', 'Your move'], ['watching', 'Watching your picks'], ['coming', 'Coming for you']], o = opts[Math.floor(h01(r.id + Date.now() / 6e5) * opts.length)]; I.push({ id: String(Date.now()), who: r.name, k: o[0] === 'yourmove' ? 'yourmove' : o[0], text: o[1], about: F.riv && r.id === F.riv.id ? 'Your matchup' : '', at: Date.now() }); lsSet('rush-lounge-inbox-v1', I.slice(-20)); render(); }

  /* the clock: countdowns tick, and when a kickoff passes with the page open the seal breaks in front of you */
  setInterval(() => { const n = Date.now(); let hit = 0; document.querySelectorAll('[data-k]').forEach(el => { const k = +el.dataset.k; if (k > n) el.textContent = clock(k - n); else if (k > n - 5000) hit = k; }); if (hit && (!BROKE || BROKE.k !== hit)) { BROKE = { k: hit }; render(); scrollTo({ top: 0, behavior: 'smooth' }); } }, 1000);
  render();
  const load = () => (window.RW && RW.load ? RW.load(true) : Promise.resolve(games)).then(g => { games = g || games; watchScores(); render(); }).catch(() => {});
  load(); setInterval(load, 30000); setTimeout(standIns, 4000);
  if (window.Rush && Rush.on) Rush.on(() => render());
  if (window.Rush && typeof Rush.onEvent === 'function') Rush.onEvent(() => render());
})();
