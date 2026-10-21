// gummy.js — 투명 구미 젤리 그림 라이브러리 (브라우저용)
// design/mockups-2.5d/{lib,concepts,gummy,scenes}.cjs 의 그림 코드를 게임에서 쓰도록 옮겼다.
// 모든 그림은 SVG 문자열로 만든 뒤 <img> 또는 캔버스 스프라이트로 굽는다 (글자는 들어가지 않음 → 웹폰트 문제 없음).
window.Gummy = (() => {
  'use strict';
  let _id = 0;
  const uid = p => p + (++_id);
  const C = { pink: '#ff5f8a', blue: '#4fb4ff', yellow: '#ffd23f', green: '#5ed46a', purple: '#a76bff', peach: '#ff9f7a', mint: '#4fdcc4', lilac: '#ffb3e0', mal: '#ff7fae' };
  const HILLS = ['#b9efc9', '#9be8b3', '#7fdc9a', '#6ad28b'];

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
    g += `<ellipse cx="${x}" cy="${y}" rx="${32 * s}" ry="${11 * s}" fill="#cfd3e6"/><ellipse cx="${x}" cy="${y - 5 * s}" rx="${32 * s}" ry="${11 * s}" fill="${linear([[0, '#fbfcff'], [1, '#d8dcee']], 0, 0, 0, 1)}"/>`;
    g += `<ellipse cx="${x}" cy="${y - 5 * s}" rx="${26 * s}" ry="${8 * s}" fill="${radial('#bfe9ff', '#6ec6ff', '#3fa7f0', 0.4, 0.3, 0.8)}"/>`;
    g += `<rect x="${x - 3 * s}" y="${y - 30 * s}" width="${6 * s}" height="${26 * s}" fill="${linear([[0, '#fff'], [1, '#c9cde0']], 0, 0, 1, 0)}"/><ellipse cx="${x}" cy="${y - 30 * s}" rx="${9 * s}" ry="${3 * s}" fill="#e8ebf5"/>`;
    g += `<path d="M${x} ${y - 32 * s} C${x - 14 * s} ${y - 46 * s} ${x - 22 * s} ${y - 20 * s} ${x - 16 * s} ${y - 6 * s}" stroke="#bfe9ff" stroke-width="${3 * s}" fill="none" opacity="0.9"/><path d="M${x} ${y - 32 * s} C${x + 14 * s} ${y - 46 * s} ${x + 22 * s} ${y - 20 * s} ${x + 16 * s} ${y - 6 * s}" stroke="#bfe9ff" stroke-width="${3 * s}" fill="none" opacity="0.9"/><path d="M${x} ${y - 32 * s} L${x} ${y - 44 * s}" stroke="#dff4ff" stroke-width="${3 * s}" stroke-linecap="round"/>`;
    g += `<circle cx="${x - 3 * s}" cy="${y - 46 * s}" r="${2 * s}" fill="#fff"/><circle cx="${x + 10 * s}" cy="${y - 40 * s}" r="${1.5 * s}" fill="#fff"/>`;
    return g;
  }
  function lamp(x, y, s = 1, on = true) {
    let g = `<path d="M${x - 2 * s} ${y} L${x - 1.5 * s} ${y - 34 * s} L${x + 1.5 * s} ${y - 34 * s} L${x + 2 * s} ${y} Z" fill="#5a3f8f"/><ellipse cx="${x}" cy="${y}" rx="${4 * s}" ry="${1.6 * s}" fill="#4a2c86"/>`;
    g += `<rect x="${x - 5 * s}" y="${y - 44 * s}" width="${10 * s}" height="${11 * s}" rx="${2 * s}" fill="${on ? '#ffe8a3' : '#dfe6ff'}"/><path d="M${x - 6 * s} ${y - 44 * s} L${x} ${y - 49 * s} L${x + 6 * s} ${y - 44 * s} Z" fill="#5a3f8f"/>`;
    if (on) g += `<circle cx="${x}" cy="${y - 38 * s}" r="${12 * s}" fill="#ffd36a" opacity="0.55" filter="url(#soft12)"/>`;
    return g;
  }
  function windmill(x, y, s = 1) {
    let g = groundShadow(x + 6 * s, y + 2, 26 * s, 7 * s, 0.3);
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
  // 보스 뭉치: 보라 젤리 + 뿔 + 왕관 + 보랏빛 발광
  function boss(x, y, r, { mood = 'angry' } = {}) {
    let g = `<ellipse cx="${x}" cy="${y}" rx="${r * 1.3}" ry="${r * 1.15}" fill="#c89cff" opacity="0.45" filter="url(#soft12)"/>`;
    const horn = sx => `<path d="M${x + sx * r * 0.55} ${y - r * 0.75} Q${x + sx * r * 0.9} ${y - r * 1.05} ${x + sx * r * 0.75} ${y - r * 1.45} Q${x + sx * r * 0.95} ${y - r * 1.1} ${x + sx * r * 1.0} ${y - r * 0.6} Z" fill="${linear([[0, '#8a5cf0'], [1, '#4a1d7a']], 0, 0, 0, 1)}" opacity="0.9"/>`;
    g += horn(-1) + horn(1);
    g += jelly(x, y, r, '#8a5cf0', { mood, faceScale: 1.05 });
    g += `<path d="M${x - r * 0.3} ${y - r * 0.98} L${x - r * 0.32} ${y - r * 1.25} L${x - r * 0.15} ${y - r * 1.08} L${x} ${y - r * 1.32} L${x + r * 0.15} ${y - r * 1.08} L${x + r * 0.32} ${y - r * 1.25} L${x + r * 0.3} ${y - r * 0.98} Z" fill="${linear([[0, '#fff0b3'], [1, '#e9a52a']], 0, 0, 0, 1)}" stroke="#b36b00" stroke-width="1.5" stroke-linejoin="round"/>`;
    return g;
  }
  // 분홍 사탕 대포 (조각별). x,y = 받침 가운데. 포신은 따로 돌려 그리므로 분리.
  const wheel = (wx, wy, r) => `<g filter="url(#gelSmall)"><circle cx="${wx}" cy="${wy}" r="${r}" fill="${radial('#ffe9a8', '#ffc84a', '#d98a00', 0.4, 0.3, 0.8)}"/></g><circle cx="${wx}" cy="${wy}" r="${r * 0.62}" fill="${dark('#ffc84a', 0.35)}"/><circle cx="${wx}" cy="${wy}" r="${r * 0.5}" fill="${radial('#fff2c8', '#ffd56a', '#e9a52a', 0.4, 0.3, 0.8)}"/>${[0, 45, 90, 135].map(a => `<rect x="${wx - r * 0.07}" y="${wy - r * 0.5}" width="${r * 0.14}" height="${r}" rx="${r * 0.07}" fill="#d98a00" transform="rotate(${a} ${wx} ${wy})"/>`).join('')}<circle cx="${wx}" cy="${wy}" r="${r * 0.16}" fill="#e66a8f"/>`;
  function cannonBase(x, y, s = 1) {
    let g = groundShadow(x, y + 6 * s, 46 * s, 10 * s, 0.35);
    g += `<path d="M${x - 40 * s} ${y} L${x - 32 * s} ${y - 12 * s} L${x + 32 * s} ${y - 12 * s} L${x + 40 * s} ${y} Z" fill="${linear([[0, '#ffb8d0'], [1, '#e66a8f']], 0, 0, 0, 1)}"/>`;
    g += `<rect x="${x - 40 * s}" y="${y}" width="${80 * s}" height="${7 * s}" fill="#c2457a"/>`;
    return g;
  }
  // 포신: 회전 중심 (px,py), 위쪽(-y)을 향한 상태로 그림
  function cannonBarrel(px, py, s = 1) {
    const bl = 62 * s, bw = 30 * s;
    return `<rect x="${px - bw / 2}" y="${py - bl}" width="${bw}" height="${bl}" rx="${bw * 0.18}" fill="${linear([[0, '#fff0f6'], [0.3, '#ffffff'], [0.65, '#ffd6e6'], [1, '#e08fb0']], 0, 0, 1, 0)}"/>
    <rect x="${px - bw / 2 - 3 * s}" y="${py - bl - 4 * s}" width="${bw + 6 * s}" height="${12 * s}" rx="${4 * s}" fill="${linear([[0, '#ffd1e3'], [0.5, '#ff7fae'], [1, '#c2457a']], 0, 0, 1, 0)}"/>
    <ellipse cx="${px}" cy="${py - bl - 4 * s}" rx="${bw / 2 + 3 * s}" ry="${5 * s}" fill="#7a2d5e"/>
    <ellipse cx="${px}" cy="${py - bl - 4 * s}" rx="${bw / 2 - 2 * s}" ry="${3.5 * s}" fill="#4a1d3a"/>
    <rect x="${px - bw / 2 - 2 * s}" y="${py - bl * 0.45}" width="${bw + 4 * s}" height="${9 * s}" rx="${3 * s}" fill="${linear([[0, '#ffd1e3'], [0.5, '#ff7fae'], [1, '#c2457a']], 0, 0, 1, 0)}"/>`;
  }
  function cannonHousing(px, py, s = 1) {
    return `<g filter="url(#gelSmall)"><circle cx="${px}" cy="${py}" r="${17 * s}" fill="${radial('#ffe6f0', '#ff9fc0', '#c2457a', 0.4, 0.3, 0.8)}"/></g>` + starSvg(px, py, 8 * s, '#ffd54a', '#d98a00');
  }
  const cannonWheel = (wx, wy, r) => wheel(wx, wy, r);

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
    im.src = dataURL(svg(body, box));
    return null;
  }
  function spriteBox(key, dpr) { const e = sprites[key + '@' + Math.round(dpr * 100)]; return e && e.box; }

  return { C, HILLS, mix, light, dark, defs, radial, linear, flushGrads, groundShadow, bigEyes, jelly, bubble, house, tree, cloud, starSvg, bigStar, coin, confetti, sparkle, flower, hill, fence, road, sampleCurve, tower, castle, fountain, lamp, windmill, starsSky, boss, cannonBase, cannonBarrel, cannonHousing, cannonWheel, svg, dataURL, img, sprite, spriteBox };
})();
