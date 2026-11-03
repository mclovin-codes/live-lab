# Team Red status

- Version: v3
- URL: https://mclovin-codes.github.io/live-lab/teams/red/
- What changed: Duels (nearest simulated player takes the other side of your pick and the money moves between you), quarter sprint races, yardage milestones. Fixed stale down and distance by taking the freshest ESPN feed.
- Verified: v3 from a local copy at phone width against live ESPN, no console errors, no horizontal scroll. Grading checked against real plays from this game: next snap, drive results, next score, player props (over, under, push), anytime TD.
- Testing next (v4): next-snap streak ladder, big-play and scoring alert takeover, season averages behind prop lines, second half lines at halftime, end-of-game results card.
- Blocked: nothing.
- Known limits: DraftKings feed lagged the score by minutes (SEA -3, -166 with CHI up 7), so ESPN's per-play probabilities drive prices and DK is shown for reference. ESPN lags TV, so someone watching TV can see a snap before the page does; next snap stakes are capped at $100.
