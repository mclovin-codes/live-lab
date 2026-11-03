# Team blue changelog

## v14
- Bug: since v7 a CSS rule for the matchup tail and fade buttons (.two) also matched every two-column price grid (.tbl.two), turning alt spreads, alt totals, team totals, quarter lines and props into one long row of tiny buttons. Renamed it; grids are two columns again at phone and desktop widths.
- Pick your own number: a stepper (minus, line, plus, half-point steps, reset to main) for alt spread, alt total, and each team total, live during the game. Both sides reprice on every tick at the chosen line. Below it, the ladder in readable rows: line, then the two prices.

## v13
- Scoreboard collapses to a slim bar on scroll (iOS large-title pattern from the UI seat).
- Winning margin market from the NFL seat: each team by 1-6, 7-12, 13+, or tie, overtime included. Priced from the same normal margin model as alt spreads (DK-anchored mean and sd), 10% hold, gated by the fair window. Shown on Board and on Live in the 4th quarter.

## v12
- Founder 9:58 PM. Three consulting subagents (NFL, sportsbook, gaming iOS UI) reported; this version takes their top items.
- Rush colours (#00BFFF on #0B1118, cards #121A23 and #1A2530), iOS system font, borderless 16px cards, sentence-case headings.
- Team logos in the scoreboard, player headshots on prop rows, moment cards and TD scorer buttons.
- iOS tab bar with icons, blur and Slip badge. Segmented control for Board. Sheets slide up with a grabber over a blurred backdrop.
- Locked lines stay in place with a lock and the last price. Price moves flash with an up or down caret for 3s.
- Countdown bar on every timed market, amber under 10s, red under 5s. Halftime keeps timed picks and props open 10 minutes after the half ends, with time left shown in minutes and seconds.
- Timeout pips for both teams and what the trailing team needs (FG, TD, two scores).
- Watch sheet: ESPN, ESPN Watch, ABC via your provider, YouTube TV, NFL+, Prime Video links. Opens the provider. Never asks for credentials.

## v11
- Fair-play audit, saved per player and shown in the lag sheet: timed picks tried, placed, refused or locked by reason, and a check that counts accepted picks later found to come after a snap (target 0).

## v10
- No void after the fact (founder 9:50 PM). A gated pick is locked or it is not placed. Void-on-wallclock removed. Before a gated pick is accepted the page re-reads the newest play from ESPN situation (about 150 ms) and checks the book: if a play went in, the line jumped, or the window closed, placement fails with a message. Parlays with a gated leg follow the same window.
- Window per kind of play = shortest snap gap seen tonight for that kind, minus 3s, learned live from the play feed (live ball 16s, incompletion 33s, kickoff 41s, punt 57s, timeout 51s, scores and breaks 74s and up so far). Hurry-up spots (last 2 minutes of a half) use 8s at most. With ESPN lag of 17 to 22s, a next-play market after a run or a catch usually does not open at all. That is intended.
- Next play, chains, 4th down, drive result and next score now come from empirical tables fitted on nflverse play-by-play 2023 to 2025 (147,926 rows). Next score uses nflfastR next-score model outputs. Anytime TD and prop spreads from the same fit. Formulas and holds in STATUS.md.

## v9
- Fair play (founder rule 9:40 PM). Timed markets (next play, 4th down, chains, this drive, next score, anytime TD) and player props now share one fair window. They close a set time after the last ESPN play, before the next snap can come: 25s after a run or catch, 32s after an incompletion, 14s in the last two minutes of a half, longer after timeouts, kicks and scores. Tonight that closes a median 15s before the snap, measured on 54 snaps; 2 snapped earlier and those picks void.
- Void rule: any gated pick placed at or after the wallclock of a play the page had not seen yet voids and the stake returns. Pick time uses the server clock from the push feed, not the phone clock.
- A sharp book price move locks gated picks until the play shows up. A suspended book price locks them too. Close pick is locked for gated picks under the same rule.
- Lock lag on the page: countdown on Live, detail in the lag sheet.
- Also new: second half lines graded through overtime, halftime card, game lines on Live, prop card for the player on the last play, red zone anytime TD.

## v8
- BUG FIX: v7 dropped a helper during the Rush rewrite, which stopped picks from grading on the live page. Restored, and each update step now runs in isolation so one failure cannot stop grading. v7 picks settle on load in v8.
- Measured snap-pick void rate on 48 real snaps: 0 to 2% at 15s lag, 2 to 4% at 20s, 4 to 10% at 25s, 8 to 15% at 30s, 19 to 77% at 40s. Median gap between snaps 42s.
- Late-game lines stress tested at 9 forced Q4 and OT states. Fixed: spread stuck 3.5 off the real margin with a big lead, outcomes too narrow in the last 2 minutes, lines still open at 0:00, overtime clock falling back to Q4.
- Line moved alert in header, This play impact on Units and rank, open picks show covering or needed, crunch time header, PK label.

## v7
- Real time: found ESPN summary carries book prices stale by up to 40 cents (+119 versus real +151). Now the full game doc comes from the FastCast checkpoint, kept current by push patches, with a safety refresh every 20 seconds. Summary polling is only the fallback when push is down.
- Rush frame: page is the Live section of Bears at Seahawks. Stack, Units (1 U = 10 Stack), Slip, Board, Ranks, the Field. Arrive with a chosen weekly Stack and Units. Field carries simulated week-to-date Units and its own Stack, labelled SIM.
- Your matchup: named head-to-head opponent, score in Units, their open picks on this game with tail and fade.
- Beat the line on open picks. Free weekly Reload (1,000 Stack, Units keep counting). Path to the top 3, then #1. Top 3 prize line on Ranks. Close pick replaces cash out.
- New storage key, so everyone starts fresh on this version.

## v6
- Connected ESPN FastCast websocket from the browser (no key, works on GitHub Pages). It pushes JSON patches, including real DraftKings live moneyline, spread and total prices about every 2 seconds.
- Main markets show and lock the exact DraftKings live price. Alts, team totals, quarters and props reprice from those lines. When DraftKings pulls a price the button locks.
- All ESPN reads cache-busted. Measured on tonight plays: situation busted 20 to 25s after wallclock, unbusted 25 to 35s, summary 33 to 45s. Situation polled every 1.5s, push triggers immediate reads.
- True lag on the header, median of last 8 plays, tap for detail. Snap clock on Next play. Snap bets lock 4s after a sharp line jump to limit past-posting.

## v5
- Moment cards reorder the Live tab: 4th down go or kick (new market), 3rd down conversion, red zone, crunch time in the last 5 minutes of a one-score game.
- Three races at once: game, this quarter, this drive. Quarter wins counted, each quarter a fresh race.
- Path to #1: the likeliest single bets that catch the leader, stake prefilled. When leading, cash out all.
- Win probability chart with swing of the last play. Final card at the whistle.
- Returning to the page refreshes every feed at once. Prices beyond about -3900 go off the board.

## v4
- Self-update: GitHub Pages caches the page for up to 10 minutes, so an open or reopened phone could sit on an old version. The page now checks every 45 seconds and reloads to the newest version, picks kept.

## v3
- Same-game parlays from any game line, alt, quarter line or prop. Payout trimmed 8% for related legs. Each leg tracks live, losing leg ends it, pushed leg drops out and the price resets. Cash out works.
- Open picks strip on top of the Live tab with live profit on each pick.
- Full-screen touchdown and field goal alerts, queued with win and loss stamps.
- Last play banner skips timeouts and quarter breaks.

## v2, GitHub Pages
- Complete standalone document, no artifact capabilities. Field is now 30 labelled simulated players, the same on every phone. Real-player sync removed per the brief change.
- Fixed stale feed: the browser was serving minutes-old ESPN plays under stale-while-revalidate. All fetches now skip the browser cache, and the newest play is pulled from the situation feed as soon as it appears.
- Drive Duel: profit on each drive ranked against the field, drives won counted.
- Rank alerts name who you passed. One $250 rebuy per quarter after busting, charged against score.
- Graded next play, chains, drive result and next score against real tonight plays: results matched the play text.

## v1, 8:42 PM ET
- First publish of Blue 42. $1,000 fake budget for the game.
- Live tab: one-tap next-snap markets (next play pass or run, moves the chains, drive result, next score), live sweats with cash out, your race against the rank above.
- Board tab: game lines, alt spreads, alt totals, team totals, quarter and first half lines, player props anchored on DraftKings targets from ESPN's propBets endpoint, milestone ladders, anytime TD.
- Pricing: ESPN per-play win and total probabilities into a live margin and total model, with book hold and American rounding. Lines lock when feeds go stale.
- Grading: pushes, voids, early clinch on overs, past-post void when a play had already started, box score for props, drive results and scoring plays for next-snap markets.
- Field: 11 labelled bots replayed deterministically from ESPN plays, so every viewer sees the same ladder, plus real players through the shared database.
