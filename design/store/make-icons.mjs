// 앱 아이콘 만들기: node design/store/make-icons.mjs
// 미리 구운 3D 말랑이(sprites3d.js)를 연보라 배경에 올려 PWA·스토어·토스용 아이콘 PNG 를 만든다.
//   icons/icon-192.png, icons/icon-512.png        — PWA (any)
//   icons/maskable-512.png                        — PWA (maskable, 안전 영역 80% 안에 그림)
//   icons/apple-touch-icon.png (180)              — 아이폰 홈 화면
//   store/icons/play-512.png                      — Google Play 등록 아이콘 (512, 32bit PNG)
//   store/icons/appstore-1024.png                 — App Store 아이콘 (1024, 투명 없음)
//   store/icons/toss-600.png                      — 앱인토스 콘솔 아이콘 (600)
//   app/android, app/ios 의 앱 아이콘·시작 화면(splash) — 이미 있는 파일 크기 그대로 다시 그린다
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'sprites3d.js'), 'utf8'), ctx);
const S = ctx.window.JELLY3D_SPRITES;
const mal = S['jelly|#ff7fae|joy|1'];
const bub = c => S[`bubble|${c}|happy|0`];

// scale: 그림 크기 비율 (maskable 은 작게)
const page = (size, scale) => `<!doctype html><html><body style="margin:0">
<div id="i" style="width:${size}px;height:${size}px;position:relative;overflow:hidden;
  background:radial-gradient(circle at 50% 40%,#ffffff 0%,#e6f3ff 40%,#b9a6ff 100%)">
  <img src="${bub('#4fb4ff')}" style="position:absolute;width:${size * .26 * scale}px;left:${size * (.5 - .40 * scale)}px;top:${size * (.5 - .40 * scale)}px">
  <img src="${bub('#ffd23f')}" style="position:absolute;width:${size * .20 * scale}px;left:${size * (.5 + .22 * scale)}px;top:${size * (.5 - .38 * scale)}px">
  <img src="${bub('#5ed46a')}" style="position:absolute;width:${size * .17 * scale}px;left:${size * (.5 + .26 * scale)}px;top:${size * (.5 + .12 * scale)}px">
  <img src="${mal}" style="position:absolute;width:${size * .74 * scale}px;left:${size * (.5 - .37 * scale)}px;top:${size * (.5 - .30 * scale)}px">
</div></body></html>`;

// 안드로이드 적응형 아이콘 앞 그림(투명 배경, 가운데 66% 안에), 시작 화면(가운데 말랑이)
const fg = size => `<!doctype html><html><body style="margin:0;background:transparent">
<div id="i" style="width:${size}px;height:${size}px;position:relative;overflow:hidden">
  <img src="${mal}" style="position:absolute;width:${size * .5}px;left:${size * .25}px;top:${size * .28}px">
</div></body></html>`;
const splash = (w, h) => { const m = Math.min(w, h) * .34; return `<!doctype html><html><body style="margin:0">
<div id="i" style="width:${w}px;height:${h}px;position:relative;overflow:hidden;background:radial-gradient(circle at 50% 45%,#fff0f7 0%,#ffd1e8 55%,#ffb3d4 100%)">
  <img src="${mal}" style="position:absolute;width:${m}px;left:${(w - m) / 2}px;top:${(h - m) / 2}px">
</div></body></html>`; };
const round = (size, scale) => page(size, scale).replace('overflow:hidden;', 'overflow:hidden;border-radius:50%;');
const pngSize = f => { const b = fs.readFileSync(f); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
const walk = d => fs.existsSync(d) ? fs.readdirSync(d, { recursive: true }).map(f => path.join(d, f)).filter(f => f.endsWith('.png')) : [];
const native = [...walk(path.join(root, 'app/android/app/src/main/res')), ...walk(path.join(root, 'app/ios/App/App/Assets.xcassets'))];

const out = [
  ['icons/icon-192.png', 192, 1], ['icons/icon-512.png', 512, 1], ['icons/maskable-512.png', 512, .78],
  ['icons/apple-touch-icon.png', 180, 1], ['store/icons/play-512.png', 512, 1],
  ['store/icons/appstore-1024.png', 1024, 1], ['store/icons/toss-600.png', 600, 1],
];
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const p = await browser.newPage();
for (const [file, size, scale] of out) {
  await p.setViewportSize({ width: size, height: size });
  await p.setContent(page(size, scale));
  await p.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth));
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  await p.locator('#i').screenshot({ path: path.join(root, file), omitBackground: false });
  console.log('  ' + file);
}
for (const f of native) {
  const [w, h] = pngSize(f), name = path.basename(f);
  await p.setViewportSize({ width: w, height: h });
  const transparent = name === 'ic_launcher_foreground.png';
  await p.setContent(name.startsWith('splash') ? splash(w, h) : transparent ? fg(w) : name === 'ic_launcher_round.png' ? round(w, 1) : page(w, 1));
  await p.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth));
  await p.locator('#i').screenshot({ path: f, omitBackground: transparent || name === 'ic_launcher_round.png' });
}
if (native.length) console.log(`  app/ 앱 아이콘·시작 화면 ${native.length}개`);
await browser.close();
