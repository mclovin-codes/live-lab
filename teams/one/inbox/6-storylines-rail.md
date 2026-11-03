# 6. Storylines rail at the top of the live view

Gold's storyRail and .stories/.story CSS, rebuilt on Blue's model, micro(), S.props, logo() and head(): five swipe cards (underdog moneyline, this drive or red zone, nearest yardage milestone, scoring pace against the total, a touchdown scorer).
Each card has exactly one price button made by Blue's own oBtn with the default 'slip' action, so taps open Blue's slip and placement goes through quote() and placeChecked() with Blue's lock rules.

Apply after file 5 (5b and 6b share an anchor; order does not matter). Each anchor is unique in teams/one/index.html.

## Edit 6a: CSS. Insert BEFORE this anchor:
```text
</style>
```
```css
.stories{flex:none;display:flex;gap:10px;overflow-x:auto;scrollbar-width:none;scroll-snap-type:x mandatory;margin-inline:-2px;padding-bottom:2px}
.stories::-webkit-scrollbar{display:none}
.story{flex:0 0 74%;max-width:280px;min-width:0;scroll-snap-align:start;background:var(--panel);border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:8px;box-shadow:0 1px 0 rgba(255,255,255,.04) inset,0 8px 24px rgba(0,0,0,.35)}
.story>small{font:700 11px/1 var(--body);letter-spacing:.05em;color:var(--blue);text-transform:uppercase}
.story .who{display:flex;align-items:center;gap:8px}
.story .stx{font:600 15px/1.25 var(--num);color:var(--ink);min-height:38px}
.story .si{width:30px;height:30px;border-radius:50%;object-fit:cover;object-position:50% 15%;background:var(--panel2);flex:none}
.story img.si[src*="teamlogos"]{object-fit:contain;padding:3px}
.story .o{width:100%}
```
`flex:none` on `.stories` matters: #view is a flex column, and without it the rail shrinks and clips the cards.

## Edit 6b: JS. Insert BEFORE this anchor:
```text
function vLive(M){
```
```js
/* ---------- storylines rail: one Blue price button per card ---------- */
function storyRail(M){const g=M.g;if(!g.live||g.done)return'';const cards=[],mm=micro(),aw=1-M.hw-M.tie,fav=M.hw>=aw?HOME:AWAY,dog=fav==HOME?AWAY:HOME,fp=Math.round((fav==HOME?M.hw:aw)*100);
  cards.push({tag:'Underdog',img:logo(dog,'si'),h:`${teamAb(fav)} is ${fp}% to win. ${teamAb(dog)} needs a stop.`,btn:oBtn({k:'ml',side:dog},teamAb(dog)+' moneyline',M)});
  if(mm&&mm.driveId){const nth=['','1st','2nd','3rd','4th'][mm.down]||'';cards.push({tag:mm.ytg<=20?'Red zone':'This drive',img:logo(mm.off,'si'),h:`${teamAb(mm.off)} ball, ${nth} &amp; ${mm.dist}, ${mm.ytg} yds to go.`,btn:oBtn({k:'drive',c:'td'},'Drive ends in a TD',M)})}
  let best=null,td=null;const seen=new Set();
  (S.props||[]).forEach(p=>{const key=p.aid+'|'+p.t;if(seen.has(key))return;seen.add(key);
    if(p.t===8||p.t===12||p.t===13){const cur=propCur(p.aid,p.t)||0,steps=p.t===8?[200,250,300,350]:[50,75,100,125],ms=steps.find(x=>x>cur);if(ms&&cur>0){const gap=(ms-cur)/ms;if(!best||gap<best.gap)best={aid:p.aid,t:p.t,cur,ms,gap}}}
    if((p.t===12||p.t===13)&&tdCount(p.aid)===0){const l=tdLambda(p.aid);if(!td||l>td.l)td={aid:p.aid,l}}});
  if(best)cards.push({tag:'Milestone watch',img:head(best.aid,'si'),h:`${esc(pname(best.aid))} has ${best.cur} ${PT[best.t].n.toLowerCase()}, ${best.ms-best.cur} from ${best.ms}.`,btn:oBtn({k:'prop',aid:best.aid,t:best.t,side:'o',line:best.ms-.5},best.ms+'+ '+PT[best.t].n,M)});
  const tl=M.mt;cards.push({tag:'Scoring pace',img:'<img class="si" src="https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png" alt="" loading="lazy">',h:`${M.sum} points so far with ${Math.round(M.secs/60)} minutes left. The total is ${tl}.`,btn:oBtn({k:'total',side:'o',line:tl},'Over '+tl,M)});
  if(td)cards.push({tag:'Touchdown scorer',img:head(td.aid,'si'),h:`${esc(pname(td.aid))} has no touchdown yet tonight.`,btn:oBtn({k:'td',aid:td.aid},'Anytime TD',M)});
  return`<div class="stories" aria-label="Storylines">${cards.slice(0,5).map(c=>`<div class="story"><small>${c.tag}</small><div class="who">${c.img}<span class="stx">${c.h}</span></div>${c.btn}</div>`).join('')}</div>`}
```

## Edit 6c: markup, top of the live view (after the low-Stack notice, before the last play). Insert BEFORE this anchor:
```text
  const real=[...S.plays].reverse().find(p=>cls(p)!=='skip')||last;
```
```js
  h+=storyRail(M);
```

## Notes
- Drive, prop and TD cards are GATED kinds: when Blue's window is shut the button renders as Blue's locked button with the last price, and the slip refuses the same way as any other card.
- Pace uses `M.mt` (book total when the book is live), so `dkPrice` prices Over at the book number.
- Milestone uses pass (8), rush (12) and receiving (13) yards from `S.props`; line is the milestone minus 0.5, modeled by Blue's propModel.

## Test (browser console, Live tab, game live)
1. `document.querySelectorAll('.story').length` is 3 to 5 and `getComputedStyle(document.querySelector('.stories')).flexShrink` is `"0"`.
2. `[...document.querySelectorAll('.story')].map(s=>s.querySelectorAll('button').length)` is all 1, and each button has `data-a="slip"`.
3. `act({a:'slip',k:document.querySelector('.story button.o').dataset.k});sheetMode` is `"slip"` (Blue's slip opens); then `closeSheet()`. For a drive card while locked: `timedGate(model()).open===false` and that button has class `off`.
