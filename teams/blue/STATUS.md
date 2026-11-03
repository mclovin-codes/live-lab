# Team blue status

version: v15 (final; work continued in teams/one as m1 to m5)
url: https://mclovin-codes.github.io/live-lab/teams/blue/
what changed: final whistle CHI 34 SEA 17. 40 real picks graded at the final, 0 open, 0 voided. Probe through the final: 99 tries, 32 placed, 67 locked, 0 refused at placement, 0 after a snap; 124 snaps, median close 27s before the snap, 0 snapped first. Closing numbers in teams/one/STATUS.md.
probe on real snaps (1-Stack chains pick every 3s while the page was in front, Q3 to Q4 start): 60 tries, 22 placed, 38 locked (17 ball may be live, 11 line moved, 5 feed paused, 3 repricing, 2 book suspended), 0 failed at the placement check, 0 accepted after a snap. Every accepted pick was at least 26s before the next snap. All accepted picks came during timeouts and breaks; after runs and catches the window never opened, because ESPN lag tonight is 19 to 45s.
Q4 live check at 15:00, CHI 20 SEA 9: main lines exact DraftKings (SEA +348, CHI -523, SEA +6.5 -126, total 44.5). Alts and team totals consistent with the DK-implied mean margin of 6 and remaining sd 6.7. Winning margin bands sum to 1.000. Q4 total -115 both ways. Timed window open 22s after a timeout, locks at 0. Overtime: game logic, quarter-race OT label, 2nd-half lines through OT and settling are in place; untested live unless the game goes to OT.
model limit seen in Q4: a normal margin centred on the DK-implied mean understates the tails of a two-score lead (for example CHI 13+ at +430), because real outcomes cluster at 3 and 7 point steps.

## Fair play
- Gated markets: next play, 4th down go or kick, moves the chains, this drive, next score, anytime TD, player props, and Close pick on any of those.
- Open only from the moment ESPN shows the last play until the shortest gap to the next snap seen tonight for that play type, minus 3s. Hurry-up: 8s max.
- Placement check on every gated pick: fresh ESPN situation read; if its last play is new to the page, the pick is not placed. Also not placed if the book line jumped or a book price is suspended (DraftKings posts OFF).
- Measured: ESPN shows a play 17 to 22s after its wallclock. DraftKings ticks over the push feed about every 2s and posts OFF on some plays, but in 3 plays logged at the end of the half the OFF came 12 to 15s after the snap, so it is not a reliable snap signal tonight. Logging continues.
- Honest cost: after most runs and catches the next-play market never opens, because the page learns of the play after the next snap could already have happened.

## Market formulas and holds (v10)

Hold convention: each side's fair probability p is scaled to p x (1 + hold) and converted to American odds, rounded to the nearest 5 under 500, 10 under 1,000, 25 under 2,000, else 50. A side whose scaled probability exceeds 0.975, or a fair probability outside 0.012 to 0.985, is off the board.

| Market | Probability source | Hold |
|---|---|---|
| Moneyline, main spread, main total | Exact DraftKings live price from ESPN FastCast push (pickcenter). No model. | DraftKings' own |
| Alt spreads | Final home margin ~ Normal(mu, sd). mu = minus DK live home spread, shifted by sd x inverse-normal(DK no-vig cover probability). sd = max(floor, 13.4 x sqrt(fraction of game left)), floor 3.5 above 90 s left. Mean clamped to the current margin +/- (18 x fraction left + 1.5). Integer lines carry push probability. | 4.5% |
| Alt totals | Final total ~ Normal(DK live total shifted by sd x inverse-normal(DK no-vig over), sd = max(floor, 13.2 x sqrt(fraction left))), floored at points already scored. | 4.5% |
| Team totals | Team mean = (total mean +/- margin mean) / 2, sd = max(1.8, 9.4 x sqrt(fraction left)). | 5% |
| Quarter and half lines (Q, 1st half, 2nd half incl. OT) | Points so far plus remaining game mean scaled by the share of game time left in the span; sd = max(1.5, 8.6 x sqrt(span seconds left / 900)). | 5% |
| Player props (over/under, milestones) | Anchor: DraftKings pregame target from ESPN propBets. Mean = current stat + rate x fraction left, rate = blend of pregame target and in-game pace (pace weight min(0.6, 2 x elapsed^2)). sd from the nflverse fit (stat_spread). | 5% |
| Anytime TD | P(at least one TD) interpolated from the nflverse fit on 15,333 player-games by scrimmage yards, using the DraftKings pregame rushing plus receiving targets as projected yards, converted to a rate, scaled by time left, plus this drive's TD chance (drive_result) times the player's share when his team has the ball. | 9% |
| Next play pass or run | nflverse fit pass_rate by down, distance (8 buckets), yards to goal (1-10, 11-20, 21+), score margin (5 buckets) and seconds left in the half (3 buckets), times 0.96 because ESPN grades scrambles as runs while the fit counts them as passes. | 5% |
| Moves the chains | nflverse fit series_convert by down, distance, field position. | 6% |
| 4th down go or kick | nflverse fit fourth_go by distance, field position, late-and-trailing. | 6% |
| This drive TD, FG, no score | nflverse fit drive_result by down, distance, field position, half time left. | 7% |
| Winning margin (1-6, 7-12, 13+, tie) | Band probability from the alt-spread margin model with half-point continuity. | 10% |
| Next score (team and TD/FG, or none) | nflfastR next-score model probabilities averaged by state (next_score fit). | 10% |

Timed markets (next play, 4th down, chains, this drive, next score, anytime TD, player props) are open only inside the fair window and only after a placement check passes; see the fair-play section.

Fit source: nflverse play-by-play 2023, 2024, 2025 (regular season and playoffs, 147,926 rows). Cells under 40 plays fall back to a coarser bucket. Script and bucket notes in teams/blue/fit/.

## SportsGameOdds
What we would do with it: a small server function (Vercel or Cloudflare Worker) holds the key and polls SGO every 2 to 5 seconds for this event, then serves a public JSON of real book prices: player props with prices, alt spread and total ladders, team totals, and a no-vig consensus across books. The page would read that JSON instead of modeling those markets. It would not help timing, which still comes from the push feed. Needs founder approval for the key and a host for the function.

## Lift points for Rush engineers
FastCast doc plus polls fill S, player state in me, Field in ladder(), picks through placeChecked(), place() and placeParlay(), grading in settle() and gradeBet(), pricing in quote(), fitted tables in FT with tget(), fair window in timedGate() and closeAfter().

blocked: nothing. Field and matchup simulated and labelled SIM.

## Weekly app (Blue role): status
shipped: app/shared/state.js (store, API at top), app/shared/rush.css, app/shared/nav.js (five-tab bar), app/game.html v1.
game.html v1: game.html?league=nfl|nba|nhl&id=<ESPN event>. Header carousel (scoreboard with logos, records and possession, court or field graphic; win probability step chart), pills Odds, Box Score, Stats, Plays; Odds subtabs Popular (main lines, featured parlays, alt stepper), Game Lines, Alt Lines (spread and total steppers), Team Totals, Halves, Quarters or Periods, Player Props (book pregame targets, headshots). Box score with starters, bench and on-court markers. Stats: Game (last 5 with W or L, total-vs-line bars, game information, where to watch), Teams (compare bars), Players (game leaders). Plays feed with win percentage after each play. Picks and parlays go to the weekly Slip; finals graded through Rush.grade.sync().
fairness on game.html: pregame lines open until the start. Live, every market is stoppage-only (timeouts, commercial breaks, end of a period, halftime or intermission) and needs a posted book price; a placement check re-reads the play feed and refuses if a new play has landed. Per-possession NBA and NHL markets are not offered.
tested headless on live ESPN: NBA MIA at LAL (final), NFL BUF at MIN (pregame), NHL UTA at TOR (pregame); picks place into the weekly Slip. Not yet tested on a live NBA or NHL game in the browser (all NBA games had ended; the browser pane was hidden).

## NBA live probe, PHX at GS (401909919), Q4 9:00 to 7:26, 170 s, 24 new plays
- Works with the NFL shapes and the sport path swapped: core plays (wallclock, period, clock, possessionTeam, shootingPlay, scoreValue, coordinate), core probabilities (homeWinPercentage, spreadCoverProbHome, totalOverProb), site summary (boxscore, plays inline: 436, winprobability, pickcenter with live moneyline, spread and total).
- Missing for NBA: core situation (404) and core odds (404). Live book lines come only from the summary pickcenter.
- Lag, play wallclock to first seen: core plays median 43 s (min 2, max 95), probabilities 37 s (2 to 95), summary 44 s (21 to 96). ESPN posts NBA plays in bursts, so some land in 2 to 5 s and others wait 40 to 90 s.
- Push: the FastCast socket from a node test errored (browser untested); no NBA push data measured yet.
- What breaks if the NFL engine is pointed at NBA unchanged: no down and distance, so every next-snap, chains, drive and 4th-down market has no state; the fair window keyed on NFL play types never classifies a stoppage; propBets targets differ.
- What that means for fairness: an NBA possession takes about 14 s and the feed is 37 to 44 s late, so per-possession timed markets (next basket, next possession) cannot be locked in time and are not offered. Only stoppage windows can work: timeouts, quarter breaks, halftime, and possibly free-throw sequences, each needing its own fitted restart gap.
- Plan for NBA and NHL in game.html: game lines from the summary book block, alt spreads and totals and quarter or period lines from a margin model anchored on those lines and the probability feed, player props from the box score (points, rebounds, assists, threes; goals, shots), stoppage-only timed picks, graded on the final.

game.html v1.2 (00:44 ET): ESPN values escaped and validated before they reach the page (Gold security review); results-driven Field from Red's RW.field when week-games.js is loaded (time-driven walk otherwise); Red's games strip above the header; Board tab live-count badge in nav.js. Pregame: starts-in clock, matchup predictor ring with the projected side's price, injury report with return dates, weather, season leaders, injury letters on props, prop rows with season average and a Last 5 bar chart plus an over ladder on tap, last-5 totals card ending in Over and Under prices.
known gap: Season table in state.js still uses Blue's own SIM names while the weekly Field uses Red's when RW is present.

## End-to-end check on the host (01:40 ET, jsdom loading the real pages from GitHub Pages with live ESPN, one browser storage)
- Home: entry card, Enter gives 1,000 Stack, rank #25 of 31, season 0-0.
- Board: Week 9, 15 NFL games plus NBA and NHL by day, 144 game links.
- Game (JAX at BAL): full pregame book renders; JAX moneyline -470 placed for 25; Stack 975.
- Slips: Open (1), JAX moneyline -470, 25 staked.
- Ranks: you in the Field, matchup, Top 3 line.
- Lounge: week thread with game threads.
- Fixed on the way: game.html froze after the roster loaded (every player-name lookup rescanned the whole summary; 779 props per render). Lookups are memoized now; page stays responsive.
not yet checked: live mode and grading at a final on a real NBA or NHL game; first games tonight Tue Nov 3 from 7:00 PM ET.
known: Lounge uses Blue SIM names, Ranks uses Red SIM names.

## 2:10 AM addendum (Blue)
- Slip rebuilt in game.html: typed stake field (keeps focus, digits and one decimal), +10 +25 +50 +100 Max Clear chips, Wins in Units, Returns and Stack after update as you type, capped at your Stack (button says how much is left), price-move banner with better or worse, the Ask me / Higher only / Any change setting in the sheet, Lock or Accept button with the price and stake. Parlays use the same sheet. Remembers your last stake. Tested in jsdom on the host page: focus kept while typing 137.5, returns 275 at +100, over-cap refused, 40 Stack pick placed.
- Player names: The Field this week card on the game page (top 5, you, your matchup), each SIM name links to player.html?u=<id> (Red's page).
- Navigation proposal: keep the five tabs in Rush's own order (Home, Board, Slips, Ranks, Lounge), because that is the app players already know and the brief asks the game page to live inside it. What changes is the frame around a game: the Board tab carries a live count, the game page opens with Back to Board and the strip of other games on top, and the Slip opens as a bottom sheet on the game instead of a separate trip. No Tickets anywhere.
