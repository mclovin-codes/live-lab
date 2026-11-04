/* Team Red: this week's games across NFL, NBA and NHL from ESPN scoreboards, plus the simulated Field that plays them all week.
   Used by board.html and ranks.html. No keys, browser fetch only.
   API: RW.week() -> {n,start,end}; RW.load(force) -> Promise<games[]>; RW.field(games) -> {rows, me}; RW.season(games) -> rows; RW.me() -> your week. */
(function(){
'use strict';
const SB='https://site.api.espn.com/apis/site/v2/sports/';
const LEAGUES={nfl:{path:'football/nfl',name:'NFL'},nba:{path:'basketball/nba',name:'NBA'},nhl:{path:'hockey/nhl',name:'NHL'}};
const ET='America/New_York';
const ETF=new Intl.DateTimeFormat('en-CA',{timeZone:ET,year:'numeric',month:'2-digit',day:'2-digit'});const etDay=ms=>ETF.format(new Date(ms)).replace(/-/g,'');
const RS=()=>window.RushState||window.Rush||null;

/* The contest week: Tuesday to the end of Monday Night Football. Week 9 opens Tue 2026-11-03. */
function week(){const s=RS();try{if(s&&s.week){const w=typeof s.week==='function'?s.week():s.week;if(w&&w.n&&(w.start||w.opens))return{n:w.n,start:+new Date(w.start||w.opens),end:+new Date(w.end||w.settles||(+new Date(w.opens)+7*864e5))}}}catch(e){}
 const W9=Date.parse('2026-11-03T05:00:00Z');const n=9+Math.max(0,Math.floor((Date.now()-W9)/(7*864e5)));const start=W9+(n-9)*7*864e5;return{n,start,end:start+7*864e5+6*36e5}}
function days(w){const out=[];for(let t=w.start+3*36e5;t<w.end;t+=864e5)out.push(etDay(t));return[...new Set(out)]}

const num=x=>{if(x==null||x==='')return null;const t=String(x).toUpperCase();if(t==='EVEN'||t==='EV')return 100;const n=parseFloat(t.replace(/[^0-9.+-]/g,''));return isFinite(n)?n:null};
function norm(league,e){const c=e.competitions&&e.competitions[0]||{},st=e.status||c.status||{},ty=st.type||{};const side=h=>{const x=(c.competitors||[]).find(k=>k.homeAway===h)||{},t=x.team||{};return{id:t.id,abbr:t.abbreviation||'',name:t.shortDisplayName||t.displayName||'',logo:t.logo||(t.abbreviation?`https://a.espncdn.com/i/teamlogos/${league}/500/${t.abbreviation.toLowerCase()}.png`:''),score:x.score!=null?+x.score:null,record:x.records&&x.records[0]&&x.records[0].summary||''}};
 const o=(c.odds||[])[0]||{},ml=o.moneyline||{};const hml=num(o.homeTeamOdds&&o.homeTeamOdds.moneyLine)??num(ml.home&&(ml.home.close||ml.home.open||{}).odds),aml=num(o.awayTeamOdds&&o.awayTeamOdds.moneyLine)??num(ml.away&&(ml.away.close||ml.away.open||{}).odds);
 return{league,id:e.id,date:Date.parse(e.date),state:ty.state||'pre',done:!!ty.completed,detail:ty.shortDetail||ty.detail||'',period:st.period||0,clock:st.displayClock||'',home:side('home'),away:side('away'),line:{details:o.details||'',ou:num(o.overUnder),spread:num(o.spread),hml,aml},broadcast:(c.broadcasts||[]).flatMap(b=>b.names||[]).join(', ')}}
/* live line: the scoreboard drops odds once a game starts. The book posts live odds at whistles and goes OFF while play runs,
   so the Board samples each live game's summary every 30 s and shows the book's last posted live line (kept per game).
   No line until the book has posted one; the Board never prices a game itself. */
const SP={nfl:1,nba:1,nhl:1};
function postedLine(pc){if(!pc||!pc.moneyline)return null;const P=(o,...k)=>{let n=o;for(const x of k){if(n==null)return null;n=n[x]}return n},o=x=>{const v=num(x);return v!=null&&Math.abs(v)>=100?v:null},h=o(P(pc.moneyline,'home','live','odds')),a=o(P(pc.moneyline,'away','live','odds'));
 if(h==null||a==null)return null;const t=P(pc.total,'over','live','line');return{h,a,ou:t==null?null:num(String(t).replace(/^[ou]/i,''))}}
let LAST=null;function last(){if(!LAST){try{LAST=JSON.parse(localStorage.getItem('rw.lastLive')||'{}')||{}}catch(e){LAST={}}}return LAST}
function keepLast(k,L){const m=last();m[k]=L;try{localStorage.setItem('rw.lastLive',JSON.stringify(m))}catch(e){}}
function liveLine(g,L){if(!L)return null;const fav=L.h<=L.a?g.home:g.away;return{details:`${fav.abbr} ${L.h<=L.a?L.h:L.a}`,ou:L.ou}}
const AT={};
async function J(u){const r=await fetch(u);if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}
let cache=null,cacheAt=0;
async function load(force){if(!force&&cache&&Date.now()-cacheAt<15000)return cache;const w=week(),ds=days(w),jobs=[];
 jobs.push(J(`${SB}${LEAGUES.nfl.path}/scoreboard?week=${w.n}&seasontype=2`).then(d=>(d.events||[]).map(e=>norm('nfl',e))).catch(()=>[]));
 for(const lg of['nba','nhl'])for(const d of ds)jobs.push(J(`${SB}${LEAGUES[lg].path}/scoreboard?dates=${d}`).then(r=>(r.events||[]).map(e=>norm(lg,e))).catch(()=>[]));
 const all=(await Promise.all(jobs)).flat(),seen=new Set,games=[];for(const g of all){const k=g.league+g.id;if(seen.has(k))continue;seen.add(k);if(g.date>=w.start-6*36e5&&g.date<=w.end)games.push(g)}
 await Promise.all(games.filter(g=>g.state==='in'&&g.line.hml==null&&SP[g.league]).map(async g=>{const k=g.league+g.id;if(!AT[k]||Date.now()-AT[k]>30e3){AT[k]=Date.now();try{const r=await J(`${SB}${LEAGUES[g.league].path}/summary?event=${g.id}`),L=postedLine((r.pickcenter||[])[0]);if(L)keepLast(k,L)}catch(e){}}const L=liveLine(g,last()[k]);if(L)g.liveLine=L}));
 games.sort((a,b)=>a.date-b.date);cache=games;cacheAt=Date.now();try{localStorage.setItem('rw.games',JSON.stringify({at:cacheAt,w:w.n,games}));localStorage.setItem('rw.live',JSON.stringify({n:games.filter(g=>g.state==='in').length,at:cacheAt}))}catch(e){}badge();return games}
let cRaw=null,cVal=null;function cached(){try{const raw=localStorage.getItem('rw.games');if(raw!==cRaw){cRaw=raw;const j=JSON.parse(raw||'null');cVal=j&&j.w===week().n?j.games:null}return cVal}catch(e){}return null}

/* ---------- the simulated Field: 30 players who pick every game of the week, graded on real finals ---------- */
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}h^=h>>>13;h=Math.imul(h,1597334677);return((h^(h>>>16))>>>0)/4294967296}
const FIELD=['Sharp Shelly','Parlay Pete','Tungsten Tina','Fade Master','Chalk Charlie','Degen Dan','Bearsfan Bri','12th Man Mo','Sweat Sam','Over Otto','Unit Tracker','Clutch Kay','Fourth Quarter Fi','Red Zone Rae','Soldier Sal','Lumen Lou','Bad Beat Bo','Hedge Hattie','Halfpoint Hal','Monday Mike','Prop Paige','Backdoor Ben','Steam Chaser','Quiet Quinn','Buzzer Beater Bea','Power Play Pat','Rim Runner Rio','Five Hole Faye','Puck Line Pam','Dime Drop Dez'].map((n,i)=>({id:'f'+i,name:n,act:.25+hash(n+'a')*.55,unit:15+Math.round(hash(n+'u')*55),edge:(hash(n+'e')-.45)*.12}));
const toWin=(st,o)=>o>0?st*o/100:st*100/Math.abs(o);
function botPick(b,g){const k=b.id+'|'+g.league+g.id;if(hash(k)>b.act)return null;const L=g.line,m=hash(k+'m');let t,side,line=null,odds=-110;
 if(m<.4&&L.hml&&L.aml){t='ml';side=hash(k+'s')<.5+(L.hml<0?.12:-.12)?'home':'away';odds=side==='home'?L.hml:L.aml}
 else if(m<.75&&L.spread!=null){t='spread';side=hash(k+'s')<.5?'home':'away';line=side==='home'?L.spread:-L.spread}
 else if(L.ou!=null){t='total';side=hash(k+'s')<.55?'o':'u';line=L.ou}else return null;
 const stake=Math.round(b.unit*(.6+hash(k+'q')*1.2));return{t,side,line,odds,stake,g}}
function grade(p){const g=p.g;if(!g.done||g.home.score==null)return null;const H=g.home.score,A=g.away.score;let r;
 if(p.t==='ml'){if(H===A)r='push';else r=(p.side==='home')===(H>A)?'won':'lost'}
 else if(p.t==='spread'){const m=(p.side==='home'?H-A:A-H)+p.line;r=m===0?'push':m>0?'won':'lost'}
 else{const tot=H+A;r=tot===p.line?'push':(p.side==='o')===(tot>p.line)?'won':'lost'}
 return r}
let inField=false;
function field(games){const nested=inField;inField=true;try{return fieldRows(games,nested)}finally{inField=nested}}
let botMemo={g:null,n:-1,day:"",rows:null};
function botRows(games){const td=etDay(Date.now()),n=games.reduce((a,g)=>a+(g.done?1:0)+(g.state==="in"?1000:0),0);if(botMemo.g===games&&botMemo.n===n&&botMemo.day===td)return botMemo.rows.map(r=>({...r}));const rows=FIELD.map(b=>{let pl=0,w=0,l=0,open=0,today=0;for(const g of games){const p=botPick(b,g);if(!p)continue;const r=botResult(b,g,p);/* botResult carries the seeded skill edge */
   if(!r){open++;continue}if(r==='push')continue;const d=r==='won'?toWin(p.stake,p.odds):-p.stake;pl+=d;if(etDay(g.date)===td)today+=d;r==='won'?w++:l++}
  return{id:b.id,name:b.name,units:pl/10,today:today/10,w,l,open,sim:true}});botMemo={g:games,n,day:td,rows};return rows.map(r=>({...r}))}
/* one bot's result on one game, the same rule the Field uses */
function botResult(b,g,p){let r=grade(p);if(r==='won'||r==='lost'){if(r==='lost'&&hash(b.id+g.id+'x')<Math.max(0,b.edge))r='won';if(r==='won'&&hash(b.id+g.id+'y')<Math.max(0,-b.edge))r='lost'}return r}
/* every pick a player has this week, unified: {league, gameId, g, market, t, side, line, odds, stake, label, status, units} */
const MKT={ml:'Moneyline',spread:'Spread',total:'Total'};
function marketName(t,league){if(t==='spread'&&league==='nhl')return'Puck line';if(t==='spread'&&league==='nba')return'Spread';return MKT[t]||t}
function pickLabel(p,g){const fl=x=>(x>0?'+':'')+x;if(!g)return p.label||'';if(p.t==='ml')return`${(p.side==='home'?g.home:g.away).abbr} to win`;if(p.t==='spread')return`${(p.side==='home'?g.home:g.away).abbr} ${fl(p.line)}`;if(p.t==='total')return`${p.side==='o'?'Over':'Under'} ${p.line}`;return p.label||''}
function playerPicks(id,games,cid){games=games||cached()||[];const out=[];
 if(id==='me'){const s=RS();if(!s||typeof s.picks!=='function')return out;let ps=[];if(cid&&cid!=='rush'&&s.wallet&&typeof s.wallet.picks==='function'){try{ps=s.wallet.picks(cid)||[]}catch(e){}}else{try{ps=s.picks({week:s.week().id})}catch(e){ps=s.picks()}}
  for(const p of ps){const g=games.find(x=>x.league===p.league&&String(x.id)===String(p.gameId));const k=p.spec&&p.spec.k||'';out.push({league:p.league,gameId:p.gameId,g,game:p.game,market:p.legs?`${p.legs.length}-leg parlay`:marketName(k,p.league)||k,t:k,label:p.label,odds:p.odds,stake:p.stake,status:p.status,units:p.status==='open'?null:((p.pay||0)-p.stake)/10,at:p.at,live:!!p.live,raw:p})}return out}
 const b=FIELD.find(x=>x.id===id);if(!b)return null;
 for(const g of games){const p=botPick(b,g);if(!p)continue;const r=botResult(b,g,p);out.push({league:g.league,gameId:g.id,g,game:`${g.away.abbr} at ${g.home.abbr}`,market:marketName(p.t,g.league),t:p.t,label:pickLabel(p,g),odds:p.odds,stake:p.stake,status:r||'open',units:r==='won'?toWin(p.stake,p.odds)/10:r==='lost'?-p.stake/10:r==='push'?0:null,at:g.date})}
 return out}
function fieldRows(games,nested){const rows=botRows(games);
 if(nested){rows.sort((a,b)=>b.units-a.units);return rows}/* called from the shared store while it builds its own Field: bots only, no me(), or the two would recurse */
 const m=me();rows.push({id:'me',name:m.name,units:m.units,today:m.today||0,w:m.w,l:m.l,open:m.open,me:true});rows.sort((a,b)=>b.units-a.units||(a.me?-1:b.me?1:0));rows.forEach(r=>r.rank=1+rows.filter(x=>x.units>r.units+1e-9).length);return rows}

/* ---------- season: weeks 1 to 8 already played, then this week live ---------- */
function season(rows){const n=week().n;return rows.map(r=>{let w=0,l=0;const hist=[];if(r.sim){for(let k=1;k<n;k++){const res=hash(r.id+'wk'+k);if(res<.12){hist.push('-');continue}const won=res<.12+.88*(.46+(FIELD.find(f=>f.id===r.id).edge));won?w++:l++;hist.push(won?'W':'L')}}else{const s=mySeason();w=s.w;l=s.l;hist.push(...s.hist)}
  return{...r,sw:w,sl:l,hist,live:r.units>0?'up':r.units<0?'down':'even'}}).sort((a,b)=>b.sw-a.sw||a.sl-b.sl||b.units-a.units)}

/* ---------- you: read from the shared store when it exists ---------- */
function me(){const s=RS();try{if(s&&typeof s.me==='function'){const m=s.me();return{name:m.handle||'You',units:m.units||0,stack:m.stack,entered:m.entered,w:0,l:0,open:m.open||0,today:0}}}catch(e){}let out={name:'You',units:0,w:0,l:0,open:0,entered:false,stack:1000};try{if(s){const g=(k,...a)=>typeof s[k]==='function'?s[k](...a):s[k];const st=g('state')||g('get')||{};const stack=g('stack')??st.stack??st.cash;const units=g('units')??(stack!=null?(stack-1000)/10:null);const bets=g('slip')||st.slip||st.bets||[];
  out={name:(g('handle')||st.handle||'You'),units:units??0,stack:stack??1000,entered:!!(g('entered')??st.entered),w:bets.filter(b=>b.status==='won').length,l:bets.filter(b=>b.status==='lost').length,open:bets.filter(b=>b.status==='open').length,today:0}}}catch(e){}return out}
function mySeason(){const s=RS();try{if(s){const r=typeof s.season==='function'?s.season():s.season;if(r)return{w:r.w||r.wins||0,l:r.l||r.losses||0,hist:r.hist||r.weeks||[]}}}catch(e){}return{w:0,l:0,hist:[]}}
function opponent(rows){const mine=rows.find(r=>r.me);let best=null;for(const r of rows){if(r.me)continue;if(!best||Math.abs(r.units-mine.units)<Math.abs(best.units-mine.units))best=r}const k='rw.opp.'+week().n;try{const v=localStorage.getItem(k);if(v){const f=rows.find(r=>r.id===v);if(f)return f}if(best)localStorage.setItem(k,best.id)}catch(e){}return best}

/* ---------- live count for the Board tab badge; shared/nav.js draws its own from localStorage 'rw.live' {n, at}, this one only fills in when it does not ---------- */
function liveCount(){try{const j=JSON.parse(localStorage.getItem('rw.live')||'null');if(j&&Date.now()-j.at<5*60e3)return j.n}catch(e){}return 0}
let badgeObs=null;function badge(){const nav=document.getElementById('rnav');if(!nav)return;const paint=()=>{const a=nav.querySelector('a[href="board.html"]');if(!a)return;let em=a.querySelector('em.rw-live');const own=[...a.querySelectorAll('em')].some(e=>e!==em);const n=own?0:liveCount();if(!n){if(em)em.remove();return}if(!em){em=document.createElement('em');em.className='rw-live';a.appendChild(em)}if(em.textContent!==String(n))em.textContent=String(n)};paint();if(!badgeObs){badgeObs=new MutationObserver(()=>{badgeObs.disconnect();paint();badgeObs.observe(nav,{childList:true,subtree:true})});badgeObs.observe(nav,{childList:true,subtree:true})}}
setTimeout(badge,400);setTimeout(badge,1500);

/* ---------- strip of other games, for the top of game.html and the Board.
   RW.mountStrip(el, league, id): fills el with live games first, then today's next games; the current game is outlined; refreshes itself. ---------- */
const STRIP_CSS=`.rw-strip{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;scroll-snap-type:x mandatory;padding:2px 0 10px}.rw-strip::-webkit-scrollbar{display:none}
.rw-pill{flex:none;scroll-snap-align:start;display:grid;grid-template-columns:24px auto auto auto 24px;align-items:center;gap:7px;padding:7px 11px;border-radius:99px;background:#1A2530;color:#fff;text-decoration:none;font:600 14px/1 -apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;font-variant-numeric:tabular-nums;box-shadow:inset 0 0 0 1px rgba(255,255,255,.06)}
.rw-pill img{width:24px;height:24px;object-fit:contain}.rw-pill .c{display:flex;flex-direction:column;align-items:center;gap:2px;font:600 11px/1.05 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;color:#9AA8B6;min-width:38px;text-align:center}.rw-pill .c.live{color:#FF8A8A}
.rw-pill.cur{box-shadow:inset 0 0 0 2px #00BFFF}.rw-pill .s{min-width:16px;text-align:center}
.rw-lab{flex:none;align-self:center;font:600 12px -apple-system,BlinkMacSystemFont,system-ui,sans-serif;color:#9AA8B6;padding:0 2px 0 6px;white-space:nowrap}.rw-lab:first-child{padding-left:0}
em.rw-live{position:absolute;top:3px;left:calc(50% + 7px);font:700 10.5px/16px -apple-system,system-ui,sans-serif;font-style:normal;min-width:17px;height:17px;padding:0 5px;border-radius:9px;background:#D95151;color:#fff;text-align:center}`;
function stripHTML(games,league,id){const now=Date.now(),td=etDay(now);const live=games.filter(g=>g.state==='in'),next=games.filter(g=>g.state==='pre'&&etDay(g.date)===td),rest=games.filter(g=>g.state==='pre'&&etDay(g.date)!==td).slice(0,6);const lab=(t)=>`<span class="rw-lab">${t}</span>`;const esc=x=>String(x==null?'':x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const t=ms=>new Intl.DateTimeFormat('en-US',{timeZone:ET,hour:'numeric',minute:'2-digit'}).format(new Date(ms));
 const pill=g=>{const lv=g.state==='in',cl=lv?(g.clock&&g.period?`<span>${esc(g.clock)}</span><span>${esc(g.detail.replace(/^.*-\s*/,''))}</span>`:`<span>${esc(g.detail)}</span>`):`<span>${esc(t(g.date))}</span><span>${esc(LEAGUES[g.league].name)}</span>`;return`<a class="rw-pill${g.league===league&&String(g.id)===String(id)?' cur':''}" href="game.html?league=${g.league}&id=${esc(g.id)}"><img src="${esc(g.away.logo)}" alt="${esc(g.away.abbr)}" width="24" height="24"><span class="s">${lv?esc(g.away.score):''}</span><span class="c${lv?' live':''}">${cl}</span><span class="s">${lv?esc(g.home.score):''}</span><img src="${esc(g.home.logo)}" alt="${esc(g.home.abbr)}" width="24" height="24"></a>`};
 let h='';if(live.length)h+=lab('Live')+live.slice(0,12).map(pill).join('');if(next.length)h+=lab('Today')+next.slice(0,12).map(pill).join('');if(rest.length)h+=lab('Next up')+rest.map(pill).join('');return h}
function mountStrip(el,league,id){if(!el)return;if(!document.getElementById('rw-strip-css')){const st=document.createElement('style');st.id='rw-strip-css';st.textContent=STRIP_CSS;document.head.appendChild(st)}el.classList.add('rw-strip');const paint=gs=>{const h=stripHTML(gs||[],league,id);if(el._h!==h){el.innerHTML=h;el._h=h;const c=el.querySelector('.cur');if(c&&!el._scrolled){el._scrolled=1;el.scrollLeft=Math.max(0,c.offsetLeft-16)}}el.hidden=!h};paint(cached());const tick=()=>load().then(paint).catch(()=>{}).finally(()=>setTimeout(tick,(cache||[]).some(g=>g.state==='in')?20000:60000));tick()}
window.RW={playerPicks,marketName,FIELD,norm,LEAGUES,week,days,load,cached,field,season,me,opponent,etDay,hash,liveCount,badge,mountStrip,stripHTML,STRIP_CSS};
})();
