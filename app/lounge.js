/* Lounge (Red, one product): one screen for the whole Field. The faces (rank and Stack) with your matchup, the game
 * that is on (swipe for others) with who is on each side and the next seal to break, then the room: the week's moments
 * and the talk as one thread, newest at the bottom, opening at the newest row. Hold or double-tap any row for a tapback
 * (one per player per row) or Reply; one composer docked at the bottom. Uses Blue's Rush.events() and Rush.matchup().
 * Honest view (Gold's honest.js, Rush.honest()): exactly 7 players, nothing generated.
 * Expert lines: nothing of value moves, no tap changes a Stack, no copy button, nothing before kickoff shows a sealed
 * pick's side, line, market or stake. */
(function () {
  'use strict';
  /* round two's guessing game and the retired fixed lines: clear what they left on this phone */
  ['rush-reads-v1', 'rush-reads-cards-v1', 'rush-field7', 'rush-lounge-rx-v1', 'rush-lounge-v1', 'rush-lounge-sent-v1', 'rush-lounge-inbox-v1', 'rush-lounge-talk-v1'].forEach(k => { try { localStorage.removeItem(k); } catch (e) {} });
  const $ = id => document.getElementById(id), esc = x => String(x == null ? '' : x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => Math.round(+n || 0).toLocaleString('en-US');
  const ls = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }, lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const honest = () => { try { if (window.Rush && typeof Rush.honest === 'function') return !!Rush.honest(); if (window.RushHonest) return !!RushHonest.on(); return localStorage.getItem('rush-field') === '7'; } catch (e) { return false; } };
  /* one face everywhere: the shell's colours and initials */
  const HUES = ['#3CC8FF', '#3DDC84', '#FFB020', '#FF7AB6', '#A78BFA', '#5EEAD4', '#F97316', '#FDE047'];
  const hue = n => { let h = 0; for (const c of String(n || '')) h = (h * 31 + c.charCodeAt(0)) >>> 0; return HUES[h % HUES.length]; };
  const ini = n => { const w = String(n || '?').replace(/[^A-Za-z0-9 _]/g, '').split(/[ _]+/).filter(Boolean); return ((w[0] || '?')[0] + (w[1] ? w[1][0] : (w[0] || '').slice(1, 2))).toUpperCase(); };
  const av = (n, s, ring) => `<span class="lg-av${ring ? ' ' + ring : ''}" style="width:${s}px;height:${s}px;min-width:${s}px;font-size:${Math.round(s * .38)}px;background:${hue(n)}">${esc(ini(n))}</span>`;
  const ago = ms => { const s = Math.max(0, Math.round((Date.now() - ms) / 1000)); return s < 60 ? 'now' : s < 3600 ? Math.floor(s / 60) + 'm' : s < 86400 ? Math.floor(s / 3600) + 'h' : Math.floor(s / 86400) + 'd'; };
  const clock = ms => (window.Rush && Rush.clock) ? Rush.clock(ms) : Math.ceil(ms / 60000) + 'm';
  const gname = g => g.away.abbr + ' at ' + g.home.abbr;
  const stk = r => r ? (r.stack != null ? +r.stack : 1000 + Math.round((r.units || 0) * 10)) : 1000;
  const prof = (r, inner) => `<a class="lg-p" href="player.html?u=${encodeURIComponent(r.me ? 'me' : r.id)}">${inner}</a>`;
  const ringOf = (r, F) => r.me ? 'me' : F.riv && r.id === F.riv.id ? 'riv' : '';
  const gameUrl = g => `game.html?league=${encodeURIComponent(g.league)}&id=${encodeURIComponent(g.id)}`;
  let STICK = true, PINNED = null;
  let games = (window.RW && RW.cached && RW.cached()) || [], BROKE = null, EARLIER = false, OPEN = new Set(), TRAY = null, REPLY = null, firstPaint = true;
  const Q = new URLSearchParams(location.search); let focus = Q.get('g') || null;

  /* ---------- the Field, and My circle as a filter on it ---------- */
  const SCOPE = 'rush-lounge-scope', circleOn = () => { try { return localStorage.getItem(SCOPE) === 'circle'; } catch (e) { return false; } };
  function circleIds() { let c = []; try { c = (window.Rush && typeof Rush.circle === 'function') ? Rush.circle() || [] : JSON.parse(localStorage.getItem('rush-circle')) || []; } catch (e) {}
    const ids = new Set(); (Array.isArray(c) ? c : []).forEach(x => { if (x == null || (typeof x === 'object' && x.confirmed === false)) return; ids.add(String(typeof x === 'object' ? x.id : x)); }); return ids; }
  function field() {
    let rows = []; try { rows = (window.Rush && Rush.field) ? Rush.field() : []; } catch (e) {}
    const blocked = ls('rush-blocked-v1', {}); rows = rows.filter(r => !blocked[r.id]);
    const me = rows.find(r => r.me), riv = (window.Rush && Rush.rival) ? Rush.rival() : null;
    let list = rows;
    if (honest()) { const others = rows.filter(r => !r.me && (!riv || r.id !== riv.id)); list = [me, riv && rows.find(r => r.id === riv.id), ...others].filter(Boolean).slice(0, 7); }
    list = list.slice().sort((a, b) => stk(b) - stk(a)); list.forEach((r, i) => { r.rk = i + 1; });
    return { list, me: list.find(r => r.me) || me, riv: riv && list.find(r => r.id === riv.id) };
  }
  function picksOf(r) {
    if (r.me) { try { return (Rush.picks({ week: Rush.week().id }) || []).filter(p => p.gameId).map(p => Object.assign({}, p, { g: games.find(g => String(g.id) === String(p.gameId)) })); } catch (e) { return []; } }
    try { return (RW.playerPicks(r.id, games) || []).filter(p => p.g); } catch (e) { return []; }
  }
  const sideOf = p => { const g = p.g, L = String(p.label || ''); if (!g) return null; if (/^over\b/i.test(L)) return 'Over'; if (/^under\b/i.test(L)) return 'Under'; if (L.startsWith(g.home.abbr + ' ')) return g.home.abbr; if (L.startsWith(g.away.abbr + ' ')) return g.away.abbr; return null; };
  const isStarted = g => g && (g.state !== 'pre' || +g.date <= Date.now());
  const onGame = (g, F) => { const rows = []; F.list.forEach(r => picksOf(r).filter(p => String(p.gameId) === String(g.id)).forEach(p => rows.push({ r, p, side: sideOf(p) }))); return rows; };
  const opposite = (a, b, g) => { if (!a || !b) return false; const team = s => s === g.home.abbr || s === g.away.abbr; return (team(a) && team(b)) || (!team(a) && !team(b)) ? a !== b : false; };

  /* ---------- the week's moments: Blue's source, mapped per player ---------- */
  function moments(F) {
    const out = [], who = p => F.list.find(x => p.me ? x.me : String(x.id) === String(p.id)) || null;
    const SIDE = (g, sd) => !g || !sd ? null : sd === 'home' ? g.home.abbr : sd === 'away' ? g.away.abbr : sd === 'over' ? 'Over' : sd === 'under' ? 'Under' : sd;
    if (window.Rush && typeof Rush.events === 'function') { try { (Rush.events() || []).forEach(e => { const g = games.find(x => String(x.id) === String(e.gameId)) || null, ps = e.players || []; if (!g) return;
      if (e.type === 'sealed') ps.forEach(p => { const r = who(p); if (r && !isStarted(g)) out.push({ t: 'sealed', at: e.at, r, g }); });
      else if (e.type === 'reveal') { const rows = ps.map(p => ({ r: who(p), side: SIDE(g, p.side), stake: p.stake })).filter(x => x.r); if (rows.length) out.push({ t: 'reveal', at: e.at || +g.date, g, rows }); }
      else if (e.type === 'settled') ps.forEach(p => { const r = who(p); if (r && (p.result === 'won' || p.result === 'lost')) out.push({ t: 'settled', at: e.at, r, g, won: p.result === 'won', change: +p.change || (p.result === 'won' ? 0 : -(+p.stake || 0)), label: p.label || '' }); }); }); } catch (e) {} }
    if (!out.length) F.list.forEach(r => picksOf(r).forEach(p => { const g = p.g; if (!g) return; if (!isStarted(g) && p.at) out.push({ t: 'sealed', at: p.at, r, g });
      if ((p.status === 'won' || p.status === 'lost')) out.push({ t: 'settled', at: p.settled || (+g.date + 3 * 36e5), r, g, won: p.status === 'won', change: p.status === 'won' ? +p.win || 0 : -(+p.stake || 0), label: p.label || '' }); }));
    return out.filter(m => Date.now() - m.at < 30 * 36e5);
  }
  /* fold the room: runs of picks become one row per player or per game */
  function fold(ms) {
    const rows = [], sealBy = {}, setBy = {};
    ms.sort((a, b) => a.at - b.at).forEach(m => {
      if (m.t === 'sealed') { const k = m.r.id; let row = sealBy[k]; if (!row || m.at - row.at > 3 * 36e5) { row = sealBy[k] = { t: 'sealed', key: 'sealed:' + k + ':' + Math.floor(m.at / 36e5), at: m.at, r: m.r, gs: [] }; rows.push(row); } if (!row.gs.some(g => g.id === m.g.id)) row.gs.push(m.g); row.at = Math.max(row.at, m.at); }
      else if (m.t === 'settled') { const k = m.g.league + m.g.id; let row = setBy[k]; if (!row) { row = setBy[k] = { t: 'settled', key: 'settled:' + k, at: m.at, g: m.g, items: [] }; rows.push(row); } row.items.push(m); row.at = Math.max(row.at, m.at); }
      else if (m.t === 'reveal') rows.push({ t: 'reveal', key: 'reveal:' + m.g.league + m.g.id, at: m.at, g: m.g, rows: m.rows });
    });
    return rows;
  }

  /* ---------- tapbacks (one per player per row) and talk ---------- */
  const TAPS = ['❤️', '👍', '👎', '😂', '❗', '❓'];
  const TK = 'rush-lounge-tap-v1', TALK = 'rush-lounge-talk-v2', SEEN = 'rush-lounge-seen';
  function badge(key, F) { const t = ls(TK, {})[key]; if (!t) return ''; return `<span class="lg-tb">${t.emoji || t}${F.me ? av(F.me.name, 16, 'me') : ''}<b>1</b></span>`; }

  /* ---------- render ---------- */
  function render() {
    const FF = field(), C = circleIds(), CIRCLE = circleOn(), now = Date.now();
    const F = CIRCLE ? { list: FF.list.filter(r => r.me || C.has(String(r.id))), me: FF.me, riv: FF.riv && C.has(String(FF.riv.id)) ? FF.riv : null } : FF;
    const mine = FF.me ? picksOf(FF.me) : [], mySide = g => { const p = mine.find(x => String(x.gameId) === String(g.id)); return p ? sideOf(p) : null; };
    let h = `<div class="lg-top"><h1>Lounge</h1><div class="lg-scope"><button class="${CIRCLE ? '' : 'on'}" data-scope="field">The Field</button><button class="${CIRCLE ? 'on' : ''}" data-scope="circle">My circle</button></div></div>`;
    /* your matchup: Blue's one lead figure */
    let M = null; try { M = (window.Rush && typeof Rush.matchup === 'function') ? Rush.matchup() : null; } catch (e) {}
    if (!M && FF.riv && FF.me) M = { me: { name: FF.me.name, stack: stk(FF.me) }, opp: { name: FF.riv.name, stack: stk(FF.riv) }, lead: stk(FF.me) - stk(FF.riv) };
    if (M && M.opp) { const d = +M.lead || 0; h += `<a class="lg-mu" href="ranks.html"><span>You <b>${fmt(M.me.stack)}</b></span><em class="${d > 0 ? 'up' : d < 0 ? 'dn' : ''}">${d > 0 ? 'lead ' + fmt(d) : d < 0 ? 'down ' + fmt(-d) : 'level'}</em><span><b>${fmt(M.opp.stack)}</b> ${esc(String(M.opp.name).split(' ')[0])}</span></a>`; }
    h += `<div class="lg-faces" id="lg-faces">${F.list.map(r => prof(r, `<span class="lg-face${r.me ? ' me' : F.riv && r.id === F.riv.id ? ' riv' : ''}" data-fid="${esc(r.id)}">${av(r.name, 34, ringOf(r, F))}<b>#${r.rk}</b><small>${esc(r.me ? 'You' : r.name.split(' ')[0])}</small><em data-st="${esc(r.id)}" data-v="${stk(r)}">${fmt(stk(r))}</em></span>`)).join('')}</div>`;
    if (CIRCLE && F.list.length < 3) { let sug = []; try { if (Rush.circleSuggest) sug = (Rush.circleSuggest(4) || []).map(x => FF.list.find(r => String(r.id) === String(x.id))).filter(Boolean); } catch (e) {} if (!sug.length) sug = FF.list.filter(r => !r.me && !C.has(String(r.id))).slice(0, 4);
      h += `<div class="lg-circle"><b>${F.list.length === 1 ? 'Your circle starts with you' : 'Your circle is ' + (F.list.length - 1) + ' so far'}</b><small>Friends you invite or add, once both of you confirm.</small><div class="lg-sug"><a class="lg-inv" href="index.html#invite"><span>+</span><small>Invite</small></a>${sug.map(r => `<a href="player.html?u=${encodeURIComponent(r.id)}#circle">${av(r.name, 36)}<small>${esc(r.name.split(' ')[0])}</small></a>`).join('')}</div></div>`; }
    /* the seal breaking, live */
    try { if (BROKE) { const rows = []; games.filter(g => +g.date === BROKE.k).forEach(g => onGame(g, F).forEach(x => rows.push(Object.assign(x, { g }))));
      if (rows.length) h += `<div class="lg-sb"><small>SEAL BROKEN</small><b>${esc([...new Set(rows.map(x => gname(x.g)))].join(', '))}</b>${rows.map(x => { const ms = mySide(x.g), tag = x.r.me ? 'you' : ms ? (opposite(ms, x.side, x.g) ? 'against you' : ms === x.side ? 'with you' : '') : ''; return `<div class="lg-flip">${prof(x.r, av(x.r.name, 32, ringOf(x.r, F)))}<span><b>${esc(x.r.me ? 'You' : x.r.name.split(' ')[0])} took ${esc(x.side || x.p.label)}</b><small>${fmt(x.p.stake)} Stack${tag ? ' &middot; ' + tag : ''}</small></span></div>`; }).join('')}<button class="lg-x" data-x="sb">Done</button></div>`; } } catch (err) { BROKE = null; }
    /* the game that is on (swipe for the others), the next seal as a chip on it */
    const held = {}; F.list.forEach(r => picksOf(r).forEach(p => { if (p.g && now - p.g.date < 5 * 36e5 && p.g.date - now < 30 * 36e5 && p.g.state !== 'post') held[p.g.league + ':' + p.g.id] = p.g; }));
    let gs = Object.values(held).sort((a, b) => ((b.state === 'in') - (a.state === 'in')) || (onGame(b, F).length - onGame(a, F).length) || a.date - b.date);
    if (focus) { const i = gs.findIndex(g => g.league + ':' + g.id === focus || String(g.id) === focus); if (i > 0) gs.unshift(gs.splice(i, 1)[0]); }
    gs = gs.slice(0, 6); PINNED = gs[0] ? gname(gs[0]) : null;
    { const ci = document.querySelector('#lg-say input'); if (ci && !REPLY) ci.placeholder = PINNED ? 'Say something about ' + PINNED : 'Say something to the Field'; }
    const next = Object.values(held).filter(g => !isStarted(g)).sort((a, b) => a.date - b.date)[0];
    h += `<div class="lg-games" id="lg-games">${gs.map(g => { const on = onGame(g, F), started = isStarted(g), ms = mySide(g), sides = {}; on.forEach(x => { (sides[x.side || '?'] = sides[x.side || '?'] || []).push(x); });
      const face = x => prof(x.r, av(x.r.name, 24, ringOf(x.r, F)));
      const body = !started ? `<div class="lg-gside"><small>${on.length} sealed &middot; sides open at kickoff</small><div class="lg-row">${on.map(face).join('')}</div></div>`
        : `<div class="lg-gsides">${Object.keys(sides).sort((a, b) => (b === ms) - (a === ms)).map(k => `<div class="lg-gside${ms ? (k === ms ? ' with' : opposite(ms, k, g) ? ' vs' : '') : ''}"><small>${ms ? (k === ms ? 'With you' : opposite(ms, k, g) ? 'Against you' : 'On') : 'On'} ${esc(k)}</small><div class="lg-row">${sides[k].map(face).join('')}</div></div>`).join('')}</div>`;
      return `<div class="lg-game${g.state === 'in' ? ' lg-on' : ''}"><a class="lg-sc" href="${gameUrl(g)}"><div><img alt="" src="${esc(g.away.logo)}"><b>${esc(g.away.abbr)}</b><strong data-sc="${esc(g.id)}a">${started && g.away.score != null ? esc(g.away.score) : ''}</strong></div><div class="lg-mid">${g.state === 'in' ? `<span class="lv"><i></i>${esc(g.detail || 'LIVE')}</span>` : `<span class="lk">SEALED <b data-k="${+g.date}">${clock(+g.date - now)}</b></span>`}</div><div><img alt="" src="${esc(g.home.logo)}"><b>${esc(g.home.abbr)}</b><strong data-sc="${esc(g.id)}h">${started && g.home.score != null ? esc(g.home.score) : ''}</strong></div></a>${body}${next && next !== g ? `<button class="lg-nx" data-g="${esc(next.league + ':' + next.id)}">Next seal ${esc(gname(next))} <b data-k="${+next.date}">${clock(+next.date - now)}</b></button>` : ''}</div>`; }).join('') || '<div class="lg-game"><div class="lg-mut">No games on the Board right now.</div></div>'}</div>${gs.length > 1 ? `<div class="lg-dots">${gs.map((g, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>` : ''}`;
    /* the room: moments and talk as one thread, newest at the bottom */
    const talk = ls(TALK, []).filter(m => !honest() || m.mine || m.real);
    const rows = fold(moments(F)).concat(talk.map(m => ({ t: 'talk', key: 'talk:' + m.id, at: m.at, m })));
    rows.sort((a, b) => a.at - b.at);
    const recent = rows.filter(r => r.t === 'talk' || (now - r.at < 6 * 36e5 && !(r.t === 'reveal' && r.g.state === 'post'))), older = rows.filter(r => !recent.includes(r));
    let show = recent.slice(-8); const hidden = older.length + Math.max(0, recent.length - 8);
    if (EARLIER) show = rows;
    const seen = +ls(SEEN, 0) || 0; let divided = false;
    h += `<div class="lg-room" id="lg-room">${hidden && !EARLIER ? `<button class="lg-fold" data-x="more">Earlier today &middot; ${hidden}</button>` : ''}${show.map(r => { let div = ''; if (seen && !divided && r.at > seen) { divided = true; div = '<div class="lg-new"><span>New since you left</span></div>'; } return div + row(r, F, mySide, seen); }).join('') || '<div class="lg-mut">The week shows here as it happens: Slips sealing, seals breaking, picks settling.</div>'}</div>`;
    const R0 = $('lg-room'), keep = R0 ? R0.scrollTop : 0;
    $('lg-main').innerHTML = h;
    $('lg-reply').innerHTML = REPLY ? `<span>Replying to <b>${esc(REPLY.who)}</b>: ${esc(REPLY.text)}</span><button data-x="noreply" aria-label="Cancel reply">&#10005;</button>` : ''; $('lg-reply').hidden = !REPLY;
    dock(); slideFaces(); tickScores(); bumpStacks();
    { const R1 = $('lg-room'); if (R1 && !firstPaint) R1.scrollTop = STICK ? R1.scrollHeight : keep; }
    if (firstPaint) { firstPaint = false; scrollTo(0, 0); requestAnimationFrame(() => { const R1 = $('lg-room'), d = document.querySelector('.lg-new'); if (!R1) return; if (d) { STICK = false; R1.scrollTop = Math.max(0, d.offsetTop - R1.offsetTop - 40); } else R1.scrollTop = R1.scrollHeight; }); }
  }
  function row(r, F, mySide, seen) {
    const fresh = r.at > seen && Date.now() - r.at < 15 * 60e3, b = badge(r.key, F), tb = TRAY === r.key ? tray(r.key) : '';
    if (r.t === 'talk') { const m = r.m; return `<div class="lg-msg${m.mine ? ' me' : ''}" data-row="${esc(r.key)}" data-who="${esc(m.who)}" data-txt="${esc(m.text)}">${m.mine ? '' : av(m.who, 28)}<div class="lg-bub">${m.quote ? `<q>${esc(m.quote)}</q>` : ''}${m.game ? `<i class="lg-on-g">on ${esc(m.game)}</i>` : ''}${esc(m.text)}${b}</div><time>${ago(m.at)}</time>${tb}</div>`; }
    if (r.t === 'sealed') { const n = r.gs.length; return `<div class="lg-sys" data-row="${esc(r.key)}" data-who="${esc(r.r.me ? 'You' : r.r.name)}" data-txt="sealed ${n === 1 ? 'a pick' : n + ' picks'}">${prof(r.r, av(r.r.name, 30, ringOf(r.r, F)))}<span><b>${esc(r.r.me ? 'You' : r.r.name.split(' ')[0])} sealed ${n === 1 ? 'a pick' : n + ' picks'}</b><small>${esc(r.gs.slice(0, 3).map(gname).join(', '))}${n > 3 ? ' +' + (n - 3) : ''}</small></span><time>${ago(r.at)}</time>${b}${tb}</div>`; }
    if (r.t === 'reveal') { const g = r.g, ms = mySide(g), ring = x => x.r.me ? 'me' : ms ? (opposite(ms, x.side, g) ? 'vs' : ms === x.side ? 'with' : '') : '';
      return `<div class="lg-sys lg-rvrow" data-row="${esc(r.key)}" data-kind="game" data-who="${esc(gname(g))}" data-txt="seal broken">${''}<a class="lg-rvl" href="${gameUrl(g)}"><span><small>SEAL BROKEN</small><b>${esc(gname(g))}</b> ${g.state === 'in' || g.state === 'post' ? `<em>${esc(g.away.score)}-${esc(g.home.score)}</em>` : ''}</span><span class="lg-row">${r.rows.slice(0, 7).map(x => av(x.r.name, 24, ring(x))).join('')}</span></a><time>${ago(r.at)}</time>${b}${tb}</div>`; }
    if (r.t === 'settled') { const open = OPEN.has(r.key), net = r.items.length === 1 ? r.items[0] : null;
      if (net) return `<div class="lg-sys" data-row="${esc(r.key)}" data-who="${esc(net.r.me ? 'You' : net.r.name)}" data-txt="${net.won ? 'hit' : 'missed'} on ${esc(gname(r.g))}">${prof(net.r, av(net.r.name, 30, ringOf(net.r, F)))}<span><b>${esc(net.r.me ? 'You' : net.r.name.split(' ')[0])} ${net.won ? 'hit' : 'missed'} on ${esc(gname(r.g))}</b><small>${esc(net.label)} &middot; ${ago(r.at)}</small></span><strong class="${net.won ? 'up' : 'dn'}${fresh ? ' count' : ''}" data-n="${Math.round(net.change)}">${net.change >= 0 ? '+' : '-'}${fmt(Math.abs(net.change))}</strong>${b}${tb}</div>`;
      return `<div class="lg-sys grp" data-row="${esc(r.key)}" data-kind="game" data-who="${esc(gname(r.g))}" data-txt="${r.items.length} picks settled"><button class="lg-grp" data-open="${esc(r.key)}"><span class="lg-row">${r.items.slice(0, 4).map(x => av(x.r.name, 24, x.won ? 'with' : 'vs')).join('')}</span><span><b>${r.items.length} picks settled on ${esc(gname(r.g))}</b><small>${open ? 'Tap to close' : 'Tap to open'} &middot; ${ago(r.at)}</small></span></button>${(() => { const big = r.items.slice().sort((p, q) => Math.abs(q.change) - Math.abs(p.change)).slice(0, 2); return `<div class="lg-mv">${big.map(x => `<strong class="${x.won ? 'up' : 'dn'}${fresh ? ' count' : ''}" data-n="${Math.round(x.change)}">${x.change >= 0 ? '+' : '-'}${fmt(Math.abs(x.change))}</strong>`).join('')}</div>`; })()}${b}${tb}</div>${open ? r.items.map(x => `<div class="lg-sys sub">${prof(x.r, av(x.r.name, 26, ringOf(x.r, F)))}<span><b>${esc(x.r.me ? 'You' : x.r.name.split(' ')[0])} ${x.won ? 'hit' : 'missed'}</b><small>${esc(x.label)}</small></span><strong class="${x.won ? 'up' : 'dn'}">${x.change >= 0 ? '+' : '-'}${fmt(Math.abs(x.change))}</strong></div>`).join('') : ''}`; }
    return '';
  }
  const tray = key => `<div class="lg-tray">${TAPS.map((t, i) => `<button data-tap="${i}" data-k="${esc(key)}">${t}</button>`).join('')}<button class="lg-rp" data-replyto="${esc(key)}">Reply</button></div>`;
  /* the composer sits above whatever fixed bars the shell shows */
  function dock() { const c = $('lg-say'); if (!c) return; let b = 0; ['rnav', 'rslip'].forEach(id => { const e = document.getElementById(id); if (e) { const q = e.getBoundingClientRect(); if (q.height > 0 && getComputedStyle(e).display !== 'none') b = Math.max(b, window.innerHeight - q.top); } }); c.style.bottom = b + 'px';
    const R = $('lg-room'), M = $('lg-main'); if (!R) return; const top = R.getBoundingClientRect().top + window.scrollY, avail = window.innerHeight - b - c.offsetHeight - top - 8;
    if (avail >= 180) { R.classList.add('pinned'); R.style.height = avail + 'px'; M.style.paddingBottom = '0px'; } else { R.classList.remove('pinned'); R.style.height = ''; M.style.paddingBottom = (c.offsetHeight + 24) + 'px'; } }
  /* a rank change is the faces row re-sorting: each face slides from where it was */
  let lastX = {};
  function slideFaces() { const wrap = $('lg-faces'); if (!wrap) return; const now = {}; wrap.querySelectorAll('[data-fid]').forEach(el => { const x = el.offsetLeft; now[el.dataset.fid] = x; const p = lastX[el.dataset.fid]; if (p != null && Math.abs(p - x) > 4) { el.style.transition = 'none'; el.style.transform = `translateX(${p - x}px)`; requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transition = 'transform .5s ease'; el.style.transform = ''; })); } }); lastX = now; }
  /* a pick settles: the player's Stack on the faces row bumps and counts to its new figure; their rank badge flashes if it moved */
  let lastSt = {}, lastRk = {};
  function bumpStacks() { const now = {}, rk = {}; document.querySelectorAll('[data-st]').forEach(el => { const id = el.dataset.st, v = +el.dataset.v; now[id] = v; const p = lastSt[id];
      if (p != null && p !== v) { const up = v > p, t0 = performance.now(); el.classList.remove('bump', 'up', 'dn'); void el.offsetWidth; el.classList.add('bump', up ? 'up' : 'dn');
        const step = t => { const k = Math.min(1, (t - t0) / 800); el.textContent = fmt(p + (v - p) * k); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); } });
    document.querySelectorAll('[data-fid]').forEach(el => { const id = el.dataset.fid, b = el.querySelector('b'), r = b ? b.textContent : ''; rk[id] = r; if (lastRk[id] && lastRk[id] !== r && b) { b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash'); } });
    lastSt = now; lastRk = rk; }
  /* a score that changed since the last paint ticks */
  let lastSc = {};
  function tickScores() { const now = {}; document.querySelectorAll('[data-sc]').forEach(el => { const k = el.dataset.sc, v = el.textContent; now[k] = v; if (lastSc[k] != null && lastSc[k] !== v && v !== '') { el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); } }); lastSc = now; }
  /* Stack moves count up on arrival */
  function countUp() { document.querySelectorAll('strong.count').forEach(el => { const n = +el.dataset.n, t0 = performance.now(); el.classList.remove('count'); const step = t => { const k = Math.min(1, (t - t0) / 700), v = Math.round(n * k); el.textContent = (n >= 0 ? '+' : '-') + fmt(Math.abs(v)); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }); }

  /* ---------- taps ---------- */
  let lastTap = { k: null, t: 0 }, press = null;
  const rowOf = t => t.closest('[data-row]');
  document.addEventListener('pointerdown', e => { const r = rowOf(e.target); if (!r || e.target.closest('a,input,.lg-tray,[data-scope],[data-x]')) return; press = setTimeout(() => { TRAY = r.dataset.row; render(); }, 450); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => document.addEventListener(ev, () => clearTimeout(press)));
  document.addEventListener('click', e => {
    const t = e.target;
    const tp = t.closest('[data-tap]'); if (tp) { const T = ls(TK, {}); const v = TAPS[+tp.dataset.tap], r = document.querySelector(`[data-row="${CSS.escape(tp.dataset.k)}"]`); if (T[tp.dataset.k] && (T[tp.dataset.k].emoji || T[tp.dataset.k]) === v) delete T[tp.dataset.k]; else T[tp.dataset.k] = r && r.dataset.kind === 'game' ? { emoji: v, to: '', about: r.dataset.who, at: Date.now() } : { emoji: v, to: r ? r.dataset.who : '', about: '', at: Date.now() }; lsSet(TK, T); TRAY = null; render(); return; }
    const rp = t.closest('[data-replyto]'); if (rp) { const r = document.querySelector(`[data-row="${CSS.escape(rp.dataset.replyto)}"]`); REPLY = { who: r ? r.dataset.who : '', text: r ? r.dataset.txt : '', game: !!(r && r.dataset.kind === 'game') }; TRAY = null; render(); const i = document.querySelector('#lg-say input'); if (i) i.focus(); return; }
    const op = t.closest('[data-open]'); if (op) { const r0 = rowOf(op), now0 = Date.now();
      /* a second tap on a folded row is the double-tap: undo the open, show the tray */
      if (r0 && lastTap.k === r0.dataset.row && now0 - lastTap.t < 350) { const k = op.dataset.open; OPEN.has(k) ? OPEN.delete(k) : OPEN.add(k); TRAY = r0.dataset.row; lastTap = { k: null, t: 0 }; render(); return; }
      if (r0) lastTap = { k: r0.dataset.row, t: now0 };
      const k = op.dataset.open; OPEN.has(k) ? OPEN.delete(k) : OPEN.add(k); render(); return; }
    const sc = t.closest('[data-scope]'); if (sc) { try { localStorage.setItem(SCOPE, sc.dataset.scope); } catch (z) {} render(); return; }
    const g = t.closest('[data-g]'); if (g) { focus = g.dataset.g; render(); const s = $('lg-games'); if (s) s.scrollTo({ left: 0, behavior: 'smooth' }); return; }
    const x = t.closest('[data-x]'); if (x) { const v = x.dataset.x; if (v === 'sb') BROKE = null; if (v === 'more') EARLIER = true; if (v === 'noreply') REPLY = null; render(); return; }
    /* double-tap a row: the tray */
    const r = rowOf(t); if (r && !t.closest('a')) { const now = Date.now(); if (lastTap.k === r.dataset.row && now - lastTap.t < 350) { TRAY = r.dataset.row; render(); lastTap = { k: null, t: 0 }; return; } lastTap = { k: r.dataset.row, t: now }; }
    if (TRAY && !t.closest('.lg-tray')) { TRAY = null; render(); }
  });
  document.addEventListener('submit', e => { if (!e.target.closest('#lg-say')) return; e.preventDefault(); const i = e.target.querySelector('input'), v = (i.value || '').trim(); if (!v) return; const L = ls(TALK, []); L.push({ id: String(Date.now()), mine: 1, who: 'You', text: v.slice(0, 160), quote: REPLY ? REPLY.who + ': ' + REPLY.text : '', to: REPLY && !REPLY.game ? REPLY.who : '', game: REPLY ? (REPLY.game ? REPLY.who : '') : (PINNED || ''), at: Date.now() }); lsSet(TALK, L.slice(-60)); i.value = ''; REPLY = null; render(); STICK = true; requestAnimationFrame(() => { const R1 = $('lg-room'); if (R1) R1.scrollTop = R1.scrollHeight; }); });
  /* the swipe dots follow the game card in view */
  document.addEventListener('scroll', e => { const s = e.target; if (s && s.id === 'lg-room') STICK = s.scrollHeight - s.scrollTop - s.clientHeight < 40; if (s && s.id === 'lg-games') { const i = Math.round(s.scrollLeft / s.clientWidth); document.querySelectorAll('.lg-dots i').forEach((d, j) => d.classList.toggle('on', i === j)); } }, true);
  window.addEventListener('resize', dock);
  /* remember where you left off: the next visit opens at the unread divider */
  const leave = () => lsSet(SEEN, Date.now()); window.addEventListener('pagehide', leave); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') leave(); });

  /* the clock: countdowns tick, relative times refresh, and when a kickoff passes the seal breaks in front of you */
  const OPENED = Date.now(), BROKEN = new Set();
  setInterval(() => { const n = Date.now(); let hit = 0; document.querySelectorAll('[data-k]').forEach(el => { const k = +el.dataset.k; if (k > n) el.textContent = clock(k - n); else if (k > OPENED && !BROKEN.has(k)) { hit = k; BROKEN.add(k); } }); if (hit) { BROKE = { k: hit }; render(); scrollTo(0, 0); } }, 1000);
  render(); countUp();
  const load = () => (window.RW && RW.load ? RW.load(true) : Promise.resolve(games)).then(g => { games = g || games; if (!TRAY) { render(); countUp(); } }).catch(() => {});
  load(); setInterval(load, 30000);
  if (window.Rush && Rush.on) Rush.on(() => { if (!TRAY) render(); });
  if (window.Rush && typeof Rush.onEvent === 'function') Rush.onEvent(() => { if (!TRAY) { render(); countUp(); } });
})();
