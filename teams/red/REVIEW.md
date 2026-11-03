# Team Red review of Blue and Gold

Scored 1 to 5. Basis: each team's source on the host (teams/blue v15, teams/gold v18), its STATUS.md numbers, and the merged page. Done quickly in the last minutes before the 11:45 stop, so less hands-on play than I would like; where a score rests on a team's own reported numbers, it says so.

## Blue (v15)

| Area | Score | Why |
|---|---|---|
| Features | 5 | Kept next-play, 4th-down and moves-the-chains markets fairly, which nobody else managed; drive, next score, props, anytime TD, parlays, injuries, box score, Lounge, halftime card. |
| Performance | 5 | FastCast push plus a placement check that re-reads ESPN's situation. Their probe (own numbers): 99 tries, 0 accepted after a snap; 124 snaps, median lock 27s before the snap, 0 snapped first. |
| UX | 4 | Fast two-tap flow, clear lock reasons ("Ball may be live", "Line moved"). Next-play market rarely opens after runs, which is honest but feels empty. |
| UI | 4 | Rush colours, compact header, headshots, segmented board. Dense in places. |
| Copy | 4 | Plain lock reasons and Rush words; a few book-insider terms ("Close pick", "Book suspended"). |

Steal from Blue:
1. Windows per play type from tonight's own shortest observed gap minus 3s. This is the only fair way anyone found to keep next-play markets.
2. Placement check that reads a fresh ESPN situation and refuses the pick if a play is new to the page, so placement fails instead of voiding later.
3. The probe harness with counted outcomes (tried, placed, locked by reason, after-snap), the strongest evidence any team produced.

## Gold (v18)

| Area | Score | Why |
|---|---|---|
| Features | 4 | Countdown chip on every market, storylines rail, odds-change setting, injuries and box score, nflverse models with a 2025 holdout check. |
| Performance | 3 | Push plus 1s cache-skipping poll (own numbers: poll sometimes beat push by 4 to 10s). One lock landed 6.8s after the snap. Acceptance took 18 to 41s, and declines after the tap were ruled void-after by the founder. |
| UX | 4 | Countdown chip makes "when does this go away" obvious on every card; storylines give the game a narrative. |
| UI | 4 | Clean cards, good hierarchy, Rush palette. |
| Copy | 4 | Plain and specific; methods documented well. |

Steal from Gold:
1. The countdown chip on every live market, painted once a second without re-rendering (already merged as inbox 5).
2. The storylines rail: short game-state stories that keep a casual player oriented (merged as inbox 6).
3. Model calibration on a holdout season with written methods (model/METHODS.md), which is the right standard for a book-method price.

## Vote for the base page

Blue. It is the only page that kept next-play markets and has evidence they cannot be past-posted (0 after-snap acceptances over 99 tries and 124 snaps). It also already has the Lounge, injuries and box score. Red's best pieces drop in on top of it without touching its window logic: key-number margins (inbox 1), the break board card (inbox 2), the iOS tab bar and lock wording.
