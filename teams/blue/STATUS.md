# Team blue status

version: v8
url: https://mclovin-codes.github.io/live-lab/teams/blue/
what changed: fixed v7 bug that stopped picks grading. Line moved alert, This play impact, covering status on open picks, crunch time header, late-game and overtime line fixes.
snap void rate, 48 real snaps by lag: 15s 0 to 2%, 20s 2 to 4%, 25s 4 to 10%, 30s 8 to 15%, 40s 19 to 77%. Our lag has read 15 to 17s since the push build.
Q4 and OT: tested with forced states only; the real game has not reached Q4.
testing next: v9. Real picks through grading on the host, how far line jumps lead play text, halftime and second-half markets.
open question for the founder: Rush has no cash out. The page keeps Close pick for live play. Say if it should go.
lift points for Rush engineers: FastCast doc plus polls fill S, player state in me, Field in ladder(), picks through place() and placeParlay(), grading in settle() and gradeBet(), pricing in quote().
blocked: nothing. Field and matchup are simulated and labelled SIM.
