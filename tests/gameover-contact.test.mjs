// 0.15.1 자동 테스트: 경고 선은 경고만 · 말랑이/대포/기다리는 젤리/바닥에 닿아야 실패 · 작은 게임 오버 창
// 실행: node tests/gameover-contact.test.mjs
import { chromium, devices } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { koreanByDefault } from './locale.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const url = pathToFileURL(path.join(root, 'index.html')).href;
let pass = 0, fail = 0;
function check(name, ok, info = '') {
  if (ok) { pass++; console.log('  ✅ ' + name); } else { fail++; console.log('  ❌ ' + name + ' ' + info); }
}
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
koreanByDefault(browser);
const phone = { ...devices['iPhone 13'] };
delete phone.defaultBrowserType;
const ctx = await browser.newContext(phone);
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => m.type() === 'error' && !/getImageData/.test(m.text()) && errors.push(m.text()));
await page.goto(url + '?seed=7');
await page.evaluate(() => { const j = window.__jp; j.reset(); j.P.seenIntro = true; for (let i = 1; i <= 30; i++) j.P.seenStory[i] = true; j.P.lives = 3; j.save(); });

// 판 전체를 dy 만큼 내리고 한 발이 끝난 것처럼 정리
const settleAt = (low) => page.evaluate(low => {
  const j = window.__jp, G = j.G, b = G.b;
  b.y0 += low - (j.Board.lowestY(b) + j.R); G.y0Target = b.y0;
  G.state = 'settle'; G.settleT = 0; j.advance();
  return { state: G.state, lives: j.P.lives, warn: !!G.warnOn, hit: G.loseHit && G.loseHit.what };
}, low);

console.log('경고 선');
{
  await page.evaluate(() => { const j = window.__jp; j.startStage(1); j.closeCard(); });
  const r = await settleAt(await page.evaluate(() => window.__jp.DEADLINE + 14));
  check('경고 선을 넘으면 강한 경고만 (실패 아님)', r.state === 'aim' && r.lives === 3 && r.warn && !r.hit, JSON.stringify(r));
  const shot = await page.screenshot({ path: path.join(root, 'design/screens/v0151-warn.png') });
  check('경고 화면 그림 저장', shot.length > 1000);
  const r2 = await settleAt(await page.evaluate(() => window.__jp.DEADLINE - 40));
  check('경고 선 위로 올라가면 경고 꺼짐', r2.state === 'aim' && !r2.warn, JSON.stringify(r2));
}

console.log('닿으면 생명 -1 (무엇에 닿았는지)');
{
  // 판 가운데 아래(대포·말랑이 쪽)로 천천히 내려 처음 닿는 순간을 찾는다
  const r = await page.evaluate(() => {
    const j = window.__jp, G = j.G, b = G.b; let steps = 0;
    j.setAngle(-Math.PI / 2 + 1.1);   // 포신을 옆으로 (위를 겨누면 대포 속 젤리가 선 바로 아래까지 올라온다)
    while (G.state === 'aim' && steps++ < 400) { b.y0 += 1; G.y0Target = b.y0; G.state = 'settle'; G.settleT = 0; j.update(1 / 60); }
    return { state: G.state, lives: j.P.lives, hit: G.loseHit, low: j.Board.lowestY(b) + j.R, deadline: j.DEADLINE };
  });
  check('닿는 순간 멈춤 + 닿은 대상 기록', r.state === 'hit' && r.lives === 2 && ['mascot', 'cannon', 'queue', 'ground'].includes(r.hit && r.hit.what), JSON.stringify(r));
  check('닿는 높이는 경고 선보다 한참 아래', r.low > r.deadline + 30, JSON.stringify(r));
  const after = await page.evaluate(() => { const j = window.__jp; j.advance(); return { state: j.G.state, low: j.Board.lowestY(j.G.b) + j.R, deadline: j.DEADLINE, hit: j.G.loseHit }; });
  check('0.9초 뒤 판이 밀려 올라가 계속 (경고 선 위)', after.state === 'aim' && after.low <= after.deadline && !after.hit, JSON.stringify(after));
}

console.log('대상별 판정');
{
  const r = await page.evaluate(() => {
    const j = window.__jp, G = j.G;
    // (x 근처 칸, 높이 y)에 거품 하나만 있는 가짜 판. 칸은 정해진 자리에만 놓이니 실제 x 를 돌려준다
    const make = (x, y) => {
      const b = j.Board.clone(G.b); b.rows = [[]]; b.y0 = 0;
      const c = Math.max(0, Math.round((x - j.R - (j.Board.odd(b, 0) ? j.R : 0)) / (2 * j.R)));
      b.rows = [Array.from({ length: c + 1 }, (_, i) => (i === c ? { c: 'r' } : null))];
      b.y0 += y - j.Board.pos(b, 0, c).y;
      return { b, x: j.Board.pos(b, 0, c).x };
    };
    const t = j.touchTargets();
    const at = what => {
      const o = t.find(o => o.what === what), probe = make(o.x, 0), dx = probe.x - o.x, d = j.R + o.r - 6;
      if (Math.abs(dx) >= d) return 'skip';
      const h = j.touchHit(make(o.x, o.y - Math.sqrt(d * d - dx * dx)).b); return h && h.what;
    };
    const far = j.touchHit(make(330, j.DEADLINE + 20).b);
    j.setAngle(-Math.PI / 2); const ready = j.touchTargets().find(o => o.r === 13);
    const rb = make(ready.x, ready.y - 22); const readyHit = j.touchHit(rb.b);
    return { mascot: at('mascot'), cannon: at('cannon'), queue: at('queue'), far: far && far.what, ready: readyHit && readyHit.what };
  });
  check('말랑이 머리에 닿으면 mascot', r.mascot === 'mascot', JSON.stringify(r));
  check('대포에 닿으면 cannon', r.cannon === 'cannon', JSON.stringify(r));
  check('기다리는 젤리에 닿으면 queue', r.queue === 'queue', JSON.stringify(r));
  check('대포 속 준비된 젤리에 닿아도 실패', r.ready === 'cannon', JSON.stringify(r));
  check('경고 선 아래라도 빈 곳이면 안 닿음', r.far === null, JSON.stringify(r));
}

console.log('게임 오버 창이 판을 가리지 않음');
{
  await page.evaluate(() => { const j = window.__jp; j.startStage(1); j.closeCard(); j.P.lives = 1; j.save(); });
  await page.evaluate(() => {
    const j = window.__jp, G = j.G, b = G.b; let steps = 0;
    while (G.state === 'aim' && steps++ < 400) { b.y0 += 1; G.y0Target = b.y0; G.state = 'settle'; G.settleT = 0; j.update(1 / 60); }
  });
  await page.waitForSelector('#result:not([hidden])', { timeout: 5000 });
  await page.waitForTimeout(1200);
  const r = await page.evaluate(() => {
    const j = window.__jp, cv = document.getElementById('canvas').getBoundingClientRect(), k = cv.height / j.H;
    const card = document.querySelector('.result-card').getBoundingClientRect();
    const mascotTop = cv.top + (j.PIVOT.y - 40) * k;
    return { cardBottom: Math.round(card.bottom), mascotTop: Math.round(mascotTop), vh: innerHeight, msg: document.getElementById('resultMsg').textContent, hit: j.G.loseHit && j.G.loseHit.what, title: !document.getElementById('overTitle').hidden };
  });
  check('게임 오버 창은 화면 위쪽 절반 안 (말랑이·대포·닿은 자리 보임)', r.cardBottom < r.mascotTop && r.cardBottom < r.vh * .55, JSON.stringify(r));
  check('왜 졌는지 문구 (무엇에 닿았는지)', /닿았어요/.test(r.msg) && !!r.hit, JSON.stringify(r));
  check('GAME OVER 글자 표시', r.title);
  await page.screenshot({ path: path.join(root, 'design/screens/v0151-gameover.png') });
}

check('콘솔 에러 없음', errors.length === 0, errors.join(' | '));
await browser.close();
console.log(`\n결과: ${pass} 통과 / ${fail} 실패`);
process.exit(fail ? 1 : 0);
