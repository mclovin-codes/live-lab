# QA sweep: scrolling, interacting and typing (the founder's 11:20 PM note)

The sweep ran on the live link, in both views (?field=7 and the full Field), at 375x812 and 375x667. Each team swept its own pages. Blue keeps this file and folds in the rows Red and Gold send.

The checks:
1. Scroll top to bottom and back: nothing traps the scroll, and no bar covers content.
2. Sideways scrollers swipe on their own, and the page itself never scrolls sideways.
3. Every control does something visible.
4. Text boxes: 16 px or larger, visible with the keyboard up, Enter and the button both work, plus an empty entry, 300 characters and an emoji.
5. Sheets scroll inside, close by their button and by the backdrop, and the page behind them stays still.
6. Back, forward and reload in the middle of a Slip, an open sheet or an opened Lounge block.
7. The bottom of the page clears the safe area.

## Blue: Contest, game page, the Slip, the Stack sheet, the shell

| Page | Action | Result | Fixed in / open |
|---|---|---|---|
| Contest | Scroll top to bottom and back | No trap. The floating "YOU / No picks yet" row sat over the list | Fixed in 9402583 (the pinned row is gone) |
| Contest | Tap The contest, then the slim Matchup bar, then the open panel | Opens to the screen; the slim bar swaps to the matchup; tapping the open panel returns both | OK (9402583) |
| Contest | Field rows | Preset faces were nested links inside the row link, so rows broke apart | Fixed in 9402583 (plain faces) |
| Contest | Field / My circle, This week / Season | Each switch redraws; an empty circle shows the invite door and faces to add | OK |
| Contest | Sideways | The page never scrolls sideways (scrollWidth 375, both views, both heights) | OK |
| Contest | Bottom with a Slip in | The honest-view footer link (bottom 644) sat under the Slip bar (543 to 607) | Fixed in 88506bb (the footer clears the Slip bar and the safe area) |
| Slip | Open the bar; switch Parlay and Straights; chips and the number pad | Each works; the button reads the stake and what it pays | OK |
| Slip | Scroll the page behind with the Slip open | The page behind scrolled | Fixed in 88506bb (page locked, the sheet scrolls inside without chaining) |
| Slip | Stake boxes (Straights) | 15 px, so iOS zooms | Fixed in 88506bb (16 px) |
| Slip | Type letters, an emoji or 300 characters in a stake box | Only digits stay ("300😀abc" becomes 300) | OK |
| Slip | Enter in a stake box; Escape | Enter did nothing | Fixed in 88506bb (Enter hides the keyboard; Escape closes the Slip) |
| Slip | Close by the backdrop | Closes, the bar returns, the page unlocks | OK |
| Slip | Reload with picks in the Slip | The picks and the stake survive (kept on the phone) | OK |
| Stack sheet | Tap the Stack pill; scroll behind; tap the backdrop | The page behind scrolled (Gold's row) | Fixed in 88506bb (page locked) |
| Game page | Market tabs (Popular, Game Lines, Alt Lines, Team Totals, Halves, Quarters, Player Props) | Each redraws from memory in 2 to 6 ms, with no fetch | OK |
| Game page | Tap a market section's header | The section folds and opens; the choice is kept on the phone | Added in 3e82c1d |
| Game page | The bar under the tabs ("Week 10 · Stack 200") and the entry copy | A second Stack figure under the header, and the old unit word in the entry copy | Fixed in 3e82c1d (bar gone; Stack only) |
| Game page | Team logos and player photos | Logos and photos loaded from the provider | Fixed in 228ec10 (drawn team marks and plain jerseys, no images fetched) |
| Contest | Open Your matchup in the full view; read the opponent's 22 Slips | 29 legs before kickoff, none shows a side, line, market or stake ("Slip" or "Parlay · N legs", the games, "stake sealed") | OK (sealView, 9402583) |
| Contest | ?entered=0 (visitor) | No rank, no matchup, the Join card; the header pill reads ENTER | Added in 3c9b0be |
| Contest | Season tab, honest view | Showed players outside the 7, SIM tags and a paragraph | Fixed in 3c9b0be (the 7, faces, one line) |
| Game page | Player Props before the lines post | Said "Loading player lines" forever | Fixed in da37cc9 (says none yet, points to the Board) |
| Game page | Tap a price, open the bar, Place (live link) | The receipt shows the pick, stake, pays and time; the Slip is on Me as open | OK |
| Game page | Sideways, sticky bars | No sideways scroll; the score header scrolls away with the page, so nothing floats over the markets | OK |

## Gold: Home, the top bar, profiles, Slips

| Page | Action | Result | Fixed in / open |
|---|---|---|---|
| Home | Scroll top to bottom and back | No trap. The last card ends at 715 px, above the tab bar at 755 px | OK |
| Home | Honest-view footer at the bottom | Its link sat under the tab bar (772 to 789 px) | Fixed in 30c20a7 (footer clears the tabs and the safe area). nav.js loads honest.js?v=g620 from 88506bb |
| Home | Swipe the rank strip sideways | The strip moves and the page does not; no sideways page scroll (scrollWidth 375) | OK |
| Home | Rank strip pins | 1st stays at the left edge (x 17) and you at the right edge (x 358) while scrolling 31 players; the gap shows under the strip | OK |
| Home | Strip after the 30-second refresh | It snapped back to 1st | Fixed in e4b1e87 (keeps its place); overscroll-behavior stops a swipe from becoming a page swipe |
| Home | Field / My circle switch | Swaps the strip; an empty circle shows three faces to add and the invite door | OK |
| Home | Faces on the strip, matchup, games and events | Each opens player.html?u=<id>, and Back returns | OK |
| Home | Lounge links on game cards | Open lounge.html?g=<gameId> | OK |
| Header (all pages) | Height and pill | 53 px on Home, Board, Slips, Profile, Contest and Lounge. A five-digit Stack (12,345) fits: the pill is 110 px, with no wrap or clip | OK |
| Header | Tap the Stack pill | Opens the Stack sheet; the backdrop closes it | OK |
| Stack sheet (Blue) | Scroll the page behind with the sheet open | The page behind still scrolled (body not locked) | Fixed in 88506bb (Blue) |
| Me | Edit profile: open | The sheet opens (512 px at 375x667, fits without inner scroll) and the page behind locks | Fixed in e4b1e87 |
| Me | Edit profile: close | Done, the backdrop, Save and Enter each close it, and the page unlocks and returns to its scroll position | Fixed in e4b1e87 |
| Me | Display name box | 16 px (no iOS zoom), scrolls into view on focus, Enter saves | Fixed in e4b1e87 |
| Me | Name edge cases | An empty save keeps the old name. A 300-character name with an emoji saves cleanly cut to 18 characters ("Rossi 🔥 xxxxxxxxx"), with no broken emoji | Fixed in e4b1e87 |
| Me | Avatar and banner after a reload | Both survive a reload and show in the header and on the profile | OK |
| Me | Chosen avatar on Lounge and Contest rows | The header shows it on every page. In the Contest (ranks.html) rows no preset faces drew in my test, which may be the cache | Fixed in 9402583 (Blue): the Contest rows draw the preset faces; confirmed live after the cache cleared |
| Other player's profile | Back, You vs them, Between you, their week | Back returns. Sealed Slips fold to one row and stay sealed. The honest-view toggle keeps ?u= | OK (toggle fixed in r6.41) |
| Other player's profile | Add to my circle | Honest view: "Asked. Waiting on X". Full view: a stand-in confirms after 10 seconds | OK |
| Slips page | Open, Settled, Parlay tabs | The tabs switch; Parlay opens the one shared Slip | OK |
| Slip card | A sealed single-leg Slip | Showed its market type ("Player prop") | Fixed in r6.63 (titled "Slip") |

## Red: the Lounge and the Board

| Page | Action | Result | Fixed in / open |
|---|---|---|---|
| Lounge | Scroll the room top to bottom and back, 375x812, honest view | The room scrolls inside and the page stays put (812 px, room 338 px) | OK |
| Lounge | Same at 375x667 with a Slip in the bar | The room fell back to page scrolling (room under 180 px) | Fixed in ebad86d (pin floor 120; room 126 px, one screen) |
| Lounge | 375x667, full view (31 players) | The head is too tall to pin, so the whole page scrolls; nothing traps | Open (by design) |
| Lounge | Send a 160-character unbroken line | The room scrolled sideways (scrollWidth 1250) | Fixed in ebad86d (lines wrap) |
| Lounge | Composer with the keyboard up (iPhone Safari) | It stayed docked to the layout bottom | Fixed in ebad86d (rides visualViewport; needs an iPhone check) |
| Lounge | Composer input size | 16 px, no zoom | OK |
| Lounge | Send by button and by Enter | Both add a line, clear the box, keep focus and scroll the room to the end | OK |
| Lounge | Empty send | Nothing added | OK |
| Lounge | Type 300 characters | Capped at 160 by maxlength | OK (cap) |
| Lounge | Send an emoji | Shows in the bubble | OK |
| Lounge | Faces and game card, sideways | Overscroll was auto | Fixed in ebad86d (contained) |
| Lounge | Open a settlement or seal-broken block; Hide Slips; tap the header | Opens with its header stuck; Hide and a header tap both close it and return to the block's start; one open at a time | OK (2ab8863) |
| Lounge | Tapback tray (double-tap) and Reply, then clear the reply | The tray opens, a tap sets the badge and closes it; the reply bar shows and clears | OK |
| Lounge | Earlier today, Field / My circle, the Next seal chip | Each opens, switches or moves the card | OK |
| Lounge | Reload or Back with a block open | Comes back closed at the newest row | OK |
| Board | League pill and market tab taps | 0 to 52 ms live, no refetch (was 41 to 152 ms) | Fixed in e75224b, b549641 |
| Board | Scroll top to bottom | The shared header scrolled away because the body was fixed at 812 px | Fixed in e75224b (body height auto; the bar sticks under the header) |
| Board | Pills sideways | Overscroll contained; page width 375 | OK |
| Board | Tap a price cell, then tap it again | Adds to the Slip bar, then removes it (0, 1, 0) | OK |
| Board | Reload, and Back from a game page, with a Slip | The league, the Slip and the white cell are all kept | OK |
| Board | Last card at the bottom, 375x667 | Clears the Slip bar and the tabs | OK |
| Board | Started games | Cells locked at 45% opacity | OK |
| Lounge | 375x667 with a Slip in the bar, after the shared game card | Pinned, room 141 px, one screen | Fixed in daa4fa6 |
| Board | Team marks and the NHL spread | Drawn marks, no logo requests, puck line ±1.5 | Fixed in f8f63fb, daa4fa6 |

## The not-entered pass (the founder's 11:35 PM note)

| Page | Action | Result | Fixed in / open |
|---|---|---|---|
| All pages | Open with ?entered=0 | Signing in on load cleared the flag, so the view never held | Fixed in 32e12eb and 5159e28 (the flag holds on every page, live; Rush.entered() is false) |
| Header | Visitor | The pill reads ENTER; a tap enters and the Stack counts up to 1,000 | OK (Gold, topbar t2) |
| Tabs | Visitor | The Contest tab showed "#4" | Fixed in 32e12eb (no badge) |
| Contest | Visitor | The week, 6 in, faces; rank, gap, Stack and the matchup blurred placeholders; the Field by name | Added in 32e12eb |
| Contest | Tap Enter | The blur lifts, then the real panels arrive (#4 of 7, +19) | OK |
| Game page | Visitor taps a price | The Enter sheet opens; Enter, and the pick lands in the Slip bar | Fixed in 32e12eb |
| Game page | Visitor, the Field on this game after kickoff | Stays sealed | Fixed in 32e12eb |
| Board | Visitor price tap | An Enter sheet opens; Enter, then the pick is on the Slip and the cell turns blue | Fixed in 6c23a68 (Red) |
| Board | Category chip taps, team look | 7 to 25 ms, no refetch | Fixed in 6c23a68 (Red) |
| Lounge | Visitor | Contest lines blurred, talk readable and typeable, the card shows "N in this game", a bust has no name, one Enter door | Fixed in 118af44 (Red) |
| Lounge | 375x667 after the shared game card (c5) | The room shrank to 103 px | Fixed in b42557f (tight mode; room 170 px, one screen) |
| Lounge | Visitor taps Enter | The blur lifts with a pulse and the door goes away | Fixed in 118af44 (Red) |
| Home, Me, profiles | Visitor | Home is the Enter door; Me reads "Enter to start"; profiles blur Stack and rank; Slip cards show only their games | Fixed in eac7d4b (Gold) |
| Every page | Team logos and player photos | None requested; drawn team marks only (swept live, 7 pages, both views) | Fixed in 228ec10, daa4fa6, eac7d4b |

## The founder's 12:10 AM note: marks at the team's scale

| Page | Action | Result | Fixed in / open |
|---|---|---|---|
| Game page | Team marks | Small (24 px rows, 44 px header) | Fixed in 7bea218 (44 px rows, 64 px header) |
| Game page | Prop rows | A plain grey jersey for every player; names and lines wrapped at 375 | Fixed in 7bea218 (the player's number in his team's colours, 40 px; one line each) |
| Game page | NFL player props | Real lines show (Pass Yds, Rush Yds, Rec Yds, Receptions, Anytime touchdown); sample sections only when the feed has none | OK (7bea218) |
| Store | Team colours and jersey numbers | Both colours on every team; leaders carry the jersey number and position | Fixed in 6c04ccf |

## The founder's 12:05 AM note: the Lounge as one page, and the 12:10 Board note

| Page | Action | Result | Fixed in / open |
|---|---|---|---|
| Lounge | Scroll top to bottom and back, 375x812 and 375x667 | One page scroll, no nested scroller; the game bar stays at 53 px | Fixed in ad84723 (Red) |
| Lounge | Tap the game bar, then again | The shared card opens and closes under the bar | Fixed in ad84723 (Red) |
| Lounge | Open a settlement, then Hide | The block header sits right under the bar; Hide closes it back to its start | Fixed in ad84723 (Red) |
| Lounge | Send a line at the bottom of the page | The line lands above the composer and stays in view | OK |
| Lounge | Visitor, 31-player view, 375x667 | Contest lines blurred, talk readable, the door works, Enter lifts the blur | OK |
| Board | NFL chips | Touchdowns, Passing, Receiving, Rushing with sample player rows and the sample note | Fixed in 6affb28 (Red) |
| Board | Marks | 44 px team marks, 40 px player marks with the jersey number, no images | Fixed in 6affb28, 647ff05 (Red) |
| Board | Chip and pill taps, live, 375x667 | 8 to 24 ms | OK |
| Board | NFL player rows | Samples, because the feed carries no NFL player leaders this week | Open (stated in SUMMARY.md) |
| Lounge | Arrival at 375x812 | The room is 72% of the screen, opens at the newest row, composer docked | Fixed in 3b76231 (Red) |
| Lounge | Arrival at 375x667, 31 players | The room is 66% of the screen | Fixed in 3b76231 (Red) |
| Lounge | Any scroller inside the page | None; the page scrolls from anywhere | Fixed in ad84723, 3b76231 (Red) |
| Lounge | Top block | The switch and matchup on one row, one row of small faces; about 120 px | Fixed in 3b76231 (Red) |
| Lounge | Game bar | 44 px, 28 px marks, score, short clock, swipes across games, a Next seal chip; a tap opens the shared card, a second tap closes it | Fixed in 3b76231, 0bb8039 (Red) |
| Lounge | Folded rows | One line of title, three faces side by side, about 56 px | Fixed in 0bb8039 (Red) |
| Lounge | Open a block | Grows in the page with no inner scroll; one at a time; Hide Slips closes it | Fixed in 3b76231 (Red) |
| Lounge | Keyboard up (iPhone Safari) | The composer rides visualViewport | Open: needs a check on a real iPhone |
| Board | Live taps on the final marks and card, 375x667 | 8 to 48 ms, no images, no errors | OK |

## The founder's 12:35 AM note: the Slip while placing

| Page | Action | Result | Fixed in / open |
|---|---|---|---|
| Slip | Six legs from two games | A flat list; the number pad pushed Place off the screen | Fixed in 41dbf7d (legs grouped by game; the stake row and Place pinned; the pad opens from the stake box) |
| Slip | Leg names | "WSH RB anytime TD" (a position, not a name) | Fixed in 41dbf7d and 075d126 (the player's real name and one list of short market names) |
| Slip | NYG -2.5 and NYG moneyline together | Both sat in one parlay | Fixed in 41dbf7d (one line says they cannot share a parlay; Straights offered) |
| Slip | Clear all | Cleared at once | Fixed in 41dbf7d (asks once in one row) |
| Slip | Place a 3-pick parlay, live link, 375x667 | The receipt lists the legs by game with a ring each, then stake, pays and time | OK |
| Slip | An NFL sample pick from the Board | Would place a line that never grades | Fixed in 3b66adc (marked as a sample; Place is disabled with one line saying why) |
| Board | Picks into the Slip, live | "Anytime goal / J. Guentzel #59", "Points 25+ / J. Brunson #11" | Fixed in 8c73daf (Red) |
| Lounge | After the Slip change, 375x812 | The room is 72% of the screen, opens at the newest row, page width 375 | OK (Red) |
