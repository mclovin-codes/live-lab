// Team Red growth simulation: Contests, Weeks 9 to 13, player by player, 1,000 runs.
// Run from the repo root:  node teams/red/sim/sim.mjs  [runs]
// Reads cohort behaviour from teams/red/sim/cohort.json only. Writes teams/red/sim/results.json and
// teams/red/app/sim-data.js (window.RED_SIM). Plain node, no dependencies.
//
// Seed scheme: Team Blue's (teams/blue/sim/crews-sim.mjs, season() with sc = null), so the baselines match.
// - Run r uses mulberry32(1000 + r), the same seed in every arm. The baseline loop below reproduces Blue's
//   baseline draw for draw: per week, one return draw per existing player (id order); then 7 days, each with
//   one draw for the day's time, a Poisson organic draw (Knuth, mean (4.5 - 0.04 x 22) / 7) and one referral
//   draw per player in the Field; then newcomers in time order, one entry draw each; then at settle one pick
//   draw per player in the Field and one result draw per picker.
// - Draws that exist only because Contests are on (creation, friend pulls, extra invites, 1st place, and every
//   draw of a player who joined through a contest-only invite) come from a side stream, mulberry32(1000 + r +
//   1,000,000), always after the baseline draw of the same step, so the baseline stream does not shift. It
//   shifts only where the mechanism changes who is in the Field (A4), which changes how many baseline draws a
//   week takes.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const COHORT = JSON.parse(readFileSync(join(HERE, 'cohort.json'), 'utf8'));
const val = k => { const x = COHORT[k]; if (!x || x.value === undefined) throw new Error('cohort.json is missing ' + k); return x.value; };

const RUNS = Math.max(1, parseInt(process.argv[2], 10) || 1000);
const WEEKS = [9, 10, 11, 12, 13];
const LADDER = COHORT.ladder;
const ST = val('start');
const C = {
  won: ST.won, lost: ST.lost, noPick: ST.no_pick, outside: ST.outside,
  backWin: val('return_after_win'), backLoss: val('return_after_loss'), backNoPick: val('return_after_no_pick'), recent: val('return_recent'),
  react: val('reactivation'), pickIfEntered: val('pick_if_entered'), win: val('win_share'),
  signups: val('new_signups_per_week'), ref: val('referral_per_entrant_week'), offset: val('organic_referral_offset_field'),
  newEnters: val('new_enters'), fp: val('first_pick_rate'), fpRef: val('referral_first_pick_rate'),
  senders: val('referral_senders_share'),
};
const ORGANIC = C.signups - C.ref * C.offset;

// The named assumptions. Arm b runs every lift at its neutral value; arm c at the defaults.
const ASSUMPTIONS = [
  { id: 'A1', name: 'Contest creation rate', value: C.senders, armB: C.senders, unit: 'share of free players in the Field who start a contest each week',
    why: 'Commissioners come from the players who already send invites, so the cohort referral senders share sets the rate. It is a cohort number, the same in both Contests arms.' },
  { id: 'A2', name: 'Member share lift', value: 1.5, armB: 1, unit: 'x how often a contest member sends invites',
    why: 'Every member, not only the commissioner, gets a Contest Boost that grows with contest size, so members have their own reason to invite.' },
  { id: 'A3', name: 'Contest invite lift', value: 1.3, armB: 1, unit: 'x how often an invite from a contest turns into a new player',
    why: 'The explainer card says what the contest is and how the prize works in Rush words, and the friend gets a concrete group to join instead of a bare app link.' },
  { id: 'A4', name: 'Contest member return lift', value: 0.08, armB: 0, unit: 'added to the return rate of contest members, capped at 0.97',
    why: 'A rivalry with friends and a rematch already set up: Run it back carries the contest into next week in one tap.' },
  { id: 'A5', name: 'Both sides confirm', value: 0.9, armB: 0.9, unit: 'chance a referral link or a contest join is confirmed by both players',
    why: 'The joiner picks who invited them (prefilled from the invite, one tap) and the inviter or commissioner confirms the entry with one tap; no codes. No cohort data, so it applies in both Contests arms and is also shown at 1.0 and 0.75.' },
];
const A = Object.fromEntries(ASSUMPTIONS.map(a => [a.id, a.value]));
const ARMS = [
  { key: 'baseline', label: 'Baseline, no Contests', contests: false },
  { key: 'cohort', label: 'Contests, cohort numbers only', contests: true, A1: A.A1, A2: 1, A3: 1, A4: 0, A5: A.A5 },
  { key: 'assumed', label: 'Contests with named assumptions', contests: true, A1: A.A1, A2: A.A2, A3: A.A3, A4: A.A4, A5: A.A5 },
];
// A5 shown at 1.0 and 0.75 for both Contests arms.
const A5_SENS = [1, 0.75].flatMap(v => [
  { key: 'cohort_A5_' + v, label: 'Arm b at A5 = ' + v, contests: true, A1: A.A1, A2: 1, A3: 1, A4: 0, A5: v },
  { key: 'assumed_A5_' + v, label: 'Arm c at A5 = ' + v, contests: true, A1: A.A1, A2: A.A2, A3: A.A3, A4: A.A4, A5: v },
]);
const ABLATIONS = [
  { key: 'noA2', label: 'Arm c without A2', contests: true, A1: A.A1, A2: 1, A3: A.A3, A4: A.A4, A5: A.A5 },
  { key: 'noA3', label: 'Arm c without A3', contests: true, A1: A.A1, A2: A.A2, A3: 1, A4: A.A4, A5: A.A5 },
  { key: 'noA4', label: 'Arm c without A4', contests: true, A1: A.A1, A2: A.A2, A3: A.A3, A4: 0, A5: A.A5 },
];

// Contest Boost: members in with a pick 4+ => +0.1x, 8+ => +0.2x, 15+ => +0.3x; 1st place in the contest +0.2x; cap 3x with referrals.
const boostFor = n => n >= 15 ? 0.3 : n >= 8 ? 0.2 : n >= 4 ? 0.1 : 0;

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function poisson(rng, l) { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= rng(); } while (p > L); return k - 1; }
const rungOf = n => LADDER.reduce((r, x, i) => n >= x.at ? i : r, 0);

function season(r, cfg) {
  const rng = mulberry32(1000 + r), mx = mulberry32(1000 + r + 1000000);
  const on = !!cfg.contests;
  const P = [];
  let id = 0;
  // m = joined through a contest-only invite: every draw for this player comes from the side stream.
  const add = (st, extra) => { const p = Object.assign({ id: id++, st, refBy: null, kids: [], contest: -1, memberLast: false, m: false, first: false, conf: true }, extra); P.push(p); return p; };
  for (let i = 0; i < C.won; i++) add('won');
  for (let i = 0; i < C.lost; i++) add('lost');
  for (let i = 0; i < C.noPick; i++) add('nopick');
  for (let i = 0; i < C.outside; i++) add('out');
  // Week 8 referral graph for the Prize Multipliers above 1.0x (1.35, 1.10, 1.10). No draws.
  // Existing Week 8 links are already credited in production, so they count as confirmed.
  const link = (a, b) => { P[b].refBy = P[a]; P[a].kids.push(P[b]); };
  link(20, 21); link(20, 22); link(20, 23); link(21, 24); link(25, 26);

  const contests = [];
  const join = (p, c) => { p.contest = c.id; c.members.push(p); };
  const out = { field: [], newP: [], ret: [], rung: [], mult: [], touched: [], contests: [], confRefs: [] };
  // A5: both sides confirm a referral link or a contest join (side-stream draw). The baseline arm counts every link, as Blue does.
  const confirm = () => on ? mx() < cfg.A5 : true;
  let prevField = P.filter(p => p.st !== 'out'), w9 = null, ret913 = 0;
  // extra-invite probability for a contest member on a day the baseline draw did not fire
  const dayRate = C.ref / 7, lift = on ? cfg.A2 * cfg.A3 : 1;
  const qExtra = Math.max(0, (Math.min(1, dayRate * lift) - dayRate) / (1 - dayRate));

  for (const w of WEEKS) {
    const t0 = (w - 9) * 168;
    const inField = new Set();
    // Returning and reactivating players (one draw each, Blue's order).
    for (const p of P) {
      if (p.st === 'new') continue;
      const bw = cfg.recent ? C.recent : C.backWin, bl = cfg.recent ? C.recent : C.backLoss;
      const pr = p.st === 'won' ? bw : p.st === 'lost' ? bl : p.st === 'nopick' ? C.backNoPick : C.react;
      const lim = on && p.memberLast ? Math.min(0.97, pr + cfg.A4) : Math.min(0.99, pr);
      if ((p.m ? mx : rng)() < lim) inField.add(p);
    }
    if (on) {
      // Run it back: contests live at last settle carry; creation among free players in the Field (A1); pull 2 to 5 friends.
      for (const p of P) if (p.contest >= 0 && !contests[p.contest].live) p.contest = -1;
      const order = [...inField].sort((a, b) => a.id - b.id);
      for (const p of order) {
        if (p.contest >= 0) continue;
        if (mx() >= cfg.A1) continue;
        const c = { id: contests.length, members: [], live: true }; contests.push(c); join(p, c);
        const free = order.filter(x => x.contest < 0), k = 2 + Math.floor(mx() * 4);
        for (let j = 0; j < k && free.length; j++) { const i = Math.floor(mx() * free.length); if (confirm()) join(free[i], c); free.splice(i, 1); }
      }
    }
    // New players by day: organic signups plus referral signups from every player in the Field.
    const newcomers = [];
    for (let d = 0; d < 7; d++) {
      const t = t0 + d * 24 + rng() * 24;
      const org = poisson(rng, ORGANIC / 7);
      for (let k = 0; k < org; k++) newcomers.push({ t, refBy: null, contest: -1, m: false });
      for (const p of inField) {
        const fired = (p.m ? mx : rng)() < dayRate;
        if (fired) newcomers.push({ t, refBy: p, contest: on ? p.contest : -1, m: p.m });
        else if (on && p.contest >= 0 && mx() < qExtra) newcomers.push({ t, refBy: p, contest: p.contest, m: true });
      }
    }
    let newIn = 0, confRefs = 0;
    for (const nc of newcomers.sort((a, b) => a.t - b.t)) {
      const p = add('new', { refBy: nc.refBy, m: nc.m, conf: false });
      if (nc.refBy) nc.refBy.kids.push(p);
      if ((p.m ? mx : rng)() >= C.newEnters) { p.st = 'out'; continue; }
      newIn++; inField.add(p);
      // The joiner picks the inviter (prefilled) and taps Join; the inviter or commissioner confirms. One A5 draw covers both.
      if (nc.refBy) { p.conf = confirm(); if (p.conf) confRefs++; }
      if (nc.contest >= 0 && p.conf && contests[nc.contest].live) join(p, contests[nc.contest]);
    }
    // Settle: pick and result draws.
    for (const p of inField) {
      const R = p.m ? mx : rng;
      const fp = p.st === 'new' ? (p.refBy ? C.fpRef : C.fp) / C.newEnters : C.pickIfEntered;
      const picked = R() < Math.min(1, fp);
      p.st = picked ? (R() < C.win ? 'won' : 'lost') : 'nopick';
      p.first = false;
    }
    const pickedIn = p => inField.has(p) && p.st !== 'nopick';
    const cIn = new Map();
    let live = 0;
    if (on) {
      for (const c of contests) {
        if (!c.live) continue;
        const ins = c.members.filter(m => m.contest === c.id && pickedIn(m));
        if (ins.length < 2) { c.live = false; continue; }
        live++; cIn.set(c.id, ins.length);
        const up = ins.filter(m => m.st === 'won'), from = up.length ? up : ins;
        from[Math.floor(mx() * from.length)].first = true;
      }
    }
    // Metrics: Prize Multiplier = 1 + 0.1 per referral in with a pick + 0.05 per referral's referral in + Contest Boost, cap 3.
    let multSum = 0, touched = 0;
    for (const p of inField) {
      let d = 0, e = 0;
      for (const k of p.kids) { if (!k.conf) continue; if (pickedIn(k)) d++; for (const g of k.kids) if (g.conf && pickedIn(g)) e++; }
      let m = 1 + 0.1 * Math.min(d, 20) + 0.05 * e;
      p.memberLast = false;
      if (on && p.contest >= 0 && contests[p.contest].live) {
        touched++; p.memberLast = true;
        if (pickedIn(p)) { m += boostFor(cIn.get(p.contest)); if (p.first) m += 0.2; }
      }
      multSum += Math.min(3, m);
    }
    for (const p of P) if (!inField.has(p) && p.st !== 'out') { p.st = 'out'; p.memberLast = false; }
    const field = inField.size, kept = prevField.filter(p => inField.has(p)).length;
    out.field.push(field); out.newP.push(newIn); out.ret.push(prevField.length ? kept / prevField.length : 0);
    out.rung.push(rungOf(field)); out.mult.push(field ? multSum / field : 1); out.touched.push(field ? touched / field : 0); out.contests.push(live); out.confRefs.push(confRefs);
    if (w === 9) w9 = new Set(inField);
    if (w === 13) { let k = 0; for (const p of w9) if (inField.has(p)) k++; ret913 = w9.size ? k / w9.size : 0; }
    prevField = [...inField];
  }
  out.ret913 = ret913;
  return out;
}

// Quantiles as Blue reports them (nearest lower rank), means to 1 or 3 decimals.
const qt = (a, f) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(f * (s.length - 1)))]; };
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const stat = (xs, dp = 3) => ({ mean: +mean(xs).toFixed(dp), p10: +(+qt(xs, 0.1)).toFixed(dp), p90: +(+qt(xs, 0.9)).toFixed(dp) });

function runArm(cfg) {
  const all = [];
  for (let r = 0; r < RUNS; r++) all.push(season(r, cfg));
  const col = (k, wi) => all.map(o => o[k][wi]);
  const weeks = WEEKS.map((w, wi) => {
    const rungs = col('rung', wi), med = qt(rungs, 0.5);
    return {
      week: w, field: stat(col('field', wi), 1), newPlayers: stat(col('newP', wi), 2), retention: stat(col('ret', wi)),
      rung: Object.assign(stat(rungs, 2), { median: med, label: LADDER[med].label, dist: LADDER.map((_, i) => +(rungs.filter(x => x === i).length / RUNS).toFixed(3)), reach: LADDER.map((_, i) => +(rungs.filter(x => x >= i).length / RUNS).toFixed(3)) }),
      reach40: +(rungs.filter(x => x >= 1).length / RUNS).toFixed(3),
      multiplier: stat(col('mult', wi)), touched: stat(col('touched', wi)), liveContests: stat(col('contests', wi), 2), confirmedReferrals: stat(col('confRefs', wi), 2),
    };
  });
  const last = weeks[weeks.length - 1];
  return { key: cfg.key, label: cfg.label, config: cfg, weeks, headline: { field13: last.field, retention13: last.retention, retention9to13: stat(all.map(o => o.ret913)), reach40: last.reach40 }, _raw: all };
}

const t0 = performance.now();
const arms = ARMS.map(runArm), ablations = ABLATIONS.map(runArm), a5 = A5_SENS.map(runArm);
// Recent scenario (Blue's baseline_recent): every return after a pick uses the W7 to W8 carryover; Contests layered the same way.
const armsRecent = ARMS.map(a => runArm(Object.assign({}, a, { key: a.key + '_recent', label: a.label + ', recent return 0.93', recent: true })));
const baseRecent = armsRecent[0]._raw;
const deltaRecent = arm => stat(arm._raw.map((o, r) => o.field[L] - baseRecent[r].field[L]), 2);
const base = arms[0]._raw, L = WEEKS.length - 1;
const delta = arm => stat(arm._raw.map((o, r) => o.field[L] - base[r].field[L]), 2);
const runtimeMs = Math.round(performance.now() - t0);
const strip = a => { const { _raw, ...rest } = a; return rest; };

const results = {
  meta: {
    title: 'Team Red Contests sim', generated: new Date().toISOString(), runs: RUNS, weeks: WEEKS, runtimeMs,
    cohortSource: COHORT.source || 'unknown', cohortRead: COHORT.read || null,
    organicSignupsPerWeek: +ORGANIC.toFixed(2),
    seedScheme: "Team Blue's scheme, so the baselines match: run r uses mulberry32(1000 + r) in every arm, and the baseline arm reproduces Blue's baseline draw for draw (returns, then 7 days of time, organic and referral draws, then newcomer entry, then pick and result at settle). Contest-only draws come from a side stream, mulberry32(1000 + r + 1,000,000), after the baseline draw of the same step.",
    ladder: LADDER,
    mechanism: [
      'Any player in the Field can create a contest (commissioner) at rate A1. Run it back carries it to next week while 2+ members are in with a pick.',
      'The commissioner pulls 2 to 5 players in the Field not yet in a contest. Invites from contest members go out as contest invites, and the new player joins that contest.',
      'Contest Boost for every member on the Prize Multiplier: 4+ members in with a pick +0.1x, 8+ +0.2x, 15+ +0.3x, 1st place in the contest +0.2x, all inside the 3x cap with the referral multiplier.',
      'With cohort numbers only, contest invites are the invites the cohort already sends, at the same rate, so arm b changes the Prize Multiplier and who is grouped, not who shows up. Every Field gain in arm c comes from A2 to A4.',
      'A referral counts only when both players confirmed the link (A5): the joiner picks who invited them, prefilled from the invite, and the inviter confirms with one tap. Joining a contest is two-sided the same way, so the Contest Boost and every member effect count confirmed members only. An unconfirmed signup still plays in the Field. The baseline counts every link, as the shared baseline does.',
      'Field is everyone entered that week, as in the shared baseline (about 97% of entrants make a pick). A player is in at most one contest at a time.',
    ],
  },
  cohort: Object.fromEntries(Object.entries(COHORT).filter(([k]) => !['note', 'ladder'].includes(k)).map(([k, x]) => [k, x && x.value !== undefined ? x.value : x])),
  assumptions: ASSUMPTIONS.map(a => ({ ...a, value: +a.value.toFixed(3), armB: +a.armB.toFixed(3) })),
  arms: Object.fromEntries(arms.map(a => [a.key, strip(a)])),
  deltaField13: { cohort: delta(arms[1]), assumed: delta(arms[2]) },
  recent: { returnRate: C.recent, why: 'W7 to W8 carryover, 26 of 28 came back; every return after a pick uses it (no pick stays 0.40, reactivation 0.18), as in Blue baseline_recent.',
    arms: { baseline: strip(armsRecent[0]), cohort: strip(armsRecent[1]), assumed: strip(armsRecent[2]) },
    deltaField13: { cohort: deltaRecent(armsRecent[1]), assumed: deltaRecent(armsRecent[2]) } },
  ablations: ablations.map(a => ({ key: a.key, label: a.label, field13: a.headline.field13, retention13: a.headline.retention13, reach40: a.headline.reach40, deltaField13: delta(a) })),
  a5Sensitivity: a5.map(a => { const l = a.weeks[L]; return { key: a.key, label: a.label, A5: a.config.A5, field13: a.headline.field13, retention13: a.headline.retention13, reach40: a.headline.reach40, deltaField13: delta(a), multiplier13: l.multiplier, touched13: l.touched, confirmedReferralsPerWeek: +mean(a.weeks.map(k => k.confirmedReferrals.mean)).toFixed(2) }; }),
};

writeFileSync(join(HERE, 'results.json'), JSON.stringify(results, null, 1));
mkdirSync(join(ROOT, 'app'), { recursive: true });
writeFileSync(join(ROOT, 'app', 'sim-data.js'), '/* Generated by teams/red/sim/sim.mjs. Do not edit. */\nwindow.RED_SIM = ' + JSON.stringify(results) + ';\n');

const pc = x => (x * 100).toFixed(1).padStart(5) + '%';
console.log(`Team Red Contests sim: ${RUNS} runs, cohort source ${results.meta.cohortSource}, organic ${results.meta.organicSignupsPerWeek}/week, ${runtimeMs} ms`);
for (const a of arms.concat(armsRecent)) {
  console.log(`\n${a.label}`);
  console.log(' wk   Field (p10-p90)   new   ret     40+    mult  touched  conf.refs');
  for (const k of a.weeks) console.log(` ${k.week}  ${k.field.mean.toFixed(1).padStart(5)} (${k.field.p10}-${k.field.p90})`.padEnd(26) + `${k.newPlayers.mean.toFixed(2).padStart(5)} ${pc(k.retention.mean)} ${pc(k.reach40)}  ${k.multiplier.mean.toFixed(3)} ${pc(k.touched.mean)}  ${k.confirmedReferrals.mean.toFixed(2)}`);
  console.log(` Week 13 Field ${a.headline.field13.mean} (${a.headline.field13.p10}-${a.headline.field13.p90}), Week 13 retention ${pc(a.headline.retention13.mean)}, Week 9 to 13 retention ${pc(a.headline.retention9to13.mean)}, reach 40 ${pc(a.headline.reach40)}`);
}
console.log(`\nWeek 13 Field vs baseline (paired): arm b ${results.deltaField13.cohort.mean} [${results.deltaField13.cohort.p10}, ${results.deltaField13.cohort.p90}], arm c ${results.deltaField13.assumed.mean} [${results.deltaField13.assumed.p10}, ${results.deltaField13.assumed.p90}]`);
for (const a of results.ablations) console.log(` ${a.label}: Week 13 Field ${a.field13.mean} (+${a.deltaField13.mean} vs baseline), reach 40 ${pc(a.reach40)}`);
for (const a of results.a5Sensitivity) console.log(` ${a.label}: Week 13 Field ${a.field13.mean} (+${a.deltaField13.mean}), reach 40 ${pc(a.reach40)}, mult ${a.multiplier13.mean.toFixed(3)}, touched ${pc(a.touched13.mean)}, confirmed referrals ${a.confirmedReferralsPerWeek}/week`);
