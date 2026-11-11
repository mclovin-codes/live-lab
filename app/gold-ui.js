/* Gold UI kit (owner: Gold): avatars that open profiles, the Field with the honest view, Stack figures, games and seals.
 * Load after shared/state.js, week-games.js and honest.js. Exposes window.GU. The top bar and Stack sheet are Blue's (shared/nav.js). */
(function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hash = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
  const mix = s => { let h = Math.floor(hash(s) * 4294967296) >>> 0; h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  const fmt = n => Math.round(+n || 0).toLocaleString('en-US');
  const honest = () => { try { if (window.Rush && typeof Rush.honest === 'function') return !!Rush.honest(); return !!(window.RushHonest && RushHonest.on()); } catch (e) { return false; } };
  const handle = () => { try { return Rush.me().handle; } catch (e) { return 'You'; } };
  const clean = n => String(n || '').replace(/\bUnits?\b/g, 'Stack').replace(/\bPoints\b/g, 'Spread');
  // The Field by Stack. In the honest view: you, your matchup opponent and the next five by id (the store does this when it can).
  function field() {
    let f = []; try { f = Rush.field(); } catch (e) {}
    if (honest() && f.length > 7) {
      let riv = null; try { riv = Rush.rival(); } catch (e) {}
      const me = f.filter(r => r.me), rest = f.filter(r => !r.me && (!riv || r.id !== riv.id)).sort((a, b) => String(a.id).localeCompare(String(b.id), 'en', { numeric: true }));
      f = me.concat(riv ? f.filter(r => r.id === riv.id) : [], rest.slice(0, riv ? 5 : 6));
    }
    return f.map(r => Object.assign({}, r, { name: r.me ? handle() : clean(r.name), stack: r.stack != null ? Math.round(r.stack) : Math.round(1000 + (+r.units || 0) * 10) }))
      .sort((a, b) => b.stack - a.stack || (b.me ? 1 : 0) - (a.me ? 1 : 0))
      .map((r, i, all) => Object.assign(r, { rank: 1 + all.filter(x => x.stack > r.stack).length }));
  }
  const meRow = () => field().find(r => r.me) || { id: 'me', me: true, name: handle(), stack: 1000, rank: null };
  const player = id => field().find(r => String(r.id) === String(id)) || null;
  function opponent() { let r = null; try { r = Rush.rival(); } catch (e) {} return r ? player(r.id) : null; }
  const prof = r => 'player.html' + (r.me ? '' : '?u=' + encodeURIComponent(r.id));
  // One face everywhere: the same colours and initials as the top bar (Rush.nav.avatar in shared/nav.js).
  const HUES = ['#3CC8FF', '#3DDC84', '#FFB020', '#FF7AB6', '#A78BFA', '#5EEAD4', '#F97316', '#FDE047'];
  const col = s => { let h = 0; for (const c of String(s || '')) h = (h * 31 + c.charCodeAt(0)) >>> 0; return HUES[h % HUES.length]; };
  const hue = n => Math.floor(hash('h' + n) * 360);
  const initials = s => { const w = String(s || '?').replace(/[^A-Za-z0-9 _]/g, '').split(/[ _]+/).filter(Boolean); return ((w[0] || '?')[0] + (w[1] ? w[1][0] : (w[0] || '').slice(1, 2))).toUpperCase(); };
  function av(r, size, plain) { size = size || 40; const tag = plain ? 'span' : 'a'; return `<${tag} class="gu-av${r.me ? ' me' : ''}" ${plain ? '' : `href="${prof(r)}"`} style="width:${size}px;height:${size}px;font-size:${Math.round(size * .38)}px;background:${col(r.name)}" aria-label="${esc(r.name)}">${esc(initials(r.name))}</${tag}>`; }
  const nameLink = r => `<a class="gu-nm" href="${prof(r)}">${esc(r.me ? 'You' : r.name)}</a>`;
  const games = () => { try { return (window.RW && RW.cached && RW.cached()) || []; } catch (e) { return []; } };
  const started = g => !!g && (g.state !== 'pre' || Date.now() >= g.date);
  function until(t) { const d = Math.max(0, t - Date.now()), h = Math.floor(d / 36e5), m = Math.floor(d % 36e5 / 6e4); return h >= 24 ? Math.floor(h / 24) + 'd ' + (h % 24) + 'h' : h ? h + 'h ' + m + 'm' : m + 'm'; }
  const when = t => new Date(t).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });
  // A stand-in player's picks; in the honest view about 6 a week each, as Week 8 ran (211 picks, 33 entrants).
  function picksOf(id) { let ps = []; try { ps = (window.RW && RW.playerPicks && RW.playerPicks(id)) || []; } catch (e) {} ps = ps.filter(x => x && x.g && x.g.away && x.g.home && !x.raw); if (honest()) ps = ps.filter(x => mix('k' + id + x.gameId) < .4).slice(0, 6); return ps; }
  // Which side a revealed pick is on, in team terms where it has one.
  function sideOf(x) { if (x.t === 'total') return /^over/i.test(x.label || '') ? 'over' : 'under'; return String(x.label || '').indexOf(x.g.away.abbr) === 0 ? 'away' : 'home'; }
  // Your own picks this week with their games.
  function mine() { let ps = []; try { ps = Rush.picks({ week: Rush.week().id }); } catch (e) {} const gs = games(); return ps.map(p => Object.assign({}, p, { g: gs.find(x => String(x.id) === String(p.gameId)) })); }
  function mySide(p) { if (!p.g) return null; const L = String(p.label || p.sel || ''); if (/^over/i.test(L)) return 'over'; if (/^under/i.test(L)) return 'under'; return L.indexOf(p.g.away.abbr) === 0 ? 'away' : L.indexOf(p.g.home.abbr) === 0 ? 'home' : null; }
  // A game as the Field sees it: sealed counts before kickoff (no sides), then who is with you and who is against you.
  function gameView(g) {
    const f = field().filter(r => !r.me), on = [];
    f.forEach(pl => picksOf(pl.id).filter(x => String(x.gameId) === String(g.id)).forEach(x => on.push({ pl, x })));
    const myp = mine().find(p => String(p.gameId) === String(g.id)), ms = myp ? mySide(myp) : null;
    if (!started(g)) return { sealed: on.length, players: [...new Map(on.map(o => [o.pl.id, o.pl])).values()], mine: myp };
    const opp = { away: 'home', home: 'away', over: 'under', under: 'over' };
    const withYou = ms ? on.filter(o => sideOf(o.x) === ms) : [], against = ms ? on.filter(o => sideOf(o.x) === opp[ms]) : [];
    return { sealed: 0, on, mine: myp, ms, withYou, against, players: [...new Map(on.map(o => [o.pl.id, o.pl])).values()] };
  }
  // Rank moves since this phone last looked (kept per view), so the Field visibly moves.
  function moves(f) { const K = 'gu-ranks-' + (honest() ? '7' : 'all'); let old = {}; try { old = JSON.parse(localStorage.getItem(K) || '{}'); } catch (e) {} const out = {}; f.forEach(r => { if (old[r.id] != null) out[r.id] = old[r.id] - r.rank; }); try { if (!old._t || Date.now() - old._t > 10 * 6e4) { const s = { _t: Date.now() }; f.forEach(r => s[r.id] = r.rank); localStorage.setItem(K, JSON.stringify(s)); } } catch (e) {} return out; }
  const CSS = `.gu-av{display:inline-grid;place-items:center;flex:none;border-radius:50%;font-weight:800;color:#0A0F15;letter-spacing:.3px;text-decoration:none;box-shadow:0 0 0 2px #0A0F15,0 0 0 3.5px rgba(255,255,255,.18)}.gu-av.me{box-shadow:0 0 0 2px #0A0F15,0 0 0 3.5px #3DB8FF}.gu-nm{color:inherit;text-decoration:none;font-weight:700}`;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  window.GU = { esc, hash, mix, fmt, honest, field, meRow, player, opponent, prof, av, nameLink, games, started, until, when, picksOf, sideOf, mine, mySide, gameView, moves, hue, col, initials };
})();
