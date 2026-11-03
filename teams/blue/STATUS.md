# Team blue status

version: v10
url: https://mclovin-codes.github.io/live-lab/teams/blue/
what changed: no voids. Timed picks and props are locked, or they fail at placement after a fresh check of the newest play and the book. Windows close at the shortest snap gap seen tonight per play type, minus 3s. Timed markets priced from nflverse tables fitted on 2023 to 2025 play-by-play.

## Fair play
- Gated markets: next play, 4th down go or kick, moves the chains, this drive, next score, anytime TD, player props, and Close pick on any of those.
- Open only from the moment ESPN shows the last play until the shortest gap to the next snap seen tonight for that play type, minus 3s. Hurry-up: 8s max.
- Placement check on every gated pick: fresh ESPN situation read; if its last play is new to the page, the pick is not placed. Also not placed if the book line jumped or a book price is suspended (DraftKings posts OFF).
- Measured: ESPN shows a play 17 to 22s after its wallclock. DraftKings ticks over the push feed about every 2s and posts OFF on some plays, but in 3 plays logged at the end of the half the OFF came 12 to 15s after the snap, so it is not a reliable snap signal tonight. Logging continues.
- Honest cost: after most runs and catches the next-play market never opens, because the page learns of the play after the next snap could already have happened.

## Market formulas and holds (v10)

Hold convention: each side's fair probability p is scaled to p x (1 + hold) and converted to American odds, rounded to the nearest 5 under 500, 10 under 1,000, 25 under 2,000, else 50. A side whose scaled probability exceeds 0.975, or a fair probability outside 0.012 to 0.985, is off the board.

| Market | Probability source | Hold |
|---|---|---|
| Moneyline, main spread, main total | Exact DraftKings live price from ESPN FastCast push (pickcenter). No model. | DraftKings' own |
| Alt spreads | Final home margin ~ Normal(mu, sd). mu = minus DK live home spread, shifted by sd x inverse-normal(DK no-vig cover probability). sd = max(floor, 13.4 x sqrt(fraction of game left)), floor 3.5 above 90 s left. Mean clamped to the current margin +/- (18 x fraction left + 1.5). Integer lines carry push probability. | 4.5% |
| Alt totals | Final total ~ Normal(DK live total shifted by sd x inverse-normal(DK no-vig over), sd = max(floor, 13.2 x sqrt(fraction left))), floored at points already scored. | 4.5% |
| Team totals | Team mean = (total mean +/- margin mean) / 2, sd = max(1.8, 9.4 x sqrt(fraction left)). | 5% |
| Quarter and half lines (Q, 1st half, 2nd half incl. OT) | Points so far plus remaining game mean scaled by the share of game time left in the span; sd = max(1.5, 8.6 x sqrt(span seconds left / 900)). | 5% |
| Player props (over/under, milestones) | Anchor: DraftKings pregame target from ESPN propBets. Mean = current stat + rate x fraction left, rate = blend of pregame target and in-game pace (pace weight min(0.6, 2 x elapsed^2)). sd from the nflverse fit (stat_spread). | 5% |
| Anytime TD | P(at least one TD) interpolated from the nflverse fit on 15,333 player-games by scrimmage yards, using the DraftKings pregame rushing plus receiving targets as projected yards, converted to a rate, scaled by time left, plus this drive's TD chance (drive_result) times the player's share when his team has the ball. | 9% |
| Next play pass or run | nflverse fit pass_rate by down, distance (8 buckets), yards to goal (1-10, 11-20, 21+), score margin (5 buckets) and seconds left in the half (3 buckets), times 0.96 because ESPN grades scrambles as runs while the fit counts them as passes. | 5% |
| Moves the chains | nflverse fit series_convert by down, distance, field position. | 6% |
| 4th down go or kick | nflverse fit fourth_go by distance, field position, late-and-trailing. | 6% |
| This drive TD, FG, no score | nflverse fit drive_result by down, distance, field position, half time left. | 7% |
| Next score (team and TD/FG, or none) | nflfastR next-score model probabilities averaged by state (next_score fit). | 10% |

Timed markets (next play, 4th down, chains, this drive, next score, anytime TD, player props) are open only inside the fair window and only after a placement check passes; see the fair-play section.

Fit source: nflverse play-by-play 2023, 2024, 2025 (regular season and playoffs, 147,926 rows). Cells under 40 plays fall back to a coarser bucket. Script and bucket notes in teams/blue/fit/.

## SportsGameOdds
What we would do with it: a small server function (Vercel or Cloudflare Worker) holds the key and polls SGO every 2 to 5 seconds for this event, then serves a public JSON of real book prices: player props with prices, alt spread and total ladders, team totals, and a no-vig consensus across books. The page would read that JSON instead of modeling those markets. It would not help timing, which still comes from the push feed. Needs founder approval for the key and a host for the function.

## Lift points for Rush engineers
FastCast doc plus polls fill S, player state in me, Field in ladder(), picks through placeChecked(), place() and placeParlay(), grading in settle() and gradeBet(), pricing in quote(), fitted tables in FT with tget(), fair window in timedGate() and closeAfter().

blocked: nothing. Field and matchup simulated and labelled SIM.
