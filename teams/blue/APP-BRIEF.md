# The weekly app (founder, 2026-11-03, 12:10 AM ET)

## The founder's words (verbatim)

"Now take this engine and fold it into a weekly contest that is entered on the home page, a board that has all pre-game and live games running, and clicking into other games this week shows a full odds book for pregame and the live games like NBA can be clicked into to use the same function." Then: "This is a weekly contest every Tuesday until after MNF with season ranks and weekly ranks, the live function is just included in their weekly picks and contest."

## What it is

The merged tool (teams/one, m10) becomes the live mode of one game inside a weekly contest that looks like Rush: Home, Board, Slips, Ranks, Lounge. One week runs Tuesday to the end of Monday Night Football. Every player gets 1,000 Stack at the open, picks at book odds on any NFL, NBA or NHL game that week, pregame or live, Units = (Stack minus 1,000) / 10, the Field ranks on Units for the week, and the season table is a record: a week finished above 1,000 is a win, at or below with a settled pick is a loss, no settled pick is not played. Reload once a week, free, Units keep counting from where they were. Entry closes at MNF kickoff. Week 9 opens Tuesday 2026-11-03 and ends after MNF 2026-11-09.

Same host, same rules as tonight: static pages on GitHub Pages under `app/`, ESPN fetched from the browser, no keys, no backend, the Field simulated and labelled, Rush words, no book names on screen, no em dashes, no void-after, timed markets lock before the snap or are not offered.

## Pages (all under `app/`)

- `index.html` Home: the week card (Week 9, Tue to MNF, the clocks: pick clock, entry close at MNF kickoff, settle after MNF), Enter the week (gives 1,000 Stack), your Stack, Units, weekly rank, season record, a strip of what is live right now with one tap into it, Reload when out of Stack.
- `board.html` Board: every game this week across NFL, NBA and NHL from ESPN's scoreboards (NFL by week, NBA and NHL by date, one `dates=YYYYMMDD` call per day), grouped Live, Today, Later this week, Final, each row with logos, score or start time, the main line, and a tap into the game.
- `game.html?league=nfl&id=401873036` Game: pregame shows the full book (spread, moneyline, total, alt spreads and totals with steppers, team totals, quarter and period lines, props with headshots, parlays, the Slip). Once the game is live, the same page runs the merged engine: live board, timed markets with lock windows, storylines, stats tabs, field or court graphic, Lounge. NBA and NHL use the same page with sport-specific markets (quarters and periods, next basket or next goal where a fair window exists, player props from the box score). ESPN's NBA and NHL summaries, plays, probabilities and situation endpoints follow the NFL shapes in `ESPN-CHEATSHEET.md` with the sport path swapped (basketball/nba, hockey/nhl).
- `slips.html` Slips: open and settled picks across every game this week, graded on each game's final from ESPN, parlays across games allowed.
- `ranks.html` Ranks: This week (the Field on Units, your row, top-3 line) and Season (the record table, "1-0" style, most wins leads). The simulated Field plays the whole week and persists.
- `lounge.html` Lounge: the Field talking across the week; game threads link into the game page.
- `shared/state.js`: the one store (localStorage) for week, entry, Stack, Slip, Field, season record, settings; every page reads and writes through it. `shared/rush.css`: the tokens and components from the merged tool. `shared/nav.js`: the five-tab bar.

## Roles (same git command, own files only)

- Blue (integrator of the engine): `shared/state.js` first, within 30 minutes, with its API written at the top of the file; then `shared/rush.css`, `shared/nav.js`, and `game.html` (pregame book plus the live engine, generalised to NBA and NHL). Owns grading.
- Red: `board.html` and `ranks.html` (weekly Field on Units, season record, the simulated Field running all week, duels and quarter races where they fit).
- Gold: `index.html` (Home, entry, clocks, live strip, Reload), `slips.html`, `lounge.html`, and the hub card for the app.

Ship order: Blue's state and nav, then every page in a first rough version, then iterate. First full click-through (Home, enter, Board, into a game, pick, Slips, Ranks) live on the host by 2:00 AM ET; keep iterating after. Report each ship in one line; STATUS.md in each team folder stays current. The chief of staff checks the host in the morning for the founder.

URL when live: https://mclovin-codes.github.io/live-lab/app/

## Addendum, 2026-11-03 2:10 AM ET (founder, verbatim)

"The bet slip could be significantly improved to allow your own typed number, and home page needs to be maximized to serve as the center hub and to encourage users to grow the pool size and referral bonus for more payouts. Player cards should be clickable and interactable on ranks and elsewhere to see player card, their current picks (but gated until game starts to see the actual line) just a teaser of what's open and a record of what's settled. If the team thinks the full navigation and flow can be improved, design creativity is yours."

Two Rush app screens that define the hub's growth mechanics are in `reference/26.png` and `27.png`, described in `reference/REFERENCE.md` (local folder, never pushed): the prize ladder by Field size and the Prize Multiplier. Tickets do not exist in the web app; Nudge and Invite are free.

What this means:
1. Slip: a stake field the player types into, quick chips kept, the return updating as they type, the Stack cap enforced; parlays the same. Rethink the sheet, not just add a field.
2. Home is the hub: the week card, the Field size with the next rung and what it unlocks, the player's multiplier with Invite and Nudge doors, the live strip, the Field, the Lounge line.
3. Player cards: tap any player name on Ranks, Home, Lounge or a game page to open their card: avatar, record, Units, rank, matchup; open picks as a teaser (count, sport, game, market type) with line and side hidden until that game starts, then revealed; settled picks in full with results.
4. Navigation and flow: the team may redesign; keep the five Rush tabs as the frame unless the redesign is clearly better, and say why in STATUS.md.

Roles: Blue the Slip and pick sheet in game.html and the shared nav; Gold Home as the hub and slips.html; Red the player card (player.html) and its links from Ranks, with Gold and Blue linking from their pages.
