// Builds teams/blue/app/sim.html from results.json (run crews-sim.mjs first). The page embeds the numbers, no fetch.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = dirname(fileURLToPath(import.meta.url));
const R = JSON.parse(readFileSync(join(dir, 'results.json'), 'utf8'));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const S = R.scenarios;
/* the chart: four series in a fixed order */
const SERIES = [['baseline', 'Baseline', '#8A99A8'], ['crews7_supported', 'Crews, cohort-supported', '#00BFFF'], ['crews7_lift2_keep', 'Crews, recruiting x2, +5 pts return', '#10B981'], ['crews_lift3_keep', 'Crews, recruiting x3, +5 pts return', '#F59E0B']];
const W = 640, H = 300, L = 44, B = 32, T = 14, RR = 16, y0 = 25, y1 = 60;
const X = i => L + i * (W - L - RR) / 4, Y = v => T + (1 - (v - y0) / (y1 - y0)) * (H - T - B);
const grid = [25, 30, 35, 40, 45, 50, 55, 60].map(v => `<line x1="${L}" x2="${W - RR}" y1="${Y(v)}" y2="${Y(v)}" class="${v === 40 ? 'rung' : 'gl'}"/><text x="${L - 8}" y="${Y(v) + 4}" class="ax" text-anchor="end">${v}</text>`).join('');
const xl = [9, 10, 11, 12, 13].map((w, i) => `<text x="${X(i)}" y="${H - 10}" class="ax" text-anchor="middle">W${w}</text>`).join('');
const band = k => { const w = S[k].weeks; return `<path d="M${w.map((x, i) => X(i) + ',' + Y(x.field.p90)).join('L')}L${w.slice().reverse().map((x, i) => X(4 - i) + ',' + Y(x.field.p10)).join('L')}Z" class="band" fill="${SERIES.find(s => s[0] === k)[2]}"/>`; };
const lines = SERIES.map(([k, , c]) => { const w = S[k].weeks; return `<path d="M${w.map((x, i) => X(i) + ',' + Y(x.field.mean)).join('L')}" fill="none" stroke="${c}" stroke-width="2"/>` + w.map((x, i) => `<circle cx="${X(i)}" cy="${Y(x.field.mean)}" r="4" fill="${c}" stroke="#121A23" stroke-width="2"><title>${esc(S[k].label)}, Week ${x.w}: ${x.field.mean} in the Field (p10 ${x.field.p10}, p90 ${x.field.p90})</title></circle>`).join(''); }).join('');
const ends = SERIES.map(([k, , c]) => { const v = S[k].weeks[4].field.mean; return { k, c, v }; }).sort((a, b) => b.v - a.v);
let lastY = -99; const labels = ends.map(e => { let y = Y(e.v) + 4; if (y - lastY < 13) y = lastY + 13; lastY = y; return `<text x="${W - RR + 4}" y="${y}" class="lab" fill="${e.c}">${e.v}</text>`; }).join('');
const chart = `<svg viewBox="0 0 ${W + 30} ${H}" role="img" aria-label="Field size by week, Weeks 9 to 13, baseline and three Crews scenarios">${grid}<text x="${L + 6}" y="${Y(40) - 5}" class="ax">first prize rung, 40 in</text>${band('baseline')}${band('crews7_lift2_keep')}${lines}${labels}${xl}</svg>`;
const legend = SERIES.map(([k, n, c]) => `<span><i style="background:${c}"></i>${esc(n)}</span>`).join('');
const pct = v => (v * 100).toFixed(0) + '%';
const table = k => { const s = S[k]; return `<div class="tw"><table><thead><tr><th>Week</th><th>Field (p10 to p90)</th><th>New in</th><th>Kept from last week</th><th>Avg multiplier</th><th>In a crew</th><th>Crew alive at settle</th><th>Reached 40 in</th></tr></thead><tbody>${s.weeks.map(x => `<tr><td>W${x.w}</td><td>${x.field.mean} <small>(${x.field.p10} to ${x.field.p90})</small></td><td>${x.newIn}</td><td>${(x.retention * 100).toFixed(1)}%</td><td>${x.avgMult.toFixed(2)}x</td><td>${pct(x.touched)}</td><td>${pct(x.aliveShare)}</td><td>${pct(x.rungShare[1])}</td></tr>`).join('')}</tbody></table></div>`; };
const order = ['baseline', 'crews7_supported', 'crews7_lift2', 'crews7_lift2_keep', 'crews_lift3_keep', 'crews_supported', 'crews_lift2', 'crews_lift2_keep'];
const w13 = k => S[k].weeks[4];
const summaryRows = order.map(k => `<tr${k === 'baseline' ? ' class="base"' : ''}><td>${esc(S[k].label)}</td><td>${w13(k).field.mean}</td><td>${(w13(k).field.mean - w13('baseline').field.mean >= 0 ? '+' : '') + (w13(k).field.mean - w13('baseline').field.mean).toFixed(1)}</td><td>${pct(w13(k).rungShare[1])}</td><td>${(S[k].weeks.reduce((a, x) => a + x.retention, 0) / 5 * 100).toFixed(1)}%</td><td>${w13(k).avgMult.toFixed(2)}x</td><td>${pct(w13(k).touched)}</td></tr>`).join('');
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#0B1118">
<title>Crews Simulation</title>
<style>
/* Crews simulation results: Weeks 9 to 13, with and without Crews, from the Week 8 cohort. */
:root{--bg:#0B1118;--card:#121A23;--card2:#1A2530;--line:rgba(255,255,255,.08);--fg:#fff;--mut:#9AA8B6;--dim:#66768A;--acc:#00BFFF;--font:-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",Inter,Roboto,system-ui,sans-serif;color-scheme:dark}
html,body{margin:0}*{box-sizing:border-box}body{background:var(--bg);color:var(--fg);font:15px/1.5 var(--font);font-variant-numeric:tabular-nums}
.wrap{max-width:860px;margin:0 auto;padding:calc(env(safe-area-inset-top,0px) + 20px) max(16px,env(safe-area-inset-right,0px)) 48px max(16px,env(safe-area-inset-left,0px));display:grid;gap:18px}
h1{margin:0;font:800 30px/1.15 var(--font);letter-spacing:-.02em;text-wrap:balance}h2{margin:0 0 6px;font:700 19px/1.25 var(--font)}p,li{color:var(--mut);max-width:68ch}p{margin:0}b{color:var(--fg)}
.card{background:var(--card);border-radius:16px;padding:16px;display:grid;gap:10px;min-width:0}
.big{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}.big div{background:var(--card2);border-radius:12px;padding:12px}.big b{display:block;font:800 26px/1.1 var(--font)}.big small{color:var(--mut);font-size:12px}
svg{display:block;width:100%;height:auto}.gl{stroke:var(--line)}.rung{stroke:#F59E0B;stroke-dasharray:4 4;opacity:.7}.ax{fill:var(--dim);font:11px var(--font)}.lab{font:700 12px var(--font)}.band{opacity:.12}
.leg{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:13px;color:var(--mut)}.leg i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;vertical-align:-1px}
.tw{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:13px;min-width:600px}th,td{text-align:right;padding:7px 8px;border-top:.5px solid var(--line);white-space:nowrap}th:first-child,td:first-child{text-align:left}th{color:var(--mut);font-weight:600}td small{color:var(--dim)}tr.base td{color:var(--mut)}
details summary{cursor:pointer;font-weight:600}ul{margin:0;padding-left:20px;display:grid;gap:6px}code{background:var(--card2);padding:1px 5px;border-radius:5px;font-size:12px}
a{color:var(--acc)}
</style></head><body><div class="wrap">
<div><p style="font-size:12px;letter-spacing:.08em;text-transform:uppercase">Team Blue · Phase 3 · ${R.runs.toLocaleString()} runs per scenario</p><h1>Crews: the Field, Weeks 9 to 13</h1></div>
<div class="card"><h2>What it says</h2>
<p>From the Week 8 cohort alone, with no new behaviour, the Field reaches <b>${w13('baseline').field.mean}</b> by Week 13. Crews on the cohort's own recruiting rate reaches <b>${w13('crews7_supported').field.mean}</b>, so the mechanism changes little until it changes how often people bring someone in. If the countdown doubles recruiting and a live crew keeps its members 5 points more often, the Field reaches <b>${w13('crews7_lift2_keep').field.mean}</b> and clears the 40 rung in <b>${pct(w13('crews7_lift2_keep').rungShare[1])}</b> of seasons (baseline ${pct(w13('baseline').rungShare[1])}). The design moved because of this run: a 72-hour timer left crews cold most of the week with this cohort's recruiting, so the live rules use 7 days.</p>
<div class="big"><div><b>${w13('baseline').field.mean}</b><small>Baseline Field, Week 13</small></div><div><b>${w13('crews7_supported').field.mean}</b><small>Crews, cohort-supported</small></div><div><b>${w13('crews7_lift2_keep').field.mean}</b><small>Crews, x2 recruiting, +5 pts return</small></div><div><b>${w13('crews_lift3_keep').field.mean}</b><small>Crews, x3 recruiting, +5 pts return</small></div></div></div>
<div class="card"><h2>Field size by week</h2><div class="leg">${legend}</div>${chart}<p style="font-size:12px">Lines are the mean over ${R.runs.toLocaleString()} seasons; shaded bands run from the 10th to the 90th percentile for the baseline and the x2 scenario. Hover a point for its numbers.</p></div>
<div class="card"><h2>Week 13, every scenario</h2><div class="tw"><table><thead><tr><th>Scenario</th><th>Field W13</th><th>vs baseline</th><th>Reached 40 in</th><th>Kept, W9 to W13 avg</th><th>Avg multiplier</th><th>In a crew</th></tr></thead><tbody>${summaryRows}</tbody></table></div></div>
${['baseline', 'crews7_supported', 'crews7_lift2_keep', 'crews_lift3_keep'].map(k => `<div class="card"><h2>${esc(S[k].label)}</h2><p>${esc(S[k].why)}</p>${table(k)}</div>`).join('')}
<div class="card"><h2>The mechanism, as simulated</h2><ul>
<li>Every crewmate adds <b>+${R.rules.per}x</b> to every member's Prize Multiplier, up to <b>+${R.rules.cap.toFixed(1)}x</b>; a crew holds ${R.rules.max}. Size counts members in that week's Field.</li>
<li>Alive: ${R.rules.minAlive} or more members and the timer running. Someone new to Rush resets the timer to <b>${R.rules.winNew / 24} days</b>; a player from the Field moving in adds <b>${R.rules.winMove} hours</b>. The boost that counts is the one held when the week settles.</li>
<li>Multiplier: the referral rule (1 + 0.1 per active referral) plus the crew boost, capped at 3x.</li></ul></div>
<div class="card"><h2>From the cohort file (COHORT-WEEK8.md)</h2><ul>
<li>Start: Week 8, 33 entrants (12 up or flat, 20 down, 1 with no pick) and 19 accounts outside the Field.</li>
<li>Back next week: ${R.cohort.backAfterWin} after a win, ${R.cohort.backAfterLoss} after a loss, ${R.cohort.backAfterNoPick} after no pick; reactivation ${R.cohort.reactivate}.</li>
<li>Signups ${R.cohort.signupsPerWeek} a week in all: personal referrals at ${R.cohort.referralPerEntrantWeek} per entrant-week, the rest organic (${R.organicSignupsPerWeek} a week). New players enter ${R.cohort.newEnters}, first pick ${R.cohort.newFirstPick} (referred ${R.cohort.refFirstPick}).</li>
<li>Pickers finishing up: ${R.cohort.winShare}. Ladder rungs at 40, 75, 125, 200.</li></ul></div>
<div class="card"><h2>Assumptions the cohort file does not support</h2><ul>
<li><b>Adoption 0.55</b> of the Field joins a crew in Week 9 (anchored on 18 of 33 Week 8 entrants who came by a friend), then 0.19 a week of those not yet in one; half the new players who come in on their own join an open crew.</li>
<li><b>Recruiting lift</b>: a crew member brings someone new at the cohort's referral rate times the lift. 1.1 is the only lift the file supports (multiplier era 0.044 against 0.040 a season); 2 and 3 are assumptions, shown separately.</li>
<li><b>Return bonus</b>: +5 points on coming back next week for members of a crew alive at settle. No data in the file; shown with and without.</li>
<li>Crews form among friends in groups of 3 to 6; a player stays in their crew across weeks; joins happen through the week at random hours.</li></ul></div>
<div class="card"><h2>Reproduce</h2><p><code>node teams/blue/sim/crews-sim.mjs</code> runs ${R.runs.toLocaleString()} seasons per scenario (seed for run r is 1000 + r, mulberry32, the same for every arm) and writes <code>results.json</code>; <code>node teams/blue/sim/make-page.mjs</code> builds this page.</p></div>
</div></body></html>`;
writeFileSync(join(dir, '..', 'app', 'sim.html'), html);
console.log('wrote app/sim.html', html.length);
