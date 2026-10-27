// Forest mockups: SVG overlays (UI + light FX) drawn over the raymarched plates.
const L = require('../mockups-2.5d/lib.cjs');
const Cc = require('../mockups-2.5d/concepts.cjs');
const { W, H, defs, radial, linear, flushGrads, button, panel, logo3d, sparkle, light, dark, speech } = L;
const S = Cc.STYLES.gummy;

let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

function fxDefs() {
  return `<defs>
  <filter id="b2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2"/></filter>
  <filter id="b5" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
  <filter id="b14" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
  <filter id="b30" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="30"/></filter>
  <filter id="fly" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <linearGradient id="shaft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6d0" stop-opacity="0.75"/><stop offset="0.6" stop-color="#fff2c0" stop-opacity="0.25"/><stop offset="1" stop-color="#fff2c0" stop-opacity="0"/></linearGradient>
  </defs>`;
}

// soft light shafts falling from the canopy gap
function shafts(cx, top, n, spread, len, op = 1) {
  let g = `<g style="mix-blend-mode:screen" opacity="${op}" filter="url(#b14)">`;
  for (let i = 0; i < n; i++) {
    const a = (i / (n - 1) - 0.5) * spread + (rnd() - 0.5) * 0.08;
    const w0 = 6 + rnd() * 12, w1 = 30 + rnd() * 50, l = len * (0.7 + rnd() * 0.4);
    const x0 = cx + (rnd() - 0.5) * 40;
    const x1 = x0 + Math.sin(a) * l, y1 = top + Math.cos(a) * l;
    g += `<path d="M${x0 - w0} ${top} L${x0 + w0} ${top} L${x1 + w1} ${y1} L${x1 - w1} ${y1} Z" fill="url(#shaft)" opacity="${0.35 + rnd() * 0.4}"/>`;
  }
  return g + '</g>';
}
// out-of-focus light dots (bokeh) and floating pollen
function bokeh(n, area, rmin, rmax, colors, op = 0.5) {
  let g = `<g style="mix-blend-mode:screen">`;
  for (let i = 0; i < n; i++) {
    const x = area[0] + rnd() * area[2], y = area[1] + rnd() * area[3], r = rmin + rnd() * (rmax - rmin);
    const c = colors[i % colors.length];
    g += `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="${op * (0.4 + rnd() * 0.6)}" filter="url(#b2)"/>`;
    g += `<circle cx="${x}" cy="${y}" r="${r * 0.85}" fill="none" stroke="#fff" stroke-width="0.8" opacity="${op * 0.5}"/>`;
  }
  return g + '</g>';
}
function fireflies(n, area) {
  let g = '';
  for (let i = 0; i < n; i++) {
    const x = area[0] + rnd() * area[2], y = area[1] + rnd() * area[3], r = 1.2 + rnd() * 1.8;
    g += `<circle cx="${x}" cy="${y}" r="${r * 4}" fill="#fff3a0" opacity="0.35" filter="url(#b5)"/><circle cx="${x}" cy="${y}" r="${r}" fill="#fffbe0" filter="url(#fly)"/>`;
  }
  return g;
}
function petals(n, area) {
  let g = '';
  for (let i = 0; i < n; i++) {
    const x = area[0] + rnd() * area[2], y = area[1] + rnd() * area[3], s = 3 + rnd() * 3, rot = rnd() * 360;
    const c = ['#ffb3cf', '#ff8fb6', '#ffd1e3'][i % 3];
    g += `<ellipse cx="${x}" cy="${y}" rx="${s}" ry="${s * 0.55}" fill="${c}" opacity="0.9" transform="rotate(${rot} ${x} ${y})"/><ellipse cx="${x - s * 0.2}" cy="${y - s * 0.15}" rx="${s * 0.4}" ry="${s * 0.18}" fill="#fff" opacity="0.6" transform="rotate(${rot} ${x} ${y})"/>`;
  }
  return g;
}
// little bee buddy (like the reference's flying friend)
function bee(x, y, s = 1, flip = false) {
  const t = `translate(${x} ${y}) scale(${flip ? -s : s} ${s})`;
  return `<g transform="${t}">
    <ellipse cx="-6" cy="-14" rx="11" ry="7" fill="#eaf6ff" opacity="0.75" transform="rotate(-30 -6 -14)" stroke="#fff" stroke-width="0.8"/>
    <ellipse cx="6" cy="-15" rx="10" ry="6" fill="#eaf6ff" opacity="0.6" transform="rotate(25 6 -15)" stroke="#fff" stroke-width="0.8"/>
    <ellipse cx="0" cy="0" rx="15" ry="12" fill="${radial('#fff2a0', '#ffc928', '#d98a00', 0.38, 0.3, 0.8)}"/>
    <path d="M-5 -11 Q-2 0 -5 11" stroke="#4a2a10" stroke-width="3.6" fill="none" stroke-linecap="round" opacity="0.85"/>
    <path d="M3 -11.5 Q6 0 3 11.5" stroke="#4a2a10" stroke-width="3.6" fill="none" stroke-linecap="round" opacity="0.85"/>
    <circle cx="13" cy="-3" r="9" fill="${radial('#fff5c0', '#ffcf3a', '#e09a10', 0.35, 0.3, 0.8)}"/>
    <circle cx="16" cy="-5" r="3" fill="#1a1030"/><circle cx="17" cy="-6.2" r="1.1" fill="#fff"/>
    <circle cx="10.5" cy="-5" r="2.6" fill="#1a1030"/><circle cx="11.3" cy="-6" r="0.9" fill="#fff"/>
    <path d="M11 0 Q14 3 17 0" stroke="#5a2a10" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <ellipse cx="19" cy="-1" rx="2" ry="1.2" fill="#ff7a8a" opacity="0.6"/>
    <path d="M12 -11 Q11 -18 7 -20" stroke="#4a2a10" stroke-width="1.3" fill="none"/><circle cx="7" cy="-20" r="1.6" fill="#4a2a10"/>
    <path d="M16 -11 Q18 -18 22 -19" stroke="#4a2a10" stroke-width="1.3" fill="none"/><circle cx="22" cy="-19" r="1.6" fill="#4a2a10"/>
    <ellipse cx="-4" cy="-6" rx="5" ry="2.4" fill="#fff" opacity="0.6"/>
  </g>`;
}
function ribbon(x, y, w, h, text) {
  const color = S.ribbon, d = dark(color, 0.35);
  return `<g filter="url(#dropShadow)">
    <path d="M${x - w / 2 - 18} ${y - h / 2 + 6} L${x - w / 2 + 6} ${y - h / 2 + 6} L${x - w / 2 + 6} ${y + h / 2 + 6} L${x - w / 2 - 18} ${y + h / 2 + 6} L${x - w / 2 - 6} ${y + 6} Z" fill="${d}"/>
    <path d="M${x + w / 2 + 18} ${y - h / 2 + 6} L${x + w / 2 - 6} ${y - h / 2 + 6} L${x + w / 2 - 6} ${y + h / 2 + 6} L${x + w / 2 + 18} ${y + h / 2 + 6} L${x + w / 2 + 6} ${y + 6} Z" fill="${d}"/>
    <path d="M${x - w / 2} ${y - h / 2} Q${x} ${y - h / 2 - 5} ${x + w / 2} ${y - h / 2} L${x + w / 2} ${y + h / 2} Q${x} ${y + h / 2 - 5} ${x - w / 2} ${y + h / 2} Z" fill="${linear([[0, light(color, 0.25)], [1, color]], 0, 0, 0, 1)}"/>
    <path d="M${x - w / 2 + 8} ${y - h / 2 + 5} Q${x} ${y - h / 2} ${x + w / 2 - 8} ${y - h / 2 + 5}" stroke="#fff" stroke-width="3" fill="none" opacity="0.6" stroke-linecap="round"/>
    <text x="${x}" y="${y + 7}" text-anchor="middle" font-family="Noto Sans KR" font-weight="900" font-size="19" fill="#fff" filter="url(#textShadow)">${text}</text></g>`;
}
const img = (href, x, y, w, h, extra = '') => `<image href="${href}" x="${x}" y="${y}" width="${w}" height="${h}" ${extra}/>`;
// sprite helpers (sprite frame = ±3.6 units; bubble r=3, jelly foot at 87.5%)
const bubbleImg = (name, x, y, r) => { const s = 2 * r / (6 / 7.2); return img(`sprites/bubble-${name}.png`, x - s / 2, y - s / 2, s, s); };
const jellyImg = (name, x, footY, halfW) => { const s = 2 * halfW / 0.867; return `<ellipse cx="${x}" cy="${footY - 1}" rx="${halfW * 0.95}" ry="${halfW * 0.22}" fill="#1a3008" opacity="0.45" filter="url(#b5)"/>` + img(`sprites/${name}.png`, x - s / 2, footY - s * 0.875, s, s); };

function wrap(body) { return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs()}${Cc.extraDefs}${fxDefs()}${flushGrads()}${body}</svg>`; }

function titleOverlay() {
  seed = 11;
  let b = '';
  b += shafts(150, -20, 7, 0.9, 640, 0.9);
  b += `<ellipse cx="170" cy="40" rx="190" ry="120" fill="#fff4c8" opacity="0.35" filter="url(#b30)" style="mix-blend-mode:screen"/>`;
  b += bokeh(16, [0, 0, W, 360], 4, 13, ['#fff7c8', '#e8ffb0', '#ffe0f0']);
  b += bee(300, 395, 1.05, true);
  b += fireflies(22, [10, 330, 370, 330]);
  b += petals(4, [20, 700, 350, 60]) + petals(3, [20, 360, 120, 120]);
  // logo
  b += `<ellipse cx="195" cy="190" rx="175" ry="100" fill="#1d3a0c" opacity="0.28" filter="url(#b30)"/>`;
  b += logo3d(195, 160, 'JELLY', { fs: 92, extrude: 9, rotate: -3, ...S.logo.a });
  b += logo3d(200, 257, 'POP!', { fs: 104, extrude: 10, rotate: -3, ...S.logo.b });
  b += `<g filter="url(#bloom)">${sparkle(52, 118, 14) + sparkle(338, 108, 11) + sparkle(334, 212, 9, '#ffe27a') + sparkle(42, 255, 8)}</g>`;
  b += ribbon(195, 318, 236, 40, '젤리마을 대소동');
  // sparkles on the hero jelly
  b += `<g filter="url(#bloom)">${sparkle(150, 470, 7) + sparkle(250, 452, 6, '#fff7c8') + sparkle(222, 590, 5)}</g>`;
  b += `<rect x="0" y="660" width="${W}" height="184" fill="${linear([[0, '#0d2004', 0], [1, '#0d2004', 0.45]], 0, 0, 0, 1)}"/>`;
  b += button(195, 744, 268, 60, '모험 시작!', { color: S.btn, fs: 24 });
  b += button(195, 812, 220, 46, '스티커 북', { color: '#fdf6ff', fg: '#6a3bbf', fs: 18 });
  return wrap(b);
}

function rails(y0, h) {
  const rail = (x) => `<rect x="${x}" y="${y0}" width="11" height="${h}" rx="5.5" fill="${linear([[0, '#6b4424'], [0.45, '#a8774a'], [1, '#5a3a1e']], 0, 0, 1, 0)}"/><rect x="${x + 3}" y="${y0 + 4}" width="2.5" height="${h - 8}" rx="1.2" fill="#e8c08a" opacity="0.6"/>`;
  let g = rail(5) + rail(374);
  g += `<rect x="5" y="${y0 - 5}" width="380" height="13" rx="6.5" fill="${linear([[0, '#b5844f'], [1, '#6b4424']], 0, 0, 0, 1)}"/><rect x="10" y="${y0 - 3}" width="370" height="3" rx="1.5" fill="#f0cf9a" opacity="0.7"/>`;
  // leaves wrapped on the rails
  const leaf = (x, y, a, s = 1) => `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})"><path d="M0 0 C6 -8 16 -8 22 0 C16 8 6 8 0 0Z" fill="${linear([[0, '#9be05a'], [1, '#3f9a2a']], 0, 0, 1, 1)}"/><path d="M1 0 L20 0" stroke="#2f7a1e" stroke-width="0.9" opacity="0.7"/></g>`;
  [[10, 140, -30], [8, 260, 20], [12, 380, -40], [9, 500, 15], [381, 170, 200], [383, 300, 160], [380, 430, 210], [382, 540, 170], [60, 96, -10], [200, 94, 10], [320, 95, -170]].forEach(([x, y, a]) => g += leaf(x, y, a, 0.9));
  return g;
}

function playOverlay() {
  seed = 23;
  const C = { r: 'pink', y: 'yellow', b: 'blue', g: 'green', p: 'purple', o: 'peach' };
  let b = '';
  b += shafts(120, 80, 5, 0.7, 520, 0.55);
  b += `<rect x="16" y="100" width="358" height="470" rx="6" fill="${linear([[0, '#0d2a10', 0.35], [1, '#0d2a10', 0.12]], 0, 0, 0, 1)}"/>`;
  b += bokeh(10, [20, 110, 350, 440], 4, 10, ['#fff7c8', '#e8ffb0'], 0.35);
  b += rails(100, 470);
  b += `<line x1="20" y1="560" x2="370" y2="560" stroke="#ffe27a" stroke-width="2" stroke-dasharray="8 8" opacity="0.7"/>`;
  const rows = ['rrybbyggrr', 'rybbyggrr', 'yrr.bbgg.y', '..rrOgg...', '..bbrrgg..', '...byyg...'];
  const pop = ['4,2', '4,3', '5,3'];
  const r = 18.4, dx = r * 2, dy = r * 1.74, x0 = 12, y0 = 112;
  rows.forEach((row, ri) => { const off = ri % 2 ? r : 0; [...row].forEach((ch, ci) => {
    if (ch === '.' || pop.includes(`${ri},${ci}`)) return;
    const x = x0 + off + ci * dx + r, y = y0 + ri * dy + r;
    if (ch === 'O') { const s = 2 * r * 0.62 / 0.867; b += img('sprites/peach-worried.png', x - s / 2, y + r * 0.55 - s * 0.875, s, s) + `<g opacity="0.45">${bubbleImg('clear', x, y, r)}</g><circle cx="${x}" cy="${y}" r="${r-0.8}" fill="none" stroke="#fff" stroke-width="1.4" opacity="0.8"/><ellipse cx="${x-r*0.38}" cy="${y-r*0.45}" rx="${r*0.25}" ry="${r*0.13}" fill="#fff" opacity="0.9" transform="rotate(-35 ${x-r*0.38} ${y-r*0.45})"/>`; }
    else b += bubbleImg(C[ch], x, y, r);
  }); });
  b += L.sparkle(112 - 30, 262 - 25, 9) + L.sparkle(112 + 28, 262 + 10, 7, '#ffe27a');
  b += `<circle cx="112" cy="262" r="30" fill="#bfe6ff" opacity="0.55" filter="url(#b14)"/><circle cx="112" cy="262" r="16" fill="#fff" opacity="0.8" filter="url(#b5)"/>`;
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, d = 30 + (i % 3) * 8; b += `<circle cx="${112 + Math.cos(a) * d}" cy="${262 + Math.sin(a) * d}" r="${2.5 + (i % 3)}" fill="#8fd0ff" opacity="0.9"/><circle cx="${112 + Math.cos(a) * d - 1}" cy="${262 + Math.sin(a) * d - 1}" r="1" fill="#fff"/>`; }
  b += logo3d(112, 212, '+30', { fs: 34, fill: '#ffd23f', extrude: 3, gradTop: '#fff9d6', gradBottom: '#ff9f2a', stroke: '#5a2d91' });
  // aim dots
  for (let i = 1; i < 18; i++) { const t = i / 18; b += `<circle cx="${205 + (112 - 205) * t}" cy="${662 + (262 - 662) * t}" r="${2.6 - t * 0.8}" fill="#fff7c8" opacity="${0.95 - t * 0.5}" filter="url(#glow)"/>`; }
  b += bubbleImg('blue', 158, 470, r);
  b += fireflies(14, [10, 560, 370, 200]);
  // cannon (3D sprites): base + barrel rotated around its pivot
  const ang = -14, bw = 92, px = 214, py = 682;
  b += `<ellipse cx="${px}" cy="${py + 44}" rx="66" ry="11" fill="#1a3008" opacity="0.5" filter="url(#b5)"/>`;
  b += `<g transform="rotate(${ang} ${px} ${py})">${img('sprites/barrel.png', px - bw / 2, py - bw * 0.80, bw, bw)}</g>`;
  b += img('sprites/base.png', px - 58, py - 50, 116, 116);
  b += jellyImg('mal-joy', 118, 720, 38);
  b += speech(16, 600, 120, 28, '같은 색 3개!', { fs: 12, tail: 'right' });
  // queue
  b += jellyImg('q-pink', 316, 768, 11) + jellyImg('q-green', 296, 768, 11.5) + jellyImg('q-yellow', 274, 770, 13);
  b += `<text x="334" y="768" font-family="'Baloo 2'" font-weight="800" font-size="20" fill="#fff" filter="url(#textShadow)">×12</text>`;
  b += topHudF({ title: '꽃밭 언덕', sub: '스테이지 3', right1: '구할 친구', right2: '0 / 1' });
  b += panel(90, 796, 210, 34, { fill: S.panel, op: 0.88, r: 17 });
  b += `<text x="195" y="819" text-anchor="middle" font-family="Noto Sans KR" font-weight="800" font-size="14" fill="#fff">점수 <tspan fill="#ffe27a">860</tspan>  ·  남은 발사 <tspan fill="#ffe27a">12</tspan></text>`;
  return wrap(b);
}
function topHudF({ title, sub, right1, right2 }) {
  const pf = S.panel; let g = '';
  g += panel(14, 46, 46, 46, { fill: pf, op: 0.9 });
  g += `<path d="M37 56 L24 68 L28 68 L28 82 L46 82 L46 68 L50 68 Z" fill="#fff"/><rect x="33" y="73" width="8" height="9" fill="${pf}"/>`;
  g += panel(68, 46, 196, 46, { fill: pf, op: 0.9 });
  g += `<text x="82" y="63" font-family="Noto Sans KR" font-weight="700" font-size="10.5" fill="#ffd6e8">${sub}</text><text x="82" y="84" font-family="Noto Sans KR" font-weight="900" font-size="19" fill="#fff" filter="url(#textShadow)">${title}</text>`;
  g += panel(272, 46, 104, 46, { fill: pf, op: 0.9 });
  g += `<text x="324" y="63" text-anchor="middle" font-family="Noto Sans KR" font-weight="700" font-size="10.5" fill="#ffd6e8">${right1}</text><text x="324" y="84" text-anchor="middle" font-family="Noto Sans KR" font-weight="900" font-size="19" fill="#ffe27a" filter="url(#textShadow)">${right2}</text>`;
  return g;
}

module.exports = {
  title: { plate: 'plates/title.png', depth: 'plates/title-depth.png', focus: 6.6 / 30, k: 2.6, svg: titleOverlay },
  play: { plate: 'plates/play.png', depth: 'plates/play-depth.png', focus: 8.0 / 30, k: 3.2, svg: playOverlay },
};
