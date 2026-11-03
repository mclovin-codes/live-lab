/* Team Red: this week's games across NFL, NBA and NHL from ESPN scoreboards, plus the simulated Field that plays them all week.
   Used by board.html and ranks.html. No keys, browser fetch only.
   API: RW.week() -> {n,start,end}; RW.load(force) -> Promise<games[]>; RW.field(games) -> {rows, me}; RW.season(games) -> rows; RW.me() -> your week. */
(function(){
'use strict';
const SB='https://site.api.espn.com/apis/site/v2/sports/';
const LEAGUES={nfl:{path:'football/nfl',name:'NFL'},nba:{path:'basketball/nba',name:'NBA'},nhl:{path:'hockey/nhl',name:'NHL'}};
const ET='America/New_York';
const etDay=ms=>new Intl.DateTimeFormat('en-CA',{timeZone:ET,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(ms)).replace(/-/g,'');
const RS=()=>window.RushState||window.Rush||null;

/* The contest week: Tuesday to the end of Monday Night Football. Week 9 opens Tue 2026-11-03. */
function week(){const s=RS();try{if(s&&s.week){const w=typeof s.week==='function'?s.week():s.week;if(w&&w.n&&w.start)return{n:w.n,start:+new Date(w.start),end:+new Date(w.end)}}}catch(e){}
 const W9=Date.parse('2026-11-03T05:00:00Z');const n=9+Math.max(0,Math.floor((Date.now()-W9)/(7*864e5)));const start=W9+(n-9)*7*864e5;return{n,start,end:start+7*864e5+6*36e5}}
function days(w){const out=[];for(let t=w.start+3*36e5;t<w.end;t+=864e5)out.push(etDay(t));return[...new Set(out)]}

const num=x=>{if(x==null||x==='')return null;const t=String(x).toUpperCase();if(t==='EVEN'||t==='EV')return 100;const n=parseFloat(t.replace(/[^0-9.+-]/g,''));return isFinite(n)?n:null};
function norm(league,e){const c=e.competitions&&e.competitions[0]||{},st=e.status||c.status||{},ty=st.type||{};const side=h=>{const x=(c.competitors||[]).find(k=>k.homeAway===h)||{},t=x.team||{};return{id:t.id,abbr:t.abbreviation||'',name:t.shortDisplayName||t.displayName||'',logo:t.logo||(t.abbreviation?`https://a.espncdn.com/i/teamlogos/${league}/500/${t.abbreviation.toLowerCase()}.png`:''),score:x.score!=null?+x.score:null,record:x.records&&x.records[0]&&x.records[0].summary||''}};
 const o=(c.odds||[])[0]||{},ml=o.moneyline||{};const hml=num(o.homeTeamOdds&&o.homeTeamOdds.moneyLine)??num(ml.home&&(ml.home.close||ml.home.open||{}).odds),aml=num(o.awayTeamOdds&&o.awayTeamOdds.moneyLine)??num(ml.away&&(ml.away.close||ml.away.open||{}).odds);
 return{league,id:e.id,date:Date.parse(e.date),state:ty.state||'pre',done:!!ty.completed,detail:ty.shortDetail||ty.detail||'',period:st.period||0,clock:st.displayClock||'',home:side('home'),away:side('away'),line:{details:o.details||'',ou:num(o.overUnder),spread:num(o.spread),hml,aml},broadcast:(c.broadcasts||[]).flatMap(b=>b.names||[]).join(', ')}}
async function J(u){const r=await fetch(u);if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}
let cache=null,cacheAt=0;
async function load(force){if(!force&&cache&&Date.now()-cacheAt<15000)return cache;const w=week(),ds=days(w),jobs=[];
 jobs.push(J(`${SB}${LEAGUES.nfl.path}/scoreboard?week=${w.n}&seasontype=2`).then(d=>(d.events||[]).map(e=>norm('nfl',e))).catch(()=>[]));
 for(const lg of['nba','nhl'])for(const d of ds)jobs.push(J(`${SB}${LEAGUES[lg].path}/scoreboard?dates=${d}`).then(r=>(r.events||[]).map(e=>norm(lg,e))).catch(()=>[]));
 const all=(await Promise.all(jobs)).flat(),seen=new Set,games=[];for(const g of all){const k=g.league+g.id;if(seen.has(k))continue;seen.add(k);if(g.date>=w.start-6*36e5&&g.date<=w.end)games.push(g)}
 games.sort((a,b)=>a.date-b.date);cache=games;cacheAt=Date.now();try{localStorage.setItem('rw.games',JSON.stringify({at:cacheAt,w:w.n,games}))}catch(e){}return games}
function cached(){try{const j=JSON.parse(localStorage.getItem('rw.games')||'null');if(j&&j.w===week().n)return j.games}catch(e){}return null}

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
function field(games){const rows=FIELD.map(b=>{let pl=0,w=0,l=0,open=0,today=0;const td=etDay(Date.now());for(const g of games){const p=botPick(b,g);if(!p)continue;let r=grade(p);if(r==='won'||r==='lost'){/* a small, seeded skill edge: sharper players flip a few losses */if(r==='lost'&&hash(b.id+g.id+'x')<Math.max(0,b.edge))r='won';if(r==='won'&&hash(b.id+g.id+'y')<Math.max(0,-b.edge))r='lost'}
   if(!r){open++;continue}if(r==='push')continue;const d=r==='won'?toWin(p.stake,p.odds):-p.stake;pl+=d;if(etDay(g.date)===td)today+=d;r==='won'?w++:l++}
  return{id:b.id,name:b.name,units:pl/10,today:today/10,w,l,open,sim:true}});
 const m=me();rows.push({id:'me',name:m.name,units:m.units,today:m.today||0,w:m.w,l:m.l,open:m.open,me:true});rows.sort((a,b)=>b.units-a.units||(a.me?-1:b.me?1:0));rows.forEach(r=>r.rank=1+rows.filter(x=>x.units>r.units+1e-9).length);return rows}

/* ---------- season: weeks 1 to 8 already played, then this week live ---------- */
function season(rows){const n=week().n;return rows.map(r=>{let w=0,l=0;const hist=[];if(r.sim){for(let k=1;k<n;k++){const res=hash(r.id+'wk'+k);if(res<.12){hist.push('-');continue}const won=res<.12+.88*(.46+(FIELD.find(f=>f.id===r.id).edge));won?w++:l++;hist.push(won?'W':'L')}}else{const s=mySeason();w=s.w;l=s.l;hist.push(...s.hist)}
  return{...r,sw:w,sl:l,hist,live:r.units>0?'up':r.units<0?'down':'even'}}).sort((a,b)=>b.sw-a.sw||a.sl-b.sl||b.units-a.units)}

/* ---------- you: read from the shared store when it exists ---------- */
function me(){const s=RS();let out={name:'You',units:0,w:0,l:0,open:0,entered:false,stack:1000};try{if(s){const g=(k,...a)=>typeof s[k]==='function'?s[k](...a):s[k];const st=g('state')||g('get')||{};const stack=g('stack')??st.stack??st.cash;const units=g('units')??(stack!=null?(stack-1000)/10:null);const bets=g('slip')||st.slip||st.bets||[];
  out={name:(g('handle')||st.handle||'You'),units:units??0,stack:stack??1000,entered:!!(g('entered')??st.entered),w:bets.filter(b=>b.status==='won').length,l:bets.filter(b=>b.status==='lost').length,open:bets.filter(b=>b.status==='open').length,today:0}}}catch(e){}return out}
function mySeason(){const s=RS();try{if(s){const r=typeof s.season==='function'?s.season():s.season;if(r)return{w:r.w||r.wins||0,l:r.l||r.losses||0,hist:r.hist||r.weeks||[]}}}catch(e){}return{w:0,l:0,hist:[]}}
function opponent(rows){const mine=rows.find(r=>r.me);let best=null;for(const r of rows){if(r.me)continue;if(!best||Math.abs(r.units-mine.units)<Math.abs(best.units-mine.units))best=r}const k='rw.opp.'+week().n;try{const v=localStorage.getItem(k);if(v){const f=rows.find(r=>r.id===v);if(f)return f}if(best)localStorage.setItem(k,best.id)}catch(e){}return best}

window.RW={LEAGUES,week,days,load,cached,field,season,me,opponent,etDay,hash};
})();
