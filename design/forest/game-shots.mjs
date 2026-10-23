// 게임 화면 스크린샷 (3D 그림 강제 켬): node design/forest/game-shots.mjs [out-dir]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const out = process.argv[2] || path.join(root, 'design/forest/png/game');
fs.mkdirSync(out, { recursive: true });
const url = pathToFileURL(path.join(root, 'index.html')).href + '?3d=1';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
page.on('pageerror', e => console.log('[err]', e.message));
page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') console.log('[console]', m.text()); });
await page.addInitScript(() => { try { localStorage.setItem('jellypop.progress', JSON.stringify({ seenIntro: true })); } catch (e) { /* noop */ } });
await page.goto(url);
await page.waitForTimeout(1500);
console.log('3D on:', await page.evaluate(() => window.Jelly3D && Jelly3D.ok()));
await page.screenshot({ path: path.join(out, '1-title.png') });
for (const scr of ['map', 'book']) { await page.evaluate(s => window.__jp.go(s), scr); await page.waitForTimeout(1500); await page.screenshot({ path: path.join(out, `2-${scr}.png`) }); }
await page.evaluate(() => document.getElementById('storyBtn').click()); await page.waitForTimeout(1500); await page.screenshot({ path: path.join(out, '3-intro.png') });
const stages = (process.env.STAGES || '3,9,16,21,27').split(',').map(Number);
for (const n of stages) {
  await page.evaluate(n => window.__jp.startStage(n), n);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(out, `play-${n}.png`) });
  console.log('shot stage', n);
}
await browser.close();
