# Gold rows for app/QA-SWEEP.md (live link, 2026-11-10, 11:20 to 11:35 PM ET)

Checked at 375x812 and 375x667, honest view and full view, with no console errors on any of these pages.

| Page | Action | Result | Fixed in / open |
|---|---|---|---|
| Home | Scroll top to bottom and back | No trap. The last card ends at 715 px, above the tab bar at 755 px | OK |
| Home | Honest-view footer at the bottom | Its link sat under the tab bar (772 to 789 px) | Fixed in 30c20a7 (footer clears the tabs and the safe area). Needs nav.js to load honest.js?v=g620 on Blue's and Red's pages |
| Home | Swipe the rank strip sideways | The strip moves and the page does not; no sideways page scroll (scrollWidth 375) | OK |
| Home | Rank strip pins | 1st stays at the left edge (x 17) and you at the right edge (x 358) while scrolling 31 players; the gap shows under the strip | OK |
| Home | Strip after the 30-second refresh | It snapped back to 1st | Fixed in e4b1e87 (keeps its place); overscroll-behavior stops a swipe from becoming a page swipe |
| Home | Field / My circle switch | Swaps the strip; an empty circle shows three faces to add and the invite door | OK |
| Home | Faces on the strip, matchup, games and events | Each opens player.html?u=<id>, and Back returns | OK |
| Home | Lounge links on game cards | Open lounge.html?g=<gameId> | OK |
| Header (all pages) | Height and pill | 53 px on Home, Board, Slips, Profile, Contest and Lounge. A five-digit Stack (12,345) fits: the pill is 110 px, with no wrap or clip | OK |
| Header | Tap the Stack pill | Opens the Stack sheet; the backdrop closes it | OK |
| Stack sheet (Blue) | Scroll the page behind with the sheet open | The page behind still scrolls (body not locked) | Open, Blue's shell |
| Me | Edit profile: open | The sheet opens (512 px at 375x667, fits without inner scroll) and the page behind locks | Fixed in e4b1e87 |
| Me | Edit profile: close | Done, the backdrop, Save and Enter each close it, and the page unlocks and returns to its scroll position | Fixed in e4b1e87 |
| Me | Display name box | 16 px (no iOS zoom), scrolls into view on focus, Enter saves | Fixed in e4b1e87 |
| Me | Name edge cases | An empty save keeps the old name. A 300-character name with an emoji saves cleanly cut to 18 characters ("Rossi 🔥 xxxxxxxxx"), with no broken emoji | Fixed in e4b1e87 |
| Me | Avatar and banner after a reload | Both survive a reload and show in the header and on the profile | OK |
| Me | Chosen avatar on Lounge and Contest rows | The header shows it on every page. In the Contest (ranks.html) rows no preset faces drew in my test, which may be the cache | Verify after Blue's faces push (9402583) clears the cache |
| Other player's profile | Back, You vs them, Between you, their week | Back returns. Sealed Slips fold to one row and stay sealed. The honest-view toggle keeps ?u= | OK (toggle fixed in r6.41) |
| Other player's profile | Add to my circle | Honest view: "Asked. Waiting on X". Full view: a stand-in confirms after 10 seconds | OK |
| Slips page | Open, Settled, Parlay tabs | The tabs switch; Parlay opens the one shared Slip | OK |
| Slip card | A sealed single-leg Slip | Showed its market type ("Player prop") | Fixed in r6.63 (titled "Slip") |
