// 시작 설명이 그림을 가리지 않는지: node tests/intro.test.mjs
// 프롤로그(해설 띠·말풍선·다음 버튼), 첫 판 안내 말풍선, 새 거품 설명 카드의 크기·위치를 휴대폰 두 크기 × 두 언어로 잰다
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const url = pathToFileURL(path.join(root, 'index.html')).href;
let pass = 0, fail = 0;
function check(name, ok, info = '') {
  if (ok) { pass++; console.log('  ✅ ' + name); } else { fail++; console.log('  ❌ ' + name + ' ' + info); }
}
const browser = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), args: ['--allow-file-access-from-files'] });
const rect = sel => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, b: r.bottom, r: r.right }; };
const overlap = (a, b) => a && b && a.x < b.r && b.x < a.r && a.y < b.b && b.y < a.b;

for (const [w, h] of [[390, 844], [360, 640]]) for (const lang of ['ko', 'en']) {
  console.log(`${w}×${h} ${lang}`);
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(url + `?seed=11&lang=${lang}`);
  await page.waitForFunction(() => window.__jp && document.fonts.status === 'loaded');
  await page.evaluate(() => window.__jp.reset());
  await page.click('#startBtn');
  await page.waitForSelector('#nextSlide');
  let worst = 0, sayOk = true, inView = true, tapOk = true;
  for (let i = 0; i < 4; i++) {
    await page.waitForTimeout(900);
    const m = await page.evaluate(([rs, ov]) => {
      const rect = new Function('return ' + rs)(), overlap = new Function('return ' + ov)();
      const n = rect('.slide .narr'), s = rect('#slideSay'), b = rect('#nextSlide');
      return { area: [n, s, b].filter(Boolean).reduce((a, r) => a + r.w * r.h, 0) / (innerWidth * innerHeight), s, hit: overlap(s, n) || overlap(s, b), W: innerWidth, H: innerHeight };
    }, [rect.toString(), overlap.toString()]);
    worst = Math.max(worst, m.area);
    if (m.hit) sayOk = false;
    if (m.s && (m.s.x < 0 || m.s.r > m.W || m.s.y < 0 || m.s.b > m.H)) inView = false;
    const before = await page.evaluate(() => document.querySelector('#dots .on') && [...document.querySelectorAll('#dots i')].findIndex(e => e.classList.contains('on')));
    await page.mouse.click(w / 2, h * 0.45);   // 그림 아무 데나 눌러도 넘어감
    await page.waitForTimeout(150);
    const now = await page.evaluate(() => document.getElementById('intro').hidden ? 4 : [...document.querySelectorAll('#dots i')].findIndex(e => e.classList.contains('on')));
    if (now !== before + 1) tapOk = false;
  }
  check(`프롤로그 설명이 화면의 30% 미만만 덮음 (최대 ${(worst * 100).toFixed(0)}%)`, worst < 0.3);
  check('말풍선이 해설 띠·다음 버튼과 겹치지 않음', sayOk);
  check('말풍선이 화면 안에 있음', inView);
  check('그림을 눌러도 다음 장면 → 마지막엔 지도로', tapOk && await page.evaluate(() => !document.getElementById('map').hidden));

  await page.evaluate(() => window.__jp.startStage(1));
  await page.waitForTimeout(300);
  const tip = await page.evaluate(rs => { const r = new Function('return ' + rs)()('#tip'); return { r, shown: !document.getElementById('tip').classList.contains('hide'), W: innerWidth }; }, rect.toString());
  check('첫 판 안내는 작은 말풍선 (화면 폭의 55% 이하)', tip.shown && tip.r.w <= tip.W * 0.55, JSON.stringify(tip));
  await page.waitForTimeout(6400);
  check('첫 판 안내는 6초 뒤 저절로 사라짐', await page.evaluate(() => document.getElementById('tip').classList.contains('hide')));

  await page.evaluate(() => window.__jp.startStage(4));
  await page.waitForTimeout(500);
  const card = await page.evaluate(rs => { const rect = new Function('return ' + rs)(); return { c: rect('#hzCard'), hud: rect('.hud'), H: innerHeight, shown: !document.getElementById('hzCard').hidden }; }, rect.toString());
  check('새 거품 카드가 뜸', card.shown);
  check('새 거품 카드는 화면 아래쪽 (위쪽 40%의 거품 판은 보임)', card.c.y > card.H * 0.4 && card.c.b <= card.H, JSON.stringify(card.c));
  await ctx.close();
}
await browser.close();
console.log(`결과: 통과 ${pass} / 실패 ${fail}`);
process.exit(fail ? 1 : 0);
