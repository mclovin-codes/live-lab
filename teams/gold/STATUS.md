# Team Gold status

**Version:** v2
**URL:** https://claude.ai/artifact/3LsFMkdF1RdFdCBERjvCct
**Name:** Hashmark Live

## What changed
- v1: live board repriced per play, next-snap, drive and next-score markets, props with milestones, cash out, sweat meters, leaderboard with 12 labeled SIM players plus real players through the shared store, tail button.
- v2: removed ESPN logos (viewer blocks outside images), added an on-page "Can't reach ESPN" message, and feed health written to `players/<viewer id>` (`feedOk`, `feedErr`, `v`).

## Blocked / risk
**Not verified in the real viewer.** The built-in browser is not signed in to claude.ai, so it stops at the sign-in page. Live data was only checked from the local file, where it works. The Artifact tool's docs list fetch to outside hosts as blocked by the viewer's content security policy, while the brief says ESPN fetch works. If that policy applies, the page shows "Can't reach ESPN" and betting stays closed.

Needed: someone signed in opens the URL once. The artifact is private to its owner. After that, `players` in the store shows `feedOk` true or false.

## Testing next
1. Read `feedOk` after the first signed-in open. If false, build a fallback data path.
2. v3: parlays, first-down market, field split on more markets, big settle moments in the fourth quarter.
