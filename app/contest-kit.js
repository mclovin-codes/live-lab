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
function normalize(c){c.rules=Object.assign({},DEFAULT_RULES,c.rules||{});c.rules.markets=Object.assign({},DEFAULT_RULES.markets,(c.rules||{}).markets||{});c.schedule=Object.assign({days:weekDays(),leagues:['nfl','nba','nhl'],entryClose:null},c.schedule||{});c.entrants=c.entrants||[];c.voids=c.voids||[];c.removed=c.removed||[];c.status=c.status||'open';c.code=c.code||codeOf(c.id);return c}

/* the simulated Field inside a contest: a seeded slice of the week's Field, labelled SIM */
function simEntrants(c){const n=c.size||12,pool=RW.FIELD.slice(),out=[];let i=0;while(out.length<Math.min(n,pool.length)){const k=Math.floor(RW.hash(c.id+'e'+i)*pool.length);const b=pool.splice(k,1)[0];if(b)out.push({id:b.id,name:b.name,sim:true});i++}return out}

function all(){if(B())return B().list();const s=load();return Object.values(s.c).map(normalize)}
function get(id){if(B())return B().get(id);const s=load();return s.c[id]?normalize(s.c[id]):null}
function put(c){const s=load();s.c[c.id]=c;save(s);return c}
function create(cfg){if(B())return B().create(cfg);const c=normalize(Object.assign({id:'c'+rid(),owner:true,created:Date.now(),week:RW.week().n,size:12},cfg));c.entrants=[{id:'me',name:(window.Rush&&Rush.me?Rush.me().handle:'You')||'You'},...simEntrants(c)];return put(c)}
function update(id,patch){if(B())return B().update(id,patch);const c=get(id);if(!c)return null;if(!editable(c)&&(patch.rules||patch.schedule))return null;Object.assign(c,patch);if(patch.rules)c.rules=Object.assign({},c.rules,patch.rules);return put(normalize(c))}
function editable(c){return c.owner&&c.status==='open'&&!(c.schedule.entryClose&&Date.now()>c.schedule.entryClose)}
function join(x){if(B())return B().join(x);if(typeof x==='string'){const s=load();const c=Object.values(s.c).find(k=>k.id===x||k.code===String(x).toUpperCase());if(c){c.joined=true;return put(normalize(c))}const p=publicList().find(k=>k.id===x||k.code===String(x).toUpperCase());if(p)return join(p);return null}
 const c=normalize(Object.assign({},x,{owner:false,joined:true,joinedAt:Date.now()}));if(c.schedule.entryClose&&Date.now()>c.schedule.entryClose)return null;if(!c.entrants.some(e=>e.id==='me'))c.entrants=[{id:'me',name:(window.Rush&&Rush.me?Rush.me().handle:'You')||'You'},...(c.entrants.length?c.entrants:simEntrants(c))];return put(c)}
function leave(id){if(B())return B().leave(id);const s=load();delete s.c[id];save(s)}
function inviteLink(id){const c=get(id);if(!c)return'';const lite={id:c.id,name:c.name,visibility:c.visibility,week:c.week,size:c.size,schedule:c.schedule,rules:c.rules,host:(window.Rush&&Rush.me?Rush.me().handle:'')||'A friend'};const base=location.href.replace(/[^/]*$/,'');return`${base}contest.html?i=${b64(lite)}`}
function decode(s){try{return normalize(unb64(s))}catch(e){return null}}
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
const marketOK=(r,p)=>{const k=p.t||'';if(p.market&&/parlay/i.test(p.market))return r.markets.parlays;if(/^(prop|td)$/.test(k))return r.markets.props;if(/^(next|go|fd|drive|ns)$/.test(k))return r.markets.live;return r.markets.lines};
function pickKey(eid,p){return eid+'|'+p.league+'|'+p.gameId+'|'+(p.label||'')+'|'+(p.at||'')}
function entrantPicks(c,eid,games){const ps=RW.playerPicks(eid,games)||[];const days=new Set(c.schedule.days),lg=new Set(c.schedule.leagues);
 return ps.filter(p=>lg.has(p.league)&&(!p.g||days.has(RW.etDay(p.g.date)))&&marketOK(c.rules,p)).map(p=>{const key=pickKey(eid,p),v=c.voids.find(x=>x.key===key);return Object.assign({},p,{key,voided:v||null})})}
function standings(c,games){games=games||RW.cached()||[];const rows=c.entrants.filter(e=>!c.removed.includes(e.id)).map(e=>{const ps=entrantPicks(c,e.id,games);let w=0,l=0,pu=0,units=0,open=0;for(const p of ps){if(p.voided)continue;if(p.status==='open'){open++;continue}if(p.status==='won')w++;else if(p.status==='lost')l++;else pu++;units+=p.units||0}return{id:e.id,name:e.name,sim:!!e.sim,me:e.id==='me',w,l,p:pu,units,open,picks:ps}});
 const by=c.rules.scoring==='record'?(a,b)=>(b.w-b.l)-(a.w-a.l)||b.w-a.w||b.units-a.units:(a,b)=>b.units-a.units||(b.w-a.w);rows.sort(by);
 rows.forEach((r,i)=>{const prev=rows[i-1];r.finish=prev&&by(prev,r)===0&&c.rules.ties==='split'?prev.finish:i+1});return rows}
function results(c,games){return standings(c,games).map(r=>({finish:r.finish,name:r.name,sim:r.sim,me:r.me,w:r.w,l:r.l,p:r.p,units:Math.round(r.units*10)/10,settled:r.picks.filter(p=>p.status!=='open'&&!p.voided).map(p=>({game:p.game,label:p.label,odds:p.odds,status:p.status,units:p.units==null?null:Math.round(p.units*10)/10,market:p.market})),voided:r.picks.filter(p=>p.voided).length}))}
function csv(c,res){const q=x=>{const s=String(x==null?'':x);return/[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};const L=[['Contest',c.name],['Week',c.week],['Scoring',c.rules.scoring==='record'?'Record':'Units'],['Closed',c.closedAt?new Date(c.closedAt).toISOString():'Not closed'],[],['Finish','Entrant','Type','W','L','Push','Units','Settled picks','Voided picks']];
 for(const r of res)L.push([r.finish,r.name,r.sim?'SIM':'Player',r.w,r.l,r.p,r.units.toFixed(1),r.settled.length,r.voided]);L.push([],['Entrant','Game','Market','Pick','Odds','Result','Units']);for(const r of res)for(const p of r.settled)L.push([r.name,p.game,p.market,p.label,p.odds,p.status,p.units==null?'':p.units.toFixed(1)]);return L.map(r=>r.map(q).join(',')).join('\n')}
function resultsLink(c,res){const base=location.href.replace(/[^/]*$/,'');return`${base}contest.html?r=${b64({n:c.name,w:c.week,s:c.rules.scoring,t:c.closedAt||Date.now(),x:res.map(r=>[r.finish,r.name,r.sim?1:0,r.w,r.l,r.p,r.units])})}`}
function on(f){subs.push(f);addEventListener('storage',e=>{if(e.key===KEY)f()});if(B()&&window.Rush.on)window.Rush.on(f)}

window.RC={list:all,get,create,update,editable,join,leave,inviteLink,decode,removeEntrant,restoreEntrant,voidPick,close,archive,reopen,publicList,standings,results,csv,resultsLink,entrantPicks,on,unb64,b64,codeOf,shared:()=>!!B()};
})();
