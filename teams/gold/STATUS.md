# Team Gold status

**Version:** v8
**URL:** https://mclovin-codes.github.io/live-lab/teams/gold/
**Name:** Hashmark Live

## Latency, measured on the Pages host in Q2
Lag is the play's `wallclock` versus when the page first has it.
- ESPN's core feed, polled every second past the cache: 23.7s on the one play raced against push in v8.
- ESPN push feed: 33.8s on that same play. 22.7s, 23.3s and 29.1s on three plays in v7, with delivery to the page about 0.2s of each.
- In v7 a separate 1-second poll beat the push by 0.6s, 4.4s and 4.9s on those three plays.
- Sample is 4 plays, so treat these as rough numbers.
- The floor is upstream of the page. ESPN has not published the play for about 20s or more. Going lower needs a paid official data feed and a server, which the brief rules out (no keys).
- Not measured: how far DraftKings prices lead ESPN's play. The market-jump lock has not fired yet.

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
All 12 rivals are labeled SIM. They replay from ESPN's probabilities and plays, so every phone sees the same field. There are no real players without a backend.

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
1. More lag samples, the market-jump lock, drive and one-tap settlement.
2. Measure how far DraftKings leads ESPN, and use it if the lead is real.
3. Push feed reconnect after a phone locks and wakes.
