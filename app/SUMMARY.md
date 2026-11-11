# Rush: one product (Red, Blue and Gold together)

- The app: https://mclovin-codes.github.io/live-lab/app/
- The honest view, exactly 7 players and nothing generated: https://mclovin-codes.github.io/live-lab/app/?field=7. The footer on every page switches between the two views, and the choice holds as you move between pages.

## The idea

**The weekly contest, felt live and shared:** you open the app and see the whole Field's week moving (Slips sealed, seals breaking at kickoff, picks settling, the Ranks and your matchup swinging), and every tap lands on a named player who can answer in one tap.

## What to tap first

1. **Home:** your rank as one big number, your Stack, and a strip of every player's face placed by Stack. Below them are tonight's games, with the faces of who is on each.
2. **Lounge:** one page that scrolls, with a slim game bar and the composer that stay put. Tap the bar for the game card. Hold or double-tap any row for a tapback or a reply.
3. **Contest:** two equal panels, The contest and Your matchup. Tap one to open it.
4. **Board:** league pills, one row of market tabs, three price columns. A tap adds the pick to the one Slip bar; tap the bar to place.
5. **Your Stack** (top right on every page): your Stack, rank, matchup, open Slips and the free Reload.
6. **Any face or name** opens that player's profile.
7. **A visitor's view:** add ?entered=0, or use the footer toggle, to see the app as someone who has not entered.

## The weekly contest on every screen

- **One event source** (Blue) feeds every page with the week as it happens, each event with the players on it:
  - a Slip sealed (who and which game, nothing else);
  - a seal broken at kickoff (every pick on that game, face up);
  - a game live, with the players on each side;
  - a big play: a scoring play in a live NFL or NHL game the Field holds, with the players it helps;
  - a game settled (who hit, who missed, the Stack change);
  - the Ranks moving;
  - your matchup lead changing hands.
- **Top bar** (Gold's topbar.js, drawn through Blue's nav.js after the founder's 11:00 PM note): your face and the page's name on the left; on the right one Stack pill with the Stack mark. It counts up or down and flashes when your Stack moves, and a tap opens the Stack sheet.
- **Tabs** (Blue): Home, Board, Contest, Lounge, Me on every page.
- **One rank rule** (Blue, in the store, after the founder's 11:00 PM note): ranks are unique. Equal Stacks are ordered by more Slips won, then fewer Slips lost, then name. Every page reads r.rank from the store, so no two players share a number anywhere.
- **Contest tab** (Blue, rebuilt after the founder's 11:00 PM note): two equal panels at the top.
  - **The contest:** your rank of N as one big figure, the gap to 1st, and every player on one track by Stack (you blue, your opponent pink).
  - **Your matchup:** the lead as one big figure and the lead bar, both Stacks under it.
  - Tap a panel and it takes the screen; the other shrinks to a slim bar that brings it back. Tap the open one to see both again.
  - The contest, opened: The Field / My circle, the Field by Stack, and the line under 3rd: "Top 3 take the week's prizes".
  - Your matchup, opened: both Slip records (won-lost, open), your Slips, then your opponent's Slips, each leg sealed until its own kickoff.
  - Gone: "The week, moving" (the Lounge is the only home for the stream), the "Your week" tiles, and the floating pinned row that covered the list.
  - **Season:** Season 1 as weeks won and lost, one line of copy ("A week above 1,000 Stack is a win."), the same 7 players in the honest view, and the preset faces.
  - **For a visitor who has not entered:** one Enter door on top ("Free. You get 1,000 Stack."), then the two panels with the week, the Field size and the faces; rank, gap, Stack and the matchup sit blurred in place, and the Field is listed by name with its Stacks blurred. The blurred figures are placeholders, never the real numbers. Enter lifts the blur and the real figures arrive.
- **Viewing as not entered** (Blue in the store, Gold's footer toggle, after the founder's 11:35 PM note): ?entered=0 shows every page as a visitor who has not entered. ?entered=1, the footer toggle, or entering returns to the real state. Rush.entered() is the one answer every page reads.
  - In the store, a visitor sees every other player's leg sealed, even after kickoff (Rush.sealView), and has no rank badge on the Contest tab.
  - A visitor's price tap, anywhere, opens Enter first; after one tap on Enter the pick lands in the Slip.
  - On the game page, the Field on this game stays sealed for a visitor.
- **Board** (Red, rebuilt after the Rush iOS app on the founder's 11:20 PM note):
  - league pills NFL, NBA, NHL, landing on NFL, and one row of market tabs, Game Lines first (NBA Points, Rebounds, Assists; NHL Goals, Points, Assists; NFL has no player data yet, so Game Lines only);
  - day headers (TODAY, TOMORROW, THU · NOV 12) over SPREAD, TOTAL and ML columns;
  - game cards: the team mark, abbreviation and nickname, 64x46 price cells (line over price, white when picked), the time, and "Props + More". Live games show the score with the cells locked;
  - a family tab lists up to 5 player rows per game with three rung tiles (20+, 25+, 30+);
  - pinned: only the shared header and the pills and tabs bar. Nothing else floats;
  - **the lag, measured on the live link at 375 with performance.now from a tap through layout:** before, 41 to 152 ms per pill tap and a page 15,158 px long; after, 0 to 52 ms, most 4 to 13 ms (the high ones right after a background refresh), 1 to 5 ms warm. Each league and tab view is built once per data version and swapped from memory, the rest prebuilt at idle; data loads only on the timer; nothing refetches on a tap; a skeleton shows on first load.
  - Spread and total prices on the Board are a stand-in -110, because the scoreboard feed gives none; prop rungs are priced from the pregame leader figures.
- **Game page** (Blue):
  - market tabs (Popular, Game Lines, Alt Lines, Team Totals, Halves or Periods, Player Props) redraw from memory in 2 to 6 ms with no fetch; each market section folds by its header, and the choice is kept;
  - alternate spreads and totals on a track, as in the app: seven lines around the main one, one tap picks a line, and its two prices sit under it;
  - team marks at the team's own scale (64 px in the header, 44 px in rows), and on every prop row the player's number on his team's jersey (40 px);
  - no logos and no player photos: teams are Gold's drawn team marks in their two colours (for football, a speed-style helmet in side profile; all four marks share one light), players a plain jersey;
  - picks lock at kickoff;
  - "The Field on this game" shows each player as sealed until kickoff. At kickoff it becomes "Seal broken: who took what": the side, price and stake for each player, tagged With you or Against you. This is the full table the Lounge's seal-break rows open;
  - a Lounge link opens the Lounge focused on that game.
- **Home** (Gold): the contest card with the rank strip, your matchup, For you, On tonight, The Field right now, and the invite door (details in Gold's section below).

## The one social space: the Lounge (Red, rebuilt as one page scroll after the founder's 12:05 AM note)

**One page that scrolls like a chat.** The Lounge is one page scroll with no box scrolling inside another. Three things stay put: the header, a slim game bar, and the composer docked above the tabs and the Slip bar. Everything else, the room included, scrolls with the page, and the page opens at its newest row (or at "New since you left"). There are no rooms and no fixed lines.

**At the top (scrolls away), one compact block of about 120 px:**
1. **The Field / My circle** switch and **your matchup** on one row: You 1,000, "lead 19", 981 Chalk. The matchup is one figure from one source (Blue's `Rush.matchup()`), the same number Contest shows.
2. **The faces** as one row of small tiles that swipes sideways: the app's preset avatar (Gold's `RushFace`, your own from Edit profile), rank and Stack, no names wrapping. Ranks are the store's unique `r.rank`; you are ringed blue and your opponent pink. Every face opens a profile.

**The game bar (sticky, 44 px):** one slim bar per game, swiped sideways: both team marks (28 px), the score and the live clock with a pulsing dot (or a countdown before kickoff), and a chevron. A "Next seal" chip sits beside it. A tap drops open Gold's one game card (`GameCard`, the same card as Home) with one line of small faces beside each team and one small group for totals and props; before kickoff its Spread, Total and ML cells add to the one Slip. A second tap closes it. It is closed by default.

**On arrival the room is most of the screen:** about 72% at 375 x 812 and 66% at 375 x 667. The page opens at the newest row with the composer docked.

**The room:** the only home for the week's stream of moments, one thread, newest at the bottom, with a "New since you left" divider.
- **Slips sealing:** one row per player, naming only the games.
- **Seal broken:** one row per game (score, faces ringed green with you and red against you). It opens to each player's Slip.
- **Slips settling:** a Stack move shows as a big green or red figure that counts up on arrival, only on the game that decided the Slip; other legs show Blue's line ("Needs WSH +4.5 and 1 more"). Several on one game fold into one row of one line ("12 Slips settled on MIA at UTAH", about 57 px) with three faces side by side and the two biggest moves, and a tap anywhere on the row opens the rest.
- **Opening a row** (a settlement, a seal broken): one block open at a time. Its header sticks under the game bar, it grows in the page (no window inside the page), and it ends in "Hide 17 Slips", so it closes from where the thumb is; closing returns the page to where the block started.
- **Earlier today** holds everything older.

**Every pick is a Slip,** drawn with Gold's one Slip card:
- A straight shows market, line and price; a prop shows the player and the stat line; a parlay is one card with its legs.
- Another player's Slip always passes through Blue's `sealView` before Gold's card draws it: a leg is sealed until its own game kicks off, showing the game only (no market, side, line, player or stake); then it shows the pick, then hit or missed.

**The seal breaking, live:** at kickoff, with the page open, a sheet floats up: "Seal broken: OKC at POR", one line per player (the leg on this game and its price, parlay or straight, with you or against you), each opening to the full Slip. This fired on the real 10:00 and 11:00 PM kickoffs; at 11:00 it opened the third leg of a live 3-leg parlay.

**It moves:**
- When a pick settles, that player's Stack on the faces row bumps and counts to its new figure.
- When ranks change, the faces slide into their new order and the moved rank badges flash.
- The live score ticks when it changes.

**Phone details:** the composer rides on top of the keyboard (`visualViewport`) with a 16 px input; long lines wrap inside their bubble; sideways rows never pull the page; the composer re-docks when the Slip bar appears.

**One tap, and talk on top:**
- Hold or double-tap any row for the tapback tray: heart, thumbs up, thumbs down, laugh, exclamation, question, or Reply. One per player per row; your face shows as a badge on the row.
- Reply quotes the row into the one composer, docked above the tabs and the Slip bar. A line you send is tagged with the game on the game bar ("on DET at STL").
- Home's "For you" shows your tapbacks and replies.

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

- The honest view gives exactly 7 players everywhere, ranks 1 to 7 (unique: equal Stacks go by Slips won, then Slips lost, then name), and about 6 picks per player, as Week 8 ran.
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

## Real Slips, for every player (after the founder's 10:45 PM note)

- **Every player's picks are real Slips, in the honest view and the full Field alike:**
  - straights on the spread, the total and the moneyline;
  - player props, built from each game's pregame leaders: NBA points, rebounds and assists; NHL goals ("to score"), assists and points at 0.5;
  - parlays of 2 to 5 legs, some across games and some inside one game.
- **The mix** follows COHORT-WEEK8.md (Weeks 5 to 8: about 6 Slips per entrant, 48% parlays). The cohort has no figure for props, so about a third of straights are props. Tonight's stand-in Field comes out at about 43% parlays, 8% props and 49% straights.
- **One Slip shape for all of them:** legs (game, market, selection, line, price, result), stake, combined price, what it pays, and status. Gold's Slip card draws it on Me, Slips and every profile.
- **The seal holds on each leg.** A straight or prop opens at its game's kickoff. A parlay is one card whose legs open one by one, each at its own game's kickoff. Before that a leg shows only the game: no market, side, line, price or stake, and the stake and price stay sealed while any leg is sealed.
- **Grading:**
  - each leg grades at its game's final, props from the box score;
  - a parlay settles as soon as a leg misses, or when its last leg is in;
  - the Stack moves once, on the game that decided the Slip.
- **The events carry the whole Slip:** a settled row says which leg hit or missed and what the Slip still needs ("Needs WSH +4.5 and 1 more", "Missed: Over 226.5"). Rank and Stack moves come from Slip results.
- **With you or against you** compares like with like: team against team, Over against Under. A prop sits under "on this game", with no opponent invented.
- **The builder takes props the same way as sides:**
  - a prop row on the game page taps into the same minimized Slip bar;
  - props from different players stack;
  - the other side of the same pick replaces it;
  - picks from one game combine into a same-game parlay.

## Gold: the top bar, Home, profiles, the game card and where Slips live

### The top bar (every page)
- **As the Rush app has it** (AppHeader.tsx): on the left, your face (your chosen preset avatar) and the page title; on the right, ONE pill with the real Stack mark (the three chips from CreditCoin.tsx) and your Stack. Nothing else: no subtitle, no rank line, no opponent, no boxed label.
- **The pill is alive:** when your Stack changes it counts to the new figure and flashes green or red once. A tap opens the Stack sheet.
- Bebas Neue figures and the app's colours (#0B1118, #121A23, #00BFFF, #10B981, #EF4444).

### Home: the week, front and centre
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

### Profile: yours and everyone else's
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

### My circle (Gold's parts)
- **A filter, not a second space.** Home's contest card has a switch: The Field or My circle. My circle keeps the same ladder, ranks and Stacks, showing only you and your circle (ranks stay the whole Field's).
- **Who is in it:** the players you invited, the one who invited you, and friends you added, once both sides confirm.
- **Adding:** on another player's profile, "Add Dan to my circle" sends an ask. The button then reads "Asked. Waiting on Dan to confirm". When someone asks you, it reads "Dan asked to join your circle. Confirm" (one tap). Stand-ins confirm only in the stand-in view, never in the honest view.
- **Inviting:** the invite door at the bottom of Home shares the app link with your name in it. A friend arriving by that link sees "Dan invited you" with Confirm. The link only prefills; the circle commits when both sides confirm. There is no reward for inviting or adding, and no push.
- **Me:** your circle, who is waiting on whom, "In your friends' circles" (friends of friends to add) or, when that is empty, players to add, and Invite a friend while the circle is small.
- **An empty circle** shows three faces to add and the invite door, never a blank page.

### One game card, and no logos (game-card.js, team-mark.js)
- **At the team's scale (founder 12:10):** 46 px team marks, 30 px team codes, 40 px scores, 62 by 54 px price cells, and no text under 13 px.
- **One card for Home and the Lounge's game bar,** in the team's own look (founder 11:40: the team's sizing, type and contrast: #141C26 card, 20px corners, a chip header, Barlow Condensed 800 figures, #3DB8FF price cells). The Board draws its own rows with the same team marks and three-column cells. It takes only the mechanics from the Rush app's board cards:
  - a header with the league and the clock or kickoff;
  - two team rows, each with the team mark, its code, name and record, and the score;
  - while the game is open, the price cells: Spread, Total and ML, tapping into the one Slip exactly as on the Board.
- **Home adds only one quiet line:** small faces beside the side each player took (a count when more than four), totals as one small group at the bottom, and a single "N sealed" chip before kickoff. The old four boxes are gone.
- **No official logos or player photos:** a drawn, shaded object per sport, tinted with the team's two colours from the feed, with the team's code on it:
  - football: a speed-style helmet in side profile (founder's 11:50 style note, our own drawing): a shaded shell with a crown highlight, dark vents, ear hole, jaw pad, chin strap and a multi-bar mask with clips;
  - basketball: a jersey;
  - hockey: a sweater;
  - baseball: a cap.
  - All four share one light, from the top left, so they read as one set.
  - **Both team colours on every mark (founder 12:10):** the helmet's facemask and centre stripe, the trim on jerseys and sweaters, and the cap's brim and button are in the secondary colour. Codes and numbers use the secondary when it reads on the primary (3:1), else white or dark ink. A secondary missing or too close to the primary falls back to a readable pair, and a dark primary gets a light edge and a lighter highlight, so a mark is never one flat colour.
  - **Player marks for prop rows** (TeamMark.player, also TeamMark.playerMark): one per sport, distinct from the team mark. Football is a jersey with pads and sleeve stripes, basketball a tank, hockey a sweater, baseball a button-front. The body is in the primary and the number and trim in the secondary, with the short code when the feed gives no number. No headshots.
  - **Sizes:** 46 px on a game card, at least 44 on a Board row, 64 or more in the game page header, 40 for a player mark on a prop row, and 28 minimum anywhere else.
  - A player gets a jersey with their number. A missing or too-close colour pair falls back to a readable one.
- **Logo requests:** Blue's store hands every page the mark in place of the logo, so no logo image request leaves Home, profiles or Slips.

### Where Slips live
- **The Stack sheet:** tap your Stack in the top bar for the Stack, the rank and your open Slips (Blue's shell).
- **Me:** your Slips, Open and Settled, each with its game, its live score or kickoff countdown, the stake and the return.
- **slips.html:** the full page of placed picks, linked from Me ("All Slips"). Its Parlay tab opens the one shared Slip (Rush.slip), so there is one way to build a parlay.
- There is no Slips tab.
- **One Slip card everywhere (slip-card.js):** Me, slips.html, other players' profiles and the Lounge all draw a Slip the same way, like a real slip.
  - A straight or a prop is one line with market, line and price.
  - A parlay (two to five legs, across games or inside one game) is ONE card listing every leg with its state: sealed, open, live with the score, hit or missed.
  - Underneath: Stake, the combined price, and what it pays (or paid).
  - On another player's Slip, each leg shows only its game until its own kickoff, and the stake, price and what it pays stay sealed until every leg has started (Blue's Rush.sealView).
  - A Slip with every leg still sealed folds into one compact row: its games, "Each leg opens at its kickoff, first in 3d 13h", and "stake sealed". A profile of six Slips fits on a phone screen.
  - Home counts a Slip once per game, so a five-leg parlay is one Slip with one stake.

### The visual pass
- **One palette and type scale on Home, profiles and Slips:**
  - background #0A0F15, cards #141C26 and #1B2531;
  - text #F4F7FA, muted text #A3AFBD, accent #3DB8FF;
  - green #3DD68C, red #FF6B6B;
  - big numbers in Barlow Condensed 800.
- Sub-lines are 13px or larger. Motion (the Field strip, the tug bars, the live dot) turns off under reduced motion.
- The same palette went to Blue and Red for their pages, plus one face system for everyone.
- Slips show Stack only.

### Viewing as not entered (founder 11:35)
- **The footer toggle** on every page has a second line: "Viewing as: entered · not entered" (?entered=0 or 1, kept in localStorage 'rush-entered'; Blue's store reads the same key through Rush.entered()).
- **The top bar:** the Stack pill reads ENTER in cyan. A tap enters.
- **Home becomes the Enter door:**
  - the week and when it ends, how many are in the Field, one line ("Free to enter. Every entrant starts with 1,000 Stack"), and one big Enter free;
  - the Field as faces in name order (not rank order) with placeholder figures blurred under them ("Enter to see the Stacks and where you'd stand"), with no rank, no gap and no matchup;
  - tonight's game cards with scores and "N IN THIS GAME" (or "No one in this game yet");
  - the invite door.
- **Me:** the Stack reads ENTER and the rank reads "-". The Slips block becomes "Enter to start" with Enter free. Profile, Edit, the circle and the invite door all still work.
- **The Enter moment:** one tap (the hero button, the Me card or the pill). The blur clears, the pill counts up from 0 to 1,000 and flashes green, and Home turns into the contest card with your tile in the strip.
- **Another player's profile, for a visitor:** Stack and rank are blurred placeholders in place, the week's move is hidden, You vs them is one Enter door over a blurred bar, and there are no WITH YOU or AGAINST YOU tags.
- **Their Slips, for a visitor (slip-card.js):** only the games and ENTER TO SEE, even after kickoff; stake, price and what it pays are blurred placeholders. A real figure never reaches the page.
- Blue's Contest and game page follow the same rules (see the contest section above).

## What came from each team

- **Blue:** the shell, from its Phase 4 build:
  - the five tabs, the shell that draws the top bar, and the Stack sheet;
  - one Stack figure everywhere;
  - the Contest tab (two equal panels) and the game page;
  - the event source;
  - the honest 7-player store;
  - the pinned matchup;
  - pregame lines kept after kickoff, so revealed picks stay the same picks;
  - the Phase 3 and multi-contest cleanup;
  - the one Slip and its bar;
  - the circle in the store, and its switch on the Contest tab;
  - real Slips for every player (straights, props, parlays), the seal per leg, and grading;
  - one rank rule (unique ranks) and one lead figure;
  - QA-SWEEP.md and this summary.
- **Red:** the Lounge, rebuilt as one page scroll:
  - the matchup and faces;
  - the live game card with you and against you;
  - Seal broken, live;
  - the room with tapbacks and replies;
  - the circle filter;
  - the Board, rebuilt after the iOS app, with the lag fixed.
- **Gold:**
  - Home's contest card, On tonight, the matchup tug bar and The Field right now;
  - every profile, with Block and Report;
  - where Slips live;
  - the palette and type;
  - the honest-view toggle in every footer;
  - the top bar with the live Stack pill, the preset faces, and the drawn team marks that replace logos and photos;
  - the one Slip card.

## The sweep (the founder's 11:20 PM note)

Every team swept its own pages on the live link, in both views, at 375x812 and 375x667: scrolling, sideways scrollers, every control, every text box, every sheet, back, forward and reload, and the safe area. Each check, its result and the commit that fixed it are in app/QA-SWEEP.md. The Lounge is now one page scroll, so nothing is pinned over the room. Still open: the Lounge composer riding the keyboard needs a check on a real iPhone.

## Expert lines kept

- Tapbacks and replies move nothing of value and change no Stack, finish, season record or prize.
- There is no copy button and no reward for tapping.
- Before kickoff, a pick shows only who and which game, everywhere.
- Picks lock at kickoff, with no in-game picking.
- If the space or its moment gets a name, the candidates are "The Rail" (Red) and "Sealbreak" (Gold). The founder chooses, and each needs a trademark check.

## Unfinished or faked

- **Sample data, stated plainly:** where the feed has no player lines yet, the NFL game page shows Touchdowns, Passing, Rushing and Receiving with sample lines marked "Sample lines until the week's lines post". Sample cells take no picks. The Board's NFL Touchdowns, Passing, Receiving and Rushing tabs show sample player rows under the same note, because the feed carries no NFL player leaders this week. Spread and total prices on the Board are a stand-in -110 because the scoreboard feed gives none.

- **The other players are stand-ins.** Their picks are real games and lines, but not real people. They never tap back or reply, so in the honest view only your own tapbacks and talk appear.
- **On this phone only:** tapbacks, talk, Block, Report, the circle and the invite link work locally. Nobody else sees them until a server exists.
- **Big plays** come from the live feed's scoring plays for NFL and NHL. The time shown is when this phone first saw the play. NBA has no big plays, because scoring is constant.
- **The time a stand-in placed a Slip** is simulated before its kickoff. Your own Slips use the real time.
- **Rank arrows on Home** compare with what this phone last saw.
- **The price check at Place** covers picks on the game page you have open: a better price is taken, a worse one asks once. A pick from another game places at the price shown when you tapped it.
- **Props:** the NFL weekly scoreboard carries no player leaders, so stand-ins hold no NFL props yet; your own NFL props from the game page work. A prop leg on a game this phone first saw after kickoff is not offered, because the pregame leaders are gone by then.
- **A stand-in's pick on a game that started before this phone first loaded it** uses that game's closing line from the game's summary feed, because the scoreboard drops the pregame line at kickoff. Only when no closing line exists does it fall back to a moneyline at -110.
