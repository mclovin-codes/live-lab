# Team blue status

version: v9
url: https://mclovin-codes.github.io/live-lab/teams/blue/
what changed: fair window for every timed market and player prop. They close before the next snap can happen: median 15s early on 54 snaps tonight, 2 snapped before close. Any pick placed after the ball was live voids, judged on the server clock. A book price jump or suspension also locks them. Lock lag shows on Live and in the lag sheet. Plus second half lines, halftime card, game lines on Live, moment prop card, red zone TD.
fairness limit: we cannot see the snap. The window is the protection, and the void rule catches anything past it. A paid official feed would let the window open longer.
testing next: v10. Measure how early book price moves signal a play, then widen the window where that is safe. Q4 and OT checks on the real game.
lift points for Rush engineers: FastCast doc plus polls fill S, player state in me, Field in ladder(), picks through place() and placeParlay(), grading in settle() and gradeBet(), pricing in quote(), fair window in timedGate() and liveAtPick().
blocked: nothing. Field and matchup simulated and labelled SIM.
