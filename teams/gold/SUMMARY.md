# Team Gold, Phase 4 round two: Sealbreak

- App: https://mclovin-codes.github.io/live-lab/teams/gold/app/
- Honest view (7 players, nothing generated): https://mclovin-codes.github.io/live-lab/teams/gold/app/lounge.html?field=7
- The footer of every page switches between the two views, and the choice holds as you move through the app.

**The mechanic: Sealbreak.** Every pick in the Field is sealed until its game kicks off. You call, in one tap, what you think another player took (either team, the Over or the Under), and at kickoff the seal breaks for everyone at once and your read is graded on the spot.

## What to tap first
Open the Sealbreak tab. Then:
1. Tap a player in the strip at the top.
2. On one of their sealed cards, tap a call: either team, Over or Under.
3. Optionally tap one of four set lines (Gut call, I know them, Easy read, Coin flip). The line opens with the seal.

Then open Home: the Sealbreak card shows how many picks are left to read, your record and when the next seal breaks.

## How it works with 7 players and nobody typing
- Sealbreak is the one space for the whole Field. There are no rooms; leagues are filter chips and players are a strip.
- With 7 players the deck holds about 30 sealed picks: the other six players, each with about 6 picks, as Week 8 ran (211 picks, 33 entrants).
- **What a sealed card shows:** the player, the game and the kickoff countdown.
- **What it never shows:** the side, the market, the line, the price or the stake.
- Every card offers the same four calls, so the buttons give nothing away.
- Your matchup opponent's cards come first, under "Read your matchup", and the Matchup page has a button to read them.
- There is no typing: a read is one tap, and the line is a fixed choice.
- **What the honest view never shows:**
  - an invented crowd, generated talk, reactions or head counts;
  - reads by other players on your picks. It says "No reads yet", because real reads need the server.

## What brings a player back
- Something is always pending: reads waiting on kickoffs, and a "next seal breaks in 31m" clock on Sealbreak and on Home.
- Each card resolves twice: the read at kickoff, the pick at the final.
- New picks seal every day.
- Your read record sits on Sealbreak, Home and your profile. Another player's profile shows how well you read them, with a link to their sealed picks.

## What is ownable
**Name:** Sealbreak. It is a coined compound and suggestive rather than descriptive, and it avoids every banned word and every descriptive word in the playbook. The name still needs the five-minute trademark check (USPTO classes 9, 41 and 42, both app stores, one web search), then attorney clearance, before it ships. The founder chooses the name. The candidates:
- **Sealbreak (proposed):** a coined word for the moment the seal breaks. It is distinctive, and the screens already use it.
- **Coldread:** suggestive. It borrows the idea of reading a person with no information, which is exactly what a call on a sealed pick is. It is a real phrase, so it may be more crowded.
- **The Read (dropped):** it describes the action, it is a common phrase, and an existing entertainment brand uses it.

**Steps, in order:**
1. A player's pick is sealed: the Field sees who picked and which game, nothing else.
2. Any other player taps one of four calls on that game (either team, Over or Under), optionally adding one fixed line. The call is sealed too.
3. At kickoff the seal breaks for everyone at once: the pick, its stake and every call on it are shown, and each call is graded on the spot, before the game is played.
4. At the final the pick itself grades, so the card resolves a second time.
5. Calls build a record for each player: how well you read the Field and each player in it. Your weekly matchup opponent is the first read you are given.

**Which steps I believe are new:**
- Steps 2 and 3: a one-tap call on another player's pick while it is still sealed, graded by the kickoff reveal itself, before the game is played. The competitor scan found neither.
- Step 1 is standard pick-pool practice.
- Step 4 is ordinary grading.
- Step 5 is a record like any stat line. Its use of the weekly 1v1 opponent is specific to Rush.

**What is new against other social features:** a group chat needs typing, a pick feed shows picks as they are made, and a reaction bar reacts to what is already public. Sealbreak is a one-tap call about a person's hidden decision, made while it is still sealed and graded by the reveal at kickoff, not by the game. The competitor scan found no app with an action on a still-sealed pick, or with the reveal staged as an event.

**The playbook checklist:**
1. Arbitrary or suggestive name: yes, suggestive. The five-minute check is only partly done: one web search for "Sealbreak" with app, trademark, sports and fantasy, on 2026-11-10, found no product or mark using the word. The USPTO and app store searches have not been run.
2. Free of banned and descriptive words: yes.
3. Written as ordered steps: yes, above.
4. One sentence on what is new: yes, above.
5. Depends on what only Rush has: yes (sealed picks, the kickoff reveal, the weekly 1v1).
6. Moves anything of value between players: no.
7. Changes a Stack, finish, season record or prize: no. The read record is display only.
8. Before kickoff, can a player learn another player's side, price or stake, including through counts: no. Cards show the game only, every card offers the same four calls, and counts show how many picks a player has sealed, never what they are. In a matchup the opponent's side stays hidden until kickoff, when the pregame line is closed, so nobody can copy it to lock a tie.
9. Fixed taps only, with Block and Report on every player: yes. Lines are four fixed choices, and every other player's profile has Block and Report (stored on this phone).
10. Kept off public addresses: no. Sealbreak (first as The Read) has been on the public GitHub Pages site since about 8:09 PM ET on 2026-11-10, commit 268caa3. Attorney question 1 applies.

## The two mechanics I dropped
- **Ride or Fade after the reveal:** back or oppose a pick once it is shown. It is generic (tail and fade), it resolves only at the final, and the pregame line is closed by then.
- **The Clash:** auto-pair two players who sealed opposite sides of the same game, and let the Field call the winner. At 7 players it rarely fires.

## What the cleanup removed
- **Deleted:** the contest and contests pages, the contest kit, the Squad page and kit, the Phase 3 Squad Streak simulation pages, the old Slips page, the round-one backup pages, the old Gold store and the inbox note.
- **Tab bar:** the contest pill, the "Your contests" sheet and "Find or start a contest" are gone.
- **Board:** the "Picking in" line and its contest link are gone.
- **Game page:** the contest kit and the contest picker on the pick sheet are gone.
- **Old profile page:** now opens Me.
- **Renamed:** the Lounge tab is now Sealbreak.

## What is unfinished or faked
- **Reads, lines, blocks and reports stay on this phone.** No other player sees them until a server exists, and in the stand-in view the reads on your own picks are generated.
- **The other players' picks come from the engine's stand-in players:** real games and lines, not real people.
- **The busy view shows the stand-in Field of 31,** so the deck is large.
- **Not built yet:** a per-player "hard to read" number and credit for standing alone on a side.
