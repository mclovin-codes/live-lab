/* Rush Crews (Blue, Phase 3): a crew boosts every member's Prize Multiplier by its size while it is alive.
 *
 * The rules (Rush.crew.RULES, the same numbers the simulation in teams/blue/sim uses):
 *  - Boost: +0.1x per crewmate (members minus you), up to +1.0x at 11 crewmates. A crew holds 12.
 *  - Alive: at least 3 members and the timer running. Below 3, or at zero, the boost is 0 for everyone.
 *  - The timer: every new member restarts it. Someone new to Rush (not yet in this week's Field) buys 72 hours;
 *    a player already in the Field moving in buys 24 hours. The timer never runs backwards: a join only ever extends it.
 *  - At zero the crew goes cold: members stay, the boost is gone until someone new joins, then it is back in full.
 *  - The boost that counts is the one you hold when the week settles (Tuesday 4 AM ET); the countdown is the reason to act.
 *  - One crew per player per week: leaving locks you out of joining another until the next week.
 *
 * Prototype on one device: the crew lives in this browser (rush-crew-v1). Crewmates marked SIM join on their own schedule
 * so the timer can be watched; a real invite link (?crew=CODE&cn=NAME&ref=YOU) lets a friend join on their own device.
 *
 * Rush.crew: { RULES, get, create, join, leave, link, invite, boost, stage, clock, on, pending }
 */
(function () {
  const K = 'rush-crew-v1', H = 36e5;
  const RULES = { per: 0.1, cap: 1.0, max: 12, minAlive: 3, winNew: 72 * H, winMove: 24 * H, warn: 24 * H, hot: 6 * H };
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

  /* SIM crewmates: after the first two, the next ones arrive 40 to 110 hours apart (deterministic per crew), 60% new to Rush.
     Gaps longer than the window let the crew go cold now and then, so the countdown means something. */
  function simTick(c, now) {
    if (!c || !c.sim) return false;
    let changed = false;
    const names = simNames().filter(n => !c.members.some(m => m.name === n));
    while (c.members.length < RULES.max && names.length) {
      const k = c.simN || 0, gap = (40 + hash(c.id + ':' + k) * 70) * H, at = (c.simAt || c.created) + gap;
      if (at > now) break;
      const isNew = hash(c.id + ':new:' + k) < 0.6, name = names.splice(Math.floor(hash(c.id + ':n:' + k) * names.length), 1)[0];
      c.members.push({ id: 'sim' + k, name, joined: at, isNew, sim: true });
      c.log.unshift({ t: at, text: name + (isNew ? ' joined, new to Rush: timer reset to 72 h' : ' moved in from the Field: +24 h') });
      c.simN = k + 1; c.simAt = at; changed = true;
    }
    if (c.log.length > 40) c.log.length = 40;
    return changed;
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
    return Object.assign({}, c, { size, until, left, alive, boost: alive ? +full.toFixed(2) : 0, full: +full.toFixed(2), next: size < RULES.max ? +Math.min(RULES.cap, RULES.per * size).toFixed(2) : full, stage, last, settles, holdsAtSettle: alive && until >= settles, room: RULES.max - size });
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
    if (c.sim) { const n = simNames().filter(x => x !== meName()); [0, 1].forEach(i => { const m = n.splice(Math.floor(hash(id + i) * n.length), 1)[0]; if (m) { c.members.push({ id: 'seed' + i, name: m, joined: now - (2 - i) * H, isNew: i === 0, sim: true }); c.log.unshift({ t: now - (2 - i) * H, text: m + ' joined' + (i === 0 ? ', new to Rush: timer set to 72 h' : ': +24 h') }); } }); }
    save(c); return get();
  }

  /* joining from an invite link: you join the inviter's crew (on this device), new to Rush if you are not yet in this week's Field */
  function join(code, name, by) {
    const cur = load(), wk = weekId();
    if (cur && cur.members && cur.members.some(m => m.me)) return { ok: false, why: 'You are already in ' + cur.name + '.' };
    if (cur && cur.left === wk) return { ok: false, why: 'You left a crew this week. You can join a new one next week.' };
    let isNew = true; try { isNew = !Rush.me().entered; } catch (e) {}
    const now = Date.now(), cd = clean(code).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8), nm = clean(name) || 'Crew ' + cd, inv = clean(by) || 'Your friend';
    if (!cd) return { ok: false, why: 'That invite has no crew code.' };
    const c = { v: 1, id: 'j' + cd, code: cd, name: nm, created: now, owner: false, week: wk, sim: true, simN: 0, simAt: now,
      members: [{ id: 'inv', name: inv, joined: now - 30 * H, isNew: false }, { id: 'inv2', name: simNames()[Math.floor(hash(cd) * 10)], joined: now - 20 * H, isNew: true, sim: true }, { id: 'me', name: meName(), joined: now, isNew, me: true }],
      log: [{ t: now, text: 'You joined ' + nm + (isNew ? ', new to Rush: the timer is back to 72 h for everyone' : ': +24 h for everyone') }] };
    save(c); return { ok: true, crew: get() };
  }

  function leave() { const c = load(); if (!c) return; save({ left: weekId() }); }

  function link(c) {
    c = c || get(); if (!c) return '';
    let me = 'friend'; try { me = meName(); } catch (e) {}
    const base = location.origin + location.pathname.replace(/[^/]*$/, '');
    return base + 'crew.html?crew=' + encodeURIComponent(c.code) + '&cn=' + encodeURIComponent(c.name) + '&ref=' + encodeURIComponent(me);
  }

  function clock(ms) { if (ms <= 0) return '0:00:00'; const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return h + ':' + String(m).padStart(2, '0') + ':' + String(x).padStart(2, '0'); }

  /* the invite text: what the crew is and what the friend gets, in Rush words */
  function invite(c) {
    c = c || get(); if (!c) return '';
    const after = Math.min(RULES.cap, RULES.per * c.size);
    return `Join my Rush crew ${c.name}. ${c.size} of us in, and your join lifts everyone's Prize Multiplier to +${after.toFixed(1)}x, you included. You get 1,000 Stack free, and the crew boost stays on for 72 hours from your join.`;
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
  window.Rush.crew = { RULES, get, create, join, leave, link, invite, boost, stage, clock, on, pending, computed };
})();
