# Team Red status

- Version: v8
- URL: https://mclovin-codes.github.io/live-lab/teams/red/
- What changed: Next snap markets removed. Drive, next score and player markets open only on a break board during ESPN-marked stoppages and close long before play resumes. Game lines refuse picks when DraftKings moves.
- Fairness: free data cannot see a snap in time (DraftKings moves about 10s after it, ESPN posts it about 25s after), so every timed market is offered only while the ball cannot be snapped. Stoppages measured tonight, stoppage start to next live ball: TV timeout 135 to 161s, end of quarter 206s, two-minute warning 168s, team timeouts 51 to 114s (not used). Board closes 100s after the stoppage starts, 600s at halftime, so at least 35s before play can resume.
- Lag: push delivery 0.1 to 0.3s. ESPN posts plays 19 to 49s after play time (median about 28).
- Market formulas and holds (v8, being replaced in v9):
  - Spread, total, moneyline: DraftKings live price and line from ESPN's push feed, shown exactly; DraftKings' own hold. If a score lands before DraftKings updates, ESPN's per-play win, cover and over probabilities are converted to a projected margin and total (normal model, sd 13.5 and 13 points times the square root of the game fraction left, Stern's method), with 4.76% hold.
  - Alternate spreads and totals, team totals, quarter and half totals, overtime, winning margin: the same normal model centred on the DraftKings-implied margin and total. Hold 4.76% two-way, 10% overtime, 12% winning margin.
  - Player props: box score so far plus a pace-blended projection of the rest, normal error; hold 5.5%. Anytime TD: Poisson rate by role; hold 10%.
  - This drive and next score: hand-written tables by field position and down (not yet fitted to data); hold 6% and 8%. v9 replaces these with tables fitted to nflverse play-by-play, 2023 to 2025, now downloaded.
- Testing next (v9): empirical drive and next score tables from nflverse, break board on a real stoppage (halftime is next).
- Blocked: nothing.
- Known limits: ESPN lags TV, so someone watching TV can see a snap before the page does; next snap stakes are limited to 100 Stack.
