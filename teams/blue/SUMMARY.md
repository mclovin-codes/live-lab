# Team Blue, Phase 4 round two: Reads

- The app: https://mclovin-codes.github.io/live-lab/teams/blue/app/
- The honest view, exactly 7 players and nothing generated: https://mclovin-codes.github.io/live-lab/teams/blue/app/lounge.html?field=7

## The mechanic: Reads

**The idea in one sentence:** every pick in the Field is sealed until kickoff, and before kickoff you call which side another player took; at kickoff the pick flips for everyone and your read scores right or wrong.

## Tap first

1. Open the **Reads** tab (it replaces the Lounge tab). The three steps sit under the title: Sealed, You read it, Flips at kickoff.
2. Your matchup opponent's sealed picks are at the top. Every card offers the same four calls: either team, Over or Under. Tap one to read their pick.
3. Watch "Waiting to flip" go up and the "Next flip" clock count down.
4. After kickoff, the card flips: their real pick shows, and your read says "Read right" or "Misread".
5. The footer has the toggle between the honest view (7 players) and the full Field.

## How it works with 7 players and nobody typing

- Reads needs no talk at all. Each of the 6 other players in a 7-player Field has sealed picks on tonight's games, and every one is a card you can read with one tap.
- With 7 players there are still plenty of cards. A read takes one tap and nothing to type.
- Your own sealed picks are listed with "Nobody has read you yet" until someone does. In the honest view nobody else's reads are invented, so that line stays honest.
- A card also shows whether you are on the same side or against them when you hold a pick on that game.
- The page opens with the Field's faces: one ring per player that fills as you read their sealed picks. Tap a face to see only that player's cards. With 7 players that is six faces, each with something to do.
- A sealed card shows only the game, the kickoff and the word SEALED. The market type, line, price and stake stay hidden, and the four calls are the same on every card, so the buttons give nothing away.
- A timeline across the top shows tonight's flips: each kickoff time, how many cards seal at it and how many of them you have read. Tap a time to see only those cards (games are filters inside the one space, not rooms).
- Your matchup has a read duel line: how many of your opponent's picks you have read right, and whether they have read you.
- The game page keeps other players' picks sealed before kickoff too, with a "Read it" door to Reads.
- At 30 players there are more cards to read and more people reading you, so it gets better as the Field grows.

## What brings a player back

- **The same evening:** every read is pending until its kickoff. The red badge on the Reads tab counts your reads waiting to flip. The "Next flip" clock tells you when the next one scores, and the game's final then grades the pick itself.
- **The next day:** new sealed picks appear as the Field picks tomorrow's games.
- **Your record:** your read record shows on Home, on your profile and on every other player's profile ("you on Line"). Your matchup opponent is always first to read.
- **From any profile:** another player's profile lists their next sealed picks with read buttons, so tapping a name anywhere leads straight to reading them.

## What is ownable

The expert's playbook and competitor survey (2026-11-10) shaped this section. It describes; it is not a legal opinion.

**Name.** "Reads" describes the action, so it is weak as a mark. Two more distinctive candidates for the founder to choose from:
- **Tells**: suggestive. A poker tell is the sign that gives a player's hand away, and the mechanic is spotting what a sealed pick gives away.
- **Cold Read**: suggestive. It means reading a person without information, which is the action exactly, without describing a pick.

None of the three has had the five-minute USPTO, App Store and web check yet. Every candidate needs a trademark register check before it ships. We avoided every name on the expert's list (Same Game Parlay, SGP, The Feed, Group Parlays, BetCast, Rebet, Rivals, Tails, Swipe the Starter) and every word built from pick, parlay, react, feed, chat, squad, social, league or challenge.

**The steps, in order:**
1. A player's pick in the weekly contest is sealed from every other player until its game kicks off. Before kickoff, others see only the game and the kickoff time: no side, line, price, market type or stake.
2. Before kickoff, another player taps one of four fixed calls on the sealed card (either team, Over, Under). The same four calls are offered on every card, so the buttons reveal nothing. The call locks at kickoff.
3. At kickoff the pick unseals for the whole Field at the same moment. The system scores every call on it, right or wrong, at that moment, before the game is played.
4. At the final the pick grades as usual. The picker's Stack changes only through the contest rules; the caller gets only a line in a read record (right of scored, by player).
5. The caller's weekly 1v1 opponent is offered first, and the profile of every player lists that player's next sealed picks to call.

**Which steps we believe are new:**
- Step 2: a one-tap call on a pick that is still sealed, with identical choices on every card so the call cannot leak the seal.
- Step 3: scoring the call at the kickoff reveal, as its own event, separate from the pick's own result.
- Step 5: scoping the calls to your 1v1 opponent first.

Sealed picks alone (step 1) and grading (step 4) are standard in pick software.

**Against a group chat, a pick feed and a reaction bar:** a chat needs typing, a feed shows picks that are already visible, and a reaction bar reacts to something already shown. Reads is a call on something hidden, scored at a synchronized reveal.

**The playbook's checklist, answered for Reads:**
1. Is the name arbitrary or suggestive, and has it passed the five-minute check? No for "Reads", which is descriptive. "Tells" and "Cold Read" are suggestive, and none has had the check.
2. Is the name free of banned and descriptive words? Yes for all three.
3. Can the mechanic be written as specific, ordered steps? Yes: the five steps above.
4. Is the new part sayable in one sentence? Yes: a one-tap call on a still-sealed pick, scored at the kickoff reveal.
5. Does it depend on something only Rush has? Yes: sealed picks, the kickoff reveal, the weekly 1v1 and a small Field.
6. Does anything of value move between players? No.
7. Does any tap change a Stack, a finish, the season record or a prize? No. A read only adds to a read record.
8. Can a player learn or copy another's side, price or stake before kickoff? No. Sealed cards hide the market type and stake, the calls are the same four on every card, and no count of calls shows before kickoff. There is no copy button, and since picks are pregame only, a 1v1 opponent cannot copy a pick to lock a tie.
9. Fixed taps only, with block and report, and no free text? Partly. The taps are fixed and there is no free text, but block and report are not built.
10. Has the mechanic stayed off every public address? No. It went public on GitHub Pages on 2026-11-10 at about 8:13 PM ET (commit d41e0e0). That date is for the attorney's question 1.

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
- In the full Field view, "N read you" on your own picks and the opponent's half of the read duel are simulated. The honest view (`?field=7`) shows none of them. No count of readers shows on anyone else's sealed card.
- Your reads are stored on your phone only. In the real app the picker would see who read them after kickoff.
- A card flips only if this phone saw it sealed: the stand-in picks need a pregame line, so the page keeps each sealed card it showed and grades it from the final score. Open Reads before tonight's 9:00, 10:00 and 11:00 PM kickoffs to watch cards flip.
- The talk layer is fixed taps only: after a card flips, you can add a one-tap line under it ("Called it", "You got me"). There is no free text. The line stays on your phone in the prototype, and there is no block or report yet.
