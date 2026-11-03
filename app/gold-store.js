/* Gold pages (Home, Slips, Lounge): a thin map onto Blue's shared/state.js (window.Rush).
   Every read and write goes through Rush, so all app pages share one store. */
(function () {
  const R = window.Rush;
  const NAV = [['home', 'index.html', 'Home', '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'],
    ['board', 'board.html', 'Board', '<path d="M4 6h16M4 12h16M4 18h10"/>'],
    ['slips', 'slips.html', 'Slips', '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>'],
    ['ranks', 'ranks.html', 'Ranks', '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>'],
    ['lounge', 'lounge.html', 'Lounge', '<path d="M4 5h16v11H8l-4 4z"/>']];
  const GS = {
    week() { const w = R.week(); return { n: w.n, label: w.label, entryClose: w.entryCloses, settle: w.settles, phase: w.phase, mnfName: 'Monday night' }; },
    me() { const m = R.me(); return { name: m.handle, stack: m.stack, reloaded: m.reloaded, entered: m.entered }; },
    entered() { return !!R.me().entered; },
    enter(name) { const n = String(name || '').trim(); if (n) R.setHandle(n); return R.enter(n || 'You'); },
    units() { return R.units(); },
    rank() { const f = R.field(), r = f.find(x => x.me); return { rank: r ? r.rank : f.length, of: f.length }; },
    record() { const s = R.season(); return { w: s.w || 0, l: s.l || 0 }; },
    reload() { return R.reload(); },
    picks() { return R.picks().map(p => ({ ...p, st: p.status })); },
    field() { return R.field().map(r => ({ rank: r.rank, name: r.me ? (r.name || 'You') : r.name, sim: !!r.sim, you: !!r.me, units: r.units })); },
    fmt(n) { return R.fmt && R.fmt.stack ? R.fmt.stack(n) : Math.round(n).toLocaleString('en-US'); },
    nav(active) {
      if (window.RushNav && typeof window.RushNav.mount === 'function') { try { window.RushNav.mount(active); return; } catch (e) {} }
      const el = document.getElementById('g-nav'); if (!el) return;
      el.innerHTML = NAV.map(([k, href, t, path]) => `<a class="${k === active ? 'on' : ''}" href="${href}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${path}</svg>${t}</a>`).join('');
    }
  };
  window.GS = GS;
  if (R && R.on) R.on(() => { if (typeof window.render === 'function') window.render(); });
})();
