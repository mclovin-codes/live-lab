# Team blue changelog

## v7
- Real time: found ESPN summary carries book prices stale by up to 40 cents (+119 versus real +151). Now the full game doc comes from the FastCast checkpoint, kept current by push patches, with a safety refresh every 20 seconds. Summary polling is only the fallback when push is down.
- Rush frame: page is the Live section of Bears at Seahawks. Stack, Units (1 U = 10 Stack), Slip, Board, Ranks, the Field. Arrive with a chosen weekly Stack and Units. Field carries simulated week-to-date Units and its own Stack, labelled SIM.
- Your matchup: named head-to-head opponent, score in Units, their open picks on this game with tail and fade.
- Beat the line on open picks. Free weekly Reload (1,000 Stack, Units keep counting). Path to the top 3, then #1. Top 3 prize line on Ranks. Close pick replaces cash out.
- New storage key, so everyone starts fresh on this version.

## v6
- Connected ESPN FastCast websocket from the browser (no key, works on GitHub Pages). It pushes JSON patches, including real DraftKings live moneyline, spread and total prices about every 2 seconds.
- Main markets show and lock the exact DraftKings live price. Alts, team totals, quarters and props reprice from those lines. When DraftKings pulls a price the button locks.
- All ESPN reads cache-busted. Measured on tonight plays: situation busted 20 to 25s after wallclock, unbusted 25 to 35s, summary 33 to 45s. Situation polled every 1.5s, push triggers immediate reads.
- True lag on the header, median of last 8 plays, tap for detail. Snap clock on Next play. Snap bets lock 4s after a sharp line jump to limit past-posting.

## v5
- Moment cards reorder the Live tab: 4th down go or kick (new market), 3rd down conversion, red zone, crunch time in the last 5 minutes of a one-score game.
- Three races at once: game, this quarter, this drive. Quarter wins counted, each quarter a fresh race.
- Path to #1: the likeliest single bets that catch the leader, stake prefilled. When leading, cash out all.
- Win probability chart with swing of the last play. Final card at the whistle.
- Returning to the page refreshes every feed at once. Prices beyond about -3900 go off the board.

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
