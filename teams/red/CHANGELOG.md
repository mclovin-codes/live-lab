# Changelog: Team Red, Rush Live

## app r10 (2026-11-03, 3:05 AM addendum)
- Ranks: contest selector (The Rush first, then your contests, colour dots); choosing one sets the active contest; a contest shows its own card, Stack and table.
- Contest pages: colour dot, "Pick in this contest". Player card: your place and theirs in every shared contest. Contest picks come from that contest's own Slip.

## app r9 (2026-11-03, 2:55 AM addendum)
- Contests: stake limits per pick, odds limits per line and per slip, typed Field size and Stack, injury protection for player props, optional joiner note (payment handles withdrawn by the 3:00 AM ruling), entry link back to the commissioner, Manage shows notes and a Void a pick list. Store fields match Blue's Rush.rules; out-of-limit picks do not count.
- Fixes: simulated Field capped at 15; entry link loop; inputs wider than a phone.

## v19 (2026-11-02, after the final)
- No sportsbook brand named on the page (Phase 2 rule): "the market" or "the book".
- Phase 2: Red's work moved to the merged tool (teams/one, base Blue). Red delivered inbox snippets 1 (key-number margins, live in m6) and 2 (break board card), a probe of m6, and REVIEW.md. Stats, injuries and Lounge were not added to the Red page; the merged tool has them from Blue.

## v18 (2026-11-02, final: Bears 34, Seahawks 17)
- Final grading confirmed on real picks (moneyline, total, player prop, anytime TD, next score, next snap). Closing STATUS.md with every formula, hold and the measured lag and windows.
- Live windows in the 4th quarter: commercial breaks 03:37 and 03:42 locked 50s and 87s before play; after-touchdown windows opened 6s and 9s (ESPN posted the touchdowns 50 to 53s late) and locked 81s before kickoff; two-minute warning open 100s, locked 50s before play.
- Header DK lag sign fixed.

## v17 (2026-11-02, Q4)
- Commercial-break window 95s, down from 110s. Real break after the blocked field goal: marker 03:31:41, posted 15s late, picks open 03:31:57 to 03:33:31 (72 markets), next snap 03:33:41, only 10s margin. That break lasted 120s, shorter than the 135s minimum seen earlier.

## v16 (2026-11-02, start of Q4)
- After the final the win probability bar and ball marker clear; results card leads the page. Fourth quarter bar, overtime and final grading checked with staged states.
- Real end of the 3rd: marker wallclock 03:24:37, posted 71s late at 03:25:48; picks open 03:25:49 to 03:27:07 with 74 markets; first 4th-quarter snap 03:28:43, so they closed 96s before play.

## v15 (2026-11-02, Q3)
- Real commercial break after the Bears touchdown (03:13:37): marker 03:14:40, picks opened 03:15:13 with 77 markets, but a DraftKings repricing tick at 03:15:53 closed them 37s before the planned 03:16:30. Kickoff came at 03:17:55. DraftKings ticks no longer close drive, next score and player picks inside an ESPN-marked stoppage; a new live play still does. Game lines still lock on every tick.

## v14 (2026-11-02, Q3)
- Board and Props use iOS segmented controls (Game, Alternates, Totals, Finish; Bears or Seahawks).
- Real commercial breaks measured on the hosted page (v11 rules): two breaks after punts, ESPN posted the marker 12 to 14s late, picks open 85 to 87s, board closed 51s and 55s before the next snap.

## v13 (2026-11-02, Q3)
- Rebuilt look per the founder's 9:58 note and three consulting experts (NFL, sportsbook, iOS UI): Rush colours (#00BFFF on #0B1118), system iOS type, frosted header and tab bar with icons, bottom sheets with grabber, header that compacts on scroll.
- Team logos in the score card, game lines and player sections; player headshots on props and anytime TD; timeouts left; win probability bar; field with ball, line of scrimmage and line to gain; recent plays list with the drive summary.
- Every timed market shows when it locks: countdown and a shrinking bar that turns amber under 60s and red under 15s, patched in place each second. Game lines show Open or Locked; locked prices stay visible with a lock glyph.
- Windows per the NFL expert and tonight's data: commercial break 110s, end of the 1st or 3rd 150s, two-minute warning 120s, halftime 720s; new short windows right after a touchdown (60s) or field goal (55s), not in the last two minutes of a half.
- Plain sportsbook words: Commercial break, Picks open, Locked, Pick placed, Placing pick, Price moved with the old price struck through.
- Watch button: ESPN app, YouTube TV, Hulu + Live TV, Sling, Fubo, NFL+ and Prime Video (noted as Thursday only) links. No logins collected.

## v12 (2026-11-02, Q3)
- Game lines lock on the first DraftKings tick after a play (any change to live moneyline, spread or total), not on a 1.2% move, and stay locked until ESPN posts that play or 40 seconds pass. On the second-half kickoff the old threshold flagged 30s after the snap; the first tick came at 18s.
- Halftime break board runs 720s (measured halftime tonight: End of Half 02:42:07 to kickoff 02:56:17, 850s).
- Header: BOARD (break board close vs next snap) and DK (snap to game-line lock).

## v11 (2026-11-02, start of Q3)
- Player props fitted to nflverse 2023 to 2025 player games: rest-of-game mean and variance by stat, role (team rank by pass attempts, rush attempts or targets so far), checkpoint (25, 50, 75% played) and pace, scaled to the exact time left. Gamma distribution, line at the median. Hold 7% on props, 10% on milestones, 15% on anytime TD.
- Anytime TD: share of players in that role who scored a rushing or receiving TD the rest of the way (at halftime: top rusher 26%, WR1 17%), combined for players who both run and catch.

## v10 (2026-11-02, halftime)
- Key numbers: alternate spreads, winning margin and overtime use a live margin distribution weighted by how often regulation margins land on each number, fitted from 855 games (nflverse 2023 to 2025). Margin 3 is 2.05 times the normal curve, 7 is 1.54, ties 1.74, 14 is 1.25, 17 is 1.51; 9 and 11 about 0.4.
- Overtime priced from the chance of a tie at the end of regulation (6.7% at halftime, +1100 / -1800).
- Removed a leftover next snap note.
- Verified on the real halftime stoppage: break board opened from ESPN's End of Half marker with about 9 minutes to run.

## v9 (2026-11-02, halftime)
- Drive result and next score odds come from tables fitted offline to nflverse play-by-play, 2023 to 2025 (124,178 scrimmage plays), by field position, down, distance and time left in the half. Hold: 8% drive result, 12% next score.
- Next score is now scoped to the half, matching the model (nflfastR next-score probabilities are per half). At halftime it is the second half's first score; receiving team unknown, so both orders are averaged.
- Break board also opens at halftime and after scores, when no offense is on the field.

## v8 (2026-11-02, end of Q2)
- Fair play, per the founder's 9:40 and 9:50 rules. Next snap markets removed: free data cannot lock them before the snap.
- Break board: drive, next score and player markets open only during stoppages ESPN marks (TV timeout, end of quarter, two-minute warning, halftime) and close 100 seconds after the stoppage began (10 minutes at halftime). Shortest such stoppage measured tonight: 135 seconds. A new live play or a DraftKings move closes it at once.
- Game lines refuse a pick when DraftKings has just moved; placement fails, no void after the fact.
- LOCK in the header: median of how long before the next snap the break board closed.
- A void-after-the-snap rule was built and dropped before shipping, because the founder ruled out voiding picks after the fact.

## v7 (2026-11-02, Q2)
- Early signal: a DraftKings price jump locks next snap and drive markets at once. A large jump shows an alert. One play measured: DraftKings moved about 10 seconds after play time, ESPN posted the play at 22.
- Header PLAY lag is now the median of the last 5 plays. Correction: the 11 second figure reported with v5 was one unrepresentative sample. Six plays over push measured 19 to 49 seconds, median about 28.
- First real picks settled over push on hosted v6: next snap pass or run and moves the chains graded correctly against the plays.

## v6 (2026-11-02, Q2)
- Page is now the Live section of Bears at Seahawks inside Rush. Rush's words throughout: pick, stake, Slip, Stack, Units, the Field, Board, Ranks.
- Picks draw on the weekly Stack. Units are profit and loss (1 Unit = 10 Stack). The Field ranks on live Units, top 3 marked.
- New: named matchup opponent (simulated, picked close to you, fixed for the week), free Reload, beat-the-line on open picks, stake sizes that fit a small Stack, prototype control to arrive with 1,000, 400 or 60 Stack.
- Removed: early exit and streak boosts, which Rush does not have. Stack no longer moves between players; the opponent's picks only move their own Units.
- Added HANDOFF.md for a Rush engineer.

## v5 (2026-11-02, Q2)
- Real time: page takes ESPN's FastCast push feed over a websocket (checkpoint plus JSON patches). Polling is now only the fallback, with cache busting on plays, situation and probabilities.
- Measured lag shown in the header: PUSH (server stamp to page) and PLAY (ESPN wallclock to page). Last play card shows the same per play.
- Main spread, total and moneyline are DraftKings live prices from the push feed. If a score lands before DraftKings updates, the ESPN model prices them until it does.
- Bet delay down to 1.5 seconds, snap lock down to 0.7 seconds.
- Measured before the change, 150 seconds of polling: plays feed 20 to 35 seconds after wallclock, summary 35 to 46. Cache busting saved up to about 7 seconds on plays, nothing on summary.

## v4 (2026-11-02, Q2)
- Big plays take over the screen (touchdown, field goal, turnover, missed kick, fourth down, 25+ yards, third down sack) and show the swing in your live value.
- Bankroll and ladder rank move live: cash plus the current worth of open picks.
- Fourth quarter bar with what the trailing team needs. How it finishes section: overtime and winning margin.
- Second half total, no more scoring, near-certain moneylines removed.
- Final results card: place, record, duels, best hit, sprints won.
- Screen wake lock after first tap.
- Fix: load-time error from simulated players missing quarter data (was in v3). Summary feed can no longer roll the period back.

## v3 (2026-11-02, Q2)
- Duels: on lock, the simulated player nearest you on the ladder takes the other side for the same stake, and the result moves them.
- Quarter sprints: fresh profit race each quarter, past winners shown, sprint rank in the header.
- Yardage milestones (50+, 75+) on the props tab.
- Fix: down, distance and clock use whichever ESPN feed is furthest along. The situation feed was lagging the play feed by a play.
- Note: v2 shipped to GitHub Pages; the artifact URL is retired.

## v2 (2026-11-02, start of Q2)
- Standalone static page: complete HTML document, no platform capabilities. Artifact publishing stopped because the viewer blocks ESPN.
- Field is now you against 24 simulated players, because shared player data went with the capabilities.
- Cash out on game lines, team totals, props, drive and next score picks: live win chance times full payout, minus 6%. Two-tap confirm.
- Same game parlays: any non-snap market, one leg per market, priced below the straight multiple. A lost leg kills it at once, pushes and voids drop out and the price recalculates.
- Three straight wins earn a +25% profit boost token.
- One-tap betting on next snap markets, still behind the two-second delay.
- Rank-up toast when a settled pick moves you up the ladder.

## v1 (2026-11-02, Q1)
- Scoreboard with first-down marker on a field bar, data freshness indicator, version stamp and what-changed panel.
- Next snap markets (pass or run, moves the chains, 10+ yards), this drive result, next scoring play.
- Board: live spread, total, moneyline, alternate spreads and totals, team totals, quarter total and winner, first half total.
- Props: pass yards, completions, rush yards, rec yards, catches, anytime TD. Live projected from the box score.
- Sportsbook grading: pushes, voids, early settle on count stats, final-only on yardage. Two-second live bet delay with re-quote.
- Field: 24 seeded simulated players betting every real snap, plus real players through the Artifact database. Field split on each market, rival gap in the header.
