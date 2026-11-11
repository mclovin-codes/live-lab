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

Red's rows are folded in when they arrive.
