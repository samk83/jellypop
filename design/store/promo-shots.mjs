// App Store 소개 이미지용 실제 게임 화면 캡처: node design/store/promo-shots.mjs
// 결과: design/store/promo/raw/<lang>/<device>/*.png  (합성은 promo-compose.mjs)
//   phone 430×932 @3 = 1290×2796 · ipad 1032×1376 @2 = 2064×2752
// 실제 index.html 을 그대로 연다. 화면을 가리는 잠깐 뜨는 안내(배너·팁 말풍선·토스트)만 숨긴다.
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const url = pathToFileURL(path.join(root, 'index.html')).href;
const DEVICES = [['phone', 430, 932, 3], ['ipad', 1032, 1376, 2]];
const LANGS = (process.env.LANGS || 'ko,en').split(',');
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;

const browser = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), args: ['--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

const clean = page => page.evaluate(() => {
  for (const id of ['banner', 'tip', 'toast']) { const el = document.getElementById(id); if (el) el.style.visibility = 'hidden'; }
});
// 가장 많이 터뜨리는(또는 친구를 구하는) 각도 고르기
const bestAngle = (page, wantFriend) => page.evaluate(wantFriend => {
  const j = window.__jp; let best = null;
  for (let a = -Math.PI + 0.2; a <= -0.2; a += 0.01) {
    const r = j.evalShot(a); if (!r || !r.cell) continue;
    const s = (wantFriend ? r.friends * 1000 : 0) + r.popped * 10 + r.dropped * 12;
    if (!best || s > best.s) best = { s, a, r };
  }
  return best;
}, wantFriend);

for (const lang of LANGS) for (const [dev, w, h, s] of DEVICES) {
  const dir = path.join(root, 'design/store/promo/raw', lang, dev);
  fs.mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: s, isMobile: true, hasTouch: true, locale: lang === 'ko' ? 'ko-KR' : 'en-US' });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('ERR', e.message));
  const want = n => !ONLY || ONLY.includes(n);
  const snap = async n => { await page.screenshot({ path: path.join(dir, n + '.png') }); console.log(' ', lang, dev, n); };
  await page.goto(url + `?seed=11&lang=${lang}`);
  await page.waitForFunction(() => window.__jp && document.fonts.status === 'loaded');
  await page.waitForTimeout(1500);
  const prep = () => page.evaluate(() => { const j = window.__jp; j.reset(); j.P.seenIntro = true; j.P.seenStory = Object.fromEntries(Array.from({ length: 30 }, (_, i) => [i + 1, true])); for (let i = 0; i < 30; i++) j.P.seenHz = j.P.seenHz || {}; j.save(); });

  if (want('title')) { await page.waitForTimeout(600); await snap('title'); }
  await prep();

  if (want('map')) {
    await page.evaluate(() => { const j = window.__jp; [3, 3, 3, 2, 3, 3, 3].forEach((v, i) => { j.P.stars[i] = v; j.P.stickers[i + 1] = true; }); j.save(); j.go('map'); });
    await page.waitForTimeout(1800); await snap('map');
  }

  // 펑! — 큰 덩어리가 터지는 순간 (6개 이상 터지는 발사가 나올 때까지 쏜다)
  if (want('pop')) {
    await page.evaluate(() => { const j = window.__jp; j.startStage(4); j.closeCard(); });
    await page.waitForTimeout(900); await clean(page);
    for (let k = 0; k < 14; k++) {
      const b = await bestAngle(page, false);
      const big = b && (b.r.popped + b.r.dropped) >= 6;
      if (!big) { await page.evaluate(() => window.__jp.swapQueue()); const b2 = await bestAngle(page, false); if (b2 && (b2.r.popped + b2.r.dropped) >= 6) { k--; continue; } await page.evaluate(() => window.__jp.swapQueue()); }
      await page.evaluate(a => { const j = window.__jp; j.setAngle(a); j.shoot(); }, b.a);
      if (big) { await page.waitForFunction(() => window.__jp.G.state !== 'flying', null, { timeout: 4000 }); await page.waitForTimeout(90); await clean(page); await snap('pop'); console.log('   pop', k, b.r); break; }
      await page.evaluate(() => window.__jp.advance()); await page.waitForTimeout(250);
    }
  }

  // 친구 구출 — 친구가 거품에서 풀려나 튀어나오는 순간
  if (want('rescue')) {
    await page.evaluate(() => { const j = window.__jp; j.startStage(3); j.closeCard(); });
    await page.waitForTimeout(900); await clean(page);
    for (let k = 0; k < 6; k++) {
      const b = await bestAngle(page, true);
      await page.evaluate(a => { const j = window.__jp; j.setAngle(a); j.shoot(); }, b.a);
      if (b.r.friends) { await page.waitForFunction(() => window.__jp.G.state !== 'flying', null, { timeout: 4000 }); await page.waitForTimeout(450); await clean(page); await snap('rescue'); console.log('   rescue at try', k); break; }
      await page.evaluate(() => window.__jp.advance()); await page.waitForTimeout(300);
    }
  }

  // 보스 — 최종 보스 노놈
  if (want('boss')) {
    await page.evaluate(() => { const j = window.__jp; j.startStage(30); j.closeCard(); j.setAngle(-1.25); });
    await page.waitForTimeout(1400); await clean(page); await snap('boss');
  }

  // 클리어 — 별 3개 · 스티커
  if (want('clear')) {
    await page.evaluate(() => { const j = window.__jp; j.startStage(6); j.closeCard(); j.G.fired = 9; j.G.score = 12480; j.finish(true); });
    await page.waitForFunction(() => !document.getElementById('result').hidden, null, { timeout: 5000 });
    await page.waitForTimeout(4200); await snap('clear');
  }

  // 이야기 — 마지막 생일 파티 컷신
  if (want('story')) {
    await page.evaluate(() => window.JellyStory.open(30, () => {}));
    const n = await page.evaluate(() => window.JellyStoryData.find(d => d.id === 30).lines.length);
    for (let li = 0; li < Math.min(n - 1, 2); li++) { await page.waitForTimeout(2200); if (await page.$('#csNext')) await page.click('#csNext'); }
    await page.waitForTimeout(2600); await snap('story');
  }
  await ctx.close();
}
await browser.close();
