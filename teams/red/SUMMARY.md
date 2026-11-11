# Team Red, Phase 4 round two: Blindside

- App: https://mclovin-codes.github.io/live-lab/teams/red/app/
- Honest view, 7 players and nothing generated: https://mclovin-codes.github.io/live-lab/teams/red/app/lounge.html?field=7

## The mechanic: Blindside
Every pick in the Field is sealed until kickoff. Blindside turns each sealed pick into one blind call: what did they take? Pick one of four (either team, Over or Under). The kickoff reveal scores your call, and the final settles the pick.

## What to tap first
1. Open the Blindside tab (it replaces the Lounge). At ?field=7 it shows exactly 7 players: you, your matchup opponent and five more.
2. "Next reveal" at the top shows the next kickoff, how many sealed picks it opens and a countdown.
3. On the first card (your opponent's sealed pick), tap one of the four calls. You can change it until kickoff. Optionally tag it Lock, Gut call or Trap.
4. Below your opponent's cards, the Read-off scores you vs your opponent on who calls the other better this week.
5. Any face opens a profile. There, "Call their picks" shows only that player's sealed picks, and Block and Report sit on every player. Every game page links to Blindside for that game.

## How it works with 7 players and nobody typing
It runs on fixed taps, not talk. With 7 players the honest view has about 90 sealed line picks to call this week. Each card shows only the player, the game and a countdown; side, line, market and stake stay sealed. Nothing in ?field=7 is invented: no head counts, no generated calls, no chatter. Where the truth is zero, the page says so ("No reads yet", "has not read you yet").

## What brings a player back
- Something pending: every call waits for its kickoff, and Home shows the next reveal time.
- The reveal moment: calls that resolved while you were away open the page once ("Dan took TOR. You read it"), then clear.
- Two resolutions: the kickoff scores the call, then the final settles the pick.
- The 1v1: your opponent's sealed picks sit on top, and the Read-off moves every game night.
- A record that sticks: percent called right, scored and waiting, on your profile and on every player card you have called.

## What is ownable
- Name: Blindside, with the Read-off as the 1v1 score inside it.
  - It is suggestive, not descriptive, and avoids pick, parlay, react, feed, chat, squad, social, league and challenge.
  - Quick screen on 2026-11-10 (aggregator sites only): no live US mark for BLINDSIDE in class 9 or 41 was seen. A class 9 game-software registration was cancelled in 2019, and a class 28 toy mark exists.
  - The app stores and the USPTO's own Trademark Search were not checked. This is a screen, not a clearance: the name needs a full trademark register check before it ships or is announced.
- Name candidates (the founder decides):
  - Blindside (working name). Suggestive: you take a side blind, and it carries the sports sense of a hit you did not see coming.
  - Sealcall. A coined word, likely the strongest to register, but it reads less naturally.
  - Hunch. Suggestive and plain, but a common word, so it is probably crowded in app names.
  - "Reads" and "The Read" were rejected as descriptive.
- The steps, in order (marked: new, or standard):
  1. Standard: a player stakes Stack on a line pick that stays sealed from the whole Field until its game starts. Sealed picks exist in pool software.
  2. New: before kickoff, any other player makes one blind call on that sealed pick from four fixed options (either team, Over, Under). The four options are the same for every line market, so neither the card nor the call reveals the market, side, line or stake.
  3. New: the kickoff reveal is staged as an event. Every call on that pick is scored right or misread, and calls you made while away open the page once ("Dan took TOR. You read it").
  4. Standard: at the final the pick settles. The call keeps its own tally only: the caller's record, and once real players call you, your readability. Nothing else changes.
  5. New: inside each weekly 1v1 matchup, the two players' calls on each other form a second score, the Read-off. It is display only and decides nothing in the contest.
- What is new:
  - A group chat needs typing, a pick feed shows picks once made, a reaction bar rates something visible, and tail or fade copies a visible pick.
  - Blindside acts on a pick nobody can see, scores the act at the reveal and ties it to the weekly 1v1.
  - It depends on what only Rush has: every pick sealed until kickoff, one shared 1,000 Stack and a small known Field.

## Playbook checklist
1. The name is suggestive; the screen is partial (above). Yes, with the check still owed.
2. No banned or descriptive words in the name. Yes.
3. Written as ordered steps. Yes (above).
4. One sentence on what is new. Yes (above).
5. Depends on what only Rush has. Yes.
6. Does anything of value move between players? No. There is no side contest with anything at stake, and no reward for calling, tagging or inviting.
7. Does a tap change a Stack, finish, record or prize? No. Calls make display and history only.
8. Can a player learn another's side, price or stake before kickoff? No:
   - Cards hide side, line, market and stake.
   - Calls by others show only as one total count per pick (and only with the honest view off), never a count per side. There is no copy-a-pick button.
   - The Matchup page and player cards no longer show stake or market for sealed picks.
   - One caveat: in this prototype the answer sits in the phone's storage, which a server must hold in the real app.
9. Fixed taps only, with block and report. Yes: four calls and three tags, no free text, Block and Report on every player card (stored on the phone).
10. Kept off public addresses? No. The mechanic has been public on GitHub Pages since about 8:09 PM ET on 2026-11-10 (first version, r5.2), and the earlier Lounge rooms since the afternoon. For attorney question 1.

## The two mechanics we dropped
- Clash: pair players who hold opposite sides of one game and let the Field back one. Dropped because with 7 players clashes are rare, and showing who is on which side before kickoff leaks sealed picks.
- Ride or Fade: trust or doubt someone's sealed pick without guessing it. Dropped because it is tail and fade on a hidden card, which the competitor scan lists as generic.

## What the cleanup removed
- Deleted: contest.html, contests.html, contest-kit.js, and the Phase 3 Contests sim (sim.html, sim-data.js).
- Removed:
  - The contest switcher sheet and "Find or start a contest" from the top bar code.
  - The Ranks contest switcher.
  - The Board's "Picking in" strip.
  - Home's contest lists, join-with-a-code and the Contest Boost row.
  - The profile's "Contests you share".
  - The old Lounge and its contest lines.
- Units are gone from the game page too.
- A grep of the folder for contests.html, contest.html, contestId, commissioner, crew and squad finds nothing.

## Unfinished or faked
- The 6 other players are stand-ins with stand-in picks.
- Calls, tags, blocks and reports are stored on this phone only. With a server, your opponent's calls on you would appear at kickoff; in ?field=7 they honestly read 0.
- Readability is named on your profile but stays empty until real players call you.
- With the honest view off, the full stand-in Field and stand-in call counts show. The page footer labels that view.
- Props and other non-line picks are not callable yet.
- The Slips page still groups picks under one contest heading (the week), and the Board still offers live picks from the shared app.
