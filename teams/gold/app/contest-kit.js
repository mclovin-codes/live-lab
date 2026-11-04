/* Team Red: contests and commissioner mode for app/contests.html and app/contest.html.
   Uses Blue's contest store (Rush.contests) when shared/state.js provides it; until then keeps contests in localStorage 'rush-contests-v1'.
   Settings travel inside the invite link (contest.html?i=...), so a friend's phone opens the contest with no backend.
   API: RC.list(), RC.get(id), RC.create(cfg), RC.update(id, patch), RC.join(cfgOrId), RC.leave(id), RC.inviteLink(id), RC.decode(s),
        RC.removeEntrant(id, entrantId), RC.voidPick(id, pickKey, reason), RC.close(id), RC.archive(id), RC.standings(c), RC.results(c), RC.publicList(). */
(function(){
'use strict';
const KEY='rush-contests-v1';
const B=()=>window.Rush&&window.Rush.contests&&typeof window.Rush.contests.list==='function'?window.Rush.contests:null;
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{"c":{}}')}catch(e){return{c:{}}}};
const save=s=>{try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){}subs.forEach(f=>{try{f()}catch(e){}})};
const subs=[];
const rid=()=>Date.now().toString(36)+Math.floor(Math.random()*1e6).toString(36);
const codeOf=id=>{let h=0;for(const ch of id)h=(h*31+ch.charCodeAt(0))>>>0;const A='ABCDEFGHJKMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<6;i++){s+=A[h%A.length];h=Math.floor(h/A.length)+i*7919}return s};
const b64=o=>btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const unb64=s=>JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g,'+').replace(/_/g,'/')))));

const DEFAULT_RULES={stack:1000,markets:{lines:true,props:true,parlays:true,live:true},reload:true,scoring:'units',ties:'split'};
function weekDays(){const w=RW.week();return RW.days(w)}
/* Any contest from a link or from storage is untrusted: rebuild it from a fixed schema, coerce every field, drop unknown keys. */
const LG=['nfl','nba','nhl'],VIS=['public','private'],SC=['units','record'],TI=['split','units'],ST=['open','closed','archived'],INJ=['none','h1','full'],JF=['note'],HV=['commish','contest'];
const odds=x=>{if(x==null||x==='')return null;const v=Math.round(+String(x).replace(/[^0-9+-]/g,''));return isFinite(v)&&Math.abs(v)>=100&&Math.abs(v)<=100000?v:null};
function cleanHandles(h){h=h&&typeof h==='object'?h:{};if(window.Rush&&Rush.joiner&&Rush.joiner.clean)return Rush.joiner.clean(h,['note']);const o={};for(const k of JF){const v=String(h[k]==null?'':h[k]).replace(/[\u0000-\u001f<>]/g,'').slice(0,k==='note'?140:40).trim();if(v)o[k]=v}return o}
function limits(r){const a={stakeMin:r.stakeMin,stakeMax:r.stakeMax,lineMin:r.lineMin!=null?r.lineMin:r.oddsMin,lineMax:r.lineMax!=null?r.lineMax:r.oddsMax,slipMin:r.slipMin,slipMax:r.slipMax,injury:r.injury==='half'?'h1':r.injury,fields:Array.isArray(r.fields)?r.fields:r.joinFields,showFields:r.showFields||(r.handlesVisible==='contest'?'contest':'commish')};
 if(window.Rush&&Rush.rules&&Rush.rules.norm){const n=Rush.rules.norm(a);return{stakeMin:n.stakeMin,stakeMax:n.stakeMax,lineMin:n.lineMin,lineMax:n.lineMax,slipMin:n.slipMin,slipMax:n.slipMax,injury:n.injury,fields:n.fields,showFields:n.showFields}}
 const o={stakeMin:int(a.stakeMin,0,1e6,0),stakeMax:a.stakeMax==null||a.stakeMax===''?null:int(a.stakeMax,1,1e6,null),lineMin:odds(a.lineMin),lineMax:odds(a.lineMax),slipMin:odds(a.slipMin),slipMax:odds(a.slipMax),injury:INJ.includes(a.injury)?a.injury:'none',fields:Array.isArray(a.fields)?JF.filter(k=>a.fields.includes(k)):[],showFields:HV.includes(a.showFields)?a.showFields:'commish'};if(o.stakeMax!=null&&o.stakeMax<o.stakeMin)o.stakeMax=o.stakeMin;return o}
const str=(x,n)=>String(x==null?'':x).replace(/[\u0000-\u001f<>]/g,'').slice(0,n);
const int=(x,lo,hi,d)=>{const v=Math.round(+x);return isFinite(v)?Math.max(lo,Math.min(hi,v)):d};
const numOrNull=x=>{const v=+x;return x!=null&&x!==''&&isFinite(v)?v:null};
const idOK=x=>String(x==null?'':x).slice(0,48).replace(/[^A-Za-z0-9_-]/g,'');
function cleanFinal(f){return Array.isArray(f)?f.slice(0,100).map(r=>({finish:int(r&&r.finish,1,999,0),name:str(r&&r.name,40),sim:!!(r&&r.sim),me:!!(r&&r.me),w:int(r&&r.w,0,999,0),l:int(r&&r.l,0,999,0),p:int(r&&r.p,0,999,0),units:Math.round((+(r&&r.units)||0)*10)/10,voided:int(r&&r.voided,0,999,0),settled:Array.isArray(r&&r.settled)?r.settled.slice(0,200).map(q=>({game:str(q&&q.game,40),label:str(q&&q.label,60),market:str(q&&q.market,30),odds:int(q&&q.odds,-100000,100000,0),status:['won','lost','push','void','cashed'].includes(q&&q.status)?q.status:'void',units:q&&q.units!=null?Math.round((+q.units||0)*10)/10:null})):[]})):undefined}
function clean(c){c=c&&typeof c==='object'?c:{};const r=c.rules&&typeof c.rules==='object'?c.rules:{},sc0=c.schedule&&typeof c.schedule==='object'?c.schedule:{};/* accept the shared store's shape too: schedule.sports, rules.markets as a list */const m=Array.isArray(r.markets)?{lines:r.markets.some(x=>/line|ml|spread|total/i.test(String(x))),props:r.markets.some(x=>/prop|td/i.test(String(x))),parlays:r.markets.some(x=>/parlay/i.test(String(x))),live:r.markets.some(x=>/live/i.test(String(x)))}:(r.markets&&typeof r.markets==='object'?r.markets:{});const sc=Object.assign({},sc0,{leagues:Array.isArray(sc0.leagues)?sc0.leagues:Array.isArray(sc0.sports)?sc0.sports:undefined});
 const days=Array.isArray(sc.days)?sc.days.map(d=>String(d).slice(0,8)).filter(d=>/^\d{8}$/.test(d)).slice(0,14):[];const leagues=Array.isArray(sc.leagues)?LG.filter(k=>sc.leagues.includes(k)):[];
 const out={id:idOK(c.id)||'c'+rid(),name:str(c.name,40)||'Contest',visibility:VIS.includes(c.visibility)?c.visibility:'private',week:int(c.week,1,30,RW.week().n),size:int(c.size,2,500,12),host:str(c.host,24),
  schedule:{days:days.length?days:weekDays(),leagues:leagues.length?leagues:LG.slice(),entryClose:numOrNull(sc.entryClose)},
  rules:{stack:int(r.stack,100,100000,1000),markets:{lines:m.lines!==false,props:m.props!==false,parlays:m.parlays!==false,live:m.live!==false},reload:r.reload!==false,scoring:SC.includes(r.scoring)?r.scoring:'units',ties:TI.includes(r.ties)?r.ties:'split'}};
 Object.assign(out.rules,limits(r));
 if(!Object.values(out.rules.markets).some(Boolean))out.rules.markets.lines=true;
 out.owner=c.owner===true;out.joined=c.joined===true;out.created=numOrNull(c.created);out.joinedAt=numOrNull(c.joinedAt);out.status=ST.includes(c.status)?c.status:'open';out.closedAt=numOrNull(c.closedAt);
 out.entrants=Array.isArray(c.entrants)?c.entrants.slice(0,60).map(e=>({id:idOK(e&&e.id),name:str(e&&e.name,24),sim:!!(e&&e.sim),real:!!(e&&e.real),handles:cleanHandles(e&&e.handles),at:numOrNull(e&&e.at)})).filter(e=>e.id):[];
 out.removed=Array.isArray(c.removed)?c.removed.map(idOK).filter(Boolean).slice(0,40):[];
 out.voids=Array.isArray(c.voids)?c.voids.slice(0,200).map(v=>({key:String(v&&v.key||'').slice(0,200),reason:str(v&&v.reason,140),at:numOrNull(v&&v.at)})):[];
 const f=cleanFinal(c.final);if(f)out.final=f;out.code=codeOf(out.id);return out}
/* fields an invite may carry; everything else on a joined contest is created on this phone */
function fromInvite(d){const c=clean(d);c.owner=false;c.joined=false;c.status='open';c.entrants=[];c.removed=[];c.voids=[];delete c.final;c.closedAt=null;c.created=null;c.joinedAt=null;return c}
function normalize(c){c=clean(c);c.rules=Object.assign({},DEFAULT_RULES,c.rules||{});c.rules.markets=Object.assign({},DEFAULT_RULES.markets,(c.rules||{}).markets||{});c.schedule=Object.assign({days:weekDays(),leagues:['nfl','nba','nhl'],entryClose:null},c.schedule||{});c.entrants=c.entrants||[];c.voids=c.voids||[];c.removed=c.removed||[];c.status=c.status||'open';c.code=c.code||codeOf(c.id);return c}

/* the simulated Field inside a contest: a seeded slice of the week's Field, labelled SIM */
function simEntrants(c){const pool=RW.FIELD.slice(),n=Math.min(c.size||12,pool.length),out=[];let i=0;while(out.length<n&&pool.length){const k=Math.floor(RW.hash(c.id+'e'+i)*pool.length);const b=pool.splice(k,1)[0];if(b)out.push({id:b.id,name:b.name,sim:true});i++}return out}

function all(){if(B())return B().list();const s=load();return Object.values(s.c).map(normalize)}
function get(id){if(B())return B().get(id);const s=load();return s.c[id]?normalize(s.c[id]):null}
function put(c){const s=load();s.c[c.id]=c;save(s);return c}
function create(cfg){if(B())return B().create(cfg);const c=normalize(Object.assign({id:'c'+rid(),owner:true,created:Date.now(),week:RW.week().n,size:12},cfg));c.entrants=[{id:'me',name:(window.Rush&&Rush.me?Rush.me().handle:'You')||'You'},...simEntrants(c)];return put(c)}
function update(id,patch){if(B())return B().update(id,patch);const c=get(id);if(!c)return null;if(!editable(c)&&(patch.rules||patch.schedule))return null;Object.assign(c,patch);if(patch.rules)c.rules=Object.assign({},c.rules,patch.rules);return put(normalize(c))}
function editable(c){return c.owner&&c.status==='open'&&!(c.schedule.entryClose&&Date.now()>c.schedule.entryClose)}
function join(x,handles,name){if(B())return B().join(x,handles,name);if(typeof x==='string'){const s=load();const c=Object.values(s.c).find(k=>k.id===x||k.code===String(x).toUpperCase());if(c){c.joined=true;return put(normalize(c))}const p=publicList().find(k=>k.id===x||k.id===String(x).toLowerCase()||k.code===String(x).toUpperCase());if(p)return join(p,handles,name);return null}
 const c=fromInvite(x);c.joined=true;c.joinedAt=Date.now();if(c.schedule.entryClose&&Date.now()>c.schedule.entryClose)return null;c.entrants=[{id:'me',name:str(name,24).trim()||str((window.Rush&&Rush.me?Rush.me().handle:'You')||'You',24),handles:cleanHandles(handles),at:Date.now()},...simEntrants(c)];return put(c)}
/* a joiner sends this back so the commissioner's phone adds them with their handles (no backend) */
function entryLink(id){const c=get(id);if(!c)return'';const me=c.entrants.find(e=>e.id==='me')||{};const base=location.href.replace(/[^/]*$/,'');return`${base}contest.html?c=${encodeURIComponent(c.id)}&e=${b64({n:me.name||'Player',h:me.handles||{}})}`}
function decodeEntry(s){try{const d=unb64(String(s).slice(0,3000));const n=str(d&&d.n,24);if(!n)return null;return{name:n,handles:cleanHandles(d&&d.h)}}catch(e){return null}}
function addEntrant(id,entry){const c=get(id);if(!c||!c.owner||!entry)return null;const eid='p'+Math.floor(RW.hash(entry.name.toLowerCase()+c.id)*1e9).toString(36);const ex=c.entrants.find(e=>e.id===eid);if(ex){ex.handles=entry.handles;ex.real=true}else c.entrants.push({id:eid,name:entry.name,real:true,handles:entry.handles,at:Date.now()});c.removed=c.removed.filter(x=>x!==eid);return put(normalize(c))}
function leave(id){if(B())return B().leave(id);const s=load();delete s.c[id];save(s)}
function inviteLink(id){const c=get(id);if(!c)return'';const lite={id:c.id,name:c.name,visibility:c.visibility,week:c.week,size:c.size,schedule:c.schedule,rules:c.rules,host:(window.Rush&&Rush.me?Rush.me().handle:'')||'A friend'};const base=location.href.replace(/[^/]*$/,'');return`${base}contest.html?i=${b64(lite)}`}
function decode(s){try{return fromInvite(unb64(String(s).slice(0,6000)))}catch(e){return null}}
function decodeResults(s){try{const d=unb64(String(s).slice(0,20000));if(!d||!Array.isArray(d.x))return null;return{n:str(d.n,40)||'Contest',w:int(d.w,1,30,RW.week().n),s:SC.includes(d.s)?d.s:'units',t:numOrNull(d.t),x:d.x.slice(0,100).filter(Array.isArray).map(x=>({finish:int(x[0],1,999,0),name:str(x[1],40),sim:!!x[2],w:int(x[3],0,999,0),l:int(x[4],0,999,0),p:int(x[5],0,999,0),units:Math.round((+x[6]||0)*10)/10,settled:[]}))}}catch(e){return null}}
function removeEntrant(id,eid){const c=get(id);if(!c||!c.owner||eid==='me')return null;if(!c.removed.includes(eid))c.removed.push(eid);return put(c)}
function restoreEntrant(id,eid){const c=get(id);if(!c||!c.owner)return null;c.removed=c.removed.filter(x=>x!==eid);return put(c)}
function voidPick(id,key,reason){const c=get(id);if(!c||!c.owner||c.status==='closed'||c.status==='archived')return null;if(!c.voids.some(v=>v.key===key))c.voids.push({key,reason:String(reason||'').slice(0,140),at:Date.now()});return put(c)}
function close(id){const c=get(id);if(!c||!c.owner)return null;c.status='closed';c.closedAt=Date.now();c.final=results(c);return put(c)}
function archive(id){const c=get(id);if(!c||!c.owner)return null;c.status='archived';return put(c)}
function reopen(id){const c=get(id);if(!c||!c.owner)return null;c.status='open';delete c.final;return put(c)}

/* public contests anyone can join: seeded from the week so every phone sees the same list */
function publicList(){const w=RW.week(),days=weekDays(),T=[['NFL Sunday Showdown',['nfl'],{lines:true,props:true,parlays:true,live:true},'units'],['Hoops Nightly',['nba'],{lines:true,props:true,parlays:false,live:true},'units'],['Puck Line Club',['nhl'],{lines:true,props:false,parlays:false,live:false},'record'],['All Sports Grind',['nfl','nba','nhl'],{lines:true,props:true,parlays:true,live:true},'units'],['Game Lines Only',['nfl','nba','nhl'],{lines:true,props:false,parlays:false,live:false},'record']];
 return T.map(([n,lg,mk,sc],i)=>normalize({id:'pub'+w.n+'-'+i,name:n,visibility:'public',week:w.n,size:14+Math.floor(RW.hash(n+w.n)*30),host:RW.FIELD[i*3].name,schedule:{days,leagues:lg,entryClose:null},rules:{stack:1000,markets:mk,reload:i!==4,scoring:sc,ties:'split'},owner:false,status:'open'}))}

/* picks inside a contest: only the contest's sports, days and allowed markets; voided picks drop out */
const marketOK=(r,p)=>{if(p.live&&!r.markets.live)return false;const k=p.t||'';if(k==='parlay'||(p.market&&/parlay/i.test(p.market)))return r.markets.parlays;if(/^(prop|td)$/.test(k))return r.markets.props;if(/^(next|go|fd|drive|ns)$/.test(k))return r.markets.live;return r.markets.lines};
function pickKey(eid,p){return eid+'|'+p.league+'|'+p.gameId+'|'+(p.label||'')+'|'+(p.at||'')}
const dec=o=>o>0?1+o/100:1+100/Math.abs(o);
function limitMiss(c,p){const r=c.rules,raw=p.raw;if(raw&&raw.contest===c.id)return null;if(raw&&raw.ex&&raw.ex[c.id])return str(raw.ex[c.id],140);if(window.Rush&&Rush.rules&&Rush.rules.check){const k=Rush.rules.check(r,{stake:p.stake,odds:p.odds,label:p.label,legs:raw&&raw.legs});return k.ok?null:str(k.why,140)}
 if(p.stake!=null){if(p.stake<r.stakeMin)return'Stake under the minimum';if(r.stakeMax!=null&&p.stake>r.stakeMax)return'Stake over the maximum'}if(p.odds!=null&&isFinite(p.odds)&&Math.abs(p.odds)>=100){const d=dec(p.odds);if(r.lineMin!=null&&d<dec(r.lineMin))return'Shorter than the line limit';if(r.lineMax!=null&&d>dec(r.lineMax))return'Longer than the line limit'}return null}
function injured(c,p){if(!p.raw||c.rules.injury==='none'||!(window.Rush&&Rush.rules&&Rush.rules.result))return p;const x=Rush.rules.result(c.rules,p.raw);return x&&x.note?Object.assign({},p,{status:x.status,units:x.units,inj:str(x.note,160)}):p}
function entrantPicks(c,eid,games){const ps=RW.playerPicks(eid,games,c.id)||[];const days=new Set(c.schedule.days),lg=new Set(c.schedule.leagues);
 return ps.filter(p=>lg.has(p.league)&&(!p.g||days.has(RW.etDay(p.g.date)))&&marketOK(c.rules,p)).map(p=>{p=injured(c,p);const key=pickKey(eid,p),v=c.voids.find(x=>x.key===key),out=limitMiss(c,p);return Object.assign({},p,{key,voided:v||(out?{reason:out,auto:true}:null)})})}
function standings(c,games){games=games||RW.cached()||[];const rows=c.entrants.filter(e=>!c.removed.includes(e.id)).map(e=>{const ps=entrantPicks(c,e.id,games);let w=0,l=0,pu=0,units=0,open=0;for(const p of ps){if(p.voided)continue;if(p.status==='open'){open++;continue}if(p.status==='won')w++;else if(p.status==='lost')l++;else pu++;units+=p.units||0}return{id:e.id,name:e.name,sim:!!e.sim,me:e.id==='me',w,l,p:pu,units,open,picks:ps}});
 const by=c.rules.scoring==='record'?(a,b)=>(b.w-b.l)-(a.w-a.l)||b.w-a.w||b.units-a.units:(a,b)=>b.units-a.units||(b.w-a.w);rows.sort(by);
 rows.forEach((r,i)=>{const prev=rows[i-1];r.finish=prev&&by(prev,r)===0&&c.rules.ties==='split'?prev.finish:i+1});return rows}
function results(c,games){return standings(c,games).map(r=>({finish:r.finish,name:r.name,sim:r.sim,me:r.me,w:r.w,l:r.l,p:r.p,units:Math.round(r.units*10)/10,settled:r.picks.filter(p=>p.status!=='open'&&!p.voided).map(p=>({game:p.game,label:p.label,odds:p.odds,status:p.status,units:p.units==null?null:Math.round(p.units*10)/10,market:p.market})),voided:r.picks.filter(p=>p.voided).length}))}
function csv(c,res){const q=x=>{const s=String(x==null?'':x);return/[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};const L=[['Contest',c.name],['Week',c.week],['Scoring',c.rules.scoring==='record'?'Record':'Units'],['Closed',c.closedAt?new Date(c.closedAt).toISOString():'Not closed'],[],['Finish','Entrant','Type','W','L','Push','Units','Settled picks','Voided picks']];
 for(const r of res)L.push([r.finish,r.name,r.sim?'SIM':'Player',r.w,r.l,r.p,r.units.toFixed(1),r.settled.length,r.voided]);L.push([],['Entrant','Game','Market','Pick','Odds','Result','Units']);for(const r of res)for(const p of r.settled)L.push([r.name,p.game,p.market,p.label,p.odds,p.status,p.units==null?'':p.units.toFixed(1)]);return L.map(r=>r.map(q).join(',')).join('\n')}
function resultsLink(c,res){const base=location.href.replace(/[^/]*$/,'');return`${base}contest.html?r=${b64({n:c.name,w:c.week,s:c.rules.scoring,t:c.closedAt||Date.now(),x:res.map(r=>[r.finish,r.name,r.sim?1:0,r.w,r.l,r.p,r.units])})}`}
function on(f){subs.push(f);addEventListener('storage',e=>{if(e.key===KEY)f()});if(B()&&window.Rush.on)window.Rush.on(f)}

function dot(id){const W=window.Rush&&Rush.wallet;let col=null;try{col=W&&W.color&&(id==='rush'||(get(id)&&(get(id).owner||get(id).joined)))?W.color(id):null}catch(e){}return/^#[0-9a-fA-F]{3,8}$/.test(col||'')?col:null}
window.RC={dot,entryLink,decodeEntry,addEntrant,decodeResults,clean,list:all,get,create,update,editable,join,leave,inviteLink,decode,removeEntrant,restoreEntrant,voidPick,close,archive,reopen,publicList,standings,results,csv,resultsLink,entrantPicks,on,unb64,b64,codeOf,shared:()=>!!B()};
})();
