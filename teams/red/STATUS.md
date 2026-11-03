# Team Red status

## Weekly app (from 2026-11-03)
- Role: app/board.html and app/ranks.html, plus app/week-games.js (Red's shared loader for this week's games and the simulated Field, used by both pages).
- URLs: https://mclovin-codes.github.io/live-lab/app/board.html and https://mclovin-codes.github.io/live-lab/app/ranks.html
- Board (r1): every NFL, NBA and NHL game of Week 9 (Tue Nov 3 to Mon Nov 9) from ESPN scoreboards: NFL by week (week=9), NBA and NHL one dates=YYYYMMDD call per day. 112 games at first load (15 NFL, 47 NBA, 50 NHL). Grouped Live, Today, Later this week, Final; logos, records, score or start time in ET, main line (spread or puck line and O/U), broadcast, tap into game.html?league=&id=. League segmented control. Refresh every 15s when anything is live, else 60s.
- Ranks (r1): This week: your week card (rank, Units, games final), matchup with a simulated opponent (fixed for the week), today's race, the Field on Units with the top-3 prize line and your row pinned. Season: W-L record table with week dots. 30 simulated players pick every game of the week (seeded) and are graded on real ESPN finals as games end, so the Field moves all week and is the same on every phone.
- Shared state: reads window.RushState (Blue's shared/state.js) when it exists for your Stack, Units, picks and season record; until then shows a fresh entry. Tab bar: shared/nav.js when present, otherwise a matching fallback.
- r2: Ranks reads Blue's shared store (Rush.field, Rush.rival, Rush.season, Rush.me) so rank, matchup and season match Home and the tab badge; a Join the Field card shows before entry. Board and Ranks use Blue's nav.js tab bar. Red's own Field (graded on real finals) remains as a fallback when the store is missing.
- Not yet: duels beyond the weekly matchup; Blue's Field units are time-driven, not graded on real finals (Red offered week-games.js RW.field as a source).

# Team Red status: closing, after the final whistle

- Phase 2: base for the merged tool is Blue. Red delivered teams/one/inbox/1-key-number-margins.md (live in m6, checked), 2-break-board-card.md, probe.md, and REVIEW.md (vote: Blue). Red's own page v19 names no sportsbook. Stats, injuries and Lounge were not built on the Red page; the merged tool has Blue's.

- Version: v19 (final; Red now works on teams/one)
- URL: https://mclovin-codes.github.io/live-lab/teams/red/
- Final: Bears 34, Seahawks 17. Page shows FINAL, every pick graded, results card on top.
- What it is: the Live section of Bears at Seahawks inside Rush. Picks use the weekly Stack and land in the Slip. Units = profit and loss (1 Unit = 10 Stack). The Field (24 simulated players standing in for the real Field) ranks on live Units, plus a simulated head-to-head matchup. Free Reload. iOS-style build in Rush colours with team logos, player headshots, timeouts, win probability, field graphic, recent plays and a Watch button with provider links (no logins collected). Handoff notes for a Rush engineer: HANDOFF.md.

## Real time

- Feed: ESPN FastCast push (the websocket espn.com uses), a full game document plus JSON patches; polling with cache-busting only as a fallback.
- Push delivery, server stamp to page: 0.1 to 0.3s all game.
- ESPN publishes each play 19 to 85s after its own play time. Typical scrimmage plays 20 to 35s (median about 28); kickoffs and scores slowest (kickoffs 63, 70, 85s; touchdowns 50 to 61s).
- DraftKings live prices in the same feed tick about 9 to 18s after a snap (timed on the second-half kickoff and the next three plays: 18, 9, 10, 11s).
- Polling before the push feed, for comparison: plays 20 to 35s, summary 35 to 46s after play time.

## Fairness and acceptance

- No timed market is ever open while the ball can be snapped, and no pick is voided after the fact. A pick either places or the placement fails.
- Next snap markets: not offered. Free data cannot see a snap in time.
- Drive result, next score and player markets open only during ESPN-marked stoppages and lock at a fixed time after the stoppage began: commercial break 95s, end of the 1st or 3rd 150s, two-minute warning 120s, halftime 720s, touchdown 60s, field goal 55s (no after-score window in the last two minutes of a half). A new live play closes the window at once. Placement re-checks the market after the 1.5s lock and fails if it closed.
- Game lines (DraftKings prices) lock on the first DraftKings tick after a play and reopen when ESPN posts the play; placement fails while locked. A broadcast running less than 9 to 18s behind the field could see a play before this lock: the one remaining exposure.
- Every timed market shows its lock time with a countdown and a shrinking bar; locked prices stay visible with a lock glyph.

## Stoppage windows measured live (hosted page, monitor)

Each row: stoppage start (ESPN play time), ESPN post delay, picks open, how long before the next live ball they locked.

| Stoppage | Start | Posted | Open | Locked before play |
|---|---|---|---|---|
| Halftime (600s rule then) | 02:42:07 | | to 02:52:07 | 250s |
| Commercial break (100s rule) | 02:59:49 | +14s | 85s | 51s |
| Commercial break (100s rule) | 03:04:47 | +12s | 87s | 55s |
| Commercial break after TD (110s rule) | 03:14:40 | +33s | 77s planned | 85s planned (a DraftKings repricing tick closed it early; fixed in v15) |
| End of the 3rd (150s) | 03:24:37 | +71s | 78s | 96s |
| Commercial break (110s rule) | 03:31:41 | +15s | 94s | 10s: break lasted only 120s, so the rule was cut to 95s (v17) |
| Commercial break (95s) | 03:37:12 | +17s | 77s | 50s |
| After touchdown (60s) | 03:41:17 | +53s | 6s | closed before the next break |
| Commercial break (95s) | 03:42:51 | +14s | 80s | 87s |
| After touchdown (60s) | 03:52:20 | +61s | not opened | |
| After touchdown (60s) | 04:07:08 | +50s | 9s | 81s |
| Two-minute warning (120s) | 04:19:15 | +19s | 100s | 50s |

- Shortest stoppages seen: commercial break 120s, end of quarter 206s, two-minute warning 170s, halftime 850s, touchdown to kickoff 137s, field goal to kickoff 74s (late in the half). Under the final rules every window would have locked at least 25s before play.
- After-score windows are safe but short in practice: ESPN posts touchdowns 50 to 61s late, so the 60s window opened 0 to 9s.
- Picks were placed inside live windows (next score, a player prop, anytime TD during the 03:37 break) and graded correctly at the final.

## Market formulas and holds

- Spread, total, moneyline: DraftKings live line and price from the push feed, shown exactly; DraftKings' own hold. If a score lands before DraftKings updates: ESPN per-play win, cover and over probabilities converted to a projected margin and total (normal, sd 13.5 and 13 points times the square root of the game fraction left, Stern's model), hold 4.76% per side.
- Alternate spreads, winning margin, overtime: discrete margin distribution centred on the DraftKings-implied margin, sd 13.5 times the square root of the game fraction left, times key-number weights fitted to regulation margins in 855 games (nflverse 2023 to 2025: 3 x2.05, 7 x1.54, tie x1.74, 14 x1.25, 17 x1.51, 9 and 11 x0.4), weights fading as the spread of outcomes narrows. Overtime = chance of a regulation tie. Hold 4.76% per side on spreads, 25% on overtime Yes and 1.5% on No, 12% on winning margin.
- Alternate totals, team totals, quarter and half totals: normal model centred on the DraftKings-implied total, hold 4.76% per side. No key-number fit for totals.
- Drive result (TD, FG, no score): share of drives ending each way from the same field position, down, distance and time left in the half, nflverse 2023 to 2025 (124,178 scrimmage plays), thin cells blended toward field position and down. Hold 8%.
- Next score this half (each team TD or FG, or none): nflfastR next-score probabilities averaged per cell over the same plays; at halftime both receiving orders averaged. Hold 12%.
- Player props (pass yards, completions, rush yards, receiving yards, catches): box score so far plus a rest-of-game gamma distribution with mean and variance from nflverse 2023 to 2025 player games by stat, role rank, checkpoint and pace, scaled to time left; line at the median. Hold 7%. Milestones from the same distribution, hold 10%.
- Anytime TD: share of players in that role who scored a rushing or receiving TD the rest of the way, nflverse 2023 to 2025, scaled to time left. Hold 15%.
- Parlays: product of leg prices, then the profit cut 7% per extra leg (same-game correlation). Pushes and voids drop out.

## Grading checked on the real final

- Moneyline CHI -1400: won. Under 45: lost (51 total). Caleb Williams over 267.5 pass yards: lost (247). Roschon Johnson anytime TD: lost (no TD). Next score in the second half, CHI TD: lost (Seahawks scored first, 03:41:17). Next snap picks earlier in the night graded against the real plays. No open picks left after the final.
- Results card: place in the Field, Units on the game, record, Stack left, best hit, matchup gap, quarter races, Field leader.

## Notes

- Blocked: nothing.
- SportsGameOdds: would use it only for live player prop lines from real books, through a proxy the founder provisions (a static page cannot hold a key). Not requested.
- Licensed low-latency data (Sportradar or Genius) is the only way to offer next snap markets fairly; founder will evaluate after the game.
