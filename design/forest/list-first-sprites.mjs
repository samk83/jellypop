// 처음 받는 그림 파일(sprites3d.js)에 넣을 3D 그림 목록 만들기 → design/forest/sprite-first.json
// 타이틀·지도·30 스테이지·결과·스티커 북에서 실제로 쓰는 그림만 고른다. 나머지(프롤로그·컷신·소품)는 sprites3d-scene.js
// 사용: node design/forest/list-first-sprites.mjs  →  그다음 REUSE=1 node design/forest/bake-sprites.mjs
// (새 스테이지·화면이 그림을 더 쓰게 되면 다시 돌린다. 빠지면 tests/jelly3d.test.mjs 가 잡음)
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname), root = path.resolve(dir, '../..');
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.goto(pathToFileURL(path.join(root, 'index.html')).href);
await p.evaluate(() => { window.__used = new Set(); const o = Jelly3D.bake; Jelly3D.bake = (k, op = {}, px) => { __used.add([k, String(op.color).toLowerCase(), op.mood || 'happy', op.ears ? 1 : 0].join('|')); return o(k, op, px); }; });
await p.evaluate(() => { const j = window.__jp; j.go('title'); j.go('map'); });
for (let n = 1; n <= 30; n++) { await p.evaluate(n => window.__jp.startStage(n), n); await p.waitForFunction(() => Gummy.pending() === 0, null, { timeout: 15000 }); }
await p.evaluate(() => {
  const j = window.__jp;
  for (const n of [1, 12, 30]) { j.startStage(n); j.G.outcome = { win: true, stars: 3, newSticker: true }; j.showResult(); }
  j.startStage(5); j.G.outcome = { win: false, stars: 0, newSticker: false, reason: 'line' }; j.showResult();
  j.P.stars = j.P.stars.map(() => 3); for (let i = 1; i <= 30; i++) j.P.stickers[i] = true;
  j.go('map'); for (let w = 0; w < 5; w++) document.getElementById('mapNext').click();
  j.go('book'); j.go('title');
});
const used = (await p.evaluate(() => [...__used])).filter(k => !/^(house|tree|mushroom|castle|fountain|windmill|lamp|crystal|gift|gear|mirror|pot|pudding|towertop|towerbody|stalactite|pipe|picket|factory)\|/.test(k)).sort();
await b.close();
fs.writeFileSync(path.join(dir, 'sprite-first.json'), '[\n' + used.map(k => JSON.stringify(k)).join(',\n') + '\n]');
console.log(used.length + '장');
