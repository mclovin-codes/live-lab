# Team Gold changelog

## v12
- Timed markets price from empirical tables fit on nflverse play-by-play for 2023-2025: 855 games, about 115,000 snaps. Fit on 2023-24 and scored on 2025, every table beats a constant on Brier score. Tables and methods are in `model/`.
- Covers next-snap pass or run, 5+ and 10+ yards, moves the chains, this drive and next score. They replace the hand-written tables.

## v11
- Removed void-after-the-fact, per the 9:50 PM addendum. Every live pick is pending until the feed confirms the ball was dead at the tap. Picks that fail the check are never accepted, and the stake stays in the Stack.
- Timed picks (next snap, first down, this drive, next score, anytime TD) are accepted only if the next play ESPN posts started after the tap, using its wallclock with a 2s margin.
- Other picks wait 16s for DraftKings ticks to pass the tap. They are declined if DraftKings suspended or its win probability moved 2 points or more, or if a scoring, turnover or 15+ yard play, or a play naming the prop player, started before the tap.

## v10
- Fair timed markets per the 9:40 PM founder addendum. Next snap, first down, this drive, next score and anytime touchdown open only in a window after each play posts, with a countdown. The window closes before the next snap is likely: this game's 25th-percentile snap gap minus 2s, longer after timeouts and kicks.
- Timed markets also close when DraftKings suspends or its win probability jumps 2 points or more.
- Void rule: a timed pick placed after, or within 2s before, the wallclock of the play it depends on is void, stake back. So is any prop or anytime pick placed after a play naming that player started.
- The panel shows lock lag: how far before or after each real snap the lock came.

## v9
- Rebuilt as the Live section of the Bears at Seahawks event inside Rush, per RUSH-CONTEXT.md.
- Rush words on every screen: pick, stake, Slip, Stack, Units, the Field. Tabs are Live, Lines, Props, Slip, Field.
- Weekly Stack of 1,000. Units are profit and loss, and the Field ranks on Units.
- Removed early close-out, since Rush has none.
- SIM Field carries made-up Units from earlier in the week. Named head-to-head SIM opponent.
- Free Reload once Stack drops under 100. Units keep counting.
- Stakes rescaled to the 1,000 Stack. Next-snap and drive picks max out at 50.

## v8
- One-second, cache-skipping check of ESPN's core situation feed. On the measured play it beat the push by 10 seconds.

## v7
- ESPN push feed (FastCast websocket) for plays, clock, down and distance, box score and odds. Polling is now the backup.
- DraftKings live prices on the main spread, total and moneyline. Alt lines and props price off them.
- Markets lock when DraftKings jumps before ESPN posts the play.
- True lag behind the real play in the header, with a breakdown in the version panel.

## v6
- One-tap picks on Next snap and This drive, with a stake button that cycles $50, $100, $250, $500 and off.
- Open picks glow on the board.
- Open tickets show the current price and whether you beat the line.
- Second-half spread and total.
- Tighter hold on next-snap favorites.
- Recap card at the final whistle.

## v5
- Page updates itself within a minute of a new version and keeps tickets.
- Snap streak on next-snap, drive and first-down wins.
- Head-to-head card with the player right above you on the Field tab.

## v4
- Fixed field position: ESPN counts yardLine from the SEA goal line. Seattle drives were mispriced and the ball was drawn on the wrong side.
- Fourth-down prices now expect a kick.
- Over and Under SIM players bet totals only.

## v3
- Standalone static page for the new host. No artifact capabilities, so the field is all labeled SIM players.
- Parlays with a same-game price.
- First-down market on every set.
- SIM players call every snap, so the leaderboard moves on each play. Added rank alerts and a SIM field vote on the next snap.

## v2
- Replaced ESPN logo images with team colors because the viewer blocks outside images.
- Added an on-page message when ESPN can't be reached.
- Each viewer now reports feed health to the shared store.

## v1
- First publish of Hashmark Live, with a $10,000 fake budget.
- Live spread, total and moneyline, plus alt spreads, alt totals, team totals, quarter and first half markets.
- Next-snap pass or run and yardage markets, drive result, next score.
- Player props with milestone rails, anytime touchdown.
- Cash out and a sweat meter on every ticket. Overs settle as soon as they hit.
- Leaderboard ranked on cash plus cash-out value, 12 labeled SIM players replayed from ESPN's probabilities, real players through the shared store, tail button.
