# Live Lab: the MNF build-off

Date: 2026-11-02. Game: Chicago Bears at Seattle Seahawks, Monday Night Football. ESPN event id 401873036. Kickoff was 8:15 PM ET. The game is live right now.

## The founder's words (verbatim intent, no edits)

- "When I was using a stale slow app that was behind the live game."
- "I want ... the best live betting experience based on live data and live picks made throughout the game. However, instead of exchanging money through on individual sport lines, they have a set fake money budget to use."
- "I need the most live addicting game that will make a sports bettor not want to go on any other app on their phone during a MNF game."
- "The odds themselves should be representative of what you'd see on a normal sports book, and would need to settle the same way a graded sportsbet would on any game line, total, prop bet, alt lines, that draftkings would typically offer."
- "Maximize engagement for this to not just be the single sportsbook enthusiast or sports gambler to play by themselves, but all these would be placed and compared against other active players picks and they will be in competition with each other to some degree."
- "I don't want any influence on what is built, but just giving context to the bigger game it will need to fit into."

## The competition

Three teams, Red, Blue and Gold, each in its own session with full freedom. Same brief, same game, same data. Each team ships a phone-first web page, then keeps shipping better versions for the rest of the game. The founder opens each team's page on a phone during the game and opens any team's session to watch and talk. Judge: the founder's gut tonight, plus a written scorecard after the final whistle.

Nothing here tells a team what to build. The only requirements are the ones that keep the founder able to play and follow.

## Hard requirements (the only ones)

1. Phone first. One page, works in a phone browser, thumb reach, no horizontal scroll, readable in a dark room.
2. Delivered as a claude.ai Artifact. Publish with the Artifact tool from the team's own file (`index.html` in the team folder). Republish the same file path every time so the URL never changes. First publish within 20 minutes of starting, however rough. Then iterate for the rest of the game.
3. Live. The page fetches ESPN directly from the browser (every endpoint in the cheat sheet sends `Access-Control-Allow-Origin: *`). Poll at the cadence the cheat sheet gives. Never cache stale state longer than ESPN does.
4. A visible version stamp on the page (v1, v2, ...) and a short "what changed" panel the founder can open, so a phone user can tell versions apart.
5. Sportsbook-real pricing and grading. American odds. Lines a DraftKings user would recognize: spread, moneyline, total, alt spreads, alt totals, team totals, player props, and anything else the team wants. Every pick grades the way a sportsbook grades it, pushes included, from ESPN's box score, plays and final score. The cheat sheet shows where live DraftKings lines and ESPN's per-play cover and total probabilities live; how the team turns those into a full live board is the team's call.
6. Fake money only. A fixed budget per player for the game. Never a real transaction, never a link to a sportsbook.
7. Other players. The founder wants picks placed and compared against other active players, with some competition between them. How (a shared live field through the Artifact database capability, a simulated field of bots, a lobby, a ladder) is the team's call. The `artifact-capabilities` skill describes what a published page can do (shared state, identity, files).
8. Keep `STATUS.md` in the team folder current after every publish: version, artifact URL, what changed, what the team is testing next, anything blocked. End the turn after each publish with a three-line report (version, URL, what changed). The chief of staff reads it into the hub the founder follows, and sends "go on" to continue. Do not wait for feedback to plan the next version.
9. Log every version in `CHANGELOG.md` in the team folder.

## Tools and data

- `ESPN-CHEATSHEET.md` next to this file: every endpoint, the cache windows, the shapes, and sample JSON in `recon/`.
- Model: the team runs on Opus. Subagents the team spawns pass `model: "opus"` explicitly.
- The built-in browser is available for testing the page on a phone-sized viewport (resize_window preset mobile).
- No secrets, no .env files, no keys. Everything is public ESPN.

## What wins

The page the founder cannot put down during the fourth quarter.

## Addendum, 2026-11-02 9:08 PM ET (founder, verbatim)

"The most critical function of this is to be as close to real time as physically possible, if teams need access to other tools to do so, have them request the access."

Teams request access through the chief of staff session (SendMessage to the session that briefed you); the founder approves. Leads worth testing, none mandatory: cache-busting query params on the 3 to 5 second ESPN endpoints to skip the CDN cache; ESPN's own push feed (FastCast, the websocket espn.com uses for live scores) if it is reachable from a browser; the `wallclock` stamp on each play to measure your true lag against the moment the play happened.

## Addendum, 2026-11-02 9:40 PM ET (founder, verbatim): fairness of timed markets

"If we don't know when the ball is live in play in real time, somebody can get an unfair line like I have been doing on all versions because I'm following their feed and making picks before the play happens. If I pick next TD scorer or ATD scorer right as they're scoring I'd have an unfair advantage against all players and not really playing the game fairly. If we are going to use time specific odds like next play, etc, we can't allow those lines to be open past a fair window. I understand the stickiness of those selected odds, so if we want to keep them, you need to by all means necessary become the fastest odds possible."

Rule from this: no timed market (next snap, this drive, next score, next scorer, anytime scorer while a play is live, first down on this set) may accept a pick that a person watching the broadcast could place after the priced event has started. Either lock it within a fair window using the fastest signal you have, or structure it so late picks cannot win (for example void any pick whose placement time is after the play's wallclock, which ESPN stamps on every play), or drop it. Show the lock lag on the page. Where the fastest signal is DraftKings' own price ticks and suspensions over the push feed (under a second), use them as the "ball is live" signal.

Why DraftKings is faster: the book buys the league's official low-latency data (NFL data through Genius Sports, scouts in the building) and suspends every live market within a second or two of the snap. ESPN's public feed publishes a play 15 to 25 seconds after it happens, and the broadcast itself runs 5 to 30 seconds behind the field. A paid official feed is a Rush purchase decision, not tonight's; tonight's tools are the push feed's price ticks and a void rule.

## Addendum, 2026-11-02 9:50 PM ET (founder, verbatim): pricing and acceptance

"They also all have different odds, are they making up fake odds or using any logic on these? We should be following the exact algorithms and formulas as the highest end sportsbooks in the world. They can access my SportsGameOdds API if they'd like but my understanding is that's much further behind. Also there in no world can be a 'cancel bet if it was after real time stamp', it needs to work in a way where these picks can't be made at all or it is unsuccessful. They are not restricted to ESPN API if they think there's a better way to do it. But they must maximize the capability there first because of the extensive data offered for free."

What the chief of staff found in the three pages at 9:50 PM: main lines (spread, moneyline, total) come from DraftKings over the push feed on Red and Blue. Every micro market (next snap pass or run, yards on the snap, moves the chains, drive result, next score) is priced from a hand-written table each team wrote from memory (a pass rate by down, a drive outcome table by yards to go, a base next-score split) plus about an 8% hold. Logic, not random, but not a book's method: no empirical fit, no game-state tendencies, no team adjustment. That is why the three boards disagree.

Rules from this:
1. Pricing. Every market follows the method a top book uses: a probability from an empirical model fitted to real play-by-play, state-aware (down, distance, field position, score, time, timeouts, team tendencies tonight), then a stated hold. Document each market's formula and its hold in STATUS.md. Free data that makes this possible tonight: ESPN's per-play probabilities (win, spread cover, total over) and DraftKings main-line prices over the push feed; nflverse play-by-play for every NFL season (https://github.com/nflverse/nflverse-data/releases/tag/pbp, one CSV per season, fit the tables offline with node and embed them). Not restricted to ESPN, but maximize it first.
2. Acceptance. No void-after-the-fact. A pick on a timed market either cannot be placed (the market is locked before the priced event starts, off the fastest signal available) or the placement itself fails. If a market cannot be locked in time with confidence, it is not offered.
3. SportsGameOdds. Available on request through the chief of staff. A static page cannot hold an API key, so using it needs a proxy the founder would have to provision; say what you would do with it before asking.
