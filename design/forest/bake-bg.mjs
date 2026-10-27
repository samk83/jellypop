// Game backgrounds: plate + depth-of-field + light FX → assets/bg/*.png (then webp).
// Usage: node bake-bg.mjs   (needs plates/w1..w5(.png, -depth.png), plates/title-bg(.png, -depth.png))
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const out = path.join(dir, '../../assets/bg');
fs.mkdirSync(out, { recursive: true });

let seed = 3;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const defs = `<defs>
  <filter id="b2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2"/></filter>
  <filter id="b5" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
  <filter id="b14" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
  <filter id="b30" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="30"/></filter>
  <filter id="fly" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <linearGradient id="shaft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="SHAFT" stop-opacity="0.75"/><stop offset="0.6" stop-color="SHAFT" stop-opacity="0.25"/><stop offset="1" stop-color="SHAFT" stop-opacity="0"/></linearGradient>
  <linearGradient id="board" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="BOARD" stop-opacity="0.34"/><stop offset="0.85" stop-color="BOARD" stop-opacity="0.12"/><stop offset="1" stop-color="BOARD" stop-opacity="0"/></linearGradient>
</defs>`;
function shafts(cx, top, n, spread, len, op) {
  let g = `<g style="mix-blend-mode:screen" opacity="${op}" filter="url(#b14)">`;
  for (let i = 0; i < n; i++) {
    const a = (i / (n - 1) - 0.5) * spread + (rnd() - 0.5) * 0.08, w0 = 6 + rnd() * 12, w1 = 30 + rnd() * 50, l = len * (0.7 + rnd() * 0.4);
    const x0 = cx + (rnd() - 0.5) * 40, x1 = x0 + Math.sin(a) * l, y1 = top + Math.cos(a) * l;
    g += `<path d="M${x0 - w0} ${top} L${x0 + w0} ${top} L${x1 + w1} ${y1} L${x1 - w1} ${y1} Z" fill="url(#shaft)" opacity="${0.35 + rnd() * 0.4}"/>`;
  }
  return g + '</g>';
}
function bokeh(n, area, rmin, rmax, colors, op) {
  let g = `<g style="mix-blend-mode:screen">`;
  for (let i = 0; i < n; i++) {
    const x = area[0] + rnd() * area[2], y = area[1] + rnd() * area[3], r = rmin + rnd() * (rmax - rmin);
    g += `<circle cx="${x}" cy="${y}" r="${r}" fill="${colors[i % colors.length]}" opacity="${op * (0.4 + rnd() * 0.6)}" filter="url(#b2)"/><circle cx="${x}" cy="${y}" r="${r * 0.85}" fill="none" stroke="#fff" stroke-width="0.8" opacity="${op * 0.5}"/>`;
  }
  return g + '</g>';
}
function fireflies(n, area, c = '#fff3a0') {
  let g = '';
  for (let i = 0; i < n; i++) {
    const x = area[0] + rnd() * area[2], y = area[1] + rnd() * area[3], r = 1.1 + rnd() * 1.6;
    g += `<circle cx="${x}" cy="${y}" r="${r * 4}" fill="${c}" opacity="0.35" filter="url(#b5)"/><circle cx="${x}" cy="${y}" r="${r}" fill="#fffbe0" filter="url(#fly)"/>`;
  }
  return g;
}
const W = 360, H = 620;
const board = (c) => `<rect x="0" y="0" width="${W}" height="${470}" fill="url(#board)"/>`.replace(/BOARD/g, c);
const JOBS = [
  { name: 'w1', w: W, h: H, focus: 7.0 / 30, k: 3.0, sat: 1.18, shaft: '#fff6d0', board: '#0d2a10',
    fx: () => shafts(150, -20, 6, 0.8, 520, 0.7) + bokeh(12, [0, 0, W, 420], 3, 10, ['#fff7c8', '#e8ffb0'], 0.45) + fireflies(14, [0, 380, W, 240]) },
  { name: 'w2', w: W, h: H, focus: 7.0 / 30, k: 3.0, sat: 1.12, shaft: '#ffd9a0', board: '#3a1a06',
    fx: () => shafts(230, -20, 7, 0.9, 560, 0.85) + bokeh(14, [0, 0, W, 420], 3, 11, ['#ffd08a', '#fff0c0'], 0.5) + fireflies(14, [0, 380, W, 240], '#ffcf7a') },
  { name: 'w3', w: W, h: H, focus: 7.0 / 30, k: 3.0, sat: 1.15, shaft: '#9fb8ff', board: '#02040e',
    fx: () => shafts(200, -20, 4, 0.6, 480, 0.35) + bokeh(10, [0, 0, W, 420], 3, 9, ['#8fd8ff', '#c9a0ff'], 0.4) + fireflies(46, [0, 60, W, 560], '#b8ff9a') },
  { name: 'w4', w: W, h: H, focus: 7.0 / 30, k: 3.0, sat: 1.08, shaft: '#fff0f8', board: '#5a1e48',
    fx: () => shafts(150, -20, 6, 0.8, 520, 0.6) + bokeh(22, [0, 0, W, 480], 3, 12, ['#ffd1ea', '#d9f7ff', '#fff6c0'], 0.55) },
  { name: 'w5', w: W, h: H, focus: 7.0 / 30, k: 3.0, sat: 1.12, shaft: '#ffb0b0', board: '#12061e',
    fx: () => shafts(110, -20, 5, 0.7, 500, 0.6) + bokeh(10, [0, 0, W, 420], 3, 9, ['#ffb3c0', '#d0a0ff'], 0.4) + fireflies(22, [0, 200, W, 420], '#ffc4e0') },
  { name: 'title', plate: 'title-bg', w: 390, h: 844, focus: 6.6 / 30, k: 2.6, sat: 1.18, shaft: '#fff6d0', board: '#000000', noBoard: true,
    fx: () => shafts(150, -20, 7, 0.9, 640, 0.9) + `<ellipse cx="170" cy="40" rx="190" ry="120" fill="#fff4c8" opacity="0.35" filter="url(#b30)" style="mix-blend-mode:screen"/>` +
      bokeh(16, [0, 0, 390, 360], 4, 13, ['#fff7c8', '#e8ffb0', '#ffe0f0'], 0.5) + fireflies(22, [10, 330, 370, 330]) +
      `<ellipse cx="195" cy="200" rx="175" ry="110" fill="#1d3a0c" opacity="0.25" filter="url(#b30)"/><rect x="0" y="640" width="390" height="204" fill="url(#board)"/>`.replace('url(#board)', 'url(#dim)') },
];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--allow-file-access-from-files'] });
const only = process.argv.slice(2);
for (const j of JOBS.filter(j => !only.length || only.includes(j.name))) {
  seed = 3 + j.name.length * 7;
  const plate = j.plate || j.name;
  const page = await (await browser.newContext({ viewport: { width: j.w, height: j.h }, deviceScaleFactor: 2 })).newPage();
  page.on('pageerror', e => console.log('[err]', e.message));
  const d = defs.replace(/SHAFT/g, j.shaft).replace('</defs>', '<linearGradient id="dim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d2004" stop-opacity="0"/><stop offset="1" stop-color="#0d2004" stop-opacity="0.45"/></linearGradient></defs>');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${j.w}" height="${j.h}" viewBox="0 0 ${j.w} ${j.h}">${d}${j.noBoard ? '' : board(j.board)}${j.fx()}</svg>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:${j.w}px;height:${j.h}px;overflow:hidden;background:#000}#c{filter:saturate(${j.sat}) contrast(1.06)}#c,svg{position:absolute;left:0;top:0;width:${j.w}px;height:${j.h}px;display:block}</style></head>
  <body><canvas id="c"></canvas>${svg}<script>
  const load = s => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = s; });
  window.ready = (async () => {
    const [pl, dp] = await Promise.all([load('plates/${plate}.png'), load('plates/${plate}-depth.png')]);
    const w = pl.width, h = pl.height, c = document.getElementById('c'); c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    const layer = (blur) => { const k = document.createElement('canvas'); k.width = w; k.height = h; const g = k.getContext('2d'); g.filter = blur ? 'blur(' + blur + 'px)' : 'none'; g.drawImage(pl, 0, 0); return g.getImageData(0, 0, w, h).data; };
    const L = [layer(0), layer(2.4), layer(6), layer(12)];
    const dk = document.createElement('canvas'); dk.width = w; dk.height = h; const dg = dk.getContext('2d'); dg.filter = 'blur(2px)'; dg.drawImage(dp, 0, 0, w, h);
    const D = dg.getImageData(0, 0, w, h).data, out = ctx.createImageData(w, h), O = out.data;
    for (let i = 0; i < w * h; i++) {
      const d = D[i * 4] / 255, coc = Math.min(1, Math.abs(d - ${j.focus}) * ${j.k}) * 3, a = Math.min(2, Math.floor(coc)), t = coc - a, q = i * 4;
      for (let ch = 0; ch < 3; ch++) O[q + ch] = L[a][q + ch] * (1 - t) + L[Math.min(3, a + 1)][q + ch] * t;
      O[q + 3] = 255;
    }
    ctx.putImageData(out, 0, 0);
  })();
  </script></body></html>`;
  const file = path.join(dir, `_bg-${j.name}.html`);
  fs.writeFileSync(file, html);
  await page.goto('file://' + file);
  await page.evaluate(() => window.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, `${j.name}.png`) });
  fs.unlinkSync(file);
  console.log('baked', j.name);
}
await browser.close();
