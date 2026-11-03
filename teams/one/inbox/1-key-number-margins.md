# 1. Key-number margins (alt spreads, winning margin, tie/overtime)

From Red v10. Replaces the plain normal curve for the final margin with the same curve times key-number weights fitted to regulation margins in 855 NFL games (nflverse 2023 to 2025): margin 3 x2.05, 7 x1.54, tie x1.74, 14 x1.25, 17 x1.51, 9 and 11 x0.4. Weights fade as the spread of outcomes narrows late in the game. Main DraftKings-priced lines are untouched (dkPrice still wins in quote()); this only changes modelled spreads (alts) and winning-margin/tie prices.

Three edits. Each anchor is a unique string in teams/one/index.html (checked: 1 hit each).

## Edit 1a: JS. Insert BEFORE this anchor:
```text
/* ---------- quote: every market prices through here ---------- */
```
```js
/* ---------- key numbers: final margin = normal curve x weights fitted from 855 games (nflverse 2023-25) ---------- */
const KW=[1.739,0.908,1.025,2.051,0.992,0.97,0.951,1.544,0.878,0.41,0.94,0.396,0.583,0.661,1.254,0.506,0.712,1.507,0.933,0.708,0.905,1.023,0.887,1.074,1.212,1.024,0.892,0.918,1.137,0.873,0.895,1.261,1.062,0.922,1.253,1.009,0.885,1.049,1.119,0.924,0.99];
const knCache=new Map;
function knDist(mu,s){s=Math.max(.8,s);const key=mu.toFixed(2)+'|'+s.toFixed(2);let v=knCache.get(key);if(v)return v;const k=Math.min(1,s/8),lo=Math.floor(mu-6*s),hi=Math.ceil(mu+6*s);v=[];let t=0;for(let m=lo;m<=hi;m++){const p=Math.exp(-(((m-mu)/s)**2)/2)*Math.pow(KW[Math.min(40,Math.abs(m))],k);v.push([m,p]);t+=p}v.forEach(x=>x[1]/=t);if(knCache.size>400)knCache.clear();knCache.set(key,v);return v}
function knOU(mu,s,L){let o=0,u=0,p=0;for(const[m,q]of knDist(mu,s)){if(m>L)o+=q;else if(m<L)u+=q;else p+=q}return{o,u,p}}
function knBand(mu,s,a,b){let t=0;for(const[m,q]of knDist(mu,s))if(m>=a&&m<=b)t+=q;return t}
```

## Edit 1b: JS. REPLACE this:
```text
if(m==='spread'){const x=sp.side===HOME?overUnder(M.mu,M.sm,-sp.line):overUnder(M.mu,M.sm,sp.line);
```
with:
```js
if(m==='spread'){const x=sp.side===HOME?knOU(M.mu,M.sm,-sp.line):knOU(M.mu,M.sm,sp.line);
```

## Edit 1c: JS. REPLACE this:
```text
const band=(a,b)=>Phi((b+.5-M.mu)/M.sm)-Phi((a-.5-M.mu)/M.sm);
```
with:
```js
const band=(a,b)=>knBand(M.mu,M.sm,a,b);
```

## Test
- Console: `knOU(-3.1,9.5,3).p` should be about 0.068 (push on 3 about 2x a plain normal), `knBand(-3.1,9.5,0,0)` about 0.067 (tie/overtime), and `knOU(0,13.5,0)` should give o and u equal.
- Board: alternate spreads at 3 and 7 move further from -110 than lines at 4, 5 or 6; winning margin and Tie prices change; main game lines unchanged.
- knOU returns the same {o,u,p} shape as overUnder, so nothing else changes.
