# ESPN public API cheat sheet (NFL, verified live 2026-11-02 8:28 PM ET)

Event: 401873036, CHI at SEA. Home = SEA (team id 26), away = CHI (team id 3). Season 2026.

Every endpoint below returned `Access-Control-Allow-Origin: *`, so a browser page can fetch them directly. No key, no auth. Sample responses saved in `recon/` (summary.json, odds.json, prob.json, plays.json, situation.json, cdn.json, core_event.json).

Replace `E` with the event id. Core API hosts: `sports.core.api.espn.com`. Site API host: `site.api.espn.com`.

## 1. Game summary (the one-call snapshot)

`https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=E`

Cache-Control max-age=10. Poll every 10 s.

Keys: `boxscore, format, gameInfo, drives, leaders, injuries, broadcasts, pickcenter, odds, againstTheSpread, videos, news, winprobability, header, wallclockAvailable, meta, standings`.

- `header.competitions[0].status`: `{displayClock:"8:08", period:1, type:{state:"in"|"pre"|"post", completed:false, detail:"8:08 - 1st Quarter"}}`.
- `header.competitions[0].competitors[]`: `{homeAway, score, team:{id, abbreviation, displayName, logo, color}, linescores[]}`.
- `drives.current`: the live drive with `plays[]` (same play shape as section 4, resolved inline, with `start`, `end`, `team`, `yards`, `timeElapsed`, `result`). `drives.previous[]`: finished drives.
- `boxscore.teams[].statistics[]`: `firstDowns, thirdDownEff, totalYards, netPassingYards, rushingYards, turnovers, possessionTime, redZoneAttempts, sacksYardsLost ...` (name, displayValue).
- `boxscore.players[]` per team, `statistics[]` groups with `keys` and `athletes[].stats[]` aligned to keys:
  - passing: `completions/passingAttempts | passingYards | yardsPerPassAttempt | passingTouchdowns | interceptions | sacks-sackYardsLost | adjQBR | QBRating`
  - rushing: `rushingAttempts | rushingYards | yardsPerRushAttempt | rushingTouchdowns | longRushing`
  - receiving: `receptions | receivingYards | yardsPerReception | receivingTouchdowns | longReception | receivingTargets`
  - fumbles, defensive (`totalTackles | soloTackles | sacks | tacklesForLoss | passesDefended | QBHits | defensiveTouchdowns`), interceptions, kickReturns, puntReturns, kicking (`fieldGoalsMade/fieldGoalAttempts | ... | extraPointsMade/extraPointAttempts | totalKickingPoints`), punting.
  - This is the prop-grading source: passing yards, rushing yards, receptions, receiving yards, TDs, completions, attempts, longest, kicking points.
- `winprobability[]`: `{playId, homeWinPercentage, tiePercentage, secondsLeft}` per play.
- `pickcenter[]` and `odds[]`: DraftKings line (provider id 100): `spread`, `overUnder`, `homeTeamOdds.moneyLine`, `awayTeamOdds.moneyLine`, `details` ("SEA -3"). Pregame or latest; the core odds endpoint (section 3) carries open and current.
- `scoringPlays[]` appears once there is a score. `leaders[]` per team (passing, rushing, receiving leaders with displayValue).

## 2. Situation (down, distance, possession) at 4 s

`https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/E/competitions/E/situation`

Cache-Control max-age=4. `{down, distance, yardLine, downDistanceText:"3rd & 1 at SEA 31", team:{$ref ... teams/3}, lastPlay:{$ref}, isRedZone, homeTimeouts, awayTimeouts}`. Team refs end in the team id.

## 3. Live DraftKings odds (open and current)

`https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/E/competitions/E/odds`

Cache-Control max-age=137 (ESPN refreshes it about every two minutes). `items[0]` is DraftKings (provider id 100):

```
spread: -3            // home spread
overUnder: 46.5
overOdds: -108, underOdds: -112
homeTeamOdds: { moneyLine: -166, spreadOdds: -120, favorite: true,
  open:    { pointSpread:{american:"-4.5"}, spread:{american:"-110"}, moneyLine:{american:"-218"} },
  current: { pointSpread:{american:"-3"},   spread:{american:"-120"}, moneyLine:{american:"-166"} } }
awayTeamOdds: { moneyLine: 140, spreadOdds: 100, open:{...}, current:{...} }
open:    { total:{american:"47.5"}, over:{american:"-110"}, under:{american:"-110"} }
current: { total:{american:"46.5"}, over:{american:"-108"}, under:{american:"-112"} }
```

`current` moves during the game (this one already moved from -4.5 / 47.5 to -3 / 46.5 in the first quarter). The `odds/100/history/0/movement` endpoint returned an empty list for this game, so treat `current` as the only live line feed.

## 4. Per-play probabilities (the engine for live pricing)

`https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/E/competitions/E/probabilities?limit=1000`

Cache-Control max-age=3. One item per play, newest last:

```
{ homeWinPercentage: 0.4724, awayWinPercentage: 0.5276, tiePercentage: 0,
  spreadCoverProbHome: 0.4218, spreadPushProb: 0.0747,
  totalOverProb: 0.4628, totalPushProb: 0,
  secondsLeft: 0, sequenceNumber:"41000", lastModified, play:{$ref ...plays/401873036410} }
```

ESPN prices the home side covering the DraftKings spread and the game going over the DraftKings total after every play. Fair live moneyline = win percentage converted to American odds; add any vig you like. Alt lines need a model (the team's call: normal approximation around a live projected margin, a possession-aware state model, anything).

## 5. Play by play (every play, full detail)

`https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/E/competitions/E/plays?limit=400`

Cache-Control max-age=5. `items[]` newest last. Shape:

```
{ id, sequenceNumber, type:{id, text:"Pass Incompletion"|"Rush"|"Pass Reception"|"Punt"|"Field Goal Good"|"Timeout"|"Kickoff"|...},
  text, shortText, awayScore, homeScore, period:{number}, clock:{value:492, displayValue:"8:12"},
  scoringPlay, scoreValue, statYardage, isTurnover, isPenalty, wallclock, modified,
  team:{$ref}, drive:{$ref},
  start:{down, distance, yardLine, yardsToEndzone, downDistanceText, possessionText, team:{$ref}},
  end:{...same...},
  participants:[{athlete:{$ref}, type:"passer"|"receiver"|"rusher"|"tackler"|..., order, playStatistics:{$ref}}],
  probability:{$ref} }
```

`participants[].athlete.$ref` points at `.../athletes/{id}`; the summary box score already has names, so join by athlete id without fetching.

Alternative with names resolved inline and a 31 s cache: `https://cdn.espn.com/core/nfl/playbyplay?xhr=1&gameId=E` (`gamepackageJSON.drives.current.plays[]`, plus `boxscore`, `header`, `winprobability`). Slower cache, richer text. The summary endpoint's `drives.current.plays[]` is the fastest named play feed (10 s).

## 6. Event, competitors, status (core)

`https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/E` (max-age=3). `competitions[0].status.$ref`, `competitors[].score.$ref`, `competitors[].linescores.$ref`, `situation.$ref`, `odds.$ref`, `probabilities.$ref`, `plays.$ref`, `drives.$ref`, `leaders.$ref`, `roster.$ref`. Follow any `$ref` with a plain GET.

Status alone: `.../events/E/competitions/E/status` (period, clock, type.state, type.completed). Score alone: `.../competitors/26/score` and `.../competitors/3/score`.

## 7. Scoreboard, teams, athletes

- Scoreboard: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard` (every game, status, score, odds, leaders).
- Team: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/26` (logos, colors, record). Roster: `.../teams/26/roster`.
- Athlete: `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/athletes/{id}`. Headshot URL pattern: `https://a.espncdn.com/i/headshots/nfl/players/full/{id}.png`. Team logo: `https://a.espncdn.com/i/teamlogos/nfl/500/{abbr}.png` (lowercase abbreviation).
- Season stats for a player: `.../seasons/2026/types/2/athletes/{id}/statistics`.

## Grading rules a sportsbook applies (so every team grades the same way)

- Spread: team score plus spread versus opponent. Exact tie = push, stake returned.
- Total: final combined score versus the number. Exact = push. Overtime counts.
- Moneyline: winner. Ties in NFL = push on the moneyline.
- Team total: that team's final points versus the number.
- Player props: the box score stat at the final whistle (passing yards, rushing yards, receiving yards, receptions, TDs, completions, longest). Exact = push. A player who never records a snap: void, stake returned.
- Alt lines: same as the base market at the alternate number.
- Live picks lock at the line and odds shown when the player confirms, graded at the end of the game (or at the end of the quarter or drive for quarter and drive markets, which ESPN's `period` and `drives.previous[].result` settle).
- American odds payout: positive odds pay stake times odds divided by 100; negative odds pay stake times 100 divided by the absolute odds. Stake comes back on a win.

## Cadence summary

| Feed | Cache | Use |
|---|---|---|
| probabilities | 3 s | live fair prices, after every play |
| situation | 4 s | down, distance, possession, red zone |
| plays (core) | 5 s | the play feed |
| summary | 10 s | score, clock, box score, drives with names, DK line |
| odds (core) | 137 s | DraftKings open and current lines |
| cdn playbyplay | 31 s | fallback, names inline |
