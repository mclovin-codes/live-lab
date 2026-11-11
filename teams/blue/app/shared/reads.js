/* Reads helper (Blue, Phase 4 round two): the numbers Home and profiles show about Reads.
 * Include after shared/state.js and week-games.js. Reads are stored on this phone under rush-reads-v1 as
 * { "<playerId>|<league>|<gameId>|<market>": "home"|"away"|"over"|"under" }.
 * Rush.reads.summary(games) -> { open, nextFlip, made, scored, right, byPlayer: { id: { scored, right } } }
 */
(function () {
  const KEY = 'rush-reads-v1';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  function sideOf(p) { const g = p.g, l = String(p.label || ''); if (/^over/i.test(l)) return 'over'; if (/^under/i.test(l)) return 'under'; if (g && l.startsWith(g.home.abbr)) return 'home'; if (g && l.startsWith(g.away.abbr)) return 'away'; return null; }
  const started = g => g.state !== 'pre' || Date.now() >= g.date;
  function summary(games) {
    const out = { open: 0, nextFlip: Infinity, made: 0, scored: 0, right: 0, byPlayer: {} }; if (!window.RW || !games || !games.length) return out;
    const R = load(); let f = []; try { f = RW.field(games).filter(r => !r.me); } catch (e) {}
    const horizon = Date.now() + 36 * 36e5;
    f.forEach(r => { let ps = []; try { ps = RW.playerPicks(r.id, games) || []; } catch (e) {} const seen = new Set();
      let sealedN = 0; ps.slice().sort((a, b) => (a.g ? a.g.date : 0) - (b.g ? b.g.date : 0)).forEach(p => { if (!p.g || !sideOf(p)) return; const gk = p.league + p.gameId; if (seen.has(gk)) return; seen.add(gk);
        const k = r.id + '|' + p.league + '|' + p.gameId + '|' + (p.t || ''), v = R[k];
        if (!started(p.g) && p.g.date < horizon && sealedN < 3) { sealedN++; out.open++; out.nextFlip = Math.min(out.nextFlip, p.g.date); }
        if (v) { out.made++; if (started(p.g)) { const b = out.byPlayer[r.id] = out.byPlayer[r.id] || { scored: 0, right: 0 }; out.scored++; b.scored++; if (v === sideOf(p)) { out.right++; b.right++; } } } }); });
    return out;
  }
  window.Rush = window.Rush || {}; window.Rush.reads = { summary, KEY };
})();
