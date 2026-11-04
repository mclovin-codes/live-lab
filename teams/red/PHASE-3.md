# Phase 3: the growth mechanism build-off (founder, 2026-11-03, 9:45 PM ET)

## The founder's words (verbatim)

"The create a contest needs the same amount of focus as the live build to be extremely user friendly to setup and with an incentive for every player involved in a custom public/private contest and commissioner tools to send download links to friends or explain the pool easily. But main focus is creation, the screaming reason why anybody would use that function. Was in a war deciding if it should be a create a contest or just a 'group/crew' that boosts everyone's multiplier based on how many are in your crew, with some sort of timer that expires the groups boost based on the last time a new member joined, and needing somebody new to join to keep everyone's multiplier alive so it's a collective effort to grow the pool and everyone's payout. I may need the team to split again and focus on driving pool size growth through the contest or similar function and we will let the best growth mechanism win, run a simulation of the first 5 weeks of using this mechanism matching my cohorts tendencies from week 8 to prove which is the best. This can be back on the red blue and gold sites using the current stage."

## The contest

Three teams, three mechanisms, one question: which grows the Field fastest and keeps it, over the first five weeks of Season 1, given how the Week 8 cohort really behaves. The best growth mechanism wins. Rush words on screen: the Field (never "pool"), Ranks (never "leaderboard"), Stack, Units, Prize Multiplier.

- Red: Contests. User-created public and private contests, creation as the hero: a setup so easy it sells itself, an incentive for every player in a contest (not only the commissioner), and commissioner tools to invite (share the app link and the contest in one tap, an explainer card the commissioner can send that says what the contest is and how it pays in Rush words).
- Blue: Crews. A group that boosts every member's Prize Multiplier by crew size, with a decay timer from the last new member; someone new must join to keep everyone's boost alive, so the whole crew recruits. Design the curve (boost per member, cap, decay window, what "alive" means), the crew page, the invite loop, the countdown that makes people act.
- Gold: the third way. A hybrid or a different mechanism entirely (a crew that also competes as a contest, a streak of weeks, a referral chain, anything) that you argue beats both. Say why in one paragraph before building.

Each team builds on a copy of the current app as its own site: `teams/<colour>/app/` (copy `app/` there first; the shared `app/` stays as it is and nobody edits it during Phase 3). URL: https://mclovin-codes.github.io/live-lab/teams/<colour>/app/. Own folder only.

## The simulation (every team, same harness)

`C:\Users\nross\live-lab\COHORT-WEEK8.md` (local, never pushed) carries the Week 8 cohort's real tendencies from production: entrants, new signups, first-pick rate, return after a win and after a loss, Reload use, referral sends and conversion, Lounge activity, picks per entrant, churn classes, Field size against the prize rungs. The Business desk is writing it now.

Each team writes `teams/<colour>/sim/` with a node script that simulates Weeks 9 to 13 with and without its mechanism, player by player from the cohort file's probabilities, 1,000 runs, and reports: Field size per week, new players per week, retention per week, prize rung reached, average multiplier, and the share of players touched by the mechanism. Same seed scheme for every team so the baseline matches. Publish the results on your site as a page (`teams/<colour>/app/sim.html`) with the curves and the assumptions you added, and in `STATUS.md`. A mechanism that needs an assumption the cohort file does not support must name it as an assumption and show the result without it too.

## Judging

The chief of staff compares the three simulations on Field size at Week 13 and on retention, then a neutral board (product, economy, growth, skeptic) reads the three pages and the three sims. The founder decides. Everything a player sees passes the lexicon.

## Clock

First playable version of the mechanism and the first simulation run by 2:00 AM ET; iterate through tomorrow; the live NHL and NBA work on the shared app continues in parallel only for grading proof tonight.
