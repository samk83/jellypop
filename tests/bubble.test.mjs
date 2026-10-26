// 젤리팝 v0.2 버블 슈터 자동 테스트: node tests/bubble.test.mjs
// 휴대폰 3기종 + PC 화면에서 실제 브라우저로 열어 docs/SPEC.md 수락기준을 확인한다.
import { chromium, devices } from 'playwright';
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

// 자동 플레이: 각도를 촘촘히 바꿔 가며 가장 좋은 한 발을 고른다 (대포 속 친구와 맨 앞 친구 둘 다 따져 봄)
function botPlay(stageNo) {
  const j = window.__jp;
  j.startStage(stageNo);
  const G0 = () => j.G;
  let guard = 0;
  while (G0().state === 'aim' && guard++ < 200) {
    const G = G0();
    let best = null;
    const colors = G.queue.length > 1 ? [0, 1] : [0];
    for (const qi of colors) {
      for (let a = -Math.PI + 0.17; a <= -0.17; a += 0.012) {
        const r = j.evalShot(a, G.queue[qi]);
        if (!r) continue;
        let s = r.friends * 100000 + (r.popped + r.dropped) * 100 + r.dropped * 50;
        if (!r.popped) s = -r.lowest;                          // 못 터뜨리면 판을 낮게 만들지 않는 곳
        if (r.lowest + j.R > j.DEADLINE) s -= 1e7;             // 바닥 선 넘기기는 피함
        if (qi === 1) s -= 1;
        if (!best || s > best.s) best = { s, a, qi };
      }
    }
    if (best.qi === 1) j.swapQueue();
    j.setAngle(best.a);
    j.shoot();
    j.advance();
  }
  const G = G0();
  return { win: !!(G.outcome && G.outcome.win), reason: G.outcome && G.outcome.reason, fired: G.fired, shots: G.st.shots, stars: G.outcome && G.outcome.stars };
}

// 1) 규칙
{
  console.log('규칙');
  const page = await browser.newPage();
  await page.goto(url + '?seed=7');
  const r = await page.evaluate(() => {
    const { Board } = window.__jp;
    const b = Board.fromRows(['rrby', 'gYb'], 10);
    const out = {};
    out.cols = [Board.cols(b, 0), Board.cols(b, 1)].join(',');
    out.friends = b.friendCount;
    out.group = Board.group(b, 0, 0).length;                           // 빨강 2개
    out.nbEven = Board.neighbors(b, 1, 0).length;                       // 홀수 줄 맨 왼쪽
    // 빨강 2개 옆(1,0 은 초록) → 0번 줄 빈칸이 아니라 2번 줄에 놓아서 3개 만들기
    const b2 = Board.fromRows(['rr........'], 10);
    const p = Board.place(b2, 0, 2, 'r');
    out.pop3 = p.popped.length;
    out.empty = Board.count(b2);
    // 떨어뜨리기: 천장 거품(빨강 2) 아래 매달린 파랑·친구 → 빨강 터지면 같이 떨어짐
    const b3 = Board.fromRows(['rr', 'bY', '.b'], 10);
    const before = Board.count(b3);
    const s = Board.snap(b3, Board.pos(b3, 0, 2).x, Board.pos(b3, 0, 2).y);
    const p3 = Board.place(b3, s[0], s[1], 'r');
    out.snap = s.join(',');
    out.drop = p3.dropped.length;
    out.dropFriend = p3.dropped.some(d => d.cell.friend !== undefined);
    out.before = before; out.after = Board.count(b3);
    // 2개만 붙으면 안 터짐
    const b4 = Board.fromRows(['r.b'], 10);
    out.noPop = Board.place(b4, 0, 1, 'r').popped.length;
    // 벽 튕김: 아주 옆으로 쏘면 길이 벽에서 꺾인다
    const tr = Board.trace(Board.fromRows(['rrrrrrrrrr'], 10), -0.3);
    out.bounce = tr.pts.some(q => q.x <= 20) || tr.pts.some(q => q.x >= 340);
    out.bounceBack = tr.x < 340;
    return out;
  });
  check('짝수 줄 10칸, 홀수 줄 9칸', r.cols === '10,9', r.cols);
  check('대문자 = 친구가 갇힌 거품으로 읽음', r.friends === 1);
  check('붙어 있는 같은 색 묶음 찾기', r.group === 2, r.group);
  check('홀수 줄 이웃 계산', r.nbEven === 5, r.nbEven);
  check('같은 색 3개가 되면 터짐', r.pop3 === 3 && r.empty === 0, `${r.pop3}/${r.empty}`);
  check('2개만 붙으면 안 터짐', r.noPop === 0);
  check('쏜 거품이 가까운 빈칸에 붙음', r.snap === '0,2', r.snap);
  check('천장과 끊긴 거품은 떨어지고, 갇힌 친구도 함께 구출', r.drop === 3 && r.dropFriend && r.after === 0, `${r.drop} ${r.after}`);
  check('조준 길이 벽에 맞으면 튕김', r.bounce && r.bounceBack);
  await page.close();
}

// 2) 휴대폰 화면 (프롤로그·지도·조준·줄 선 친구들)
for (const [label, dev] of [['iPhone SE (320x568)', devices['iPhone SE']], ['Galaxy S8 (360x740)', devices['Galaxy S8']], ['iPhone 13 (390x844)', devices['iPhone 13']]]) {
  console.log(label);
  const ctx = await browser.newContext({ ...dev, defaultBrowserType: undefined });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url + '?seed=5');
  await page.evaluate(() => window.__jp.reset());
  await page.reload();
  const tag = dev.viewport.width;
  await page.screenshot({ path: path.join(shots, `v2-01-title-${tag}.png`) });

  await page.tap('#startBtn');
  check('처음 시작하면 프롤로그가 나옴', await page.isVisible('#intro'));
  let n = 0;
  while (await page.isVisible('#nextSlide') && n < 6) { if (n === 1) await page.screenshot({ path: path.join(shots, `v2-02-intro-${tag}.png`) }); await page.tap('#nextSlide'); n++; }
  check('프롤로그 4컷을 끝까지 보면 지도로 감', n === 4 && await page.isVisible('#map'), n);

  const map = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('.node')];
    return { count: nodes.length, open: nodes.filter(b => !b.disabled).map(b => b.dataset.stage).join(','), walker: !!document.querySelector('.walker'), path: !!document.querySelector('#mapPath path') };
  });
  check('지도에 스테이지 6칸과 길, 말랑이', map.count === 6 && map.path && map.walker, JSON.stringify(map));
  check('처음에는 1번만 열려 있고 나머지는 잠김', map.open === '1', map.open);
  await page.screenshot({ path: path.join(shots, `v2-03-map-${tag}.png`) });

  await page.reload();
  await page.tap('#startBtn');
  check('두 번째부터는 프롤로그 없이 바로 지도', await page.isVisible('#map') && !(await page.isVisible('#intro')));

  await page.tap('.node[data-stage="1"]');
  await page.waitForTimeout(300);
  check('스테이지 1 플레이 화면', await page.isVisible('#play'));

  const lay = await page.evaluate(() => {
    const small = [...document.querySelectorAll('#play button')].filter(b => b.offsetParent !== null).filter(b => { const r = b.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).map(b => b.id);
    const c = document.getElementById('canvas').getBoundingClientRect();
    return { scrollX: document.documentElement.scrollWidth > innerWidth, small, inView: c.bottom <= innerHeight + 1 && c.right <= innerWidth + 1 && c.width > 250 };
  });
  check('가로 스크롤 없음, 게임 판이 화면 안에 다 보임', !lay.scrollX && lay.inView, JSON.stringify(lay));
  check('버튼은 모두 44px 이상', lay.small.length === 0, lay.small.join(','));

  // 발사 수 제한 없음: 대포 속 친구 + 다음 친구 3명만 보이고, 위쪽에 배너와 천장 하강 시간 게이지
  await page.waitForTimeout(100);
  const q = await page.evaluate(() => { const G = window.__jp.G; return { shown: G.lineShown, len: G.queue.length, first: G.queue[0], second: G.queue[1], banner: getComputedStyle(document.getElementById('banner')).display !== 'none' && document.getElementById('bannerTitle').textContent, tall: innerHeight >= 700, gauge: document.getElementById('tlbl').textContent }; });
  check('대포 속 친구 1 + 다음 친구 3명 표시 (발사 수 제한 없음)', q.shown && q.shown.cannon === 1 && q.shown.line === 3 && q.len === 6, JSON.stringify(q));
  check('위쪽 배너(banner.js 내용)는 큰 화면에서만 보이고, 시간 게이지는 항상 보임', (q.tall ? !!q.banner : q.banner === false) && /\d+초/.test(q.gauge), JSON.stringify(q));

  // 화면 좌표 계산 (게임 판 논리 좌표 → 화면)
  const toScreen = async (x, y) => page.evaluate(([x, y]) => { const r = document.getElementById('canvas').getBoundingClientRect(); return [r.left + x * r.width / 360, r.top + y * r.height / 620]; }, [x, y]);
  // 맨 앞 친구 누르기 → 대포 속 친구와 순서 바꿈
  const [fx, fy] = await toScreen(214 + 22, 584);
  await page.touchscreen.tap(fx, fy);
  const sw = await page.evaluate(() => window.__jp.G.queue.slice(0, 2));
  check('맨 앞 친구를 누르면 대포 속 친구와 순서가 바뀜', sw[0] === q.second && sw[1] === q.first, sw.join(','));

  // 위쪽 판을 누르면 조준이 안 됨 (대포 근처만 터치)
  const top0 = await page.evaluate(() => ({ a: window.__jp.G.angle, left: window.__jp.G.fired }));
  const [tx, ty] = await toScreen(90, 200), [tx2, ty2] = await toScreen(300, 220);
  await page.mouse.move(tx, ty); await page.mouse.down(); await page.mouse.move(tx2, ty2, { steps: 5 }); await page.mouse.up();
  const top1 = await page.evaluate(() => ({ a: window.__jp.G.angle, left: window.__jp.G.fired, aiming: window.__jp.G.aiming }));
  check('위쪽 판을 눌러 끌면 조준·발사가 안 됨', top1.a === top0.a && top1.left === top0.left && !top1.aiming, JSON.stringify([top0, top1]));
  // 대포 근처를 좌우로 끌기: 대포·핸들이 돌고, 떼면 발사
  const before = await page.evaluate(() => ({ a: window.__jp.G.angle, crank: window.__jp.G.crank }));
  const [ax, ay] = await toScreen(110, 560);
  const [bx, by] = await toScreen(250, 556);
  await page.mouse.move(ax, ay); await page.mouse.down();
  await page.mouse.move((ax + bx) / 2, (ay + by) / 2, { steps: 5 });
  await page.mouse.move(bx, by, { steps: 5 });
  await page.waitForTimeout(80);
  const mid = await page.evaluate(() => ({ a: window.__jp.G.angle, crank: window.__jp.G.crank, aiming: window.__jp.G.aiming }));
  await page.screenshot({ path: path.join(shots, `v2-04-aim-${tag}.png`) });
  check('대포 근처를 좌우로 끄는 동안 대포가 돌고 말랑이 핸들이 돔', mid.aiming && Math.abs(mid.a - before.a) > 0.3 && Math.abs(mid.crank - before.crank) > 1, JSON.stringify(mid));
  await page.mouse.up();
  const shot = await page.evaluate(() => ({ fired: window.__jp.G.fired, state: window.__jp.G.state }));
  check('손을 떼면 발사 (쏜 거품 1)', shot.fired === 1 && shot.state !== 'aim', JSON.stringify(shot));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(shots, `v2-05-play-${tag}.png`) });

  // 대포를 잡고 위로 멀리 끌어 올려 떼면 발사 취소
  await page.evaluate(() => window.__jp.advance());
  const left0 = await page.evaluate(() => window.__jp.G.fired);
  const [cx, cy] = await toScreen(100, 560), [dx, dy] = await toScreen(100, 300);
  await page.mouse.move(cx, cy); await page.mouse.down(); await page.mouse.move(dx, dy, { steps: 5 }); await page.mouse.up();
  check('대포를 잡고 위로 끌어 올려 떼면 발사 취소', await page.evaluate(() => window.__jp.G.fired) === left0);
  check('캔버스를 누르면 키보드 포커스가 캔버스로', await page.evaluate(() => document.activeElement.id) === 'canvas');

  // 다른 화면들도 가로 스크롤·44px 확인 (지도·스티커 북·결과 창·타이틀·프롤로그)
  const layoutOf = () => page.evaluate(() => {
    const vis = [...document.querySelectorAll('button')].filter(b => b.offsetParent !== null && !b.closest('[hidden]'));
    const small = vis.filter(b => { const r = b.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).map(b => b.id || b.className);
    return { scrollX: document.documentElement.scrollWidth > innerWidth, small };
  });
  const bad = [];
  const checkScreen = async name => { const l = await layoutOf(); if (l.scrollX || l.small.length) bad.push(name + ':' + JSON.stringify(l)); };
  await page.evaluate(() => { const j = window.__jp; j.G.need = 99; j.lowerCeiling(12); });
  await page.waitForSelector('#result:not([hidden])', { timeout: 3000 });
  await checkScreen('result');
  await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
  const trapped = await page.evaluate(() => !!document.activeElement.closest('#result'));
  check('결과 창: Tab이 창 밖으로 안 나감', trapped);
  await page.keyboard.press('Escape');
  check('결과 창: Esc로 지도로', await page.isVisible('#map') && !(await page.isVisible('#result')));
  await checkScreen('map');
  await page.tap('#bookBtn2'); await checkScreen('book');
  await page.tap('#bookBack'); await page.tap('#mapHome'); await checkScreen('title');
  await page.tap('#storyBtn'); await checkScreen('intro');
  check('타이틀·프롤로그·지도·스티커 북·결과 창도 가로 스크롤 없음, 버튼 44px 이상', bad.length === 0, bad.join(' | '));
  check('콘솔 에러 없음', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

// 3) PC: 자동 플레이로 1~6 클리어, 결과·스티커·지도 이동·스티커 북·저장
{
  console.log('PC · 자동 플레이 (월드 1 전체)');
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url + '?seed=11');
  await page.evaluate(() => { window.__jp.reset(); window.__jp.P.seenIntro = true; });
  await page.screenshot({ path: path.join(shots, 'v2-01-title-desktop.png') });

  // 스테이지 1은 결과 창을 화면에서 직접 확인
  const s1 = await page.evaluate(botPlay, 1);
  console.log('     스테이지 1:', JSON.stringify(s1));
  await page.waitForSelector('#result:not([hidden])', { timeout: 4000 });
  const res = await page.evaluate(() => ({ title: document.getElementById('resultTitle').textContent, on: document.querySelectorAll('#resultStars .on').length, sticker: !!document.querySelector('#resultSticker .sticker'), msg: document.getElementById('resultMsg').textContent }));
  await page.screenshot({ path: path.join(shots, 'v2-06-clear-desktop.png') });
  check('친구를 구하면 클리어 창: 별 1~3개 + 친구 스티커', s1.win && res.title.includes('클리어') && res.on >= 1 && res.on <= 3 && res.sticker && res.msg.includes('몽실'), JSON.stringify(res));
  await page.click('#resultMain');
  // 처음 깬 스테이지면 이야기 컷신이 먼저 나온다 → 끝까지 넘기면 지도
  await page.waitForSelector('#story', { timeout: 2000 });
  const cs = await page.evaluate(() => ({ title: document.querySelector('#story .cs-chap b').textContent, map: !document.getElementById('map').hidden }));
  check('스테이지 1을 처음 깨면 "다음 스테이지로" 뒤에 이야기 컷신', cs.title === '첫 번째 친구' && !cs.map, JSON.stringify(cs));
  for (let i = 0; i < 12 && await page.$('#story'); i++) { await page.click('#csNext'); await page.waitForTimeout(60); }
  check('컷신을 끝까지 넘기면 사라짐', !(await page.$('#story')));
  await page.waitForTimeout(1100);
  const mv = await page.evaluate(() => {
    const w = document.querySelector('.walker'), n2 = document.querySelector('.node[data-stage="2"]');
    const a = w.getBoundingClientRect(), b = n2.getBoundingClientRect();
    return { near: Math.abs((a.left + a.width / 2) - (b.left + b.width / 2)) < 6, open: !n2.disabled, star: !!document.querySelector('.node[data-stage="1"] .st') };
  });
  await page.screenshot({ path: path.join(shots, 'v2-07-map-after-desktop.png') });
  check('지도로 가면 말랑이가 2번 칸으로 이동, 2번이 열리고 1번에 별', mv.near && mv.open && mv.star, JSON.stringify(mv));

  const results = [s1];
  for (let s = 2; s <= 6; s++) {
    const r = await page.evaluate(botPlay, s);
    console.log(`     스테이지 ${s}:`, JSON.stringify(r));
    results.push(r);
    if (s === 6) await page.screenshot({ path: path.join(shots, 'v2-08-boss-desktop.png') });
  }
  check('자동 플레이로 스테이지 1~6 모두 클리어', results.every(r => r.win), results.map(r => r.win ? 'O' : 'X' + r.reason).join(' '));

  const themes = await page.evaluate(() => new Set(window.__jp.STAGES.slice(0, 6).map(s => s.theme)).size);
  check('스테이지 6개 배경 테마가 모두 다름', themes === 6, themes);

  // 5스테이지 천장 내려옴
  const ceil = await page.evaluate(() => {
    // 앞 스테이지 자동 플레이가 난수를 얼마나 썼는지와 상관없게 난수를 다시 고정 (6발 전에 우연히 깨면 확인이 안 됨)
    const j = window.__jp; j.seedRandom(5); j.startStage(5); const y = j.G.b.y0;
    const sec = j.G.hz.cfg.dropSec; j.think(3); const idle = j.G.hz.dropT === sec; j.G.hz.started = true; j.think(sec - 1);
    const mid = j.G.b.y0; j.think(1.2);
    return { before: y, idle, mid, after: j.G.b.y0, sec, row: j.ROW_H, state: j.G.state };
  });
  check('5스테이지: 첫 발 전엔 시계가 멈춰 있고, 시간(12초)이 다 되면 천장이 딱 한 칸 내려옴', ceil.sec === 12 && ceil.idle && ceil.mid === ceil.before && Math.abs(ceil.after - ceil.before - ceil.row) < .01, JSON.stringify(ceil));
  // 6스테이지 보스 체력
  const boss = await page.evaluate(() => { const j = window.__jp; j.startStage(6); return { hp: j.G.bossHp, label: document.getElementById('hudGoalLabel').textContent }; });
  check('6스테이지: 보스 뭉치 체력 표시', boss.hp > 0 && boss.label === '보스 체력', JSON.stringify(boss));

  // 발사 수로는 실패하지 않음: 기준 발 수보다 많이 쏴도 계속 (별만 줄어듦)
  const many = await page.evaluate(() => {
    const j = window.__jp; j.startStage(1); j.G.need = 99; j.G.hz.cfg.dropSec = 1e9; j.G.hz.dropT = 1e9;
    for (let i = 0; i < j.G.st.shots + 5 && j.G.state === 'aim'; i++) { j.setAngle(-Math.PI / 2 + (i % 2 ? .9 : -.9)); j.shoot(); j.advance(); }
    return { fired: j.G.fired, par: j.G.st.shots, state: j.G.state, outcome: j.G.outcome && j.G.outcome.reason };
  });
  check('기준 발 수를 넘겨 쏴도 실패하지 않음 (발사 수 제한 없음)', many.fired > many.par || many.outcome === 'line', JSON.stringify(many));
  // 실패: 천장이 내려와 바닥 선을 넘음 → 실패 창
  const f1 = await page.evaluate(() => {
    const j = window.__jp; j.startStage(1); j.G.need = 99; j.lowerCeiling(12); return j.G.outcome;
  });
  await page.waitForSelector('#result:not([hidden])', { timeout: 3000 });
  const fr = await page.evaluate(() => ({ title: document.getElementById('resultTitle').textContent, main: document.getElementById('resultMain').textContent, sub: document.getElementById('resultSub').textContent }));
  await page.screenshot({ path: path.join(shots, 'v2-09-fail-desktop.png') });
  check('천장이 바닥 선까지 내려오면 실패 창 (다시 하기·지도로)', f1 && !f1.win && f1.reason === 'line' && fr.main === '다시 하기' && fr.sub === '지도로', JSON.stringify([f1, fr]));
  // 실패: 바닥 선
  const f2 = await page.evaluate(() => {
    const j = window.__jp; j.startStage(5); j.G.y0Target = 380; j.G.need = 99;
    j.setAngle(-Math.PI / 2); j.shoot(); j.advance(); return j.G.outcome;
  });
  check('거품이 바닥 선을 넘으면 실패', f2 && !f2.win && f2.reason === 'line', JSON.stringify(f2));
  await page.click('#resultSub');

  // 스티커 북
  await page.click('#bookBtn2');
  const book = await page.evaluate(() => ({ cells: document.querySelectorAll('.cell').length, got: document.querySelectorAll('.cell.got').length, stamp: !!document.querySelector('.stamp'), count: document.getElementById('bookCount').textContent }));
  await page.screenshot({ path: path.join(shots, 'v2-10-book-desktop.png') });
  check('스티커 북 30칸 중 받은 6칸만 채워짐 + 월드 1 스탬프', book.cells === 30 && book.got === 6 && book.stamp && book.count === '6 / 30', JSON.stringify(book));

  // 새로고침 후에도 진행 유지
  await page.reload();
  const kept = await page.evaluate(() => { const P = window.__jp.P; return { stars: P.stars.filter(Boolean).length, stickers: Object.keys(P.stickers).length }; });
  check('새로고침해도 깬 스테이지·별·스티커 유지', kept.stars === 6 && kept.stickers === 6, JSON.stringify(kept));

  // 키보드로도 조준·발사
  await page.click('#startBtn');
  await page.click('#mapPrev');   // 월드 1을 다 깨면 지도는 월드 2를 보여 줌 → ◀ 로 월드 1
  await page.click('.node[data-stage="1"]');
  await page.waitForTimeout(200);
  const a0 = await page.evaluate(() => window.__jp.G.angle);
  await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Space');
  const kb = await page.evaluate(() => ({ a: window.__jp.G.angle, fired: window.__jp.G.fired }));
  check('PC 키보드: 화살표로 조준, 스페이스로 발사', kb.a < a0 && kb.fired === 1, JSON.stringify(kb));
  check('콘솔 에러 없음', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

// 4) 난이도: 여러 시드로 자동 플레이 클리어율
{
  console.log('난이도 (시드 10개)');
  const page = await browser.newPage();
  const wins = [0, 0, 0, 0, 0, 0];
  for (let seed = 1; seed <= 10; seed++) {
    await page.goto(url + '?seed=' + seed);
    for (let s = 1; s <= 6; s++) if ((await page.evaluate(botPlay, s)).win) wins[s - 1]++;
  }
  console.log('     클리어 수:', wins.join(' '));
  check('자동 플레이 클리어율: 모든 스테이지 10판 중 7판 이상', wins.every(w => w >= 7), wins.join(','));
  await page.close();
}

await browser.close();
console.log(`\n결과: 통과 ${pass} / 실패 ${fail}`);
process.exit(fail ? 1 : 0);
