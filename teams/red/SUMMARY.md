# Team Red, Phase 4 round two: Reads

- App: https://mclovin-codes.github.io/live-lab/teams/red/app/
- Honest view, 7 players and nothing generated: https://mclovin-codes.github.io/live-lab/teams/red/app/lounge.html?field=7

## The mechanic: Reads
Every pick in the Field is sealed until kickoff. Reads turns each sealed pick into a one-tap question: which side did they take? You answer before kickoff, the kickoff reveal scores you, and the final settles the pick.

## What to tap first
1. Open the Reads tab (it replaces the Lounge). At ?field=7 it shows exactly 7 players: you, your matchup opponent and five more.
2. On the first card, your opponent's sealed pick, tap a side: Over or Under, or one of the two teams. Your read is in.
3. Optionally tag the read with one tap: Lock, Gut call or Trap.
4. Look at the Read-off panel: you vs your opponent on who reads the other better this week.
5. Tap any face to open that player's profile. "Read their picks" there shows only that player's sealed picks.
6. On any game page, "Read the Field's sealed picks on this game" opens Reads for that one game.

## How it works with 7 players and nobody typing
It runs on taps, not talk. With 7 players the honest view has well over a hundred sealed picks to read this week. Each one is a two-button card with the game, the market, the Stack sealed on it and a countdown to kickoff. Nothing on the screen needs anyone to type, and nothing in ?field=7 is invented: no head counts, no generated reads, no chatter. The only social numbers are your own reads and your opponent's, and the page says "has not read you yet" when that is the truth.

## What brings a player back
- Something pending: every read waits for its kickoff. Reads opens on "Next reveal": the next game, how many sealed picks it reveals and a countdown. Home shows the same reveal time.
- The reveal moment: reads that resolved while you were away open the page once ("Dan took TOR. You read it"), then clear.
- Something that resolves twice: the kickoff reveal scores your read, then the final settles the pick.
- Something to answer: your opponent's sealed picks sit on top. The Read-off score moves every night, and the 1v1 has a second contest inside it.
- Something that sticks: your Read record (percent read right, scored, waiting) sits on your profile.

## What is ownable
- Name: Reads (and the Read-off).
- The steps, in order:
  1. A player stakes Stack on a pick that stays sealed from the whole Field until its game starts.
  2. Before kickoff, any other player answers a two-sided question about that sealed pick in one tap, optionally tagged Lock, Gut call or Trap.
  3. At kickoff the pick is revealed and every read on it is scored right or misread.
  4. At the final the pick itself settles, and both the reader's record and the picker's readability update.
  5. Inside each 1v1 matchup, the two players' reads of each other form a second score, the Read-off.
- What is new:
  - A group chat needs typing.
  - A pick feed shows picks after they are made.
  - A reaction bar rates something already visible.
  - Reads makes the hidden pick itself the thing you play with, scored by the reveal, and ties it to the 1v1. It only works in a contest where every pick is sealed until kickoff.

## The two mechanics we dropped
- Clash: when two players hold opposite sides of one game, pair them on a card and let the Field back one. Dropped because with 7 players clashes are rare, so most nights the space would be empty.
- Ride or Fade: trust or doubt someone's sealed pick without guessing it. Dropped because it is a reaction bar on a hidden card. Reads asks a real question with a right answer at kickoff, which is what makes it scoreable and worth coming back for.

## What the cleanup removed
- Deleted: contest.html, contests.html, contest-kit.js, and the Phase 3 Contests sim (sim.html, sim-data.js).
- Removed:
  - The contest switcher sheet and "Find or start a contest" from the top bar code.
  - The Ranks contest switcher and its links.
  - The Board's "Picking in" strip.
  - Home's contest lists, join-with-a-code and the Contest Boost row.
  - The profile's "Contests you share" section.
  - Every generated line naming a contest, since the old Lounge is gone.
- A grep of the folder for contests.html, contest.html, contestId, commissioner, crew and squad finds nothing.

## Unfinished or faked
- The 6 other players are stand-ins with stand-in picks. In a real build they are the real entrants and their real sealed picks.
- Reads are stored on this phone only. With a server, your opponent's reads of you would appear at kickoff; in ?field=7 that panel honestly reads 0.
- Readability (how often the Field reads you right) is described on your profile but stays empty until other real players read you, which needs the server.
- With the honest view off, the page fills the full stand-in Field and stand-in reads; that view is labelled in the page footer.
- Props and anything without two clear sides are not readable yet.
- The Slips page still groups picks under one contest heading (the week), and the Board still offers live picks from the shared app.
