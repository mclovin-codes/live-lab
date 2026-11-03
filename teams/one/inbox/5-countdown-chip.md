# 5. Countdown chip on every live market card

Gold's cdText, paintChips and cdChip, ported onto Blue's own timedGate, suspended and quote locks (no Gold window, nothing that accepts picks later).
Chip markup is static; a 1s painter writes only the chip text, so markets are never re-rendered for the countdown. Class is `.cdc` because Blue already uses `.cd` for its countdown bar.

Apply the edits in order. Each anchor is a unique string in teams/one/index.html (checked: 1 hit each).

## Edit 5a: CSS. Insert BEFORE this anchor:
```text
</style>
```
```css
.cdc{margin-left:auto;display:inline-flex;align-items:center;gap:5px;font:600 12px/1 var(--body);color:var(--blue);background:rgba(0,191,255,.12);border-radius:999px;padding:3px 8px;white-space:nowrap;flex:none}
.cdc.warn{color:var(--sweat);background:rgba(245,158,11,.14)}
.cdc.off{color:var(--dim);background:var(--panel2)}
.cdc svg{width:12px;height:12px;flex:none}
.cdc em{font-style:normal}
```

## Edit 5b: JS. Insert BEFORE this anchor:
```text
function vLive(M){
```
```js
/* ---------- countdown chip: reads Blue's timedGate and quote locks, painted each second ---------- */
const CDCLK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
const cdChip=timed=>`<span class="cdc" data-cd="${timed?1:0}">${CDCLK}<em></em></span>`;
function cdText(timed,M){M=M||model();const g=M.g;if(!g.live||g.done)return{t:'Closed',c:'off'};
  const sus=suspended(M);if(sus)return{t:sus==='Final'||sus==='Not live'||sus==='Settling'?'Closed':'Locked',c:'off'};
  const tg=timedGate(M),half=isHalf(),mm=x=>{x=Math.max(0,Math.ceil(x));return x>=60?Math.floor(x/60)+':'+String(x%60).padStart(2,'0'):x+'s'};
  const moving=S.dkMoveAt&&Date.now()-S.dkMoveAt<3000;
  if(timed){if(moving||!tg.open)return{t:'Locked · reopens after the next play',c:'off'};return{t:(half?'Closes at kickoff ~':'Locks in ')+mm(tg.left),c:tg.left<=5?'warn':''}}
  const q=quote({k:'ml',side:HOME},M);if(!q.ok)return{t:q.why==='Line moving'?'Locked · line moving':'Locked',c:'off'};
  if(tg.open)return{t:(half?'Open till kickoff ~':'Open till snap ~')+mm(tg.left),c:tg.left<=5?'warn':''};
  return{t:'Open at the live price',c:''}}
function paintChips(M){try{if(!document.querySelector('.cdc[data-cd]'))return;M=M||model();const a=cdText(true,M),b=cdText(false,M);
  document.querySelectorAll('.cdc[data-cd]').forEach(el=>{const x=el.dataset.cd==='1'?a:b,c='cdc'+(x.c?' '+x.c:''),em=el.querySelector('em');if(el.className!==c)el.className=c;if(em&&em.textContent!==x.t)em.textContent=x.t})}catch(e){}}
setInterval(()=>paintChips(),1000);
```

## Edit 5c: markup, snap and prop cards (all GATED kinds, so timed chip). REPLACE this:
```text
<div class="q"><span class="who">${title}</span><small>${sub}</small></div>${bar}
```
with:
```js
<div class="q"><span class="who">${title}</span><small>${sub}</small>${cdChip(1)}</div>${bar}
```

## Edit 5d: markup, Next play subtitle no longer duplicates the chip countdown. REPLACE this:
```text
snapTxt=tg.open?`locks in ${mmss(tg.left)}`:'locked';
```
with:
```js
snapTxt='pass or run';
```

## Edit 5e: markup, Live tab Game lines header (not timed: open at the book price). REPLACE this:
```text
<header><h2>Game lines</h2><small>${M.dk?'Open while
```
with:
```js
<header><h2>Game lines</h2>${cdChip(0)}<small>${M.dk?'Open while
```

## Edit 5e2: markup, Board tab Game lines header. REPLACE this:
```text
<header><h2>Game lines</h2><small>${M.dk?'Book live
```
with:
```js
<header><h2>Game lines</h2>${cdChip(0)}<small>${M.dk?'Book live
```

## Edit 5f: markup, Winning margin header (wm is GATED). REPLACE this:
```text
<header><h2>Winning margin</h2><small class="${t.open?'gt':'gl'}">${t.open?'locks in '+mmss(t.left):'locked: '+esc(t.why)}</small></header>
```
with:
```js
<header><h2>Winning margin</h2>${cdChip(1)}</header>
```

## Edit 5g: paint right after each render (fresh nodes get text at once). REPLACE this:
```text
lastRank=r}
```
with:
```js
lastRank=r;paintChips(M)}
```

## States (plain copy)
Timed: "Locks in 12s", "Closes at kickoff ~9:40" (halftime, Blue's 600s half window), "Locked · reopens after the next play", "Locked", "Closed".
Game lines: "Open till snap ~12s", "Open till kickoff ~9:40", "Open at the live price", "Locked · line moving", "Locked", "Closed". Amber at 5s or less.

## Test (browser console, Live tab, game live)
1. `[...document.querySelectorAll('.cdc em')].map(e=>e.textContent)` returns one non-empty state per card; `cdText(true)` and `cdText(false)` return `{t,c}`.
2. `S.dkMoveAt=Date.now();paintChips();[...document.querySelectorAll('.cdc em')].map(e=>e.textContent)` shows "Locked · reopens after the next play" on timed chips and "Locked · line moving" on Game lines; after 3s they recover.
3. No re-render: `openSheet('changes');const e=document.querySelector('.cdc em'),t0=e.textContent;setTimeout(()=>console.log(t0,'->',e.textContent,e.isConnected),3000)` shows the text changed on the same connected node (with a sheet open Blue's 1s render is off, so only the painter ran). Then `closeSheet()`.
