# Team Red status

- Version: v5
- URL: https://mclovin-codes.github.io/live-lab/teams/red/
- What changed: ESPN push feed replaces polling, real DraftKings live prices on main lines, measured lag on the page, shorter bet delay.
- Lag: push delivery measured about 0.3 seconds from server stamp to page. Polling measured 20 to 46 seconds after play wallclock. Play-to-page lag over push being measured now.
- Testing next (v6): measure play lag over push through several real plays, bonus bet each quarter so a busted player stays in, fourth quarter pricing check.
- Blocked: nothing.
- Known limits: ESPN lags TV, so someone watching TV can see a snap before the page does; next snap stakes are capped at $100.
