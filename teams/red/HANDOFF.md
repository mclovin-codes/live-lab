# Handoff: lifting this into the Rush event page

`index.html` is a single-file prototype of what the Bears at Seahawks event page becomes at kickoff. Everything sits in one script, marked by `/* ---------- */` section comments.

## Keep these mechanics

- Push feed client (`fcConnect` to `fcFlush`): ESPN FastCast checkpoint plus JSON patches. Delivery was 0.2 to 0.3 seconds from server stamp to page. It is an undocumented ESPN feed, so Rush should confirm it may use it before relying on it, and keep the polling fallback.
- Market engine (`build`, `buildProps`, `reg`): turns game state into the live market list. Main lines are DraftKings live prices; alternates, props, next snap, drive and finish markets are modelled around them.
- Grading (`grade`, `gradeParlay`, `settle`): one function per market type, sportsbook rules, pushes and voids included.
- Sweat and beat the line (`sweat`, `lineCheck`), big play takeover (`bigPlay`, `takeover`), live Units (`betValue`, `unitsLive`).

## Replace with the Rush engine

| Stand-in here | Rush source |
|---|---|
| `ST` in localStorage: Stack, picks | Weekly Stack and the Slip |
| `unitsNow`, `ST.base` | Units from Rush settlement |
| `BOTS`, `sim`, `fieldShare` | The real Field and its pick splits |
| `oppId`, `matchup` | This week's head-to-head opponent |
| `ST.reloaded` and the Reload card | Rush Reload |
| Prototype "arrive with" control | Delete |
| `SIM` chips and the opponent taking the other side | Delete |
| `E`, `HID`, `AID`, and `SEA`/`CHI` in `abbr` and labels | Event data from the Board |

## Screens

Live (next snap, this drive, next score, finish, game line), Board (this event's lines), Props, Slip (this event's picks), Ranks (matchup, the Field, quarter race). In the app the bottom tabs become in-event tabs under Rush's own five.

## Open questions for Rush

- Next snap and drive markets are new for Rush. They need engine grading on play and drive results, not just final stats.
- ESPN reports plays after they happen, and TV can show a snap first. Next snap stakes are limited to 100 Stack and a pick needs a 1.5 second lock. A real Field may need stricter protection, since this decides prizes.
- Live rank uses each open pick's current chance of hitting. Rush may want to show it as a projection beside official Units.
