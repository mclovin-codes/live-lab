/* Honest view (owner: Gold). ?field=7 shows the week as it really is: exactly 7 players, nothing generated.
 * ?field=all goes back to the stand-in Field. The choice is kept in localStorage 'rush-field' so every page agrees,
 * and every page gets the same footer toggle. The store reads the same key (Rush.honest()). */
(function () {
  const K = 'rush-field';
  try { const q = new URLSearchParams(location.search).get('field'); if (q === '7') localStorage.setItem(K, '7'); else if (q === 'all') localStorage.removeItem(K); } catch (e) {}
  const on = () => { try { return localStorage.getItem(K) === '7'; } catch (e) { return false; } };
  window.RushHonest = { on };
  function draw() {
    let el = document.getElementById('rhonest');
    if (!el) { el = document.createElement('footer'); el.id = 'rhonest'; document.body.appendChild(el); }
    el.style.cssText = 'max-width:560px;margin:12px auto 0;padding:16px 16px 22px;text-align:center;font:500 13px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#A3AFBD';
    const here = location.pathname.split('/').pop() || 'index.html';
    el.innerHTML = on()
      ? 'Honest view: the 7 players in this week, nothing generated. <a href="' + here + '?field=all" style="color:#3DB8FF;font-weight:700;text-decoration:none">Show the stand-in Field</a>'
      : 'Stand-in Field of SIM players. <a href="' + here + '?field=7" style="color:#3DB8FF;font-weight:700;text-decoration:none">Honest view: 7 players</a>';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', draw); else draw();
})();
