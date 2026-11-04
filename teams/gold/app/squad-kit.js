/* Squad Streak (Team Gold, Phase 3). window.SQ, localStorage "gold-squad-v1". Load after shared/state.js.
 *
 * A Squad is 2 to 8 friends. Each member's Prize Multiplier gets:
 *   +0.05x for each member who locks a pick this week (you count),
 *   +0.1x for each streak week, up to 5: a week where at least 60% of the Squad (at least 2) locked a pick,
 *         plus one streak week when a new member locks a first pick (at most one such week per week),
 *   +0.2x the week after the Squad finishes top of Squad Ranks.
 * Missing a week sets the streak back to 0. Nobody loses a seat. The deadline is the week's entry close (Monday night kickoff).
 *
 * No backend: a friend who joins by link is in the Squad on their own phone. For the demo, open seats can be filled with
 * SIM players from the Field, labelled SIM like the Field; whether they pick is deterministic per week, so every page agrees.
 *
 * Linking (founder addendum, 10:05 PM): nothing links on its own. An invite link only prefills. Every seat and every referral
 * is two-sided: one side asks, the other confirms with one tap, and only then does it count. A player who opens an invite
 * link asks to join and waits for the Squad to confirm; a Squad member can ask anyone who joined Rush in the last 14 days,
 * and that player confirms. "Who invited you?" picks a player by name, and that player confirms before the referral credits.
 * SIM players confirm a few seconds after they are asked, so the flow can be tried on one phone.
 *
 *   SQ.get()            -> squad or null
 *   SQ.create(name)     -> squad (you as founder)
 *   SQ.join(code, squadName, host) -> squad (from an invite link ?sq=CODE&n=NAME&h=HOST)
 *   SQ.leave()
 *   SQ.fill(n)          -> up to n SIM players from the Field ask to join (you confirm each)
 *   SQ.confirm(id) / SQ.decline(id) -> answer a request to join
 *   SQ.recent()         -> players who joined Rush in the last 14 days and are not in the Squad (SIM: from the Field)
 *   SQ.ask(id)          -> ask one of them to join; it counts once they confirm
 *   SQ.inviter() / SQ.setInviter(id) / SQ.clearInviter() -> "Who invited you?", two-sided, credits on confirm
 *   SQ.inviteUrl()      -> share link to this site's squad.html
 *   SQ.status()         -> {week, members, picked, need, of, onTrack, streak, boost:{active, streak, top, total}, deadline}
 *   SQ.ranks()          -> [{id, name, size, units, me}] sorted by average Units
 *   SQ.boost()          -> total Prize Multiplier boost (number) for multiplier()
 *   SQ.RULES
 */
(function () {
  const KEY = 'gold-squad-v1', R = window.Rush;
  const RULES = { perActive: .05, perStreak: .1, maxStreak: 5, keep: .6, minKeep: 2, top: .2, max: 8 };
  const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 1e6) / 1e6; };
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  let S = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} subs.forEach(f => { try { f(); } catch (e) {} }); };
  const subs = [];
  window.addEventListener('storage', e => { if (e.key === KEY) { S = load(); subs.forEach(f => { try { f(); } catch (e) {} }); } });
  const wk = () => (R && R.week ? R.week() : { id: 'w', n: 0, entryCloses: Date.now() });
  const code = () => Array.from({ length: 6 }, (_, i) => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.floor(hash(Date.now() + ':' + i + Math.random()) * 31)]).join('');
  const meName = () => { try { const h = R.me().handle; return h && h !== 'You' ? h : 'You'; } catch (e) { return 'You'; } };
  /* Did a member lock a pick in week w? You: your own Slip. SIM: their Field row has picks, else a steady 72% weekly habit. */
  function picked(m, w) {
    if (m.me) { try { return R.picks({ week: w.id }).length > 0 || R.picks({ week: w.id, contest: '*' }).length > 0; } catch (e) { return false; } }
    if (m.joinedWeek && m.joinedWeek > w.n) return false;
    try { const row = R.field().find(r => r.id === m.id); if (row && (row.open || row.w || row.l || row.units)) return true; } catch (e) {}
    return hash(m.id + ':' + w.id) < .72;
  }
  const CONFIRM_MS = 4000;
  /* SIM players confirm a few seconds after being asked; real players confirm on their own phone. */
  function confirmSims() {
    const sq = S.squad, now = Date.now(); let ch = false;
    if (sq && sq.pend) for (const p of sq.pend.slice()) if (p.dir === 'out' && p.sim && now - p.at >= CONFIRM_MS && sq.members.length < RULES.max) { sq.members.push({ id: p.id, name: p.name, sim: true, joinedWeek: wk().n, confirmedAt: now }); sq.pend.splice(sq.pend.indexOf(p), 1); ch = true; }
    if (S.link && S.link.state === 'pending' && S.link.sim && now - S.link.at >= CONFIRM_MS) { S.link.state = 'confirmed'; S.link.confirmedAt = now; ch = true; }
    if (ch) save();
  }
  function settle() {
    /* Close every finished week once: streak up when 60% picked, back to 0 when not; recruit week on top. */
    const sq = S.squad; if (!sq || !R || !R.weekOf) return;
    const cur = wk(); let changed = false;
    for (let n = (sq.lastClosed || sq.startWeek - 1) + 1; n < cur.n; n++) {
      const w = R.weekOf(cur.opens - (cur.n - n) * 7 * 864e5 + 36e5);
      const mem = sq.members.filter(m => !m.joinedWeek || m.joinedWeek <= n), p = mem.filter(m => picked(m, w)).length;
      const need = Math.max(RULES.minKeep, Math.ceil(mem.length * RULES.keep)), kept = mem.length >= 2 && p >= need;
      const rec = sq.members.some(m => m.joinedWeek === n && !m.founder && picked(m, w));
      sq.streak = kept ? Math.min(RULES.maxStreak, (sq.streak || 0) + 1 + (rec ? 1 : 0)) : (rec ? 1 : 0);
      (sq.hist = sq.hist || []).push({ n, picked: p, of: mem.length, kept, rec });
      sq.lastClosed = n; changed = true;
    }
    if (changed) save();
  }
  const SQ = {
    RULES,
    on(f) { subs.push(f); },
    get() { confirmSims(); settle(); return S.squad || null; },
    create(name) {
      const w = wk();
      S.squad = { id: 'sq' + code(), code: code(), name: String(name || '').trim().slice(0, 24) || meName() + "'s Squad", startWeek: w.n, streak: 0, lastClosed: w.n - 1, hist: [],
        members: [{ id: 'me', name: meName(), me: true, founder: true, joinedWeek: w.n }] };
      save(); return S.squad;
    },
    join(c, squadName, host) {
      const w = wk();
      S.squad = { id: 'sq' + String(c).slice(0, 8), code: String(c).slice(0, 8), name: String(squadName || 'Squad').slice(0, 24), startWeek: w.n, streak: 0, lastClosed: w.n - 1, hist: [], joinedBy: String(host || '').slice(0, 24),
        waiting: true, askedAt: Date.now(),
        members: [{ id: 'h:' + String(host || 'host').slice(0, 24), name: String(host || 'Host').slice(0, 24), founder: true, joinedWeek: w.n, away: true }, { id: 'me', name: meName(), me: true, joinedWeek: w.n }] };
      save(); return S.squad;
    },
    leave() { delete S.squad; save(); },
    fill(n) {
      const sq = S.squad; if (!sq || !R) return 0; const w = wk();
      const taken = new Set(sq.members.map(m => m.id));
      const pool = R.field().filter(r => r.sim && !taken.has(r.id)).sort((a, b) => hash(a.id + sq.code) - hash(b.id + sq.code));
      sq.pend = sq.pend || []; const asked = new Set(sq.pend.map(p => p.id));
      let k = 0; for (const r of pool) { if (sq.members.length + sq.pend.length >= RULES.max || k >= n) break; if (asked.has(r.id)) continue; sq.pend.push({ id: r.id, name: r.name, sim: true, dir: 'in', at: Date.now() }); k++; }
      save(); return k;
    },
    confirm(id) { const sq = S.squad; if (!sq || !sq.pend) return false; const p = sq.pend.find(x => x.id === id && x.dir === 'in'); if (!p || sq.members.length >= RULES.max) return false; sq.pend.splice(sq.pend.indexOf(p), 1); sq.members.push({ id: p.id, name: p.name, sim: p.sim, joinedWeek: wk().n, confirmedAt: Date.now() }); save(); return true; },
    decline(id) { const sq = S.squad; if (!sq || !sq.pend) return; sq.pend = sq.pend.filter(x => x.id !== id); save(); },
    recent() {
      const sq = S.squad; if (!R) return []; const taken = new Set([...(sq ? sq.members : []), ...((sq && sq.pend) || [])].map(m => m.id));
      return R.field().filter(r => r.sim && !taken.has(r.id) && hash('new14' + r.id) < .3).slice(0, 6).map(r => ({ id: r.id, name: r.name, sim: true, days: 1 + Math.floor(hash('d' + r.id) * 13) }));
    },
    ask(id) { const sq = S.squad; if (!sq) return false; const r = SQ.recent().find(x => x.id === id); if (!r || sq.members.length + (sq.pend || []).length >= RULES.max) return false; (sq.pend = sq.pend || []).push({ id: r.id, name: r.name, sim: true, dir: 'out', at: Date.now() }); save(); return true; },
    inviter() { confirmSims(); return S.link || null; },
    setInviter(id) { if (S.link && S.link.state === 'confirmed') return S.link; const r = R && R.field().find(x => x.id === id && !x.me); if (!r) return null; S.link = { id: r.id, name: r.name, sim: !!r.sim, state: 'pending', at: Date.now() }; save(); return S.link; },
    clearInviter() { if (S.link && S.link.state !== 'confirmed') { delete S.link; save(); } },
    players(qs) { if (!R) return []; const t = String(qs || '').trim().toLowerCase(); return R.field().filter(r => !r.me && (!t || r.name.toLowerCase().includes(t))).slice(0, 6).map(r => ({ id: r.id, name: r.name, sim: !!r.sim })); },
    inviteUrl() { const sq = S.squad; if (!sq) return ''; const u = new URL('squad.html', location.href); u.search = new URLSearchParams({ sq: sq.code, n: sq.name, h: meName() }).toString(); return u.href; },
    status() {
      confirmSims(); settle(); const sq = S.squad, w = wk(); if (!sq) return null;
      if (sq.waiting) return { waiting: true, name: sq.name, host: sq.joinedBy || 'the Squad', week: w, askedAt: sq.askedAt, members: [], of: 0, picked: 0, need: 0, streak: 0, hist: [], pend: [], boost: { active: 0, streak: 0, top: 0, total: 0 }, deadline: w.entryCloses };
      const members = sq.members.map(m => ({ ...m, name: m.me ? meName() : m.name, picked: picked(m, w) }));
      const of = members.length, p = members.filter(m => m.picked).length, need = Math.max(RULES.minKeep, Math.ceil(of * RULES.keep));
      const rec = members.some(m => m.joinedWeek === w.n && !m.founder && !m.me && m.picked) && sq.startWeek < w.n;
      const top = (sq.hist || []).length && sq.topLast ? RULES.top : 0;
      const a = +(RULES.perActive * p).toFixed(2), s = +(RULES.perStreak * Math.min(RULES.maxStreak, sq.streak || 0)).toFixed(2);
      return { week: w, name: sq.name, code: sq.code, members, pend: sq.pend || [], picked: p, need, of, onTrack: of >= 2 && p >= need, recruitWeek: rec, streak: sq.streak || 0, hist: sq.hist || [],
        boost: { active: a, streak: s, top, total: +(a + s + top).toFixed(2) }, deadline: w.entryCloses };
    },
    boost() { const s = SQ.status(); return s ? s.boost.total : 0; },
    ranks() {
      /* Squad Ranks: the SIM Field in six steady Squads, plus yours. Score: average Units of members. */
      if (!R) return []; const f = R.field(), sq = S.squad, mine = new Set(sq ? sq.members.map(m => m.id) : []);
      const NAMES = ['Late Sweats', 'Chalk Eaters', 'Dog Pound', 'Night Owls', 'Fade Club', 'Overtime'];
      const groups = NAMES.map((name, i) => ({ id: 'sim-sq' + i, name, rows: [] }));
      for (const r of f) if (r.sim && !mine.has(r.id)) groups[Math.floor(hash('sq' + r.id) * NAMES.length)].rows.push(r);
      const out = groups.filter(g => g.rows.length >= 2).map(g => ({ id: g.id, name: g.name, size: g.rows.length, units: g.rows.reduce((t, r) => t + (+r.units || 0), 0) / g.rows.length, sim: true }));
      if (sq) { const rows = sq.members.map(m => m.me ? f.find(r => r.me || r.id === 'me') : f.find(r => r.id === m.id)).filter(Boolean); out.push({ id: sq.id, name: sq.name, size: sq.members.length, units: rows.length ? rows.reduce((t, r) => t + (+r.units || 0), 0) / rows.length : 0, me: true }); }
      return out.sort((a, b) => b.units - a.units).map((x, i) => ({ ...x, rank: i + 1, units: Math.round(x.units * 10) / 10 }));
    }
  };
  window.SQ = SQ;
  /* Invite links land on squad.html; nothing joins until the player taps Join. */
})();
