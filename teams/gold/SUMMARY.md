# Team Gold, Phase 4 round two: The Read

- App: https://mclovin-codes.github.io/live-lab/teams/gold/app/
- Honest view (7 players, nothing generated): https://mclovin-codes.github.io/live-lab/teams/gold/app/lounge.html?field=7
- The footer of every page switches between the two views, and the choice holds as you move through the app.

**The mechanic: The Read.** Every pick in the Field is sealed until its game kicks off. You call, in one tap, the side you think another player took, and the moment the game kicks off the seal breaks and your read is graded.

## What to tap first
Open the Reads tab. Then:
1. Tap a player in the strip at the top.
2. On one of their sealed cards, tap a side (the two teams, or Over and Under).
3. Optionally add one line, then tap Seal it. The line opens with the seal.

Then open Home: the Read card shows how many picks are left to read, your record and when the next seal breaks.

## How it works with 7 players and nobody typing
- The Reads tab is the one space for the whole Field. There are no rooms; leagues are filter chips and players are a strip.
- With 7 players the deck holds about 30 sealed picks: the other six players, each with about 6 picks, as Week 8 ran (211 picks, 33 entrants).
- **What a sealed card shows:** the player, the game, the market, the stake size and the kickoff countdown.
- **What it hides:** the side. That is the only thing you call.
- Your matchup opponent's cards come first, under "Read your matchup", and the Matchup page has a button to read them.
- Nobody needs to type: a read is one tap, and the line is optional.
- **What the honest view never shows:**
  - an invented crowd, generated talk, reactions or head counts;
  - reads by other players on your picks. It says "No reads yet", because real reads need the server.

## What brings a player back
- Something is always pending: reads waiting on kickoffs, and a "next seal breaks in 47m" clock on the Reads page and on Home.
- The Field makes new picks every day, so new sealed cards appear.
- Your read record ("3/4 read right") sits on the Reads page, Home and your profile. Another player's profile shows your record reading them, with a link to read their sealed picks.

## What is ownable
**Name:** The Read.

**Steps, in order:**
1. A player's pick is sealed: the Field sees who picked, which game, the market and the stake, never the side.
2. Any other player calls the side in one tap, and may attach one line. The read is sealed too.
3. At kickoff the seal breaks for everyone at once: the side is shown and every read on it is graded on the spot, before the game is played.
4. When the game ends the pick itself grades, so a card resolves twice: the read at kickoff, the pick at the final.
5. Reads build two records per player: how well you read the Field, and how hard you are to read. Your matchup opponent is the first read you are given.

**What is new:**
- A group chat needs typing. A pick feed shows picks after the fact. A reaction bar reacts to things already public.
- The Read is a prediction about a person, not a game: it is made against information this app keeps hidden, and it is graded by the reveal itself, at kickoff, not by the game result.

## The two mechanics I dropped
- **Ride or Fade after the reveal:** tap to back or oppose a pick once it is shown. Other apps already do it, it resolves only at the final, and with 7 players there is little to react to.
- **The Clash:** auto-pair two players who sealed opposite sides of the same game and let the Field call the winner. It only fires when two players choose the same game, which at 7 players is rare.

## What the cleanup removed
- **Deleted:** the contest and contests pages, the contest kit, the Squad page and kit, the Phase 3 Squad Streak simulation pages, the old Slips page, the round-one backup pages, the old Gold store and the inbox note.
- **Tab bar:** the contest pill, the "Your contests" sheet and "Find or start a contest" are gone.
- **Board:** the "Picking in" line and its contest link are gone.
- **Game page:** the contest kit and the contest picker on the pick sheet are gone; it only appears with two or more contests, which can no longer happen.
- **Old profile page (player.html):** now opens Me.
- **Renamed:** the Lounge tab is now Reads.

## What is unfinished or faked
- **Reads stay on this phone.** No other player sees your reads or lines until a server exists, and in the stand-in view the reads on your picks are generated.
- **The other players' picks come from the engine's stand-in players.** They are real games with real lines, but not real people.
- **The busy view (31 players)** shows the stand-in Field, so the deck is large.
- **"How hard you are to read"** is in the rules above, but not yet shown as a number on profiles.
- **Challenges** stay on this phone. In the honest view, a sent challenge stays "Sent" because nobody accepts it.
