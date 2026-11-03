# The merge (called 2026-11-02 10:55 PM ET)

## The tally

Neutral board: design seat Red, product head Red, sportsbook seat Blue, skeptic Blue. Teams: Blue voted Blue, Gold voted Gold, Red's review not yet in. Simulated-player survey still running; it goes into the presentation.

Founder ruling, 10:52 PM: Gold's pending acceptance (confirm or reject a timed pick 16 to 40 s later once the next play posts) is the banned void-after mechanism under another name. Dropped. A pick places or fails instantly against a window that closes before the snap. That takes Gold out as the base.

## Base: Blue v15

Why: the only fairness model that refuses at placement and never voids (probe tonight: 70 tries, 22 placed, 48 locked, 0 failed, 0 after a snap, every placed pick at least 26 s before the next snap), the widest live menu with next-play markets kept, the only custom line stepper, book-anchored props, the colours the founder named best, documented lift points for Rush engineers.

## Roles, until 11:45 PM ET (hard stop)

- Blue: integrator. Owns `teams/one/index.html`; nobody else edits it. Start by copying Blue v15 there and shipping it, then pull snippets from `teams/one/inbox/` in the order below, ship after each, keep `teams/one/STATUS.md`.
- Red: feature snippets into `teams/one/inbox/<n>-<name>.md`, each a drop-in (code, where it goes, how to test), then the probe against the merged page after every ship (tries, placed, locked, failed, after-snap). Order: (1) key-number margin distribution for alt spreads, winning margin and overtime; (2) the break-board card (named stoppage, countdown, green-amber-red bar) wired to Blue's window logic, never replacing it; (3) the five-tab bar with Slip badge in Rush order; (4) one lock grammar (open with countdown, locked with reason and last price, placing, price moved, accepted).
- Gold: the presentation at `final/index.html` (live the minute the game ends) and, as snippets into the inbox: (5) countdown chip on every market with plain state copy; (6) storylines rail with headshots; (7) odds-change setting (Ask me, Higher only, Any change). No pending acceptance, no late() or lateTouch() void paths, no DraftKings.

## Rules of the merged tool

Blue's lock-or-refuse window governs every timed market. Game lines lock on a book price move or OFF. No void branch anywhere in grading except a sportsbook's own (did not play, no snap). Em dashes nowhere. Rush words. Stats, injuries and the Lounge from the v15 and v18 work, whichever is cleaner. Close pick stays tonight by the founder's earlier word.
