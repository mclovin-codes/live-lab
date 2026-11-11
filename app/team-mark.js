/* Team marks (owner: Gold). No league or team logos and no player photos anywhere: a drawn object per sport,
 * tinted with the team's two colours and carrying the team's short code.
 *   NFL and college football: a speed-style helmet in side profile (shaded shell, vents, multi-bar mask). All four share one light, from the top left. NBA: a jersey. NHL: a sweater. MLB: a cap.
 * window.TeamMark.svg(league, team, size) -> SVG string. team: {abbr, color, alt} (hex with or without '#').
 * window.TeamMark.player(league, team, number, size) (alias playerMark) -> a player mark per sport in both team colours with the number on the chest:
 *   football jersey with pads and sleeve stripes, basketball tank, hockey sweater, baseball button-front with piping.
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
    const txt = contrast(p, a) >= 3 ? a : ink, dim = lum(p) < .045;
    return { p, a, ink, txt, dim, dark: shade(p, .62), light: dim ? shade(p, 1.9) : shade(p, 1.25), edge: dim ? '#C9D2DC' : shade(p, .62) };
  }
  let uid = 0;
  const code = (t, x, y, fs, ink, a) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="'Barlow Condensed','Bebas Neue',Arial Narrow,sans-serif" font-weight="800" font-size="${fs}" fill="${ink}" stroke="${a}" stroke-width=".6" paint-order="stroke" letter-spacing=".3">${String(t || '').slice(0, 4).replace(/[<&>]/g, '')}</text>`;
  function grad(id, c) { return `<radialGradient id="${id}" cx=".32" cy=".2" r="1" fx=".3" fy=".16"><stop offset="0" stop-color="${c.light}"/><stop offset=".45" stop-color="${c.p}"/><stop offset="1" stop-color="${c.dark}"/></radialGradient>`; }
  const gloss = d => `<path d="${d}" stroke="#fff" stroke-opacity=".38" stroke-width="2.4" stroke-linecap="round" fill="none"/>`;
  const SHAPES = {
    helmet(c, t, g) { // speed-style shell in side profile, facing right; shell in the team colour, mask and clips neutral, vents dark
      const M = c.a, Ms = '#2A323C';
      return `<defs>${grad(g, c)}</defs>`
        + `<path d="M8.5 41 C6 27 13 11.5 31 9 C45 7.2 55.5 15 57 27 L57.4 32.5 C57.5 34.6 56 36 54 36 L48 36 L46.5 43 C45.6 48.6 41.6 51.6 35.5 51.6 L24 51.6 C15.5 51.6 10.4 47.6 8.5 41 Z" fill="url(#${g})" stroke="${c.edge}" stroke-width="1.2"/>`
        + `<path d="M48 36 L46.5 43 C45.6 48.6 41.6 51.6 35.5 51.6 L30 51.6 C33 48 36 43 38 36 Z" fill="${c.dark}" opacity=".35"/>`
        + `<path d="M29.5 9.4 C40 8.4 50.5 12.4 55.6 21.5" stroke="${c.a}" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M29.5 9.4 C40 8.4 50.5 12.4 55.6 21.5" stroke="${c.dark}" stroke-opacity=".5" stroke-width=".7" fill="none" transform="translate(0 2)"/>`
        + gloss('M13.5 27 C16 17.5 23 12.4 32 11.6')
        + `<path d="M21.5 15.2 L26 13.4 M29 12 L34.5 11.4 M37.5 11.6 L42.5 12.6" stroke="#0B1118" stroke-opacity=".8" stroke-width="2.3" stroke-linecap="round"/><path d="M11.6 35.5 L15.6 33.8" stroke="#0B1118" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>`
        + `<circle cx="31.5" cy="38.5" r="3.4" fill="${c.dark}" stroke="#0B1118" stroke-opacity=".5" stroke-width="1"/>`
        + `<path d="M28 45.5 C32 43.6 38.5 43.6 42.6 45.6 L41.6 50.6 L30 51.2 Z" fill="#20262E" opacity=".85"/>`
        + `<g fill="none" stroke-linecap="round"><path d="M53.5 25.5 C60 26.2 63 31 63 37.6 C63 44.6 59.6 49.8 51.5 52 M49.5 29.4 C55 29.2 59.6 30 62.3 32 M48 36.4 L62.9 37 M46.6 43.8 L61.5 44.2 M56.8 27 L58.2 50" stroke="${Ms}" stroke-width="3.6"/><path d="M53.5 25.5 C60 26.2 63 31 63 37.6 C63 44.6 59.6 49.8 51.5 52 M49.5 29.4 C55 29.2 59.6 30 62.3 32 M48 36.4 L62.9 37 M46.6 43.8 L61.5 44.2 M56.8 27 L58.2 50" stroke="${M}" stroke-width="2.1"/></g>`
        + `<path d="M42 49.6 C46 52.6 50 53 53 52.2" stroke="#20262E" stroke-width="1.6" fill="none" stroke-linecap="round"/>`
        + `<circle cx="53.4" cy="25.6" r="1.3" fill="#C9D2DC"/><circle cx="48.2" cy="36.4" r="1.3" fill="#C9D2DC"/><circle cx="46.8" cy="43.8" r="1.3" fill="#C9D2DC"/>`
        + code(t, 31, 29, 12, c.txt, c.dark);
    },
    jersey(c, t, g) { // basketball tank top
      return `<defs>${grad(g, c)}</defs><path d="M20 6 L27 6 C28 11 36 11 37 6 L44 6 L46 16 C49 18 51 21 51 25 L51 58 L13 58 L13 25 C13 21 15 18 18 16 Z" fill="url(#${g})" stroke="${c.edge}" stroke-width="1.2"/><path d="M27 6 C28 11 36 11 37 6" stroke="${c.a}" stroke-width="2.6" fill="none"/><path d="M18 16 C15 18 13 21 13 25 M46 16 C49 18 51 21 51 25" stroke="${c.a}" stroke-width="2.6" fill="none"/><path d="M13 53 L51 53" stroke="${c.a}" stroke-width="2.4"/>${gloss('M19 22 C17 26 17 34 17.4 44')}${code(t, 32, 39, 14, c.txt, c.dark)}`;
    },
    sweater(c, t, g) { // hockey sweater with sleeves and stripes
      return `<defs>${grad(g, c)}</defs><path d="M22 7 L28 9 C30 12 34 12 36 9 L42 7 L56 14 L60 34 L50 36 L48 26 L48 58 L16 58 L16 26 L14 36 L4 34 L8 14 Z" fill="url(#${g})" stroke="${c.edge}" stroke-width="1.2"/><path d="M16 46 L48 46 M16 50 L48 50" stroke="${c.a}" stroke-width="2.6"/><path d="M6.4 27 L15 28.5 M49 28.5 L57.6 27" stroke="${c.a}" stroke-width="2.6"/><path d="M28 9 C30 12 34 12 36 9 L34 14 L30 14 Z" fill="${c.a}"/>${gloss('M10 18 C14 15 18 14 21 13.6')}${gloss('M19.5 30 L19.5 42')}${code(t, 32, 38, 13, c.txt, c.dark)}`;
    },
    cap(c, t, g) { // baseball cap, three-quarter view
      return `<defs>${grad(g, c)}</defs><path d="M8 40 C8 20 20 10 34 10 C48 10 56 22 56 38 Z" fill="url(#${g})" stroke="${c.edge}" stroke-width="1.2"/><path d="M34 10 L32 38 M20 15 C24 26 25 33 25 39 M47 16 C45 25 44 32 44 38" stroke="${c.dark}" stroke-opacity=".55" stroke-width="1" fill="none"/><circle cx="34" cy="10.5" r="2.4" fill="${c.a}"/>${gloss('M14 30 C15 22 21 15 29 13')}<path d="M4 40 C14 36 48 35 62 40 C60 46 46 49 32 48 C18 48 6 46 4 40 Z" fill="${c.a}" stroke="${c.dark}" stroke-width="1"/>${code(t, 31, 31, 12, c.txt, c.dark)}`;
    },
  };
  // Player marks (one per sport, the number on the chest, both team colours): football jersey with pads and sleeve stripes,
  // basketball tank, hockey sweater, baseball button-front with piping.
  const num = (t, y, fs, c) => `<text x="32" y="${y}" text-anchor="middle" font-family="'Barlow Condensed','Bebas Neue',Arial Narrow,sans-serif" font-weight="800" font-size="${fs}" fill="${c.txt}" stroke="${c.dark}" stroke-width="1.2" paint-order="stroke">${String(t == null ? '' : t).slice(0, 3).replace(/[<&>]/g, '')}</text>`;
  const PLAYER = {
    nfl(c, n, g) { return `<defs>${grad(g, c)}</defs><path d="M10 14 L22 8 C25 12.5 39 12.5 42 8 L54 14 L60 29 L50 32 L48 25 L48 58 L16 58 L16 25 L14 32 L4 29 Z" fill="url(#${g})" stroke="${c.edge}" stroke-width="1.2"/><path d="M6.6 23.5 L15.4 21 M48.6 21 L57.4 23.5 M5.6 26.4 L14.8 24 M49.2 24 L58.4 26.4" stroke="${c.a}" stroke-width="1.8"/><path d="M24.5 9.6 L32 17 L39.5 9.6" stroke="${c.a}" stroke-width="2.6" fill="none" stroke-linejoin="round"/>${gloss('M12 17 C15 14.5 18 13 21 12')}${num(n, 46, 22, c)}`; },
    nba(c, n, g) { return `<defs>${grad(g, c)}</defs><path d="M20 6 L27 6 C28 11 36 11 37 6 L44 6 L46 16 C49 18 51 21 51 25 L51 58 L13 58 L13 25 C13 21 15 18 18 16 Z" fill="url(#${g})" stroke="${c.edge}" stroke-width="1.2"/><path d="M27 6 C28 11 36 11 37 6 M18 16 C15 18 13 21 13 25 M46 16 C49 18 51 21 51 25" stroke="${c.a}" stroke-width="2.6" fill="none"/><path d="M13 53 L51 53" stroke="${c.a}" stroke-width="2.4"/>${gloss('M19 22 C17 26 17 34 17.4 44')}${num(n, 44, 22, c)}`; },
    nhl(c, n, g) { return `<defs>${grad(g, c)}</defs><path d="M22 7 L28 9 C30 12 34 12 36 9 L42 7 L56 14 L60 34 L50 36 L48 26 L48 58 L16 58 L16 26 L14 36 L4 34 L8 14 Z" fill="url(#${g})" stroke="${c.edge}" stroke-width="1.2"/><path d="M16 49 L48 49 M16 53 L48 53 M6.4 27 L15 28.5 M49 28.5 L57.6 27" stroke="${c.a}" stroke-width="2.6"/><path d="M28 9 C30 12 34 12 36 9 L34 14 L30 14 Z" fill="${c.a}"/>${gloss('M10 18 C14 15 18 14 21 13.6')}${num(n, 41, 20, c)}`; },
    mlb(c, n, g) { return `<defs>${grad(g, c)}</defs><path d="M18 8 L26 7 C28 11 36 11 38 7 L46 8 L58 18 L53 28 L46 23 L46 58 L18 58 L18 23 L11 28 L6 18 Z" fill="url(#${g})" stroke="${c.edge}" stroke-width="1.2"/><path d="M26 7 C28 11 36 11 38 7 M32 10.6 L32 58 M8.6 21.6 L13.6 26 M50.4 26 L55.4 21.6" stroke="${c.a}" stroke-width="1.8" fill="none"/><circle cx="34" cy="20" r=".9" fill="${c.a}"/><circle cx="34" cy="30" r=".9" fill="${c.a}"/><circle cx="34" cy="50" r=".9" fill="${c.a}"/>${gloss('M21 24 C20 30 20 38 20.4 46')}${num(n, 45, 18, c)}`; },
  };
  const PKIND = { nfl: 'nfl', 'college-football': 'nfl', cfb: 'nfl', ncaaf: 'nfl', nba: 'nba', wnba: 'nba', 'mens-college-basketball': 'nba', ncaab: 'nba', nhl: 'nhl', mlb: 'mlb' };
  const KIND = { nfl: 'helmet', 'college-football': 'helmet', cfb: 'helmet', ncaaf: 'helmet', nba: 'jersey', wnba: 'jersey', 'mens-college-basketball': 'jersey', ncaab: 'jersey', nhl: 'sweater', mlb: 'cap' };
  function svg(league, team, size) {
    size = size || 34; const c = pair(team || {}), kind = KIND[String(league || '').toLowerCase()] || 'jersey', g = 'tm' + (++uid);
    return `<svg xmlns="http://www.w3.org/2000/svg" class="tmk" viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-label="${String((team && (team.name || team.abbr)) || 'Team').replace(/[<&>"]/g, '')}">${SHAPES[kind](c, team && team.abbr, g)}</svg>`;
  }
  function player(league, team, number, size) {
    size = size || 34; const c = pair(team || {}), g = 'tp' + (++uid), k = PKIND[String(league || '').toLowerCase()] || 'nba';
    const n = number != null && number !== '' ? String(number) : (team && team.abbr);
    return `<svg xmlns="http://www.w3.org/2000/svg" class="tmk" viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-label="Player${number != null && number !== '' ? ' number ' + String(number).replace(/[<&>"]/g, '') : ''}">${PLAYER[k](c, n, g)}</svg>`;
  }
  window.TeamMark = { svg, player, playerMark: player, pair };
})();
