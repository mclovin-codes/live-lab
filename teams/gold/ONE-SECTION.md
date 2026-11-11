# Gold's part of the one product (for app/SUMMARY.md)

## Home: the week, front and centre
Home opens on the weekly contest, in this order:
1. **The contest card:**
   - your rank as one big number ("#3 of 7 in the Field");
   - your Stack and how far it has moved since Tuesday;
   - every face in the Field in rank order (a window around you in a big Field), each with its Stack and a rank-move arrow since you last looked;
   - two doors: Make picks (Board) and The contest.
2. **Your matchup:** you and your opponent face to face, a tug bar, "You lead by 38", and the countdown to Thursday's 7:00 PM pairing.
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
- **Every profile:** a big face, the Stack, the rank of the Field, the season record and the move this week. The face colours and initials are the same as the top bar's, so one player has one face everywhere.
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

## Where Slips live
- **The Stack sheet:** tap your Stack in the top bar for the Stack, the rank and your open Slips (Blue's shell).
- **Me:** your Slips, Open and Settled, each with its game, its live score or kickoff countdown, the stake and the return.
- **slips.html:** the full page of placed picks, linked from Me ("All Slips"). Its Parlay tab opens the one shared Slip (Rush.slip), so there is one way to build a parlay.
- There is no Slips tab.

## The visual pass
- **One palette and type scale on Home, profiles and Slips:**
  - background #0A0F15, cards #141C26 and #1B2531;
  - text #F4F7FA, muted text #A3AFBD, accent #3DB8FF;
  - green #3DD68C, red #FF6B6B;
  - big numbers in Barlow Condensed 800.
- Sub-lines are 13px or larger. Motion (the Field strip, the tug bars, the live dot) turns off under reduced motion.
- The same palette went to Blue and Red for their pages, plus one face system for everyone.
- The last Units labels on Slips are gone (Stack only).

## The honest view
- ?field=7 on any page, or the footer toggle on every page, shows exactly 7 players with nothing generated. The choice holds across pages (honest.js, the footer and the localStorage key 'rush-field'). The store gives the 7-player Field, so ranks run 1 to 7 everywhere.
- In that view Home's counts are real counts of the 7 players' picks, and the events are the 7 players' own.

## Unfinished or faked (Gold's parts)
- **The other six players are stand-ins:** their picks are real games and lines, but not real people.
- **On this phone only:** Block, Report, Add to my circle and the invite link work locally. Nobody else sees them until a server exists.
- **Rank arrows** compare with what this phone last saw, not with a server snapshot.
