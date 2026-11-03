// Restart gaps by stoppage type: time from the snap of play A to the next snap B (time_of_day), classified by
// what happened on A and in the untimed rows between A and B. Usage: node fitgaps.js <dataDir> years...
const fs = require('fs'), zlib = require('zlib'), readline = require('readline'), path = require('path');
const fit = fs.readFileSync(path.join(__dirname, 'fit.js'), 'utf8');
eval(fit.slice(fit.indexOf('function parseLine'), fit.indexOf('const num')));
const [dataDir, ...years] = process.argv.slice(2);
const gaps = {};
const PRI = ['half', 'quarter', 'twomin', 'review', 'timeout', 'injury', 'score', 'turnover', 'punt', 'kickoff', 'incomplete', 'live'];
function classify(A, between) {
  const d = A.desc, t = A.type, bt = between.map(x => x.desc).join(' | ');
  const f = new Set();
  if (/END QUARTER 2|END OF HALF/i.test(bt)) f.add('half');
  if (/END QUARTER [134]|END QUARTER\b(?! 2)/i.test(bt)) f.add('quarter');
  if (/two-minute warning/i.test(bt) || /two-minute warning/i.test(d)) f.add('twomin');
  if (A.replay === '1' || /replay|challenge/i.test(bt)) f.add('review');
  if (/timeout #/i.test(bt) || A.timeout === '1') f.add('timeout');
  if (/injured/i.test(d) || /injured/i.test(bt)) f.add('injury');
  if (/TOUCHDOWN|field goal is GOOD|extra point is GOOD|TWO-POINT CONVERSION ATTEMPT.*SUCCEEDS|SAFETY/i.test(d) || t === 'extra_point') f.add('score');
  if (A.turnover) f.add('turnover');
  if (t === 'punt') f.add('punt');
  if (t === 'kickoff') f.add('kickoff');
  if (t === 'pass' && /incomplete/i.test(d)) f.add('incomplete');
  return PRI.find(k => f.has(k)) || 'live';
}
async function run(y) {
  const rl = readline.createInterface({ input: fs.createReadStream(path.join(dataDir, `play_by_play_${y}.csv.gz`)).pipe(zlib.createGunzip()), crlfDelay: Infinity });
  let H = null, buf = '', game = null, A = null, between = [];
  for await (const line of rl) {
    buf = buf ? buf + '\n' + line : line; const o = []; if (!parseLine(buf, o)) continue; buf = '';
    if (!H) { H = o; continue; }
    const g = k => o[H.indexOf(k)];
    const gid = g('game_id'); if (gid !== game) { game = gid; A = null; between = []; }
    const tod = g('time_of_day'), type = g('play_type'), desc = g('desc') || '';
    if (!tod || tod === 'NA') { between.push({ desc }); continue; }
    const snap = ['pass', 'run', 'punt', 'field_goal', 'kickoff', 'extra_point', 'qb_kneel', 'qb_spike', 'no_play'].includes(type);
    if (!snap || (type === 'no_play' && /timeout|two-minute|replay|challenge|injur|end quarter|end of half/i.test(desc) && !/(Shotgun)|pass|left|right|middle|kicks/i.test(desc.replace(/^([^)]*)s*/,'').slice(0,0)) && /^(([^)]*)s*)?(Timeout|Two-Minute|Two Minute|END|.*replay|.*challenge|.*injur)/i.test(desc))) { between.push({ desc }); continue; }
    const t = Date.parse(tod);
    if (A && !isNaN(t) && !isNaN(A.t)) {
      const gap = (t - A.t) / 1000;
      if (gap > 0 && gap < 1800) { const k = classify(A, between); (gaps[k] = gaps[k] || []).push(gap); }
    }
    A = { t, type, desc, timeout: g('timeout'), replay: g('replay_or_challenge'), turnover: g('interception') === '1' || g('fumble_lost') === '1' };
    between = [];
  }
}
(async () => {
  for (const y of years) await run(y);
  const q = (a, p) => a[Math.max(0, Math.floor(a.length * p) - (p === 0 ? 0 : 1))];
  const out = {};
  for (const k of PRI) { const a = (gaps[k] || []).sort((x, y) => x - y); if (!a.length) continue; out[k] = { n: a.length, min: Math.round(a[0]), p005: Math.round(q(a, .005)), p01: Math.round(q(a, .01)), p05: Math.round(q(a, .05)), p50: Math.round(q(a, .5)) }; }
  fs.writeFileSync(path.join(__dirname, 'gaps.json'), JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out));
})();
