# Phase 2: fix, cross-review, merge, present (founder, 2026-11-02, Q4)

## The founder's words (verbatim)

"I don't see player stats or game stats anywhere to view player stats, injuries and who was ruled out/questionable to return, update if they return to the game or not after a designation. Don't mention DraftKings anywhere with updates. And incorporate a player chat that is tailing the game. Once you give them these instructions, I'd like you to combine all three teams to review each other's work and steal/improve based on each team's review and votes on features, performance, UX, UI etc. Have an additional survey of all the players that were simulated and a non-bias board for review. Then have them join forces to continuously push out one tool for the remainder of the game. They have until 11:45 to win the grant to explore building this project. They will have to present their final product immediately on game finish on their final product and what are best features, the stickiest, and what gaps exist that still need improving, or if they had more time than this activity what else would be possible. Include a small version of user interaction and how it promotes growth and keeps players in the app at all times compared to their current mobile sportsbook apps and score checking apps."

## Clock (ET)

- Now to 11:02: every team ships one version with the three fixes below and writes its review of the other two teams.
- 11:02 to 11:10: the chief of staff tallies team votes, the simulated-player survey and the neutral board, names the base page and the features to merge, and assigns roles.
- 11:10 to 11:45: one tool, one URL (https://mclovin-codes.github.io/live-lab/teams/one/), shipped continuously.
- Game end: the presentation page goes live at https://mclovin-codes.github.io/live-lab/final/ within minutes of the final whistle. 11:45 PM is the hard stop.

## The three fixes (every team, now)

1. Stats. A place to view game stats (team box score) and player stats (passing, rushing, receiving, defense, kicking) live from the summary feed, with headshots.
2. Injuries and designations. Who is out, questionable, doubtful, or ruled out during the game, from the summary feed's `injuries` block and from play text and news; when a designated player returns to the game, say so, and when they do not, say that.
3. Chat. A player chat tailing the game: the simulated Field talks about plays, picks, rivals and the clock as the game moves; the player can post. Rush calls it the Lounge.
4. No "DraftKings" anywhere a player sees. Say "the book" or "the market" or show the line without attribution.

## The review (every team, by 11:02)

Write `REVIEW.md` in your folder: for each of the other two teams, open their page on the host, score 1 to 5 on features, performance (real-time and lock behaviour), UX, UI, copy, and name the three things you would steal. Then one vote: which page should be the base for the merged tool, and why. Be honest; the merge depends on it.

## The merge (from 11:10)

Roles come with the tally. One team integrates in `teams/one/index.html` (no other team edits that file). One team builds the stolen features as drop-in snippets in `teams/one/inbox/<feature>.md` (code plus where it goes) and runs the probes against the merged page. One team writes the presentation at `final/index.html` and keeps STATUS.md for the merged tool. Everyone ships through the same git command, own paths only.

## The presentation (live at game end, `final/index.html`)

One page a founder can read in three minutes: the final product (link), the best features, the stickiest ones with the evidence (probe numbers, lock windows, lag), the gaps that still need work, what more time would make possible, and a small model of user interaction: how a player moves through the page during a game, why it promotes growth, and why it keeps them in the app over a sportsbook app and a score app. Rush words, no DraftKings, no money claims.
