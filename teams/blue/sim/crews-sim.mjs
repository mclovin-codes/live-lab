// Rush growth simulation, Team Blue: Weeks 9 to 13 with and without Crews.
// Player by player, from the Week 8 cohort tendencies in COHORT-WEEK8.md (local file, numbers copied into C below).
// 1,000 runs; run r uses seed 1000 + r (mulberry32), the same seed for the baseline and the Crews arm.
//
// Usage: node crews-sim.mjs            -> prints the summary table and writes results.json next to this file
//        node crews-sim.mjs --runs 200 -> fewer runs
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/* ---------- cohort facts (COHORT-WEEK8.md, section 11 unless noted) ---------- */
const C = {
  start: { won: 12, lost: 20, noPick: 1, outside: 19 },   // W8: 33 entrants (11 up + 1 flat at 0 = 12, 20 down, 1 no pick); 52 - 33 accounts outside
  backAfterWin: 0.92, backAfterLoss: 0.77, backAfterNoPick: 0.40,  // tendencies 1, 2, 4
  reactivate: 0.18,                                         // tendency 5
  pickIfEntered: 32 / 33,                                   // W8 pickers / entrants
  winShare: 0.27,                                           // tendency 6
  signupsPerWeek: 4.5,                                      // tendency 8, all sources
  referralPerEntrantWeek: 0.04,                             // tendency 9, personal codes
  newEnters: 0.92, newFirstPick: 0.81, refFirstPick: 1.0,   // tendencies 7, 11
  ladder: [0, 40, 75, 125, 200],                            // section 9
};
/* W7 to W8 carryover (26 of 28 entrants came back, 0.93, section 3): the recent pace that the file's trend (+4 a week, 40 by Week 10) reflects */
const RECENT = Object.assign({}, C, { backAfterWin: 0.93, backAfterLoss: 0.93, backAfterNoPick: 0.40 });
/* organic signups exclude the personal-code ones the referral rate already produces (about 0.9 a week at W1-8 Field sizes) */
const ORGANIC = C.signupsPerWeek - C.referralPerEntrantWeek * 22;

/* ---------- Crews rules (the same numbers as teams/blue/app/shared/crew.js) ---------- */
const R = { per: 0.1, cap: 1.0, max: 12, minAlive: 3, winNew: 168, winMove: 48 };   // hours (first design was 72 and 24; see the 72 h scenarios)

/* two-sided linking (founder addendum, 10:05 PM): a crew membership counts only once both sides confirm.
   Assumption: 9 in 10 requests are confirmed, within 24 hours. The baseline arm is unchanged (its referral numbers are the observed ones). */
const CONFIRM = 0.9, CONFIRM_HOURS = 24;
/* ---------- assumptions the cohort file does not support (named; each scenario says which it uses) ---------- */
const SCEN = {
  baseline: null,
  baseline_recent: { baselineOnly: true, rates: 'recent', label: 'Baseline, W7 to W8 carryover', why: 'everyone in the Field comes back at 0.93 (26 of 28, W7 to W8) instead of the pooled 0.77 and 0.92; matches the +4 a week trend in the file' },
  crews7_recent: { adopt: 0.55, lift: 1.1, keep: 0, winNew: 168, winMove: 48, rates: 'recent', label: '7-day window, cohort-supported, W7 to W8 carryover', why: 'as the cohort-supported run, on the recent carryover' },
  crews7_lift2_keep_recent: { adopt: 0.55, lift: 2, keep: 0.05, winNew: 168, winMove: 48, rates: 'recent', label: '7-day window, recruiting x2, +5 pts return, W7 to W8 carryover', why: 'assumptions: recruiting x2 and +5 points return, on the recent carryover' },
  crews_supported: { adopt: 0.55, lift: 1.1, keep: 0, winNew: 72, winMove: 24, label: '72 h window (first design), cohort-supported only', why: 'adoption 0.55 = 18 of 33 Week 8 entrants came by a friend; recruiting lift 1.1 = referral signups per entrant-week in the multiplier era (0.044) over the season (0.040); no return bonus' },
  crews_lift2: { adopt: 0.55, lift: 2, keep: 0, winNew: 72, winMove: 24, label: '72 h window, recruiting x2', why: 'assumption: the countdown doubles how often a crew member brings someone in' },
  crews_lift2_keep: { adopt: 0.55, lift: 2, keep: 0.05, winNew: 72, winMove: 24, label: '72 h window, recruiting x2, +5 pts return', why: 'assumptions: recruiting x2, and a member of a crew that is alive at settle comes back 5 points more often' },
  crews7_supported: { adopt: 0.55, lift: 1.1, keep: 0, winNew: 168, winMove: 48, label: '7-day window, cohort-supported only', why: 'someone new to Rush keeps the boost 7 days, a mover 48 h; adoption 0.55 and lift 1.1 as above; no return bonus' },
  crews7_lift2_keep: { adopt: 0.55, lift: 2, keep: 0.05, winNew: 168, winMove: 48, label: '7-day window, recruiting x2, +5 pts return', why: 'assumptions: recruiting x2 and +5 points return for members of a crew alive at settle' },
  crews7_lift2: { adopt: 0.55, lift: 2, keep: 0, winNew: 168, winMove: 48, label: '7-day window, recruiting x2', why: 'assumption: the countdown doubles how often a crew member brings someone in' },
  crews_lift3_keep: { adopt: 0.55, lift: 3, keep: 0.05, winNew: 168, winMove: 48, label: '7-day window, recruiting x3, +5 pts return', why: 'assumptions: recruiting x3 and +5 points return; the top of the plausible range' },
};

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function poisson(rng, l) { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= rng(); } while (p > L); return k - 1; }

/* one season, Weeks 9 to 13 */
function season(seed, sc) {
  const rng = mulberry32(seed), K = sc && sc.rates === 'recent' ? RECENT : C, on = !!(sc && !sc.baselineOnly);
  let id = 0;
  const P = [];   // players: { id, st: 'won'|'lost'|'nopick'|'out', refBy, crew, isNew }
  const add = (st, extra) => { const p = Object.assign({ id: id++, st, refBy: null, crew: null }, extra); P.push(p); return p; };
  for (let i = 0; i < C.start.won; i++) add('won');
  for (let i = 0; i < C.start.lost; i++) add('lost');
  for (let i = 0; i < C.start.noPick; i++) add('nopick');
  for (let i = 0; i < C.start.outside; i++) add('out');
  /* the Week 8 referral graph: three players hold factors 1.35, 1.10, 1.10 (one with 3 referrals in plus a depth-2, two with 1) */
  const field0 = P.filter(p => p.st !== 'out');
  const refd = field0.slice(3, 8); refd[0].refBy = field0[0].id; refd[1].refBy = field0[0].id; refd[2].refBy = field0[0].id; refd[3].refBy = field0[1].id; refd[4].refBy = field0[2].id;

  const crews = [];   // { id, members: [player], joins: [{t, isNew}] }  t in hours from Week 9 open
  let crewId = 0;
  const wN = on && sc.winNew || R.winNew, wM = on && sc.winMove || R.winMove;
  const crewUntil = c => c.joins.reduce((u, j) => Math.max(u, j.t + (j.isNew ? wN : wM)), -1);
  const crewAlive = (c, t) => c.members.length >= R.minAlive && crewUntil(c) > t;
  const crewBoost = (c, t) => crewAlive(c, t) ? Math.min(R.cap, R.per * (c.members.length - 1)) : 0;
  const joinCrew = (p, c, t, isNew) => { if (c.members.length >= R.max) return false; if (rng() >= CONFIRM) return false; t += rng() * CONFIRM_HOURS; c.members.push(p); p.crew = c.id; c.joins.push({ t, isNew }); return true; };

  const weeks = [];
  let prevField = P.filter(p => p.st !== 'out');
  for (let w = 9; w <= 13; w++) {
    const t0 = (w - 9) * 168;
    const inField = new Set();
    /* returning and reactivating players */
    for (const p of P) {
      if (p.st === 'new') continue;
      const aliveCrew = on && p.crew != null && p.crewAliveAtSettle;
      const bonus = aliveCrew ? sc.keep : 0;
      const pr = p.st === 'won' ? K.backAfterWin : p.st === 'lost' ? K.backAfterLoss : p.st === 'nopick' ? K.backAfterNoPick : K.reactivate;
      if (rng() < Math.min(0.99, pr + bonus)) inField.add(p);
    }
    /* Crews: a returning player not yet in a crew joins one with the adoption rate, early in the week, as a mover (24 h);
       crews form among friends in groups of 3 to 6 */
    if (on) {
      const loose = [...inField].filter(p => p.crew == null && rng() < (w === 9 ? sc.adopt : sc.adopt * 0.35));
      while (loose.length) {
        const open = crews.filter(c => c.members.length < R.max && c.members.some(m => inField.has(m)));
        if (open.length && rng() < 0.4) { const c = open[Math.floor(rng() * open.length)]; joinCrew(loose.pop(), c, t0 + rng() * 48, false); continue; }
        const n = Math.min(loose.length, 3 + Math.floor(rng() * 4)), c = { id: crewId++, members: [], joins: [] };
        crews.push(c);
        for (let k = 0; k < n; k++) joinCrew(loose.pop(), c, t0 + rng() * 48, false);
      }
      /* crew members left out of this week's Field stay members (they keep the size count only if they play: size counts members in the Field) */
    }
    /* new players by day: organic signups, plus referral signups from every Field player; in Crews a crew member's
       referral rate is lifted, and the signup joins the recruiter's crew as someone new to Rush (72 h) */
    const newcomers = [];
    for (let d = 0; d < 7; d++) {
      const t = t0 + d * 24 + rng() * 24;
      const org = poisson(rng, ORGANIC / 7);
      for (let k = 0; k < org; k++) newcomers.push({ t, refBy: null, crew: null });
      for (const p of inField) {
        const inCrew = on && p.crew != null;
        const rate = C.referralPerEntrantWeek / 7 * (inCrew ? sc.lift : 1);
        if (rng() < rate) newcomers.push({ t, refBy: p.id, crew: inCrew ? p.crew : null });
      }
    }
    let newIn = 0;
    for (const nc of newcomers.sort((a, b) => a.t - b.t)) {
      const p = add('new', { refBy: nc.refBy, isNew: true });
      if (rng() >= C.newEnters) { p.st = 'out'; continue; }
      newIn++; inField.add(p);
      if (on) {
        let c = nc.crew != null ? crews[nc.crew] : null;
        if (!c && rng() < sc.adopt * 0.5) { const open = crews.filter(x => x.members.length < R.max); if (open.length) c = open[Math.floor(rng() * open.length)]; }
        if (c) joinCrew(p, c, nc.t, true);
      }
    }
    /* settle: picks, outcomes, multipliers held at settle (t0 + 168) */
    const tS = t0 + 168;
    let multSum = 0, touched = 0, crewAliveMembers = 0;
    for (const p of inField) {
      const firstPick = p.st === 'new' ? (p.refBy != null ? C.refFirstPick : C.newFirstPick) / C.newEnters : C.pickIfEntered;
      const picked = rng() < Math.min(1, firstPick);
      p.st = picked ? (rng() < C.winShare ? 'won' : 'lost') : 'nopick';
    }
    /* size that counts for a crew: members in this week's Field */
    const sizeAt = c => c.members.filter(m => inField.has(m)).length;
    for (const p of inField) {
      const activeRefs = P.filter(q => q.refBy === p.id && inField.has(q) && q.st !== 'nopick').length;
      let m = 1 + 0.1 * Math.min(activeRefs, 20);
      p.crewAliveAtSettle = false;
      if (on && p.crew != null) {
        const c = crews[p.crew], sz = sizeAt(c), alive = sz >= R.minAlive && crewUntil(c) > tS;
        touched++;
        if (alive) { m += Math.min(R.cap, R.per * (sz - 1)); p.crewAliveAtSettle = true; crewAliveMembers++; }
      }
      multSum += Math.min(3, m);
    }
    for (const p of P) if (!inField.has(p) && p.st !== 'out') { p.st = 'out'; p.crewAliveAtSettle = false; }
    const field = inField.size, kept = prevField.filter(p => inField.has(p)).length;
    const rung = C.ladder.reduce((r, at, i) => field >= at ? i : r, 0);
    weeks.push({ w, field, newIn, retention: prevField.length ? kept / prevField.length : 0, rung, avgMult: field ? multSum / field : 1, touched: field ? touched / field : 0, alive: field ? crewAliveMembers / field : 0, crews: on ? crews.filter(c => sizeAt(c) > 0).length : 0 });
    prevField = [...inField];
  }
  return weeks;
}

/* ---------- runs and summary ---------- */
const argRuns = process.argv.indexOf('--runs');
const RUNS = argRuns > 0 ? +process.argv[argRuns + 1] : 1000;
const q = (a, f) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(f * (s.length - 1)))]; };
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const out = { runs: RUNS, seeds: '1000 + run, mulberry32', cohort: C, organicSignupsPerWeek: +ORGANIC.toFixed(2), rules: R, scenarios: {} };
for (const [key, sc] of Object.entries(SCEN)) {
  const all = []; for (let r = 0; r < RUNS; r++) all.push(season(1000 + r, sc));
  const per = [9, 10, 11, 12, 13].map((w, i) => {
    const g = k => all.map(s => s[i][k]);
    return { w, field: { mean: +mean(g('field')).toFixed(1), p10: q(g('field'), .1), p50: q(g('field'), .5), p90: q(g('field'), .9) }, newIn: +mean(g('newIn')).toFixed(2), retention: +mean(g('retention')).toFixed(3), avgMult: +mean(g('avgMult')).toFixed(3), touched: +mean(g('touched')).toFixed(3), aliveShare: +mean(g('alive')).toFixed(3), crews: +mean(g('crews')).toFixed(1),
      rungShare: C.ladder.map((_, k) => +(g('rung').filter(x => x >= k).length / RUNS).toFixed(3)) };
  });
  out.scenarios[key] = { label: sc ? sc.label : 'Baseline, no mechanism', why: sc ? sc.why : 'cohort tendencies only (pooled W1 to W7 return rates)', assumptions: sc && !sc.baselineOnly ? { adopt: sc.adopt, lift: sc.lift, keep: sc.keep, rates: sc.rates || 'pooled' } : sc ? { rates: sc.rates } : null, weeks: per };
}
const dir = dirname(fileURLToPath(import.meta.url));
writeFileSync(join(dir, 'results.json'), JSON.stringify(out, null, 1));
for (const [k, s] of Object.entries(out.scenarios)) {
  console.log('\n' + s.label);
  console.log(' week  field(mean p10-p90)  new  retained  mult   touched  alive  P(40+)');
  for (const x of s.weeks) console.log(`  W${x.w}   ${String(x.field.mean).padStart(5)} (${x.field.p10}-${x.field.p90})`.padEnd(30) + `${String(x.newIn).padStart(4)}  ${(x.retention * 100).toFixed(1).padStart(6)}%  ${x.avgMult.toFixed(2)}x  ${(x.touched * 100).toFixed(0).padStart(4)}%  ${(x.aliveShare * 100).toFixed(0).padStart(4)}%  ${(x.rungShare[1] * 100).toFixed(0).padStart(4)}%`);
}
