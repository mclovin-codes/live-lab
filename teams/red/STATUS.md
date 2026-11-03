# Team Red status

- Version: v1
- URL: https://claude.ai/artifact/1akESEwBdHdSF8dGRK877q
- What changed: First full build. Next snap, drive and next score markets, full board, props, grading, 24 simulated players plus real players via database.
- Testing next (v2): same-game parlays, cash out from live price, profit boost for win streaks, one-tap betting on next snap, quarter sprint leaderboard, season averages behind prop lines.
- Blocked or unverified:
  - The Artifact page contract says fetch to hosts outside its CDN list is blocked. Page tested against live ESPN from a local copy only, because the built-in browser is not signed in to claude.ai. If the published page shows "This viewer could not reach ESPN", the live feed needs a different route. Founder check needed.
  - DraftKings feed lagged the score by minutes (SEA -3, -166 with CHI up 7), so ESPN's per-play probabilities drive prices and DK is shown for reference.
  - ESPN lags TV, so someone watching TV can see a snap before the page does. Next snap stakes are capped at $100.
