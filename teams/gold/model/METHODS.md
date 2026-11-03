# NFL empirical tables: methods

## Data
- Source: nflverse play-by-play CSVs, seasons 2023, 2024 and 2025 (regular season and playoffs, 2025 through Super Bowl LX).
- 147,928 play-by-play rows from 855 games. Rows are sorted by game_id, then play_id.
- Final tables use all three seasons. Calibration fits on 2023-2024 and scores on 2025 as a holdout.
- Overtime (qtr 5) snaps are dropped as starting states. Scoring in overtime still counts for nextScore.

## Common definitions
- Scrimmage play: play_type is pass or run, down is 1-4, qb_kneel = 0, qb_spike = 0. Sacks and scrambles are included. Penalty-only rows (no_play) are not.
- Snap state: a scrimmage play, or a punt or field goal attempt, with a down of 1-4. Used for seriesConvert, driveResult and nextScore.
- Buckets. down 1-4. dist (ydstogo): 1, 2, 3, 4-6, 7-10, 11+. yte (yardline_100): 1-5, 6-10, 11-20, 21-40, 41-60, 61-80, 81-99.
- Script (score_differential, offense view): <=-9, -8..-1, 0, 1..8, >=9.
- Pass time (game_seconds_remaining): >1800, 901-1800, 300-900, <300.
- Drive time (half_seconds_remaining): >240, 120-240, <120.
- Next-score time (game_seconds_remaining): >2700, 1801-2700, 901-1800, 300-900, 120-299, <120.
- Back-off: a cell with n < 40 takes its value from the first coarser bucket in its chain with n >= 40. The last fallback is the all-plays rate. Backed-off cells carry a third entry, the chain level used. The stored n is the count of the bucket that produced the value.
- Cell format: [p, n] or [p, n, level]. driveResult cells are [P(TD), P(FG), n]. nextScore cells are [P(off), P(def), n]. The third probability is 1 minus the other two.

## passRate
- Outcome: qb_dropback = 1 on the scrimmage play. Overall rate 0.606.
- Rows: 104,292 plays (2023: 35,291, 2024: 34,728, 2025: 34,273).
- The full cross (3,360 cells) is too sparse. It is split into two parts.
- Base table: down x dist x yte (168 cells). Back-off chain: down x dist, then down, then all. 52 cells backed off, mostly impossible states such as 1st and 10 inside the 5.
- Adjustment table: down group (1-2, 3-4) x script x pass time (40 cells). Each cell holds an odds multiplier m. m is solved so that the adjusted predictions sum to the actual dropbacks in that cell. Back-off: script x time, then m = 1. No cell backed off.
- Lookup: odds = base / (1 - base) x m, then p = odds / (1 + odds). This keeps p inside 0-1.
- Base table only: Brier 0.2037 vs 0.2395 for a constant (skill 0.15, n=34,273).
  Deciles, predicted/actual: 0.310/0.298, 0.446/0.439, 0.490/0.499, 0.526/0.506, 0.532/0.533, 0.546/0.526, 0.672/0.706, 0.720/0.719, 0.864/0.854, 0.947/0.943.
- Base x adjustment: Brier 0.1908 vs 0.2395 for a constant (skill 0.203, n=34,273).
  Deciles, predicted/actual: 0.235/0.220, 0.398/0.381, 0.463/0.458, 0.504/0.505, 0.546/0.523, 0.606/0.605, 0.692/0.703, 0.782/0.794, 0.883/0.880, 0.955/0.956.

## gain5 and gain10
- Outcome: yards_gained >= 5, and yards_gained >= 10, on the scrimmage play. Sacks count with negative yards. Overall rates 0.425 and 0.198.
- Rows: 104,292 plays (2023: 35,291, 2024: 34,728, 2025: 34,273).
- Buckets: down x dist x yte. Back-off chain: dist x yte, then down x dist, then down, then all. 52 cells backed off in each table.
- Inside the 5 and 10, the field caps the gain. The tables keep that effect, since yte stays in the first back-off level.
- gain5: Brier 0.2363 vs 0.2439 for a constant (skill 0.031, n=34,273).
  Deciles, predicted/actual: 0.196/0.197, 0.388/0.390, 0.423/0.434, 0.430/0.436, 0.444/0.448, 0.447/0.434, 0.461/0.461, 0.465/0.457, 0.478/0.474, 0.521/0.487.
- gain10: Brier 0.1541 vs 0.158 for a constant (skill 0.024, n=34,273).
  Deciles, predicted/actual: 0.042/0.042, 0.164/0.168, 0.184/0.189, 0.197/0.202, 0.208/0.205, 0.209/0.203, 0.211/0.206, 0.225/0.219, 0.248/0.243, 0.291/0.289.

## seriesConvert
- Outcome: 1 if the offense gets a new first down or scores a touchdown before the series ends. Overall rate 0.580.
- Derivation: from each snap, scan forward through the same game and the same fixed_drive. Success is any row with first_down = 1 for the same posteam (rush, pass or penalty), or touchdown = 1 with td_team = posteam. The scan stops when the drive ends (punt, FG attempt, turnover, downs, end of half) or possession changes.
- Check: this matches nflverse series_success on 114,137 of 114,159 snaps.
- Rows: 114,159 snaps (2023: 38,727, 2024: 37,996, 2025: 37,436).
- Buckets: down x dist x yte. Back-off chain: dist x yte, then down x yte, then yte, then all. 33 cells backed off.
- seriesConvert: Brier 0.1947 vs 0.2425 for a constant (skill 0.197, n=37,436).
  Deciles, predicted/actual: 0.063/0.074, 0.339/0.346, 0.495/0.504, 0.577/0.587, 0.630/0.643, 0.695/0.707, 0.708/0.708, 0.722/0.743, 0.737/0.736, 0.830/0.826.

## driveResult
- Outcome: fixed_drive_result of the drive the snap belongs to. TD = "Touchdown". FG = "Field goal" (made). none = everything else (punt, turnover, downs, missed FG, end of half, opponent TD, safety). Overall rates TD 0.274, FG 0.225.
- Rows: 114,159 snaps (2023: 38,727, 2024: 37,996, 2025: 37,436).
- Buckets: down x dist x yte x drive time (504 cells). Back-off chain: down x yte x time, then yte x time, then yte, then all. 246 cells backed off, many of them impossible states.
- P(TD): Brier 0.174 vs 0.203 for a constant (skill 0.143, n=37,436).
  Deciles, predicted/actual: 0.022/0.028, 0.099/0.119, 0.158/0.173, 0.196/0.205, 0.238/0.249, 0.262/0.270, 0.313/0.323, 0.348/0.360, 0.451/0.469, 0.642/0.632.
- P(FG): Brier 0.1536 vs 0.1749 for a constant (skill 0.122, n=37,436).
  Deciles, predicted/actual: 0.025/0.038, 0.095/0.093, 0.130/0.122, 0.153/0.155, 0.168/0.175, 0.223/0.214, 0.255/0.247, 0.317/0.315, 0.363/0.363, 0.555/0.538.

## nextScore
- Outcome: who scores next in the game, relative to the team with the ball at the snap. off = that team. def = the other team. none = no more points in the game. Overall rates off 0.658, def 0.263.
- Derivation: walk each game in play order. The pre-snap score is the last total_home_score / total_away_score seen before the snap. The next score is the first row at or after the snap where those totals change. The side whose total rose is the scorer. Safeties credit the team that scored the 2 points. A check confirmed the totals are post-play: on all 4,090 offensive TD rows the posteam total equals posteam_score_post.
- Rows: 114,159 snaps (2023: 38,727, 2024: 37,996, 2025: 37,436).
- Buckets: yte x next-score time x down group (1-2, 3-4), 84 cells. Back-off chain: yte x time, then time, then all. 0 cells backed off.
- P(off): Brier 0.1881 vs 0.2238 for a constant (skill 0.159, n=37,436).
  Deciles, predicted/actual: 0.312/0.316, 0.473/0.476, 0.529/0.533, 0.597/0.579, 0.608/0.623, 0.686/0.682, 0.743/0.744, 0.827/0.842, 0.885/0.888, 0.954/0.936.
- P(def): Brier 0.1667 vs 0.1914 for a constant (skill 0.129, n=37,436).
  Deciles, predicted/actual: 0.030/0.047, 0.064/0.062, 0.119/0.108, 0.158/0.149, 0.240/0.240, 0.273/0.274, 0.364/0.367, 0.392/0.378, 0.428/0.422, 0.530/0.530.
- P(none): Brier 0.0489 vs 0.0739 for a constant (skill 0.338, n=37,436).
  Deciles, predicted/actual: 0.000/0.000, 0.000/0.000, 0.000/0.000, 0.000/0.000, 0.000/0.000, 0.008/0.010, 0.017/0.020, 0.063/0.069, 0.190/0.208, 0.512/0.496.

## Limits
- No team strength, weather, timeouts or 4th-down decision model. These are league-average base rates.
- Each table is a separate empirical average. They are not forced to agree with each other.
- Build: scripts fit.js, lookup_fns.js and gen_methods.js in the session scratchpad. They are not part of this folder.
