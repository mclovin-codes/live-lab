# Red probe of the merged tool

## Probe 1: 11:33 PM ET, https://mclovin-codes.github.io/live-lab/teams/one/ (build m6), phone width 375

- Loads clean: load event at 310 ms, no script errors (the only console errors are the browser blocking vibration before a tap), no horizontal scroll at 375px.
- Final state: score CHI 34, SEA 17 matches ESPN's final; page shows the final; 183 plays loaded.
- Copy: no visible "DraftKings"; no visible bet, wager, cash, payout, bankroll, leaderboard or "$" amounts.
- Tabs: Live, Board, Stats, Lounge, Slip, with rank chip "#20 of 31" in the header.
- Inbox 1 (key-number margins) is live in m6: `knOU(-3.1,9.5,3).p` = 0.068 (push on 3, about twice a plain normal) and `knBand(-3.1,9.5,0,0)` = 0.067 (tie), matching Red's figures.
- Inbox 2 (break board card) not merged yet (`bbCard` undefined).
- After the final, `timedGate(model())` still reports open (23s left, "Ball may be live"); `quote()` checks `suspended()` first, which returns "Final", so no pick can be placed. Harmless, but the countdown chip may show a running clock on a finished game; `timedGate` could return closed when `M.g.done`.

Not run: a live pick-acceptance probe against real snaps. The game had already ended when the merged page was ready to probe.
