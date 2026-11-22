// Google Play 그래픽 이미지(1024×500) 만들기: node design/store/make-feature.mjs
// 타이틀 배경 + 미리 구운 3D 말랑이·친구·거품(sprites3d.js) + JELLY POP! 로고. 게임 그림은 그대로 쓰고 새로 그리지 않는다.
//   store/feature/play-feature-ko.png, store/feature/play-feature-en.png
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'sprites3d.js'), 'utf8'), ctx);
const S = ctx.window.JELLY3D_SPRITES;
const mal = S['jelly|#ff7fae|joy|1'];
const j = c => S[`jelly|${c}|joy|0`];
const bub = c => S[`bubble|${c}|happy|0`];
const bg = pathToFileURL(path.join(root, 'assets/bg/title.webp')).href;

const TXT = {
  ko: { tag: '거품을 쏘아 젤리 친구를 구해요!', font: '"Noto Sans KR"' },
  en: { tag: 'Pop bubbles, save friends!', font: '"Baloo 2","Noto Sans KR"' },
};

const page = lang => `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@800&family=Noto+Sans+KR:wght@900&display=swap">
<style>
body{margin:0}
#f{width:1024px;height:500px;position:relative;overflow:hidden;background:#ffd1e8 url(${bg}) center 40%/cover}
#f::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(255,236,246,.0) 0%,rgba(255,236,246,.0) 48%,rgba(255,236,246,.55) 100%)}
img{position:absolute;z-index:1}
.logo{position:absolute;z-index:2;right:56px;top:70px;width:470px;text-align:center;font-family:"Baloo 2",sans-serif;font-weight:800;line-height:.9;transform:rotate(-3deg);filter:drop-shadow(0 10px 10px rgba(42,11,78,.25))}
.logo span{display:block;color:transparent;-webkit-background-clip:text;background-clip:text;
  filter:drop-shadow(0 3px 0 #c2457a) drop-shadow(0 3px 0 #c2457a) drop-shadow(0 3px 0 #a33a68) drop-shadow(0 2px 0 #4a1d7a)}
.l1{font-size:128px;background:linear-gradient(180deg,#fff3f8 0%,#ff8fbd 45%,#ff6fa3 50%,#ff4f8b 100%)}
.l2{font-size:146px;margin-top:-6px;background:linear-gradient(180deg,#fffbe0 0%,#ffd45a 45%,#ffc53d 50%,#ff8f1f 100%)}
.tag{position:absolute;z-index:2;right:56px;width:470px;top:392px;text-align:center;font-family:${TXT[lang].font};font-weight:900;font-size:${lang === 'ko' ? 30 : 32}px;color:#fff;
  text-shadow:0 3px 0 #c2457a,0 4px 8px rgba(42,11,78,.45)}
</style></head><body>
<div id="f">
  <img src="${bub('#4fb4ff')}" style="width:120px;left:40px;top:30px">
  <img src="${bub('#ffd23f')}" style="width:92px;left:330px;top:20px">
  <img src="${bub('#5ed46a')}" style="width:80px;left:420px;top:330px">
  <img src="${bub('#a76bff')}" style="width:70px;left:20px;top:360px">
  <img src="${j('#4fb4ff')}" style="width:150px;left:60px;top:250px">
  <img src="${j('#5ed46a')}" style="width:130px;left:340px;top:200px">
  <img src="${mal}" style="width:300px;left:120px;top:110px">
  <div class="logo"><span class="l1">JELLY</span><span class="l2">POP!</span></div>
  <div class="tag">${TXT[lang].tag}</div>
</div></body></html>`;

const out = path.join(root, 'store/feature');
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), args: ['--allow-file-access-from-files'] });
const p = await browser.newPage({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 1 });
for (const lang of ['ko', 'en']) {
  const f = path.join(out, `_tmp-${lang}.html`);
  fs.writeFileSync(f, page(lang));
  await p.goto(pathToFileURL(f).href, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.locator('#f').screenshot({ path: path.join(out, `play-feature-${lang}.png`) });
  fs.rmSync(f);
  console.log('store/feature/play-feature-' + lang + '.png');
}
await browser.close();
