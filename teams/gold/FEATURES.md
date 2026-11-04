# Team Gold features (for the Season 1 decision)

Updated 2026-11-03, 11:15 PM ET. Each line gives the feature, its state and what it does.
- **works:** behaves as described on the live site.
- **rough:** works, but has a known gap.
- **mock:** stands in for something only a backend can do.

Sites:
- Shared app: https://mclovin-codes.github.io/live-lab/app/
- Gold Phase 3 site: https://mclovin-codes.github.io/live-lab/teams/gold/app/

Everything was checked at 375 px on the host.

## Shared app: Home (app/index.html)
- **works** Live moment: the live game (NFL first) or the next to start, from ESPN, with team colours, score and clock, a pulsing live dot and one tap into the game.
- **works** Prize card: the prize to 1st by Field size, a progress bar to the next rung ("9 more in and 1st pays $150"), the ladder sheet, Invite a friend, Nudge and the multiplier tile.
- **works** Standing line and clocks: Units, rank of N, open picks, and "Picks open through Mon 8:15 PM". Enter for 1,000 Stack. Reload once a week.
- **works** The Field: top three plus you, with rank arrows and a lead line. Names open player cards.
- **works** Run your own contest: a compact row under the prize card, into Red's create flow.
- **works** My contests: one row per contest (dot, name, Stack, rank). One tap switches the whole page to that contest; Stacks are never summed.
- **works** Join with a code (code or full link), and Public contests (count of open ones).
- **works** Lounge line: rotates who leads, how many games are live, and your live pick ("Your UTA -1.5 is live: UTA 0, TOR 0, 18:23 - 1st").
- **works** More live and Up next strip: capsule chips with logos, score and clock, one tap into the game.
- **mock** The Field is 30 SIM players.
- **mock** Invite and Nudge open the phone share sheet with a ?ref= link. The referral multiplier stays 1.0x because no backend links friends.

## Shared app: Slips (app/slips.html)
- **works** Open, Settled and Parlay tabs. Picks are grouped by contest, active first, each group with its own Stack and Units. It opens on Settled when nothing is open.
- **works** Live picks: a pulsing LIVE tag, the score and clock (per leg for parlays) linking into the game, and "Final · grading" until graded.
- **works** Grading at the final, through Blue's Rush.grade.sync every 60 s. Checked tonight on NHL: UTA -1.5 lost, and parlays graded leg by leg.
- **works** Parlay builder across games from pregame moneylines, one leg per game, placed into the active contest. A refusal names the leg.

## Shared app: Lounge (app/lounge.html)
- **works** Week thread, one thread per live, upcoming and recent game, a starred thread per contest, deep links, and the contest pill in the header.
- **mock** The SIM Field talks. Your posts stay on your phone.

## Gold Phase 3: Squad Streak (teams/gold/app/)
- **works** squad.html, start a Squad: up to 8 seats, the boost broken down (+0.05x per squadmate who picks, +0.1x per streak week up to +0.5x, +0.2x for the top Squad).
- **works** Streak status: streak pips, and "N more picks keep the streak" against the Monday night kickoff deadline.
- **works** Two-sided linking (founder addendum):
  - An invite link only prefills, and the joiner taps "Ask to join".
  - The Squad confirms or declines with one tap, and can Ask anyone who joined in the last 14 days, who then confirms.
  - "Who invited you?" searches by name and credits only after the inviter confirms.
- **works** Squad Ranks: your Squad against six SIM Squads, scored on average Units.
- **works** Home: a Squad card under the prize card (boost, streak, picks this week, or "Waiting for X to confirm"). The Squad boost is added to the Prize Multiplier, and the multiplier sheet shows it.
- **mock** Squadmates: SIM players fill seats and confirm after 4 seconds. A real friend who joins by link counts only on their own phone.
- **rough** Streak history and the top-Squad bonus close weeks locally. They have not run across a real week boundary yet; Week 9 settles Nov 10.
- **works** sim.html: the simulation page with curves, a table of every variant, and the named assumptions.

## The simulation (teams/gold/sim/sim.js)
- **Method:** 1,000 runs, Weeks 9 to 13, player by player from COHORT-WEEK8.md rates.
- **Seeds:** mulberry32(1000 + r).
- **Baseline:** the no-mechanism arm is Team Blue's baseline draw for draw, so all teams share it.
- **Field:** that week's entrants.
- **Referrals:** a referral or seat counts only when both sides confirm.

| Week 13 | Field (p10 to p90) | Retention | Avg multiplier | Touched | Runs past 40 in |
|---|---|---|---|---|---|
| No mechanism | 42.0 (35 to 49) | 79.4% | 1.01x | 0% | 67% |
| **Squad Streak, all assumptions** | **46.7 (39 to 54)** | **82.9%** | **1.23x** | **50%** | **89%** |
| Squad Streak, half of links confirmed | 45.3 (38 to 53) | 81.8% | 1.15x | 36% | 83% |
| Squad Streak, cohort rates only | 42.1 (34 to 50) | 79.7% | 1.02x | 2% | 67% |
| No mechanism, recent return rate (0.93) | 55.8 (48 to 64) | 91.0% | 1.02x | 0% | 100% |
| Squad Streak, recent return rate (0.93) | 61.0 (53 to 70) | 93.6% | 1.28x | 52% | 100% |

- **Headline:** +4.7 players in the Week 13 Field and +3.5 points of retention, with all six assumptions. With every unsupported assumption off, Squad Streak adds nothing, because Squads barely form.
- **What carries the result:** friends already in the Field joining a founder (A2) and Squad members returning like reloaders (A4).
- **Weakest assumption:** extra invites from Squad members (A3). The cohort's referral rate barely moved in the multiplier weeks.
- **The six assumptions:**
  - A1: founding at 2x the first-share rate.
  - A2: 1.5 Field friends pulled in per founder.
  - A3: 1.5x invites from Squad members with an open seat.
  - A4: Squad members return like reloaders.
  - A5: nudged absentees reactivate at 0.30.
  - A6: 0.8 of links get both taps.
- Each assumption is shown switched off on sim.html.

## What replicating each in the real Rush app would take
- **Live moment, live strip, live Slips tags:** app only. The app already reads ESPN scoreboards. Add the score and clock to open picks, and pulse while the game is in progress.
- **Prize card with progress to the next rung:** app only. It reads Field size and the ladder (prizeField, prizeBase) the engine already stamps.
- **My contests switcher, one Stack per contest:** app plus data. Contest memberships and per-contest Stack exist once user-created contests ship, which is Red's ruling.
- **Slips grouped by contest, opening on Settled when empty:** app only.
- **Lounge game and contest threads:** app plus data. Add a thread key per game and per contest on chat_messages.
- **Squad Streak:**
  - Data: squads, squad_members (with a confirmed_at timestamp) and squad_requests (asker, target, direction, created_at, confirmed_at).
  - Engine: at weekly settlement, count each Squad's members with a pick, update the streak (60% rule, a recruit week for a new member's first pick) and add the Squad boost to the prize multiplier.
  - App: the Squad screen, the Home card, request and confirm push notifications, and the "joined in the last 14 days" list.
  - Ruling: the boost sizes, the cap against prize economics (today's rule caps the multiplier at 3x), whether the top-Squad +0.2x is worth it, and the 8-seat limit.
- **Two-sided linking (applies to any mechanism):**
  - Data: a link_requests table (from, to, kind referral or squad, state, confirmed_at). On confirm it writes users.referred_by once and never again.
  - App: a username search ("Who invited you?"), the inviter's "joined in the last 14 days" list, and a one-tap confirm with a push notification.
  - Engine: credit the referral multiplier only from confirmed links.
  - Ruling: what happens to today's 23 house-code signups. Offer them the same confirm flow.
- **The simulation:** nothing to replicate. Rerun it with `node teams/gold/sim/sim.js` once Week 9's real returns land after the Nov 9 entry close, then replace the A4 proxy with a measured Squad return rate after two weeks of real Squads.
