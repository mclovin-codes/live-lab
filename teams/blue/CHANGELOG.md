# Team blue changelog

## v4
- Self-update: GitHub Pages caches the page for up to 10 minutes, so an open or reopened phone could sit on an old version. The page now checks every 45 seconds and reloads to the newest version, picks kept.

## v3
- Same-game parlays from any game line, alt, quarter line or prop. Payout trimmed 8% for related legs. Each leg tracks live, losing leg ends it, pushed leg drops out and the price resets. Cash out works.
- Open picks strip on top of the Live tab with live profit on each pick.
- Full-screen touchdown and field goal alerts, queued with win and loss stamps.
- Last play banner skips timeouts and quarter breaks.

## v2, GitHub Pages
- Complete standalone document, no artifact capabilities. Field is now 30 labelled simulated players, the same on every phone. Real-player sync removed per the brief change.
- Fixed stale feed: the browser was serving minutes-old ESPN plays under stale-while-revalidate. All fetches now skip the browser cache, and the newest play is pulled from the situation feed as soon as it appears.
- Drive Duel: profit on each drive ranked against the field, drives won counted.
- Rank alerts name who you passed. One $250 rebuy per quarter after busting, charged against score.
- Graded next play, chains, drive result and next score against real tonight plays: results matched the play text.

## v1, 8:42 PM ET
- First publish of Blue 42. $1,000 fake budget for the game.
- Live tab: one-tap next-snap markets (next play pass or run, moves the chains, drive result, next score), live sweats with cash out, your race against the rank above.
- Board tab: game lines, alt spreads, alt totals, team totals, quarter and first half lines, player props anchored on DraftKings targets from ESPN's propBets endpoint, milestone ladders, anytime TD.
- Pricing: ESPN per-play win and total probabilities into a live margin and total model, with book hold and American rounding. Lines lock when feeds go stale.
- Grading: pushes, voids, early clinch on overs, past-post void when a play had already started, box score for props, drive results and scoring plays for next-snap markets.
- Field: 11 labelled bots replayed deterministically from ESPN plays, so every viewer sees the same ladder, plus real players through the shared database.
