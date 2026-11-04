#!/usr/bin/env node
/* Team Gold growth simulation: Weeks 9 to 13, player by player, with and without Squad Streak.
 * Usage: node sim.js [runs]   Reads params.json next to this file. Writes results.json and ../app/sim-results.js.
 *
 * Shared harness: the no-mechanism arm is Team Blue's baseline (teams/blue/sim/crews-sim.mjs, season() with sc=null),
 * draw for draw. Run r uses mulberry32(1000 + r), r = 0..runs-1, the same seed in every arm. Squad logic only draws
 * random numbers when the Squad arm is on, so the baseline numbers match Blue's exactly.
 * Field = entrants that week (players in the weekly Field), as in Blue's harness and the prize-rung stamp. */
const fs = require('fs'), path = require('path');
const P = JSON.parse(fs.readFileSync(path.join(__dirname, 'params.json'), 'utf8'));
const C = P.cohort, SQ = P.squad, A = P.assumptions;
const RUNS = +process.argv[2] || P.runs, WEEKS = [9, 10, 11, 12, 13];
const RECENT = Object.assign({}, C, { backAfterWin: C.recent_carryover, backAfterLoss: C.recent_carryover });
const ORGANIC = C.signupsPerWeek - C.referralPerEntrantWeek * 22;

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function poisson(rng, l) { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= rng(); } while (p > L); return k - 1; }

function season(seed, sc) {
  const rng = mulberry32(seed), K = sc && sc.rates === 'recent' ? RECENT : C, on = !!(sc && sc.squad);
  let id = 0;
  const Pl = [];
  const add = (st, extra) => { const p = Object.assign({ id: id++, st, refBy: null, sq: null }, extra); Pl.push(p); return p; };
  for (let i = 0; i < C.start.won; i++) add('won');
  for (let i = 0; i < C.start.lost; i++) add('lost');
  for (let i = 0; i < C.start.noPick; i++) add('nopick');
  for (let i = 0; i < C.start.outside; i++) add('out');
  /* the Week 8 referral graph: three players hold factors 1.35, 1.10, 1.10 */
  const field0 = Pl.filter(p => p.st !== 'out');
  const refd = field0.slice(3, 8); refd[0].refBy = field0[0].id; refd[1].refBy = field0[0].id; refd[2].refBy = field0[0].id; refd[3].refBy = field0[1].id; refd[4].refBy = field0[2].id;

  const squads = [];   // { id, members: [player], streak, joinedNew: Set }
  const live = s => s.members.length >= 2;
  let topSquad = null;
  const weeks = [];
  let prevField = Pl.filter(p => p.st !== 'out');
  for (let w = 9; w <= 13; w++) {
    const inField = new Set();
    /* returning and reactivating players; a live Squad's members come back more often (A4) and reactivate on nudges (A5) */
    for (const p of Pl) {
      if (p.st === 'new') continue;
      const inSq = on && p.sq != null && live(squads[p.sq]);
      let pr = p.st === 'won' ? K.backAfterWin : p.st === 'lost' ? K.backAfterLoss : p.st === 'nopick' ? K.backAfterNoPick : K.reactivate;
      if (inSq) pr = p.st === 'won' ? pr + sc.A4 * .03 : p.st === 'lost' ? pr + sc.A4 * (C.p_return_reloaded_loser - C.p_return_unreloaded_loser) : p.st === 'out' ? sc.A5 : pr;
      if (rng() < Math.min(0.99, pr)) inField.add(p);
    }
    /* Squads form at the start of the week: a returning player founds one at the first-share rate x A1 and pulls in
       friends already in the Field (A2). Joining an existing player is a two-sided link: both confirm (A6). */
    if (on) {
      for (const p of [...inField]) {
        if (p.sq != null || rng() >= C.p_first_share * sc.A1) continue;
        const s = { id: squads.length, members: [p], streak: 0, joinedNew: new Set() }; squads.push(s); p.sq = s.id;
        const free = [...inField].filter(q => q.sq == null);
        let n = Math.min(poisson(rng, sc.A2), free.length, SQ.max_size - 1);
        while (n-- > 0) { const q = free.splice(Math.floor(rng() * free.length), 1)[0]; if (rng() < sc.A6) { s.members.push(q); q.sq = s.id; } }
      }
    }
    /* new players by day: organic signups plus personal referrals from every Field player (Squad members with an open seat x A3) */
    const newcomers = [];
    for (let d = 0; d < 7; d++) {
      const t = d * 24 + rng() * 24;   // arrival hour, kept so the draw order matches Blue's harness
      const org = poisson(rng, ORGANIC / 7);
      for (let k = 0; k < org; k++) newcomers.push({ t, refBy: null });
      for (const p of inField) {
        const s = on && p.sq != null ? squads[p.sq] : null, open = s && s.members.length < SQ.max_size;
        const rate = C.referralPerEntrantWeek / 7 * (open ? sc.A3 : 1);
        if (rng() < rate) newcomers.push({ t, refBy: p.id, sq: open ? s.id : null });
      }
    }
    let newIn = 0;
    for (const nc of newcomers.sort((a, b) => a.t - b.t)) {
      const p = add('new', { refBy: nc.refBy, isNew: true });
      if (rng() >= C.newEnters) { p.st = 'out'; continue; }
      newIn++; inField.add(p);
      /* founder addendum: a referral counts only when both sides confirm (A6); then the multiplier credits and the seat is taken */
      if (on && nc.refBy != null) {
        if (rng() < sc.A6) { if (nc.sq != null && squads[nc.sq].members.length < SQ.max_size) { squads[nc.sq].members.push(p); p.sq = nc.sq; squads[nc.sq].joinedNew.add(p.id); } }
        else p.refBy = null;
      }
    }
    /* settle: picks and outcomes */
    for (const p of inField) {
      const firstPick = p.st === 'new' ? (p.refBy != null ? C.refFirstPick : C.newFirstPick) / C.newEnters : C.pickIfEntered;
      const picked = rng() < Math.min(1, firstPick);
      p.st = picked ? (rng() < C.winShare ? 'won' : 'lost') : 'nopick';
    }
    /* streaks: kept when 60% of seats (at least 2) picked; a new member's first pick adds a streak week */
    const boost = new Map();
    if (on) {
      for (const s of squads) {
        if (!live(s)) continue;
        const picked = s.members.filter(m => inField.has(m) && m.st !== 'nopick').length;
        const need = Math.max(SQ.min_keep, Math.ceil(s.members.length * SQ.keep_share)), kept = picked >= need;
        const rec = s.members.some(m => s.joinedNew.has(m.id) && inField.has(m) && m.st !== 'nopick');
        s.streak = kept ? Math.min(SQ.max_streak, s.streak + 1 + (rec ? 1 : 0)) : (rec ? 1 : 0);
        s.joinedNew.clear();
        boost.set(s.id, SQ.per_active * picked + SQ.per_streak * s.streak + (topSquad === s.id ? SQ.top_bonus : 0));
      }
      const ls = squads.filter(live);
      topSquad = ls.length ? ls[Math.floor(rng() * ls.length)].id : null;
    }
    let multSum = 0, touched = 0;
    for (const p of inField) {
      const activeRefs = Pl.filter(q => q.refBy === p.id && inField.has(q) && q.st !== 'nopick').length;
      let m = 1 + 0.1 * Math.min(activeRefs, 20);
      if (on && boost.has(p.sq)) { m += boost.get(p.sq); touched++; }
      multSum += Math.min(3, m);
    }
    for (const p of Pl) if (!inField.has(p) && p.st !== 'out') p.st = 'out';
    const field = inField.size, kept = prevField.filter(p => inField.has(p)).length;
    const rung = C.ladder.reduce((r, at, i) => field >= at ? i : r, 0);
    weeks.push({ w, field, newIn, retention: prevField.length ? kept / prevField.length : 0, rung, mult: field ? multSum / field : 1, touched: field ? touched / field : 0, squads: on ? squads.filter(live).length : 0 });
    prevField = [...inField];
  }
  return weeks;
}

const on = { squad: true }, off = { squad: true };
for (const [k, a] of Object.entries(A)) { const key = k.split('_')[0]; on[key] = a.value; off[key] = a.off; }
const VARIANTS = [
  ['baseline', 'No mechanism (pooled return rates)', null],
  ['squad', 'Squad Streak, all assumptions', on],
  ['noA1', 'Squad Streak without A1 (founding uplift)', { ...on, A1: off.A1 }],
  ['noA2', 'Squad Streak without A2 (friends pulled in)', { ...on, A2: off.A2 }],
  ['noA3', 'Squad Streak without A3 (invite lift)', { ...on, A3: off.A3 }],
  ['noA4', 'Squad Streak without A4 (retention proxy)', { ...on, A4: off.A4 }],
  ['noA5', 'Squad Streak without A5 (nudge reactivation)', { ...on, A5: off.A5 }],
  ['lowA6', 'Squad Streak with A6 at 0.5 (half of links confirmed)', { ...on, A6: A.A6_link_confirm.low }],
  ['cohortOnly', 'Squad Streak, cohort rates only (every assumption off)', off],
  ['baselineRecent', 'No mechanism, W7 to W8 carryover (0.93)', { rates: 'recent' }],
  ['squadRecent', 'Squad Streak, all assumptions, W7 to W8 carryover', { ...on, rates: 'recent' }]
];

const q = (a, f) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(f * (s.length - 1)))]; };
const mean = a => a.reduce((t, x) => t + x, 0) / a.length;
const res = { generated: new Date().toISOString(), runs: RUNS, weeks: WEEKS, seed: P.seed, organic: +ORGANIC.toFixed(2), params: P, variants: {} };
for (const [key, label, v] of VARIANTS) {
  const all = []; for (let r = 0; r < RUNS; r++) all.push(season(1000 + r, v));
  const wk = WEEKS.map((w, i) => {
    const col = f => all.map(o => o[i][f]);
    const s = f => ({ mean: +mean(col(f)).toFixed(3), p10: +q(col(f), .1).toFixed(3), p90: +q(col(f), .9).toFixed(3) });
    const rungShare = C.ladder.map((_, k) => +(all.filter(o => o[i].rung >= k).length / RUNS).toFixed(3));
    return { w, field: s('field'), newIn: s('newIn'), retention: s('retention'), mult: s('mult'), touched: s('touched'), squads: s('squads'), rungShare };
  });
  res.variants[key] = { label, weeks: wk };
}
fs.writeFileSync(path.join(__dirname, 'results.json'), JSON.stringify(res, null, 1));
fs.writeFileSync(path.join(__dirname, '..', 'app', 'sim-results.js'), '/* Generated by teams/gold/sim/sim.js. */\nwindow.SIM=' + JSON.stringify(res) + ';\n');
const pad = (s, n) => String(s).padEnd(n);
console.log(`Gold sim, ${RUNS} runs, seeds mulberry32(1000 + r)`);
for (const [key, label] of VARIANTS) {
  const v = res.variants[key];
  console.log('\n' + label);
  console.log(pad('Week', 6) + pad('Field', 16) + pad('New in', 8) + pad('Retention', 11) + pad('Mult', 7) + pad('Touched', 9) + 'P(40+)');
  for (const x of v.weeks) console.log(pad(x.w, 6) + pad(`${x.field.mean.toFixed(1)} (${x.field.p10}-${x.field.p90})`, 16) + pad(x.newIn.mean.toFixed(1), 8) + pad((x.retention.mean * 100).toFixed(1) + '%', 11) + pad(x.mult.mean.toFixed(3), 7) + pad((x.touched.mean * 100).toFixed(0) + '%', 9) + (x.rungShare[1] * 100).toFixed(0) + '%');
}
