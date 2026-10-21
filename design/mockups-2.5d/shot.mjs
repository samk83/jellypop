// Usage: node shot.mjs <scene-name|all> [scale]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire(import.meta.url);
const dir = path.dirname(new URL(import.meta.url).pathname);
const which = process.argv[2] || 'all';
const scale = Number(process.argv[3] || 3);
delete require.cache[require.resolve('./lib.cjs')];
delete require.cache[require.resolve('./scenes.cjs')];
const sceneFile = process.env.SCENES || './scenes.cjs';
delete require.cache[require.resolve(sceneFile)];
const scenes = require(sceneFile);
const balooCss = fs.readFileSync(path.join(dir,'baloo-inline.css'),'utf8');
const names = which === 'all' ? Object.keys(scenes) : which.split(',');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: scale });
const page = await ctx.newPage();
fs.mkdirSync(path.join(dir, 'png'), { recursive: true });
for (const n of names) {
  const svg = scenes[n]();
  const html = `<!doctype html><html><head><meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet"><style>${balooCss}</style>
  <style>html,body{margin:0;width:390px;height:844px;overflow:hidden;background:#000}svg{display:block}</style></head>
  <body>${svg}</body></html>`;
  fs.writeFileSync(path.join(dir, `png/${n}.html`), html);
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const texts = [...svg.matchAll(/>([^<]+)</g)].map(m => m[1]).join('');
  await page.evaluate(async (t) => { await Promise.all(['800 40px "Baloo 2"','700 40px "Baloo 2"','900 20px "Noto Sans KR"','700 20px "Noto Sans KR"','800 20px "Noto Sans KR"'].map(f => document.fonts.load(f, t))); await document.fonts.ready; }, texts);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(dir, `png/${n}.png`), type: 'png' });
  console.log('shot', n);
}
await browser.close();
