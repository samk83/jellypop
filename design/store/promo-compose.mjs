// App Store 소개 이미지 합성: node design/store/promo-compose.mjs
// 입력: design/store/promo/raw/<lang>/<device>/*.png (promo-shots.mjs 결과, 실제 게임 화면)
//       design/store/promo/sprites/*.png (게임 sprites3d.js 에서 꺼낸 캐릭터 그림)
// 출력: store/appstore/<lang>/iphone-6.9/NN-*.png (1320×2868)
//       store/appstore/<lang>/ipad-13/NN-*.png   (2064×2752)
// 알파 채널은 promo-flatten.py 가 없앤다(App Store 는 투명도 불가).
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const f = p => pathToFileURL(path.join(root, p)).href;
const SP = n => f(`design/store/promo/sprites/${n}.png`);

// 장면 순서 = 스토어에 올리는 순서
const SLIDES = [
  { id: 'title', bg: ['#ff8ec4', '#ffc3e1', '#ffe9a8'], tilt: 0, hero: 'malang-joy', heroPos: 'br', side: ['blue-joy', 'yellow-joy', 'purple-joy'],
    ko: ['말랑말랑 젤리 버블 슈터', '젤리 친구들을<br><em>구해 줘!</em>'], en: ['A squishy jelly bubble shooter', 'Save your<br><em>jelly friends!</em>'] },
  { id: 'pop', bg: ['#6fd3ff', '#a9e8ff', '#e3fbff'], tilt: -3, hero: 'malang-happy', heroPos: 'bl', side: ['green-happy', 'peach-joy'], burst: true,
    ko: ['손가락 하나로 조준·발사', '같은 색 3개면<br><em>펑!</em>'], en: ['Aim & shoot with one finger', 'Match 3 and<br><em>POP!</em>'] },
  { id: 'rescue', bg: ['#7be3b4', '#b9f3d3', '#fff6c9'], tilt: 3, hero: 'yellow-joy', heroPos: 'br', side: ['blue-joy', 'purple-joy', 'peach-joy'],
    ko: ['거품 속에 갇힌 친구들', '톡! 터뜨려<br><em>구출해요</em>'], en: ['Friends trapped in bubbles', 'Pop them<br><em>free!</em>'] },
  { id: 'boss', bg: ['#6a3fd6', '#a874ff', '#ff9ccf'], tilt: -3, hero: 'boss-mungchi', heroPos: 'tr', side: ['nom'], dark: true,
    ko: ['장난꾸러기 노놈 일당', '보스와<br><em>한판 승부!</em>'], en: ['Meet mischievous Nonom', 'Epic<br><em>boss battles!</em>'] },
  { id: 'map', bg: ['#ffb36b', '#ffd59e', '#fff3d6'], tilt: 0, hero: 'malang-joy', heroPos: 'bl', side: ['green-happy', 'blue-joy'], badge: ['30', '스테이지', 'STAGES'],
    ko: ['젤리마을부터 노놈의 성까지', '5개 월드<br><em>30 스테이지</em>'], en: ['From Jelly Village to Nonom’s Castle', '5 worlds<br><em>30 stages</em>'] },
  { id: 'clear', bg: ['#ff7fae', '#ffb8d6', '#fff0f6'], tilt: 3, hero: 'peach-joy', heroPos: 'tr', side: ['yellow-joy', 'purple-joy'],
    ko: ['별 3개에 도전!', '귀여운 스티커<br><em>모으기</em>'], en: ['Go for 3 stars', 'Collect<br><em>cute stickers</em>'] },
  { id: 'story', bg: ['#9b7bff', '#c9b3ff', '#ffd6ec'], tilt: 0, hero: 'malang-happy', heroPos: 'mr', side: ['blue-joy', 'green-happy', 'yellow-joy'], dark: true,
    ko: ['노놈의 생일 초대장의 비밀', '판마다 이어지는<br><em>이야기</em>'], en: ['The secret of Nonom’s invitation', 'A sweet<br><em>story unfolds</em>'] },
];
const DEVICES = {
  'iphone-6.9': { W: 660, H: 1434, raw: 'phone', phoneW: 0.715, cap: 1 },
  'ipad-13': { W: 1032, H: 1376, raw: 'ipad', phoneW: 0.72, cap: 1.2 },
};

// 장식 거품(같은 씨앗이면 같은 자리)
function bubbles(seed, W, H) {
  let s = seed; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  let out = '';
  for (let i = 0; i < 16; i++) {
    const d = 18 + r() * 70, x = r() * W - d / 2, y = r() * H - d / 2, o = 0.25 + r() * 0.35;
    out += `<i class="bub" style="left:${x}px;top:${y}px;width:${d}px;height:${d}px;opacity:${o}"></i>`;
  }
  return out;
}

function html(sl, lang, dev, D, idx) {
  const { W, H, cap } = D;
  const [kick, big] = sl[lang];
  const shot = f(`design/store/promo/raw/${lang}/${D.raw}/${sl.id}.png`);
  const pw = Math.round(W * D.phoneW);
  // 아이폰·아이패드 모두 실제 화면 전체를 그대로 보여 준다 (자르지 않음)
  const ratio = dev === 'ipad-13' ? 1376 / 1032 : 932 / 430;
  const rad = dev === 'ipad-13' ? 0.06 : 0.12;
  const ph = Math.round(pw * ratio);
  const capH = Math.round(H * (dev === 'ipad-13' ? 0.245 : 0.255));
  const top = capH;
  const ink = sl.dark ? '#ffffff' : '#4a1a7a';
  const stroke = sl.dark ? '#3a1270' : '#ffffff';
  const em = sl.dark ? '#ffe45c' : '#ff3d8b';
  const heroS = Math.round(W * (dev === 'ipad-13' ? 0.30 : 0.40) * (sl.hero.startsWith('boss') ? 1.05 : 1));
  const heroCss = { br: `right:${-heroS * 0.12}px;bottom:${H * 0.05}px`, bl: `left:${-heroS * 0.12}px;bottom:${H * 0.05}px`, tr: `right:${-heroS * 0.10}px;top:${capH - heroS * 0.62}px`, mr: `right:${-heroS * 0.22}px;top:${capH + (H - capH) * 0.40}px` }[sl.heroPos];
  const ipadPad = 0;
  const sides = sl.side.map((n, i) => {
    const s = Math.round(W * (dev === 'ipad-13' ? 0.10 : 0.13) * (1 - i * 0.1));
    const left = sl.heroPos === 'bl' || sl.heroPos === 'tr';
    const x = (i % 2 ? !left : left) ? `right:${W * 0.02 + ipadPad * (i % 2 ? 0.2 : 1)}px` : `left:${W * 0.02 + ipadPad * (i % 2 ? 0.2 : 1)}px`;
    const y = `top:${capH + (H - capH) * (0.18 + i * 0.22)}px`;
    return `<img class="side" src="${SP(n)}" style="${x};${y};width:${s}px;transform:rotate(${(i % 2 ? 12 : -10)}deg)">`;
  }).join('');
  const badge = sl.badge ? `<div class="badge" style="left:${W * 0.015 + ipadPad * 2.2}px;top:${capH - 30}px"><b>${sl.badge[0]}</b><span>${lang === 'ko' ? sl.badge[1] : sl.badge[2]}</span></div>` : '';
  const kfont = lang === 'ko' ? "'Jua'" : "'Baloo 2'";
  return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Jua&family=Baloo+2:wght@800&family=Noto+Sans+KR:wght@900&display=block" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden}
body{position:relative;background:linear-gradient(170deg,${sl.bg[0]} 0%,${sl.bg[1]} 48%,${sl.bg[2]} 100%)}
.rays{position:absolute;left:50%;top:${capH * 0.55}px;width:${W * 2.4}px;height:${W * 2.4}px;margin-left:${-W * 1.2}px;margin-top:${-W * 1.2}px;
  background:repeating-conic-gradient(from 0deg,rgba(255,255,255,.16) 0 9deg,rgba(255,255,255,0) 9deg 18deg);
  -webkit-mask:radial-gradient(circle,#000 0,#000 25%,transparent 60%);mask:radial-gradient(circle,#000 0,#000 25%,transparent 60%)}
.bub{position:absolute;border-radius:50%;background:radial-gradient(circle at 32% 28%,#fff 0 12%,rgba(255,255,255,.55) 18%,rgba(255,255,255,.12) 55%,rgba(255,255,255,.35) 100%);
  box-shadow:inset 0 0 0 2px rgba(255,255,255,.55)}
.cap{position:absolute;left:0;right:0;top:0;height:${capH}px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 ${W * 0.05}px}
.kick{font-family:${kfont},'Noto Sans KR',sans-serif;font-weight:800;font-size:${27 * cap}px;color:#fff;background:${sl.dark ? 'rgba(40,10,90,.45)' : 'rgba(255,61,139,.92)'};
  padding:${6 * cap}px ${20 * cap}px;border-radius:999px;margin-bottom:${12 * cap}px;box-shadow:0 4px 0 rgba(0,0,0,.12);letter-spacing:${lang === 'ko' ? '0' : '.3px'}}
.big{font-family:${kfont},'Noto Sans KR',sans-serif;font-weight:800;font-size:${(lang === 'ko' ? 66 : 64) * cap}px;line-height:${lang === 'ko' ? 1.12 : 1.0};color:${ink};
  -webkit-text-stroke:${11 * cap}px ${stroke};paint-order:stroke fill;filter:drop-shadow(0 ${6 * cap}px 0 rgba(60,10,110,.22));transform:rotate(-2deg)}
.big em{font-style:normal;color:${em};font-size:1.18em}
.phone{position:absolute;left:50%;top:${top}px;width:${pw}px;height:${ph}px;margin-left:${-pw / 2}px;transform:rotate(${sl.tilt}deg);
  border-radius:${pw * rad}px;background:#2b1450;padding:${pw * (dev === 'ipad-13' ? 0.02 : 0.028)}px;
  box-shadow:0 0 0 ${pw * 0.014}px #fff,0 ${pw * 0.05}px ${pw * 0.09}px rgba(40,10,80,.45)}
.phone .scr{width:100%;height:100%;border-radius:${pw * (rad - 0.022)}px;overflow:hidden;background:url("${shot}") center top/cover no-repeat}
.hero{position:absolute;width:${heroS}px;${heroCss};filter:drop-shadow(0 12px 14px rgba(60,10,110,.35));transform:rotate(${sl.heroPos === 'bl' ? 8 : -8}deg)}
.side{position:absolute;filter:drop-shadow(0 8px 8px rgba(60,10,110,.3))}
.burst{position:absolute;right:${W * 0.015}px;top:${capH + ph * 0.42}px;font-family:'Baloo 2';font-weight:800;font-size:${70 * cap}px;color:#ffe45c;-webkit-text-stroke:${10 * cap}px #ff3d8b;paint-order:stroke fill;transform:rotate(14deg);filter:drop-shadow(0 6px 0 rgba(60,10,110,.25))}
.badge{position:absolute;width:${150 * cap}px;height:${150 * cap}px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff58a,#ffc21a 70%);
  box-shadow:0 0 0 ${7 * cap}px #fff,0 10px 18px rgba(60,10,110,.3);display:flex;flex-direction:column;align-items:center;justify-content:center;transform:rotate(-12deg);z-index:3}
.badge b{font-family:'Baloo 2';font-size:${66 * cap}px;line-height:.9;color:#ff3d8b}
.badge span{font-family:${kfont},sans-serif;font-weight:800;font-size:${22 * cap}px;color:#7a2a00}
</style></head><body>
<div class="rays"></div>${bubbles(idx * 77 + 13, W, H)}
<div class="phone"><div class="scr"></div></div>
${sides}${badge}
<img class="hero" src="${SP(sl.hero)}">
${sl.burst ? `<div class="burst">POP!</div>` : ''}
<div class="cap"><div class="kick">${kick}</div><div class="big">${big}</div></div>
</body></html>`;
}

const LANGS = (process.env.LANGS || 'ko,en').split(',');
const browser = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), args: ['--allow-file-access-from-files'] });
const tmp = path.join(root, 'design/store/promo/.tmp'); fs.mkdirSync(tmp, { recursive: true });
for (const lang of LANGS) for (const [dev, D] of Object.entries(DEVICES)) {
  const out = path.join(root, 'store/appstore', lang, dev); fs.mkdirSync(out, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: D.W, height: D.H }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  for (const [i, sl] of SLIDES.entries()) {
    const file = path.join(tmp, `${lang}-${dev}-${sl.id}.html`);
    fs.writeFileSync(file, html(sl, lang, dev, D, i));
    await page.goto(pathToFileURL(file).href); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(out, `${String(i + 1).padStart(2, '0')}-${sl.id}.png`) });
  }
  await ctx.close(); console.log(' ', lang, dev, SLIDES.length);
}
await browser.close();
