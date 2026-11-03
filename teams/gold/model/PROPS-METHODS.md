# In-game player prop model (props.js)

## Definitions
- Data: nflverse play-by-play 2023, 2024, 2025, regular season only. Positions from nflverse rosters (most frequent listed position per season; FB to RB; others inferred from usage: >20 attempts = QB, carries > targets = RB, else WR).
- Stats: passYds (gross passing yards on completions), comp, rushYds (incl. scrambles, kneels), recYds, rec. Two-point tries, no-plays and sacks excluded. TD = rushing TD (rusher) + receiving TD (receiver).
- Player-game = player with at least one attempt, carry or target in the game. Pass markets require >=1 attempt (QB); rushYds QB/RB; recYds/rec RB/WR/TE.
- Checkpoints: elapsed regulation time 0, 300, ..., 3300 s (f = fraction of regulation left = 1, 11/12, ..., 1/12). Current = stat from plays starting before the checkpoint. Final includes OT.
- Prior m: season-to-date per-game average over prior games that season (player-games as defined). Needs >=3 prior games; else the season average of that stat for the position (all player-games). Fit uses only >=3-prior samples; the fallback group is evaluated separately.

## Sample sizes (player-games with >=3 prior games; each gives 12 checkpoints)
Total player-games built: 16018.

| market/pos | train 2023-24 | all 2023-25 (shipped) |
|---|---|---|
| passYds/QB | 871 | 1299 |
| comp/QB | 871 | 1299 |
| rushYds/QB | 885 | 1321 |
| rushYds/RB | 1897 | 2833 |
| recYds/RB | 2022 | 3030 |
| recYds/WR | 3143 | 4659 |
| recYds/TE | 1504 | 2287 |
| rec/RB | 2022 | 3030 |
| rec/WR | 3143 | 4659 |
| rec/TE | 1504 | 2287 |
| td/QB | 885 | 1320 |
| td/RB | 2022 | 3030 |
| td/WR | 3144 | 4660 |
| td/TE | 1504 | 2287 |

## Fitted form
1. Shrunk prior: m' = max(floor, pa + pb * max(prior, floor)), OLS of final on prior at kickoff, per stat/pos.
2. Remaining mean: E[final - current] = f * m' * k(f, pace). Pace r = current / (m' * (1 - f)), 9 buckets with edges [0.25,0.5,0.75,1,1.25,1.5,2,3]. k per (stat, pos, checkpoint, bucket) is a ratio estimator sum(R)/sum(f m'), shrunk to its checkpoint row with 40 pseudo-samples, then made non-decreasing in pace (PAVA). Linear interpolation between checkpoints.
3. Spread, counts (comp, rec): negative binomial with Var = a mu + b mu^2 (a, b by least squares on squared residuals, per stat/pos and f group >0.66, 0.33-0.66, <0.33). Poisson when Var <= mu.
4. Spread, yards: compound NB-Gamma (Tweedie-like). N events ~ NB(mu/ype, size 1/b); yards per event ~ Gamma with mean ype and theta = a - ype, so Var = a mu + b mu^2. ype = phi * (league yards per completion / carry / catch); phi tuned on 2023-24 Brier at naive lines. Point mass at 0 remaining yards; no negative remainders.
5. Over/push: half lines over = P(R > line - current). Whole lines: over = P(R > line - c + 0.5), push = P(line - c - 0.5 < R <= line - c + 0.5) (yards integerised by rounding). At f = 0 the outcome is settled from current.
6. Anytime TD (at least one more rush/rec TD): P = 1 - exp(-(a + b * tdPerGame) * g(f)); g(f) = share of the position's TDs scored after that elapsed time (interpolated), a and b by grid max-likelihood. Equivalent to lambda = w * rate + (1 - w) * posMean shrinkage. QB uses rushing TDs.

| stat/pos | pa | pb | ype | phi | k at f=0.5 on pace (r 1-1.25) |
|---|---|---|---|---|---|
| passYds/QB | 99.678 | 0.553 | 11.059 | 1 | 1.009 |
| comp/QB | 9.238 | 0.532 | - | - | 0.988 |
| rushYds/QB | 4.454 | 0.746 | 5.101 | 0.9 | 1.075 |
| rushYds/RB | 8.827 | 0.819 | 2.591 | 0.6 | 1.026 |
| recYds/RB | 4.512 | 0.659 | 7.461 | 1 | 1.062 |
| recYds/WR | 8.953 | 0.776 | 8.904 | 0.7 | 1.027 |
| recYds/TE | 6.569 | 0.84 | 9.313 | 0.9 | 0.979 |
| rec/RB | 0.411 | 0.76 | - | - | 1.036 |
| rec/WR | 0.531 | 0.819 | - | - | 0.951 |
| rec/TE | 0.54 | 0.852 | - | - | 0.95 |

| TD pos | a | b | pos mean TD/game | g(0.5) |
|---|---|---|---|---|
| QB | 0.085 | 0.48 | 0.171 | 0.501 |
| RB | 0.155 | 0.56 | 0.324 | 0.51 |
| WR | 0.15 | 0.42 | 0.238 | 0.509 |
| TE | 0.153 | 0.31 | 0.182 | 0.511 |

## Calibration: 2025 held out, model fit on 2023-24
Over/under: checkpoints f = 11/12 ... 1/12 (in-game only), line = floor(current + f * raw prior) + 0.5 (naive prior-based projection, half point; rows with line < current dropped). Deciles of predicted P(over): mean predicted / observed rate. Brier vs constant 50%. RMSE of projected final vs naive projection current + f * prior.

### Players with >=3 prior games

| stat/pos | n | over rate | Brier | Brier 50% | RMSE model | RMSE naive | deciles pred/obs |
|---|---|---|---|---|---|---|---|
| passYds/QB | 4708 | 0.496 | 0.243 | 0.25 | 60.983 | 62.983 | 0.35/0.35 0.40/0.43 0.41/0.43 0.43/0.48 0.44/0.45 0.46/0.49 0.49/0.49 0.52/0.57 0.57/0.56 0.73/0.70 |
| comp/QB | 4708 | 0.477 | 0.238 | 0.25 | 5.003 | 5.264 | 0.33/0.28 0.39/0.35 0.42/0.42 0.44/0.43 0.46/0.44 0.47/0.52 0.50/0.49 0.52/0.53 0.56/0.58 0.72/0.73 |
| rushYds/QB | 4796 | 0.343 | 0.218 | 0.25 | 11.789 | 11.957 | 0.16/0.14 0.23/0.26 0.27/0.28 0.30/0.33 0.32/0.36 0.34/0.39 0.35/0.42 0.37/0.36 0.39/0.41 0.43/0.47 |
| rushYds/RB | 10296 | 0.409 | 0.235 | 0.25 | 21.641 | 22.299 | 0.21/0.26 0.28/0.30 0.30/0.34 0.33/0.35 0.35/0.39 0.37/0.42 0.39/0.45 0.42/0.47 0.45/0.49 0.52/0.61 |
| recYds/RB | 11088 | 0.301 | 0.203 | 0.25 | 11.807 | 11.942 | 0.12/0.12 0.18/0.20 0.23/0.26 0.26/0.28 0.28/0.31 0.31/0.32 0.32/0.36 0.34/0.38 0.36/0.36 0.39/0.43 |
| recYds/WR | 16676 | 0.372 | 0.23 | 0.25 | 22.181 | 22.463 | 0.21/0.24 0.30/0.32 0.34/0.33 0.35/0.38 0.37/0.35 0.39/0.35 0.41/0.41 0.42/0.40 0.43/0.44 0.46/0.50 |
| recYds/TE | 8613 | 0.394 | 0.233 | 0.25 | 17.159 | 17.326 | 0.19/0.22 0.28/0.30 0.33/0.37 0.36/0.41 0.38/0.40 0.40/0.39 0.43/0.43 0.44/0.47 0.46/0.47 0.49/0.48 |
| rec/RB | 11088 | 0.367 | 0.215 | 0.25 | 1.097 | 1.116 | 0.11/0.13 0.20/0.23 0.26/0.28 0.30/0.31 0.34/0.35 0.37/0.37 0.41/0.41 0.45/0.47 0.50/0.53 0.57/0.59 |
| rec/WR | 16676 | 0.403 | 0.231 | 0.25 | 1.396 | 1.415 | 0.20/0.24 0.30/0.30 0.34/0.33 0.37/0.35 0.40/0.38 0.43/0.40 0.46/0.44 0.49/0.49 0.53/0.50 0.60/0.60 |
| rec/TE | 8613 | 0.439 | 0.23 | 0.25 | 1.341 | 1.353 | 0.19/0.22 0.30/0.32 0.35/0.36 0.39/0.40 0.42/0.40 0.45/0.43 0.48/0.48 0.52/0.53 0.56/0.57 0.63/0.68 |

Anytime TD (all 12 checkpoints incl. kickoff; Brier vs 50% and vs base rate):

| pos | n | rate | Brier | Brier 50% | Brier base rate | deciles pred/obs |
|---|---|---|---|---|---|---|
| QB | 5220 | 0.086 | 0.075 | 0.25 | 0.078 | 0.01/0.01 0.03/0.04 0.04/0.04 0.05/0.06 0.06/0.07 0.07/0.08 0.09/0.07 0.13/0.09 0.18/0.15 0.29/0.26 |
| RB | 12096 | 0.189 | 0.14 | 0.25 | 0.153 | 0.03/0.04 0.06/0.06 0.08/0.09 0.11/0.13 0.13/0.15 0.16/0.18 0.20/0.21 0.24/0.27 0.30/0.34 0.41/0.42 |
| WR | 18192 | 0.128 | 0.107 | 0.25 | 0.112 | 0.03/0.03 0.05/0.06 0.07/0.07 0.10/0.10 0.12/0.11 0.13/0.12 0.16/0.13 0.19/0.17 0.23/0.21 0.31/0.28 |
| TE | 9396 | 0.125 | 0.105 | 0.25 | 0.109 | 0.02/0.03 0.04/0.05 0.06/0.08 0.08/0.08 0.10/0.12 0.12/0.14 0.13/0.16 0.16/0.15 0.19/0.19 0.25/0.26 |

### Fallback prior (<3 prior games, position average)

| stat/pos | n | over rate | Brier | Brier 50% | RMSE model | RMSE naive | deciles pred/obs |
|---|---|---|---|---|---|---|---|
| passYds/QB | 2255 | 0.423 | 0.231 | 0.25 | 65.152 | 66.479 | 0.32/0.14 0.38/0.23 0.43/0.37 0.44/0.49 0.46/0.32 0.48/0.54 0.50/0.52 0.53/0.45 0.57/0.56 0.60/0.60 |
| comp/QB | 2255 | 0.47 | 0.223 | 0.25 | 5.559 | 5.894 | 0.29/0.18 0.35/0.14 0.40/0.32 0.46/0.43 0.47/0.55 0.51/0.54 0.52/0.50 0.54/0.68 0.56/0.67 0.60/0.69 |
| rushYds/QB | 2387 | 0.299 | 0.201 | 0.25 | 10.875 | 11.153 | 0.17/0.19 0.24/0.20 0.27/0.23 0.29/0.23 0.32/0.26 0.34/0.28 0.35/0.31 0.36/0.32 0.37/0.30 0.41/0.66 |
| rushYds/RB | 4015 | 0.295 | 0.202 | 0.25 | 20.485 | 21.015 | 0.20/0.20 0.26/0.22 0.29/0.24 0.31/0.26 0.34/0.26 0.35/0.22 0.37/0.28 0.38/0.37 0.41/0.36 0.48/0.54 |
| recYds/RB | 4477 | 0.213 | 0.168 | 0.25 | 10.846 | 10.916 | 0.14/0.11 0.17/0.17 0.21/0.15 0.25/0.21 0.27/0.21 0.31/0.26 0.32/0.23 0.33/0.22 0.35/0.28 0.37/0.29 |
| recYds/WR | 6974 | 0.313 | 0.217 | 0.25 | 21.225 | 21.191 | 0.24/0.23 0.31/0.30 0.34/0.28 0.36/0.25 0.38/0.39 0.40/0.33 0.41/0.27 0.41/0.32 0.42/0.30 0.45/0.47 |
| recYds/TE | 3740 | 0.252 | 0.207 | 0.25 | 14.275 | 13.838 | 0.21/0.20 0.29/0.26 0.34/0.26 0.36/0.26 0.38/0.25 0.41/0.26 0.43/0.25 0.44/0.27 0.45/0.23 0.48/0.29 |
| rec/RB | 4477 | 0.302 | 0.206 | 0.25 | 1.184 | 1.199 | 0.15/0.14 0.23/0.22 0.29/0.18 0.33/0.28 0.37/0.31 0.38/0.29 0.42/0.34 0.45/0.36 0.50/0.43 0.59/0.47 |
| rec/WR | 6974 | 0.347 | 0.222 | 0.25 | 1.46 | 1.472 | 0.24/0.24 0.32/0.24 0.36/0.26 0.37/0.26 0.40/0.34 0.45/0.37 0.46/0.37 0.49/0.41 0.54/0.42 0.59/0.55 |
| rec/TE | 3740 | 0.291 | 0.223 | 0.25 | 1.319 | 1.285 | 0.23/0.19 0.31/0.23 0.35/0.23 0.37/0.19 0.42/0.35 0.45/0.31 0.47/0.28 0.54/0.34 0.56/0.41 0.60/0.38 |

Anytime TD (all 12 checkpoints incl. kickoff; Brier vs 50% and vs base rate):

| pos | n | rate | Brier | Brier 50% | Brier base rate | deciles pred/obs |
|---|---|---|---|---|---|---|
| QB | 2604 | 0.078 | 0.072 | 0.25 | 0.072 | 0.02/0.04 0.04/0.05 0.06/0.05 0.07/0.07 0.08/0.07 0.11/0.10 0.12/0.10 0.14/0.08 0.15/0.11 0.16/0.11 |
| RB | 4896 | 0.126 | 0.11 | 0.25 | 0.11 | 0.04/0.03 0.07/0.07 0.10/0.08 0.13/0.10 0.15/0.10 0.19/0.14 0.22/0.18 0.25/0.19 0.27/0.19 0.29/0.19 |
| WR | 7668 | 0.104 | 0.093 | 0.25 | 0.094 | 0.04/0.04 0.06/0.06 0.08/0.07 0.10/0.07 0.12/0.08 0.15/0.12 0.17/0.14 0.19/0.15 0.21/0.15 0.22/0.16 |
| TE | 4080 | 0.084 | 0.077 | 0.25 | 0.077 | 0.03/0.02 0.05/0.03 0.07/0.06 0.09/0.06 0.10/0.07 0.13/0.10 0.15/0.11 0.17/0.13 0.18/0.14 0.19/0.13 |

## Caveats
- Yards over probabilities run about 0.02-0.05 low on 2025 (rushYds RB worst, up to 0.09 in the top decile); counts and TD are within about 0.03. A flat +0.03 on yards overs would be a reasonable book-side correction if wanted.
- Selection: only players who got at least one touch/target/attempt in the game are included, so early-game probabilities assume the player is active and plays.
- Prior here is play-by-play season average; ESPN averages count per game played and may differ slightly (e.g. sack yards, laterals).
- Final stats include OT; f counts regulation only. TD model ignores in-game usage and game script.
- Shipped tables are refit on 2023-2025; calibration numbers above are from the 2023-24 fit.
- Scripts: scratchpad/props/{build.js, fit.js, lib.js, gen.js, gendoc.js}.
