# Team Red status

- Version: v11
- URL: https://mclovin-codes.github.io/live-lab/teams/red/
- What changed: Player props and anytime TD fitted to three seasons of nflverse player games, lines set at the median.
- Fairness: free data cannot see a snap in time (DraftKings moves about 10s after it, ESPN posts it about 25s after). Next snap markets are not offered. Drive, next score and player markets open only on a break board during ESPN-marked stoppages and close 100s after the stoppage began (600s at halftime). Stoppage start to next live ball measured tonight: TV timeout 135 to 161s, end of quarter 206s, two-minute warning 168s. So the board shuts at least 35s before play can resume. A new live play or a DraftKings move shuts it at once. Game lines refuse a pick (placement fails) when DraftKings has just moved. No pick is voided after the fact.
- Lag: push delivery 0.1 to 0.3s. ESPN posts plays 19 to 49s after play time (median about 28).
- Market formulas and holds:
  - Spread, total, moneyline: DraftKings live line and price from ESPN's push feed, shown exactly, DraftKings' own hold. Fallback when a score lands before DraftKings updates: ESPN per-play win, cover and over probabilities turned into a projected margin and total, normal with sd 13.5 and 13 points times the square root of the game fraction left (Stern's model), hold 4.76%.
  - Alternate spreads, winning margin, overtime: discrete margin distribution centred on the DraftKings-implied margin, sd 13.5 times the square root of the game fraction left, times key-number weights fitted to regulation margins in 855 games (nflverse 2023 to 2025; 3 x2.05, 7 x1.54, tie x1.74, 14 x1.25, 17 x1.51, 9 and 11 x0.4), weights fading as the spread of outcomes narrows. Overtime = chance of a regulation tie. Hold 4.76% per side on spreads, 25% on overtime Yes and 1.5% on No, 12% on winning margin.
  - Alternate totals, team totals, quarter and half totals: normal model centred on the DraftKings-implied total. Hold 4.76%. No key-number fit for totals yet.
  - Drive result (TD, FG, no score): share of drives ending each way from the same field position, down, distance and half-time bucket, nflverse 2023 to 2025, thin cells blended toward field position and down. Hold 8%.
  - Next score this half (each team TD or FG, or none): nflfastR next-score probabilities averaged per cell over the same plays. Hold 12%.
  - Player props (pass yards, completions, rush yards, receiving yards, catches): current box score plus a rest-of-game gamma distribution whose mean and variance come from nflverse 2023 to 2025 player games, by stat, role rank, checkpoint and pace, scaled to time left. Line at the median. Hold 7%. Milestones from the same distribution, hold 10%.
  - Anytime TD: share of players in that role (rush attempts or targets rank) who scored the rest of the way, nflverse 2023 to 2025, scaled to time left. Hold 15%.
- SportsGameOdds: would use it only for live player prop lines from real books, to replace the modelled props, through a small proxy the founder provisions (a static page cannot hold a key). Not requested yet.
- Testing next (v12): break board and DraftKings lock against real second-half snaps (monitor running), fourth quarter pricing check.
- Blocked: nothing.
- Known limits: ESPN lags TV, so someone watching TV can see a snap before the page does; next snap stakes are limited to 100 Stack.
