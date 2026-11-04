/* Rush Crews (Blue, Phase 3): a crew boosts every member's Prize Multiplier by its size while it is alive.
 *
 * The rules (Rush.crew.RULES, the same numbers the simulation in teams/blue/sim uses):
 *  - Boost: +0.1x per crewmate (members minus you), up to +1.0x at 11 crewmates. A crew holds 12.
 *  - Alive: at least 3 members and the timer running. Below 3, or at zero, the boost is 0 for everyone.
 *  - The timer: every new member restarts it. Someone new to Rush (not yet in this week's Field) buys 7 days;
 *    a player already in the Field moving in buys 48 hours. (First design was 72 and 24 hours; the simulation in
 *    teams/blue/sim showed this cohort recruits too slowly for that: crews sat cold most weeks.) The timer never runs backwards: a join only ever extends it.
 *  - At zero the crew goes cold: members stay, the boost is gone until someone new joins, then it is back in full.
 *  - The boost that counts is the one you hold when the week settles (Tuesday 4 AM ET); the countdown is the reason to act.
 *  - One crew per player per week: leaving locks you out of joining another until the next week.
 *
 * Prototype on one device: the crew lives in this browser (rush-crew-v1). Crewmates marked SIM join on their own schedule
 * so the timer can be watched; a real invite link (?crew=CODE&cn=NAME&ref=YOU) lets a friend join on their own device.
 *
 * Linking is two-sided: an invite link prefills the crew and the inviter, never commits. A member counts only once the other
 * side confirms with one tap (confirm, decline, add from players who joined in the last 14 days).
 *
 * Rush.crew: { RULES, get, create, join, leave, link, invite, boost, stage, clock, on, pending, confirm, decline, add, recent }
 */
(function () {
  const K = 'rush-crew-v1', H = 36e5;
  const RULES = { per: 0.1, cap: 1.0, max: 12, minAlive: 3, winNew: 168 * H, winMove: 48 * H, warn: 48 * H, hot: 12 * H };
  const subs = [];
  const emit = () => subs.forEach(f => { try { f(); } catch (e) {} });
  const load = () => { try { return JSON.parse(localStorage.getItem(K)) || null; } catch (e) { return null; } };
  const save = c => { try { localStorage.setItem(K, JSON.stringify(c)); } catch (e) {} emit(); };
  const clean = s => String(s == null ? '' : s).replace(/[\u0000-\u001f<>"'`$\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 24);
  const mkCode = () => Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
  const hash = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
  const weekId = () => { try { return Rush.week().id; } catch (e) { return ''; } };
  const meName = () => { try { const m = Rush.me(); return m.handle && m.handle !== 'You' ? m.handle : 'You'; } catch (e) { return 'You'; } };
  function simNames() {
    let n = [];
    try { if (window.RW && RW.FIELD) n = RW.FIELD.map(b => b.name); } catch (e) {}
    if (!n.length) n = ['Mia R.', 'Dre K.', 'Sam T.', 'Jules P.', 'Nate B.', 'Ari L.', 'Kofi M.', 'Lena V.', 'Theo C.', 'Rosa D.', 'Ivy W.'];
    return n;
  }

  /* Linking is explicit and two-sided (founder, Nov 3 10:05 PM): a link may prefill, never commit. Nobody is a member
     until the other side confirms with one tap; the timer starts at the confirm.
     SIM players ask to join 60 to 200 hours apart (deterministic per crew, 60% new to Rush); you confirm them.
     Prototype stand-ins for the other phone: a friend you add confirms after 15 seconds (9 in 10 do), and the crew you ask
     to join confirms you after 10 seconds. */
  const PROTO_CONFIRM = 15e3, PROTO_ACCEPT = 10e3;
  function simTick(c, now) {
    if (!c || !c.sim) return false;
    let changed = false;
    c.reqs = c.reqs || [];
    const taken = n => c.members.some(m => m.name === n) || c.reqs.some(r => r.name === n);
    const names = simNames().filter(n => !taken(n) && n !== meName());
    while (c.mine !== 'pending' && c.members.length + c.reqs.filter(r => r.dir === 'in').length < RULES.max && names.length) {
      const k = c.simN || 0, gap = (60 + hash(c.id + ':' + k) * 140) * H, at = (c.simAt || c.created) + gap;
      if (at > now) break;
      const isNew = hash(c.id + ':new:' + k) < 0.6, name = names.splice(Math.floor(hash(c.id + ':n:' + k) * names.length), 1)[0];
      c.reqs.push({ id: 'sim' + k, name, at, isNew, dir: 'in', sim: true });
      c.log.unshift({ t: at, text: name + ' says you invited them' + (isNew ? ' (new to Rush)' : '') + '. Confirm to add them.' });
      c.simN = k + 1; c.simAt = at; changed = true;
    }
    /* the friend you added answers on their phone */
    c.reqs.filter(r => r.dir === 'out' && now - r.at >= PROTO_CONFIRM).forEach(r => {
      c.reqs = c.reqs.filter(x => x !== r);
      const t = r.at + PROTO_CONFIRM;
      if (hash(c.id + r.name) < 0.9 && c.members.length < RULES.max) { c.members.push({ id: 'f' + r.at, name: r.name, joined: t, isNew: r.isNew, sim: true }); c.log.unshift({ t, text: r.name + ' confirmed' + (r.isNew ? ', new to Rush: timer reset to 7 days' : ': +48 h') }); }
      else c.log.unshift({ t, text: r.name + ' did not confirm. Nothing changes.' });
      changed = true;
    });
    /* your own request to join: the crew confirms you */
    if (c.mine === 'pending' && now - c.askedAt >= PROTO_ACCEPT) {
      const t = c.askedAt + PROTO_ACCEPT;
      c.members.push({ id: 'me', name: meName(), joined: t, isNew: !!c.meNew, me: true }); c.mine = 'in';
      c.log.unshift({ t, text: c.by + ' confirmed you. You are in' + (c.meNew ? ', new to Rush: the timer is back to 7 days for everyone' : ': +48 h for everyone') });
      changed = true;
    }
    if (c.log.length > 40) c.log.length = 40;
    return changed;
  }

  /* one tap to confirm or turn down someone who says you invited them */
  function confirm(id) {
    const c = load(); if (!c || !c.reqs) return null;
    const r = c.reqs.find(x => x.id === id && x.dir === 'in'); if (!r || c.members.length >= RULES.max) return null;
    c.reqs = c.reqs.filter(x => x !== r); const now = Date.now();
    c.members.push({ id: r.id, name: r.name, joined: now, isNew: r.isNew, sim: r.sim });
    c.log.unshift({ t: now, text: 'You confirmed ' + r.name + (r.isNew ? ', new to Rush: timer reset to 7 days' : ': +48 h') });
    save(c); return get();
  }
  function decline(id) {
    const c = load(); if (!c || !c.reqs) return null;
    const r = c.reqs.find(x => x.id === id); if (!r) return null;
    c.reqs = c.reqs.filter(x => x !== r);
    c.log.unshift({ t: Date.now(), text: r.dir === 'in' ? 'You turned down ' + r.name + '.' : 'You cancelled the invite to ' + r.name + '.' });
    save(c); return get();
  }
  /* the inviter adds a friend from the players who joined in the last 14 days; the friend confirms */
  function recent() {
    const c = load(); let rows = [];
    try { rows = Rush.field().filter(r => r.sim).map(r => r.name); } catch (e) {}
    rows = rows.concat(simNames());
    const seen = new Set();
    return rows.filter(n => { if (seen.has(n) || n === meName()) return false; seen.add(n); return !(c && c.members && (c.members.some(m => m.name === n) || (c.reqs || []).some(r => r.name === n))); })
      .slice(0, 14).map(n => ({ name: n, isNew: hash(n) < 0.6, days: 1 + Math.floor(hash(n + 'd') * 13) }));
  }
  function add(name) {
    const c = load(); if (!c || !c.members) return { ok: false, why: 'Start or join a crew first.' };
    const nm = clean(name); if (!nm) return { ok: false, why: 'Pick a player.' };
    c.reqs = c.reqs || [];
    if (c.reqs.some(r => r.name === nm) || c.members.some(m => m.name === nm)) return { ok: false, why: nm + ' is already on the list.' };
    const p = recent().find(x => x.name === nm);
    c.reqs.push({ id: 'o' + Date.now(), name: nm, at: Date.now(), isNew: p ? p.isNew : true, dir: 'out' });
    c.log.unshift({ t: Date.now(), text: 'You added ' + nm + '. Waiting for them to confirm.' });
    save(c); return { ok: true };
  }

  function computed(c, now) {
    now = now || Date.now();
    const size = c.members.length;
    const until = c.members.reduce((t, m) => Math.max(t, m.joined + (m.isNew ? RULES.winNew : RULES.winMove)), 0);
    const left = Math.max(0, until - now), big = size >= RULES.minAlive, alive = big && left > 0;
    const full = Math.min(RULES.cap, RULES.per * Math.max(0, size - 1));
    const stage = !big ? 'small' : !alive ? 'cold' : left <= RULES.hot ? 'hot' : left <= RULES.warn ? 'warn' : 'alive';
    const last = c.members.slice().sort((a, b) => b.joined - a.joined)[0];
    let settles = 0; try { settles = Rush.week().settles; } catch (e) {}
    return Object.assign({}, c, { size, until, left, alive, boost: alive ? +full.toFixed(2) : 0, full: +full.toFixed(2), next: size < RULES.max ? +Math.min(RULES.cap, RULES.per * size).toFixed(2) : full, stage, last, settles, holdsAtSettle: alive && until >= settles, room: RULES.max - size, reqsIn: (c.reqs || []).filter(r => r.dir === 'in'), reqsOut: (c.reqs || []).filter(r => r.dir === 'out'), mine: c.mine || 'in' });
  }

  function get() {
    const c = load(); if (!c || !Array.isArray(c.members)) return null;
    if (simTick(c, Date.now())) save(c);
    return computed(c);
  }

  function create(name, opts) {
    const cur = load();
    if (cur && Array.isArray(cur.members)) return get();
    if (cur && cur.left && cur.left === weekId()) return null;
    const now = Date.now(), nm = clean(name) || (meName() + "'s crew"), id = 'c' + now.toString(36);
    const c = { v: 1, id, code: mkCode(), name: nm, created: now, owner: true, week: weekId(), sim: !(opts && opts.sim === false), simN: 0, simAt: now,
      members: [{ id: 'me', name: meName(), joined: now, isNew: false, me: true }], log: [{ t: now, text: 'You started ' + nm + '. Two more to switch the boost on.' }] };
    if (c.sim) { const n = simNames().filter(x => x !== meName()); [0, 1].forEach(i => { const m = n.splice(Math.floor(hash(id + i) * n.length), 1)[0]; if (m) { c.members.push({ id: 'seed' + i, name: m, joined: now - (2 - i) * H, isNew: i === 0, sim: true }); c.log.unshift({ t: now - (2 - i) * H, text: m + ' joined' + (i === 0 ? ', new to Rush: timer set to 7 days' : ': +48 h') }); } }); }
    save(c); return get();
  }

  /* joining from an invite link: the link prefills the crew and who invited you (you can pick someone else from the Field);
     your tap sends the request, and you are in when the crew confirms. New to Rush if you are not yet in this week's Field. */
  function join(code, name, by) {
    const cur = load(), wk = weekId();
    if (cur && cur.members && (cur.members.some(m => m.me) || cur.mine === 'pending')) return { ok: false, why: 'You are already in ' + cur.name + '.' };
    if (cur && cur.left === wk) return { ok: false, why: 'You left a crew this week. You can join a new one next week.' };
    let isNew = true; try { isNew = !Rush.me().entered; } catch (e) {}
    const now = Date.now(), cd = clean(code).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8), nm = clean(name) || 'Crew ' + cd, inv = clean(by);
    if (!cd) return { ok: false, why: 'That invite has no crew code.' };
    if (!inv) return { ok: false, why: 'Pick who invited you.' };
    const c = { v: 1, id: 'j' + cd, code: cd, name: nm, created: now, owner: false, week: wk, sim: true, simN: 0, simAt: now, mine: 'pending', askedAt: now, by: inv, meNew: isNew, reqs: [],
      members: [{ id: 'inv', name: inv, joined: now - 30 * H, isNew: false }, { id: 'inv2', name: simNames().filter(n => n !== inv)[Math.floor(hash(cd) * 10)], joined: now - 20 * H, isNew: true, sim: true }],
      log: [{ t: now, text: 'You asked to join ' + nm + '. Waiting for ' + inv + ' to confirm.' }] };
    save(c); return { ok: true, crew: get() };
  }

  function leave() { const c = load(); if (!c) return; save({ left: weekId() }); }

  function link(c) {
    c = c || get(); if (!c) return '';
    let me = 'friend'; try { me = meName(); } catch (e) {}
    const base = location.origin + location.pathname.replace(/[^/]*$/, '');
    return base + 'crew.html?crew=' + encodeURIComponent(c.code) + '&cn=' + encodeURIComponent(c.name) + '&ref=' + encodeURIComponent(me);
  }

  /* over a day it reads 6d 23h; inside the last day it ticks 23:59:59 */
  function clock(ms) { if (ms <= 0) return '0:00:00'; const s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; if (d) return d + 'd ' + h + 'h'; return h + ':' + String(m).padStart(2, '0') + ':' + String(x).padStart(2, '0'); }

  /* the invite text: what the crew is and what the friend gets, in Rush words */
  function invite(c) {
    c = c || get(); if (!c) return '';
    const after = Math.min(RULES.cap, RULES.per * c.size);
    return `Join my Rush crew ${c.name}. ${c.size} of us in, and your join lifts everyone's Prize Multiplier to +${after.toFixed(1)}x, you included. You get 1,000 Stack free, and the crew boost stays on for 7 days from your join.`;
  }

  /* an invite link on this page: ?crew=CODE&cn=NAME&ref=WHO */
  function pending() {
    try { const q = new URLSearchParams(location.search), cd = q.get('crew'); if (!cd) return null; return { code: clean(cd), name: clean(q.get('cn')), by: clean(q.get('ref')) }; } catch (e) { return null; }
  }

  const boost = () => { const c = get(); return c && c.members && c.members.some(m => m.me) ? c.boost : 0; };
  const stage = () => { const c = get(); return c ? c.stage : null; };
  const on = f => { subs.push(f); };
  window.addEventListener('storage', e => { if (e.key === K) emit(); });

  window.Rush = window.Rush || {};
  window.Rush.crew = { RULES, get, create, join, leave, link, invite, boost, stage, clock, on, pending, computed, confirm, decline, add, recent };
})();
