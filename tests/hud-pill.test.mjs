// 0.15.3 자동 테스트: 반딧불 남은 발 수 글자가 대포(장전된 구슬) 위를 가리지 않는다
// 실행: node tests/hud-pill.test.mjs
import { chromium, devices } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const url = pathToFileURL(path.join(root, 'index.html')).href;
let pass = 0, fail = 0;
function check(name, ok, info = '') {
  if (ok) { pass++; console.log('  ✅ ' + name); } else { fail++; console.log('  ❌ ' + name + ' ' + info); }
}
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const phone = { ...devices['iPhone 13'] };
delete phone.defaultBrowserType;
const errors = [];

for (const locale of ['en-US', 'ko-KR']) {
  const ctx = await browser.newContext({ ...phone, locale });
  // 캔버스에 그린 글자를 기록 (가운데 정렬 글자 위치·폭)
  await ctx.addInitScript(() => {
    const ft = CanvasRenderingContext2D.prototype.fillText;
    window.__pills = [];
    CanvasRenderingContext2D.prototype.fillText = function (text, x, y) { window.__pills.push({ text: String(text), x, y, tw: this.measureText(String(text)).width }); return ft.apply(this, arguments); };
  });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url + '?seed=7');
  await page.evaluate(() => { const j = window.__jp; j.reset(); j.P.seenIntro = true; for (let i = 1; i <= 30; i++) j.P.seenStory[i] = true; j.P.lives = 3; j.save(); });
  console.log(locale);
  const find = async (stage, setup) => {
    await page.evaluate(([s, setup]) => { const j = window.__jp; j.startStage(s); j.closeCard(); j.G.hz.aimBoost = 2; if (setup) j.G.hz.clock = 60; window.__pills = []; }, [stage, setup]);
    await page.waitForTimeout(process.env.SHOTS ? 3000 : 300);
    return page.evaluate(() => { const j = window.__jp; return { pill: window.__pills.filter(p => /반딧불|Firefly/.test(p.text)).pop(), W: j.W, PIVOT: j.PIVOT, DEADLINE: j.DEADLINE, clock: window.__pills.filter(p => /⏱|서둘러|Hurry/.test(p.text)).pop() }; });
  };
  for (const [stage, clock] of [[17, false], [15, true]]) {
    const r = await find(stage, clock);
    // 띠 폭 = 글자 폭 + 여백 (최소 100), 글자는 띠 가운데
    const box = p => p && { x: p.x - Math.max(100, Math.ceil(p.tw) + 16) / 2, w: Math.max(100, Math.ceil(p.tw) + 16) };
    const b = box(r.pill);
    check(`${stage}판: 반딧불 글자가 그려짐`, !!b, JSON.stringify(r.pill));
    if (!b) continue;
    // 포신 끝 구슬은 회전 중심에서 약 50 + 구슬 반지름 18 안 → 대포 좌우 ±68 안에는 글자가 없어야
    const clear = b.x + b.w <= r.PIVOT.x - 68 || b.x >= r.PIVOT.x + 68;
    check(`${stage}판: 대포 위를 비켜 옆에 있음`, clear, JSON.stringify(b));
    check(`${stage}판: 화면 안`, b.x >= 0 && b.x + b.w <= r.W, JSON.stringify(b));
    if (clock) {
      check(`${stage}판: 시계 띠가 보임`, !!r.clock, '');
      const c = r.clock && { x: r.clock.x - 35, w: 70 }, overlap = !c || !(b.x + b.w <= c.x || c.x + c.w <= b.x);
      check(`${stage}판: 시계와 겹치지 않음`, !overlap, JSON.stringify({ b, c }));
    }
    if (process.env.SHOTS) await page.screenshot({ path: path.join(process.env.SHOTS, `firefly-${stage}-${locale}.png`) });
  }
  await ctx.close();
}
check('에러 없음', errors.length === 0, errors.join(' | '));
await browser.close();
console.log(`\n결과: ${pass} 통과 · ${fail} 실패`);
process.exit(fail ? 1 : 0);
