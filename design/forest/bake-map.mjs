// 지도 그림 굽기: 월드별 3D 숲 배경(assets/bg/wN.webp) 위에 길·칸 자리·소품(3D 그림 포함)을 그린 한 장 → assets/map/wN.webp
// 지도 모양(index.html mapArt/mapArtWorld)이나 소품 3D 그림을 바꾸면 다시 실행: node design/forest/bake-map.mjs
// 크기 390×844의 3배(1170×2532). 숲 배경은 화면과 같게 cover + 가운데 45% 기준으로 자른다.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
const dir = path.dirname(new URL(import.meta.url).pathname), root = path.join(dir, '../..');
const out = path.join(root, 'assets/map');
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--allow-file-access-from-files'] });
const page = await browser.newPage();
await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
for (let wi = 0; wi < 5; wi++) {
  const url = await page.evaluate(async wi => {
    const load = src => new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = src; });
    const W = 1170, H = 2532, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    const bg = await load(`assets/bg/w${wi + 1}.webp`);
    const k = Math.max(W / bg.width, H / bg.height), bw = bg.width * k, bh = bg.height * k;
    g.drawImage(bg, (W - bw) * 0.5, (H - bh) * 0.45, bw, bh);
    const html = window.__jp.mapScene(wi), src = /src="([^"]+)"/.exec(html)[1];
    g.drawImage(await load(src), 0, 0, W, H);
    return c.toDataURL('image/webp', 0.8);
  }, wi);
  const buf = Buffer.from(url.split(',')[1], 'base64');
  fs.writeFileSync(path.join(out, `w${wi + 1}.webp`), buf);
  console.log(`w${wi + 1}.webp ${(buf.length / 1024).toFixed(0)}KB`);
}
await browser.close();
