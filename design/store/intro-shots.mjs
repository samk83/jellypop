// 시작 설명(프롤로그·첫 판 안내·새 거품 카드) 휴대폰 크기 스크린샷: node design/store/intro-shots.mjs <출력폴더> [ko|en]
// 설명이 그림을 얼마나 가리는지 전후 비교용 (390×844, iPhone 13 크기)
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const url = pathToFileURL(path.join(root, 'index.html')).href;
const out = path.resolve(process.argv[2] || 'intro-shots'), lang = process.argv[3] || 'ko';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), args: ['--allow-file-access-from-files'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.goto(url + `?seed=11&lang=${lang}`);
await page.waitForFunction(() => window.__jp && document.fonts.status === 'loaded');
await page.evaluate(() => { const j = window.__jp; j.reset(); });
const snap = async n => { await page.waitForTimeout(1200); await page.screenshot({ path: path.join(out, `${lang}-${n}.png`) }); };
await page.click('#startBtn');
await page.waitForSelector('#nextSlide');
for (let i = 1; i <= 4; i++) { await snap(`intro-${i}`); await page.click('#nextSlide'); }
await page.waitForTimeout(800);
await page.evaluate(() => window.__jp.startStage(1));
await snap('stage1-tip');
await page.evaluate(() => window.__jp.startStage(4));
await snap('stage4-card');
await browser.close();
console.log('saved', out);
