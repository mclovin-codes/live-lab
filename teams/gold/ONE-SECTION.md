# Gold's part of the one product (for app/SUMMARY.md)

## The top bar (every page)
- **As the Rush app has it** (AppHeader.tsx): on the left, your face (your chosen preset avatar) and the page title; on the right, ONE pill with the real Stack mark (the three chips from CreditCoin.tsx) and your Stack. Nothing else: no subtitle, no rank line, no opponent, no boxed label.
- **The pill is alive:** when your Stack changes it counts to the new figure and flashes green or red once. A tap opens the Stack sheet.
- Bebas Neue figures and the app's colours (#0B1118, #121A23, #00BFFF, #10B981, #EF4444).

## Home: the week, front and centre
Home opens on the weekly contest, in this order:
1. **The contest card:**
   - your rank and your Stack side by side as big figures, the Stack with its mark, and the move since Tuesday;
   - the Field or My circle switch;
   - the rank strip: every player in rank order, swiped sideways, with the gap under it ("91 behind 1st"):
     - 1st is pinned at the left edge, always.
     - Your tile sits in its own place in the order. While your place is off to the right, your tile waits at the right edge and the others pass by.
     - When your place arrives, your tile falls back into line, and past you it scrolls away to the left. If you are 1st, there is one tile, pinned left.
     - Ranks are unique (the store breaks ties). Each face carries its Stack and a rank-move arrow, and pulses green or red when that player's pick settles.
   - two doors: Make picks (Board) and The contest.
2. **Your matchup:** one row with both Stacks and the gap as the figure ("+89, you lead"), a tug bar, and the countdown to Thursday's 7:00 PM pairing.
3. **For you:** replies other players aimed at you in the Lounge, each with a door to reply, then your own tapbacks and replies with what came back ("You sent Fade 🔥 · Waiting on Fade"). The honest view shows only real replies, so the waiting line stays until a real person answers.
4. **On tonight:** the three games that matter most right now. Live games come first, then games you hold a pick on, then games the Field is on.
   - Before kickoff a card shows the faces of the players who have a pick on it, the number of sealed picks and the countdown to the seal breaking. It never shows a side or a stake.
   - After kickoff it splits into With you and Against you, by face.
   - Each card opens that game, and also the Lounge focused on that game.
5. **The Field right now:** the latest events from the one event source, each with up to three faces and the people named ("Sharp hit, Tungsten missed · COL at TOR"), including big plays with who they are good and bad for.
6. **The Field (only in a Field bigger than 7):** the top five plus you, with rank arrows. In a Field of 7 the ladder already shows everyone.
7. **An invite door at the bottom** (index.html#invite): the share sheet, or copy the link.

## Profile: yours and everyone else's
- **Opening one:** every face and name on Home, in the Lounge and in the Contest opens player.html?u=<id>. Your own avatar in the top bar opens yours (the Me tab).
- **Every profile:** a banner, a big face, the name, then figures only: Stack (with the mark), rank of the Field, season record, and the move this week.
- **Faces everywhere** are the Rush app's 12 preset avatars (an Ionicon in a tinted disc, from faces.js). Yours is the one you choose; stand-ins keep a stable one.
- **Edit profile (on Me):** choose your avatar from the app's presets, a banner from six, and your display name. The avatar shows in the header, on Home, on profiles, and wherever a page draws faces with faces.js.
- **Another player's profile adds:**
  - You vs them: a Stack bar and "You are 319 behind";
  - Between you: your tapbacks and replies to them ("Waiting on Fade" until one comes back), and their replies to you with a door to reply in the Lounge;
  - their week: picks that have kicked off show the side, with a WITH YOU or AGAINST YOU tag when you are on the same game; sealed picks show only the game and the countdown; settled picks show HIT or MISS;
  - Talk in the Lounge, Add to my circle (the Lounge's My circle reads it), Block and Report.
- **Your profile adds:** your Slips (Open and Settled), your matchup opponent, and your Season 1 weeks as green and red tiles.

## My circle (Gold's parts)
- **A filter, not a second space.** Home's contest card has a switch: The Field or My circle. My circle keeps the same ladder, ranks and Stacks, showing only you and your circle (ranks stay the whole Field's).
- **Who is in it:** the players you invited, the one who invited you, and friends you added, once both sides confirm.
- **Adding:** on another player's profile, "Add Dan to my circle" sends an ask. The button then reads "Asked. Waiting on Dan to confirm". When someone asks you, it reads "Dan asked to join your circle. Confirm" (one tap). Stand-ins confirm only in the stand-in view, never in the honest view.
- **Inviting:** the invite door at the bottom of Home shares the app link with your name in it. A friend arriving by that link sees "Dan invited you" with Confirm. The link only prefills; the circle commits when both sides confirm. There is no reward for inviting or adding, and no push.
- **Me:** your circle, who is waiting on whom, "In your friends' circles" (friends of friends to add) or, when that is empty, players to add, and Invite a friend while the circle is small.
- **An empty circle** shows three faces to add and the invite door, never a blank page.

## One game card, and no logos (game-card.js, team-mark.js)
- **One card for Home and the Lounge's pinned game,** in the team's own look (the Board draws its own rows with the same team marks and three-column cells). It takes only the mechanics from the Rush app's board cards:
  - a header with the league and the clock or kickoff;
  - two team rows, each with the team mark, its code, name and record, and the score;
  - while the game is open, the price cells: Spread, Total and ML, tapping into the one Slip exactly as on the Board.
- **Home adds only one quiet line:** small faces beside the side each player took (a count when more than four), totals as one small group at the bottom, and a single "N sealed" chip before kickoff. The old four boxes are gone.
- **No official logos or player photos:** a drawn, shaded object per sport, tinted with the team's two colours from the feed, with the team's code on it:
  - football: a helmet;
  - basketball: a jersey;
  - hockey: a sweater;
  - baseball: a cap.
  - A player gets a jersey with their number. A missing or too-close colour pair falls back to a readable one.
- **Logo requests:** Blue's store hands every page the mark in place of the logo, so no logo image request leaves Home, profiles or Slips.

## Where Slips live
- **The Stack sheet:** tap your Stack in the top bar for the Stack, the rank and your open Slips (Blue's shell).
- **Me:** your Slips, Open and Settled, each with its game, its live score or kickoff countdown, the stake and the return.
- **slips.html:** the full page of placed picks, linked from Me ("All Slips"). Its Parlay tab opens the one shared Slip (Rush.slip), so there is one way to build a parlay.
- There is no Slips tab.
- **One Slip card everywhere (slip-card.js):** Me, slips.html, other players' profiles and the Lounge all draw a Slip the same way, like a real slip.
  - A straight or a prop is one line with market, line and price.
  - A parlay (two to five legs, across games or inside one game) is ONE card listing every leg with its state: sealed, open, live with the score, hit or missed.
  - Underneath: Stake, the combined price, and what it pays (or paid).
  - On another player's Slip, each leg shows only its game until its own kickoff, and the stake, price and payout stay sealed until every leg has started (Blue's Rush.sealView).
  - A Slip with every leg still sealed folds into one compact row: its games, "Each leg opens at its kickoff, first in 3d 13h", and "stake sealed". A profile of six Slips fits on a phone screen.
  - Home counts a Slip once per game, so a five-leg parlay is one Slip with one stake.

## The visual pass
- **One palette and type scale on Home, profiles and Slips:**
  - background #0A0F15, cards #141C26 and #1B2531;
  - text #F4F7FA, muted text #A3AFBD, accent #3DB8FF;
  - green #3DD68C, red #FF6B6B;
  - big numbers in Barlow Condensed 800.
- Sub-lines are 13px or larger. Motion (the Field strip, the tug bars, the live dot) turns off under reduced motion.
- The same palette went to Blue and Red for their pages, plus one face system for everyone.
- The last Units labels on Slips are gone (Stack only).

## Viewing as not entered (founder 11:35)
- **The footer toggle** on every page has a second line: "Viewing as: entered · not entered" (?entered=0 or 1, kept in localStorage 'rush-entered'; Blue's store reads the same key through Rush.entered()).
- **The top bar:** the Stack pill reads ENTER in cyan. A tap enters.
- **Home becomes the Enter door:**
  - the week and when it ends, how many are in the Field, one line ("Free to enter. Every entrant starts with 1,000 Stack"), and one big Enter free;
  - the Field as faces with their Stacks blurred ("Enter to see the Stacks and where you'd stand"), with no rank, no gap and no matchup;
  - tonight's game cards with scores and "N IN THIS GAME" (or "No one in this game yet");
  - the invite door.
- **Me:** the Stack reads ENTER and the rank reads "-". The Slips block becomes "Enter to start" with Enter free. Profile, Edit, the circle and the invite door all still work.
- **The Enter moment:** one tap (the hero button, the Me card or the pill). The blur clears, the pill counts up from 0 to 1,000 and flashes green, and Home turns into the contest card with your tile in the strip.
- Blue's Contest shows a visitor no rank or matchup, plus the Join card; the game page shows its Enter card.

## The honest view
- ?field=7 on any page, or the footer toggle on every page, shows exactly 7 players with nothing generated. The choice holds across pages (honest.js, the footer and the localStorage key 'rush-field'). The store gives the 7-player Field, so ranks run 1 to 7 everywhere.
- In that view Home's counts are real counts of the 7 players' picks, and the events are the 7 players' own.

## Unfinished or faked (Gold's parts)
- **The other six players are stand-ins:** their picks are real games and lines, but not real people.
- **On this phone only:** Block, Report, Add to my circle and the invite link work locally. Nobody else sees them until a server exists.
- **Rank arrows** compare with what this phone last saw, not with a server snapshot.
