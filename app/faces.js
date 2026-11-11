/* Faces (owner: Gold): the Rush app's preset avatars (rush-arena constants/avatars.ts, components/Avatar.tsx).
 * An Ionicon glyph in a disc tinted with the preset colour (fill colour+22, border colour+55).
 * You: the preset you chose in Edit profile ('rush-profile' in localStorage). Stand-ins: a stable preset by id.
 * window.RushFace.html(player, size, plain) -> HTML. player: {id, name, me?}. */
(function () {
  const AVATARS = [
    { key: 'bolt', icon: 'flash', color: '#00BFFF' }, { key: 'flame', icon: 'flame', color: '#FB923C' },
    { key: 'baseball', icon: 'baseball', color: '#E4E4E7' }, { key: 'basketball', icon: 'basketball', color: '#F97316' },
    { key: 'football', icon: 'american-football', color: '#A16207' }, { key: 'trophy', icon: 'trophy', color: '#FBBF24' },
    { key: 'skull', icon: 'skull', color: '#9AA0A6' }, { key: 'rocket', icon: 'rocket', color: '#A78BFA' },
    { key: 'diamond', icon: 'diamond', color: '#2DD4BF' }, { key: 'dice', icon: 'dice', color: '#F25C7A' },
    { key: 'eye', icon: 'eye', color: '#5B8DEF' }, { key: 'crown', icon: 'ribbon', color: '#34D399' },
  ];
  const BY = {}; AVATARS.forEach(a => BY[a.key] = a);
  // Banners a player can put behind their profile: gradients in the app's own blues and accents.
  const BANNERS = [
    { key: 'night', css: 'linear-gradient(160deg,#0E2A40 0%,#121A23 75%)' }, { key: 'electric', css: 'linear-gradient(135deg,#00BFFF 0%,#0A6FB0 45%,#121A23 85%)' },
    { key: 'field', css: 'linear-gradient(160deg,#0F3B2A 0%,#121A23 75%)' }, { key: 'ember', css: 'linear-gradient(160deg,#4A2410 0%,#121A23 75%)' },
    { key: 'royal', css: 'linear-gradient(160deg,#2A2150 0%,#121A23 75%)' }, { key: 'gold', css: 'linear-gradient(160deg,#4A3A0E 0%,#121A23 75%)' },
  ];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const PK = 'rush-profile';
  const prof = () => { try { return JSON.parse(localStorage.getItem(PK) || '{}') || {}; } catch (e) { return {}; } };
  const save = p => { try { localStorage.setItem(PK, JSON.stringify(Object.assign(prof(), p))); } catch (e) {} };
  const h = s => { let x = 0; for (const c of String(s || '')) x = (x * 31 + c.charCodeAt(0)) >>> 0; return x; };
  const isMe = p => !!p && (p.me || p.id === 'me');
  function meta(p) { if (isMe(p)) { const k = prof().avatar; if (k && BY[k]) return BY[k]; } return AVATARS[h((p && (p.id || p.name)) || '?') % AVATARS.length]; }
  function html(p, size, plain, ring) {
    size = size || 34; const m = meta(p), tag = plain ? 'span' : 'a', href = plain ? '' : ` href="player.html${isMe(p) ? '' : '?u=' + encodeURIComponent(p.id)}"`;
    return `<${tag} class="rf${isMe(p) ? ' me' : ''}"${href} style="width:${size}px;height:${size}px;background:${m.color}22;border-color:${m.color}66;${ring ? 'box-shadow:0 0 0 2px #0B1118,0 0 0 3.5px ' + ring + ';' : ''}" aria-label="${esc(p && p.name)}"><ion-icon name="${m.icon}" style="font-size:${Math.round(size * .55)}px;color:${m.color}"></ion-icon></${tag}>`;
  }
  const CSS = `.rf{display:inline-grid;place-items:center;flex:none;border-radius:50%;border:1.5px solid;text-decoration:none;box-sizing:border-box}.rf.me{box-shadow:0 0 0 2px #0B1118,0 0 0 3.5px #00BFFF}.rf ion-icon{display:block}`;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  if (!document.querySelector('script[data-ionicons]')) {
    const s1 = document.createElement('script'); s1.type = 'module'; s1.dataset.ionicons = '1'; s1.src = 'https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js'; document.head.appendChild(s1);
  }
  window.RushFace = { html, meta, AVATARS, BANNERS, profile: prof, saveProfile: save, banner: () => { const b = BANNERS.find(x => x.key === prof().banner); return (b || BANNERS[0]).css; } };
})();
