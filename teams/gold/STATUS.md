# Team Gold status

## Now: the weekly app (from 12:10 AM, Nov 3)
**Gold owns:** app/index.html (Home), app/slips.html (Slips), app/lounge.html (Lounge), app/gold-store.js (a thin map onto Blue's shared/state.js), and the app card in hub/index.html.
**URL:** https://mclovin-codes.github.io/live-lab/app/
**Shipped about 12:40 AM, checked on the host at 375 px:**
- Home: week card with clocks (picks open, entry closes at Monday night kickoff, settles after). Enter for 1,000 Stack. Tiles for Stack, Units, weekly rank and season record. Live now or up next strip from ESPN NFL, NBA and NHL scoreboards, one tap into game.html. Reload when Stack runs out. Field top three.
- Slips: Open, Settled and Parlay tabs. Picks across every game, grouped by game, graded by Rush.grade.sync() every 60s. Parlay across games from pregame moneylines, one leg per game, full-price multiply. Tested: UTA -130 + MTL -192 placed at +169, Stack 1,000 to 975.
- Lounge: Week thread plus one thread per live, upcoming and recent game, with an Open game link. The SIM Field talks about lines, scores, finals, ranks and the rival. Player posts stay on the phone, and a SIM replies.
- Uses Blue's tab bar from shared/nav.js, with no duplicate bar.
**Reference patterns (founder screenshots, about 1:00 AM):** the Home strip is now capsule chips with logos, score and clock (or start time), one tap into game.html. The week clocks read "Entry closes in: 6 Days 19 Hrs" over the day and time. Settled Slips are a dated list with a green check, red x or P chip and the Units, with W/L at the top. Checked on the host at 375 px with no sideways scroll.
**Flow check, 1:35 AM, on the host after Blue and Red fixed the game.html freeze:** Home (entered, Stack, Units, #7 of 31, season 0-0) to the strip into game.html (NHL UTA at TOR). There, a pick UTA -1.5 +180 for 25 Stack placed through the page's own slip. Slips shows it open with the earlier cross-game parlay, and the Stack went from 977 to 952. Lounge loads with 13 threads. Gold also fixed its pages' scoreboard dates to ET so last night's late games stay in the live strip.
**Home as the hub (2:10 AM addendum), shipped 1ada05d, checked on the host at 375 px:**
- Order: Lounge line (who is here, the latest), the week clocks with your Stack, Units, rank and season, the prize ladder card (31 in the Field, 1st $100 2nd $50 3rd $25, a progress bar, "9 more in the Field unlocks 1st $150 · 2nd $60 · 3rd $30"), the multiplier card (1.0X, what 1st pays at it, Nudge and Invite a friend), the live strip, and the Field with player-card links.
- Sheets: the full ladder by Field size (To start, 40, 75, 125, 200, with the current rung lit and top 3 or top 5 paid). The multiplier sheet shows +10% per referral in with a pick and +5% per one of theirs, up to 3x, "$100 to 1st at 1.0x pays $100", and your referrals list with IN or NOT IN and a per-friend Nudge.
- Invite and Nudge use the phone share sheet, or copy a link with ?ref=<your name>. A friend who arrives through it sees "You came in on X's invite". Both are free, and there are no Tickets.
- Honest limit: with no backend, a friend shows as in only on their own phone, so the multiplier stays 1.0x in the prototype.
- Player names on Home and Lounge open Red's player.html?u=<id> (sim ids, and me for you).
- Slips: each pick shows its stake and return, for example "Stake 25 · Returns 70 (4.5 Units) if it hits" while open and "Returned X" when settled. Typing a stake belongs to Blue's pick sheet.
**Commissioner mode doors (2:20 AM addendum):** a Contests card on Home, directly under the week card, with Run your own contest, My contests (with a count) and Join with a code (takes a code or a full invite link). It also lists up to three of your contests and three public ones to join. Why Home: Home is where a player decides what to play this week, and a separate tab would push Lounge or Ranks out of the five Rush tabs. The Lounge gets a starred thread per contest you are in, with an Open contest link and support for ?t=c:<id> deep links. Doors point at Red's pages: contests.html?new=1 (create), contests.html (my contests), contest.html?c=<id>. Join with a code takes Red's invite link (contest.html?i=...) or a code through RC.join. Home and Lounge load Red's contest-kit.js and week-games.js like the other pages, so contests and the Field match everywhere. Page names live in GS.CPAGE in app/gold-store.js.
**Home top redesign (founder: "reads like a data sheet"), shipped and checked on the host at 375 px:** it leads with one game moment. That is the live game (NFL first) or the next to start, with large logos and the two team colours as a soft gradient (dark primaries fall back to the alternate colour). Live games show a pulsing dot, and one tap goes in. Then one standing line, "+0.2 U #1 of 31", in Barlow Condensed, with the season record shown only once a week has settled and the open-pick count linking to Slips. Stack sits in the header pill and ticks. The twin countdown boxes became one line, "Picks open through Mon 8:15 PM", with a clock only inside 24 hours. The Field shows the top three plus you, with avatars, rank arrows against a 10-minute snapshot and a lead line ("X leads at +12.1 U, you are 12.1 back"). The prize is the one bright gold card: "$100 to 1st with 31 in the Field, 9 more in and 1st pays $150", a progress bar, your multiplier, Invite and Nudge. Below sit the Lounge line (rotates every 4.5s), Up next, then Contests. Gold is used only for prize money, and green and red only for results.
**One player, several contests (3:05 AM addendum), shipped 8a0c142 and 680a997, checked on the host at 375 px:**
- Home leads with the active contest (Rush.wallet.current()). The header hosts Blue's contest pill (dot, name, that contest's own Stack and rank). Below it come that contest's Units, rank of N and open picks, then its own clocks: the Rush week clock, or for a private contest "Joins close in X. Settles Tue, Nov 10, 4:00 AM", plus its sports and days ("NBA only · Thu"). The hero game and the strip show only games the contest covers.
- "Your other contests" sits right under the clocks: one card per contest with dot, name, its own Stack and #rank. One tap calls Rush.wallet.setActive and the whole page redraws inside that contest. The Rush shows the Field mover and prize card. A private contest shows a Ranks card into contest.html?c=<id>, with "You run this contest" for the owner, and Reload when its rules allow it.
- Slips groups every pick (Rush.picks({contest:'*'})) by contest, active first. Each group header has the colour dot, name, ACTIVE tag, its own Stack and Units, and W/L on Settled. The Parlay tab says "Into <contest>", stakes from that contest's Stack, and places through Rush.wallet.place with the refusal reason in the toast. Tested: a 2-leg +219 parlay into Gold test cup took its Stack from 1,000 to 975, and The Rush stayed at 952.
- Why this design: Stacks are never summed (founder 3:08), so Home shows one contest's numbers at a time instead of a total. The other contests stay one tap away, so a player in both never has to guess which Stack a number belongs to.
- Parlays place straight through Rush.wallet.place(id, pick) with league 'multi' and each leg's start. Blue dd96edb checks every leg against the contest's sports and days and names the refused leg in the toast.

**Home prize card and My contests (founder: contests "hidden and hard to decipher", prize card "very generic"), shipped 81959fc and after:**
- The prize card is the second thing after the live moment. It is one Rush-blue card (tinted panel, blue border) with the prize large in white ("$100 to 1st"), your multiplier in a tile beside it, the line "9 more in and 1st pays $150" over a real progress bar (31 in to 40 in), one strong "Invite a friend" in Rush blue and Nudge as the outlined secondary. Tapping the prize or the bar opens the ladder; tapping the multiplier opens its sheet.
- My contests sits right under the Field. Every contest you are in is a tappable card with its colour dot, name, its own Stack, your rank and its settle clock, plus a chevron. The active one carries an ACTIVE tag and a blue outline and opens its Ranks. Any other card switches to that contest. "Run your own contest" and "Join with a code" are outlined secondary buttons under the cards, with no gradient. Up to three public contests follow under "Public contests to join", then "All contests".
- The separate "Your other contests" row and the old bottom Contests card are gone, so contests live in one place.

**Next:** test the live strip into game.html once Blue ships it, show game.html timed picks in Slips, and give finished games a Lounge thread with graded results.

# Closing summary for the scorecard (MNF build)

**Final:** CHI 34, SEA 17 (ESPN final at 11:24 PM ET).
**Gold page:** https://mclovin-codes.github.io/live-lab/teams/gold/ (v18, frozen after the merge call)
**Merged tool:** https://mclovin-codes.github.io/live-lab/teams/one/ (base Blue v15; Gold's countdown chip and storylines rail merged in m2)
**Presentation (Gold's role):** https://mclovin-codes.github.io/live-lab/final/
**Gold's merge snippets:** teams/one/inbox/5-countdown-chip.md, 6-storylines-rail.md, 7-odds-change-setting.md, 8-gold-375-fixes.md

## Real final, graded on the Gold page (test tab)
- 47 picks over Q2 to Q4: 10 hit, 32 miss, 1 no action (kick before the next snap), 4 declined at acceptance. None left open or pending after the final.
- The final recap rendered with the FINAL badge: Units on the game and week, rank in the Field, head-to-head result, record and best hit.
- The test tab's misses mostly came from an auto-picker taking the SEA moneyline every 2 minutes. That tests the flow, not the pricing.

## Measured tonight (all from the live host, test tab)
- **Lag:** ESPN publishes a play 16-28s after its wallclock (one outlier at 55s). Push delivery to the phone takes about 0.2s. The 1-second cache-skipping core poll beat the push by 0.6s, 4.4s and 4.9s on three plays and by 10s on another.
- **Snap gaps:** same-possession p10 28s, p25 37s, median 41s (42 snaps, Q2).
- **Fair window:** lock came 2.1s, 8.1s, 5.1s, 0.1s, 6.2s and 1.2s before the snap on six measured snaps, and 6.8s after it on one. Picks went in with 6-20s left on the countdown. Stoppage windows held as designed: a pick placed 48s into the 115s end-of-quarter window waited for the first Q4 play.
- **Acceptance (Gold v11-v18):** live picks were accepted 18-41s after the tap. Moneyline declines happened only when the market moved toward the pick by 2 points or more inside 16s. The founder ruled at 10:52 PM that this counts as void-after, so it is not in the merged tool.
- **Book prices:** the market's ticks over the push feed came about every 2s. The one big move seen landed about 14s after the snap, about 9s before ESPN posted the play.

## Every market: formula and hold
See "How every market is priced (formula and hold)" below. Props and anytime TD are as updated in v13. Methods and 2025 holdout calibration are in model/METHODS.md and model/PROPS-METHODS.md.

## History below (v1 to v18)

**Version:** v18 (Gold page frozen. Team now on the merge)

## Merge role (10:55 PM)
Founder ruling 10:52 PM: pending acceptance counts as void-after under another name. It is dropped, and the base is Blue v15. Gold now owns the presentation at final/index.html and snippets 5 (countdown chip), 6 (storylines rail) and 7 (odds-change setting) in teams/one/inbox/, with no pending acceptance and no void paths.
**URL:** https://mclovin-codes.github.io/live-lab/teams/gold/
**Name:** Rush Live

## Latency, measured on the Pages host in Q2
Lag is the play's `wallclock` versus when the page first has it.
- ESPN's core feed, polled every second past the cache: 23.7s on the one play raced against push in v8.
- ESPN push feed: 33.8s on that same play. 22.7s, 23.3s and 29.1s on three plays in v7, with delivery to the page about 0.2s of each.
- In v7 a separate 1-second poll beat the push by 0.6s, 4.4s and 4.9s on those three plays.
- Sample is 4 plays, so treat these as rough numbers.
- The floor is upstream of the page. ESPN has not published the play for about 20s or more. Going lower needs a paid official data feed and a server, which the brief rules out (no keys).
- Not measured: how far DraftKings prices lead ESPN's play. The market-jump lock has not fired yet.

## What changed in v18
- Stats tab with box score and player lines, injuries with in-game designations and return status, the Lounge chat, and no book named anywhere a player sees. Checked locally at phone size: 2 live injury events parsed (one injured, one returned) and 10 designations.
- REVIEW.md written, scored from source and notes, not live pages. It votes for Gold as the base.

## What changed in v17
- Next-snap and drive prices shorter than -1000 stay locked.

## End of Q3 into Q4 on v16, test tab
- The end-of-quarter window worked: a next-snap pick went in with 48s left on the 115s stoppage window and waited for the first Q4 play.
- Moneyline: 1 accepted at 23s, 1 declined because DraftKings moved toward the pick.
- A -2150 next-snap price appeared, so v17 locks those.

## What changed in v16
- Final recap card on Live after the whistle, with the FINAL badge. Tested by forcing the final state locally. Not yet seen at the real final.
- Overtime: the clock shows OT. Second-half and game markets count OT. The model uses the OT clock for time left.

## Q3 on v15, measured live in my test tab
- 7 picks: 4 next snap, 3 moneyline. Next snap: 3 settled (2 hits, 1 miss), each accepted and settled 34-41s after the tap; 1 pending at the check. Moneyline: 2 accepted 18-22s after the tap; 1 pending at the check. None declined.
- Window had 6-19s left when the next-snap picks went in.
- Lock lag: the window closed 6.2s and 1.2s before the snap on 2 snaps, and 6.8s after it on 1. On a late lock, acceptance still declines any pick tapped after the snap.
- Play lag on the core feed: 11-30s.

## What changed in v15
- Odds-change setting (Ask me, Higher only, Any change) with move arrows in the Slip.
- Storylines rail of five live angles on Live, each with logo or headshot and one price.

## What changed in v14
- Rebuilt look in Rush blue: logos, headshots, segmented control, Slip pill, sheets. Countdown chip on every live market. Locked lines stay visible. Stoppage windows from rulebook durations. Drive card. Watch door.

## Expert seats (3 subagents, opus)
- **NFL expert:** ranked score/clock, down and distance, timeouts, drive and win probability as what matters in Q4. Gave rulebook stoppage durations (halftime 780s, end of Q1/Q3 120s+, TV break ~140s, review ~128s). Said anytime TD is the top prop (24% of prop handle) and tackles and sacks are noise late.
- **Sportsbook expert:** main lines should stay pickable every dead ball, since DraftKings kept them about 99% available in Super Bowl LVII. Books show suspended as grey or a lock icon, use green and red arrows on moves, and let players pick an odds-change preference. Next-drive and next-score quick markets matter.
- **iOS UI expert:** recommended a segmented control over a tab bar (HIG), the Slip as a floating action, cards with logos and headshots, a 44pt minimum touch target, one-pulse odds flashes, and dropping table chrome.
- Built from their lists: odds-change setting and storylines rail (v15). Not built yet: a live parlay tab.

## What changed in v13
- Props and anytime TD fit on nflverse play-by-play, with ESPN season averages as priors. Method and 2025 holdout calibration are in `model/PROPS-METHODS.md`.
- Props center on a 50/50 line.
- Acceptance is directional: a pick is declined only when DraftKings moved toward it.

## Second half on v12, measured live in my test tab (Q3)
- Next snap: 5 picks placed through the window, with 10-20s left on the countdown at placement. 2 hit, 1 no action on a kick, 2 still open at the check.
- Lock lag: the window closed 5.1s and 0.1s before the next snap on the 2 snaps measured.
- Moneyline: 2 picks declined. SEA win probability rose from 0.393 to 0.416 within 14s after the tap, toward the pick, so v13 still declines that case.
- Play lag on the core feed: 18-30s, with one outlier at 55s.

## What changed in v12
- Timed markets price from empirical NFL tables (nflverse 2023-2025, about 115,000 snaps). Method and calibration are in `model/METHODS.md`.

## How every market is priced (formula and hold)
Holds are applied to the no-push win probability q. "x1.05" means the implied probability is q times 1.05, about 4.8% overround on a two-way market. Odds round to the nearest 5 (10 above 300, 25 above 1000).
- **Moneyline, main spread, main total:** DraftKings' live price exactly as ESPN's push feed carries it, so the hold is DraftKings' own. Fallback when DraftKings is missing: ESPN's per-play win, cover and over probabilities, x1.05.
- **Alt spreads:** final margin ~ Normal(mu, sigma), with sigma = 13.5 x sqrt(fraction of game left), floor 1.3. mu is the average of the two values that reproduce DraftKings' de-vigged moneyline and de-vigged spread. Whole-number lines take the push mass out of the normal. x1.05.
- **Alt totals:** total ~ Normal(muT, sigma), with muT = DraftKings total + sigma x invNorm(de-vigged over). x1.05.
- **Team totals:** each team's mean is (muT +/- mu)/2, floored at its current score, with sd 0.72 sigma. x1.05.
- **Quarter and halves:** current period points plus remaining expected points times that period's share of remaining time. sd is 7 x sqrt(quarter time left / 900), or 9.5 for a half. Tie pushes on quarter winner. x1.05.
- **Next snap pass or run, 5+ or 10+ yards, moves the chains, this drive (TD, FG, no score), next score (CHI, SEA, none):** fitted nflverse tables by down, distance, yards to end zone, clock and score margin. Hold: q x 1.07 for q under 0.5, q + 0.035 at or above, about 7% overround on two-way markets and about 10% on three-way.
- **Player props (yards, receptions, completions):** prior = the player's 2026 season-to-date per-game average from ESPN, shrunk as fitted. Remaining = fitted multiplier table over time left x pace ratio, times prior x time left. The spread is a fitted compound distribution (see model/PROPS-METHODS.md). The main line is the half-point with over closest to 50%, and alt milestones use the same model. x1.05. On 2025 holdout, Brier beats 50% at 0.20-0.24, but yards overs read 0.02-0.05 low.
- **Anytime TD:** 1 - exp(-lambda x time left x adjustment), with lambda = the player's season rush plus rec TD rate shrunk toward his position mean. x1.05. Falls back to the hand-set rate when ESPN has no 2026 stats for the player.
- **Parlays:** product of leg decimal odds x 0.90 for same-game correlation.

## SportsGameOdds (offered, not requested)
What it would do: replace the hand-set prop and anytime-TD priors with real book player-prop lines, and cross-check alt prices against market consensus. It needs a small server proxy, such as a Cloudflare Worker or Vercel function, to hold the key, since a static page cannot. It would not help speed, because the founder says it runs further behind. Worth it at integration time for props, not tonight.

## What changed in v11
- No void after the fact. Live picks are pending until the feed confirms the ball was dead at the tap. Picks that fail are never accepted, and the stake stays in the Stack. This is how books accept in-play picks with a delay.
- Tested: 10 acceptance fixtures pass. A live SEA moneyline pick was accepted 21s after the tap.
- Lock lag measured on 3 live snaps: the window closed 2.1s and 8.1s before two of them. The third lock came from a DraftKings move 25.9s early. The window is predictive, so acceptance is the guarantee.
- Why not lock before the snap: the DraftKings ticks reach the page through ESPN about 14s after the snap. ESPN posts the play 16-28s after. No free signal arrives before the snap.

## What changed in v10
- Fair timed markets. They open only in a window after each play posts and close before the next snap is likely, or earlier if DraftKings suspends or jumps. Late picks are void. Lock lag is on the page.

## Fairness numbers, measured in Q2
- Snap-to-snap gap, same possession, 42 snaps: p10 28s, p25 37s, median 41s.
- ESPN posts a play about 18-24s after its wallclock, which leaves about a 10-15s window to pick before the next snap.
- DraftKings over the push feed: price suspensions show as missing ticks. The one big move seen came about 14s after the snap, about 9s before ESPN posted the play. DraftKings can lock early after a snap, but not ahead of it. The window plus the void rule carry fairness.
- 15 fixture tests pass for the void rule and window states.

## What changed in v9
- Rush words on every screen, weekly Stack of 1,000, Units, the Field ranked on Units, named head-to-head SIM opponent, free Reload, breadcrumb from the Board.
- Early close-out removed. Rush has none.
- Tickets from v8 and earlier do not carry over, because budget and scale changed.

## What changed in v8
- One-second cache-skipping check of ESPN's core feed, on top of the push.

## What changed in v7
- ESPN push feed for plays, clock, down and distance, box score, odds. Polling is backup.
- DraftKings live prices on the main lines. Markets lock when DraftKings jumps.
- True lag in the header, breakdown in the version panel.

## What changed in v6
- One-tap picks on Next snap and This drive. Open picks glow on the board.
- Tickets show the current price and whether you beat the line.
- Second-half spread and total, tighter next-snap hold, final recap card.

## What changed in v5
- Self-update within a minute of a ship, because Pages caches the page for 10 minutes.
- Snap streak, and a head-to-head card on the Field tab.

## What changed in v4
- Fixed field position. ESPN counts `yardLine` from the SEA goal line, so Seattle drives were mispriced and the ball was drawn on the wrong side.
- Fourth-down prices expect a kick. Over and Under SIM players bet totals only.

## What changed in v3
- Standalone page: doctype, html, head, body. Shared store and all `claude.use` calls removed.
- Parlays: add legs from the slip, a gold bar tracks them, same-game price is legs multiplied less 10%. Pushed or void legs drop out.
- First-down market on every set ("Moves chains" or "Stopped").
- SIM players now call every snap, so the leaderboard moves on each play. Rank alerts fire when you pass someone or get passed. A SIM field vote shows on the next snap.

## Other players
All 12 rivals are labeled SIM stand-ins for the Field, with made-up Units from earlier in the week. One is the named head-to-head opponent. Every phone sees the same ones. No real players without a backend.

## Tested
- Mobile preset on the Pages host, live ESPN: score, clock, situation, board, parlay placed, no horizontal scroll, no console errors.
- Grading on 31 fixtures: moneyline, spread, total and prop pushes, team totals, quarter, half, void prop, next snap, snapped-before-pick void, punt void, first down, next score, parlay win, loss and payout. All pass.

## Tested live on the host
- Real tickets settled from real plays in Q2: Next snap Pass at -240 paid $141.67 on a stake of $100, and 5+ yards lost on an incompletion.
- A first-down Yes ticket lost correctly on a punt.
- An open v5 tab hopped to v6 on its own within a minute of the ship and kept its tickets.

## Not tested
- A real phone. Checked only at the mobile preset in the built-in browser.
- A drive ticket has not settled live yet.
- One-tap picks tested only from the local file, not settled live.

## Blocked
Nothing.

## Testing next
1. Live acceptance, lock lag and decline rate on v15, in the fourth quarter.
2. Live parlay tab in the Slip.
3. v15 on a real phone.
