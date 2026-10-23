// 3D 그림(jelly3d.js) 자동 테스트: node tests/jelly3d.test.mjs
// 소프트웨어 GPU에서는 기본으로 꺼지므로 ?3d=1 로 강제로 켜고 확인한다.
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
await ctx.addInitScript(() => { try { localStorage.setItem('jellypop.progress', JSON.stringify({ seenIntro: true })); } catch (e) { /* noop */ } });

console.log('3D 그림 굽기');
{
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
  await page.goto(page3d);
  check('?3d=1 이면 3D 켜짐', await page.evaluate(() => Jelly3D.ok() === true));
  const r = await page.evaluate(async () => {
    const kinds = [['jelly', { color: '#ff7fae', mood: 'happy', ears: true }], ['jelly', { color: '#4fb4ff', mood: 'joy' }], ['jelly', { color: '#ffd23f', mood: 'worried' }],
      ['jelly', { color: '#a76bff', mood: 'angry' }], ['bubble', { color: '#5ed46a' }], ['bubble', { color: '#e6f2ff', mood: 'none' }],
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
    const again = Jelly3D.bake('jelly', { color: '#ff7fae', mood: 'happy', ears: true }, 96) === Jelly3D.bake('jelly', { color: '#ff7fae', mood: 'happy', ears: true }, 90);
    return { out, again, bad: Jelly3D.bake('jelly', { color: 'not-a-color' }, 96) };
  });
  r.out.forEach(o => check(`${o.k}: 그림이 나옴 (가운데는 칠해지고 모서리는 투명)`, o.ok && o.opaque > 0.05 && o.clear > 0.1 && o.corner === 0, JSON.stringify(o)));
  check('같은 요청은 다시 굽지 않고 저장된 그림 재사용', r.again);
  check('잘못된 색이면 null (SVG 그림으로 대체)', r.bad === null);
  check('Art.jelly 가 3D 그림(<image>)을 씀', await page.evaluate(() => Gummy.jelly(0, 0, 20, '#ff7fae', {}).includes('<image')));
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
  await page.evaluate(() => window.__jp.startStage(1)); await page.waitForTimeout(600);
  check('플레이 캔버스에 숲 배경이 그려짐', await page.evaluate(() => { const c = document.getElementById('canvas'), g = c.getContext('2d'); const d = g.getImageData(Math.floor(c.width * 0.85), Math.floor(c.height * 0.9), 1, 1).data; return d[1] > d[0] && d[1] > d[2]; }));
  // 타이틀 숲 그림을 못 불러오면 예전 풍경으로
  await page.evaluate(() => { window.__jp.go('title'); document.querySelector('#titleArt img').dispatchEvent(new Event('error')); });
  check('타이틀 그림 실패 → 구미 풍경으로 대체', await page.evaluate(() => !document.getElementById('title').classList.contains('f3d') && !!document.querySelector('#titleArt img').src.startsWith('data:image/svg')));
  check('콘솔 에러 없음', errors.length === 0, errors.slice(0, 3).join(' | '));
  await page.close();
}
console.log('3D 끔 (?3d=0)');
{
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(pageOff);
  check('?3d=0 이면 3D 꺼짐', await page.evaluate(() => Jelly3D.ok() === false));
  check('꺼지면 기존 구미 SVG 그림', await page.evaluate(() => !Gummy.jelly(0, 0, 20, '#ff7fae', {}).includes('<image')));
  await page.evaluate(() => window.__jp.startStage(1)); await page.waitForTimeout(300);
  check('꺼지면 판 바깥 숲 배경도 안 씀', await page.evaluate(() => !document.getElementById('play').classList.contains('f3d')));
  check('콘솔 에러 없음', errors.length === 0, errors.join(' | '));
}
await browser.close();
console.log(`\n결과: 통과 ${pass} / 실패 ${fail}`);
process.exit(fail ? 1 : 0);
