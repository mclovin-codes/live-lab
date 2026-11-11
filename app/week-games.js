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
const XNS=x=>String(x||'').replace(/^<svg(?![^>]*xmlns)/,'<svg xmlns="http://www.w3.org/2000/svg"');
function norm(league,e){const c=e.competitions&&e.competitions[0]||{},st=e.status||c.status||{},ty=st.type||{};const side=h=>{const x=(c.competitors||[]).find(k=>k.homeAway===h)||{},t=x.team||{};return{id:t.id,abbr:t.abbreviation||'',name:t.shortDisplayName||t.displayName||'',color:/^[0-9a-f]{6}$/i.test(t.color||'')?t.color:'',alt:/^[0-9a-f]{6}$/i.test(t.alternateColor||'')?t.alternateColor:'',logo:(()=>{try{return window.TeamMark&&TeamMark.svg?'data:image/svg+xml;utf8,'+encodeURIComponent(XNS(TeamMark.svg(league,{abbr:t.abbreviation||'',color:t.color,alt:t.alternateColor},64))):''}catch(e){return''}})(),score:x.score!=null?+x.score:null,record:x.records&&x.records[0]&&x.records[0].summary||'',leaders:(x.leaders||[]).filter(l=>['points','rebounds','assists','goals'].includes(l.name)).map(l=>{const a=(l.leaders||[])[0]||{},t=a.athlete||{};return{cat:l.name,id:t.id?String(t.id):'',name:t.shortName||t.displayName||'',jersey:t.jersey?String(t.jersey):'',pos:(t.position&&t.position.abbreviation)||'',value:+a.value}}).filter(x=>x.id&&x.value>0)}};
 const o=(c.odds||[])[0]||{},ml=o.moneyline||{};const hml=num(o.homeTeamOdds&&o.homeTeamOdds.moneyLine)??num(ml.home&&(ml.home.close||ml.home.open||{}).odds),aml=num(o.awayTeamOdds&&o.awayTeamOdds.moneyLine)??num(ml.away&&(ml.away.close||ml.away.open||{}).odds);
 /* where to watch, where it is played, and the weather (the founder's 12:43 and 12:50 AM notes). Plain names only. */
const bc=(()=>{const out=[];(c.broadcasts||[]).forEach(b=>(b.names||[]).forEach(n=>{n=String(n||'').replace(/[<>&"']/g,'').trim();if(n&&!out.includes(n))out.push(n)}));(c.geoBroadcasts||[]).forEach(b=>{const n=String((b.media&&b.media.shortName)||'').replace(/[<>&"']/g,'').trim();if(n&&!out.includes(n))out.push(n)});return out.slice(0,4)})();
const vn=c.venue||{},ad=vn.address||{},cl=x=>String(x||'').replace(/[<>&"']/g,'').trim();
const venue=vn.fullName?{name:cl(vn.fullName),city:cl(ad.city),state:cl(ad.state),indoor:vn.indoor===true}:null;
const wx=e.weather||c.weather||null;const weather=wx&&!(venue&&venue.indoor)?{temp:wx.temperature!=null?+wx.temperature:(wx.highTemperature!=null?+wx.highTemperature:null),text:cl(wx.displayValue||''),cond:wx.conditionId!=null?String(wx.conditionId):''}:null;
return{league,id:e.id,date:Date.parse(e.date),broadcasts:bc,venue,weather,state:ty.state||'pre',done:!!ty.completed,detail:ty.shortDetail||ty.detail||'',period:st.period||0,clock:st.displayClock||'',home:side('home'),away:side('away'),line:{details:o.details||'',ou:num(o.overUnder),spread:num(o.spread),hml,aml},broadcast:(c.broadcasts||[]).flatMap(b=>b.names||[]).join(', ')}}
/* live line: the scoreboard drops odds once a game starts. The book posts live odds at whistles and goes OFF while play runs,
   so the Board samples each live game's summary every 30 s and shows the book's last posted live line (kept per game in
   localStorage 'rw.lastLive' {h,a,ou,at}; game.html writes push values there with no src, and a REST sample never overwrites one
   under 5 minutes old), labelled last seen, since the summary runs minutes behind
   the push. No line until the book has posted one, and none while the book is OFF (locked, as on game.html); the Board never
   prices a game itself. */
const SP={nfl:1,nba:1,nhl:1};
/* the closing line from a game summary's pickcenter: used once a game has started and the scoreboard no longer carries its pregame line */
function closeLine(pc){if(!pc||!pc.moneyline)return null;const P=(o,...k)=>{let n=o;for(const x of k){if(n==null)return null;n=n[x]}return n},o=x=>{const v=num(x);return v!=null&&Math.abs(v)>=100?v:null};const h=o(P(pc.moneyline,'home','close','odds'))??o(P(pc,'homeTeamOdds','moneyLine')),a=o(P(pc.moneyline,'away','close','odds'))??o(P(pc,'awayTeamOdds','moneyLine'));if(h==null||a==null)return null;const t=P(pc.total,'over','close','line')??pc.overUnder,sp=P(pc.pointSpread,'home','close','line')??pc.spread;return{details:pc.details||'',hml:h,aml:a,spread:sp==null?null:num(String(sp)),ou:t==null?null:num(String(t).replace(/^[ou]/i,''))}}
function postedLine(pc){if(!pc||!pc.moneyline)return null;const P=(o,...k)=>{let n=o;for(const x of k){if(n==null)return null;n=n[x]}return n},o=x=>{const v=num(x);return v!=null&&Math.abs(v)>=100?v:null},h=o(P(pc.moneyline,'home','live','odds')),a=o(P(pc.moneyline,'away','live','odds'));
 if(h==null||a==null)return null;const t=P(pc.total,'over','live','line');return{h,a,ou:t==null?null:num(String(t).replace(/^[ou]/i,''))}}
function last(){try{return JSON.parse(localStorage.getItem('rw.lastLive')||'{}')||{}}catch(e){return{}}}
function keepLast(k,L){const m=last(),o=m[k];if(o&&o.at&&o.h===L.h&&o.a===L.a&&o.ou===L.ou)return;if(o&&!o.src&&Date.now()-o.at<5*60e3)return;L.at=Date.now();L.src='rest';m[k]=L;try{localStorage.setItem('rw.lastLive',JSON.stringify(m))}catch(e){}}
function dropLast(k){const m=last();if(!(k in m))return;delete m[k];try{localStorage.setItem('rw.lastLive',JSON.stringify(m))}catch(e){}}
function liveLine(g,L){if(!L||L.h==null||L.a==null)return null;const fav=L.h<=L.a?g.home:g.away;return{details:`${fav.abbr} ${L.h<=L.a?L.h:L.a}`,ou:L.ou,seen:+L.at||true}}
const AT={};
async function J(u){const r=await fetch(u);if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}
let cache=null,cacheAt=0;
async function load(force){if(!force&&cache&&Date.now()-cacheAt<15000)return cache;const w=week(),ds=days(w),jobs=[];
 jobs.push(J(`${SB}${LEAGUES.nfl.path}/scoreboard?week=${w.n}&seasontype=2`).then(d=>(d.events||[]).map(e=>norm('nfl',e))).catch(()=>[]));
 for(const lg of['nba','nhl'])for(const d of ds)jobs.push(J(`${SB}${LEAGUES[lg].path}/scoreboard?dates=${d}`).then(r=>(r.events||[]).map(e=>norm(lg,e))).catch(()=>[]));
 const all=(await Promise.all(jobs)).flat(),seen=new Set,games=[];for(const g of all){const k=g.league+g.id;if(seen.has(k))continue;seen.add(k);if(g.date>=w.start-6*36e5&&g.date<=w.end)games.push(g)}
 await Promise.all(games.filter(g=>g.state==='in'&&g.line.hml==null&&SP[g.league]).map(async g=>{const k=g.league+g.id;if(!AT[k]||Date.now()-AT[k]>30e3){AT[k]=Date.now();try{const r=await J(`${SB}${LEAGUES[g.league].path}/summary?event=${g.id}`),L=postedLine((r.pickcenter||[])[0]);if(L)keepLast(k,L);else dropLast(k)}catch(e){}}const L=liveLine(g,last()[k]);if(L)g.liveLine=L}));
 /* keep each game's pregame line after kickoff (the scoreboard drops it), so the Field's picks stay the same picks once revealed */
 try{const LN=JSON.parse(localStorage.getItem('rw.lines')||'{}'),has=L=>L&&(L.hml!=null||L.ou!=null||L.spread!=null),keep={};const LD=JSON.parse(localStorage.getItem('rw.leaders')||'{}'),keepL={};for(const g of games){const k=g.league+g.id;if(g.state==='pre'&&has(g.line))LN[k]=g.line;else if(!has(g.line)&&LN[k])g.line=LN[k];if(LN[k])keep[k]=LN[k];const ld=[...(g.away.leaders||[]).map(x=>({...x,team:'away'})),...(g.home.leaders||[]).map(x=>({...x,team:'home'}))];if(g.state==='pre'&&ld.length)LD[k]=ld;if(LD[k]){g.propsFrom=LD[k];keepL[k]=LD[k]}}try{localStorage.setItem('rw.leaders',JSON.stringify(keepL))}catch(e){}
  /* box scores for games gone final in the last 30 hours (prop grading), fetched once each */
  const BX=JSON.parse(localStorage.getItem('rw.box')||'{}');const needBox=games.filter(g=>g.done&&g.propsFrom&&!BX[g.league+g.id]&&Date.now()-g.date<30*36e5).slice(0,12);await Promise.all(needBox.map(async g=>{try{const r=await J(`${SB}${LEAGUES[g.league].path}/summary?event=${g.id}`);const box={};((r.boxscore&&r.boxscore.players)||[]).forEach(t=>(t.statistics||[]).forEach(gr=>(gr.athletes||[]).forEach(a=>{const id=a.athlete&&a.athlete.id;if(!id)return;const b=box[id]=box[id]||{};(gr.keys||gr.names||[]).forEach((kk,i)=>{const v=parseFloat(String((a.stats||[])[i]||'').split('-')[0]);if(!isNaN(v))b[kk]=v})})));BX[g.league+g.id]=box}catch(e){}}));try{localStorage.setItem('rw.box',JSON.stringify(BX))}catch(e){}
  /* a started game this phone never saw before kickoff: take its closing line from the summary, once */
  const miss=games.filter(g=>g.state!=='pre'&&!has(g.line)&&Date.now()-g.date<18*36e5).slice(0,20);await Promise.all(miss.map(async g=>{try{const r=await J(`${SB}${LEAGUES[g.league].path}/summary?event=${g.id}`),L=closeLine((r.pickcenter||[])[0]);if(L){g.line=L;keep[g.league+g.id]=L}}catch(e){}}));
  localStorage.setItem('rw.lines',JSON.stringify(keep))}catch(e){}
 games.sort((a,b)=>a.date-b.date);cache=games;cacheAt=Date.now();try{localStorage.setItem('rw.games',JSON.stringify({at:cacheAt,w:w.n,games}));localStorage.setItem('rw.live',JSON.stringify({n:games.filter(g=>g.state==='in').length,at:cacheAt}))}catch(e){}badge();return games}
let cRaw=null,cVal=null;function cached(){try{const raw=localStorage.getItem('rw.games');if(raw!==cRaw){cRaw=raw;const j=JSON.parse(raw||'null');cVal=j&&j.w===week().n?j.games:null}return cVal}catch(e){}return null}

/* ---------- the simulated Field: 30 players who pick every game of the week, graded on real finals ---------- */
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}h^=h>>>13;h=Math.imul(h,1597334677);return((h^(h>>>16))>>>0)/4294967296}
const FIELD=['Sharp Shelly','Parlay Pete','Tungsten Tina','Fade Master','Chalk Charlie','Degen Dan','Bearsfan Bri','12th Man Mo','Sweat Sam','Over Otto','Line Tracker','Clutch Kay','Fourth Quarter Fi','Red Zone Rae','Soldier Sal','Lumen Lou','Bad Beat Bo','Hedge Hattie','Halfpoint Hal','Monday Mike','Prop Paige','Backdoor Ben','Steam Chaser','Quiet Quinn','Buzzer Beater Bea','Power Play Pat','Rim Runner Rio','Five Hole Faye','Puck Line Pam','Dime Drop Dez'].map((n,i)=>({id:'f'+i,name:n,act:.25+hash(n+'a')*.55,unit:15+Math.round(hash(n+'u')*55),edge:(hash(n+'e')-.45)*.12}));
const toWin=(st,o)=>o>0?st*o/100:st*100/Math.abs(o);
function botPick(b,g){const k=b.id+'|'+g.league+g.id;if(hash(k)>b.act)return null;const L=g.line,m=hash(k+'m');let t,side,line=null,odds=-110;
 if(m<.4&&L.hml&&L.aml){t='ml';side=hash(k+'s')<.5+(L.hml<0?.12:-.12)?'home':'away';odds=side==='home'?L.hml:L.aml}
 else if(m<.75&&L.spread!=null){t='spread';side=hash(k+'s')<.5?'home':'away';line=side==='home'?L.spread:-L.spread}
 else if(L.ou!=null){t='total';side=hash(k+'s')<.55?'o':'u';line=L.ou}else if(g.state!=='pre'){t='ml';side=hash(k+'s')<.5?'home':'away';odds=-110}else return null;
 const stake=Math.round(b.unit*(.6+hash(k+'q')*1.2));return{t,side,line,odds,stake,g}}
function grade(p){const g=p.g;if(!g.done||g.home.score==null)return null;const H=g.home.score,A=g.away.score;let r;
 if(p.t==='ml'){if(H===A)r='push';else r=(p.side==='home')===(H>A)?'won':'lost'}
 else if(p.t==='spread'){const m=(p.side==='home'?H-A:A-H)+p.line;r=m===0?'push':m>0?'won':'lost'}
 else{const tot=H+A;r=tot===p.line?'push':(p.side==='o')===(tot>p.line)?'won':'lost'}
 return r}
let inField=false;
function field(games){const nested=inField;inField=true;try{return fieldRows(games,nested)}finally{inField=nested}}
/* ---------- Slips: every player's picks as real Slips (straights, player props, parlays of 2 to 5 legs) ----------
   Mix (COHORT-WEEK8.md, Weeks 5 to 8): about 48% parlays (325 of 678); the cohort has no prop share, so a third of
   straights are props. One shape for all: {id, kind, legs[], stake, odds, win, status, units}; each leg
   {league, gameId, g, game, start, market, label, line, odds, side, player?, stat?, status}. */
const STATK={points:'points',rebounds:'rebounds',assists:'assists',goals:'goals'};
function boxOf(g){try{return(JSON.parse(localStorage.getItem('rw.box')||'{}'))[g.league+g.id]||null}catch(e){return null}}
function legOf(b,g,salt){const k=b.id+'|'+g.league+g.id+'|'+salt,m=hash(k+'m'),gm=g.away.abbr+' at '+g.home.abbr,base={league:g.league,gameId:String(g.id),g,game:gm,start:g.date};
 const ld=g.propsFrom||[];if(ld.length&&m<.34){const p=ld[Math.floor(hash(k+'p')*ld.length)],over=hash(k+'o')<.72,line=(p.cat==='goals'||g.league==='nhl')?.5:Math.max(.5,Math.floor(p.value)+.5);
  return{...base,market:'prop',t:'prop',player:p.name,playerId:p.id,stat:p.cat,line,side:over?'over':'under',odds:p.cat==='goals'?(over?180:-240):g.league==='nhl'?(over?120:-150):(over?-115:-105),label:p.cat==='goals'?(p.name+(over?' to score':' no goal')):(p.name+' '+(over?'Over':'Under')+' '+line+' '+p.cat)}}
 const q=botPick({...b,act:2},g);if(!q)return null;const side=q.side==='o'?'over':q.side==='u'?'under':q.side;return{...base,market:q.t,t:q.t,side,line:q.line,odds:q.odds,label:pickLabel(q,g)}}
function legGrade(l){const g=l.g;if(!g||!g.done||g.home.score==null)return'open';if(l.market==='prop'){const bx=boxOf(g);if(!bx)return'open';const st=bx[l.playerId];const v=st?(+st[STATK[l.stat]]||0):0;if(l.stat==='goals')return(v>=1)===(l.side==='over')?'won':'lost';if(v===l.line)return'push';return(v>l.line)===(l.side==='over')?'won':'lost'}
 const r=grade({t:l.market,side:l.side==='over'?'o':l.side==='under'?'u':l.side,line:l.line,g});return r||'open'}
const decO=o=>o>0?1+o/100:1+100/Math.abs(o),amerD=d=>d>=2?Math.round((d-1)*100):Math.round(-100/(d-1));
function slipFrom(id,legs,stake,at){legs.forEach(l=>{l.status=legGrade(l)});const live=legs.filter(l=>l.status!=='push');const d=live.reduce((x,l)=>x*decO(l.odds),1),odds=live.length?amerD(d):100;
 let status='open';if(legs.some(l=>l.status==='lost'))status='lost';else if(legs.every(l=>l.status!=='open'))status=live.length?'won':'push';
 const win=Math.round(stake*d),kind=legs.length>1?'parlay':legs[0].market==='prop'?'prop':'straight',f=legs[0];
 const sl={id,kind,legs,stake,odds,win,status,at,units:status==='won'?(win-stake)/10:status==='lost'?-stake/10:status==='push'?0:null,
  league:f.league,gameId:f.gameId,g:f.g,game:legs.length>1?[...new Set(legs.map(l=>l.game))].join(' + '):f.game,market:legs.length>1?legs.length+'-leg parlay':(f.market==='prop'?'Player prop':marketName(f.market,f.league)),t:legs.length>1?'parlay':f.market,label:legs.length>1?legs.length+'-leg parlay':f.label};
 if(legs.length>1)sl.same=new Set(legs.map(l=>l.gameId)).size===1;return sl}
const SLIPM={};
function botSlips(b,games){const n=games.reduce((a,g)=>a+(g.done?1:0)+(g.state==='in'?1000:0)+(g.propsFrom?7:0)+(boxOf(g)?3:0),0)+'|'+games.length;if(SLIPM[b.id]&&SLIPM[b.id].n===n&&SLIPM[b.id].g===games)return SLIPM[b.id].v;
 const cand=games.filter(g=>hash(b.id+'|'+g.league+g.id)<b.act).sort((x,y)=>x.date-y.date),out=[];let i=0;
 while(i<cand.length){const g=cand[i],k=b.id+'|'+g.league+g.id,stake=Math.round(b.unit*(.6+hash(k+'q')*1.2));
  if(hash(k+'kind')<.5&&i+1<cand.length){const n2=2+Math.floor(hash(k+'n')*4),legs=[];let j=i;
   const sgp=hash(k+'sgp')<.35;if(sgp){for(const salt of ['a','c','d','e'].slice(0,Math.min(4,n2))){const l=legOf(b,g,salt);if(l&&!legs.some(x=>x.market===l.market&&(x.market!=='prop'||x.playerId===l.playerId)))legs.push(l)}j=i+1}
   while(!sgp&&legs.length<n2&&j<cand.length){const l=legOf(b,cand[j],'p');if(l&&!legs.some(x=>x.gameId===l.gameId&&x.market===l.market))legs.push(l);j++}
   if(legs.length>=2){out.push(slipFrom(b.id+'-'+k+'-par',legs,Math.max(5,Math.round(stake*.5)),Math.min(...legs.map(l=>l.start))-(1+hash(k+'t')*30)*36e5));i=Math.max(j,i+1);continue}}
  const l=legOf(b,g,'s');if(l)out.push(slipFrom(b.id+'-'+k,[l],stake,g.date-(1+hash(k+'t')*30)*36e5));i++}
 SLIPM[b.id]={n,g:games,v:out};return out}
let botMemo={g:null,n:-1,day:"",rows:null};
function botRows(games){const td=etDay(Date.now()),n=games.reduce((a,g)=>a+(g.done?1:0)+(g.state==="in"?1000:0),0);if(botMemo.g===games&&botMemo.n===n&&botMemo.day===td)return botMemo.rows.map(r=>({...r}));const rows=FIELD.map(b=>{let pl=0,w=0,l=0,open=0,today=0;for(const p of botSlips(b,games)){const r=p.status;if(r==='open'){open++;continue}if(r==='push')continue;const d=p.units*10;pl+=d;const last=Math.max(...p.legs.map(x=>x.start));if(etDay(last)===td)today+=d;r==='won'?w++:l++}
  return{id:b.id,name:b.name,units:pl/10,today:today/10,w,l,open,sim:true}});botMemo={g:games,n,day:td,rows};return rows.map(r=>({...r}))}
/* one bot's result on one game, the same rule the Field uses */
function botResult(b,g,p){let r=grade(p);if(r==='won'||r==='lost'){if(r==='lost'&&hash(b.id+g.id+'x')<Math.max(0,b.edge))r='won';if(r==='won'&&hash(b.id+g.id+'y')<Math.max(0,-b.edge))r='lost'}return r}
/* every pick a player has this week, unified: {league, gameId, g, market, t, side, line, odds, stake, label, status, units} */
const MKT={ml:'Moneyline',spread:'Spread',total:'Total'};
function marketName(t,league){if(t==='spread'&&league==='nhl')return'Puck line';if(t==='spread'&&league==='nba')return'Spread';return MKT[t]||t}
function pickLabel(p,g){const fl=x=>(x>0?'+':'')+x;if(!g)return p.label||'';if(p.t==='ml')return`${(p.side==='home'?g.home:g.away).abbr} to win`;if(p.t==='spread')return`${(p.side==='home'?g.home:g.away).abbr} ${fl(p.line)}`;if(p.t==='total')return`${p.side==='o'?'Over':'Under'} ${p.line}`;return p.label||''}
function playerPicks(id,games,cid){games=games||cached()||[];const out=[];
 if(id==='me'){const s=RS();if(!s||typeof s.picks!=='function')return out;let ps=[];if(cid&&cid!=='rush'&&s.wallet&&typeof s.wallet.picks==='function'){try{ps=s.wallet.picks(cid)||[]}catch(e){}}else{try{ps=s.picks({week:s.week().id})}catch(e){ps=s.picks()}}
  for(const p of ps){const g=games.find(x=>x.league===p.league&&String(x.id)===String(p.gameId));const k=p.spec&&p.spec.k||'';const sd=sp=>sp&&(sp.side==='o'?'over':sp.side==='u'?'under':sp.side);
   const legs=(p.legs&&p.legs.length?p.legs:[{league:p.league,gameId:p.gameId,game:p.game,spec:p.spec,label:p.label,odds:p.odds,st:p.status}]).map(x=>{const gg=games.find(y=>y.league===x.league&&String(y.id)===String(x.gameId));const sp=x.spec||{};return{league:x.league,gameId:String(x.gameId),g:gg,game:x.game,start:gg?gg.date:p.start,market:(sp.k==='prop'||sp.k==='pp')?'prop':(sp.k||k),label:x.label,line:sp.line,odds:x.odds,side:sd(sp),player:sp.name||sp.player,status:x.st||x.status||(p.legs?'open':p.status)}});
   out.push({id:p.id,kind:legs.length>1?'parlay':legs[0].market==='prop'?'prop':'straight',legs,league:p.league,gameId:p.gameId,g,game:p.game,market:p.legs?(p.legs.length+'-leg parlay'):(marketName(k,p.league)||k),t:k,label:p.label,odds:p.odds,stake:p.stake,win:p.win!=null?Math.round(p.stake+p.win):null,status:p.status,units:p.status==='open'?null:((p.pay||0)-p.stake)/10,at:p.at,live:!!p.live,raw:p,me:true})}return out}
 const b=FIELD.find(x=>x.id===id);if(!b)return null;
 return botSlips(b,games).slice()
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
/* THE weather impact rule, in one place (printed in SUMMARY.md). Facts only, never a lean.
   Wind 20 mph or more, or gusts 30 or more: High. Wind 15 or more: Moderate.
   Heavy rain, snow or storms: High. Steady rain or showers: Moderate.
   25 F or colder, or 90 F or hotter: one step up from None to Low. Indoor: no weather, no grade. */
function wxGrade(w,indoor){if(indoor||!w)return null;const R=['None','Low','Moderate','High'];let g=0;const f=[];const t=w.temp,wd=+w.wind||0,gu=+w.gust||0,tx=String(w.text||'').toLowerCase(),pp=+w.precip||0;
 if(wd>=20||gu>=30){g=3;f.push('wind '+Math.round(wd)+' mph'+(gu?', gusts '+Math.round(gu):''))}else if(wd>=15){g=Math.max(g,2);f.push('wind '+Math.round(wd)+' mph')}
 if(/heavy|snow|storm|thunder|sleet/.test(tx)){g=3;f.push(tx)}else if(/rain|shower|drizzle/.test(tx)||pp>=60){g=Math.max(g,2);f.push(tx||pp+'% rain')}
 if(t!=null&&(t<=25||t>=90)){if(g===0)g=1;f.push(Math.round(t)+'°F')}
 return{grade:R[g],facts:f.slice(0,2)}}
window.RW={wxGrade,playerPicks,marketName,FIELD,norm,LEAGUES,week,days,load,cached,field,season,me,opponent,etDay,hash,liveCount,badge,mountStrip,stripHTML,STRIP_CSS};
})();
