# Team Blue features, Nov 4 2026

Two sites:
- The shared app: https://mclovin-codes.github.io/live-lab/app/. Blue owns the game page, the store, the nav and the CSS.
- The Phase 3 site with Crews: https://mclovin-codes.github.io/live-lab/teams/blue/app/

State key: **works** means checked on the host against live ESPN data. **Rough** means it works with known gaps. **Mock** means it stands in for something that needs a server.

The last column says what replicating each feature in the real Rush app would take. Engine = the server that holds Stacks, picks and grading. App = the iOS screens. Data = a feed we need. Ruling = a founder decision.

## Shared app: the game page (app/game.html)

| Feature | State | What the real app needs |
|---|---|---|
| Scorebug: logos, score, clock and period, records, live and final tags | works | App only; ESPN summary. |
| Game card slide (NFL, NBA): win probability as a filled area with period dividers, both percentages pinned right, last play's swing, last play in one line; the carousel is as tall as the slide in view | works | App only; ESPN winprobability. |
| NHL header: scorebug and last play card only (founder) | works | App only. |
| Market win probability where ESPN has none (NHL): the book's moneyline with the margin removed, from the closing line on, labelled Market | works | App; the series needs the live book (Data). |
| Live book over ESPN push (fastcast). The page seeds from the checkpoint, applies pickcenter patches, and lets push values win over the REST summary, which lags minutes in hockey | works | Data: a server-side relay of the push feed. A licensed odds feed is cleaner (Data, ruling). |
| Hockey lock. Game lines (moneyline, puck line, total) open in play at the book's exact price and lock when the book marks OFF. Alts, periods and props open only in intermissions and timeouts. Backstops lock everything after a goal or penalty the book has not repriced, or after 5 min with no move | works | Engine must enforce the same gate at placement, never trusting the phone. Ruling: whether hockey game lines stay open in play. |
| NFL and NBA lock: lines open only in stoppages read from the play feed (timeouts, quarter ends, halftime, TV breaks), with a countdown; "Book suspended" when live odds go OFF | rough. NFL live not rechecked on this page since the game card change; NBA live not run on this page tonight (no games) | Engine gate at placement; Data: play feed with wallclock. |
| Markets: main lines, alt spread and total steppers, team totals, halves, quarters or periods, player props from the book's prop list with season and last-5 ladders, parlays with a combined price | works (NFL, NBA pregame; NHL live) | Engine: the pricing model (documented in teams/blue/STATUS.md, "Market formulas and holds"). Ruling: holds. |
| Place in: one Slip, several contests. Each contest has its own stake and Stack; a contest that does not cover the game, market or stake is greyed with its reason ("Friends League: NBA only") | works | Engine: per-contest wallets and rule checks at placement. |
| Price-change preference (Ask me, Higher only, Any change) and the recheck before placing | works | App and Engine (the recheck must happen server-side). |
| The Field on this game: SIM picks with names linking to player pages, your picks per contest | works (SIM Field) | Engine: real players' picks; a ruling on what others can see. |
| Box Score, Stats, Plays tabs; injury report; matchup predictor | works | App only; ESPN. |
| Endpoints that answer 400 (core probabilities on NHL) are polled once and then skipped | works | App. |

## Shared app: the store, nav and CSS (app/shared/state.js, nav.js, rush.css)

| Feature | State | What the real app needs |
|---|---|---|
| Weekly Stack, Units, Reload, the Field and Ranks rows | works (one device) | Engine already has it. |
| Grading from ESPN finals: lines, totals, team totals, periods, props, parlays (a leg graded alone, a parlay settled when all legs are in), voids only for a game ESPN cancels | works | Engine already grades; match its rules to these. |
| Contest wallets: a Stack per contest, the active contest, a switcher pill on every page, rules at placement (stake min and max, odds limits per line and per slip, markets on or off, live on or off, days and sports) | works | Engine: contest wallets and rules. App: the pill and greying. |
| Injury protection (none, 1st half, full game): an injured player's prop or TD pick voids, and a parlay drops that leg, from the play text | rough (NFL text only; the NBA feed has no injury text) | Data: an injury feed. Ruling: on by default or not. |
| Joiner note (free text, no payment handles), shared with the commissioner | works | Engine field. |
| Nav: tabs with badges (open picks, rank, live count) and the contest switcher sheet | works | App. |

## Measured numbers

- **NHL, Nov 3, 8 games:**
  - Play feed lag: median 34 s (quartiles 24 and 50 s, p90 68 s, max 173 s).
  - Push delivery: median 0.18 s.
  - Game lines open: 95% of the 1st period (80 to 100% per game).
  - Book OFF spells: a goal 41 s, a probable goal 57 s, a penalty plus TV timeout 168 s.
  - Whistle to faceoff is 19 to 44 s, so the play feed can never open a whistle window. That is why the book is the lock.
- **NHL probe on the host:**
  - 25 of 25 tries placed while lines were open (19 in the intermission, 6 in play at the book price).
  - 0 refused at confirm.
  - 0 placed after a goal or penalty the book had not repriced.
- **NHL grading at the final, WPG at MTL (Final/OT 5-4 after MTL led 4-0):**
  - 86 picks graded across The Rush and a contest (24 won, 19 lost each), 0 open, 0 voided.
  - Both Stacks moved by the same +168.28.
- **NFL, MNF Nov 2 (Blue's Phase 1 page; the lock design carried into the app):**
  - Play lag 19 to 45 s.
  - Probe through the final: 99 tries, 32 placed, 67 locked, 0 refused at placement, 0 after a snap.
  - Median close 27 s before the snap.
  - 40 picks graded at the final, 0 voided.
- **NBA, PHX at GS Q4 probe:**
  - Plays median 43 s late (2 to 95 s), so per-possession markets are not offered.
  - Stoppage windows only.

## Phase 3: Crews (teams/blue/app/)

| Feature | State | What the real app needs |
|---|---|---|
| The rule: +0.1x per crewmate on everyone's Prize Multiplier, up to +1.0x; a crew of 12. Alive at 3 or more members with the timer running. Someone new to Rush resets the timer to 7 days, a Field player moving in adds 48 h. Cold at zero until someone new joins. The boost counts at settle; one crew a week | works (one device) | Engine: crews, membership history and the timer computed server-side, the multiplier at settle. Ruling: the numbers, and how the boost stacks with the referral multiplier (3x cap here). |
| Crew page: countdown ring (alive, under 48 h, hurry under 12 h, cold), boost meter with the next step, the curve, the rules, members with NEW TO RUSH tags, what happened, leave with confirm | works | App. |
| Two-sided linking: an invite link only prefills the crew and who invited you. The tap sends a request, and a member counts only on the other side's one-tap confirm. Add a friend from the players who joined in the last 14 days. No codes typed | works in the prototype; the other phone is mocked (a friend confirms in 15 s, a crew in 10 s) | Engine: requests and confirms, push notifications for "confirm your people". Data: player search and a "joined lately" list. |
| Invite: share sheet or copy, the invite text in Rush words, a link with the crew and the inviter's name | works (web share or clipboard) | App: universal link through TestFlight or the App Store that survives install (the founder's lost-code problem). |
| Crew tab with an hours-left badge; Home crew card with a live countdown; the crew boost in Your multiplier | works | App. |
| SIM crewmates who ask to join on their own schedule | mock | Not needed in the real app. |

## Sim headline (teams/blue/sim/crews-sim.mjs)

The setup: Weeks 9 to 13 from the Week 8 cohort file; 1,000 runs, seed 1000 + r; Red and Gold reproduce the baseline draw for draw. A crew member counts only after both sides confirm (assumed 9 in 10, within 24 h).

**Week 13 Field, mean:**

| Scenario | Pooled return rates | W7 to W8 carryover (0.93) |
|---|---|---|
| Baseline, no Crews | 42.0 (67% reach 40) | 55.8 |
| Crews, cohort-supported numbers only | 42.7 (average multiplier 1.08x against 1.01x, 57% of the Field in a crew) | 56.3 |
| Crews, recruiting doubled, +5 pts return | 46.4 (86% reach 40) | 62.5 |
| Crews, recruiting tripled, +5 pts return | 49.9 | — |

Without the assumed recruiting lift, Crews adds about one player. The countdown has to make people bring friends; the cohort shows the referral multiplier alone moved recruiting about 10%.

What moved the design: a 72-hour timer left crews cold most weeks at this cohort's recruiting rate, so the rule became 7 days.

Results page: https://mclovin-codes.github.io/live-lab/teams/blue/app/sim.html
