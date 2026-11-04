# Team Red, Phase 3: Contests (features and state)

Site: https://mclovin-codes.github.io/live-lab/teams/red/app/ (a copy of app/ with Contests as the hero). Sim: https://mclovin-codes.github.io/live-lab/teams/red/app/sim.html

State key: **works** (does what it says on a phone today), **rough** (works, with a known gap), **mock** (stands in for something the real app needs a server for).

## Contests (the mechanism)

- Home leads with Contests: under the live game, your best contest this week with its Contest Boost and one-tap Invite, or the pitch and a Start a contest door. **works**
- Quick start on Contests: pick a plan (Friends, all sports; NFL Sunday; Hoops nights; Lines only, on record), the name fills itself, Private or Public, Create and invite. Three taps. **works**
- Set every rule: sports, days, entry close, Field size, Stack, stake limits, odds limits per line and per slip, markets, Reload, scoring on Units or record, ties, injury protection for props, joiner note. **works**
- Contest Boost for every member: real players in (SIM stand-ins never count) 4 in +0.1x, 8 in +0.2x, 15 in +0.3x, 1st place in the contest +0.2x, inside the 3x Prize Multiplier cap; best contest of the week counts; shown on the contest, the quick start and the Home multiplier sheet. **rough**: on one phone it counts the entrants that phone knows about (the commissioner's list, or the count the invite carried); the real count needs the server.
- Invite tab with the explainer card (what it is, how it works, what you get, right now, code): Send shares the card text and the link in one tap; Text and Copy too. Any member can send it, not only the commissioner. **works**
- Invite link opens Rush on the contest, joinable with no account and no download; settings travel inside the link. **works**
- Join with a code: works for public contests and contests already on the phone. **rough**: a private code from another phone needs the server; the link always works.
- Run it back: one tap makes next week's contest with the same rules and opens the invite. **works**
- Contest page: Ranks on the contest's scoring (live as games go final), Picks per entrant (sealed until each game starts), Rules, Manage (edit until entry closes, remove or restore an entrant, void a pick with a reason), Results sheet (share link, CSV, print). **works**
- Each player's picks count on their own phone's contest Ranks. **mock**: a friend's picks reach the commissioner's Ranks only with the Rush backend (here the commissioner sees the friend listed with no picks).
- Checked end to end on the live site at 375 px (2026-11-04): create, invite link, join on a clean phone with "Join, Kim invited me", a pick placed in the contest shows in its Ranks, entry back to the commissioner, one-tap confirm, confirmation back makes the link final on both sides.
- SIM stand-ins: quick start puts 2 labelled SIM players in so the Ranks are not empty; friends replace them. **mock**
- Public contests list: five seeded contests per week, the same on every phone. **mock**

## Referral linking (founder addendum, 10:05 PM)

- Nothing automatic commits a link: the invite carries the sender's name as a suggestion only. **works**
- On join, "Who invited you?" (the sender prefilled, Someone else with a player search, or Nobody); the joiner commits it by tapping "Join, Nic invited me". **works**
- The entry reaches the commissioner as a card: "Add Sam, I invited them" makes the link final with one tap; one more tap sends the confirmation back. **rough**: with no server each side's tap travels as a link; the Rush backend would record it the instant the other side confirms.
- Friends section, any time after signup: Who invited you (search players, Ask) and Joined your contests in the last 14 days (I invited them); the other side confirms with one tap. One inviter per player, a final link cannot change, an unrequested confirmation changes nothing. **rough** (same server note).
- A final "I invited them" link counts on the Home multiplier. **rough**: it counts the friend as in; the real app checks they made a pick this week.

## The rest of the app (carried from the shared app, Week 9 live)

- Board: every NFL, NBA and NHL game of the week from ESPN, Live group with score, clock and the book's last posted live line, tap into the game. **works**
- Game page: full pregame book and live engine. **works** (Blue's, copied as is)
- Slips, Stack, Units, Reload. **works** (local to the phone)
- Ranks: the Field on Units, matchup, season record. **rough**: the Field is 30 SIM players graded on real finals.
- Player cards with sealed open picks. **works** (sealing is on screen only)
- Lounge. **mock**
- Prize ladder and Prize Multiplier on Home, now shown as plain numbers. **rough**: referral list is local.

## The sim (teams/red/sim/sim.mjs, 1,000 runs, Weeks 9 to 13)

Player by player from the Week 8 cohort (COHORT-WEEK8.md, numbers only). Baseline is Team Blue's, draw for draw.

- Week 13 Field, mean (10th to 90th percentile):
  - Without Contests: **42.0** (35 to 49), 67% of seasons reach the 40 rung, retention 79.4%.
  - With Contests, cohort numbers only: **42.0** (35 to 49). The cohort supports only the invites people already send, so Contests add no players on their own.
  - With Contests and the named assumptions: **47.1** (39 to 56), 88% reach 40, retention 82.8%. Gain +5.2 on the same runs (-2 to +14).
- If the recent return rate holds (W7 to W8 carryover 0.93 for every return, Team Blue's baseline_recent): without Contests **55.8** (48 to 64), cohort numbers only 55.8, with the named assumptions **61.7**; gain +5.9 (-1 to +14); the 40 rung is reached in 99.9% / 99.9% / 100% of seasons.
- Assumptions (none in the cohort except A1): A1 creation rate 0.054 (cohort first-share rate); A2 members share 1.5x (their boost grows with the contest); A3 a contest invite with the card converts 1.3x; A4 members return +0.08; A5 both sides confirm a join or link 0.90. Without A2 +3.5, without A3 +4.0, without A4 +2.0.
- A referral counts only when both players confirmed.

## What replicating it in the real Rush app would take

- **Engine:** contests as first-class groups inside the weekly Field (members, rules, standings computed from the same picks); the Contest Boost added to the Prize Multiplier at settlement, inside the 3x cap, best contest per player; the two-sided referral link as a record with two confirmations, final once both exist, one inviter per player.
- **App:** the quick start, the contest page, the Invite card through the phone's share sheet, the "Who invited you?" picker on join and in Friends, a confirm prompt by push or in-app inbox (one tap), Run it back at week close. All screens exist here to copy.
- **Data:** contests, contest members (with joined time and who confirmed them), link requests and confirmations, and per-week boost stamped on results like prizeMultiplier today. Retire the network-hash and clipboard attribution as a source of truth.
- **A ruling:** whether the Contest Boost stacks with referrals inside 3x or has its own cap; whether a contest needs 4 players in with a pick (not just joined) to count; whether contests may use their own Stack and rules or always mirror the weekly Field; how SIM stand-ins are labelled or dropped in production.
