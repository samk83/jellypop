// 3D 장면 캡처: node design/render3d/capture.mjs design/render3d  (헤드리스 브라우저에서 정지 화면 3장을 PNG로 저장)
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const out = process.argv[2];
for (const [name, w, h, t] of [['phone-a', 390, 844, 3.2], ['phone-b', 390, 844, 9.0], ['wide', 1280, 720, 6.0]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const errs = []; p.on('console', m => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', e => errs.push(e.message));
  const t0 = Date.now();
  await p.goto(`file:///home/user/jellypop/design/render3d/village.html?t=${t}&q=1`);
  await p.waitForFunction(() => window.__rendered || document.getElementById('err').style.display === 'grid', null, { timeout: 170000 });
  await p.screenshot({ path: `${out}/village-${name}.png` });
  console.log(name, (Date.now() - t0) + 'ms', errs.join(' | ').slice(0, 800));
  await p.close();
}
await b.close();
