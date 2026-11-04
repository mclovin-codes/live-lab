# Team blue status

version: v15 (final; work continued in teams/one as m1 to m5)
url: https://mclovin-codes.github.io/live-lab/teams/blue/
what changed: final whistle CHI 34 SEA 17. 40 real picks graded at the final, 0 open, 0 voided. Probe through the final: 99 tries, 32 placed, 67 locked, 0 refused at placement, 0 after a snap; 124 snaps, median close 27s before the snap, 0 snapped first. Closing numbers in teams/one/STATUS.md.
probe on real snaps (1-Stack chains pick every 3s while the page was in front, Q3 to Q4 start): 60 tries, 22 placed, 38 locked (17 ball may be live, 11 line moved, 5 feed paused, 3 repricing, 2 book suspended), 0 failed at the placement check, 0 accepted after a snap. Every accepted pick was at least 26s before the next snap. All accepted picks came during timeouts and breaks; after runs and catches the window never opened, because ESPN lag tonight is 19 to 45s.
Q4 live check at 15:00, CHI 20 SEA 9: main lines exact DraftKings (SEA +348, CHI -523, SEA +6.5 -126, total 44.5). Alts and team totals consistent with the DK-implied mean margin of 6 and remaining sd 6.7. Winning margin bands sum to 1.000. Q4 total -115 both ways. Timed window open 22s after a timeout, locks at 0. Overtime: game logic, quarter-race OT label, 2nd-half lines through OT and settling are in place; untested live unless the game goes to OT.
model limit seen in Q4: a normal margin centred on the DK-implied mean understates the tails of a two-score lead (for example CHI 13+ at +430), because real outcomes cluster at 3 and 7 point steps.

## Phase 3: Crews (teams/blue/app, ef9cde3 and 5560ae9)
Site: https://mclovin-codes.github.io/live-lab/teams/blue/app/ (Crew tab). Results: https://mclovin-codes.github.io/live-lab/teams/blue/app/sim.html
- The mechanism (shared/crew.js, Rush.crew.RULES; the sim uses the same numbers):
  - Every crewmate adds +0.1x to every member's Prize Multiplier, up to +1.0x at 11 crewmates; a crew holds 12.
  - Alive: 3 or more members and the timer running. Someone new to Rush resets the timer to 7 days; a player already in the Field moving in adds 48 h. At zero the crew goes cold: members stay and the boost is off until someone new joins.
  - The boost that counts is the one held when the week settles. One crew a week.
- The first design was 72 h and 24 h. The sim showed it fails with this cohort: at 0.04 referral signups per entrant-week, a crew of five brings about 0.2 new people a week, so only 8 to 11% of the Field sat in a live crew at settle. At 7 days that is 18 to 24%.
- The app:
  - Crew page: countdown ring (alive, under 48 h, hurry under 12 h, cold), boost meter with the next member's step, invite (share sheet, copy link, the invite text in Rush words), members with NEW TO RUSH and SIM tags, what happened, the curve, the rules, leave with confirm.
  - A Crew tab whose badge shows hours left under 48 h, or "!" when cold.
  - Home: a crew card with the live countdown; the crew boost is added to Your multiplier (capped at 3x).
  - An invite link (crew.html?crew=CODE&cn=NAME&ref=WHO) lets a friend join on their own phone, counted as new to Rush if not yet in this week's Field.
  - Prototype: the crew lives in the browser, and SIM crewmates join 60 to 200 h apart so the timer can be watched.
- Sim (teams/blue/sim/crews-sim.mjs, 1,000 runs, seed 1000 + r with mulberry32, the same seed in each arm). Week 13 Field, mean (p10 to p90):
  - Baseline: 42.0 (35 to 49); reaches 40 in 67% of seasons.
  - Crews, cohort-supported only (adoption 0.55, recruiting lift 1.1, no return bonus): 42.5; average multiplier 1.09x against 1.01x; 61% of the Field in a crew.
  - Crews, recruiting x2: 45.1. With x2 and +5 points return: 46.2; reaches 40 in 86% of seasons.
  - Crews, recruiting x3 and +5 points return: 50.4.
- Reading: Crews barely grows the Field unless it changes how often people bring someone in. The countdown has to do that work; the cohort shows the referral multiplier alone moved recruiting about 10% (0.044 against 0.040).
- Assumptions not in the cohort file, each shown with and without on the page:
  - adoption 0.55 (anchored on 18 of 33 Week 8 entrants who came by a friend);
  - recruiting lift 2 or 3;
  - +5 points return for members of a live crew.

## NHL live, Nov 3 (app/game.html, 54ba7c9 and 2135b49)
Measured on 8 live NHL games, 1st period, 19:27 to 19:46 ET, recording ESPN fastcast (gp-hockey-nhl-<id>) and the REST summary side by side.
- The book does not suspend at every whistle. It keeps pricing the moneyline and total while the puck is live (moves about every 36 s, median) and marks them OFF only around goals and penalties.
- Share of game time the moneyline was posted (open): 95% overall; per game 100, 100, 100, 100, 95, 93 and 80%. One game posted nothing all period.
- OFF spells: 3 in 20 min. A goal (TB -520 to -1450) was OFF for 41 s. A probable goal (+180 to +165) was OFF for 57 s. A penalty plus TV timeout was OFF for 168 s.
- Intermission: the book reposts and keeps moving (DAL at WSH: period end 19:41:32, new prices at 19:41:55 and 19:44:11).
- The REST summary is no guide in hockey. It lags the push by minutes: MTL -410 on REST at 19:43, a price the push had moved to -345 at 19:32:33. It often reads OFF while the push has a price. Before the push, every NHL game sat on "Book suspended".
- Play feed lag: 17 to 60 s (outliers 166 s). Whistle to faceoff is 19 to 44 s. A whistle therefore reaches the page after the puck has dropped, so a play-driven window can never open on a whistle in hockey. That is why the book is the lock.
- What the page does now (hockey):
  - Game lines (moneyline, puck line, total at the book's line) open in play at the book's exact price and lock when it marks OFF.
  - Model-priced markets (alts, team totals, periods, props) open only in intermissions (960 s from the period-end stamp) and timeouts.
  - Backstops:
    - A goal or penalty stamped after the book's last price locks everything until the book reprices.
    - 5 min without a move while the clock runs locks everything ("Waiting for the book to move").
    - Lines stay locked until the push itself posts a moneyline, so a stale REST price is never sold.
- Placement check on the host build: PHI moneyline +550 placed in play at the book price into The Rush. WPG +240 placed into The Rush and a contest at once, each Stack down 1.
- Later fixes (bbb8e4e, fd61135):
  - The push copy now seeds from the fastcast checkpoint, so the current price shows on load. Before this, a page opened in an intermission sat on "Connecting to the live book": 42 of 48 probe tries.
  - NHL plays now come from the summary, because ESPN's core plays endpoint returns 400 for NHL. Until bbb8e4e the intermission window and the goal backstop never fired on NHL.
  - Penalties are matched by type.penaltyMinutes, since the play type is the infraction (Hooking, Roughing).
- Rink panel (558c94a):
  - Under the score: the rink with the last play's spot and this period's shot map in team colours (goals filled, saves hollow, blocks and misses faint). A Blocked play carries the blocking team, so it is drawn in the shooter's colour.
  - Which end each team attacks, from its shots.
  - Last play card with strength, and a power play banner.
  - Stats strip: shots, hits, faceoff %, PP, PIM.
  - Skaters and goalie on the ice.
- Win probability: ESPN has none for NHL (core probabilities returns 400, and the summary has no winprobability block). The panel now shows the market series instead, from the closing line and then each posted live moneyline with the margin removed, labelled "From the market". A live game never shows an empty panel.
- The Board: game.html writes rw.lastLive[LG+ID] = {h, a, ou, at} on each new posted moneyline, for Red's Live cards.
- Header (13d55c9, founder): NHL shows the scorebug, the last play card and the collapsed "Stats and on the ice" row only. No rink, no probability slide, no carousel. NFL and NBA keep the game card slide (b6b17cc).
- Real-time numbers, NHL, 8 games:
  - Play feed lag (wallclock to push, 371 plays): median 34 s, quartiles 24 and 50 s, p90 68 s, max 173 s. NFL on the 2nd ran 19 to 45 s, about 20 s typical, so NHL plays arrive later than NFL's.
  - Push delivery (ESPN timestamp to this page): median 0.18 s. The p90 of 8.8 s comes from bursts while the tab was in the background.
  - Book versus the real event: the only clean case is a penalty at 19:27:28 wallclock, which the book marked OFF at 19:28:16, 48 s later. The median play lag is 34 s, so the penalty backstop can lock before a relayed book suspension does.
  - Lock and reopen follow the book's OFF and repost within the push delivery time (well under a second); no wait on a play.
- Probe on the host build (bbb8e4e), WPG at MTL: 25 placed of 25 tries with a line open (19 in the intermission, 6 in play at the book price), 0 refused at confirm, 0 after a goal or penalty the book had not repriced. 4 period-market tries in play were locked as designed. 84 more tries hit "Feed paused" while the browser pane was hidden (the page stops polling when not visible).
- Answer to the founder: NHL is usable. Game lines are open about 95% of the clock at the book's price. Only alts, periods and props wait for intermissions.

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

## 2:20 AM addendum: contests in shared/state.js (Blue)
- Rush.contest API documented at the top of app/shared/state.js for Red (pages) and Gold (Home doors, Lounge threads).
- create, join (6-letter code, full invite link, the encoded part, or an object), leave, list, publicList (four house contests per week plus public ones you made), get, allows (dates, days, sports, games, markets), place (each contest has its own Stack), reload (only if the rules allow), me, ranks (scored on Units or record; ties split, broken by Units, or by earliest entry; SIM Field seeded by contest id so it is the same on every phone), results (final flag, winners, CSV text and filename for tracking off the app), card and importCard (friends share result cards so real people show in each other's Ranks without a server), encode, decode, link (contest.html?c=<base64url JSON>, about 340 characters).
- Rush.picks() stays weekly only; Rush.picks({contest:id}) lists a contest; grade.sync grades both.
- Tested in node: weekly flow unchanged; create; invite link decodes to the same contest; sport and market rules refuse picks with a reason; contest pick paid from its own Stack and graded; Ranks and CSV; a second phone joins from the link and imports a result card.
- Limit: no backend, so members see each other only through result cards; the rules and the SIM Field are identical everywhere.

## Contests: which store the pages use (b19a278)
- The pages (contests.html, contest.html, Home) run on Red's app/contest-kit.js (window.RC, localStorage rush-contests-v1). A contest there filters your weekly Slip by sports, days and markets.
- Blue does not provide Rush.contests. RC's manage actions (remove, void, close) write to its own store, so routing reads to Blue's store would make them do nothing.
- game.html now tags every pick live:true|false. Red passes it through playerPicks and checks it in marketOK (0492258), so a contest with live picks off excludes in-game picks. Red's contest.html also opens a Rush.contest ?c= link as an invite.
- Security: Red was sent the two contest.html XSS fixes (decode invite links strictly; coerce and escape results-link rows).

## Game page: the Field on this game (5f210ac)
- Popular tab, under the Field card: each SIM player's pick on this game, Lounge style ("Sweat Sam SIM took PHI +1.5 -110, Open"), plus your own picks on it. Every name opens player.html?u=<id> (Red's ids, f1 to f30; you are u=me).
- The Slip with a typed stake shipped earlier (02b8bf1).
- Tested in jsdom on PHI at DET (Week 9): 8 Field rows with links, 20 renders in 30 ms, no script errors.
- Next: first live check tonight. The first NBA tips are at 23:00 UTC (6:00 PM ET).
- Slip re-verified on the hosted code (PHI at DET): single and 2-leg parlay. Typed stake keeps focus, wins, returns and Stack after update as you type, the +10/+25/+50/+100/Max/Clear chips stay, a stake over the Stack shows "Only 1,000 Stack left", and the parlay places with both legs (+270 x60, Stack 940).

## 2:55 AM addendum, store side (16f652d)
- Rush.rules: norm (stake min and max with No max, odds min and max per line and per slip, typed Field size 2 to 1,000 and Stack 1 to 1,000,000, injury none/h1/full, joiner fields), check (stake and odds limits with a reason), result (a pick's contest result under injury protection; game lines never protected; parlays drop the injured leg and rescore).
- Placement: the Slip in game.html lists each contest the pick would count in, as "Counts in X" or "Not counted in X: Stake over the 30 maximum", live as you type. The pick still goes on the weekly Slip and is stamped ex:{contestId: why}.
- Injury exits: grade.sync tags graded props with inj {half, at, returned, who} from the play feed. Tested on CHI at SEA: L. Williams left in Q3 7:37 and did not return; J. Johnson left in Q4 13:06 and the "Injury Update ... has returned" line was found. NBA and NHL feeds have no injury text, so protection there applies only when the text says so.
- Rush.joiner: Cash App, Venmo, Apple Pay, Zelle, PayPal and a note. Cleaned to plain text (no links, no "$", no tags). A joiner card code hands them to the commissioner with no backend. NOTE text for the join form.
- Tests: 23 node checks pass; jsdom Slip with two RC contests (a 30 max, and one with game lines off) shows both reasons and stamps the pick; single and parlay regressions unchanged.
- Waiting on Red: keep the new keys in clean(), honour ex and Rush.rules.result in standings, the join form for fields. Until then RC still counts out-of-limit picks.

## One player, several contests (3:05 AM addendum), store, pill and pick sheet
- Payment handles removed per the founder ruling (468313e). Joiners keep an optional free-text note only.
- Store: every pick belongs to exactly one contest. The Rush weekly is contest 'rush', always first; its picks are the weekly picks, so Rush.picks() is unchanged. Every other contest the player owns or joined in Red's RC store gets its own wallet: its own Stack (that contest's Stack per entry), Slip, Reload rule and Units. Stacks are never summed. API: Rush.wallet.list/get/active/setActive/current/color/covers/allows/place/placeMany/picks/reload, documented at the top of state.js.
- Clocks per contest: opens 00:00 ET on its first day, settles 4 AM ET after its last day; its entry close is its own.
- Reasons, in the contest's name: "Friends League: Thursday only", "Puck Club: NHL only", "Props Club: game lines are off", "Props Club: live picks are off", "Friends League: Stake over the 50 maximum", "Friends League: only 460 Stack left".
- shared/nav.js: the contest pill on every page (colour dot, name, its own Stack, rank); tap for a sheet of every contest with its Stack, rank and clock; tap one to switch. Slips and Ranks badges follow the active contest.
- game.html pick sheet: a "Place in" row lists every contest with its Stack, the active one ticked. Each row has its own stake that follows the main stake until typed; rows a contest's schedule or rules exclude are greyed with the reason; the button reads "Lock -115 in 2 contests"; one confirm places all and the toast names each contest. The Field on this game shows your picks on it per contest with the dot.
- Tested: 12 node wallet checks; jsdom game page with The Rush, Friends League (500 Stack, max 50) and Puck Club (NHL only): Puck Club greyed "NHL only", 60 in Friends League refused "Stake over the 50 maximum", 30 in The Rush and 40 in Friends League placed in one confirm (Stacks 970 and 460, Puck Club untouched), focus kept in the row's stake field, no script errors.
- Design changes from the brief, and why:
  1. The pill sits at the top of each page in normal flow, not inside each page's own header. Five pages from three teams each have their own header, and several pin bars just above the tab bar. Normal flow never covers a page's controls. A page can host the pill in its header with an empty [data-rush-pill] element.
  2. Each row's stake follows the main stake until you type one. One field covers the common case (same stake everywhere); a per-contest number is one tap away.
  3. A row stays tickable before its contest's first day, when the game is on one of its days. You can pick Thursday's game for a Thursday-only league on Tuesday. Only the game's day matters.
- The Rush.contest model (wallet plus its own definitions) is removed. No page used it, and RC holds the definitions.
