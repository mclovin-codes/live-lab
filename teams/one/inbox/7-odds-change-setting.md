# 7. Odds-change setting in the slip

Gold's prefOK, SL.seen and SL.shown and the .seg3 control, mapped onto Blue's slip: `slip.o0` is the price seen when the slip opened, new `slip.shown` is the price last drawn, and `me.pref` (saved with the Stack) is Ask me, Higher only or Any change.
Checked at placement only: if the price differs from what the player saw and the setting does not allow it, placement fails at once with "Price changed, check it and tap again". No pending state, no later confirmation, no void.

Each anchor is unique in teams/one/index.html.

## Edit 7a: CSS. Insert BEFORE this anchor:
```text
</style>
```
```css
.seg3{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;background:rgba(255,255,255,.08);border-radius:10px;padding:3px}
.seg3 button{min-height:32px;border-radius:8px;font:600 13px/16px var(--body);color:var(--dim)}
.seg3 button.on{background:var(--panel);color:var(--ink)}
.slipodds b .car{font-size:16px;vertical-align:5px;margin:0 4px 0 0}
```

## Edit 7b: JS. Insert BEFORE this anchor:
```text
function spKey(sp){return JSON.stringify(sp)}
```
```js
/* odds-change setting: checked at placement only, never after */
const PREFS=[['ask','Ask me'],['higher','Higher only'],['any','Any change']];
const prefOK=(prev,now)=>{if(prev==null||now==null)return false;if(now===prev)return true;const p=me.pref||'ask';return p==='any'||(p==='higher'&&dec(now)>=dec(prev))};
```

## Edit 7c: placeChecked takes the price the player saw. REPLACE this:
```text
async function placeChecked(sp,stake,after){
```
with:
```js
async function placeChecked(sp,stake,after,seen){
```

## Edit 7d: the re-check after Blue's ball-dead fetch uses the setting instead of placing at a moved price. REPLACE this:
```text
if(q0.ok&&q1.odds!==q0.odds)toast('Price moved to '+fo(q1.odds)+'.');
```
with:
```js
{const base=seen!=null?seen:(q0.ok?q0.odds:null);if(base!=null&&q1.odds!==base&&!prefOK(base,q1.odds)){audit('refused: price changed');toast('Price changed, check it and tap again');render();return}}
```

## Edit 7e: slip view: arrow on the moved price, the 3-way setting, records what was shown. REPLACE this:
```text
moved=q.ok&&slip.o0!=null&&q.odds!==slip.o0;return`<div class="slipodds"><h3>${esc(q.label)}</h3><b>${q.ok?fo(q.odds):'LOCK'}</b></div>${moved?`<p class="up">Price moved from ${fo(slip.o0)}. You lock what you see.</p>`:''}
```
with:
```js
moved=q.ok&&slip.o0!=null&&q.odds!==slip.o0,better=moved&&dec(q.odds)>dec(slip.o0),needOk=moved&&!prefOK(slip.o0,q.odds);slip.shown=q.ok?q.odds:null;return`<div class="slipodds"><h3>${esc(q.label)}</h3><b>${q.ok?(moved?`<i class="car ${better?'u':'d'}">${better?'&#9650;':'&#9660;'}</i>`:'')+fo(q.odds):'LOCK'}</b></div>${moved?`<p class="${better?'up':'dn'}">Price moved from ${fo(slip.o0)} to ${fo(q.odds)}. You lock what you see.</p>`:''}<div class="seg3" role="group" aria-label="If the price changes">${PREFS.map(([k,t])=>`<button class="${(me.pref||'ask')===k?'on':''}" data-a="pref" data-v="${k}">${t}</button>`).join('')}</div>
```

## Edit 7f: slip button label. REPLACE this:
```text
${q.ok?(st>me.cash?'Only '+money(me.cash)+' left':'Lock at '+fo(q.odds)):esc(q.why)}
```
with:
```js
${q.ok?(st>me.cash?'Only '+money(me.cash)+' left':needOk?'Accept '+fo(q.odds)+' and lock':'Lock at '+fo(q.odds)):esc(q.why)}
```

## Edit 7g: act(): the setting, and the instant placement check. REPLACE this:
```text
  case'confirm':placeChecked(slip.sp,slip.stake,closeSheet);break;
```
with:
```js
  case'pref':me.pref=['ask','higher','any'].includes(d.v)?d.v:'ask';save();render();break;
  case'confirm':{if(!slip||!slip.sp)break;const nq=quote(slip.sp);if(nq.ok&&!prefOK(slip.shown,nq.odds)){audit('refused: price changed');toast('Price changed, check it and tap again');render();break}placeChecked(slip.sp,slip.stake,closeSheet,slip.shown);break}
```

## How it behaves
- Ask me: any move from the opening price relabels the button "Accept -120 and lock". Tapping it places at -120 (that is the price shown). If it moves again before the tap, the tap fails with the toast and the slip redraws.
- Higher only: better prices lock without asking; worse ones need Accept.
- Any change: locks whatever is shown at tap time, still at Blue's live quote.
- Snap one-tap picks (act 'snap') pass no `seen`, so 7d compares to the price at the tap.

## Test (browser console, Live tab, game live, book open)
1. `me.pref='ask';act({a:'slip',k:spKey({k:'ml',side:HOME})});const n=me.bets.length;slip.shown=slip.shown-25;act({a:'confirm'});[me.bets.length===n,document.getElementById('toast').textContent]` gives `[true,"Price changed, check it and tap again"]`.
2. `slip.o0=slip.shown-25;render();[document.querySelector('#sheet .go').textContent,!!document.querySelector('.slipodds .car.u')]` gives `["Accept <price> and lock",true]` (green up arrow, price better than seen).
3. `act({a:'pref',v:'higher'});slip.o0=slip.shown+25;render();[me.pref,document.querySelector('#sheet .go').textContent,!!document.querySelector('.slipodds .car.d')]` gives `["higher","Accept <price> and lock",true]`; then `act({a:'pref',v:'any'});render();document.querySelector('#sheet .go').textContent` starts "Lock at". Then `closeSheet()`.
