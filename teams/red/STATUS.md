# Team Red status

- Version: v4
- URL: https://mclovin-codes.github.io/live-lab/teams/red/
- What changed: Big play takeovers with the swing on your picks, live bankroll and rank, fourth quarter bar, overtime and winning margin markets, second half total, final results card, screen stays awake. Fixed a load-time error present in v3.
- Verified: local copy against live ESPN at phone width. Grading checked for margin, overtime and second half with test scores. Takeover triggered with a test play; a real one has not fired yet. Fourth quarter bar and results card have not run in a real fourth quarter or final.
- Testing next (v5): bonus bet each quarter so a busted player stays in, fourth quarter pricing check, last-two-minutes markets, key numbers in margin pricing.
- Blocked: nothing.
- Known limits: DraftKings feed lagged the score by minutes (SEA -3, -166 with CHI up 7), so ESPN's per-play probabilities drive prices and DK is shown for reference. ESPN lags TV, so someone watching TV can see a snap before the page does; next snap stakes are capped at $100.
