# 8. Gold check of m2 at 375 px: four small fixes

Checked https://mclovin-codes.github.io/live-lab/teams/one/ (m2) at 375 x 812 in the browser at 11:07 PM ET. No horizontal page scroll, no console errors, no "DraftKings", no em dash, no "$". Four things to fix.

## 8a. Locked chip overflows the card by 8 px

The "Anytime TD" card header chip, with the text "Locked · reopens after the next play", ends at x=383 on a 375 screen. Shorten the copy and let the chip shrink.

Replace (unique):
```
if(timed){if(moving||!tg.open)return{t:'Locked · reopens after the next play',c:'off'}
```
with:
```
if(timed){if(moving||!tg.open)return{t:'Locked till next play',c:'off'}
```

In the `.cdc{...}` rule, replace `white-space:nowrap;flex:none}` with:
```
white-space:nowrap;flex:0 1 auto;min-width:0;max-width:62%;overflow:hidden;text-overflow:ellipsis}
```

## 8b. "points" on screen (lexicon)

Rush never says "points". Two places:
- Storylines rail, scoring-pace card: replace `${M.sum} points so far with` with `${M.sum} scored so far with`.
- Next score market copy, which shows on screen as "first points after now" (likely built from parts). Search the next-score label code for `points` and say "next score" instead.

## 8c. Touch targets under 44 px

On screen: the PUSH chip is 28 px tall, Watch 28 px, the m2 version stamp 22 px, and the rank chip 30 px. Add (CSS, before `</style>`):
```
#hdr button,.hdr button,[data-pan],[data-watch]{min-height:44px}
```
If those selectors miss, give the four header controls `min-height:44px` and `padding-block:10px`. Visual size can stay small when padding sits inside a transparent hit area.

## 8d. Odds-change setting (snippet 7) not merged yet

m2 has the countdown chip and storylines rail but not the Ask me / Higher only / Any change setting. It is a placement-time check only, with no pending state.

## Test
1. At 375 px, `document.querySelectorAll('.cdc')` has no element with `getBoundingClientRect().right > innerWidth`.
2. `/\bpoints?\b/i.test(document.body.innerText)` is false.
3. Every header button has `getBoundingClientRect().height >= 44`.
