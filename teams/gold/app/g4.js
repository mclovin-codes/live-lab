/* Gold r4 kit: one signed-in player, Stack as the one number, avatars that open profiles, the top bar and the Stack sheet.
   Load after shared/state.js (and week-games.js when the page has it). Exposes window.G. */
(function () {
  const ME = { handle: 'nross', id: 'me' };
  const CSS = `
:root{--bg:#0A0F15;--card:#141C26;--card2:#1B2531;--line:rgba(255,255,255,.09);--tx:#F4F7FA;--mute:#A3AFBD;--dim:#6E7B8A;--acc:#3DB8FF;--gold:#F2C14E;--grn:#3DD68C;--red:#FF6B6B;--vio:#9B8CFF}
*{box-sizing:border-box}html{background:var(--bg)}
body.g4{margin:0;background:var(--bg);color:var(--tx);font:400 16px/1.4 -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
.g4 a{color:inherit;text-decoration:none}
.g4 .wrap{max-width:560px;margin:0 auto;padding:0 16px 24px}
.g4 .top{position:sticky;top:0;z-index:30;display:flex;align-items:center;gap:12px;padding:calc(10px + env(safe-area-inset-top,0px)) 16px 10px;background:rgba(10,15,21,.92);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border-bottom:1px solid var(--line)}
.g4 .top h1{margin:0;flex:1;font:800 24px/1 "Barlow Condensed",-apple-system,sans-serif;letter-spacing:.2px;text-transform:uppercase}
.g4 .stk{display:flex;flex-direction:column;align-items:flex-end;padding:6px 12px;border-radius:14px;background:var(--card2);border:1px solid var(--line);cursor:pointer;font:inherit;color:inherit}
.g4 .stk b{font:800 20px/1 "Barlow Condensed",sans-serif;font-variant-numeric:tabular-nums}.g4 .stk small{font-size:10px;letter-spacing:1.2px;color:var(--mute);font-weight:700}
.g4 .av{display:inline-grid;place-items:center;flex:none;border-radius:50%;font-weight:800;color:#0A0F15;letter-spacing:.3px;box-shadow:0 0 0 2px var(--bg),0 0 0 3.5px rgba(255,255,255,.18)}
.g4 .av.me{box-shadow:0 0 0 2px var(--bg),0 0 0 3.5px var(--acc)}
.g4 .card{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:16px;margin-top:14px}
.g4 .lbl{font-size:12px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:var(--mute);margin:22px 4px 0;display:flex;justify-content:space-between;align-items:center}
.g4 .lbl a{color:var(--acc);letter-spacing:.4px;text-transform:none;font-size:14px;font-weight:700}
.g4 .big{font:800 44px/1 "Barlow Condensed",sans-serif;font-variant-numeric:tabular-nums}
.g4 .num{font:800 22px/1 "Barlow Condensed",sans-serif;font-variant-numeric:tabular-nums}
.g4 .up{color:var(--grn)}.g4 .dn{color:var(--red)}
.g4 .btn{display:flex;align-items:center;justify-content:center;gap:8px;min-height:50px;padding:0 18px;border:0;border-radius:14px;background:var(--acc);color:#04121C;font:800 17px/1 -apple-system,sans-serif;cursor:pointer;width:100%}
.g4 .btn.ghost{background:var(--card2);color:var(--tx);border:1px solid var(--line)}
.g4 .row{display:flex;align-items:center;gap:12px;padding:12px 0;border-top:1px solid var(--line)}.g4 .row:first-child{border-top:0}
.g4 .row .nm{flex:1;min-width:0;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.g4 .row .nm small{display:block;font-weight:500;color:var(--mute);font-size:13px}
.g4 .rk{width:28px;text-align:center;font:800 18px/1 "Barlow Condensed",sans-serif;color:var(--mute)}
.g4 .chip{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:var(--card2);font-size:12px;font-weight:800;letter-spacing:.6px;color:var(--mute)}
.g4 .chip.live{background:rgba(255,107,107,.16);color:var(--red)}.g4 .chip.live::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--red);animation:g4b 1.4s infinite}
@keyframes g4b{50%{opacity:.25}}
.g4 .sheet-s{position:fixed;inset:0;z-index:90;background:rgba(0,0,0,.6)}
.g4 .sheet{position:fixed;left:0;right:0;bottom:0;z-index:91;max-height:86%;overflow-y:auto;background:var(--card);border-radius:22px 22px 0 0;padding:10px 18px calc(20px + env(safe-area-inset-bottom,0px));max-width:560px;margin:0 auto}
.g4 .grab{width:40px;height:5px;border-radius:3px;background:rgba(255,255,255,.22);margin:2px auto 12px}
.g4 .slip{display:flex;gap:12px;align-items:center;padding:12px;border-radius:14px;background:var(--card2);margin-top:8px}
.g4 .slip .nm{flex:1;min-width:0}.g4 .slip .nm b{display:block;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.g4 .slip .nm small{color:var(--mute);font-size:13px}
.g4 .slip .r{text-align:right;font-weight:800;font-variant-numeric:tabular-nums}.g4 .slip .r small{display:block;color:var(--mute);font-weight:600;font-size:12px}
.g4 .empty{color:var(--mute);text-align:center;padding:18px 8px;font-size:15px}
`;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const fl = document.createElement('link'); fl.rel = 'stylesheet'; fl.href = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&display=swap'; document.head.appendChild(fl);
  document.body.classList.add('g4');

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hash = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
  const fmt = n => Math.round(n).toLocaleString('en-US');

  // Signed-in account assumed: enter this week's contest on first open, no name step.
  try { if (Rush.week().phase === 'open' && !Rush.me().entered) Rush.enter(ME.handle); } catch (e) {}

  const stackOf = r => Math.round(1000 + (+r.units || 0) * 10);
  function field() { let f = []; try { f = Rush.field(); } catch (e) {} return f.map(r => Object.assign({}, r, { name: r.me ? ME.handle : String(r.name).replace(/Units?/g, "Stack").replace(/Points/g, "Spread"), stack: stackOf(r) })).sort((a, b) => b.stack - a.stack || (b.me ? 1 : 0) - (a.me ? 1 : 0)).map((r, i, all) => Object.assign(r, { rank: 1 + all.filter(x => x.stack > r.stack).length })); }
  function meRow() { return field().find(r => r.me) || { id: 'me', me: true, name: ME.handle, stack: 1000, rank: null }; }
  function player(id) { return field().find(r => String(r.id) === String(id)) || null; }
  function opponent() { let r = null; try { r = Rush.rival(); } catch (e) {} return r ? player(r.id) : null; }
  function myStack() { try { return Math.round(Rush.me().stack); } catch (e) { return 1000; } }
  function initials(n) { const p = String(n).trim().split(/\s+/); return ((p[0] || '?')[0] + (p[1] ? p[1][0] : (p[0][1] || ''))).toUpperCase(); }
  function hue(n) { return Math.floor(hash('h' + n) * 360); }
  function av(r, size, plain) { size = size || 40; const n = r.me ? ME.handle : r.name; const tag = plain ? "span" : "a"; return `<${tag} class="av${r.me ? ' me' : ''}" ${plain ? '' : `href="me.html${r.me ? '' : '?u=' + encodeURIComponent(r.id)}"`} style="width:${size}px;height:${size}px;font-size:${Math.round(size * .38)}px;background:hsl(${hue(n)} 70% 66%)" aria-label="${esc(n)} profile">${esc(initials(n))}</${tag}>`; }
  function nameLink(r) { return `<a href="me.html${r.me ? '' : '?u=' + encodeURIComponent(r.id)}">${esc(r.me ? ME.handle : r.name)}</a>`; }

  function openPicks() { try { return Rush.picks({ status: 'open', week: Rush.week().id }); } catch (e) { return []; } }
  function allPicks() { try { return Rush.picks({ week: Rush.week().id }); } catch (e) { return []; } }
  function slipHTML(p) {
    const st = p.status, res = st === 'open' ? `<span>${fmt(p.stake)}</span><small>to return ${fmt(p.stake + (p.win || 0))}</small>` : st === 'won' ? `<span class="up">+${fmt((p.pay || 0) - p.stake)}</span><small>hit</small>` : st === 'lost' ? `<span class="dn">-${fmt(p.stake)}</span><small>missed</small>` : `<span>${fmt(p.pay || p.stake)}</span><small>${esc(st)}</small>`;
    return `<div class="slip"><div class="nm"><b>${esc(p.label || p.sel || 'Pick')}</b><small>${esc(p.sel && p.label !== p.sel ? p.sel : (p.league || '').toUpperCase())}</small></div><div class="r">${res}</div></div>`;
  }

  function sheet(html) {
    close(); const s = document.createElement('div'); s.className = 'sheet-s'; s.id = 'g4s'; s.onclick = close;
    const b = document.createElement('div'); b.className = 'sheet'; b.id = 'g4b'; b.innerHTML = '<div class="grab"></div>' + html;
    document.body.append(s, b); return b;
  }
  function close() { ['g4s', 'g4b'].forEach(id => { const e = document.getElementById(id); if (e) e.remove(); }); }

  // Tap the Stack: the Stack, today's Slips, Reload when busted.
  function stackSheet() {
    const m = meRow(), op = openPicks(), cash = myStack();
    let canR = false; try { canR = Rush.canReload(); } catch (e) {}
    const b = sheet(`<div style="display:flex;align-items:center;gap:14px">${av(m, 52)}<div style="flex:1"><div style="color:var(--mute);font-size:13px;font-weight:700;letter-spacing:1px">YOUR STACK</div><div class="big">${fmt(m.stack)}</div></div><div style="text-align:right"><div class="num">#${m.rank || '-'}</div><small style="color:var(--mute)">of ${field().length}</small></div></div>
      <div style="display:flex;gap:8px;margin-top:12px"><div class="chip">${fmt(cash)} free to stake</div><div class="chip">${op.length} open Slip${op.length === 1 ? '' : 's'}</div></div>
      ${canR ? '<button class="btn" id="g4rl" style="margin-top:14px;background:var(--gold)">Use your free Reload</button>' : ''}
      <div class="lbl" style="margin-top:18px">Open Slips <a href="me.html#slips">All Slips</a></div>
      ${op.length ? op.slice(0, 6).map(slipHTML).join('') : '<div class="empty">No open Slips. Make a pick on the Board.</div>'}
      <div style="display:flex;gap:10px;margin-top:16px"><a class="btn ghost" href="me.html">Your profile</a><a class="btn" href="board.html">Board</a></div>`);
    const r = b.querySelector('#g4rl'); if (r) r.onclick = () => { try { Rush.reload(); } catch (e) {} close(); render && render(); };
  }

  // Every page's top bar: your avatar (profile), the page name, your Stack (sheet).
  function top(title) {
    const m = meRow();
    return `<header class="top">${av(m, 38)}<h1>${esc(title)}</h1><button class="stk" id="g4stk" aria-label="Your Stack"><small>STACK</small><b>${fmt(m.stack)}</b></button></header>`;
  }
  document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#g4stk')) stackSheet(); });

  // Matchup clock: pairing Thursday 7:00 PM ET.
  function pairingAt() { const wk = Rush.week(); return wk.opens + 2 * 864e5 + 11.5 * 36e5; }
  function until(t) { const d = Math.max(0, t - Date.now()), h = Math.floor(d / 36e5), mm = Math.floor(d % 36e5 / 6e4); return h >= 24 ? Math.floor(h / 24) + 'd ' + (h % 24) + 'h' : h + 'h ' + mm + 'm'; }

  // Challenges: a named 1v1 beside the Thursday pairing, with its own record. SIM players accept after 3 seconds.
  const CK = 'g4-ch-v1';
  function chs() { try { const a = JSON.parse(localStorage.getItem(CK) || '[]'); let ch = false; a.forEach(c => { if (c.state === 'sent' && Date.now() - c.at > 3000) { c.state = 'on'; ch = true; } }); if (ch) localStorage.setItem(CK, JSON.stringify(a)); return a.filter(c => c.week === Rush.week().id); } catch (e) { return []; } }
  function challenge(id) { try { const a = JSON.parse(localStorage.getItem(CK) || '[]'); if (a.some(c => c.opp === id && c.week === Rush.week().id)) return; a.push({ opp: id, at: Date.now(), state: 'sent', week: Rush.week().id }); localStorage.setItem(CK, JSON.stringify(a)); setTimeout(() => render && render(), 3200); } catch (e) {} }
  // Season record from the engine's season table; challenge record W-L from past weeks (none yet this season).
  function record(id) { try { const t = Rush.season().table.find(r => String(r.id) === String(id)); return t ? { w: t.w, l: t.l, rank: t.rank } : { w: 0, l: 0 }; } catch (e) { return { w: 0, l: 0 }; } }
  function games() { try { return (window.RW && RW.cached && RW.cached()) || []; } catch (e) { return []; } }

  let render = null;
  window.G = { chs, challenge, record, games, ME, esc, hash, fmt, field, meRow, player, opponent, myStack, av, nameLink, top, sheet, close, stackSheet, openPicks, allPicks, slipHTML, pairingAt, until, hue, initials, set render(f) { render = f; }, get render() { return render; } };
})();
