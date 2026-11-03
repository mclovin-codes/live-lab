# Team Gold status

**Version:** v4
**URL:** https://mclovin-codes.github.io/live-lab/teams/gold/
**Name:** Hashmark Live

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

## Not tested
- A real phone.
- A live-feed settlement end to end. One next-snap pick was still open when the game went to the quarter break.

## Blocked
Nothing.

## Testing next
1. Live settlement of next-snap, drive and first-down tickets during real plays.
2. v4: a pinned rival duel, fourth-quarter close-game moments, and SIM props in the feed.
