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
