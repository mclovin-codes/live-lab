# Team Red status

- Version: v10
- URL: https://mclovin-codes.github.io/live-lab/teams/red/
- What changed: Key numbers in alternate spreads, winning margin and overtime, fitted from 855 games. Break board confirmed on the real halftime stoppage.
- Fairness: free data cannot see a snap in time (DraftKings moves about 10s after it, ESPN posts it about 25s after). Next snap markets are not offered. Drive, next score and player markets open only on a break board during ESPN-marked stoppages and close 100s after the stoppage began (600s at halftime). Stoppage start to next live ball measured tonight: TV timeout 135 to 161s, end of quarter 206s, two-minute warning 168s. So the board shuts at least 35s before play can resume. A new live play or a DraftKings move shuts it at once. Game lines refuse a pick (placement fails) when DraftKings has just moved. No pick is voided after the fact.
- Lag: push delivery 0.1 to 0.3s. ESPN posts plays 19 to 49s after play time (median about 28).
- Market formulas and holds:
  - Spread, total, moneyline: DraftKings live line and price from ESPN's push feed, shown exactly, DraftKings' own hold. Fallback when a score lands before DraftKings updates: ESPN per-play win, cover and over probabilities turned into a projected margin and total, normal with sd 13.5 and 13 points times the square root of the game fraction left (Stern's model), hold 4.76%.
  - Alternate spreads, winning margin, overtime: discrete margin distribution centred on the DraftKings-implied margin, sd 13.5 times the square root of the game fraction left, times key-number weights fitted to regulation margins in 855 games (nflverse 2023 to 2025; 3 x2.05, 7 x1.54, tie x1.74, 14 x1.25, 17 x1.51, 9 and 11 x0.4), weights fading as the spread of outcomes narrows. Overtime = chance of a regulation tie. Hold 4.76% per side on spreads, 25% on overtime Yes and 1.5% on No, 12% on winning margin.
  - Alternate totals, team totals, quarter and half totals: normal model centred on the DraftKings-implied total. Hold 4.76%. No key-number fit for totals yet.
  - Drive result (TD, FG, no score): share of drives ending each way from the same field position, down, distance and half-time bucket, nflverse 2023 to 2025, thin cells blended toward field position and down. Hold 8%.
  - Next score this half (each team TD or FG, or none): nflfastR next-score probabilities averaged per cell over the same plays. Hold 12%.
  - Player props: box score so far plus a pace-blended projection of the rest, normal error; hold 5.5%. Anytime TD: Poisson rate by role; hold 10%. Not yet fitted to data.
- SportsGameOdds: would use it only for live player prop lines from real books, to replace the modelled props, through a small proxy the founder provisions (a static page cannot hold a key). Not requested yet.
- Testing next (v11): break board on TV timeouts in the second half, props fitted to nflverse, fourth quarter pricing check.
- Blocked: nothing.
- Known limits: ESPN lags TV, so someone watching TV can see a snap before the page does; next snap stakes are limited to 100 Stack.
