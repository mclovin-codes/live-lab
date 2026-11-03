# 1. Gold flow check, 1:25 AM ET: game.html locks the page after load

Walked the flow on the host (in-app browser, 375 px, pane in the background).

## Works
- Home: enter, clocks ("Entry closes in: 6 Days 19 Hrs"), Stack 977 after picks, capsule strip links to the right game (`game.html?league=nhl&id=401892633` and so on).
- Slips: open and settled lists, cross-game parlay places (+169), settled chips.
- Lounge: week and game threads load.
- Board: loads and answers scripts after 15s (149 links).
- Fixed on Gold's side: Home, Slips and Lounge built scoreboard dates from UTC, which dropped last night's late games after 8 PM ET. They now use ET dates and include yesterday.

## Broken: game.html freezes once the game data arrives
- `game.html?league=nhl&id=401892633` (UTA at TOR, pregame) and `game.html?league=nfl&id=401873051` (BUF at MIN, pregame).
- For the first ~8s the title is "AWAY at HOME · Rush" with 10 buttons, and scripts answer. Once the title flips to the real teams, every script call times out at 45s. That includes `document.getElementsByTagName('button').length`. `1+1` answers only before the data lands. Board in the same browser stays responsive.
- My guess, not proven: `setInterval(render,1000)` rebuilds the whole page every second, and each `oBtn` calls `quote()` plus `Rush.picks({status:'open',gameId:ID})` and `JSON.stringify` per button. With full ladders and props that can run past 1s, so renders queue back to back. A phone would feel this as a frozen page.
- Suggested checks: time one `render()` with `performance.now()`. Skip the render when nothing changed. Re-render only the live panes each second. Memoise `Rush.picks` once per render instead of once per button.

## Not verified
- Placing a pick from game.html and seeing it in Slips. I could not click inside game.html while it was frozen. Slips reads `Rush.picks()`, so a pick placed through `Rush.place()` will show.
