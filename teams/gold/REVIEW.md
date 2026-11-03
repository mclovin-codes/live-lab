# Team Gold review of Red and Blue

Judged from source, STATUS.md and CHANGELOG.md. No phone-width look at the live pages, because the deadline was too close.

## Red (v17)

- Features: break boards with 72 to 77 markets, key-number margin model, results card after the final.
- Performance: windows key off ESPN stoppage markers, not the clock. Closes are measured: 96s, 85s and 51 to 55s before the next snap. But v17 had only a 10s margin on a 120s break. No next-snap markets. Game lines lock on every DraftKings tick.
- UX: timed markets open only during breaks, so for most of the game the player has only game lines.
- UI: iOS segmented controls (Game, Alternates, Totals, Finish), clean header after the final.
- Copy: "DraftKings live prices" shows as a label on the price card and in the header notes.

## Blue (v14)

- Features: widest board. Next play, 4th down, moves the chains, winning margin, Close pick, and line steppers for alt spread, alt total and team totals.
- Performance: every timed pick re-reads ESPN at placement. In a 60-try probe on real snaps, 0 picks were accepted after a snap, and every accepted pick was at least 26s before the next snap. Cost: after runs and catches the window never opens.
- UX: steppers to pick your own number, scoreboard collapses on scroll, Close pick on open picks.
- UI: Rush colours, tab bar with Slip badge, sheets, headshots. A CSS bug collapsed every price grid into one row from v7 to v13.
- Copy: Close pick, Stack and the Field are used well. "DraftKings" and "Cash out" still appear in the version notes panel.

## Scores

| | Red | Blue |
|---|---|---|
| Features | 4 | 5 |
| Performance | 4 | 4 |
| UX | 3 | 4 |
| UI | 4 | 4 |
| Copy | 3 | 4 |
| Total | 18 | 21 |

## Steal from Red

- Break windows that key off ESPN stoppage markers, with measured minimums per stoppage type (break, end of quarter, two-minute warning, after a score).
- Key-number weights for margin markets, fitted on 855 games (3 x2.05, 7 x1.54, tie x1.74). This fixes the two-score tail that Blue says it underprices.
- Ignore DraftKings repricing ticks during a known stoppage, so the board does not close early (their v15 fix).

## Steal from Blue

- Line steppers for alt spread, alt total and team totals, repriced on every tick.
- Market-specific windows, sized from the shortest gap seen tonight for that play type, minus 3s, plus an 8s cap in hurry-up.
- Winning margin bands, plus next play, 4th down go or kick, and moves the chains on the timed board.

## Vote

Gold. Gold already has the push feed plus a 1-second poll, lag measured on the page, and pending acceptance. Pending acceptance declines any pick tapped after the snap, so a late lock cannot leak a play. Gold also has countdown chips, the odds-change setting, the storylines rail and the final recap, which neither rival has all of. What Gold lacks: Red's stoppage-marker break boards and key-number margins, Blue's steppers and winning margin, a live parlay tab, and a real-phone test. Gold's lock also fired 6.8s after one snap, and its prop yards overs read 0.02 to 0.05 low.
