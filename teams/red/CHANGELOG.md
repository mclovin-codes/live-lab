# Changelog: Team Red, Redline

## v5 (2026-11-02, Q2)
- Real time: page takes ESPN's FastCast push feed over a websocket (checkpoint plus JSON patches). Polling is now only the fallback, with cache busting on plays, situation and probabilities.
- Measured lag shown in the header: PUSH (server stamp to page) and PLAY (ESPN wallclock to page). Last play card shows the same per play.
- Main spread, total and moneyline are DraftKings live prices from the push feed. If a score lands before DraftKings updates, the ESPN model prices them until it does.
- Bet delay down to 1.5 seconds, snap lock down to 0.7 seconds.
- Measured before the change, 150 seconds of polling: plays feed 20 to 35 seconds after wallclock, summary 35 to 46. Cache busting saved up to about 7 seconds on plays, nothing on summary.

## v4 (2026-11-02, Q2)
- Big plays take over the screen (touchdown, field goal, turnover, missed kick, fourth down, 25+ yards, third down sack) and show the swing in your live value.
- Bankroll and ladder rank move live: cash plus the current worth of open picks.
- Fourth quarter bar with what the trailing team needs. How it finishes section: overtime and winning margin.
- Second half total, no more scoring, near-certain moneylines removed.
- Final results card: place, record, duels, best hit, sprints won.
- Screen wake lock after first tap.
- Fix: load-time error from simulated players missing quarter data (was in v3). Summary feed can no longer roll the period back.

## v3 (2026-11-02, Q2)
- Duels: on lock, the simulated player nearest you on the ladder takes the other side for the same stake, and the result moves them.
- Quarter sprints: fresh profit race each quarter, past winners shown, sprint rank in the header.
- Yardage milestones (50+, 75+) on the props tab.
- Fix: down, distance and clock use whichever ESPN feed is furthest along. The situation feed was lagging the play feed by a play.
- Note: v2 shipped to GitHub Pages; the artifact URL is retired.

## v2 (2026-11-02, start of Q2)
- Standalone static page: complete HTML document, no platform capabilities. Artifact publishing stopped because the viewer blocks ESPN.
- Field is now you against 24 simulated players, because shared player data went with the capabilities.
- Cash out on game lines, team totals, props, drive and next score picks: live win chance times full payout, minus 6%. Two-tap confirm.
- Same game parlays: any non-snap market, one leg per market, priced below the straight multiple. A lost leg kills it at once, pushes and voids drop out and the price recalculates.
- Three straight wins earn a +25% profit boost token.
- One-tap betting on next snap markets, still behind the two-second delay.
- Rank-up toast when a settled pick moves you up the ladder.

## v1 (2026-11-02, Q1)
- Scoreboard with first-down marker on a field bar, data freshness indicator, version stamp and what-changed panel.
- Next snap markets (pass or run, moves the chains, 10+ yards), this drive result, next scoring play.
- Board: live spread, total, moneyline, alternate spreads and totals, team totals, quarter total and winner, first half total.
- Props: pass yards, completions, rush yards, rec yards, catches, anytime TD. Live projected from the box score.
- Sportsbook grading: pushes, voids, early settle on count stats, final-only on yardage. Two-second live bet delay with re-quote.
- Field: 24 seeded simulated players betting every real snap, plus real players through the Artifact database. Field split on each market, rival gap in the header.
