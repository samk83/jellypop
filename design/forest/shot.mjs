// Compose plate (+depth-of-field) and SVG overlay, then screenshot. Usage: node shot.mjs title|play|all [scale]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire(import.meta.url);
const dir = path.dirname(new URL(import.meta.url).pathname);
const scenes = require('./compose.cjs');
const which = process.argv[2] || 'all';
const scale = Number(process.argv[3] || 2);
const balooCss = fs.readFileSync(path.join(dir, '../mockups-2.5d/baloo-inline.css'), 'utf8');
const names = which === 'all' ? Object.keys(scenes) : which.split(',');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--allow-file-access-from-files'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: scale });
const page = await ctx.newPage();
page.on('console', m => console.log('[page]', m.text()));
page.on('pageerror', e => console.log('[err]', e.message));
fs.mkdirSync(path.join(dir, 'png'), { recursive: true });
for (const n of names) {
  const sc = scenes[n];
  const svg = sc.svg();
  const html = `<!doctype html><html><head><meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet"><style>${balooCss}</style>
  <style>html,body{margin:0;width:390px;height:844px;overflow:hidden;background:#000}#c{filter:saturate(1.18) contrast(1.06)}#c,svg{position:absolute;left:0;top:0;width:390px;height:844px;display:block}</style></head>
  <body><canvas id="c"></canvas>${svg}
  <script>
  const load = s => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = s; });
  window.ready = (async () => {
    const [pl, dp] = await Promise.all([load('${sc.plate}'), load('${sc.depth}')]);
    const w = pl.width, h = pl.height, c = document.getElementById('c'); c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    const layer = (blur) => { const k = document.createElement('canvas'); k.width = w; k.height = h; const g = k.getContext('2d'); g.filter = blur ? 'blur(' + blur + 'px)' : 'none'; g.drawImage(pl, 0, 0); return g.getImageData(0, 0, w, h).data; };
    const L = [layer(0), layer(${scale * 1.2}), layer(${scale * 3}), layer(${scale * 6})];
    const dk = document.createElement('canvas'); dk.width = w; dk.height = h; const dg = dk.getContext('2d'); dg.filter = 'blur(${scale}px)'; dg.drawImage(dp, 0, 0, w, h);
    const D = dg.getImageData(0, 0, w, h).data;
    const out = ctx.createImageData(w, h); const O = out.data;
    for (let i = 0; i < w * h; i++) {
      const d = D[i * 4] / 255; let coc = Math.min(1, Math.abs(d - ${sc.focus}) * ${sc.k}) * 3;
      const a = Math.min(2, Math.floor(coc)), t = coc - a, j = i * 4;
      for (let ch = 0; ch < 3; ch++) O[j + ch] = L[a][j + ch] * (1 - t) + L[Math.min(3, a + 1)][j + ch] * t;
      O[j + 3] = 255;
    }
    ctx.putImageData(out, 0, 0);
  })();
  </script></body></html>`;
  const file = path.join(dir, `compose-${n}.html`);
  fs.writeFileSync(file, html);
  await page.goto('file://' + file, { waitUntil: 'load' });
  await page.evaluate(() => window.ready);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => { await Promise.all(['800 40px "Baloo 2"', '900 20px "Noto Sans KR"', '700 20px "Noto Sans KR"', '800 20px "Noto Sans KR"'].map(f => document.fonts.load(f, '젤리마을 대소동 모험 시작! 스티커 북 꽃밭 언덕 스테이지 구할 친구 점수 남은 발사 같은 색 3개! 0123456789'))); });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(dir, `png/forest-${n}.png`), type: 'png' });
  console.log('shot', n);
}
await browser.close();
