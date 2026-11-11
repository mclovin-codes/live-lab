# Rush: one product (Red, Blue and Gold together)

- The app: https://mclovin-codes.github.io/live-lab/app/
- The honest view, exactly 7 players and nothing generated: https://mclovin-codes.github.io/live-lab/app/?field=7. The footer on every page switches between the two views, and the choice holds as you move between pages.

## The idea

**The weekly contest, felt live and shared:** you open the app and see the whole Field's week moving (Slips sealed, seals breaking at kickoff, picks settling, the Ranks and your matchup swinging), and every tap lands on a named player who can answer in one tap.

## What to tap first

1. **Home:** your rank as one big number, your Stack, and a strip of every player's face placed by Stack. Below them are tonight's games, with the faces of who is on each.
2. **Lounge:** one screen. Your matchup, every face, the game that is on (with you, against you), then the room. Hold or double-tap any row for a tapback or a reply.
3. **Your Stack** (top right on every page): your Stack, rank, matchup, open Slips and the free Reload.
4. **Any face or name** opens that player's profile.

## The weekly contest on every screen

- **One event source** (Blue) feeds every page with the week as it happens, each event with the players on it:
  - a Slip sealed (who and which game, nothing else);
  - a seal broken at kickoff (every pick on that game, face up);
  - a game live, with the players on each side;
  - a big play: a scoring play in a live NFL or NHL game the Field holds, with the players it helps;
  - a game settled (who hit, who missed, the Stack change);
  - the Ranks moving;
  - your matchup lead changing hands.
- **Top bar and tabs** (Blue): Home, Board, Contest, Lounge, Me on every page. Your rank and your opponent sit under your name.
- **Contest tab** (Blue):
  - your matchup first ("Your matchup", or "Pairs Thursday 7:00 PM");
  - your week;
  - "The week, moving": the newest events with faces, big plays included ("WPG scored in NJ at WPG: good for Degen"); a face opens the profile, the line opens the game;
  - the Field ordered by Stack.
- **Board** (Blue): every game shows the faces of the players with a pick on it, sealed until kickoff. Live games show the score and Follow, because picks lock at kickoff this round.
- **Game page** (Blue):
  - picks lock at kickoff;
  - "The Field on this game" shows each player as sealed until kickoff. At kickoff it becomes "Seal broken: who took what": the side, price and stake for each player, tagged With you or Against you. This is the full table the Lounge's seal-break rows open;
  - a Lounge link opens the Lounge focused on that game.
- **Home** (Gold), in order:
  1. **The contest card:** your rank as one big number, your Stack and its move since Tuesday, every face in rank order with rank arrows, and doors to the Board and the contest.
  2. **Your matchup:** a tug bar with the same lead figure as everywhere else, and the countdown to Thursday's pairing.
  3. **For you:** replies aimed at you in the Lounge, then your own tapbacks and replies with what came back ("Waiting on Fade" until a real person answers).
  4. **On tonight:** the three games that matter most, with faces, sealed counts and countdowns, then With you and Against you after kickoff.
  5. **The Field right now:** the latest events, big plays included.
  6. **An invite door.**

## The one social space: the Lounge (Red, rebuilt after the council's 4-0 verdict)

- **One screen for the whole Field.** The matchup, the faces and the live game card stay pinned, and only the room scrolls, opening at its newest row. There are no rooms per game and no fixed lines. From the top:
  1. **The Field / My circle** switch.
  2. **Your matchup:** "You 1,000, them 817, lead 183". It is one figure from one source (`Rush.matchup()`), the same number Contest and Home show.
  3. **The faces:** every player with rank and Stack, you and your opponent ringed. A rank change re-sorts the row, each face sliding to its new place. Every face opens a profile.
  4. **The game that is on:** one card, swipe for the others.
     - The live score and period.
     - Before kickoff, who picked it and a countdown. After kickoff, "With you" and "Against you" by face.
     - A "Next seal" chip with its countdown.
     - The card opens the game page.
  5. **The room:** one thread, newest at the bottom, with a "New since you left" divider:
     - Slips sealing (games only);
     - each seal break as one row (game, score, faces with you and against you), which opens the full who-took-what table on the game page;
     - picks settling, with the Stack move counting up, and several on one game folded into one row;
     - older moments behind "Earlier today".
  6. **The seal breaking, live:** at kickoff, with the page open, a "Seal broken" panel flips every pick on that game face up. It fired on the real 10:00 PM kickoffs. Nothing is scored.
- **One tap, and talk on top:**
  - Hold or double-tap any row for the tapback tray (heart, thumbs up, thumbs down, laugh, exclamation, question) or Reply. One tapback per player per row, and your face shows as a badge on it.
  - Reply quotes the row into the one composer, docked above the tabs and the Slip bar.
- **The Field or My circle:** the same screen, filtered (see My circle below).

## My circle (the founder's 9:50 PM note): a filter, not a second space

- **A switch, The Field or My circle,** on Home (Gold), the Lounge (Red) and the Contest tab (Blue). Every page reads the same list from the store (Rush.circle).
- **Ranks stay the whole Field's ranks;** the circle only narrows who is shown.
- **Who is in it:** the players you invited, the one who invited you, and friends you added, once both sides confirm.
- **Adding:** on another player's profile, "Add to my circle" sends an ask ("Asked. Waiting on Dan to confirm"). The other side confirms with one tap.
- **Inviting:** the invite door on Home shares the app link with your name in it. The link only prefills; nothing commits until both sides confirm.
- **There is no reward for inviting or adding, no push, no boost, no timer and no separate contest.** The referral multiplier stays the only boost.
- **Friends of friends:** "In your friends' circles" suggests players to add, on Me and on an empty circle.
- **An empty circle** shows the invite door and three faces to add, never a blank page.
- **In the honest view** no stand-in confirms, so a circle stays as real as the players in it.

## With 7 players and nobody typing

- The honest view gives exactly 7 players everywhere, ranks 1 to 7 (ties share a rank), and about 6 picks per player, as Week 8 ran.
- Your matchup opponent is always one of the 7.
- Nothing is generated: no stand-in talk, no stand-in tapbacks, no head counts.
- The pages are still full:
  - the live game with who is on each side;
  - the next seal and its clock;
  - the sealed picks of the other six;
  - the week's events with faces;
  - a tapback or a reply on every row.
- At 30 players every game has more faces and more taps come back.

## Making a pick: the Slip (Blue, after the founder's 10:00 PM note)

**How it works now:**
- A tap on a price, on the game page or on a pregame Board row (moneylines), fills the cell and adds the pick to one Slip, minimized as a bar above the tabs on every page. A second tap on the same cell removes it.
- Each further tap adds to the same Slip, from any game, and the bar updates in place: count, combined price, and "25 stake pays 91".
- The Slip never opens by itself. Tapping the bar opens it with two tabs:
  - **Parlay:** the legs, remove per leg, and Add picks, which drops you back with the bar minimized.
  - **Straights:** a stake box per pick, plus Stake all.
- Under both tabs: quick-add chips (+10, +25, +50, +100, no Max) and a number pad. One button reads the stake and what it pays, or "Enter stake" (disabled) when there is none. The stake starts at your last stake.
- At Place the price is checked: a better price is taken, a worse one asks once ("Price moved... Tap again"). A stake above your Stack reads "Your Stack is 225".
- After placing: a receipt with the picks, stake, pays and time, plus Keep picks in Slip and Done.
- Featured parlays fill the same Slip.

**Bugs found before the fix (walked at 375 px):**
1. Every price tap opened a full Slip sheet over the game.
2. A parlay needed "Add to parlay" in a sheet for every leg.
3. Parlay legs lived on one game page only. Leaving the game lost them, so a parlay across games was impossible.
4. One pick at a time: a second straight meant a second sheet.
5. A Max chip, which the rulings removed.
6. A leftover "Place in" contest row.
7. Placing ended in a toast only, with no receipt.

**Tap counts, before and after:**
- **One straight:** 2 before (price, Lock in a sheet over the game). 3 after (price, bar, Place), and the game stays in view until you choose to open the Slip.
- **Two-leg parlay across games:** not possible before (6 taps for two legs inside one game). 4 after, straight from the Board: price, price on another row, bar, Place.
- **Two picks from one game:** 4 before (price, Lock, price, Lock). 4 after (price, price, bar, Place) as a parlay, or one more tap (Straights) to place them as two straights.

## Profile and Slips (Gold)

- **Every profile:** a big face, the Stack, the rank, the season record and the move this week. One player has one face everywhere.
- **Another player's profile adds:**
  - you vs them, as a Stack bar;
  - Between you: your tapbacks and replies to them ("Waiting on Fade" until one comes back), and their replies to you;
  - their week: sealed picks show only the game and the countdown; picks that have kicked off show the side, tagged With you or Against you; settled picks show HIT or MISS;
  - Talk in the Lounge, Add to my circle, Block and Report.
- **Your profile adds:** your Slips (Open and Settled), your opponent, and your Season 1 weeks as green and red tiles.
- **Slips live in two places:** the Stack sheet (one tap from any page) and Me. The full Slips page (placed picks, Open and Settled) is linked from Me, and its Parlay button opens the one Slip. There is no Slips tab.
- **Visual pass:**
  - one palette on every page: background #0A0F15, cards #141C26, text #F4F7FA, accent #3DB8FF;
  - big numbers in Barlow Condensed;
  - sub-lines 13px or larger;
  - motion off under reduced motion.

## What came from each team

- **Blue:** the shell, from its Phase 4 build:
  - the five tabs, the top bar and the Stack sheet;
  - one Stack figure everywhere;
  - the Contest tab, the Board and the game page;
  - the event source;
  - the honest 7-player store;
  - the pinned matchup;
  - pregame lines kept after kickoff, so revealed picks stay the same picks;
  - the Phase 3 and multi-contest cleanup;
  - the one Slip and its bar;
  - the circle in the store, and its switch on the Contest tab.
- **Red:** the Lounge, rebuilt as one screen:
  - the matchup and faces;
  - the live game card with you and against you;
  - Seal broken, live;
  - the room with tapbacks and replies;
  - the circle filter.
- **Gold:**
  - Home's contest card, On tonight, the matchup tug bar and The Field right now;
  - every profile, with Block and Report;
  - where Slips live;
  - the palette and type;
  - the honest-view toggle in every footer.

## Expert lines kept

- Tapbacks and replies move nothing of value and change no Stack, finish, season record or prize.
- There is no copy button and no reward for tapping.
- Before kickoff, a pick shows only who and which game, everywhere.
- Picks lock at kickoff, with no in-game picking.
- If the space or its moment gets a name, the candidates are "The Rail" (Red) and "Sealbreak" (Gold). The founder chooses, and each needs a trademark check.

## Unfinished or faked

- **The other players are stand-ins.** Their picks are real games and lines, but not real people. They never tap back or reply, so in the honest view only your own tapbacks and talk appear.
- **On this phone only:** tapbacks, talk, Block, Report, the circle and the invite link work locally. Nobody else sees them until a server exists.
- **Big plays** come from ESPN's scoring plays for NFL and NHL. The time shown is when this phone first saw the play. NBA has no big plays, because scoring is constant.
- **The time a stand-in placed a Slip** is simulated before its kickoff. Your own Slips use the real time.
- **Rank arrows on Home** compare with what this phone last saw.
- **The price check at Place** covers picks on the game page you have open: a better price is taken, a worse one asks once. A pick from another game places at the price shown when you tapped it.
- **A stand-in's pick on a game that started before this phone first loaded it** uses that game's closing line from ESPN's game summary, because the scoreboard drops the pregame line at kickoff. Only when no closing line exists does it fall back to a moneyline at -110.
