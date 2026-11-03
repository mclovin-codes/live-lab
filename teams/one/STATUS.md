# One tool status (closing, final whistle 11:24 PM ET)

version: m6
url: https://mclovin-codes.github.io/live-lab/teams/one/
final: CHI 34, SEA 17.
base: Blue v15, integrated by Team Blue. Pulled from the inbox: 5 countdown chip, 6 storylines rail, 7 odds-change setting (Gold), 8 Gold 375 px fixes. Red snippet 1 (key-number margins) arrived after the whistle and is merged as m6; Red 2 to 4 pending.
versions: m1 base plus 3s lock of game lines on any sharp book move; m2 chips and storylines; m3 odds-change setting; m4 phone fixes; m5 FINAL header and closed timed picks.; m6 key-number margins from Red.

## Final grading check
- On the merged page at the final: game reads state post, Final; final card shows rank, Units, record; every market reports Final and refuses picks.
- Grade rules checked on the final score: CHI moneyline won, CHI -6.5 won, Over 50.5 won, CHI by 13+ winning margin won, a prop for a player not in the box score voids as did not play.
- Real picks on the Blue page through the whole game (same engine): 40 picks, 40 graded at the final (13 won, 27 lost), 0 left open, 0 voided after the fact. Earlier real-host check: 4 of 4 graded with correct returns (-320 for 10 returned 13.13, +105 for 10 returned 20.50).

## Measured tonight
- Lag, play wallclock to screen: 15 to 25s most plays after cache-busting and push, 19 to 45s in the second half (ESPN publish time). Book prices by push in under 1s, about every 2s.
- Fair window: timed markets and props close at the shortest snap gap seen tonight for that kind of play, minus 3s (live ball 16s, incompletion 33s, kickoff 41s, punt 57s, timeout 51s, breaks and scores 74s and up, halftime 10 min, last 2 minutes of a half 8s max). On 124 real snaps the median close was 27s before the snap and 0 snaps came before the close.
- Acceptance probe (1-Stack pick tried every 3s while the page was in front, Q3 to the final): 99 tries, 32 placed, 67 locked (27 ball may be live, 27 line moved, 7 feed paused, 4 repricing, 2 book suspended), 0 refused at the placement check, 0 accepted after a snap. Every accepted pick was at least 26s before the next snap.
- Honest cost: after most runs and catches the next-snap markets never open; they open during incompletions, timeouts, kicks, scores, the two-minute warning and halftime.

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
| Winning margin (1-6, 7-12, 13+, tie) | Band probability from the alt-spread margin model with half-point continuity. | 10% |
| Next score (team and TD/FG, or none) | nflfastR next-score model probabilities averaged by state (next_score fit). | 10% |

Timed markets (next play, 4th down, chains, this drive, next score, anytime TD, player props) are open only inside the fair window and only after a placement check passes; see the fair-play section.

Fit source: nflverse play-by-play 2023, 2024, 2025 (regular season and playoffs, 147,926 rows). Cells under 40 plays fall back to a coarser bucket. Script and bucket notes in teams/blue/fit/.

## SportsGameOdds
What we would do with it: a small server function (Vercel or Cloudflare Worker) holds the key and polls SGO every 2 to 5 seconds for this event, then serves a public JSON of real book prices: player props with prices, alt spread and total ladders, team totals, and a no-vig consensus across books. The page would read that JSON instead of modeling those markets. It would not help timing, which still comes from the push feed. Needs founder approval for the key and a host for the function.

## Gaps
- Real Field and Slip need the Rush backend; tonight the Field and matchup are simulated and labelled SIM.
- A paid official data feed would let the next-snap window open after live-ball plays.
- Margin model now carries key-number weights (Red, m6); not yet tested against live book alt prices because the game had ended.
- Red snippets 2 to 4 (break board, tab bar order, lock grammar) pending.

lift points for Rush engineers: FastCast doc plus polls fill S, player state in me, Field in ladder(), picks through placeChecked(), place() and placeParlay(), grading in settle() and gradeBet(), pricing in quote(), fitted tables in FT with tget(), fair window in timedGate() and closeAfter().
