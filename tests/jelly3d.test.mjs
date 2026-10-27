// 3D 그림(jelly3d.js) 자동 테스트: node tests/jelly3d.test.mjs
// 3D 그림은 미리 구워 둔 그림(sprites3d.js)이라 어떤 기기에서도 켜진다. ?3d=0 이면 끔.
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const page3d = pathToFileURL(path.join(root, 'index.html')).href + '?3d=1';
const pageOff = pathToFileURL(path.join(root, 'index.html')).href + '?3d=0';
let pass = 0, fail = 0;
function check(name, ok, info = '') { if (ok) { pass++; console.log('  ✅ ' + name); } else { fail++; console.log('  ❌ ' + name + ' ' + info); } }

const browser = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}),
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
// 게임이 WebGL(실시간 3D)을 한 번이라도 켜는지 기록
await ctx.addInitScript(() => { window.__gl = 0; const gc = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { if (/webgl/i.test(t)) window.__gl++; return gc.call(this, t, ...a); }; });
await ctx.addInitScript(() => { try { localStorage.setItem('jellypop.progress', JSON.stringify({ seenIntro: true })); } catch (e) { /* noop */ } });

console.log('3D 그림 굽기');
{
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
  await page.goto(page3d);
  check('?3d=1 이면 3D 켜짐', await page.evaluate(() => Jelly3D.ok() === true));
  check('실시간 3D 계산 없음 (WebGL 안 씀, 미리 구운 그림만)', await page.evaluate(() => !!window.JELLY3D_SPRITES && Object.keys(JELLY3D_SPRITES).length >= 80 && window.__gl === 0));
  await page.evaluate(() => Jelly3D.scene());   // 컷신용 젤리 그림은 소품 파일 쪽
  const r = await page.evaluate(async () => {
    const kinds = [['jelly', { color: '#ff7fae', mood: 'happy', ears: true }], ['jelly', { color: '#4fb4ff', mood: 'joy' }], ['jelly', { color: '#ffd23f', mood: 'worried' }],
      ['jelly', { color: '#8a5cf0', mood: 'angry' }], ['bubble', { color: '#5ed46a' }], ['bubble', { color: '#e6f2ff', mood: 'none' }],
      ['barrel', { color: '#ff8cb8' }], ['base', { color: '#ff8cb8' }], ['housing', { color: '#ff9fc0' }], ['wheel', { color: '#ff9fc0' }]];
    const out = [];
    for (const [k, o] of kinds) {
      const url = Jelly3D.bake(k, o, 96);
      if (!url) { out.push({ k, ok: false }); continue; }
      const im = new Image(); im.src = url; await im.decode();
      const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data; let opaque = 0, clear = 0;
      for (let i = 3; i < d.length; i += 4) { if (d[i] > 250) opaque++; else if (d[i] < 5) clear++; }
      const n = d.length / 4;
      out.push({ k, ok: true, opaque: opaque / n, clear: clear / n, corner: d[3] });
    }
    const again = Jelly3D.bake('jelly', { color: '#FF7FAE', mood: 'happy', ears: true }) === JELLY3D_SPRITES['jelly|#ff7fae|happy|1'];
    return { out, again, bad: Jelly3D.bake('jelly', { color: 'not-a-color' }, 96) };
  });
  r.out.forEach(o => check(`${o.k}: 그림이 나옴 (가운데는 칠해지고 모서리는 투명)`, o.ok && o.opaque > 0.05 && o.clear > 0.1 && o.corner === 0, JSON.stringify(o)));
  check('색 대소문자 상관없이 미리 구운 그림을 찾음', r.again);
  check('잘못된 색이면 null (SVG 그림으로 대체)', r.bad === null);
  check('보스 4종·노놈·꼬마 놈놈도 미리 구운 3D 그림 (뿔·왕관·모자·가면 포함)', await page.evaluate(() =>
    ['mungchi', 'syrup', 'pudding', 'robot'].every(kind => ['angry', 'worried', 'o'].every(mood => Gummy.boss(0, 0, 28, { kind, mood }).includes('<image'))) &&
    ['angry', 'worried', 'happy'].every(mood => Gummy.nomnom(0, 0, 30, { mood }).includes('<image') && Gummy.nomnom(0, 0, 16, { mood, mini: true }).includes('<image')) &&
    ['angry', 'worried'].every(mood => Gummy.nomnom(0, 0, 30, { mood, red: 0.7 }).includes('<image'))));
  check('목록에 없는 그림이면 null (SVG 그림으로 대체)', await page.evaluate(() => Jelly3D.bake('jelly', { color: '#123456' }) === null));
  check('Art.jelly 가 3D 그림(<image>)을 씀', await page.evaluate(() => Gummy.jelly(0, 0, 20, '#ff5f8a', {}).includes('<image')));
  check('갇힌 친구 거품 = 3D 젤리 + 투명 거품', await page.evaluate(() => (Gummy.bubble(0, 0, 18, '#ff5f8a', { trapped: '#4fdcc4' }).match(/<image/g) || []).length === 2));
  // 타이틀: 3D 숲 배경 그림
  await page.waitForTimeout(500);
  check('타이틀 배경 = 3D 숲 그림', await page.evaluate(() => { const im = document.querySelector('#titleArt img'); return !!im && /assets\/bg\/title\.webp$/.test(im.getAttribute('src')) && im.complete && im.naturalWidth > 0; }));
  check('타이틀 안내 글자는 흰색(숲 위에서 잘 보임)', await page.evaluate(() => getComputedStyle(document.getElementById('titleNote')).color === 'rgb(255, 255, 255)'));
  check('기본 표정이 아닌 거품(고철 화난 얼굴)은 SVG 그림 유지', await page.evaluate(() => !Gummy.bubble(0, 0, 18, '#888888', { mood: 'angry' }).includes('<image')));
  check('젤리 그림 상자에 3D 귀가 다 들어감(위 1.2r 이상)', await page.evaluate(() => { const im = document.querySelector('#titleCast img.mal'); return im.naturalHeight / im.naturalWidth >= 2.5 / 3.2 - 0.01; }));
  // 스테이지: 월드별 배경 그림 + 판 바깥 흐린 배경
  for (const n of [1, 7, 13, 19, 25]) {
    await page.evaluate(n => window.__jp.startStage(n), n);
    await page.waitForFunction(() => { const im = document.querySelector('#play'); return im && !im.hidden; });
    await page.waitForTimeout(400);
    const s = await page.evaluate(() => ({ cls: document.getElementById('play').classList.contains('f3d'), bg: getComputedStyle(document.getElementById('play')).getPropertyValue('--bg3d'), w: window.__jp.state ? null : null }));
    const world = Math.floor((n - 1) / 6) + 1;
    check(`스테이지 ${n}: 월드 ${world} 3D 배경`, s.cls && s.bg.includes(`w${world}.webp`), JSON.stringify(s));
  }
  // 캔버스에 실제로 숲 그림이 그려졌는지 (가운데 아래 풀밭 = 초록이 강함)
  // (배경 그림을 불러오는 시간이 기기마다 달라서 최대 5초까지 기다림)
  await page.evaluate(() => window.__jp.startStage(1));
  check('플레이 캔버스에 숲 배경이 그려짐', await page.waitForFunction(() => { const c = document.getElementById('canvas'), t = window.__px || (window.__px = document.createElement('canvas').getContext('2d', { willReadFrequently: true })); t.clearRect(0, 0, 1, 1); t.drawImage(c, Math.floor(c.width * 0.85), Math.floor(c.height * 0.9), 1, 1, 0, 0, 1, 1); const d = t.getImageData(0, 0, 1, 1).data; return d[1] > d[0] && d[1] > d[2]; }, null, { timeout: 5000 }).then(() => true, () => false));
  // 타이틀 숲 그림을 못 불러오면 예전 풍경으로
  await page.evaluate(() => { window.__jp.go('title'); document.querySelector('#titleArt img').dispatchEvent(new Event('error')); });
  check('타이틀 그림 실패 → 구미 풍경으로 대체', await page.evaluate(() => !document.getElementById('title').classList.contains('f3d') && !!document.querySelector('#titleArt img').src.startsWith('data:image/svg')));
  check('콘솔 에러 없음', errors.length === 0, errors.slice(0, 3).join(' | '));
  await page.close();
}
console.log('모든 스테이지: 필요한 3D 그림이 다 미리 구워져 있음 + 시작이 멈추지 않음');
{
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  // 소품 그림 파일은 잠시 막아 둔다 → 게임(30 스테이지)은 처음 받는 그림 파일만으로 3D가 모두 나와야 함
  let release; const gate = new Promise(r => { release = r; });
  await page.route('**/sprites3d-scene.js', async r => { await gate; await r.continue(); });
  await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
  check('주소에 아무것도 없어도 3D 켜짐 (기기 상관없이)', await page.evaluate(() => Jelly3D.ok() === true));
  await page.evaluate(() => { window.__miss = new Set(); const b = Jelly3D.bake; Jelly3D.bake = (k, o = {}, px) => { const u = b(k, o, px); if (!u) __miss.add([k, o.color, o.mood || 'happy', o.ears ? 1 : 0].join('|')); return u; }; });
  let worst = 0;
  for (let n = 1; n <= 30; n++) {
    const ms = await page.evaluate(n => { const t = performance.now(); window.__jp.startStage(n); return performance.now() - t; }, n);
    worst = Math.max(worst, ms);
    await page.waitForFunction(() => Gummy.pending() === 0, null, { timeout: 15000 });
  }
  const allMiss = await page.evaluate(() => [...__miss]);
  check('30 스테이지에서 쓰는 3D 그림이 처음 받는 파일에 모두 있음 (SVG로 빠지는 것 없음)', allMiss.length === 0 && await page.evaluate(() => !window.JELLY3D_SCENE), allMiss.join(', '));
  release();
  await page.waitForFunction(() => window.JELLY3D_SCENE === true, null, { timeout: 10000 });
  check(`스테이지 시작 동기 처리 300ms 미만 (최대 ${worst.toFixed(0)}ms)`, worst < 300);
  // 다른 화면들: 결과(이김·짐), 타이틀, 프롤로그 4장, 지도(모든 월드, 친구 다 구함), 스티커 북
  await page.evaluate(() => Jelly3D.scene());   // 소품 그림 파일(sprites3d-scene.js)은 첫 화면 뒤에 따로 온다
  await page.evaluate(() => {
    const j = window.__jp;
    for (const n of [1, 12, 30]) { j.startStage(n); j.G.outcome = { win: true, stars: 3, newSticker: true }; j.showResult(); }
    j.startStage(5); j.G.outcome = { win: false, stars: 0, newSticker: false, reason: 'line' }; j.showResult();
    document.getElementById('result').hidden = true; document.getElementById('app').inert = false;
    j.go('title');
    document.getElementById('storyBtn').click(); for (let i = 0; i < 3; i++) document.getElementById('nextSlide').click();
    j.P.stars = j.P.stars.map(() => 3); for (let i = 1; i <= 30; i++) j.P.stickers[i] = true;
    j.go('map'); for (let i = 0; i < 5; i++) { const b = document.getElementById('mapPrev'); if (!b.hidden) b.click(); }
    j.go('book');
    // 스토리 컷신 30개 (각 장면에 나오는 젤리)
    for (let id = 1; id <= 30; id++) window.JellyStory.open(id, () => {});
  });
  // 지도·프롤로그에 3D 숲 그림이 깔림
  const bgOk = await page.evaluate(async () => {
    const j = window.__jp, out = [];
    const loaded = async sel => { const im = document.querySelector(sel); if (!im) return false; if (!im.complete) await new Promise(r => { im.onload = im.onerror = r; }); return im.naturalWidth > 0; };
    j.P.stars = j.P.stars.map(() => 3);
    for (let w = 0; w < 5; w++) { j.go('map'); for (let i = 0; i < 5; i++) { const b = document.getElementById('mapPrev'); if (!b.hidden) b.click(); } for (let i = 0; i < w; i++) document.getElementById('mapNext').click(); out.push(await loaded('#mapWorld img.scene') && document.querySelector('#mapWorld img.scene').src.includes('assets/map/w' + (w + 1) + '.webp')); await j.mapScene(w); }
    j.go('title'); document.getElementById('storyBtn').click();
    for (let i = 0; i < 4; i++) { out.push(await loaded('#slides img.bg3d')); if (i < 3) document.getElementById('nextSlide').click(); }
    return out;
  });
  check('지도 5장(미리 구운 그림)·프롤로그 4장에 3D 숲 배경이 깔림', bgOk.length === 9 && bgOk.every(Boolean), JSON.stringify(bgOk));
  // 보스가 쓰러질 때 눈이 동그래진 3D 표정 (보스 5종)
  const downs = [];
  for (const n of [6, 12, 18, 24, 30]) {
    await page.evaluate(n => { const j = window.__jp; j.startStage(n); j.closeCard(); const G = j.G; G.bossHp = 0; G.state = 'settle'; G.settleT = 0; }, n);
    downs.push(await page.waitForFunction(() => window.__jp.G.bossDown != null, null, { timeout: 3000 }).then(() => true, () => false));
    await page.waitForFunction(() => Gummy.pending() === 0, null, { timeout: 15000 });
  }
  check('보스가 쓰러지면 쓰러짐 연출 시작 (5종)', downs.every(Boolean), JSON.stringify(downs));
  await page.evaluate(() => { document.getElementById('result').hidden = true; document.getElementById('app').inert = false; });
  const moreMiss = await page.evaluate(() => [...__miss]);
  check('결과·타이틀·프롤로그·지도·스티커 북·스토리 컷신도 3D 그림이 모두 있음', moreMiss.length === 0, moreMiss.join(', '));
  check('WebGL을 한 번도 켜지 않음', await page.evaluate(() => window.__gl === 0));
  check('콘솔 에러 없음', errors.length === 0, errors.join(' | '));
  await page.close();
}
console.log('미리 구운 지도 그림');
{
  const page = await ctx.newPage();
  await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
  // 지도 모양이나 소품 그림을 바꾸고 다시 굽지 않으면 실패 (design/forest/bake-map.mjs)
  const diffs = await page.evaluate(async () => {
    const load = src => new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = src; });
    const W = 195, H = 422, out = [];
    for (let wi = 0; wi < 5; wi++) {
      const a = document.createElement('canvas'), b = document.createElement('canvas'); a.width = b.width = W; a.height = b.height = H;
      const ga = a.getContext('2d', { willReadFrequently: true }), gb = b.getContext('2d', { willReadFrequently: true });
      const bg = await load(`assets/bg/w${wi + 1}.webp`), k = Math.max(W / bg.width, H / bg.height);
      ga.drawImage(bg, (W - bg.width * k) * 0.5, (H - bg.height * k) * 0.45, bg.width * k, bg.height * k);
      ga.drawImage(await load(/src="([^"]+)"/.exec(await window.__jp.mapScene(wi))[1]), 0, 0, W, H);
      gb.drawImage(await load(`assets/map/w${wi + 1}.webp`), 0, 0, W, H);
      // 13×13 칸마다 평균 색 차이 → 가장 큰 칸 (소품 하나만 바뀌어도 잡힘)
      const da = ga.getImageData(0, 0, W, H).data, db = gb.getImageData(0, 0, W, H).data, B = 13; let worst = 0;
      for (let by = 0; by + B <= H; by += B) for (let bx = 0; bx + B <= W; bx += B) {
        let sum = 0;
        for (let y = by; y < by + B; y++) for (let x = bx; x < bx + B; x++) { const i = (y * W + x) * 4; sum += Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]); }
        worst = Math.max(worst, sum / (B * B * 3));
      }
      out.push(+worst.toFixed(1));
    }
    return out;
  });
  check(`미리 구운 지도 그림 5장이 지금 지도 모양과 같음 (가장 다른 칸의 색 차이 12 미만: ${diffs.join(' · ')})`, diffs.every(d => d < 12), JSON.stringify(diffs));
  await page.close();
}
{
  const page = await ctx.newPage();
  await page.route('**/assets/map/*.webp', r => r.abort());
  await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
  await page.evaluate(() => window.__jp.go('map'));
  check('미리 구운 지도 그림을 못 불러오면 숲 배경 + 길·소품을 그 자리에서 그림', await page.waitForFunction(() => !!document.querySelector('#mapWorld img.bg3d') && document.querySelectorAll('#mapWorld img.scene').length === 2, null, { timeout: 3000 }).then(() => true, () => false));
  await page.close();
}
console.log('3D 그림 파일 나누기 (첫 로딩 가볍게)');
{
  const fs = await import('node:fs');
  const core = fs.statSync(path.join(root, 'sprites3d.js')).size, scene = fs.statSync(path.join(root, 'sprites3d-scene.js')).size;
  check(`처음 받는 그림 파일 ${(core / 1024).toFixed(0)}KB < 800KB, 소품 파일 ${(scene / 1024).toFixed(0)}KB 따로`, core < 800 * 1024 && scene > 100 * 1024);
  const page = await ctx.newPage();
  const order = []; page.on('request', r => { const m = /(sprites3d[\w-]*\.js|title\.webp)/.exec(r.url()); if (m) order.push(m[1]); });
  await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
  const first = await page.evaluate(() => ({ scene: !!window.JELLY3D_SCENE, house: Object.keys(JELLY3D_SPRITES).some(k => k.startsWith('house|')), cookie: Object.keys(JELLY3D_SPRITES).some(k => k.startsWith('cookie|')) }));
  check('첫 화면에는 게임 그림만 (집 같은 소품 없음, 쿠키 블록은 있음)', !first.house && first.cookie, JSON.stringify(first));
  check('첫 화면이 뜬 뒤 소품 그림 파일을 저절로 불러옴', await page.waitForFunction(() => window.JELLY3D_SCENE === true && Object.keys(JELLY3D_SPRITES).some(k => k.startsWith('house|')), null, { timeout: 5000 }).then(() => true, () => false));
  check('소품 파일은 타이틀 그림보다 나중에 요청', order.indexOf('sprites3d-scene.js') > order.indexOf('title.webp') && order.indexOf('title.webp') >= 0, order.join(','));
  await page.close();
}
{
  // 소품 파일이 늦게 와도: 프롤로그는 기다렸다가 3D 소품으로, 못 오면 구미 그림으로
  const page = await ctx.newPage();
  let release; const gate = new Promise(r => { release = r; });
  await page.route('**/sprites3d-scene.js', async r => { await gate; await r.continue(); });
  await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
  await page.evaluate(() => { window.__jp.go('title'); document.getElementById('storyBtn').click(); });
  const waiting = await page.evaluate(() => document.getElementById('intro').hidden);
  release();
  const shown = await page.waitForFunction(() => !document.getElementById('intro').hidden && !!document.querySelector('#slides .scene'), null, { timeout: 5000 }).then(() => true, () => false);
  check('소품 파일이 오기 전에는 프롤로그를 기다렸다가, 오면 바로 보여 줌', waiting && shown);
  await page.close();
  const page2 = await ctx.newPage(); const errs = []; page2.on('pageerror', e => errs.push(e.message));
  await page2.route('**/sprites3d-scene.js', r => r.abort());
  await page2.goto(pathToFileURL(path.join(root, 'index.html')).href);
  await page2.evaluate(() => { window.__jp.go('title'); document.getElementById('storyBtn').click(); });
  check('소품 파일을 못 불러와도 프롤로그가 뜸 (소품만 구미 그림)', await page2.waitForFunction(() => !document.getElementById('intro').hidden, null, { timeout: 5000 }).then(() => true, () => false) && errs.length === 0, errs.join(' | '));
  await page2.close();
}
console.log('숲 배경 그림을 못 불러올 때 (판 풍경으로 대체)');
{
  const page = await ctx.newPage();
  await page.route('**/assets/bg/*.webp', r => r.abort());
  await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
  await page.evaluate(() => { window.__miss = new Set(); const b = Jelly3D.bake; Jelly3D.bake = (k, o = {}, px) => { const u = b(k, o, px); if (!u) __miss.add([k, o.color, o.mood || 'happy', o.ears ? 1 : 0].join('|')); return u; }; });
  await page.evaluate(() => Jelly3D.scene());
  for (let n = 1; n <= 30; n++) { await page.evaluate(n => window.__jp.startStage(n), n); await page.waitForFunction(() => Gummy.pending() === 0, null, { timeout: 15000 }); }
  const miss = await page.evaluate(() => [...__miss]);
  check('판 풍경의 집·나무·버섯도 3D 그림이 모두 있음', miss.length === 0, miss.join(', '));
  await page.close();
}
console.log('3D 끔 (?3d=0)');
{
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(pageOff);
  check('?3d=0 이면 3D 꺼짐', await page.evaluate(() => Jelly3D.ok() === false));
  check('꺼지면 기존 구미 SVG 그림', await page.evaluate(() => !Gummy.jelly(0, 0, 20, '#ff5f8a', {}).includes('<image')));
  await page.evaluate(() => window.__jp.startStage(1)); await page.waitForTimeout(300);
  check('꺼지면 지도에도 3D 숲 배경 없음', await page.evaluate(() => { window.__jp.go('map'); return !document.querySelector('#mapWorld img.bg3d') && !document.querySelector('#mapWorld img[src*="assets/map"]'); }));
  check('꺼지면 판 바깥 숲 배경도 안 씀', await page.evaluate(() => !document.getElementById('play').classList.contains('f3d')));
  check('콘솔 에러 없음', errors.length === 0, errors.join(' | '));
}
await browser.close();
console.log(`\n결과: 통과 ${pass} / 실패 ${fail}`);
process.exit(fail ? 1 : 0);
