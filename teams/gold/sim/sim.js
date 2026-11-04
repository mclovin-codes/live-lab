#!/usr/bin/env node
/* Team Gold growth simulation: Weeks 9 to 13, player by player, with and without Squad Streak.
 * Usage: node sim.js [runs]   Reads params.json next to this file. Writes results.json and ../app/sim-results.js.
 * Seeds: mulberry32(run) for run = 1..runs. Baseline and every variant use the same seed for the same run.
 * Field = players in with a pick that week (the cohort file's "pickers"). */
const fs = require('fs'), path = require('path');
const P = JSON.parse(fs.readFileSync(path.join(__dirname, 'params.json'), 'utf8'));
const C = P.cohort, SQ = P.squad, A = P.assumptions;
const RUNS = +process.argv[2] || P.runs, WEEKS = [9, 10, 11, 12, 13];

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function poisson(rnd, l) { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; }
const rungOf = n => C.rungs.reduce((i, at, k) => n >= at ? k : i, 0);

/* Start of Week 9: the Week 8 cohort. Referral edges reproduce the Week 8 factors 1.35, 1.10, 1.10. */
function cohort() {
  const ps = []; let id = 0;
  const add = (state, won) => ps.push({ id: id++, state, won, ref: null, sq: null, joined: 8 });
  for (let i = 0; i < C.pickers_w8; i++) add('pick', i < C.winners_w8);
  for (let i = 0; i < C.entered_no_pick_w8; i++) add('nopick', false);
  for (let i = 0; i < C.recent_absent_w8 + C.long_absent_w8; i++) add('absent', false);
  [[13, 0], [14, 0], [15, 0], [16, 13], [17, 1], [18, 2]].forEach(([c, r]) => ps[c].ref = ps[r].id);
  return ps;
}
/* Referral multiplier, engine rule: min(3, 1 + 0.1 x active referrals at 0.5^(depth-1)). */
function refFactor(ps, kids, p) {
  let s = 0; const walk = (id, d) => { for (const k of kids.get(id) || []) { if (ps[k].state === 'pick') s += Math.pow(.5, d - 1); if (d < 4) walk(k, d + 1); } };
  walk(p.id, 1); return 1 + .1 * s;
}

function run(seed, v) {
  const rnd = mulberry32(seed), ps = cohort(), squads = [], out = [];
  const organic = Math.max(0, C.signups_per_week - C.p_active_brings_signup * C.avg_active_w1_w8);
  let topSquad = null;
  for (const w of WEEKS) {
    const prevPick = new Set(ps.filter(p => p.state === 'pick').map(p => p.id));
    /* 1. Squads form at the start of the week among last week's pickers. */
    if (v.squad) {
      for (const p of ps) {
        if (p.state !== 'pick' || p.sq != null) continue;
        if (rnd() < C.p_first_share * v.A1) {
          const s = { id: squads.length, members: [p.id], streak: 0 }; squads.push(s); p.sq = s.id;
          const free = ps.filter(q => q.state === 'pick' && q.sq == null);
          let n = Math.min(poisson(rnd, v.A2), free.length, SQ.max_size - 1);
          while (n-- > 0) { const i = Math.floor(rnd() * free.length), q = free.splice(i, 1)[0]; q.sq = s.id; q.joinedSq = w; s.members.push(q.id); }
        }
      }
    }
    /* 2. Who picks this week. */
    for (const p of ps) {
      const inSq = v.squad && p.sq != null && squads[p.sq].members.length >= 2;
      let pr;
      if (p.state === 'pick') pr = p.won ? C.p_return_after_win + (inSq && v.A4 ? .03 : 0) : C.p_return_after_loss + (inSq && v.A4 ? C.p_return_reloaded_loser - C.p_return_unreloaded_loser : 0);
      else if (p.state === 'nopick') pr = C.p_pick_after_entered_no_pick;
      else pr = inSq ? v.A5 : C.p_reactivate;
      p.next = rnd() < pr ? 'pick' : 'absent';
    }
    for (const p of ps) { p.state = p.next; delete p.next; }
    /* 3. New signups: organic, plus personal-code referrals from this week's pickers. */
    let signups = 0, newIn = 0;
    const pickers = ps.filter(p => p.state === 'pick');
    for (const p of pickers) {
      const s = v.squad && p.sq != null ? squads[p.sq] : null, open = s && s.members.length < SQ.max_size;
      if (rnd() < C.p_active_brings_signup * (open ? v.A3 : 1)) {
        /* Personal-code signups: 7 of 7 made a first pick, so a referred signup is in the Field. */
        const q = { id: ps.length, state: 'pick', won: false, ref: p.id, sq: null, joined: w };
        ps.push(q); signups++;
        if (open) { q.sq = s.id; q.joinedSq = w; s.members.push(q.id); }
      }
    }
    const k = poisson(rnd, organic);
    for (let i = 0; i < k; i++) { const r = rnd(); ps.push({ id: ps.length, state: r < C.p_first_pick_signup_week ? 'pick' : r < C.p_enter_signup_week ? 'nopick' : 'absent', won: false, ref: null, sq: null, joined: w }); signups++; }
    for (const p of ps) if (p.joined === w && p.state === 'pick') newIn++;
    /* 4. Results. */
    for (const p of ps) p.won = p.state === 'pick' && rnd() < C.p_finish_up;
    /* 5. Squad streaks and boosts. */
    const boost = new Map();
    if (v.squad) {
      for (const s of squads) {
        const mem = s.members.map(i => ps[i]), picked = mem.filter(p => p.state === 'pick').length;
        const need = Math.max(SQ.min_keep, Math.ceil(mem.length * SQ.keep_share)), kept = mem.length >= 2 && picked >= need;
        const rec = mem.some(p => p.joinedSq === w && p.state === 'pick' && p.joined === w);
        s.streak = kept ? Math.min(SQ.max_streak, s.streak + 1 + (rec ? 1 : 0)) : (rec ? 1 : 0);
        if (mem.length >= 2) boost.set(s.id, SQ.per_active * picked + SQ.per_streak * s.streak + (topSquad === s.id ? SQ.top_bonus : 0));
      }
      const live = squads.filter(s => s.members.length >= 2);
      topSquad = live.length ? live[Math.floor(rnd() * live.length)].id : null;
    }
    /* 6. Metrics. */
    const kids = new Map(); for (const p of ps) if (p.ref != null) { if (!kids.has(p.ref)) kids.set(p.ref, []); kids.get(p.ref).push(p.id); }
    const now = ps.filter(p => p.state === 'pick'), field = now.length;
    const kept = now.filter(p => prevPick.has(p.id)).length;
    let mult = 0, touched = 0;
    for (const p of now) { const sqb = boost.has(p.sq) ? boost.get(p.sq) : 0; if (sqb) touched++; mult += Math.min(3, refFactor(ps, kids, p) + sqb); }
    out.push({ w, field, signups, newIn, retention: prevPick.size ? kept / prevPick.size : 0, rung: rungOf(field), mult: field ? mult / field : 1, touched: field ? touched / field : 0, squads: squads.filter(s => s.members.length >= 2).length });
  }
  return out;
}

const on = { squad: true, A1: A.A1_found_uplift.value, A2: A.A2_friends_pulled.value, A3: A.A3_invite_lift.value, A4: A.A4_retention_proxy.value, A5: A.A5_nudge_reactivation.value };
const off = { squad: true, A1: A.A1_found_uplift.off, A2: A.A2_friends_pulled.off, A3: A.A3_invite_lift.off, A4: A.A4_retention_proxy.off, A5: A.A5_nudge_reactivation.off };
const VARIANTS = [
  ['baseline', 'No mechanism', { squad: false, A1: 1, A2: 0, A3: 1, A4: 0, A5: C.p_reactivate }],
  ['squad', 'Squad Streak, all assumptions', on],
  ['noA1', 'Squad Streak without A1 (founding uplift)', { ...on, A1: off.A1 }],
  ['noA2', 'Squad Streak without A2 (friends pulled in)', { ...on, A2: off.A2 }],
  ['noA3', 'Squad Streak without A3 (invite lift)', { ...on, A3: off.A3 }],
  ['noA4', 'Squad Streak without A4 (retention proxy)', { ...on, A4: off.A4 }],
  ['noA5', 'Squad Streak without A5 (nudge reactivation)', { ...on, A5: off.A5 }],
  ['cohortOnly', 'Squad Streak, cohort rates only (every assumption off)', off]
];

const q = (a, f) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(f * s.length))]; };
const mean = a => a.reduce((t, x) => t + x, 0) / a.length;
const res = { generated: new Date().toISOString(), runs: RUNS, weeks: WEEKS, seed: P.seed, params: P, variants: {} };
for (const [key, label, v] of VARIANTS) {
  const all = []; for (let r = 1; r <= RUNS; r++) all.push(run(r, v));
  const wk = WEEKS.map((w, i) => {
    const col = f => all.map(o => o[i][f]);
    const s = f => ({ mean: +mean(col(f)).toFixed(3), p10: +q(col(f), .1).toFixed(3), p90: +q(col(f), .9).toFixed(3) });
    const rungShare = C.rungs.map((_, k) => +(all.filter(o => o[i].rung >= k).length / RUNS).toFixed(3));
    return { w, field: s('field'), signups: s('signups'), newIn: s('newIn'), retention: s('retention'), mult: s('mult'), touched: s('touched'), squads: s('squads'), rungShare };
  });
  res.variants[key] = { label, weeks: wk };
}
fs.writeFileSync(path.join(__dirname, 'results.json'), JSON.stringify(res, null, 1));
fs.writeFileSync(path.join(__dirname, '..', 'app', 'sim-results.js'), '/* Generated by teams/gold/sim/sim.js. */\nwindow.SIM=' + JSON.stringify(res) + ';\n');
const pad = (s, n) => String(s).padEnd(n);
console.log(`Gold sim, ${RUNS} runs, seeds 1..${RUNS}`);
for (const [key, label] of VARIANTS) {
  const v = res.variants[key];
  console.log('\n' + label);
  console.log(pad('Week', 6) + pad('Field', 16) + pad('New in', 8) + pad('Retention', 11) + pad('Mult', 7) + pad('Touched', 9) + 'P(40+)');
  for (const x of v.weeks) console.log(pad(x.w, 6) + pad(`${x.field.mean.toFixed(1)} (${x.field.p10}-${x.field.p90})`, 16) + pad(x.newIn.mean.toFixed(1), 8) + pad((x.retention.mean * 100).toFixed(1) + '%', 11) + pad(x.mult.mean.toFixed(3), 7) + pad((x.touched.mean * 100).toFixed(0) + '%', 9) + (x.rungShare[1] * 100).toFixed(0) + '%');
}
