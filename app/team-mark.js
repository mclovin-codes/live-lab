/* Team marks (owner: Gold). No league or team logos and no player photos anywhere: a drawn object per sport,
 * tinted with the team's two colours and carrying the team's short code.
 *   NFL and college football: a helmet. NBA: a jersey. NHL: a sweater. MLB: a cap.
 * window.TeamMark.svg(league, team, size) -> SVG string. team: {abbr, color, alt} (hex with or without '#').
 * window.TeamMark.player(league, team, number, size) -> a generic player icon: a jersey in team colours with the number.
 * A missing colour, or two colours too close to tell apart, falls back to a readable pair. */
(function () {
  const hex = c => { c = String(c || '').replace('#', '').trim(); return /^[0-9a-f]{6}$/i.test(c) ? '#' + c.toLowerCase() : null; };
  const lum = c => { const n = parseInt(c.slice(1), 16), r = (n >> 16) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255; const f = v => v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const shade = (c, k) => { const n = parseInt(c.slice(1), 16); const f = v => Math.max(0, Math.min(255, Math.round(v * k))); return '#' + [n >> 16, n >> 8 & 255, n & 255].map(f).map(v => v.toString(16).padStart(2, '0')).join(''); };
  function pair(t) {
    let p = hex(t && (t.color || t.primary)), a = hex(t && (t.alt || t.alternateColor || t.secondary));
    if (!p) p = '#3A4552';
    if (!a || contrast(p, a) < 1.6) a = lum(p) > .35 ? '#0B1118' : '#F4F7FA';
    const ink = contrast(p, '#ffffff') >= contrast(p, '#0B1118') ? '#ffffff' : '#0B1118';
    return { p, a, ink, dark: shade(p, .62), light: shade(p, 1.25) };
  }
  let uid = 0;
  const code = (t, x, y, fs, ink, a) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="'Barlow Condensed','Bebas Neue',Arial Narrow,sans-serif" font-weight="800" font-size="${fs}" fill="${ink}" stroke="${a}" stroke-width=".6" paint-order="stroke" letter-spacing=".3">${String(t || '').slice(0, 4).replace(/[<&>]/g, '')}</text>`;
  function grad(id, c) { return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.light}"/><stop offset=".55" stop-color="${c.p}"/><stop offset="1" stop-color="${c.dark}"/></linearGradient>`; }
  const SHAPES = {
    helmet(c, t, g) { // side view, facing right: shell, stripe, ear hole, facemask
      return `<defs>${grad(g, c)}</defs><path d="M10 40 C8 22 20 9 36 9 C50 9 58 19 58 31 L58 38 L46 40 L44 49 L22 51 C15 51 11 47 10 40 Z" fill="url(#${g})" stroke="${c.dark}" stroke-width="1.2"/><path d="M34 9.3 C36 9.1 38 9.1 40 9.4 L40 33 L34 34 Z" fill="${c.a}" opacity=".95"/><circle cx="24" cy="38" r="3.6" fill="${c.dark}"/><path d="M46 31 L62 31 M46 37 L62 37 M50 31 L50 46 M57 31 L57 44 M46 44 L60 44" stroke="#C9D2DC" stroke-width="2.2" stroke-linecap="round" fill="none"/><path d="M15 22 C19 15 26 12 32 12" stroke="#fff" stroke-opacity=".35" stroke-width="2.5" stroke-linecap="round" fill="none"/>${code(t, 25, 31, 12, c.ink, c.dark)}`;
    },
    jersey(c, t, g) { // basketball tank top
      return `<defs>${grad(g, c)}</defs><path d="M20 6 L27 6 C28 11 36 11 37 6 L44 6 L46 16 C49 18 51 21 51 25 L51 58 L13 58 L13 25 C13 21 15 18 18 16 Z" fill="url(#${g})" stroke="${c.dark}" stroke-width="1.2"/><path d="M27 6 C28 11 36 11 37 6" stroke="${c.a}" stroke-width="2.6" fill="none"/><path d="M18 16 C15 18 13 21 13 25 M46 16 C49 18 51 21 51 25" stroke="${c.a}" stroke-width="2.6" fill="none"/><path d="M13 53 L51 53" stroke="${c.a}" stroke-width="2.4"/><path d="M22 16 L22 50" stroke="#fff" stroke-opacity=".18" stroke-width="3"/>${code(t, 32, 39, 14, c.ink, c.dark)}`;
    },
    sweater(c, t, g) { // hockey sweater with sleeves and stripes
      return `<defs>${grad(g, c)}</defs><path d="M22 7 L28 9 C30 12 34 12 36 9 L42 7 L56 14 L60 34 L50 36 L48 26 L48 58 L16 58 L16 26 L14 36 L4 34 L8 14 Z" fill="url(#${g})" stroke="${c.dark}" stroke-width="1.2"/><path d="M16 46 L48 46 M16 50 L48 50" stroke="${c.a}" stroke-width="2.6"/><path d="M6.4 27 L15 28.5 M49 28.5 L57.6 27" stroke="${c.a}" stroke-width="2.6"/><path d="M28 9 C30 12 34 12 36 9 L34 14 L30 14 Z" fill="${c.a}"/>${code(t, 32, 38, 13, c.ink, c.dark)}`;
    },
    cap(c, t, g) { // baseball cap, three-quarter view
      return `<defs>${grad(g, c)}<radialGradient id="${g}b" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="${c.light}"/><stop offset="1" stop-color="${c.dark}"/></radialGradient></defs><path d="M8 40 C8 20 20 10 34 10 C48 10 56 22 56 38 Z" fill="url(#${g}b)" stroke="${c.dark}" stroke-width="1.2"/><path d="M34 10 L32 38 M20 15 C24 26 25 33 25 39 M47 16 C45 25 44 32 44 38" stroke="${c.dark}" stroke-opacity=".55" stroke-width="1" fill="none"/><circle cx="34" cy="10.5" r="2.4" fill="${c.a}"/><path d="M4 40 C14 36 48 35 62 40 C60 46 46 49 32 48 C18 48 6 46 4 40 Z" fill="${c.a}" stroke="${c.dark}" stroke-width="1"/>${code(t, 31, 31, 12, c.ink, c.dark)}`;
    },
  };
  const KIND = { nfl: 'helmet', 'college-football': 'helmet', cfb: 'helmet', ncaaf: 'helmet', nba: 'jersey', wnba: 'jersey', 'mens-college-basketball': 'jersey', ncaab: 'jersey', nhl: 'sweater', mlb: 'cap' };
  function svg(league, team, size) {
    size = size || 34; const c = pair(team || {}), kind = KIND[String(league || '').toLowerCase()] || 'jersey', g = 'tm' + (++uid);
    return `<svg class="tmk" viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-label="${String((team && (team.name || team.abbr)) || 'Team').replace(/[<&>"]/g, '')}">${SHAPES[kind](c, team && team.abbr, g)}</svg>`;
  }
  function player(league, team, number, size) {
    size = size || 34; const c = pair(team || {}), g = 'tp' + (++uid);
    return `<svg class="tmk" viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-label="Player">${SHAPES.jersey(c, number != null && number !== '' ? String(number) : (team && team.abbr), g)}</svg>`;
  }
  window.TeamMark = { svg, player, pair };
})();
