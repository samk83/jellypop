// 렌더링 시안 캡처: node design/mockups/capture.mjs [출력폴더] [장면들 예: 1,2,3] [ui=0|1] [배율]
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] || dir;
const scenes = (process.argv[3] || '1,2,3,4,5').split(',').map(Number);
const ui = process.argv[4] ?? '1', dsf = Number(process.argv[5] || 2);
const names = { 1: 'title', 2: 'map', 3: 'play', 4: 'clear', 5: 'boss' };
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const s of scenes) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dsf });
  const errs = []; p.on('console', m => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', e => errs.push(e.message));
  const t0 = Date.now();
  await p.goto(pathToFileURL(path.join(dir, 'screen.html')).href + `?s=${s}&ui=${ui}`, { timeout: 300000 });
  await p.waitForFunction(() => window.__rendered !== undefined, null, { timeout: 300000, polling: 500 });
  await p.waitForTimeout(300);
  await p.screenshot({ timeout: 300000, path: path.join(out, `${s}-${names[s]}${ui === '0' ? '-raw' : ''}.png`) });
  console.log(s, names[s], (Date.now() - t0) + 'ms', errs.join(' | ').slice(0, 1500));
  await p.close();
}
await b.close();
