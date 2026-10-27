// gummy.js — 투명 구미 젤리 그림 라이브러리 (브라우저용)
// design/mockups-2.5d/{lib,concepts,gummy,scenes}.cjs 의 그림 코드를 게임에서 쓰도록 옮겼다.
// 모든 그림은 SVG 문자열로 만든 뒤 <img> 또는 캔버스 스프라이트로 굽는다 (글자는 들어가지 않음 → 웹폰트 문제 없음).
window.Gummy = (() => {
  'use strict';
  let _id = 0;
  const uid = p => p + (++_id);
  const C = { pink: '#ff5f8a', blue: '#4fb4ff', yellow: '#ffd23f', green: '#5ed46a', purple: '#a76bff', peach: '#ff9f7a', mint: '#4fdcc4', lilac: '#ffb3e0', mal: '#ff7fae' };
  const HILLS = ['#b9efc9', '#9be8b3', '#7fdc9a', '#6ad28b'];
  // 3D 그림(jelly3d.js)이 켜져 있으면 그 그림을 <image>로 넣는다. 꺼져 있으면 null → 아래 SVG 그림을 그대로 쓴다
  const tex3d = (kind, opt, px) => (window.Jelly3D ? window.Jelly3D.bake(kind, opt, px) : null);
  const image3d = (href, x, y, w, h, extra = '') => `<image href="${href}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none" ${extra}/>`;
  // 미리 구운 3D 지도 소품: u = 그림 1칸의 크기(px). 그림은 7.2칸 정사각형, 땅(발밑 y)은 그림 위에서 6.3칸 아래(가운데보다 2.7칸)
  const prop3d = (kind, opt, x, y, u) => { const t3 = tex3d(kind, opt, 7.2 * u * PX); return t3 ? image3d(t3, x - 3.6 * u, y - 6.3 * u, 7.2 * u, 7.2 * u) : null; };
  const PX = 3;   // 3D 그림 해상도 기준 (화면 배율 3배 휴대폰)

  // ---------- 색 ----------
  function hex2rgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function rgb2hex(r, g, b) { return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
  function mix(a, b, t) { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }
  const light = (c, t) => mix(c, '#ffffff', t), dark = (c, t) => mix(c, '#1a0a3a', t);

  // ---------- 필터 ----------
  // lx, ly: 광택(glass) 필터의 빛 위치. 작은 스프라이트는 자기 중심 기준으로 넘긴다.
  function defs(lx = 100, ly = -120) {
    return `<defs>
  <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>
  <filter id="soft6" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="6"/></filter>
  <filter id="soft12" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>
  <filter id="soft24" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="24"/></filter>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="glowBig" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="14" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="gelSmall" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
    <feGaussianBlur in="SourceAlpha" stdDeviation="2.2" result="blur"/>
    <feSpecularLighting in="blur" surfaceScale="4" specularConstant="0.8" specularExponent="24" lighting-color="#ffffff" result="spec"><fePointLight x="${lx}" y="${ly}" z="260"/></feSpecularLighting>
    <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn"/>
    <feDiffuseLighting in="blur" surfaceScale="3" diffuseConstant="1" lighting-color="#ffffff" result="diff"><feDistantLight azimuth="235" elevation="60"/></feDiffuseLighting>
    <feComposite in="diff" in2="SourceAlpha" operator="in" result="diffIn"/>
    <feComposite in="SourceGraphic" in2="diffIn" operator="arithmetic" k1="0.72" k2="0.4" k3="0" k4="0" result="lit"/>
    <feComposite in="lit" in2="specIn" operator="arithmetic" k1="0" k2="1" k3="0.7" k4="0" result="out"/>
    <feComposite in="out" in2="SourceAlpha" operator="in"/>
  </filter>
  <filter id="glass" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">
    <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="blur"/>
    <feSpecularLighting in="blur" surfaceScale="9" specularConstant="1.1" specularExponent="40" lighting-color="#fff" result="spec"><fePointLight x="${lx}" y="${ly}" z="300"/></feSpecularLighting>
    <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn"/>
    <feSpecularLighting in="blur" surfaceScale="9" specularConstant="0.5" specularExponent="12" lighting-color="#ffd6f2" result="rim"><fePointLight x="${lx + 200}" y="${ly + 1020}" z="200"/></feSpecularLighting>
    <feComposite in="rim" in2="SourceAlpha" operator="in" result="rimIn"/>
    <feComposite in="SourceGraphic" in2="specIn" operator="arithmetic" k1="0" k2="1" k3="0.9" k4="0" result="a"/>
    <feComposite in="a" in2="rimIn" operator="arithmetic" k1="0" k2="1" k3="0.7" k4="0" result="b"/>
    <feComposite in="b" in2="SourceAlpha" operator="in"/>
  </filter>
  <filter id="bloom" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8" result="b"/><feComposite in="b" in2="SourceGraphic" operator="arithmetic" k1="0" k2="0.9" k3="1" k4="0"/></filter>
  <filter id="dropShadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#2a0b4e" flood-opacity="0.35"/></filter>
  <radialGradient id="specHi" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff" stop-opacity="0.95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <linearGradient id="glassTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  </defs>`;
  }

  // ---------- 그라데이션 ----------
  let gradStore = '';
  function radial(c1, c2, c3, cx = 0.35, cy = 0.3, r = 0.75) {
    const id = uid('rg');
    gradStore += `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"><stop offset="0" stop-color="${c1}"/><stop offset="0.55" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/></radialGradient>`;
    return `url(#${id})`;
  }
  function linear(stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) {
    const id = uid('lg');
    gradStore += `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c, op]) => `<stop offset="${o}" stop-color="${c}"${op !== undefined ? ` stop-opacity="${op}"` : ''}/>`).join('')}</linearGradient>`;
    return `url(#${id})`;
  }
  function flushGrads() { const g = gradStore; gradStore = ''; return `<defs>${g}</defs>`; }

  // ---------- 기본 조각 ----------
  const groundShadow = (x, y, rx, ry, op = 0.3, blur = 'soft6') => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#2a0b4e" opacity="${op}" filter="url(#${blur})"/>`;
  const blobPath = (x, y, rx, ry) => `M${x - rx} ${y + ry * 0.2} C${x - rx} ${y - ry * 0.5} ${x - rx * 0.6} ${y - ry} ${x} ${y - ry} C${x + rx * 0.6} ${y - ry} ${x + rx} ${y - ry * 0.5} ${x + rx} ${y + ry * 0.2} C${x + rx} ${y + ry * 0.8} ${x + rx * 0.7} ${y + ry} ${x} ${y + ry} C${x - rx * 0.7} ${y + ry} ${x - rx} ${y + ry * 0.8} ${x - rx} ${y + ry * 0.2} Z`;
  const earsPath = (x, y, rx, ry, sx) => `M${x + sx * rx * 0.6} ${y - ry * 0.75} C${x + sx * rx * 1.15} ${y - ry * 0.95} ${x + sx * rx * 1.5} ${y - ry * 0.1} ${x + sx * rx * 1.3} ${y + ry * 0.55} C${x + sx * rx * 1.2} ${y + ry * 0.85} ${x + sx * rx * 0.9} ${y + ry * 0.8} ${x + sx * rx * 0.85} ${y + ry * 0.45} C${x + sx * rx * 0.8} ${y + ry * 0.1} ${x + sx * rx * 0.75} ${y - ry * 0.4} ${x + sx * rx * 0.6} ${y - ry * 0.75}Z`;

  // 큰 눈 얼굴. mood: happy / joy / angry / worried / o
  function bigEyes(x, y, s, mood = 'happy', { iris = '#4a1d7a' } = {}) {
    const e = dx => `<ellipse cx="${x + dx * s}" cy="${y}" rx="${6 * s}" ry="${7.5 * s}" fill="${iris}"/><circle cx="${x + dx * s - 2 * s}" cy="${y - 3 * s}" r="${2.4 * s}" fill="#fff"/><circle cx="${x + dx * s + 2 * s}" cy="${y + 2.5 * s}" r="${1.2 * s}" fill="#fff"/>`;
    let eyes = e(-10) + e(10);
    let mouth = `<path d="M${x - 3 * s} ${y + 9 * s} Q${x} ${y + 12 * s} ${x + 3 * s} ${y + 9 * s}" stroke="${iris}" stroke-width="${1.8 * s}" fill="none" stroke-linecap="round"/>`;
    if (mood === 'joy') {
      eyes = `<path d="M${x - 15 * s} ${y + 1 * s} Q${x - 10 * s} ${y - 6 * s} ${x - 5 * s} ${y + 1 * s}" stroke="${iris}" stroke-width="${2.6 * s}" fill="none" stroke-linecap="round"/><path d="M${x + 5 * s} ${y + 1 * s} Q${x + 10 * s} ${y - 6 * s} ${x + 15 * s} ${y + 1 * s}" stroke="${iris}" stroke-width="${2.6 * s}" fill="none" stroke-linecap="round"/>`;
      mouth = `<path d="M${x - 5 * s} ${y + 7 * s} Q${x} ${y + 15 * s} ${x + 5 * s} ${y + 7 * s} Z" fill="${iris}"/><path d="M${x - 2.5 * s} ${y + 11 * s} Q${x} ${y + 13.5 * s} ${x + 2.5 * s} ${y + 11 * s} Z" fill="#ff7aa5"/>`;
    }
    if (mood === 'angry') {
      eyes = e(-10) + e(10) + `<path d="M${x - 17 * s} ${y - 9 * s} L${x - 5 * s} ${y - 4 * s}" stroke="${iris}" stroke-width="${2.8 * s}" stroke-linecap="round"/><path d="M${x + 17 * s} ${y - 9 * s} L${x + 5 * s} ${y - 4 * s}" stroke="${iris}" stroke-width="${2.8 * s}" stroke-linecap="round"/>`;
      mouth = `<path d="M${x - 6 * s} ${y + 11 * s} Q${x} ${y + 6 * s} ${x + 6 * s} ${y + 11 * s}" stroke="${iris}" stroke-width="${2 * s}" fill="none" stroke-linecap="round"/>`;
    }
    if (mood === 'worried') mouth = `<path d="M${x - 4 * s} ${y + 10 * s} Q${x} ${y + 7 * s} ${x + 4 * s} ${y + 10 * s}" stroke="${iris}" stroke-width="${1.8 * s}" fill="none" stroke-linecap="round"/>`;
    if (mood === 'o') mouth = `<ellipse cx="${x}" cy="${y + 9 * s}" rx="${2.5 * s}" ry="${3.2 * s}" fill="${iris}"/>`;
    const blush = `<ellipse cx="${x - 17 * s}" cy="${y + 7 * s}" rx="${5 * s}" ry="${3 * s}" fill="#ff6d9a" opacity="0.5"/><ellipse cx="${x + 17 * s}" cy="${y + 7 * s}" rx="${5 * s}" ry="${3 * s}" fill="#ff6d9a" opacity="0.5"/>`;
    return blush + eyes + mouth;
  }

  // 투명 구미 젤리 (속이 비치는 몸, 안쪽 발광, 아래쪽 굴절 띠). ears=true 면 말랑이
  function jelly(x, y, r, color, { ears = false, mood = 'happy', shadow = true, faceScale = 1 } = {}) {
    const rx = r, ry = r * 0.92, path = blobPath(x, y, rx, ry), fs = r / 38 * faceScale;
    let s = '';
    if (shadow) s += groundShadow(x, y + ry * 0.98, rx * 0.95, ry * 0.22, 0.25);
    const t3 = tex3d('jelly', { color, mood, ears }, r * 2.4 * PX);
    if (t3) return s + image3d(t3, x - r * 1.2, y - r * 1.2, r * 2.4, r * 2.4);
    const body = radial(light(color, 0.25), color, dark(color, 0.15), 0.5, 0.55, 0.75);
    if (ears) s += `<g transform="translate(${x} ${y}) scale(0.8 0.86) translate(${-x} ${-y})" filter="url(#glass)"><path d="${earsPath(x, y, rx, ry, -1)}" fill="${color}" opacity="0.85"/><path d="${earsPath(x, y, rx, ry, 1)}" fill="${color}" opacity="0.85"/></g>`;
    s += `<g filter="url(#glass)"><path d="${path}" fill="${body}" opacity="0.88"/></g>`;
    s += `<path d="${path}" fill="${radial('#fff', light(color, 0.2), color, 0.5, 0.6, 0.55)}" opacity="0.35"/>`;
    s += `<path d="${path}" fill="${linear([[0, '#fff', 0], [0.62, '#fff', 0], [0.82, '#fff', 0.5], [1, light(color, 0.4), 0.2]], 0, 0, 0, 1)}"/>`;
    s += `<ellipse cx="${x - rx * 0.4}" cy="${y - ry * 0.52}" rx="${rx * 0.26}" ry="${ry * 0.14}" fill="#fff" opacity="0.95" transform="rotate(-28 ${x - rx * 0.4} ${y - ry * 0.52})"/><circle cx="${x - rx * 0.1}" cy="${y - ry * 0.74}" r="${r * 0.07}" fill="#fff"/>`;
    s += `<path d="${path}" fill="none" stroke="#fff" stroke-width="${r * 0.05}" opacity="0.45"/>`;
    s += bigEyes(x, y + ry * 0.05, fs * 0.95, mood);
    return s;
  }

  // 유리 거품 (거품 판). trapped: 안에 갇힌 친구 색
  function bubble(x, y, r, color, { trapped = null, mood = 'happy' } = {}) {
    let s = `<circle cx="${x}" cy="${y + r * 0.15}" r="${r * 0.95}" fill="#7a2d5e" opacity="0.18" filter="url(#soft)"/>`;
    // 3D 거품 얼굴은 기본 표정뿐 → 다른 표정(고철 거품의 화난 얼굴 등)은 SVG 그림 그대로
    const t3 = (trapped || mood === 'happy') ? tex3d('bubble', { color: trapped ? '#e6f2ff' : color, mood: trapped ? 'none' : 'happy' }, r * 2.4 * PX) : null;
    if (t3 && trapped) {
      // 갇힌 친구: 걱정하는 3D 젤리 + 반투명 거품 (바깥 테두리는 거품 색)
      return s + jelly(x, y + r * 0.12, r * 0.56, trapped, { shadow: false, mood: 'worried' }) +
        `<g opacity="0.55">${image3d(t3, x - r * 1.2, y - r * 1.2, r * 2.4, r * 2.4)}</g>` +
        `<circle cx="${x}" cy="${y}" r="${r * 0.94}" fill="none" stroke="${color}" stroke-width="${r * 0.12}" opacity="0.85"/>` +
        `<ellipse cx="${x - r * 0.38}" cy="${y - r * 0.45}" rx="${r * 0.25}" ry="${r * 0.12}" fill="#fff" opacity="0.9" transform="rotate(-35 ${x - r * 0.38} ${y - r * 0.45})"/>`;
    }
    if (t3) return s + image3d(t3, x - r * 1.2, y - r * 1.2, r * 2.4, r * 2.4);
    s += `<g filter="url(#glass)"><circle cx="${x}" cy="${y}" r="${r}" fill="${radial(light(color, 0.35), color, dark(color, 0.1), 0.5, 0.55, 0.75)}" opacity="0.88"/></g>`;
    s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${radial('#fff', light(color, 0.2), color, 0.5, 0.6, 0.55)}" opacity="0.35"/>`;
    s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${linear([[0, '#fff', 0], [0.6, '#fff', 0], [0.82, '#fff', 0.45], [1, light(color, 0.4), 0.15]], 0, 0, 0, 1)}"/>`;
    if (trapped) s += jelly(x, y + r * 0.12, r * 0.56, trapped, { shadow: false, mood: 'worried', faceScale: 0.95 });
    else s += bigEyes(x, y + r * 0.05, r / 34, mood);
    s += `<ellipse cx="${x - r * 0.38}" cy="${y - r * 0.42}" rx="${r * 0.26}" ry="${r * 0.14}" fill="#fff" opacity="0.95" transform="rotate(-35 ${x - r * 0.38} ${y - r * 0.42})"/><circle cx="${x + r * 0.3}" cy="${y - r * 0.55}" r="${r * 0.07}" fill="#fff" opacity="0.9"/>`;
    s += `<circle cx="${x}" cy="${y}" r="${r - 0.6}" fill="none" stroke="#fff" stroke-width="1.2" opacity="0.5"/>`;
    return s;
  }

  // 젤리 블록 집: 반투명 둥근 몸통 + 젤리 돔 지붕. (x,y) = 앞면 아래 가운데
  function house(x, y, o = {}) {
    const s = o.s || 1, wall = o.wall || '#ffe1f0', roof = o.roof || '#ff8fb1', w = (o.w || 64) * s, h = (o.h || 52) * s, d = 22 * s;
    let g = groundShadow(x + 6 * s, y + 2, w * 0.8, h * 0.14, 0.3);
    // 미리 구운 3D 집 (지붕 색·벽 색 조합별). 3D 그림 1칸 = 18.3s, 땅이 그림 중심보다 2.7칸 아래
    const t3 = !o.w && !o.h && tex3d('house', { color: roof, mood: wall }, 132 * s * PX);
    if (t3) return g + image3d(t3, x - 66 * s, y - 49.4 * s - 66 * s, 132 * s, 132 * s);
    g += `<g filter="url(#glass)"><rect x="${x - w / 2}" y="${y - h}" width="${w}" height="${h}" rx="${10 * s}" fill="${radial(light(wall, 0.3), wall, dark(wall, 0.1), 0.4, 0.3, 0.9)}" opacity="0.92"/></g>`;
    g += `<path d="M${x + w / 2 - 6 * s} ${y - h + 10 * s} Q${x + w / 2 + d} ${y - h + 2 * s} ${x + w / 2 + d - 4 * s} ${y - 6 * s} L${x + w / 2 - 6 * s} ${y} Z" fill="${dark(wall, 0.22)}" opacity="0.8"/>`;
    g += `<g filter="url(#glass)"><path d="M${x - w / 2 - 6 * s} ${y - h + 8 * s} Q${x} ${y - h - h * 0.9} ${x + w / 2 + 6 * s} ${y - h + 8 * s} Z" fill="${radial(light(roof, 0.4), roof, dark(roof, 0.2), 0.4, 0.4, 0.8)}" opacity="0.9"/></g>`;
    g += `<path d="M${x - w / 2 - 6 * s} ${y - h + 8 * s} Q${x} ${y - h - h * 0.9} ${x + w / 2 + 6 * s} ${y - h + 8 * s} Z" fill="${linear([[0, '#fff', 0.5], [0.6, '#fff', 0]], 0, 0, 0, 1)}"/>`;
    g += `<circle cx="${x}" cy="${y - h - h * 0.42}" r="${5 * s}" fill="${light(roof, 0.3)}"/><circle cx="${x}" cy="${y - h - h * 0.42}" r="${8 * s}" fill="${light(roof, 0.3)}" opacity="0.5" filter="url(#soft6)"/>`;
    g += `<path d="M${x - 8 * s} ${y} L${x - 8 * s} ${y - 18 * s} Q${x} ${y - 30 * s} ${x + 8 * s} ${y - 18 * s} L${x + 8 * s} ${y} Z" fill="${dark(roof, 0.1)}" opacity="0.9"/>`;
    const win = (wx, wy) => `<circle cx="${wx}" cy="${wy}" r="${6 * s}" fill="#fff6c8"/><circle cx="${wx}" cy="${wy}" r="${6 * s}" fill="none" stroke="${dark(wall, 0.25)}" stroke-width="${1.5 * s}"/><circle cx="${wx}" cy="${wy}" r="${9 * s}" fill="#ffd36a" opacity="0.4" filter="url(#soft6)"/>`;
    g += win(x - w * 0.28, y - h * 0.55) + win(x + w * 0.28, y - h * 0.55);
    g += `<ellipse cx="${x - w * 0.3}" cy="${y - h * 0.85}" rx="${w * 0.14}" ry="${h * 0.06}" fill="#fff" opacity="0.7" transform="rotate(-20 ${x - w * 0.3} ${y - h * 0.85})"/>`;
    return g;
  }
  function tree(x, y, s = 1, c = '#6fcf6a') {
    let g = groundShadow(x + 4 * s, y + 2, 20 * s, 5 * s, 0.25);
    const t3 = tex3d('tree', { color: c }, 79 * s * PX);
    if (t3) return g + image3d(t3, x - 39.5 * s, y - 29.6 * s - 39.5 * s, 79 * s, 79 * s);
    g += `<rect x="${x - 3 * s}" y="${y - 20 * s}" width="${6 * s}" height="${20 * s}" rx="${3 * s}" fill="#c98b63"/>`;
    g += `<g filter="url(#glass)"><circle cx="${x}" cy="${y - 36 * s}" r="${20 * s}" fill="${radial(light(c, 0.3), c, dark(c, 0.1), 0.45, 0.5, 0.75)}" opacity="0.9"/></g><ellipse cx="${x - 7 * s}" cy="${y - 45 * s}" rx="${6 * s}" ry="${3 * s}" fill="#fff" opacity="0.8" transform="rotate(-25 ${x - 7 * s} ${y - 45 * s})"/>`;
    return g;
  }
  function cloud(x, y, s = 1, op = 0.95, tint = '#ffffff', shade = '#f5b8d6') {
    const g = radial('#ffffff', tint, shade, 0.4, 0.25, 0.8);
    const blobs = [[0, 0, 26], [-28, 8, 18], [28, 6, 20], [-12, -10, 20], [14, -12, 18], [44, 12, 12], [-44, 14, 11]];
    return `<g filter="url(#gelSmall)" opacity="${op}">${blobs.map(([bx, by, br]) => `<circle cx="${x + bx * s}" cy="${y + by * s}" r="${br * s}" fill="${g}"/>`).join('')}</g>`;
  }
  function starSvg(x, y, r, fill = '#ffd54a', stroke = '#d98a00', lit = true) {
    const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.48 : r; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
    const d = 'M' + pts.map(p => p.join(' ')).join(' L') + 'Z';
    const gr = lit ? radial(light(fill, 0.55), fill, '#f39d14', 0.4, 0.3, 0.8) : '#cfc8dc';
    return `<path d="${d}" fill="${gr}" stroke="${lit ? stroke : '#a9a2b8'}" stroke-width="${r * 0.14}" stroke-linejoin="round"/>`;
  }
  // 클리어 화면의 큰 유리 별
  function bigStar(x, y, r, rot = 0, lit = true) {
    if (!lit) return `<g transform="rotate(${rot} ${x} ${y})">${groundShadow(x, y + r * 0.9, r * 0.9, r * 0.25, 0.15)}${starSvg(x, y, r, '#cfc8dc', '#a9a2b8', false)}</g>`;
    return `<g transform="rotate(${rot} ${x} ${y})">${groundShadow(x, y + r * 0.9, r * 0.9, r * 0.25, 0.2)}<g transform="translate(0 ${r * 0.16})">${starSvg(x, y, r, '#e9a52a', '#d98a00')}</g><g filter="url(#glass)">${starSvg(x, y, r, '#ffd54a', '#e9a52a')}</g><g opacity="0.45">${starSvg(x, y, r * 0.95, '#fff', '#fff').replace(/stroke="#fff"/, 'stroke="none"')}</g><ellipse cx="${x - r * 0.25}" cy="${y - r * 0.35}" rx="${r * 0.22}" ry="${r * 0.1}" fill="#fff" opacity="0.85" transform="rotate(-25 ${x - r * 0.25} ${y - r * 0.35})"/></g>`;
  }
  // 지도의 3D 젤리 코인 (글자 없음 → 숫자는 HTML로 얹는다)
  function coin(x, y, r, { state = 'done', color = '#ffd04a' } = {}) {
    const c = state === 'locked' ? '#cfc6e6' : color;
    let g = groundShadow(x, y + r * 0.55, r * 1.1, r * 0.35, 0.3);
    g += `<ellipse cx="${x}" cy="${y + r * 0.22}" rx="${r * 1.06}" ry="${r * 0.9}" fill="${dark(c, 0.3)}" opacity="0.8"/>`;
    g += `<g filter="url(#glass)"><ellipse cx="${x}" cy="${y}" rx="${r * 1.06}" ry="${r * 0.9}" fill="${radial(light(c, 0.5), c, dark(c, 0.1), 0.45, 0.5, 0.75)}" opacity="0.92"/></g>`;
    g += `<ellipse cx="${x - r * 0.3}" cy="${y - r * 0.45}" rx="${r * 0.3}" ry="${r * 0.12}" fill="#fff" opacity="0.8" transform="rotate(-20 ${x - r * 0.3} ${y - r * 0.45})"/>`;
    if (state === 'current') g += `<ellipse cx="${x}" cy="${y}" rx="${r * 1.25}" ry="${r * 1.06}" fill="none" stroke="#fff" stroke-width="4" opacity="0.9" filter="url(#glow)"/>`;
    if (state === 'locked') g += `<rect x="${x - r * 0.3}" y="${y - r * 0.15}" width="${r * 0.6}" height="${r * 0.5}" rx="${r * 0.1}" fill="#8d85a5"/><path d="M${x - r * 0.18} ${y - r * 0.15} V${y - r * 0.32} a${r * 0.18} ${r * 0.18} 0 0 1 ${r * 0.36} 0 V${y - r * 0.15}" fill="none" stroke="#8d85a5" stroke-width="${r * 0.1}"/>`;
    return g;
  }
  function confetti(seed = 1, n = 60, area = [0, 0, 390, 844]) {
    let r = seed; const rnd = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
    const cols = ['#ff5f8a', '#ffd23f', '#4fb4ff', '#4fdcc4', '#a76bff', '#ff9f7a', '#fff'];
    let g = '';
    for (let i = 0; i < n; i++) {
      const x = area[0] + rnd() * area[2], y = area[1] + rnd() * area[3], c = cols[Math.floor(rnd() * cols.length)];
      const w = 5 + rnd() * 6, h = 10 + rnd() * 10, rot = rnd() * 360, sk = rnd() * 40 - 20;
      g += `<g transform="translate(${x} ${y}) rotate(${rot}) skewX(${sk})"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="1.5" fill="${linear([[0, light(c, 0.4)], [1, dark(c, 0.25)]], 0, 0, 1, 1)}"/></g>`;
    }
    return g;
  }
  const sparkle = (x, y, r, c = '#fff', op = 1) => `<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r}Z" fill="${c}" opacity="${op}" filter="url(#glow)"/>`;
  function flower(x, y, c = '#ff8fb1', s = 1) {
    let g = ''; for (let i = 0; i < 5; i++) g += `<ellipse cx="${x}" cy="${y - 4 * s}" rx="${2.6 * s}" ry="${4 * s}" fill="${c}" transform="rotate(${i * 72} ${x} ${y})"/>`;
    return g + `<circle cx="${x}" cy="${y}" r="${2.2 * s}" fill="#ffe27a"/>`;
  }
  const hill = (cx, cy, rx, ry, c) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${radial(light(c, 0.25), c, dark(c, 0.18), 0.4, 0.2, 0.85)}"/>`;
  function fence(x1, y, x2, s = 1) {
    // 3D: 말뚝 그림 한 장을 <use>로 되풀이 + 가로대 2줄은 가로 관 그림을 늘여서 (말뚝 1칸 = 21s/6.55)
    const u = 21 * s / 6.55, post3 = tex3d('picket', { color: '#f6e6d2' }, 7.2 * u * PX), rail3 = post3 && tex3d('pipe', { color: '#f6e6d2', mood: 'h' }, 3 * s * PX);
    if (rail3) {
      const id = uid('fp'), n3 = Math.floor((x2 - x1) / (14 * s));
      let f = `<defs><image id="${id}" href="${post3}" width="${7.2 * u}" height="${7.2 * u}" preserveAspectRatio="none"/></defs>`;
      for (let i = 0; i <= n3; i++) f += `<use href="#${id}" x="${x1 + i * 14 * s - 3.6 * u}" y="${y - 7.2 * u}"/>`;
      return f + image3d(rail3, x1 - 2 * s, y - 14.5 * s, x2 - x1 + 4 * s, 4 * s) + image3d(rail3, x1 - 2 * s, y - 7.5 * s, x2 - x1 + 4 * s, 4 * s);
    }
    let g = `<rect x="${x1}" y="${y - 14 * s}" width="${x2 - x1}" height="${3 * s}" fill="#f6e6d2"/><rect x="${x1}" y="${y - 7 * s}" width="${x2 - x1}" height="${3 * s}" fill="#f6e6d2"/>`;
    const n = Math.floor((x2 - x1) / (14 * s));
    for (let i = 0; i <= n; i++) { const x = x1 + i * 14 * s; g += `<path d="M${x - 2.5 * s} ${y} L${x - 2.5 * s} ${y - 17 * s} L${x} ${y - 21 * s} L${x + 2.5 * s} ${y - 17 * s} L${x + 2.5 * s} ${y} Z" fill="${linear([[0, '#fff8f0'], [1, '#dcc8b2']], 0, 0, 1, 0)}"/>`; }
    return g;
  }
  // 길: 점 목록을 따라 폭이 변하는 띠
  function road(pts, { fill = '#fff0f6', edge = '#f0a4c0', edgeW = 7, widthFn = () => 40, top = '#fff' } = {}) {
    const left = [], right = [];
    for (let i = 0; i < pts.length; i++) {
      const [x, y] = pts[i], t = i / (pts.length - 1), p = pts[Math.max(0, i - 1)], n = pts[Math.min(pts.length - 1, i + 1)];
      let dx = n[0] - p[0], dy = n[1] - p[1]; const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
      const w = widthFn(t) / 2; left.push([x - dy * w, y + dx * w]); right.push([x + dy * w, y - dx * w]);
    }
    const poly = 'M' + left.map(p => p.join(' ')).join(' L') + ' L' + right.reverse().map(p => p.join(' ')).join(' L') + 'Z';
    let g = `<path d="${poly}" transform="translate(0 ${edgeW})" fill="${edge}"/>`;
    g += `<path d="${poly}" transform="translate(0 ${edgeW + 5})" fill="#2a0b4e" opacity="0.25" filter="url(#soft6)"/>`;
    g += `<path d="${poly}" fill="${fill}"/>`;
    g += `<path d="${poly}" fill="${linear([[0, '#fff', 0.35], [1, '#fff', 0]], 0, 0, 0, 1)}"/>`;
    g += `<path d="${poly}" fill="none" stroke="${top}" stroke-width="2" opacity="0.8"/>`;
    return g;
  }
  function sampleCurve(pts, n = 60) {
    const out = [], P = [pts[0], ...pts, pts[pts.length - 1]];
    for (let i = 1; i < P.length - 2; i++) {
      const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]], segs = Math.max(2, Math.round(n / (pts.length - 1)));
      for (let j = 0; j < segs; j++) {
        const t = j / segs, t2 = t * t, t3 = t2 * t;
        out.push([0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
      }
    }
    out.push(pts[pts.length - 1]); return out;
  }
  function tower(x, y, w, h, c, { flag = '#ff5f8a', s = 1 } = {}) {
    const r = w / 2; let g = '';
    // 3D: 몸통 기둥 그림을 높이만큼 늘이고, 그 위에 지붕 그림 (1칸 = w/3, 이음매는 지붕 그림 위에서 5.2칸)
    const u = w / 3, top3 = tex3d('towertop', { color: c, mood: flag }, 7.2 * u * PX), body3 = top3 && tex3d('towerbody', { color: c }, 7.2 * u * PX);
    if (body3) return groundShadow(x, y + 2 * s, r * 1.3, r * 0.32, 0.3) + image3d(body3, x - 3.6 * u, y - h, 7.2 * u, h) + image3d(top3, x - 3.6 * u, y - h - 5.2 * u, 7.2 * u, 7.2 * u) +
      `<rect x="${x - 4 * s}" y="${y - h * 0.6}" width="${8 * s}" height="${12 * s}" rx="${4 * s}" fill="#ffe08a"/><rect x="${x - 4 * s}" y="${y - h * 0.6}" width="${8 * s}" height="${12 * s}" rx="${4 * s}" fill="#ffd36a" opacity="0.7" filter="url(#soft6)"/>`;
    g += `<rect x="${x - r}" y="${y - h}" width="${w}" height="${h}" fill="${linear([[0, light(c, 0.3)], [0.35, light(c, 0.08)], [0.7, c], [1, dark(c, 0.35)]], 0, 0, 1, 0)}"/>`;
    g += `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.3}" fill="${dark(c, 0.25)}"/>`;
    g += `<rect x="${x - r * 1.12}" y="${y - h - 6 * s}" width="${w * 1.12}" height="${12 * s}" fill="${linear([[0, light(c, 0.35)], [0.7, c], [1, dark(c, 0.35)]], 0, 0, 1, 0)}"/>`;
    for (let i = 0; i < 4; i++) { const bx = x - r * 1.12 + i * (w * 1.12 / 3.6); g += `<rect x="${bx}" y="${y - h - 14 * s}" width="${w * 1.12 / 7}" height="${9 * s}" fill="${linear([[0, light(c, 0.35)], [1, dark(c, 0.2)]], 0, 0, 1, 0)}"/>`; }
    const rc = mix(c, '#5a2d91', 0.4);
    g += `<ellipse cx="${x}" cy="${y - h - 12 * s}" rx="${r * 1.15}" ry="${r * 0.28}" fill="${light(rc, 0.15)}"/>`;
    g += `<path d="M${x - r * 1.15} ${y - h - 12 * s} L${x} ${y - h - r * 2.4} L${x + r * 1.15} ${y - h - 12 * s} Z" fill="${linear([[0, light(rc, 0.35)], [0.5, rc], [1, dark(rc, 0.4)]], 0, 0, 1, 0)}"/>`;
    g += `<rect x="${x - 1}" y="${y - h - r * 2.4 - 18 * s}" width="2" height="${18 * s}" fill="#f2e6ff"/><path d="M${x + 1} ${y - h - r * 2.4 - 18 * s} L${x + 14 * s} ${y - h - r * 2.4 - 13 * s} L${x + 1} ${y - h - r * 2.4 - 8 * s} Z" fill="${flag}"/>`;
    g += `<rect x="${x - 4 * s}" y="${y - h * 0.6}" width="${8 * s}" height="${12 * s}" rx="${4 * s}" fill="#ffe08a"/><rect x="${x - 4 * s}" y="${y - h * 0.6}" width="${8 * s}" height="${12 * s}" rx="${4 * s}" fill="#ffd36a" opacity="0.7" filter="url(#soft6)"/>`;
    return g;
  }
  function castle(x, y, s = 1, c = '#c3a6f2', { night = false } = {}) {
    let g = groundShadow(x, y + 4 * s, 110 * s, 14 * s, 0.35);
    const p3 = prop3d('castle', { color: c, mood: night ? 'night' : 'day' }, x, y, 33 * s);
    if (p3) return g + p3;
    g += tower(x - 62 * s, y - 20 * s, 26 * s, 70 * s, dark(c, 0.1), { s }) + tower(x + 62 * s, y - 20 * s, 26 * s, 70 * s, dark(c, 0.1), { s });
    g += `<rect x="${x - 78 * s}" y="${y - 62 * s}" width="${156 * s}" height="${62 * s}" fill="${linear([[0, light(c, 0.2)], [1, c]], 0, 0, 0, 1)}"/>`;
    for (let i = 0; i < 9; i++) { const bx = x - 78 * s + i * (156 * s / 8.5); g += `<rect x="${bx}" y="${y - 72 * s}" width="${10 * s}" height="${11 * s}" fill="${light(c, 0.15)}"/>`; }
    g += `<rect x="${x - 78 * s}" y="${y - 62 * s}" width="${156 * s}" height="${5 * s}" fill="${light(c, 0.35)}"/>`;
    for (let r = 0; r < 4; r++) for (let k = 0; k < 7; k++) { const bx = x - 70 * s + k * 22 * s + (r % 2 ? 11 * s : 0), by = y - 50 * s + r * 12 * s; g += `<rect x="${bx}" y="${by}" width="${16 * s}" height="${7 * s}" rx="${1.5 * s}" fill="#fff" opacity="0.08"/>`; }
    g += `<path d="M${x - 24 * s} ${y} L${x - 24 * s} ${y - 30 * s} Q${x} ${y - 56 * s} ${x + 24 * s} ${y - 30 * s} L${x + 24 * s} ${y} Z" fill="${night ? '#1a0f3d' : '#4a2c86'}"/>`;
    g += `<path d="M${x - 24 * s} ${y} L${x - 24 * s} ${y - 30 * s} Q${x} ${y - 56 * s} ${x + 24 * s} ${y - 30 * s} L${x + 24 * s} ${y} Z" fill="none" stroke="${light(c, 0.4)}" stroke-width="${3 * s}"/>`;
    g += `<path d="M${x - 19 * s} ${y} L${x - 19 * s} ${y - 28 * s} Q${x} ${y - 50 * s} ${x + 19 * s} ${y - 28 * s} L${x + 19 * s} ${y} Z" fill="${linear([[0, '#b07a52'], [1, '#6e4630']], 0, 0, 0, 1)}"/>`;
    g += `<line x1="${x}" y1="${y - 46 * s}" x2="${x}" y2="${y}" stroke="#4a2c1e" stroke-width="${1.5 * s}"/>`;
    g += tower(x - 96 * s, y, 34 * s, 84 * s, c, { s }) + tower(x + 96 * s, y, 34 * s, 84 * s, c, { s });
    return g;
  }
  function fountain(x, y, s = 1) {
    let g = groundShadow(x, y + 4 * s, 34 * s, 9 * s, 0.3);
    const p3 = prop3d('fountain', { color: '#6ec6ff' }, x, y, 14.5 * s);
    if (p3) return g + p3;
    g += `<ellipse cx="${x}" cy="${y}" rx="${32 * s}" ry="${11 * s}" fill="#cfd3e6"/><ellipse cx="${x}" cy="${y - 5 * s}" rx="${32 * s}" ry="${11 * s}" fill="${linear([[0, '#fbfcff'], [1, '#d8dcee']], 0, 0, 0, 1)}"/>`;
    g += `<ellipse cx="${x}" cy="${y - 5 * s}" rx="${26 * s}" ry="${8 * s}" fill="${radial('#bfe9ff', '#6ec6ff', '#3fa7f0', 0.4, 0.3, 0.8)}"/>`;
    g += `<rect x="${x - 3 * s}" y="${y - 30 * s}" width="${6 * s}" height="${26 * s}" fill="${linear([[0, '#fff'], [1, '#c9cde0']], 0, 0, 1, 0)}"/><ellipse cx="${x}" cy="${y - 30 * s}" rx="${9 * s}" ry="${3 * s}" fill="#e8ebf5"/>`;
    g += `<path d="M${x} ${y - 32 * s} C${x - 14 * s} ${y - 46 * s} ${x - 22 * s} ${y - 20 * s} ${x - 16 * s} ${y - 6 * s}" stroke="#bfe9ff" stroke-width="${3 * s}" fill="none" opacity="0.9"/><path d="M${x} ${y - 32 * s} C${x + 14 * s} ${y - 46 * s} ${x + 22 * s} ${y - 20 * s} ${x + 16 * s} ${y - 6 * s}" stroke="#bfe9ff" stroke-width="${3 * s}" fill="none" opacity="0.9"/><path d="M${x} ${y - 32 * s} L${x} ${y - 44 * s}" stroke="#dff4ff" stroke-width="${3 * s}" stroke-linecap="round"/>`;
    g += `<circle cx="${x - 3 * s}" cy="${y - 46 * s}" r="${2 * s}" fill="#fff"/><circle cx="${x + 10 * s}" cy="${y - 40 * s}" r="${1.5 * s}" fill="#fff"/>`;
    return g;
  }
  function lamp(x, y, s = 1, on = true) {
    const p3 = on && prop3d('lamp', { color: '#5a3f8f' }, x, y, 11 * s);
    if (p3) return p3 + `<circle cx="${x}" cy="${y - 38 * s}" r="${12 * s}" fill="#ffd36a" opacity="0.45" filter="url(#soft12)"/>`;
    let g = `<path d="M${x - 2 * s} ${y} L${x - 1.5 * s} ${y - 34 * s} L${x + 1.5 * s} ${y - 34 * s} L${x + 2 * s} ${y} Z" fill="#5a3f8f"/><ellipse cx="${x}" cy="${y}" rx="${4 * s}" ry="${1.6 * s}" fill="#4a2c86"/>`;
    g += `<rect x="${x - 5 * s}" y="${y - 44 * s}" width="${10 * s}" height="${11 * s}" rx="${2 * s}" fill="${on ? '#ffe8a3' : '#dfe6ff'}"/><path d="M${x - 6 * s} ${y - 44 * s} L${x} ${y - 49 * s} L${x + 6 * s} ${y - 44 * s} Z" fill="#5a3f8f"/>`;
    if (on) g += `<circle cx="${x}" cy="${y - 38 * s}" r="${12 * s}" fill="#ffd36a" opacity="0.55" filter="url(#soft12)"/>`;
    return g;
  }
  function windmill(x, y, s = 1) {
    let g = groundShadow(x + 6 * s, y + 2, 26 * s, 7 * s, 0.3);
    const p3 = prop3d('windmill', { color: '#ff9fb8' }, x, y, 16 * s);
    if (p3) return g + p3;
    g += `<path d="M${x - 16 * s} ${y} L${x - 10 * s} ${y - 60 * s} L${x + 10 * s} ${y - 60 * s} L${x + 16 * s} ${y} Z" fill="${linear([[0, '#fff6ec'], [1, '#dcc8b2']], 0, 0, 1, 0)}"/>`;
    g += `<path d="M${x - 13 * s} ${y - 58 * s} Q${x} ${y - 78 * s} ${x + 13 * s} ${y - 58 * s} Z" fill="${linear([[0, '#ff9fb8'], [1, '#e66a8f']], 0, 0, 0, 1)}"/>`;
    g += `<rect x="${x - 3 * s}" y="${y - 30 * s}" width="${6 * s}" height="${10 * s}" rx="${2 * s}" fill="#ffe8a3"/>`;
    for (let i = 0; i < 4; i++) g += `<g transform="rotate(${i * 90 + 20} ${x} ${y - 62 * s})"><rect x="${x - 3 * s}" y="${y - 62 * s - 30 * s}" width="${6 * s}" height="${30 * s}" rx="${2 * s}" fill="#fff"/><rect x="${x + 3 * s}" y="${y - 62 * s - 28 * s}" width="${7 * s}" height="${22 * s}" rx="${2 * s}" fill="#ffd9e4" opacity="0.9"/></g>`;
    g += `<circle cx="${x}" cy="${y - 62 * s}" r="${4 * s}" fill="#5a3f8f"/>`;
    return g;
  }
  function starsSky(seed = 3, n = 40, area = [0, 0, 390, 300], op = 0.9) {
    let r = seed; const rnd = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; }; let g = '';
    for (let i = 0; i < n; i++) { const x = area[0] + rnd() * area[2], y = area[1] + rnd() * area[3], s = 0.6 + rnd() * 1.6; g += `<circle cx="${x}" cy="${y}" r="${s}" fill="#fff" opacity="${op * (0.4 + rnd() * 0.6)}"/>`; }
    return g;
  }
  // 보스: 젤리 + 뿔 + 왕관 + 발광. kind: mungchi(뭉치) / syrup(찐득이) / pudding(푸딩 골렘) / robot(철컹이)
  const BOSS_COLOR = { mungchi: '#8a5cf0', syrup: '#e8912f', pudding: '#ffc94a', robot: '#7f9bd1' };
  function boss(x, y, r, { mood = 'angry', kind = 'mungchi' } = {}) {
    const col = BOSS_COLOR[kind] || BOSS_COLOR.mungchi;
    let g = `<ellipse cx="${x}" cy="${y}" rx="${r * 1.3}" ry="${r * 1.15}" fill="${light(col, 0.4)}" opacity="0.45" filter="url(#soft12)"/>`;
    // 미리 구운 3D 보스(뿔·왕관·모자 포함). 몸이 작게 구워져 있어 그림을 3.13r 로 키우고 위로 0.384r 올린다
    const t3 = tex3d('boss', { color: kind in BOSS_COLOR ? kind : 'mungchi', mood }, r * 3.13 * PX);
    if (t3) return g + groundShadow(x, y + r * 0.9, r * 0.95, r * 0.2, 0.25) + image3d(t3, x - r * 1.565, y - r * 1.949, r * 3.13, r * 3.13);
    const horn = sx => `<path d="M${x + sx * r * 0.55} ${y - r * 0.75} Q${x + sx * r * 0.9} ${y - r * 1.05} ${x + sx * r * 0.75} ${y - r * 1.45} Q${x + sx * r * 0.95} ${y - r * 1.1} ${x + sx * r * 1.0} ${y - r * 0.6} Z" fill="${linear([[0, col], [1, dark(col, 0.45)]], 0, 0, 0, 1)}" opacity="0.9"/>`;
    if (kind === 'mungchi' || kind === 'syrup') g += horn(-1) + horn(1);
    if (kind === 'robot') {
      // 안테나 + 귀 볼트
      g += `<line x1="${x}" y1="${y - r * 0.9}" x2="${x}" y2="${y - r * 1.5}" stroke="#5a6f9e" stroke-width="${r * 0.08}" stroke-linecap="round"/><circle cx="${x}" cy="${y - r * 1.55}" r="${r * 0.13}" fill="#ff5f8a"/><circle cx="${x}" cy="${y - r * 1.55}" r="${r * 0.25}" fill="#ff5f8a" opacity="0.5" filter="url(#soft6)"/>`;
      g += [-1, 1].map(sx => `<rect x="${x + sx * r * 1.02 - r * 0.14}" y="${y - r * 0.2}" width="${r * 0.28}" height="${r * 0.4}" rx="${r * 0.08}" fill="${linear([[0, '#e6ecf7'], [1, '#8a9bc0']], 0, 0, 1, 0)}"/>`).join('');
    }
    g += jelly(x, y, r, col, { mood, faceScale: 1.05 });
    if (kind === 'syrup') {
      // 머리 위 시럽이 흘러내림
      g += `<path d="M${x - r * 0.8} ${y - r * 0.45} Q${x - r * 0.7} ${y - r * 0.95} ${x} ${y - r * 0.95} Q${x + r * 0.7} ${y - r * 0.95} ${x + r * 0.8} ${y - r * 0.45} Q${x + r * 0.62} ${y - r * 0.2} ${x + r * 0.55} ${y - r * 0.45} Q${x + r * 0.45} ${y + r * 0.05} ${x + r * 0.35} ${y - r * 0.42} Q${x - r * 0.1} ${y - r * 0.3} ${x - r * 0.3} ${y - r * 0.45} Q${x - r * 0.42} ${y - r * 0.1} ${x - r * 0.52} ${y - r * 0.45} Q${x - r * 0.68} ${y - r * 0.25} ${x - r * 0.8} ${y - r * 0.45} Z" fill="${linear([[0, '#ffb347'], [1, '#c8661a']], 0, 0, 0, 1)}" opacity="0.85"/>`;
      g += `<ellipse cx="${x - r * 0.3}" cy="${y - r * 0.78}" rx="${r * 0.2}" ry="${r * 0.07}" fill="#fff" opacity="0.8"/>`;
    }
    if (kind === 'pudding') {
      // 캐러멜 모자 + 체리
      g += `<path d="M${x - r * 0.78} ${y - r * 0.5} Q${x - r * 0.7} ${y - r * 0.98} ${x} ${y - r * 0.98} Q${x + r * 0.7} ${y - r * 0.98} ${x + r * 0.78} ${y - r * 0.5} Q${x + r * 0.5} ${y - r * 0.32} ${x + r * 0.3} ${y - r * 0.5} Q${x} ${y - r * 0.3} ${x - r * 0.3} ${y - r * 0.5} Q${x - r * 0.5} ${y - r * 0.32} ${x - r * 0.78} ${y - r * 0.5} Z" fill="${linear([[0, '#b8651e'], [1, '#7a3a0e']], 0, 0, 0, 1)}" opacity="0.92"/>`;
      g += `<circle cx="${x}" cy="${y - r * 1.12}" r="${r * 0.2}" fill="${radial('#ffb0c0', '#ff3b5c', '#b3002a', 0.35, 0.3, 0.8)}"/><path d="M${x} ${y - r * 1.3} Q${x + r * 0.1} ${y - r * 1.55} ${x + r * 0.3} ${y - r * 1.55}" stroke="#3f8f3a" stroke-width="${r * 0.05}" fill="none"/>`;
      return g;
    }
    if (kind === 'robot') {
      g += `<rect x="${x - r * 0.62}" y="${y - r * 0.28}" width="${r * 1.24}" height="${r * 0.42}" rx="${r * 0.2}" fill="#1f2a4a" opacity="0.18"/>`;
      return g;
    }
    g += `<path d="M${x - r * 0.3} ${y - r * 0.98} L${x - r * 0.32} ${y - r * 1.25} L${x - r * 0.15} ${y - r * 1.08} L${x} ${y - r * 1.32} L${x + r * 0.15} ${y - r * 1.08} L${x + r * 0.32} ${y - r * 1.25} L${x + r * 0.3} ${y - r * 0.98} Z" fill="${linear([[0, '#fff0b3'], [1, '#e9a52a']], 0, 0, 0, 1)}" stroke="#b36b00" stroke-width="1.5" stroke-linejoin="round"/>`;
    return g;
  }
  // 노놈 / 꼬마 놈놈: 짙은 남보라 젤리, 둥근 귀, 어두운 가면 얼굴에 빛나는 분홍 눈
  function nomnom(x, y, r, { mood = 'angry', mini = false, red = 0 } = {}) {
    const body = mix('#3b2a7a', '#8a1f4a', red), rim = mix('#7b5cd6', '#ff5f8a', red);
    let g = `<ellipse cx="${x}" cy="${y}" rx="${r * 1.35}" ry="${r * 1.2}" fill="${rim}" opacity="0.4" filter="url(#soft12)"/>`;
    const t3 = tex3d('nom', { color: body, mood: mood === 'joy' ? 'happy' : mood, ears: mini }, r * 3.13 * PX);
    if (t3) return g + groundShadow(x, y + r * 0.9, r * 0.9, r * 0.2, 0.25) + image3d(t3, x - r * 1.565, y - r * 1.949, r * 3.13, r * 3.13);
    const ear = sx => `<g filter="url(#glass)"><circle cx="${x + sx * r * 0.62}" cy="${y - r * 0.82}" r="${r * (mini ? 0.3 : 0.34)}" fill="${radial(light(body, 0.25), body, dark(body, 0.3), 0.4, 0.3, 0.8)}"/></g>`;
    g += ear(-1) + ear(1);
    const path = blobPath(x, y, r, r * 0.95);
    g += groundShadow(x, y + r * 0.95, r * 0.9, r * 0.2, 0.25);
    g += `<g filter="url(#glass)"><path d="${path}" fill="${radial(light(body, 0.3), body, dark(body, 0.35), 0.45, 0.35, 0.8)}" opacity="0.96"/></g>`;
    g += `<path d="${path}" fill="none" stroke="${rim}" stroke-width="${r * 0.06}" opacity="0.7"/>`;
    // 가면 얼굴
    g += `<path d="M${x - r * 0.62} ${y - r * 0.1} Q${x - r * 0.7} ${y - r * 0.55} ${x - r * 0.3} ${y - r * 0.5} L${x - r * 0.15} ${y - r * 0.62} L${x} ${y - r * 0.5} L${x + r * 0.15} ${y - r * 0.62} L${x + r * 0.3} ${y - r * 0.5} Q${x + r * 0.7} ${y - r * 0.55} ${x + r * 0.62} ${y - r * 0.1} Q${x + r * 0.6} ${y + r * 0.55} ${x} ${y + r * 0.55} Q${x - r * 0.6} ${y + r * 0.55} ${x - r * 0.62} ${y - r * 0.1} Z" fill="#160b33" opacity="0.85"/>`;
    const eye = sx => {
      const ex = x + sx * r * 0.28, ey = y - r * 0.08;
      if (mood === 'happy' || mood === 'joy') return `<path d="M${ex - r * 0.15} ${ey + r * 0.03} Q${ex} ${ey - r * 0.12} ${ex + r * 0.15} ${ey + r * 0.03}" stroke="#ff8ac0" stroke-width="${r * 0.07}" fill="none" stroke-linecap="round"/>`;
      return `<ellipse cx="${ex}" cy="${ey}" rx="${r * 0.17}" ry="${r * 0.11}" fill="#ff8ac0" opacity="0.6" filter="url(#soft6)"/><path d="M${ex - r * 0.16} ${ey - sx * 0 - r * 0.02} Q${ex} ${ey - r * 0.16 + (mood === 'worried' ? r * 0.06 : 0)} ${ex + r * 0.16} ${ey + (sx < 0 ? r * 0.04 : -r * 0.04) * (mood === 'worried' ? -1 : 1)} Q${ex} ${ey + r * 0.12} ${ex - r * 0.16} ${ey - r * 0.02} Z" fill="#ffd1ea"/><circle cx="${ex}" cy="${ey}" r="${r * 0.05}" fill="#fff"/>`;
    };
    g += eye(-1) + eye(1);
    g += mood === 'worried'
      ? `<path d="M${x - r * 0.12} ${y + r * 0.3} Q${x} ${y + r * 0.22} ${x + r * 0.12} ${y + r * 0.3}" stroke="#ff8ac0" stroke-width="${r * 0.05}" fill="none" stroke-linecap="round"/>`
      : `<path d="M${x - r * 0.16} ${y + r * 0.26} Q${x} ${y + r * 0.18} ${x + r * 0.16} ${y + r * 0.26} L${x + r * 0.08} ${y + r * 0.32} L${x} ${y + r * 0.26} L${x - r * 0.08} ${y + r * 0.32} Z" fill="#ff8ac0"/>`;
    g += `<ellipse cx="${x - r * 0.42}" cy="${y - r * 0.62}" rx="${r * 0.2}" ry="${r * 0.08}" fill="#fff" opacity="0.6" transform="rotate(-28 ${x - r * 0.42} ${y - r * 0.62})"/>`;
    if (!mini) g += `<path d="M${x - r * 0.34} ${y - r * 0.9} L${x - r * 0.36} ${y - r * 1.2} L${x - r * 0.17} ${y - r * 1.04} L${x} ${y - r * 1.3} L${x + r * 0.17} ${y - r * 1.04} L${x + r * 0.36} ${y - r * 1.2} L${x + r * 0.34} ${y - r * 0.9} Z" fill="${linear([[0, '#fff0b3'], [1, '#e9a52a']], 0, 0, 0, 1)}" stroke="#b36b00" stroke-width="1.5" stroke-linejoin="round"/>`;
    return g;
  }

  // ---------- 특수 거품 (bubble() 위에 얹는 덧그림) ----------
  // kind: s 끈적 시럽 / i 얼음 / m 버섯 / u 흔들 푸딩 / g 선물 / f 반딧불
  function bubbleExtra(x, y, r, kind) {
    if (kind === 's') {
      // 끈적 시럽: 거품 전체를 감싼 금빛 시럽 껍질 + 아래로 흘러내린 방울 + '2번' 표시
      const drip = (dx, len) => `<path d="M${x + dx - r * 0.13} ${y + r * 0.8} Q${x + dx - r * 0.13} ${y + r * (0.8 + len)} ${x + dx} ${y + r * (0.85 + len)} Q${x + dx + r * 0.13} ${y + r * (0.8 + len)} ${x + dx + r * 0.13} ${y + r * 0.8} Z" fill="#f0a22a"/><ellipse cx="${x + dx - r * 0.04}" cy="${y + r * (0.72 + len)}" rx="${r * 0.04}" ry="${r * 0.08}" fill="#fff" opacity="0.8"/>`;
      return `<circle cx="${x}" cy="${y}" r="${r * 1.04}" fill="${radial('#ffffff', '#ffe08a', '#f0a22a', 0.35, 0.3, 0.85)}" opacity="0.28"/>` +
        `<circle cx="${x}" cy="${y}" r="${r * 0.98}" fill="none" stroke="#e8901f" stroke-width="${r * 0.16}" opacity="0.95"/>` +
        drip(-r * 0.42, 0.42) + drip(r * 0.3, 0.3) +
        `<ellipse cx="${x - r * 0.38}" cy="${y - r * 0.62}" rx="${r * 0.3}" ry="${r * 0.11}" fill="#fff" opacity="0.9" transform="rotate(-25 ${x - r * 0.38} ${y - r * 0.62})"/>` +
        `<circle cx="${x + r * 0.62}" cy="${y - r * 0.62}" r="${r * 0.36}" fill="#fff" stroke="#e8901f" stroke-width="${r * 0.09}"/>` +
        `<text x="${x + r * 0.62}" y="${y - r * 0.47}" text-anchor="middle" font-family="Baloo 2, Arial, sans-serif" font-weight="800" font-size="${r * 0.48}" fill="#c2611a">2</text>`;
    }
    if (kind === 'i') return `<circle cx="${x}" cy="${y}" r="${r * 1.02}" fill="${radial('#ffffff', '#dff4ff', '#9fd8ff', 0.35, 0.3, 0.8)}" opacity="0.72"/><path d="M${x - r * 0.5} ${y - r * 0.2} L${x - r * 0.1} ${y + r * 0.1} L${x + r * 0.15} ${y - r * 0.3} M${x - r * 0.1} ${y + r * 0.1} L${x} ${y + r * 0.55} M${x + r * 0.15} ${y - r * 0.3} L${x + r * 0.55} ${y - r * 0.1}" stroke="#fff" stroke-width="${r * 0.08}" fill="none" stroke-linecap="round" opacity="0.95"/><circle cx="${x}" cy="${y}" r="${r * 0.98}" fill="none" stroke="#bfe9ff" stroke-width="${r * 0.12}"/>${sparkle(x + r * 0.5, y - r * 0.55, r * 0.25)}`;
    if (kind === 'm') return `<path d="M${x - r * 0.75} ${y - r * 0.35} Q${x - r * 0.7} ${y - r * 1.15} ${x} ${y - r * 1.15} Q${x + r * 0.7} ${y - r * 1.15} ${x + r * 0.75} ${y - r * 0.35} Q${x} ${y - r * 0.15} ${x - r * 0.75} ${y - r * 0.35} Z" fill="${radial('#ffd1dc', '#ff5f7a', '#c8244a', 0.4, 0.3, 0.8)}"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.7}" r="${r * 0.13}" fill="#fff"/><circle cx="${x + r * 0.2}" cy="${y - r * 0.85}" r="${r * 0.1}" fill="#fff"/><circle cx="${x + r * 0.45}" cy="${y - r * 0.5}" r="${r * 0.09}" fill="#fff"/>`;
    if (kind === 'u') return `<path d="M${x - r * 0.9} ${y - r * 0.3} Q${x - r * 0.8} ${y - r * 0.95} ${x} ${y - r * 0.95} Q${x + r * 0.8} ${y - r * 0.95} ${x + r * 0.9} ${y - r * 0.3} Q${x + r * 0.55} ${y - r * 0.05} ${x + r * 0.35} ${y - r * 0.32} Q${x} ${y - r * 0.05} ${x - r * 0.35} ${y - r * 0.32} Q${x - r * 0.55} ${y - r * 0.05} ${x - r * 0.9} ${y - r * 0.3} Z" fill="${linear([[0, '#c9752a'], [1, '#8a4512']], 0, 0, 0, 1)}" opacity="0.9"/><ellipse cx="${x - r * 0.3}" cy="${y - r * 0.72}" rx="${r * 0.22}" ry="${r * 0.08}" fill="#fff" opacity="0.7"/>`;
    if (kind === 'g') return `<rect x="${x - r * 0.12}" y="${y - r * 0.98}" width="${r * 0.24}" height="${r * 1.96}" fill="#ff4f8b" opacity="0.9"/><rect x="${x - r * 0.98}" y="${y - r * 0.12}" width="${r * 1.96}" height="${r * 0.24}" fill="#ff4f8b" opacity="0.9"/><path d="M${x} ${y - r * 0.85} Q${x - r * 0.6} ${y - r * 1.35} ${x - r * 0.55} ${y - r * 0.8} Q${x - r * 0.3} ${y - r * 0.7} ${x} ${y - r * 0.85} Q${x + r * 0.6} ${y - r * 1.35} ${x + r * 0.55} ${y - r * 0.8} Q${x + r * 0.3} ${y - r * 0.7} ${x} ${y - r * 0.85} Z" fill="#ff7fae" stroke="#c2457a" stroke-width="1"/>`;
    if (kind === 'z') {
      // 폭탄: 주황 테두리 + 금색 뚜껑 + 굵은 심지 + 큰 불꽃
      const cx = x + r * 0.5, cy = y - r * 0.92;
      return `<circle cx="${x}" cy="${y}" r="${r * 0.97}" fill="none" stroke="#ff8c3a" stroke-width="${r * 0.12}" opacity="0.85"/>` +
        `<rect x="${cx - r * 0.3}" y="${cy - r * 0.2}" width="${r * 0.6}" height="${r * 0.4}" rx="${r * 0.1}" fill="${linear([[0, '#fff0b3'], [1, '#d18a00']], 0, 0, 0, 1)}" stroke="#8a5a00" stroke-width="1.2" transform="rotate(35 ${cx} ${cy})"/>` +
        `<path d="M${cx + r * 0.16} ${cy - r * 0.2} Q${cx + r * 0.6} ${cy - r * 0.5} ${cx + r * 0.36} ${cy - r * 0.78}" stroke="#7a4a2a" stroke-width="${r * 0.14}" fill="none" stroke-linecap="round"/>` +
        `<circle cx="${cx + r * 0.36}" cy="${cy - r * 0.78}" r="${r * 0.42}" fill="#ffb347" opacity="0.6" filter="url(#soft6)"/>` +
        starSvg(cx + r * 0.36, cy - r * 0.78, r * 0.36, '#ffe27a', '#ff5f3a');
    }
    if (kind === 'q') {
      // 랜덤: 무지개 테두리 + 하얀 동그라미 속 큰 물음표 + 반짝이
      return `<circle cx="${x}" cy="${y}" r="${r * 0.93}" fill="none" stroke="${linear([[0, '#ff7aa5'], [0.25, '#ffd23f'], [0.5, '#5ed46a'], [0.75, '#4fb4ff'], [1, '#a76bff']], 0, 0, 1, 1)}" stroke-width="${r * 0.2}"/>` +
        `<circle cx="${x}" cy="${y}" r="${r * 0.72}" fill="${radial('#ffffff', '#ffffff', '#efe4ff', 0.4, 0.35, 0.9)}"/>` +
        `<text x="${x}" y="${y + r * 0.42}" text-anchor="middle" font-family="Baloo 2, Arial, sans-serif" font-weight="800" font-size="${r * 1.25}" fill="${linear([[0, '#ff5fa8'], [1, '#7a3fe0']], 0, 0, 0, 1)}">?</text>` +
        `<ellipse cx="${x - r * 0.36}" cy="${y - r * 0.44}" rx="${r * 0.22}" ry="${r * 0.1}" fill="#fff" opacity="0.95" transform="rotate(-35 ${x - r * 0.36} ${y - r * 0.44})"/>` +
        sparkle(x + r * 0.62, y - r * 0.64, r * 0.28, '#ffe27a') + sparkle(x - r * 0.7, y + r * 0.52, r * 0.2, '#ff9fc4');
    }
    if (kind === 'f') return `<circle cx="${x}" cy="${y + r * 0.1}" r="${r * 0.55}" fill="#fff6a8" opacity="0.8" filter="url(#soft6)"/><circle cx="${x}" cy="${y + r * 0.1}" r="${r * 0.22}" fill="#fffbe0"/><ellipse cx="${x - r * 0.3}" cy="${y - r * 0.2}" rx="${r * 0.22}" ry="${r * 0.12}" fill="#fff" opacity="0.8" transform="rotate(30 ${x - r * 0.3} ${y - r * 0.2})"/><ellipse cx="${x + r * 0.3}" cy="${y - r * 0.2}" rx="${r * 0.22}" ry="${r * 0.12}" fill="#fff" opacity="0.8" transform="rotate(-30 ${x + r * 0.3} ${y - r * 0.2})"/>`;
    return '';
  }
  // 수정(무지개) 거품: 아무 색과 짝이 된다
  function crystalBubble(x, y, r) {
    let s = `<circle cx="${x}" cy="${y + r * 0.15}" r="${r * 0.95}" fill="#7a2d5e" opacity="0.18" filter="url(#soft)"/>`;
    s += `<g filter="url(#glass)"><circle cx="${x}" cy="${y}" r="${r}" fill="${linear([[0, '#ff7aa5'], [0.25, '#ffd23f'], [0.5, '#5ed46a'], [0.75, '#4fb4ff'], [1, '#a76bff']], 0, 0, 1, 1)}" opacity="0.85"/></g>`;
    s += `<path d="M${x} ${y - r * 0.7} L${x + r * 0.5} ${y - r * 0.1} L${x} ${y + r * 0.65} L${x - r * 0.5} ${y - r * 0.1} Z" fill="#fff" opacity="0.55"/><path d="M${x - r * 0.5} ${y - r * 0.1} L${x + r * 0.5} ${y - r * 0.1}" stroke="#fff" stroke-width="1" opacity="0.8"/>`;
    s += `<ellipse cx="${x - r * 0.38}" cy="${y - r * 0.42}" rx="${r * 0.26}" ry="${r * 0.14}" fill="#fff" opacity="0.95" transform="rotate(-35 ${x - r * 0.38} ${y - r * 0.42})"/>`;
    return s + sparkle(x + r * 0.45, y - r * 0.5, r * 0.3);
  }
  // 쿠키 블록 (색 없음, 터지지 않고 떨어뜨려야 없어짐)
  function cookie(x, y, r) {
    let s = `<circle cx="${x}" cy="${y + r * 0.15}" r="${r * 0.95}" fill="#5a2d1e" opacity="0.2" filter="url(#soft)"/>`;
    const t3 = tex3d('cookie', { color: '#e8b26a' }, r * 2.4 * PX);
    if (t3) return s + image3d(t3, x - 1.2 * r, y - 1.2 * r, 2.4 * r, 2.4 * r);
    s += `<g filter="url(#gelSmall)"><circle cx="${x}" cy="${y}" r="${r * 0.98}" fill="${radial('#ffe0a8', '#e8b26a', '#b97a35', 0.4, 0.35, 0.8)}"/></g>`;
    [[-0.4, -0.3], [0.3, -0.45], [0.45, 0.25], [-0.2, 0.4], [0.05, -0.02], [-0.55, 0.15]].forEach(([dx, dy], i) => { s += `<ellipse cx="${x + dx * r}" cy="${y + dy * r}" rx="${r * (i % 2 ? 0.12 : 0.15)}" ry="${r * 0.11}" fill="#5a2d1e"/>`; });
    return s + `<ellipse cx="${x - r * 0.35}" cy="${y - r * 0.55}" rx="${r * 0.25}" ry="${r * 0.09}" fill="#fff" opacity="0.6" transform="rotate(-25 ${x - r * 0.35} ${y - r * 0.55})"/>`;
  }
  // 놈놈이 던진 회색 방해 거품
  function junkBubble(x, y, r) { return bubble(x, y, r, '#8e84a8', { mood: 'angry' }) + `<path d="M${x - r * 0.75} ${y + r * 0.55} Q${x} ${y + r * 0.9} ${x + r * 0.75} ${y + r * 0.55}" stroke="#5c5272" stroke-width="${r * 0.08}" fill="none" opacity="0.6"/>`; }

  // ---------- 월드 2~5 배경 소품 ----------
  function mushroom(x, y, s = 1, cap = '#ff5f7a') {
    let g = groundShadow(x + 2 * s, y + 2, 16 * s, 4 * s, 0.25);
    const t3 = tex3d('mushroom', { color: cap }, 79 * s * PX);
    if (t3) return g + image3d(t3, x - 39.5 * s, y - 29.6 * s - 39.5 * s, 79 * s, 79 * s);
    g += `<path d="M${x - 6 * s} ${y} Q${x - 7 * s} ${y - 16 * s} ${x - 4 * s} ${y - 20 * s} L${x + 4 * s} ${y - 20 * s} Q${x + 7 * s} ${y - 16 * s} ${x + 6 * s} ${y} Z" fill="${linear([[0, '#fff8ee'], [1, '#e8d6c0']], 0, 0, 1, 0)}"/>`;
    g += `<g filter="url(#glass)"><path d="M${x - 20 * s} ${y - 16 * s} Q${x - 18 * s} ${y - 38 * s} ${x} ${y - 38 * s} Q${x + 18 * s} ${y - 38 * s} ${x + 20 * s} ${y - 16 * s} Q${x} ${y - 11 * s} ${x - 20 * s} ${y - 16 * s} Z" fill="${radial(light(cap, 0.35), cap, dark(cap, 0.15), 0.4, 0.3, 0.8)}" opacity="0.95"/></g>`;
    return g + `<circle cx="${x - 8 * s}" cy="${y - 28 * s}" r="${3 * s}" fill="#fff"/><circle cx="${x + 6 * s}" cy="${y - 31 * s}" r="${2.4 * s}" fill="#fff"/><circle cx="${x + 12 * s}" cy="${y - 22 * s}" r="${2 * s}" fill="#fff"/>`;
  }
  function cottonTree(x, y, s = 1, c = '#ffb3e0') {
    let g = groundShadow(x + 4 * s, y + 2, 20 * s, 5 * s, 0.25);
    const t3 = tex3d('tree', { color: c, mood: 'cotton' }, 86 * s * PX);
    if (t3) return g + image3d(t3, x - 43 * s, y - 32.2 * s - 43 * s, 86 * s, 86 * s);
    g += `<rect x="${x - 2.5 * s}" y="${y - 30 * s}" width="${5 * s}" height="${30 * s}" rx="${2.5 * s}" fill="#f6e6d2"/>`;
    return g + cloud(x, y - 44 * s, 0.75 * s, 0.98, light(c, 0.3), c);
  }
  function stalactite(x, y, len, c = '#d08a3a') {
    const u = len / 6.6, t3 = tex3d('stalactite', { color: c }, 7.2 * u * PX);   // 3D: 그림 위 끝 = 매달린 곳, 끝(방울 위)까지 6.6칸
    if (t3) return image3d(t3, x - 3.6 * u, y, 7.2 * u, 7.2 * u);
    return `<path d="M${x - len * 0.22} ${y} Q${x - len * 0.08} ${y + len * 0.6} ${x} ${y + len} Q${x + len * 0.08} ${y + len * 0.6} ${x + len * 0.22} ${y} Z" fill="${linear([[0, dark(c, 0.15)], [0.5, c], [1, light(c, 0.35)]], 0, 0, 1, 0)}"/><circle cx="${x}" cy="${y + len + 4}" r="${len * 0.07}" fill="${light(c, 0.3)}"/>`;
  }
  function crystalRock(x, y, s = 1, c = '#9fd8ff') {
    let g = groundShadow(x, y + 2, 22 * s, 5 * s, 0.3);
    const p3 = prop3d('crystal', { color: c }, x, y, 12 * s);
    if (p3) return g + p3 + `<circle cx="${x}" cy="${y - 20 * s}" r="${18 * s}" fill="${c}" opacity="0.25" filter="url(#soft12)"/>`;
    [[-10, 26, -12], [0, 40, 0], [11, 30, 14]].forEach(([dx, h, rot]) => {
      g += `<g transform="rotate(${rot} ${x + dx * s} ${y})"><path d="M${x + dx * s - 6 * s} ${y} L${x + dx * s - 6 * s} ${y - h * s * 0.7} L${x + dx * s} ${y - h * s} L${x + dx * s + 6 * s} ${y - h * s * 0.7} L${x + dx * s + 6 * s} ${y} Z" fill="${linear([[0, light(c, 0.5)], [0.5, c], [1, dark(c, 0.25)]], 0, 0, 1, 0)}" opacity="0.92"/><path d="M${x + dx * s - 2 * s} ${y - 4 * s} L${x + dx * s - 2 * s} ${y - h * s * 0.65}" stroke="#fff" stroke-width="${1.5 * s}" opacity="0.8"/></g>`;
    });
    return g + `<circle cx="${x}" cy="${y - 20 * s}" r="${18 * s}" fill="${c}" opacity="0.35" filter="url(#soft12)"/>`;
  }
  function puddingHill(x, y, s = 1, c = '#ffd36a') {
    let g = groundShadow(x, y + 2, 60 * s, 10 * s, 0.3);
    const p3 = prop3d('pudding', { color: c }, x, y, 25 * s);
    if (p3) return g + p3;
    g += `<g filter="url(#glass)"><path d="M${x - 58 * s} ${y} L${x - 44 * s} ${y - 70 * s} Q${x} ${y - 82 * s} ${x + 44 * s} ${y - 70 * s} L${x + 58 * s} ${y} Z" fill="${radial(light(c, 0.35), c, dark(c, 0.12), 0.4, 0.3, 0.85)}" opacity="0.95"/></g>`;
    g += `<path d="M${x - 46 * s} ${y - 62 * s} L${x - 44 * s} ${y - 70 * s} Q${x} ${y - 82 * s} ${x + 44 * s} ${y - 70 * s} L${x + 46 * s} ${y - 62 * s} Q${x + 36 * s} ${y - 52 * s} ${x + 30 * s} ${y - 60 * s} Q${x + 22 * s} ${y - 40 * s} ${x + 12 * s} ${y - 58 * s} Q${x} ${y - 52 * s} ${x - 14 * s} ${y - 58 * s} Q${x - 26 * s} ${y - 44 * s} ${x - 32 * s} ${y - 60 * s} Q${x - 40 * s} ${y - 54 * s} ${x - 46 * s} ${y - 62 * s} Z" fill="${linear([[0, '#b8651e'], [1, '#7a3a0e']], 0, 0, 0, 1)}" opacity="0.92"/>`;
    return g + `<ellipse cx="${x - 22 * s}" cy="${y - 70 * s}" rx="${12 * s}" ry="${3 * s}" fill="#fff" opacity="0.6"/>`;
  }
  function gear(x, y, r, c = '#c9d3ea') {
    const t3 = tex3d('gear', { color: c }, 4.5 * r * PX);   // 가운데 기준 (그림 1칸 = r/1.6)
    if (t3) return image3d(t3, x - 2.25 * r, y - 2.25 * r, 4.5 * r, 4.5 * r);
    let teeth = ''; for (let i = 0; i < 8; i++) teeth += `<rect x="${x - r * 0.16}" y="${y - r * 1.18}" width="${r * 0.32}" height="${r * 0.4}" rx="${r * 0.06}" fill="${dark(c, 0.15)}" transform="rotate(${i * 45} ${x} ${y})"/>`;
    return teeth + `<g filter="url(#gelSmall)"><circle cx="${x}" cy="${y}" r="${r}" fill="${radial(light(c, 0.4), c, dark(c, 0.2), 0.4, 0.3, 0.8)}"/></g><circle cx="${x}" cy="${y}" r="${r * 0.32}" fill="${dark(c, 0.35)}"/>`;
  }
  function pipe(x, y, w, h, c = '#ff9fc0') {
    // 3D: 관 그림(폭의 7.0/7.2를 관이 채움)을 길이 방향으로 늘인다
    const hz = w > h, d = Math.min(w, h), e = d * (7.2 / 7.0 - 1) / 2, t3 = tex3d('pipe', { color: c, mood: hz ? 'h' : 'v' }, d * PX);
    if (t3) return hz ? image3d(t3, x, y - e, w, h + 2 * e) : image3d(t3, x - e, y, w + 2 * e, h);
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(w, h) * 0.3}" fill="${w > h ? linear([[0, light(c, 0.45)], [0.5, c], [1, dark(c, 0.25)]], 0, 0, 0, 1) : linear([[0, light(c, 0.45)], [0.5, c], [1, dark(c, 0.25)]], 0, 0, 1, 0)}"/>`;
  }
  function factory(x, y, s = 1, wall = '#ffe1f0', roof = '#ff8fb1') {
    let g = groundShadow(x, y + 3, 80 * s, 10 * s, 0.3);
    const p3 = prop3d('factory', { color: roof, mood: wall }, x, y, 24 * s);
    if (p3) return g + p3 + `<circle cx="${x - 42 * s}" cy="${y - 128 * s}" r="${10 * s}" fill="#fff" opacity="0.8" filter="url(#soft6)"/><circle cx="${x + 37 * s}" cy="${y - 117 * s}" r="${8 * s}" fill="#fff" opacity="0.8" filter="url(#soft6)"/>`;
    g += pipe(x - 50 * s, y - 120 * s, 16 * s, 70 * s, '#c9d3ea') + pipe(x + 30 * s, y - 110 * s, 14 * s, 60 * s, '#c9d3ea');
    g += `<circle cx="${x - 42 * s}" cy="${y - 130 * s}" r="${10 * s}" fill="#fff" opacity="0.8" filter="url(#soft6)"/><circle cx="${x + 37 * s}" cy="${y - 122 * s}" r="${8 * s}" fill="#fff" opacity="0.8" filter="url(#soft6)"/>`;
    g += `<g filter="url(#glass)"><rect x="${x - 70 * s}" y="${y - 60 * s}" width="${140 * s}" height="${60 * s}" rx="${10 * s}" fill="${radial(light(wall, 0.3), wall, dark(wall, 0.1), 0.4, 0.3, 0.9)}"/></g>`;
    for (let i = 0; i < 4; i++) g += `<path d="M${x - 70 * s + i * 35 * s} ${y - 60 * s} L${x - 52 * s + i * 35 * s} ${y - 82 * s} L${x - 35 * s + i * 35 * s} ${y - 60 * s} Z" fill="${radial(light(roof, 0.35), roof, dark(roof, 0.2), 0.4, 0.4, 0.8)}"/>`;
    for (let i = 0; i < 4; i++) g += `<rect x="${x - 58 * s + i * 32 * s}" y="${y - 44 * s}" width="${18 * s}" height="${16 * s}" rx="${4 * s}" fill="#fff6c8"/>`;
    return g + `<rect x="${x - 14 * s}" y="${y - 26 * s}" width="${28 * s}" height="${26 * s}" rx="${6 * s}" fill="${dark(roof, 0.15)}"/>`;
  }
  function belt(x, y, w, s = 1) {
    const t3 = tex3d('pipe', { color: '#6f7a99', mood: 'h' }, 12 * s * PX);   // 3D: 둥근 벨트 몸통 (가로 관 그림을 늘여서) + 그 위 눈금
    let g = t3 ? image3d(t3, x, y - 0.2 * s, w, 12.4 * s) : `<rect x="${x}" y="${y}" width="${w}" height="${12 * s}" rx="${6 * s}" fill="${linear([[0, '#8f99b5'], [1, '#4f5873']], 0, 0, 0, 1)}"/>`;
    for (let i = 0; i < w / (14 * s); i++) g += `<rect x="${x + 4 * s + i * 14 * s}" y="${y + 2 * s}" width="${6 * s}" height="${3 * s}" rx="${1.5 * s}" fill="#c9d3ea" opacity="0.8"/>`;
    if (t3) return g + gear(x + 6 * s, y + 6 * s, 5.5 * s) + gear(x + w - 6 * s, y + 6 * s, 5.5 * s);
    return g + `<circle cx="${x + 6 * s}" cy="${y + 6 * s}" r="${7 * s}" fill="#c9d3ea"/><circle cx="${x + w - 6 * s}" cy="${y + 6 * s}" r="${7 * s}" fill="#c9d3ea"/>`;
  }
  function giftBox(x, y, s = 1, c = '#4fb4ff') {
    let g = groundShadow(x + 3 * s, y + 2, 18 * s, 4 * s, 0.25);
    const p3 = prop3d('gift', { color: c }, x, y, 11.5 * s);
    if (p3) return g + p3;
    g += `<g filter="url(#gelSmall)"><rect x="${x - 15 * s}" y="${y - 26 * s}" width="${30 * s}" height="${26 * s}" rx="${4 * s}" fill="${radial(light(c, 0.35), c, dark(c, 0.15), 0.4, 0.3, 0.8)}"/></g>`;
    return g + `<rect x="${x - 3 * s}" y="${y - 26 * s}" width="${6 * s}" height="${26 * s}" fill="#fff" opacity="0.85"/><path d="M${x} ${y - 26 * s} Q${x - 12 * s} ${y - 38 * s} ${x - 10 * s} ${y - 26 * s} Z M${x} ${y - 26 * s} Q${x + 12 * s} ${y - 38 * s} ${x + 10 * s} ${y - 26 * s} Z" fill="#fff" opacity="0.9"/>`;
  }
  function pot(x, y, s = 1) {
    let g = groundShadow(x, y + 3, 60 * s, 10 * s, 0.35);
    const p3 = prop3d('pot', { color: '#ff5f8a' }, x, y, 26 * s);
    if (p3) return g + p3;
    g += `<path d="M${x - 56 * s} ${y - 70 * s} Q${x - 60 * s} ${y} ${x} ${y} Q${x + 60 * s} ${y} ${x + 56 * s} ${y - 70 * s} Z" fill="${linear([[0, '#9aa3c0'], [0.4, '#5d6688'], [1, '#2f3552']], 0, 0, 1, 0)}"/>`;
    g += `<ellipse cx="${x}" cy="${y - 70 * s}" rx="${58 * s}" ry="${12 * s}" fill="#c9d3ea"/><ellipse cx="${x}" cy="${y - 70 * s}" rx="${50 * s}" ry="${9 * s}" fill="${radial('#ffb3e0', '#ff5f8a', '#a8245a', 0.5, 0.5, 0.8)}"/>`;
    for (let i = 0; i < 4; i++) g += `<circle cx="${x - 30 * s + i * 20 * s}" cy="${y - 74 * s - (i % 2) * 6 * s}" r="${(5 + (i % 2) * 3) * s}" fill="#ffd1e8" opacity="0.85"/>`;
    return g + `<path d="M${x + 40 * s} ${y - 80 * s} L${x + 70 * s} ${y - 140 * s}" stroke="#e8d6c0" stroke-width="${8 * s}" stroke-linecap="round"/><ellipse cx="${x + 72 * s}" cy="${y - 146 * s}" rx="${10 * s}" ry="${14 * s}" fill="#e8d6c0"/>`;
  }
  function mirror(x, y, s = 1) {
    const p3 = prop3d('mirror', { color: '#ffe08a' }, x, y, 16 * s);
    if (p3) return groundShadow(x, y + 2, 22 * s, 5 * s, 0.25) + p3;
    return `<ellipse cx="${x}" cy="${y - 40 * s}" rx="${24 * s}" ry="${38 * s}" fill="${linear([[0, '#ffe08a'], [1, '#c9861f']], 0, 0, 1, 1)}"/><ellipse cx="${x}" cy="${y - 40 * s}" rx="${19 * s}" ry="${32 * s}" fill="${linear([[0, '#e8f6ff'], [0.5, '#b8c8ff'], [1, '#d8c8ff']], 0, 0, 1, 1)}"/><path d="M${x - 10 * s} ${y - 60 * s} L${x + 2 * s} ${y - 66 * s} M${x - 12 * s} ${y - 48 * s} L${x + 8 * s} ${y - 58 * s}" stroke="#fff" stroke-width="${2.5 * s}" stroke-linecap="round" opacity="0.9"/><rect x="${x - 4 * s}" y="${y - 4 * s}" width="${8 * s}" height="${6 * s}" fill="#c9861f"/>`;
  }
  // 분홍 사탕 대포 (조각별). x,y = 받침 가운데. 포신은 따로 돌려 그리므로 분리.
  const wheel = (wx, wy, r) => `<g filter="url(#gelSmall)"><circle cx="${wx}" cy="${wy}" r="${r}" fill="${radial('#ffe9a8', '#ffc84a', '#d98a00', 0.4, 0.3, 0.8)}"/></g><circle cx="${wx}" cy="${wy}" r="${r * 0.62}" fill="${dark('#ffc84a', 0.35)}"/><circle cx="${wx}" cy="${wy}" r="${r * 0.5}" fill="${radial('#fff2c8', '#ffd56a', '#e9a52a', 0.4, 0.3, 0.8)}"/>${[0, 45, 90, 135].map(a => `<rect x="${wx - r * 0.07}" y="${wy - r * 0.5}" width="${r * 0.14}" height="${r}" rx="${r * 0.07}" fill="#d98a00" transform="rotate(${a} ${wx} ${wy})"/>`).join('')}<circle cx="${wx}" cy="${wy}" r="${r * 0.16}" fill="#e66a8f"/>`;
  function cannonBase(x, y, s = 1) {
    let g = groundShadow(x, y + 6 * s, 46 * s, 10 * s, 0.35);
    const u = 12.2 * s, t3 = tex3d('base', { color: '#ff8cb8' }, 7.2 * u * PX);
    if (t3) return g + image3d(t3, x - 3.6 * u, y - 3.6 * u, 7.2 * u, 7.2 * u);
    g += `<path d="M${x - 40 * s} ${y} L${x - 32 * s} ${y - 12 * s} L${x + 32 * s} ${y - 12 * s} L${x + 40 * s} ${y} Z" fill="${linear([[0, '#ffb8d0'], [1, '#e66a8f']], 0, 0, 0, 1)}"/>`;
    g += `<rect x="${x - 40 * s}" y="${y}" width="${80 * s}" height="${7 * s}" fill="#c2457a"/>`;
    return g;
  }
  // 포신: 회전 중심 (px,py), 위쪽(-y)을 향한 상태로 그림
  function cannonBarrel(px, py, s = 1) {
    const bl = 62 * s, bw = 30 * s;
    const u = 11.54 * s, t3 = tex3d('barrel', { color: '#ff8cb8' }, 7.2 * u * PX);
    if (t3) return image3d(t3, px - 3.6 * u, py - 6.3 * u, 7.2 * u, 7.2 * u);
    return `<rect x="${px - bw / 2}" y="${py - bl}" width="${bw}" height="${bl}" rx="${bw * 0.18}" fill="${linear([[0, '#fff0f6'], [0.3, '#ffffff'], [0.65, '#ffd6e6'], [1, '#e08fb0']], 0, 0, 1, 0)}"/>
    <rect x="${px - bw / 2 - 3 * s}" y="${py - bl - 4 * s}" width="${bw + 6 * s}" height="${12 * s}" rx="${4 * s}" fill="${linear([[0, '#ffd1e3'], [0.5, '#ff7fae'], [1, '#c2457a']], 0, 0, 1, 0)}"/>
    <ellipse cx="${px}" cy="${py - bl - 4 * s}" rx="${bw / 2 + 3 * s}" ry="${5 * s}" fill="#7a2d5e"/>
    <ellipse cx="${px}" cy="${py - bl - 4 * s}" rx="${bw / 2 - 2 * s}" ry="${3.5 * s}" fill="#4a1d3a"/>
    <rect x="${px - bw / 2 - 2 * s}" y="${py - bl * 0.45}" width="${bw + 4 * s}" height="${9 * s}" rx="${3 * s}" fill="${linear([[0, '#ffd1e3'], [0.5, '#ff7fae'], [1, '#c2457a']], 0, 0, 1, 0)}"/>`;
  }
  function cannonHousing(px, py, s = 1) {
    const t3 = tex3d('housing', { color: '#ff9fc0' }, 17 * s * 2.4 * PX);
    if (t3) return image3d(t3, px - 17 * s * 1.2, py - 17 * s * 1.2, 17 * s * 2.4, 17 * s * 2.4) + starSvg(px, py, 8 * s, '#ffd54a', '#d98a00');
    return `<g filter="url(#gelSmall)"><circle cx="${px}" cy="${py}" r="${17 * s}" fill="${radial('#ffe6f0', '#ff9fc0', '#c2457a', 0.4, 0.3, 0.8)}"/></g>` + starSvg(px, py, 8 * s, '#ffd54a', '#d98a00');
  }
  const cannonWheel = (wx, wy, r) => { const t3 = tex3d('wheel', { color: '#ff9fc0' }, r * 2.4 * PX); return t3 ? image3d(t3, wx - r * 1.2, wy - r * 1.2, r * 2.4, r * 2.4) : wheel(wx, wy, r); };

  // ---------- 출력 ----------
  function svg(body, box, extra = '') {
    const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${box.w}" height="${box.h}" viewBox="${box.x} ${box.y} ${box.w} ${box.h}" ${extra}>${defs(box.lx !== undefined ? box.lx : cx - box.w * 0.15, box.ly !== undefined ? box.ly : cy - box.h * 0.45 - 100)}${flushGrads()}${body}</svg>`;
  }
  const dataURL = s => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  // <img> 태그 문자열 (그림 상자 크기 그대로)
  function img(body, box, attrs = '') {
    return `<img alt="" draggable="false" src="${dataURL(svg(body, box))}" width="${box.w}" height="${box.h}" ${attrs}>`;
  }
  // 캔버스 스프라이트: 처음 부르면 굽기 시작하고 null, 다 구워지면 캔버스를 돌려준다
  const sprites = {};
  function sprite(key, build, dpr, onReady) {
    const k = key + '@' + Math.round(dpr * 100);
    const e = sprites[k];
    if (e) return e.cv || null;
    const ent = sprites[k] = { cv: null };
    const { body, box } = build();
    const im = new Image();
    im.onload = () => {
      const cv = document.createElement('canvas');
      cv.width = Math.max(1, Math.ceil(box.w * dpr)); cv.height = Math.max(1, Math.ceil(box.h * dpr));
      cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
      ent.cv = cv; ent.box = box;
      if (onReady) onReady();
    };
    im.onerror = () => { delete sprites[k]; console.warn('sprite 굽기 실패:', key); };
    im.src = dataURL(svg(body, box));
    return null;
  }
  // 아직 굽는 중인 스프라이트 수 (성능 측정·테스트용)
  const pending = () => Object.values(sprites).filter(e => !e.cv).length;
  function spriteBox(key, dpr) { const e = sprites[key + '@' + Math.round(dpr * 100)]; return e && e.box; }
  // keepDpr 로 구운 것만 남기고 나머지는 버린다
  function clearSprites(keepDpr) { const suf = '@' + Math.round(keepDpr * 100); for (const k of Object.keys(sprites)) if (!k.endsWith(suf)) delete sprites[k]; }

  return { C, HILLS, mix, light, dark, defs, radial, linear, flushGrads, groundShadow, bigEyes, jelly, bubble, house, tree, cloud, starSvg, bigStar, coin, confetti, sparkle, flower, hill, fence, road, sampleCurve, tower, castle, fountain, lamp, windmill, starsSky, boss, nomnom, bubbleExtra, crystalBubble, cookie, junkBubble, mushroom, cottonTree, stalactite, crystalRock, puddingHill, gear, pipe, factory, belt, giftBox, pot, mirror, cannonBase, cannonBarrel, cannonHousing, cannonWheel, svg, dataURL, img, sprite, spriteBox, clearSprites, pending };
})();
