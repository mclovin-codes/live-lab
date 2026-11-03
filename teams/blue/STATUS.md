# Team blue status

version: v6
url: https://mclovin-codes.github.io/live-lab/teams/blue/
what changed: ESPN FastCast push connected, real DraftKings live prices on the board within a second, every other market reprices from them, cache-busted feeds, true lag shown on header (first reading 15s), snap clock.
measured lag, play wallclock to first seen: situation busted 20 to 25s, situation unbusted 25 to 35s, plays and probabilities busted 21 to 27s, summary 33 to 45s, FastCast play data 26 to 28s, DraftKings price ticks about every 2s.
testing next: v7. Using DraftKings price jumps as the earliest play signal, void rate on snap bets, Q4 and OT line behavior.
blocked: nothing, no access needed. About 15 to 20s of play lag is ESPN publish time, not ours.
