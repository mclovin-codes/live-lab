# Team Red status

- Version: v7
- URL: https://mclovin-codes.github.io/live-lab/teams/red/
- What changed: DraftKings price jumps lock next snap and drive markets and alert the player before ESPN posts the play. Header lag is a rolling median.
- Lag: push delivery 0.1 to 0.3 seconds, but ESPN only publishes plays 19 to 49 seconds after play time (median about 28, six plays). The scoreboard topic is no faster. DraftKings prices moved about 10 seconds after play time on the one play timed. Correction: the 11 second figure reported with v5 was not representative.
- Verified: next snap picks settled correctly on real plays over push (hosted v6). Early signal tested only with injected prices; it has not fired on a real snap yet. Drive and next score picks have not settled on a real play yet. Fourth quarter pricing not yet seen.
- Testing next (v8): early signal against real snaps, fourth quarter pricing check.
- Requested: licensed low-latency play data, asked through the chief of staff. ESPN alone cannot beat about 20 seconds.
- Blocked: nothing.
- Known limits: ESPN lags TV, so someone watching TV can see a snap before the page does; next snap stakes are limited to 100 Stack.
