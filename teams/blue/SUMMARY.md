# Team Blue, Phase 4 round two: Reads

- The app: https://mclovin-codes.github.io/live-lab/teams/blue/app/
- The honest view, exactly 7 players and nothing generated: https://mclovin-codes.github.io/live-lab/teams/blue/app/lounge.html?field=7

## The mechanic: Reads

**The idea in one sentence:** every pick in the Field is sealed until kickoff, and before kickoff you call which side another player took; at kickoff the pick flips for everyone and your read scores right or wrong.

## Tap first

1. Open the **Reads** tab (it replaces the Lounge tab).
2. Your matchup opponent's sealed picks are at the top. Tap a side ("Over" or "Under", or one of the two teams) to read their pick.
3. Watch "Waiting to flip" go up and the "Next flip" clock count down.
4. After kickoff, the card flips: their real pick shows, and your read says "Read right" or "Misread".
5. The footer has the toggle between the honest view (7 players) and the full Field.

## How it works with 7 players and nobody typing

- Reads needs no talk at all. Each of the 6 other players in a 7-player Field has sealed picks on tonight's games, and every one is a card you can read with one tap.
- With 7 players there are still plenty of cards. A read takes one tap and nothing to type.
- Your own sealed picks are listed with "Nobody has read you yet" until someone does. In the honest view nobody else's reads are invented, so that line stays honest.
- A card also shows whether you are on the same side or against them when you hold a pick on that game.
- Each sealed card shows the Stack riding on it, so you can see how much the pick matters without seeing its side.
- A timeline across the top shows tonight's flips: each kickoff time, how many cards seal at it and how many of them you have read. Tap a time to see only those cards (games are filters inside the one space, not rooms).
- Your matchup has a read duel line: how many of your opponent's picks you have read right, and whether they have read you.
- The game page keeps other players' picks sealed before kickoff too, with a "Read it" door to Reads.
- At 30 players there are more cards to read and more people reading you, so it gets better as the Field grows.

## What brings a player back

- **The same evening:** every read is pending until its kickoff. The "Next flip" clock tells you when the next one scores, and the game's final then grades the pick itself.
- **The next day:** new sealed picks appear as the Field picks tomorrow's games.
- **Your record:** your read record shows on Home, on your profile and on every other player's profile ("you on Line"). Your matchup opponent is always first to read.
- **From any profile:** another player's profile lists their next sealed picks with read buttons, so tapping a name anywhere leads straight to reading them.

## What is ownable

The name: **Reads**.

The steps, in order:
1. Every pick a player makes in the weekly contest stays sealed from every other player until that game kicks off.
2. Before kickoff, any player may read another player's sealed pick with one tap, calling the side they took. The read is locked at kickoff.
3. At kickoff the pick flips for the whole Field at once, and every read on it is scored right or wrong at that moment, before the game is played.
4. At the final the pick itself is graded. The picker keeps the result in Stack; the reader keeps a read record against that player.
5. Your 1v1 opponent's sealed picks are always the first ones offered to read.

What is new compared with a group chat, a pick feed or a reaction bar:
- A chat needs typing.
- A pick feed shows picks after the fact.
- A reaction bar reacts to something already visible.
- Reads is a guess about something hidden. It scores at a synchronized reveal (kickoff), separately from whether the pick hits, and every player's sealed picks are the board you play it on.

## The two mechanics we dropped

- **Blind Back:** back another player's sealed pick without seeing it, and share their result in a "backed" record. Dropped because it is a tail button with a blindfold. It does nothing until others pick, and it scores only at the final, so there is no kickoff moment.
- **Showdown:** at kickoff, everyone on opposite sides of a game is paired into an instant 1v1. Dropped because with 7 players most games have one person or nobody on each side, so most nights it pairs nobody.

## What the cleanup removed

- The contest pages (`contest.html`, `contests.html`), the crew page and its script, and the crew sim page: all deleted.
  - Note: the deletions were in the shared git index and went to `main` inside another team's cleanup commit (35fa1e1). The result is the same.
- The Board's "Picking in" contest line.
- The profile's "Your contests" and "Contests you share" sections.
- The Ranks contest switcher and its link to contests.
- Home's contest cards, join-with-a-code handler and crew boost.
- The game page's "Place in" contest row.
- The Slips page's contest header (contest name, ACTIVE tag and a Units total) and the Units figure on each open Slip.
- The store's list of created contests (it now returns none, so there is one contest: the week).
- The old Lounge rooms: one space now, Reads.
- The unused contest kit script and the contest tag on the game page's Field rows.
- Still in the folder, but unused and unreachable: a joiner-note helper inside the shared store.

## Unfinished or faked

- The players and their picks are prototype stand-ins for real entrants. Their picks are real cards on real games, made by the prototype.
- In the full Field view, "N others read this" and "N read you" are simulated. The honest view (`?field=7`) shows none of them.
- Your reads are stored on your phone only. In the real app the picker would see who read them after kickoff.
- A card flips only if this phone saw it sealed: the stand-in picks need a pregame line, so the page keeps each sealed card it showed and grades it from the final score. Open Reads before tonight's 9:00, 10:00 and 11:00 PM kickoffs to watch cards flip.
- The typing layer is small: after a card flips, you can add one line under it, either a one-tap line ("Called it", "You got me") or a typed one. The line stays on your phone in the prototype.
