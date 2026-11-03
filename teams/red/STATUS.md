# Team Red status

- Version: v6
- URL: https://mclovin-codes.github.io/live-lab/teams/red/
- What changed: Page is now the Live section of one Rush event. Weekly Stack, Slip, Units, the Field ranked on Units, matchup opponent, Reload, beat-the-line. Early exit and boosts removed. HANDOFF.md added.
- Lag: push delivery 0.2 to 0.3 seconds from server stamp to page. Polling measured 20 to 46 seconds after play wallclock. Play-to-page over push: one sample, 11 seconds; more samples still to come.
- Verified: every tab scanned for words Rush bans, stake, Reload and arrival flows, phone width, no console errors. Not yet proven: a pick settling on a real play over push, fourth quarter pricing.
- Testing next (v7): real settles over push, play lag samples, fourth quarter pricing check, faster live tab between snaps.
- Blocked: nothing.
- Known limits: ESPN lags TV, so someone watching TV can see a snap before the page does; next snap stakes are capped at $100.
