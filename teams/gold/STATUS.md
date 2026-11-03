# Team Gold status

**Version:** v12
**URL:** https://mclovin-codes.github.io/live-lab/teams/gold/
**Name:** Rush Live

## Latency, measured on the Pages host in Q2
Lag is the play's `wallclock` versus when the page first has it.
- ESPN's core feed, polled every second past the cache: 23.7s on the one play raced against push in v8.
- ESPN push feed: 33.8s on that same play. 22.7s, 23.3s and 29.1s on three plays in v7, with delivery to the page about 0.2s of each.
- In v7 a separate 1-second poll beat the push by 0.6s, 4.4s and 4.9s on those three plays.
- Sample is 4 plays, so treat these as rough numbers.
- The floor is upstream of the page. ESPN has not published the play for about 20s or more. Going lower needs a paid official data feed and a server, which the brief rules out (no keys).
- Not measured: how far DraftKings prices lead ESPN's play. The market-jump lock has not fired yet.

## What changed in v12
- Timed markets price from empirical NFL tables (nflverse 2023-2025, about 115,000 snaps). Method and calibration are in `model/METHODS.md`.

## How every market is priced (formula and hold)
Holds are applied to the no-push win probability q. "x1.05" means the implied probability is q times 1.05, about 4.8% overround on a two-way market. Odds round to the nearest 5 (10 above 300, 25 above 1000).
- **Moneyline, main spread, main total:** DraftKings' live price exactly as ESPN's push feed carries it, so the hold is DraftKings' own. Fallback when DraftKings is missing: ESPN's per-play win, cover and over probabilities, x1.05.
- **Alt spreads:** final margin ~ Normal(mu, sigma), with sigma = 13.5 x sqrt(fraction of game left), floor 1.3. mu is the average of the two values that reproduce DraftKings' de-vigged moneyline and de-vigged spread. Whole-number lines take the push mass out of the normal. x1.05.
- **Alt totals:** total ~ Normal(muT, sigma), with muT = DraftKings total + sigma x invNorm(de-vigged over). x1.05.
- **Team totals:** each team's mean is (muT +/- mu)/2, floored at its current score, with sd 0.72 sigma. x1.05.
- **Quarter and halves:** current period points plus remaining expected points times that period's share of remaining time. sd is 7 x sqrt(quarter time left / 900), or 9.5 for a half. Tie pushes on quarter winner. x1.05.
- **Next snap pass or run, 5+ or 10+ yards, moves the chains, this drive (TD, FG, no score), next score (CHI, SEA, none):** fitted nflverse tables by down, distance, yards to end zone, clock and score margin. Hold: q x 1.07 for q under 0.5, q + 0.035 at or above, about 7% overround on two-way markets and about 10% on three-way.
- **Player props (yards, receptions, completions):** projection = current stat + time left x a blend of game pace and a positional prior. sd = prior sd x sqrt(time left). Line at the projection rounded to .5. x1.05. **Weakest market:** the priors are hand-set, not fit.
- **Anytime TD:** 1 - exp(-lambda x time left), with lambda 0.5 for the lead rusher and 0.34 for others. Hand-set, also weak.
- **Parlays:** product of leg decimal odds x 0.90 for same-game correlation.

## SportsGameOdds (offered, not requested)
What it would do: replace the hand-set prop and anytime-TD priors with real book player-prop lines, and cross-check alt prices against market consensus. It needs a small server proxy, such as a Cloudflare Worker or Vercel function, to hold the key, since a static page cannot. It would not help speed, because the founder says it runs further behind. Worth it at integration time for props, not tonight.

## What changed in v11
- No void after the fact. Live picks are pending until the feed confirms the ball was dead at the tap. Picks that fail are never accepted, and the stake stays in the Stack. This is how books accept in-play picks with a delay.
- Tested: 10 acceptance fixtures pass. A live SEA moneyline pick was accepted 21s after the tap.
- Lock lag measured on 3 live snaps: the window closed 2.1s and 8.1s before two of them. The third lock came from a DraftKings move 25.9s early. The window is predictive, so acceptance is the guarantee.
- Why not lock before the snap: the DraftKings ticks reach the page through ESPN about 14s after the snap. ESPN posts the play 16-28s after. No free signal arrives before the snap.

## What changed in v10
- Fair timed markets. They open only in a window after each play posts and close before the next snap is likely, or earlier if DraftKings suspends or jumps. Late picks are void. Lock lag is on the page.

## Fairness numbers, measured in Q2
- Snap-to-snap gap, same possession, 42 snaps: p10 28s, p25 37s, median 41s.
- ESPN posts a play about 18-24s after its wallclock, which leaves about a 10-15s window to pick before the next snap.
- DraftKings over the push feed: price suspensions show as missing ticks. The one big move seen came about 14s after the snap, about 9s before ESPN posted the play. DraftKings can lock early after a snap, but not ahead of it. The window plus the void rule carry fairness.
- 15 fixture tests pass for the void rule and window states.

## What changed in v9
- Rush words on every screen, weekly Stack of 1,000, Units, the Field ranked on Units, named head-to-head SIM opponent, free Reload, breadcrumb from the Board.
- Early close-out removed. Rush has none.
- Tickets from v8 and earlier do not carry over, because budget and scale changed.

## What changed in v8
- One-second cache-skipping check of ESPN's core feed, on top of the push.

## What changed in v7
- ESPN push feed for plays, clock, down and distance, box score, odds. Polling is backup.
- DraftKings live prices on the main lines. Markets lock when DraftKings jumps.
- True lag in the header, breakdown in the version panel.

## What changed in v6
- One-tap picks on Next snap and This drive. Open picks glow on the board.
- Tickets show the current price and whether you beat the line.
- Second-half spread and total, tighter next-snap hold, final recap card.

## What changed in v5
- Self-update within a minute of a ship, because Pages caches the page for 10 minutes.
- Snap streak, and a head-to-head card on the Field tab.

## What changed in v4
- Fixed field position. ESPN counts `yardLine` from the SEA goal line, so Seattle drives were mispriced and the ball was drawn on the wrong side.
- Fourth-down prices expect a kick. Over and Under SIM players bet totals only.

## What changed in v3
- Standalone page: doctype, html, head, body. Shared store and all `claude.use` calls removed.
- Parlays: add legs from the slip, a gold bar tracks them, same-game price is legs multiplied less 10%. Pushed or void legs drop out.
- First-down market on every set ("Moves chains" or "Stopped").
- SIM players now call every snap, so the leaderboard moves on each play. Rank alerts fire when you pass someone or get passed. A SIM field vote shows on the next snap.

## Other players
All 12 rivals are labeled SIM stand-ins for the Field, with made-up Units from earlier in the week. One is the named head-to-head opponent. Every phone sees the same ones. No real players without a backend.

## Tested
- Mobile preset on the Pages host, live ESPN: score, clock, situation, board, parlay placed, no horizontal scroll, no console errors.
- Grading on 31 fixtures: moneyline, spread, total and prop pushes, team totals, quarter, half, void prop, next snap, snapped-before-pick void, punt void, first down, next score, parlay win, loss and payout. All pass.

## Tested live on the host
- Real tickets settled from real plays in Q2: Next snap Pass at -240 paid $141.67 on a stake of $100, and 5+ yards lost on an incompletion.
- A first-down Yes ticket lost correctly on a punt.
- An open v5 tab hopped to v6 on its own within a minute of the ship and kept its tickets.

## Not tested
- A real phone. Checked only at the mobile preset in the built-in browser.
- A drive ticket has not settled live yet.
- One-tap picks tested only from the local file, not settled live.

## Blocked
Nothing.

## Testing next
1. Second half: acceptance rate on live picks, and lock lag on more snaps.
2. Fit props and anytime TD from nflverse player data, the weakest markets.
3. Drive and one-tap settlement live.
