# 2. Break board card (named stoppage, countdown, green-amber-red bar)

From Red v13 to v17. A card at the top of Live that says which stoppage the game is in and how long timed picks stay open. It only READS Blue's timedGate() and GAPKIND(); it never opens or closes anything, so Blue's window logic stays the single source of truth. Markup is static per render; a 1s painter writes the text and bar width, so nothing re-renders for the countdown.

Names (plain words, per the NFL expert): halftime = "Halftime", official timeout = "Commercial break", two-minute warning = "Two-minute warning", end of quarter = "End of the quarter", score = "After the score", team timeout = "Timeout". Short live gaps (between snaps) show no card.

Three edits. Each anchor is a unique string in teams/one/index.html (checked: 1 hit each).

## Edit 2a: CSS. Insert BEFORE this anchor:
```text
</style>
```
```css
.bbk{display:grid;gap:8px;padding:14px;border-radius:14px;background:linear-gradient(135deg,rgba(16,185,129,.20),rgba(16,185,129,.06));box-shadow:inset 0 0 0 1px rgba(16,185,129,.45)}
.bbk .t1{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.bbk b{font:700 16px/1.2 var(--body);color:var(--ink)}
.bbk .bbt{font:700 16px/1 var(--body);color:var(--win);font-variant-numeric:tabular-nums;white-space:nowrap}
.bbk small{color:var(--dim);font-size:12.5px}
.bbk .bar{height:4px;border-radius:2px;background:rgba(255,255,255,.1);overflow:hidden}.bbk .bar i{display:block;height:100%;width:100%;background:var(--win);transition:width 1s linear}
.bbk.soon .bbt{color:var(--sweat)}.bbk.soon .bar i{background:var(--sweat)}
.bbk.end .bbt{color:var(--loss)}.bbk.end .bar i{background:var(--loss)}
.bbk.off{background:var(--panel2);box-shadow:none}.bbk.off .bbt{color:var(--dim)}
```

## Edit 2b: JS. Insert BEFORE this anchor:
```text
function vLive(M){
```
```js
/* ---------- break board card: names the stoppage, paints Blue's timedGate countdown each second ---------- */
const BBNAME={half:'Halftime',break:'Commercial break',score:'After the score',timeout:'Timeout'};
function bbKind(){const last=S.plays[S.plays.length-1];if(!last)return null;const k=GAPKIND(last),t=(last.type&&last.type.text)||'';if(k==='break'){if(/two-minute/i.test(t))return'Two-minute warning';if(/end /i.test(t))return'End of the quarter'}return BBNAME[k]||null}
function bbCard(M){const name=bbKind();if(!name||M.g.done)return'';return`<div class="bbk" id="bbk"><div class="t1"><b>Picks open &middot; ${esc(name)}</b><span class="bbt"></span></div><div class="bar"><i></i></div><small>Drive, next score and player picks lock before play resumes.</small></div>`}
function bbPaint(){const el=document.getElementById('bbk');if(!el)return;const tg=timedGate(model()),left=tg.left||0,w=tg.w||1,pct=Math.max(0,Math.min(100,100*left/w));el.querySelector('.bbt').textContent=tg.open?'Locks in '+Math.floor(left/60)+':'+String(Math.floor(left%60)).padStart(2,'0'):'Locked';el.querySelector('.bar i').style.width=(tg.open?pct:0)+'%';el.classList.toggle('soon',tg.open&&left<60&&left>=15);el.classList.toggle('end',tg.open&&left<15);el.classList.toggle('off',!tg.open)}
setInterval(bbPaint,1000);
```

## Edit 2c: JS. REPLACE this:
```text
h+=vWP(M);
```
with:
```js
h+=bbCard(M);h+=vWP(M);
```
Then call `bbPaint()` once right after Live's HTML is written (wherever vLive output is assigned to the DOM), so the first frame is not empty for up to 1s. If that is awkward, skip it: the 1s painter fills it.

## Test
- During a commercial break, halftime or two-minute warning the card appears at the top of Live with the stoppage name and "Locks in m:ss"; the bar shrinks and turns amber under 60s, red under 15s.
- When timedGate closes (time up, line moved, new play) the text becomes "Locked" and the card greys out; between snaps there is no card.
- Console: `bbKind()` returns the name for the newest play; `timedGate(model())` is unchanged by this snippet.
