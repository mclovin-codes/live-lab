// Fit empirical NFL lookup tables from nflverse pbp. Usage: node fit.js <dataDir> <outDir> years...
const fs = require('fs'), zlib = require('zlib'), readline = require('readline'), path = require('path');
const [dataDir, outDir, ...years] = process.argv.slice(2);
const MINN = 40;

function parseLine(line, out) { // returns true if complete, false if inside quotes
  let i = 0, cur = '', q = false; const L = line.length;
  for (; i < L; i++) {
    const c = line.charCodeAt(i);
    if (q) {
      if (c === 34) { if (line.charCodeAt(i + 1) === 34) { cur += '"'; i++; } else q = false; }
      else cur += line[i];
    } else if (c === 34) q = true;
    else if (c === 44) { out.push(cur); cur = ''; }
    else cur += line[i];
  }
  out.push(cur);
  return !q;
}
const num = s => (s === '' || s === 'NA') ? NaN : +s;

// bucketers
const B = {
  yl3: { edges: ['1-10', '11-20', '21+'], f: y => y <= 10 ? '1-10' : y <= 20 ? '11-20' : '21+' },
  ytg: { edges: ['1', '2', '3', '4-6', '7-9', '10', '11-15', '16+'], f: y => y <= 3 ? String(y) : y <= 6 ? '4-6' : y <= 9 ? '7-9' : y === 10 ? '10' : y <= 15 ? '11-15' : '16+' },
  yl7: { edges: ['1-5', '6-10', '11-20', '21-40', '41-60', '61-80', '81-99'], f: y => y <= 5 ? '1-5' : y <= 10 ? '6-10' : y <= 20 ? '11-20' : y <= 40 ? '21-40' : y <= 60 ? '41-60' : y <= 80 ? '61-80' : '81-99' },
  yl10: { edges: ['1-5', '6-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61-70', '71-80', '81-99'], f: y => y <= 5 ? '1-5' : y <= 10 ? '6-10' : y <= 80 ? `${Math.floor((y - 1) / 10) * 10 + 1}-${Math.floor((y - 1) / 10) * 10 + 10}` : '81-99' },
  sd5: { edges: ['<=-9', '-8..-4', '-3..3', '4..8', '>=9'], f: s => s <= -9 ? '<=-9' : s <= -4 ? '-8..-4' : s <= 3 ? '-3..3' : s <= 8 ? '4..8' : '>=9' },
  hs3: { edges: ['<=120', '121-300', '>300'], f: h => h <= 120 ? '<=120' : h <= 300 ? '121-300' : '>300' },
  hs5: { edges: ['<=60', '61-120', '121-300', '301-900', '>900'], f: h => h <= 60 ? '<=60' : h <= 120 ? '61-120' : h <= 300 ? '121-300' : h <= 900 ? '301-900' : '>900' },
  ytg4: { edges: ['1', '2', '3', '4-6', '7+'], f: y => y <= 3 ? String(y) : y <= 6 ? '4-6' : '7+' },
  yl4: { edges: ['1-10', '11-35', '36-50', '51-99'], f: y => y <= 10 ? '1-10' : y <= 35 ? '11-35' : y <= 50 ? '36-50' : '51-99' },
  down: { edges: ['1', '2', '3', '4'], f: d => String(d) },
  lt: { edges: ['0', '1'], f: x => x ? '1' : '0' },
  yds6: { edges: ['0-19', '20-39', '40-59', '60-79', '80-99', '100+'], f: y => y < 20 ? '0-19' : y < 40 ? '20-39' : y < 60 ? '40-59' : y < 80 ? '60-79' : y < 100 ? '80-99' : '100+' },
};

// hierarchical accumulator: keys = array of labels; vals = array of sums; tracks all prefix levels
function Acc(nv) { return { nv, m: new Map() }; }
function add(acc, keys, vals) {
  for (let l = 0; l <= keys.length; l++) {
    const k = keys.slice(0, l).join('|');
    let e = acc.m.get(k); if (!e) { e = { n: 0, s: new Float64Array(acc.nv) }; acc.m.set(k, e); }
    e.n++; for (let j = 0; j < acc.nv; j++) e.s[j] += vals[j];
  }
}
const r3 = x => Math.round(x * 1000) / 1000;
// Build nested output for leaf cells observed (raw n>0). If n<MINN, fall back to the nearest prefix with n>=MINN; f = levels dropped.
function emit(acc, depth, names, cnt) {
  // children index
  const kids = new Map();
  for (const k of acc.m.keys()) { if (k === '') continue; const ks = k.split('|'); const p = ks.slice(0, -1).join('|'); if (!kids.has(p)) kids.set(p, []); kids.get(p).push(ks[ks.length - 1]); }
  let leaves = 0, fb = 0, total = 0, collapsed = 0;
  const mk = (key, e, f) => { const c = {}; if (names === 'ARR') c.p = Array.from(e.s, x => r3(x / e.n)); else names.forEach((nm, j) => c[nm] = r3(e.s[j] / e.n)); c.n = e.n; if (f) c.f = f; return c; };
  function build(prefix, lvl) {
    const e = acc.m.get(prefix);
    if (lvl === depth) {
      leaves++; total += e.n; const ks = prefix.split('|'); let f = 0, src = prefix, use = e;
      while (use.n < MINN && f < depth) { f++; src = ks.slice(0, depth - f).join('|'); use = acc.m.get(src); }
      if (f) fb++;
      return { cell: mk(src, use, f), src, lvl: depth - f };
    }
    const out = {}; const res = [];
    for (const k of kids.get(prefix) || []) { const r = build(prefix ? prefix + '|' + k : k, lvl + 1); res.push(r); out[k] = r.node || r.cell; }
    // collapse: all children are cells whose source is this node or an ancestor, same source
    if (res.length && res.every(r => r.cell && !r.node && r.src === res[0].src && r.lvl <= lvl)) {
      collapsed++; const src = res[0].src; const c = mk(src, acc.m.get(src), lvl - res[0].lvl); return { cell: c, src, lvl: res[0].lvl };
    }
    return { node: out };
  }
  const r = build('', 0);
  cnt.leaves = leaves; cnt.fallback = fb; cnt.total_n = total; cnt.collapsed_nodes = collapsed;
  return r.node || r.cell;
}

const A = {
  pass: Acc(1), series: Acc(1), drive: Acc(2), ns: Acc(7), fourth: Acc(1),
};
const NSC = ['td_prob', 'fg_prob', 'safety_prob', 'no_score_prob', 'opp_td_prob', 'opp_fg_prob', 'opp_safety_prob'];
const NSN = ['td', 'fg', 'saf', 'none', 'otd', 'ofg', 'osaf'];
let lg = { rushYds: 0, rushTD: 0, recYds: 0, recTD: 0, rushPlays: 0, recPlays: 0 };
const pg = new Map(); // season|game|player -> {car, ryd, rtd, tgt, rec, recyd, rectd, att, pyd}
const getPG = (season, gid, pid) => { const k = season + '|' + gid + '|' + pid; let e = pg.get(k); if (!e) { e = { s: season, p: pid, car: 0, ryd: 0, rtd: 0, tgt: 0, rec: 0, recyd: 0, rectd: 0, att: 0, pyd: 0 }; pg.set(k, e); } return e; };
const rowCounts = {}; const counts = {};
const seriesResults = {};

async function readFile(y) {
  const file = path.join(dataDir, `play_by_play_${y}.csv.gz`);
  if (!fs.existsSync(file)) return;
  const rl = readline.createInterface({ input: fs.createReadStream(file).pipe(zlib.createGunzip()), crlfDelay: Infinity });
  let H = null, pend = null, n = 0, C;
  for await (let line of rl) {
    if (pend !== null) { line = pend + '\n' + line; pend = null; }
    const f = []; if (!parseLine(line, f)) { pend = line; continue; }
    if (!H) { H = {}; f.forEach((h, i) => H[h] = i); C = h => { if (!(h in H)) throw new Error('missing ' + h); return H[h]; };
      var I = {}; ['play_type','down','ydstogo','yardline_100','half_seconds_remaining','game_seconds_remaining','score_differential','game_id','fixed_drive_result','series_result','qb_kneel','qb_spike','two_point_attempt','pass','rusher_player_id','receiver_player_id','rushing_yards','receiving_yards','rush_touchdown','pass_touchdown','td_player_id','passer_player_id','passing_yards','complete_pass','sack','season','pass_attempt'].forEach(h => I[h] = C(h)); NSC.forEach(h => I[h] = C(h));
      readFile.I = I; continue; }
    const I2 = readFile.I; n++;
    const pt = f[I2.play_type], down = num(f[I2.down]), ytg = num(f[I2.ydstogo]), yl = num(f[I2.yardline_100]);
    const hs = num(f[I2.half_seconds_remaining]), gs = num(f[I2.game_seconds_remaining]), sd = num(f[I2.score_differential]);
    const kneel = f[I2.qb_kneel] === '1', spike = f[I2.qb_spike] === '1', two = f[I2.two_point_attempt] === '1';
    const season = f[I2.season], gid = f[I2.game_id];
    const hasState = down >= 1 && down <= 4 && ytg >= 1 && yl >= 1 && yl <= 99 && !isNaN(hs);
    const scrim = (pt === 'pass' || pt === 'run') && !kneel && !spike && !two;
    // 1 pass_rate
    if (hasState && scrim && !isNaN(sd) && f[I2.pass] !== '' && f[I2.pass] !== 'NA')
      add(A.pass, [B.down.f(down), B.ytg.f(ytg), B.yl3.f(yl), B.sd5.f(sd), B.hs3.f(hs)], [f[I2.pass] === '1' ? 1 : 0]);
    const snap = hasState && !two && !kneel && !spike && (pt === 'pass' || pt === 'run' || pt === 'punt' || pt === 'field_goal');
    // 2 series_convert
    const sr = f[I2.series_result];
    if (snap) seriesResults[sr] = (seriesResults[sr] || 0) + 1;
    if (snap && sr && sr !== 'NA' && sr !== 'End of half' && sr !== 'QB kneel')
      add(A.series, [B.down.f(down), B.ytg.f(ytg), B.yl7.f(yl)], [(sr === 'First down' || sr === 'Touchdown') ? 1 : 0]);
    // 3 drive_result
    const dr = f[I2.fixed_drive_result];
    if (snap && dr && dr !== 'NA')
      add(A.drive, [B.down.f(down), B.ytg.f(ytg), B.yl10.f(yl), B.hs3.f(hs)], [dr === 'Touchdown' ? 1 : 0, dr === 'Field goal' ? 1 : 0]);
    // 4 next_score
    if (hasState && !two) {
      const v = NSC.map(h => num(f[I2[h]]));
      if (v.every(x => !isNaN(x))) add(A.ns, [B.down.f(down), B.ytg.f(ytg), B.yl10.f(yl), B.hs5.f(hs)], v);
    }
    // 5 fourth_go
    if (hasState && down === 4 && !kneel && !spike && !two && (pt === 'pass' || pt === 'run' || pt === 'punt' || pt === 'field_goal') && !isNaN(gs) && !isNaN(sd))
      add(A.fourth, [B.ytg4.f(ytg), B.yl4.f(yl), B.lt.f(gs <= 600 && sd < 0)], [(pt === 'pass' || pt === 'run') ? 1 : 0]);
    // 6/7 player stats (pass/run plays only, no 2pt)
    if ((pt === 'pass' || pt === 'run') && !two) {
      const tdp = f[I2.td_player_id];
      const rid = f[I2.rusher_player_id];
      if (rid && rid !== 'NA') {
        const yds = num(f[I2.rushing_yards]) || 0, td = (f[I2.rush_touchdown] === '1' && tdp === rid) ? 1 : 0;
        lg.rushYds += yds; lg.rushTD += td; lg.rushPlays++;
        const e = getPG(season, gid, rid); e.car++; e.ryd += yds; e.rtd += td;
      }
      const cid = f[I2.receiver_player_id];
      if (pt === 'pass' && cid && cid !== 'NA') {
        const comp = f[I2.complete_pass] === '1';
        const yds = num(f[I2.receiving_yards]) || 0, td = (f[I2.pass_touchdown] === '1' && tdp === cid) ? 1 : 0;
        lg.recYds += yds; lg.recTD += td; lg.recPlays++;
        const e = getPG(season, gid, cid); e.tgt++; if (comp) e.rec++; e.recyd += yds; e.rectd += td;
      }
      const qid = f[I2.passer_player_id];
      if (pt === 'pass' && qid && qid !== 'NA' && f[I2.sack] !== '1' && f[I2.pass_attempt] === '1') {
        const e = getPG(season, gid, qid); e.att++; e.pyd += num(f[I2.passing_yards]) || 0;
      }
    }
  }
  rowCounts[y] = n;
}

function spread(stat, qual, val, edges, bf) {
  // season means per player-season over qualifying games (>=3 games)
  const ps = new Map();
  for (const e of pg.values()) if (qual(e)) { const k = e.s + '|' + e.p; let a = ps.get(k); if (!a) ps.set(k, a = []); a.push(val(e)); }
  const bk = {}; edges.forEach(b => bk[b] = { ss: 0, dof: 0, games: 0, players: 0, msum: 0, rawv: [] });
  for (const a of ps.values()) {
    if (a.length < 3) continue;
    const m = a.reduce((x, y) => x + y, 0) / a.length; const b = bk[bf(m)];
    b.players++; b.games += a.length; b.msum += m * a.length; b.dof += a.length - 1;
    for (const x of a) { b.ss += (x - m) ** 2; b.rawv.push(x); }
  }
  const out = { buckets: {} }; const pts = [];
  for (const k of edges) {
    const b = bk[k]; if (!b.games) continue;
    const mean = b.msum / b.games, sdw = Math.sqrt(b.ss / b.dof);
    const rm = b.rawv.reduce((x, y) => x + y, 0) / b.rawv.length;
    const sdr = Math.sqrt(b.rawv.reduce((x, y) => x + (y - rm) ** 2, 0) / (b.rawv.length - 1));
    out.buckets[k] = { mean: r3(mean), sd: r3(sdw), sd_raw: r3(sdr), n: b.games, players: b.players };
    if (mean > 0 && b.games >= MINN) pts.push([Math.log(mean), Math.log(sdw), b.games]);
  }
  // weighted least squares log(sd) = log(a) + b log(mean)
  let W = 0, X = 0, Y = 0, XX = 0, XY = 0;
  for (const [x, y, w] of pts) { W += w; X += w * x; Y += w * y; XX += w * x * x; XY += w * x * y; }
  const bb = (W * XY - X * Y) / (W * XX - X * X), aa = Math.exp((Y - bb * X) / W);
  out.fit = { a: r3(aa), b: r3(bb), formula: 'sd = a * mean^b (WLS on log bucket mean vs log within-player sd, weights=games)' };
  return out;
}

(async () => {
  for (const y of years) { const t = Date.now(); await readFile(y); console.error(y, rowCounts[y], (Date.now() - t) / 1000 + 's'); }
  const T = {}, meta = { seasons: Object.keys(rowCounts).map(Number), rows_per_season: rowCounts, min_cell_n: MINN, season_types: 'REG+POST', tables: {} };
  const c = {};
  T.pass_rate = emit(A.pass, 5, ['p'], c.pass = {});
  T.series_convert = emit(A.series, 3, ['p'], c.series = {});
  T.drive_result = emit(A.drive, 4, ['td', 'fg'], c.drive = {});
  T.next_score = emit(A.ns, 4, 'ARR', c.ns = {});
  meta.next_score_p_order = NSC;
  T.fourth_go = emit(A.fourth, 3, ['p'], c.fourth = {});
  // td_per_yard
  const yb = {}; B.yds6.edges.forEach(b => yb[b] = { n: 0, td: 0, any: 0, yds: 0 });
  let pgN = 0;
  for (const e of pg.values()) {
    const touches = e.car + e.rec; if (touches < 1) continue; pgN++;
    const yds = e.ryd + e.recyd, td = e.rtd + e.rectd, b = yb[B.yds6.f(yds)];
    b.n++; b.td += td; b.any += td > 0 ? 1 : 0; b.yds += yds;
  }
  const tdb = {}; for (const k of B.yds6.edges) { const b = yb[k]; tdb[k] = { mean_td: r3(b.td / b.n), p_anytd: r3(b.any / b.n), mean_yds: Math.round(b.yds / b.n * 10) / 10, n: b.n }; }
  T.td_per_yard = {
    rush_td_per_yard: +(lg.rushTD / lg.rushYds).toFixed(5), rec_td_per_yard: +(lg.recTD / lg.recYds).toFixed(5),
    rush: { td: lg.rushTD, yds: lg.rushYds, plays: lg.rushPlays }, rec: { td: lg.recTD, yds: lg.recYds, targets: lg.recPlays },
    by_scrimmage_yds: tdb, player_games: pgN,
  };
  T.stat_spread = {
    rush_yds: spread('rush', e => e.car >= 5, e => e.ryd, ['<20', '20-35', '35-50', '50-65', '65-80', '80-100', '100+'], m => m < 20 ? '<20' : m < 35 ? '20-35' : m < 50 ? '35-50' : m < 65 ? '50-65' : m < 80 ? '65-80' : m < 100 ? '80-100' : '100+'),
    rec_yds: spread('rec', e => e.tgt >= 2, e => e.recyd, ['<20', '20-35', '35-50', '50-65', '65-80', '80-100', '100+'], m => m < 20 ? '<20' : m < 35 ? '20-35' : m < 50 ? '35-50' : m < 65 ? '50-65' : m < 80 ? '65-80' : m < 100 ? '80-100' : '100+'),
    receptions: spread('recs', e => e.tgt >= 2, e => e.rec, ['<2', '2-3', '3-4', '4-5', '5-6', '6-7', '7+'], m => m < 2 ? '<2' : m < 3 ? '2-3' : m < 4 ? '3-4' : m < 5 ? '4-5' : m < 6 ? '5-6' : m < 7 ? '6-7' : '7+'),
    pass_yds: spread('pass', e => e.att >= 15, e => e.pyd, ['<175', '175-200', '200-225', '225-250', '250-275', '275+'], m => m < 175 ? '<175' : m < 200 ? '175-200' : m < 225 ? '200-225' : m < 250 ? '225-250' : m < 275 ? '250-275' : '275+'),
  };
  meta.tables = c;
  meta.series_result_counts_at_snaps = seriesResults;
  meta.buckets = Object.fromEntries(Object.entries(B).map(([k, v]) => [k, v.edges]));
  meta.dims = {
    pass_rate: ['down', 'ytg', 'yl3', 'sd5', 'hs3'], series_convert: ['down', 'ytg', 'yl7'], drive_result: ['down', 'ytg', 'yl10', 'hs3'],
    next_score: ['down', 'ytg', 'yl10', 'hs5'], fourth_go: ['ytg4', 'yl4', 'late_trailing(game_sec<=600 & score_diff<0)'],
  };
  meta.cell_format = 'leaf {p|td,fg|td..osaf, n}; if raw n<40 the cell holds the nearest coarser parent (dropping trailing dims) with f=levels dropped. Subtrees whose leaves all fall back to the same parent are collapsed into that single cell. Lookup: walk keys until you reach an object with an n field. Only observed keys are present; for a missing key use the cell of the nearest observed ancestor (not stored; use the coarser sibling or meta) .';
  T.meta = meta;
  const s = JSON.stringify(T);
  fs.writeFileSync(path.join(outDir, 'tables.json'), s);
  console.error('bytes', s.length);
})();
