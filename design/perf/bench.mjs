// 성능 측정: node design/perf/bench.mjs [query] [cpu배속]
// 휴대폰과 비슷하게 CPU를 느리게(기본 4배) 한 뒤, 스테이지 시작 지연과 플레이 중 프레임을 잰다.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const q = process.argv[2] ?? '', rate = +(process.argv[3] || 4);
const stages = (process.env.STAGES || '1,13,25').split(',').map(Number);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
const rows = [];
for (const n of stages) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  await ctx.addInitScript(() => { const raf = window.requestAnimationFrame.bind(window); window.__work = []; window.requestAnimationFrame = cb => raf(t => { const s = performance.now(); cb(t); window.__work.push(performance.now() - s); }); localStorage.setItem('jellypop.progress', JSON.stringify({ seenIntro: true, seenHz: { cloud: 1, ceiling: 1, aim: 1, clock: 1, nom: 1, nomBlock: 1, nomSteal: 1, s: 1, m: 1, u: 1, g: 1, f: 1, i: 1, c: 1, k: 1, miss: 1, caramel: 1, dark: 1, conveyor: 1 } })); });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await page.goto(pathToFileURL(path.join(root, 'index.html')).href + q);
  await page.waitForTimeout(1200);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  const r = await page.evaluate(async n => {
    const t0 = performance.now();
    window.__jp.startStage(n);
    const sync = performance.now() - t0;
    await new Promise(ok => { const chk = () => (Gummy.pending() === 0 ? ok() : setTimeout(chk, 5)); chk(); });
    const ready = performance.now() - t0;
    window.__jp.closeCard();
    window.__work.length = 0;
    // 3초 동안 대포를 좌우로 움직이며 프레임 간격 기록
    const d = []; let last = performance.now(), a = -1.2, dir = 1;
    await new Promise(ok => { const f = now => { d.push(now - last); last = now; a += dir * 0.02; if (a > -0.4 || a < -2.7) dir *= -1; window.__jp.setAngle && window.__jp.setAngle(a); if (d.length < 180) requestAnimationFrame(f); else ok(); }; requestAnimationFrame(f); });
    d.shift(); d.sort((x, y) => x - y);
    const w = window.__work.slice().sort((x, y) => x - y), wavg = w.reduce((s, x) => s + x, 0) / w.length;
    const avg = d.reduce((s, x) => s + x, 0) / d.length;
    return { sync, ready, fps: 1000 / avg, p95: d[Math.floor(d.length * 0.95)], long: d.filter(x => x > 50).length, wavg, wp95: w[Math.floor(w.length * 0.95)], wmax: w[w.length - 1], j3d: !!(window.Jelly3D && Jelly3D.ok()) };
  }, n);
  rows.push({ stage: n, ...r });
  await ctx.close();
}
await browser.close();
console.log(`query="${q}" cpu x${rate}`);
for (const r of rows) console.log(`stage ${String(r.stage).padStart(2)} | 3D ${r.j3d ? 'on ' : 'off'} | 시작(동기) ${r.sync.toFixed(0).padStart(5)}ms | 그림 준비 ${r.ready.toFixed(0).padStart(5)}ms | 프레임 작업 평균 ${r.wavg.toFixed(2)}ms p95 ${r.wp95.toFixed(2)}ms 최대 ${r.wmax.toFixed(1)}ms`);
