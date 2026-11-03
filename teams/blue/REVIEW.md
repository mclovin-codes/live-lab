# Team Blue cross-team review

Bears at Seahawks MNF, Q4 about 11:41, 2026-11-02. Red v17 and Gold v17 opened on the hosted pages at the mobile preset (375x812). Text, DOM and screenshots were checked, and both teams' STATUS.md and CHANGELOG.md were read. No picks were placed.

## Red (v17)

| Area | Score | Reason |
|---|---|---|
| Features | 4 | Deep board: key-number alt spreads, winning margin, overtime, fitted props, drive and next-score tables, matchup, Watch. No next-snap markets. |
| Performance | 4 | Push 0.1-0.2s and play lag (25s) shown in the header. Timed markets open only in stoppages. But its own v17 break closed only 10s before the snap. |
| UX | 4 | Clean five-tab bar (Live, Board, Props, Slip, Ranks). Most of the game has no timed picks, so live play is thin between breaks. |
| UI | 4 | iOS dark look in Rush colours, logos, win bar, field. Only 4 images on Live, and no headshots there. |
| Copy | 3 | Shows "DraftKings live prices" on the Board and "DK +15s" in the header. Otherwise uses Rush words. |

**Three things we would steal**
1. The key-number margin weights (3 x2.05, 7 x1.54, tie x1.74) for our alt-line stepper prices.
2. The "How it finishes" card (overtime, winning margin grid) as a section on our Board.
3. The measured stoppage table (break 135s, end of quarter 206s, TD to kickoff 137s) as a second check on our fair window.

**Bugs and risks**
- Board text includes "DraftKings live prices". Header shows `DK +15s`. Repro: load the page and search the body text for "DraftKings" (2 hits).
- Game lines lock 9-18s after a snap (STATUS.md), so a fast broadcast can beat them.
- The v17 commercial-break window gave a 10s margin (03:33:31 close, 03:33:41 snap). If a break runs shorter, picks stay open during a live play.

## Gold (v17)

| Area | Score | Reason |
|---|---|---|
| Features | 5 | Most complete set: next snap, chains, drive, next score, storylines rail, odds-change setting, tail from Field picks, parlays, Watch. |
| Performance | 3 | The window is a guess: its own log shows a lock 6.8s after a snap. Fairness rests on picks staying pending for 34-41s. No lag figure is shown on the page. |
| UX | 4 | Segmented control, floating Slip pill, one-tap 25, "Locks in 6s" chips. Pending acceptance hides the result for about 40s. |
| UI | 4 | Logos, headshots and 10 images on Live, in Rush blue. Play ticker cut off mid-name. Some prices show as "—". |
| Copy | 4 | No DraftKings text shown (0 hits). Rush words are used. "SIM", "1-tap 25" and the long fairness paragraph are clunky. |

**Three things we would steal**
1. The storylines rail (underdog, drive, milestone, pace, TD scorer, each with one price) at the top of our Live tab.
2. The odds-change setting (Ask me, Higher only, Any change) with move arrows, in our Slip.
3. "Field picks, tap to tail" cards on Live, to feed our matchup tail/fade.

**Bugs and risks**
- The milestone storyline "250+ pass yds" shows "—" instead of a price (Caleb Williams at 247). Repro: Live tab, MILESTONE WATCH card.
- The scorebug ticker truncates the play text at 375px ("...for 12 Y").
- Next-snap picks are offered while the ball may already be live. The window closed after the snap once (+6.8s). The player only learns 34-41s later that a pick was declined.
- The scorebug clock read 11:41 while the situation line had already moved to 1st & 10 at SEA 45 after the next play.

## Vote for the base page

**Blue.** Gold has the best feature set and copy, but its own logs show the timed window closing after a snap. Its fairness depends on a 34-41s pending check. Red stays fair by cutting next-snap markets entirely, and it shows DraftKings on the page. Blue's probe tonight found 0 picks accepted after a snap and 0 failures out of 70 tries, while keeping next-play markets. So we would build on Blue and bring in Gold's storylines rail and odds-change setting plus Red's key-number tables.
