// 젤리팝 이야기 컷신 · 친구 구출 연출 자동 테스트: node tests/story.test.mjs
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const url = pathToFileURL(path.join(root, 'index.html')).href;
const shots = path.join(root, 'design', 'screens');
fs.mkdirSync(shots, { recursive: true });
let pass = 0, fail = 0;
function check(name, ok, info = '') {
  if (ok) { pass++; console.log('  ✅ ' + name); } else { fail++; console.log('  ❌ ' + name + ' ' + info); }
}
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});

// 1) 이야기 데이터
{
  console.log('이야기 데이터');
  const page = await browser.newPage();
  await page.goto(url);
  const d = await page.evaluate(() => {
    const S = window.JellyStoryData, ST = window.__jp.STAGES, bad = [];
    const who = ['mal', 'f', 'f2', 'f3', 'boss', 'nonom', 'nom', 'all', null];
    S.forEach(s => {
      const st = ST[s.id - 1];
      if (!s.title || !s.lines.length) bad.push(s.id + ':빈 줄');
      s.lines.forEach(([w, t]) => { if (!who.includes(w) || !t) bad.push(s.id + ':' + w); });
      if (s.lines.some(l => l[0] === 'boss') && !st.boss) bad.push(s.id + ':보스 없음');
      if (s.lines.some(l => l[0] === 'f2') && !st.friends[1]) bad.push(s.id + ':f2 없음');
      if (s.lines.some(l => l[0] === 'f3') && !st.friends[2]) bad.push(s.id + ':f3 없음');
    });
    return { n: S.length, ids: S.map(s => s.id).join(','), bad, pieces: S.filter(s => s.piece).map(s => s.id + '-' + s.piece).join(' '), bosses: ST.filter(s => s.boss).map(s => s.id).join(',') };
  });
  check('스테이지 30개 모두 이야기가 있음 (1~30)', d.n === 30 && d.ids === Array.from({ length: 30 }, (_, i) => i + 1).join(','), d.ids);
  check('대사 말하는 이가 모두 그 스테이지에 있는 캐릭터', d.bad.length === 0, d.bad.join(' '));
  check('초대장 조각 4개 = 보스 6·12·18·24', d.pieces === '6-1 12-2 18-3 24-4', d.pieces);
  await page.close();
}

// 2) 30개 컷신을 휴대폰·PC 화면에서 모두 열고 끝까지 넘김
for (const [tag, vp] of [['390', { width: 390, height: 844 }], ['360x640', { width: 360, height: 640 }], ['pc', { width: 1280, height: 800 }]]) {
  console.log('컷신 30개 · ' + tag);
  const page = await browser.newPage({ viewport: vp });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url);
  const bad = [], slow = [];
  for (let id = 1; id <= 30; id++) {
    const t = await page.evaluate(id => { const t0 = performance.now(); window.__done = false; window.JellyStory.open(id, () => { window.__done = true; }); return performance.now() - t0; }, id);
    if (t > 150) slow.push(id + ':' + Math.round(t));
    await page.waitForTimeout(tag === '390' ? 1300 : 120);
    const lay = await page.evaluate(() => {
      const box = document.getElementById('csBox').getBoundingClientRect(), mal = document.querySelector('#story [data-k="mal"] img').getBoundingClientRect();
      const small = [...document.querySelectorAll('#story button')].filter(b => { const r = b.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).length;
      return { malAbove: mal.bottom - mal.height * .15 <= box.top + 2, malIn: mal.top >= 0, scrollX: document.documentElement.scrollWidth > innerWidth, small, n: document.querySelectorAll('#story .cs-dots i').length };
    });
    if (!lay.malAbove || !lay.malIn || lay.scrollX || lay.small) bad.push(id + JSON.stringify(lay));
    if (tag === '390' && [1, 6, 24, 30].includes(id)) await page.screenshot({ path: path.join(shots, `v7-story-${id}-${tag}.png`) });
    for (let i = 0; i < lay.n * 2 + 2 && await page.$('#story'); i++) await page.click('#csNext');
    if (await page.$('#story') || !(await page.evaluate(() => window.__done))) bad.push(id + ':안 닫힘');
  }
  check(`(${tag}) 30개 컷신: 말랑이가 대사 상자에 안 가리고, 가로 스크롤 없고, 버튼 44px 이상, 끝까지 넘기면 닫힘`, bad.length === 0, bad.join(' | '));
  check(`(${tag}) 컷신 여는 시간 150ms 이하`, slow.length === 0, slow.join(' '));
  check(`(${tag}) 콘솔 에러 없음`, errors.length === 0, errors.join(' | '));
  await page.close();
}

// 3) 줄마다 일어나는 일: 보스는 어질어질 → 굴러가고 종이 조각이 떨어짐, 24 초대장, 30 파티
{
  console.log('컷신 장면 진행');
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(url);
  const r = await page.evaluate(async () => {
    const S = window.JellyStory, q = s => document.querySelector('#story ' + s), next = () => document.getElementById('csNext').click(), wait = ms => new Promise(r => setTimeout(r, ms));
    const out = {};
    S.open(6, () => {}); await wait(50);
    out.dizzy = q('[data-k="boss"]').classList.contains('dizzy') && q('[data-k="piece"]').classList.contains('hide');
    next(); next(); await wait(1700);   // 1줄째: 글자 다 보이기 → 다음 줄
    out.gone = q('[data-k="boss"]').classList.contains('gone') && q('[data-k="piece"]').classList.contains('fall') && !!q('.cs-pieces i.on');
    out.who = document.getElementById('csWho').className.includes('none');
    S.close();
    S.open(24, () => {}); await wait(50);
    for (let i = 0; i < 4; i++) { next(); await wait(20); }
    out.card = !q('#csCard').classList.contains('hide') && q('#csCard').textContent.replace(/\s+/g, ' ').includes('노놈의 생일 파티에 와 줄래?');
    S.close();
    S.open(30, () => {}); await wait(50);
    out.sad = q('[data-k="hat"]').classList.contains('hide') && q('[data-k="confetti"]').classList.contains('hide');
    for (let i = 0; i < 6; i++) { next(); await wait(20); }   // 한 번 누르면 글자 다 보이기, 한 번 더 누르면 다음 줄 → 4번째 줄 "생일 축하해"
    const crowd = window.__jp.STAGES.slice(0, 29).flatMap(s => s.friends).length;
    out.party = !q('[data-k="hat"]').classList.contains('hide') && !q('[data-k="confetti"]').classList.contains('hide') && document.querySelectorAll('#story .crowd.dance').length === crowd;
    for (let i = 0; i < 2; i++) { next(); await wait(20); }
    out.last = document.getElementById('csNext').textContent;
    S.close();
    S.open(11, () => {}); await wait(50); next(); next(); await wait(30);
    out.peek = q('[data-k="peek"]').classList.contains('fly');
    // 키보드: Esc = 건너뛰기
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await wait(20);
    out.esc = !document.getElementById('story');
    return out;
  });
  check('보스 컷신: 처음엔 보스가 어질어질, 다음 줄에 굴러가고 종이 조각이 떨어지며 조각 칸이 켜짐', r.dizzy && r.gone, JSON.stringify(r));
  check('해설 줄은 이름표 없음', r.who);
  check('24 컷신: 네 조각이 "노놈의 생일 파티에 와 줄래?" 초대장이 됨', r.card);
  check('30 엔딩: 울던 노놈 → 고깔모자·색종이·구한 친구 모두 춤, 마지막 버튼 "끝!"', r.sad && r.party && r.last === '끝!', JSON.stringify(r));
  check('11 컷신: 노놈이 하늘로 휙 지나감', r.peek);
  check('Esc로 컷신 건너뛰기', r.esc);
  await page.close();
}

// 4) 게임 흐름: 처음 깰 때만 컷신, 다시 깨면 바로 지도 / 친구가 통통 → 데굴데굴 → 말랑이 옆
{
  console.log('게임 흐름 · 구출 연출');
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url + '?seed=5');
  const clear = async () => page.evaluate(async () => {
    const j = window.__jp; j.startStage(1); j.closeCard();
    const G = j.G; let ok = false;
    // 친구 거품을 바로 맞힐 수 있는 각도 찾기 (없으면 친구를 강제로 구출)
    for (let a = -2.9; a < -0.2 && !ok; a += 0.01) { const r = j.evalShot(a); if (r && r.friends) { j.setAngle(a); ok = true; } }
    if (ok) { j.shoot(); j.advance(); } else { G.need = 1; j.rescue(0, { x: 280, y: 120 }); j.shoot(); j.advance(); }
    const phases = new Set(); const t0 = performance.now();
    while (performance.now() - t0 < 3200 && document.getElementById('result').hidden) { G.rescues.forEach(r => phases.add(r.phase)); await new Promise(r => setTimeout(r, 30)); }
    const r0 = G.rescues[0];
    return { win: G.outcome && G.outcome.win, phases: [...phases].join(','), stay: r0 && r0.phase, x: r0 && Math.round(r0.x), bounces: r0 && r0.bounces, shown: !document.getElementById('result').hidden, waited: Math.round(performance.now() - t0) };
  });
  await page.evaluate(() => { window.__jp.reset(); window.__jp.P.seenIntro = true; });
  const a = await clear();
  check('구출된 친구: 떨어져 땅에서 2번 통통 → 데굴데굴 → 폴짝 → 말랑이 옆에 섬', a.win && a.phases.includes('roll') && a.phases.includes('hop') && a.stay === 'stay' && a.bounces === 3 && Math.abs(a.x - 30) <= 1, JSON.stringify(a));
  check('결과 창은 친구가 말랑이 옆에 도착한 뒤 나옴', a.shown && a.stay === 'stay', JSON.stringify(a));
  await page.screenshot({ path: path.join(shots, 'v7-rescue-landed-390.png') });
  await page.click('#resultMain');
  check('처음 깨면 컷신', !!(await page.$('#story')));
  await page.click('#csSkip');
  check('건너뛰기 → 지도', await page.isVisible('#map') && !(await page.$('#story')));
  const seen = await page.evaluate(() => JSON.parse(localStorage.getItem('jellypop2.progress')).seenStory);
  check('본 컷신은 저장됨', seen && seen[1] === true, JSON.stringify(seen));
  const b = await clear();
  await page.click('#resultMain');
  check('이미 본 스테이지를 다시 깨면 컷신 없이 바로 지도', b.win && !(await page.$('#story')) && await page.isVisible('#map'));
  // 결과 창에서 Esc로 나가도 처음 깬 이야기는 나옴 (스테이지 2)
  await page.evaluate(() => { window.__jp.P.seenStory = { 1: true }; window.__jp.save(); window.__jp.startStage(2); window.__jp.closeCard(); window.__jp.G.need = 1; window.__jp.rescue(0, { x: 200, y: 100 }); window.__jp.G.need = 1; });
  await page.evaluate(() => { const j = window.__jp; j.setAngle(-1.4); j.shoot(); j.advance(); });
  await page.waitForSelector('#result:not([hidden])', { timeout: 4000 });
  await page.waitForTimeout(200);   // 결과 창 버튼에 포커스가 간 뒤
  await page.keyboard.press('Escape');
  check('결과 창에서 Esc로 나가도 처음 깬 스테이지 이야기가 나옴', !!(await page.$('#story')));
  await page.click('#csSkip');

  const lose = await page.evaluate(async () => {
    const j = window.__jp; j.startStage(2); j.closeCard(); j.G.shotsLeft = 1; j.G.queue.length = 1; j.G.need = 99; j.setAngle(-1.2); j.shoot(); j.advance();
    const t0 = performance.now(); while (document.getElementById('result').hidden && performance.now() - t0 < 3000) await new Promise(r => setTimeout(r, 20));
    return Math.round(performance.now() - t0);
  });
  check('실패하면 결과 창이 예전처럼 빨리 나옴 (1초 이내)', lose < 1000, lose);
  check('콘솔 에러 없음', errors.length === 0, errors.join(' | '));
  await page.close();
}

// 5) 컷신 중 프레임 (가벼운지)
{
  console.log('성능');
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  await page.goto(url);
  const f = await page.evaluate(async () => {
    window.JellyStory.open(30, () => {});
    for (let i = 0; i < 6; i++) document.getElementById('csNext').click();
    const ts = []; let last = performance.now();
    await new Promise(res => { const step = now => { ts.push(now - last); last = now; if (ts.length < 120) requestAnimationFrame(step); else res(); }; requestAnimationFrame(step); });
    ts.sort((a, b) => a - b);
    return { median: Math.round(ts[60] * 10) / 10, p95: Math.round(ts[114] * 10) / 10 };
  });
  check('가장 무거운 엔딩 컷신(친구 29명 춤 + 색종이)도 프레임 중앙값 20ms 이하', f.median <= 20, JSON.stringify(f));
  console.log('     프레임', JSON.stringify(f));
  await page.close();
}

await browser.close();
console.log(`\n결과: ${pass} 통과, ${fail} 실패`);
process.exit(fail ? 1 : 0);
