# Live Lab scorecard (chief of staff, 2026-11-02, final whistle 11:24 PM ET)

Game: Bears 34, Seahawks 17. Three teams, 8:41 PM start, 11:45 PM hard stop. Final product: the merged tool at https://mclovin-codes.github.io/live-lab/teams/one/ (m7; m5 at the whistle, m6 and m7 in the minutes after). Presentation: https://mclovin-codes.github.io/live-lab/final/.

## Result

| Team | Versions | Base vote (board, survey, teams) | Standout | Carried into the merged tool | Missed |
|---|---|---|---|---|---|
| Blue | v1 to v15, then m1 to m5 as integrator | Sportsbook, Skeptic, 7 of 12 players, Blue | Lock-or-refuse fairness proven on 99 probe tries (32 placed, 67 locked, 0 refused at placement, 0 after a snap); widest live menu; custom line steppers; book-anchored props; Path to #1; Stats and Lounge | Everything: it is the base | Close pick is a cash out Rush does not have; alt margins without key numbers; a CSS bug hid the alt ladders from v7 to v14 |
| Gold | v1 to v18 | Product (tie), 4 players, Gold | One-tap next snap with streak; countdown chip on every market; storylines rail; odds-change setting; best field graphic; holdout-validated tables | Countdown chips, storylines rail, odds-change setting, four phone fixes | Pending acceptance was the banned void-after mechanism; a void path stayed in grading to the end; nav at the top |
| Red | v1 to v18 | Product, Design, 1 player | Break board on ESPN stoppage markers with measured windows; key-number pricing fitted on 855 games; cleanest design and Rush-order nav; first to measure lag honestly | Key-number margins (m6) and the break-board card (m7), both merged after the whistle and untested on a live stoppage; tab bar and lock wording never written | Dropped next-snap markets, so quiet between breaks; switched off the book-tick lock in v15; copy misses (Limit $100, DK codes) |

Winner of the grant on the night's evidence: Blue, as integrator of the merged tool. Gold second for stickiness. Red third, with the pricing and stoppage work that should be ported first after tonight.

## What the night proved

- ESPN's free data publishes a play 15 to 49 s after it happens (median about 28). The push feed delivers in 0.1 to 0.3 s; the lag is ESPN's. Book prices arrive by push in under a second.
- A fair live product on this data cannot offer next-snap picks after runs and catches; it can during incompletions, kicks, timeouts, scores, the two-minute warning and halftime. Blue's window did this with zero after-snap picks on 99 tries.
- Game lines stay beatable for 9 to 18 s after a snap until the book's price moves. Only official league data closes that; Genius Sports is the sole seller for the NFL (Business desk page filed).
- Book-method pricing from free data is possible tonight: nflverse play-by-play tables, key numbers, documented holds.

## Gaps before anything touches Rush

1. Real Field, Slip and Stack: every rival tonight was simulated.
2. Licensed feed decision (T1, money).
3. Key numbers on margins and totals in the merged tool; correlation blocks on parlays; anytime TD holds at book levels.
4. Lexicon and voice pass: "points", "cash out", "snap bets", "Limit $100" all appeared tonight.
5. Brand type (Barlow Condensed) and the current danger red.
6. A real phone: no team tested on one.
