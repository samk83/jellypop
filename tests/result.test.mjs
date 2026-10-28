// 결과 점수표 · 패널티 놈놈 · 게임 오버 연출 자동 테스트: node tests/result.test.mjs
import { chromium, devices } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { koreanByDefault } from './locale.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const url = pathToFileURL(path.join(root, 'index.html')).href;
const shots = path.join(root, 'design', 'screens');
fs.mkdirSync(shots, { recursive: true });
let pass = 0, fail = 0;
function check(name, ok, info = '') {
  if (ok) { pass++; console.log('  ✅ ' + name); } else { fail++; console.log('  ❌ ' + name + ' ' + info); }
}
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
koreanByDefault(browser);
const phone = { ...devices['iPhone 13'] };
delete phone.defaultBrowserType;
// 스테이지 1을 단순 자동 플레이로 깬다 (가장 많이 터지는 각도)
function quickWin(n) {
  const j = window.__jp;
  j.startStage(n); j.closeCard();
  let guard = 0;
  while (j.G.state === 'aim' && guard++ < 200) {
    let best = null;
    for (let a = -Math.PI + 0.17; a <= -0.17; a += 0.02) {
      const r = j.evalShot(a); if (!r) continue;
      let s = r.friends * 1e5 + (r.popped + r.dropped) * 100;
      if (!r.popped) s = -r.lowest;
      if (r.lowest + j.R > j.DEADLINE) s -= 1e7;
      if (!best || s > best.s) best = { s, a };
    }
    j.setAngle(best.a); j.shoot(); j.advance();
  }
  return j.G.outcome;
}

const ctx = await browser.newContext(phone);
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => m.type() === 'error' && !/getImageData/.test(m.text()) && errors.push(m.text()));
await page.goto(url + '?seed=11');
await page.evaluate(() => { const j = window.__jp; j.reset(); j.P.seenIntro = true; for (let i = 1; i <= 30; i++) j.P.seenStory[i] = true; });

// 1) 클리어 점수표
console.log('클리어 점수표');
{
  const o = await page.evaluate(quickWin, 1);
  check('스테이지 1 클리어', o && o.win);
  await page.waitForSelector('#result:not([hidden])', { timeout: 4000 });
  const mid = await page.evaluate(() => ({ stars: document.querySelectorAll('#resultStars .on').length, done: document.getElementById('resultScore').hasAttribute('data-done') }));
  check('처음엔 별이 꺼져 있고 점수표가 올라가는 중', mid.stars === 0 && !mid.done, JSON.stringify(mid));
  await page.waitForSelector('#resultScore[data-done]', { timeout: 10000 });
  const r = await page.evaluate(() => {
    const j = window.__jp, rows = [...document.querySelectorAll('#resultScore .trow')].map(e => ({ label: e.firstChild.textContent, v: Number(e.lastChild.textContent.replace(/,/g, '')) }));
    return { rows, total: Number(document.querySelector('#resultScore .ttotal b').textContent.replace(/,/g, '')), score: j.G.score, stars: document.querySelectorAll('#resultStars .on').length, want: j.G.outcome.stars, saved: j.G.saved };
  });
  check('점수표 줄: 터뜨린 거품 · 구출한 친구 포함', r.rows.some(x => x.label.includes('터뜨린 거품')) && r.rows.some(x => x.label.includes('구출한 친구')), JSON.stringify(r.rows));
  check('줄 합 = 합계 = 최종 점수', r.rows.reduce((a, x) => a + x.v, 0) === r.total && r.total === r.score && r.total > 0, JSON.stringify(r));
  check('구출 보너스 = 친구 수 × 100', r.rows.find(x => x.label.includes('구출한 친구')).v === r.saved * 100);
  check('다 올라가면 별이 받은 만큼 켜짐', r.stars === r.want && r.stars >= 1, JSON.stringify(r));
  await page.screenshot({ path: path.join(shots, 'result-score-iphone13.png') });
  // 다시 하기 → 같은 판을 더 잘하면 '최고 기록!'
  const best = await page.evaluate(() => window.__jp.P.best[1]);
  check('최고 점수 저장', best === r.total, String(best));
  await page.evaluate(() => { window.__jp.P.best[1] = 1; });
  await page.evaluate(quickWin, 1);
  await page.waitForSelector('#result:not([hidden])', { timeout: 4000 });
  await page.click('#resultScore');   // 누르면 바로 끝까지
  const skip = await page.evaluate(() => ({ done: document.getElementById('resultScore').hasAttribute('data-done'), best: !!document.querySelector('#resultScore .tbest') }));
  check('점수표를 누르면 바로 끝까지 + 기록을 넘으면 "최고 기록!"', skip.done && skip.best, JSON.stringify(skip));
  await page.click('#resultSub');
}

// 2) 패널티 때 꼬마 놈놈 등장
console.log('패널티 놈놈');
{
  const c = await page.evaluate(() => {
    const j = window.__jp; j.startStage(9); j.closeCard();
    j.G.time = 100;
    j.lowerCeiling(1);
    const a = j.G.cameo && { kind: j.G.cameo.kind, say: j.G.cameo.say };
    j.G.time = 101; j.lowerCeiling(1);                       // 4초 안에 또 → 쉬는 시간이라 안 나옴
    const again = j.G.cameoAt === 100;
    j.G.cameo = null; j.G.time = 102;
    j.applyLucky(j.LUCKY.find(e => e.id === 'mix'), { x: 100, y: 200 });   // 꽝은 쉬는 시간 무시
    const mix = j.G.cameo && j.G.cameo.kind;
    return { a, again, mix };
  });
  check('천장이 내려오면 놈놈이 "천장 꾹!"', c.a && c.a.kind === 'ceil' && c.a.say === '천장 꾹!', JSON.stringify(c));
  check('천장 놈놈은 4초에 한 번만 (너무 자주 안 나옴)', c.again);
  check('랜덤알 꽝(뒤섞기)에도 놈놈 등장', c.mix === 'mix');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(shots, 'nom-penalty-iphone13.png') });
  const gone = await page.evaluate(() => new Promise(res => setTimeout(() => res(window.__jp.G.cameo === null), 1800)));
  check('놈놈은 잠깐 뒤 사라짐', gone);
}

// 3) 게임 오버: 판 화면 위에 GAME OVER + 놈놈, 버튼 유지
console.log('게임 오버');
{
  await page.evaluate(() => { const j = window.__jp; j.startStage(2); j.closeCard(); j.G.need = 99; j.lowerCeiling(14); });
  const g0 = await page.evaluate(() => ({ over: !!window.__jp.G.over, cameo: window.__jp.G.cameo }));
  check('바닥 선을 넘는 순간 게임 오버 연출 시작 (패널티 놈놈은 안 나옴)', g0.over && !g0.cameo, JSON.stringify(g0));
  await page.waitForSelector('#result:not([hidden])', { timeout: 4000 });
  await page.waitForTimeout(1600);
  const g = await page.evaluate(() => {
    const res = document.getElementById('result');
    return {
      title: document.getElementById('overTitle').textContent, titleShown: !document.getElementById('overTitle').hidden,
      bg: getComputedStyle(res).backgroundImage, play: !document.getElementById('play').hidden,
      nom: !!document.querySelector('#resultMascot img'), main: document.getElementById('resultMain').textContent, sub: document.getElementById('resultSub').textContent,
    };
  });
  check('"GAME OVER" 글자가 보임', g.titleShown && g.title === 'GAMEOVER', JSON.stringify(g));
  check('다른 화면으로 안 넘어감: 판 화면이 그대로 뒤에 보임 (배경 그림 없음)', g.play && g.bg === 'none', g.bg);
  check('놈놈·말랑이 그림 + 다시 하기·지도로 버튼', g.nom && g.main === '다시 하기' && g.sub === '지도로', JSON.stringify(g));
  await page.screenshot({ path: path.join(shots, 'gameover-iphone13.png') });
  // 다시 하기 → 연출 지워짐
  await page.click('#resultMain');
  check('다시 하기 → 새 판엔 게임 오버 흔적 없음', await page.evaluate(() => !window.__jp.G.over && document.getElementById('result').hidden));
}

// 4) 영어
console.log('영어');
{
  const en = await browser.newContext({ ...phone, locale: 'en-US' });
  const p = await en.newPage();
  await p.goto(url + '?seed=11&lang=en');
  await p.evaluate(() => { const j = window.__jp; j.reset(); j.P.seenIntro = true; for (let i = 1; i <= 30; i++) j.P.seenStory[i] = true; });
  await p.evaluate(quickWin, 1);
  await p.waitForSelector('#result:not([hidden])', { timeout: 4000 });
  await p.click('#resultScore');
  const t = await p.evaluate(() => document.getElementById('resultScore').textContent);
  check('영어 점수표 (Bubbles popped · Total)', t.includes('Bubbles popped') && t.includes('Total') && !/[가-힣]/.test(t), t);
  const say = await p.evaluate(() => { const j = window.__jp; j.startStage(9); j.closeCard(); j.lowerCeiling(1); return j.G.cameo && j.G.cameo.say; });
  check('영어 놈놈 말풍선', say === 'Squish!', String(say));
  await en.close();
}

check('콘솔 에러 없음', errors.length === 0, errors.join(' | '));
await browser.close();
console.log(`\n결과: 통과 ${pass} / 실패 ${fail}`);
process.exit(fail ? 1 : 0);
