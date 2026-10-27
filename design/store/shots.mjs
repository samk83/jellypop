// 스토어 스크린샷 자동 캡처: node design/store/shots.mjs   (npm run shots)
// 실제 게임(index.html)을 열어 5장면을 찍는다. 한국어(ko)·영어(en, 영어판이 있으면) 두 벌.
//   store/screenshots/<lang>/phone-6.7/  1290×2796  — App Store 6.7인치 (필수 크기)
//   store/screenshots/<lang>/phone-play/ 1080×2340  — Google Play 휴대폰 (9:19.5)
// 토스 콘솔도 같은 세로 그림을 쓴다.
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const url = pathToFileURL(path.join(root, 'index.html')).href;
const SIZES = [['phone-6.7', 430, 932, 3], ['phone-play', 360, 780, 3]];
const LANGS = fs.existsSync(path.join(root, 'lang-en.js')) ? ['ko', 'en'] : ['ko'];

const browser = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), args: ['--allow-file-access-from-files'] });
const settle = p => p.waitForTimeout(900);
for (const lang of LANGS) for (const [name, w, h, s] of SIZES) {
  const dir = path.join(root, 'store/screenshots', lang, name);
  fs.mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: s, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(url + `?seed=11&lang=${lang}`);
  await page.waitForFunction(() => window.__jp && document.fonts.status === 'loaded');
  const snap = async n => { await settle(page); await page.screenshot({ path: path.join(dir, n + '.png') }); };
  // 1 타이틀
  await snap('1-title');
  // 2 지도 (월드 1을 몇 판 깬 상태)
  await page.evaluate(() => { const j = window.__jp; j.reset(); j.P.seenIntro = true; [3, 3, 2, 3].forEach((v, i) => { j.P.stars[i] = v; j.P.stickers[i + 1] = true; }); j.P.seenStory = Object.fromEntries(Array.from({ length: 30 }, (_, i) => [i + 1, true])); j.save(); j.go('map'); });
  await page.waitForTimeout(1500);
  await snap('2-map');
  // 3 플레이 (스테이지 5 — 거품이 꽉 찬 판)
  await page.evaluate(() => { const j = window.__jp; j.startStage(5); j.closeCard(); j.setAngle(-1.2); });
  await snap('3-play');
  // 4 보스 (스테이지 12 찐득이)
  await page.evaluate(() => { const j = window.__jp; j.startStage(12); j.closeCard(); j.setAngle(-1.9); });
  await page.waitForTimeout(800);
  await snap('4-boss');
  // 5 클리어 (별 3개, 스티커)
  await page.evaluate(() => { const j = window.__jp; j.startStage(6); j.closeCard(); j.G.fired = 1; j.finish(true); });
  await page.waitForFunction(() => !document.getElementById('result').hidden, null, { timeout: 5000 });
  await snap('5-clear');
  await ctx.close();
  console.log(`  store/screenshots/${lang}/${name} ${w * s}×${h * s} 5장`);
}
await browser.close();
