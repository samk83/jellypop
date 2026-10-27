// 젤리팝 자동 테스트: node tests/game.test.mjs
// 휴대폰 화면(터치)과 PC 화면에서 실제 브라우저로 열어 확인한다.
import { chromium, devices } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const url = pathToFileURL(path.join(root, 'classic.html')).href;
const shots = path.join(root, 'design', 'screens');
fs.mkdirSync(shots, { recursive: true });

let pass = 0, fail = 0;
function check(name, ok, info = '') {
  if (ok) { pass++; console.log('  ✅ ' + name); } else { fail++; console.log('  ❌ ' + name + ' ' + info); }
}
const settle = page => page.waitForFunction(() => !window.__jelly.state.busy, null, { timeout: 5000 });

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});

// 1) 규칙(로직) 테스트
{
  console.log('규칙');
  const page = await browser.newPage();
  await page.goto(url);
  const r = await page.evaluate(() => {
    const { Logic, COLS, ROWS, BOMB } = window.__jelly;
    const mk = f => Array.from({ length: ROWS }, (_, r) => Array.from({ length: COLS }, (_, c) => ({ c: f(r, c) })));
    const checker = mk((r, c) => (r + c) % 2);           // 같은 색이 붙어 있지 않음
    const block = mk((r, c) => (r < 2 && c < 3) ? 0 : 1 + ((r + c) % 2) * 2); // 왼쪽 위 2x3 빨강 덩어리
    const bombGrid = mk((r, c) => (r + c) % 2); bombGrid[4][3].c = BOMB; bombGrid[5][4].c = BOMB;
    return {
      noMove: Logic.hasMove(checker),
      single: Logic.group(checker, 0, 0).length,
      group6: Logic.group(block, 0, 0).length,
      hasMove: Logic.hasMove(block),
      score2: Logic.score(2, false), score7: Logic.score(7, false), bomb9: Logic.score(9, true),
      chain: Logic.group(bombGrid, 4, 3).length,
      edgeBlast: Logic.blast(checker, 0, 0).length,
      stars: [Logic.stars(999, 1000), Logic.stars(1000, 1000), Logic.stars(1300, 1000), Logic.stars(1600, 1000)].join(','),
      lv: [1, 2, 3].map(l => Logic.levelConfig(l).target).join(','),
    };
  });
  check('같은 색이 안 붙어 있으면 움직일 수 없음으로 판단', r.noMove === false);
  check('외톨이 젤리는 1개짜리 묶음', r.single === 1);
  check('붙어 있는 같은 색 6개를 한 묶음으로 찾음', r.group6 === 6, r.group6);
  check('점수 공식: 2개=20, 7개=420, 폭탄 9칸=270', r.score2 === 20 && r.score7 === 420 && r.bomb9 === 270);
  check('폭탄이 옆 폭탄을 연쇄로 터뜨림 (3x3 두 개 = 14칸)', r.chain === 14, r.chain);
  check('모서리 폭탄은 판 밖을 건드리지 않음 (4칸)', r.edgeBlast === 4, r.edgeBlast);
  check('별 개수 0/1/2/3', r.stars === '0,1,2,3', r.stars);
  check('레벨이 오를수록 목표 점수 증가', r.lv === '1200,1600,2000', r.lv);
  await page.close();
}

// 2) 휴대폰 화면 테스트 (터치)
for (const [label, dev] of [['iPhone SE (320x568)', devices['iPhone SE']], ['Galaxy S8 (360x740)', devices['Galaxy S8']], ['iPhone 13 (390x844)', devices['iPhone 13']]]) {
  console.log(label);
  const ctx = await browser.newContext({ ...dev, defaultBrowserType: undefined });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url);
  const tag = label.split(' (')[0].replace(/\s/g, '-');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(shots, `01-title-${tag}.png`) });

  const play = await page.locator('#playBtn').boundingBox();
  check('플레이 버튼 터치 영역 44px 이상', play.height >= 44 && play.width >= 44);
  await page.tap('#playBtn');
  await settle(page);
  const hud = await page.evaluate(() => ({ moves: document.getElementById('moves').textContent, mode: window.__jelly.state.mode }));
  check('플레이를 누르면 게임 시작 (남은 터치 20)', hud.mode === 'play' && hud.moves === '20', JSON.stringify(hud));

  const layout = await page.evaluate(() => {
    const cv = document.getElementById('canvas').getBoundingClientRect();
    const btns = [...document.querySelectorAll('#app button')].map(b => b.getBoundingClientRect());
    return { sw: document.documentElement.scrollWidth, vw: innerWidth, vh: innerHeight, cv: { l: cv.left, r: cv.right, t: cv.top, b: cv.bottom, w: cv.width },
      minBtn: Math.min(...btns.map(b => Math.min(b.width, b.height))) };
  });
  check('가로 스크롤 없음', layout.sw <= layout.vw, `${layout.sw}>${layout.vw}`);
  check('젤리 판이 화면 안에 다 보임', layout.cv.l >= 0 && layout.cv.r <= layout.vw && layout.cv.t >= 0 && layout.cv.b <= layout.vh, JSON.stringify(layout.cv));
  check('젤리 한 칸이 44px 이상 (손가락으로 누르기 쉬움)', layout.cv.w / 7 >= 44, (layout.cv.w / 7).toFixed(1));
  check('상단 버튼 44px 이상', layout.minBtn >= 44, layout.minBtn);

  // 실제 화면 터치로 2개 이상 묶음 누르기
  const target = await page.evaluate(() => {
    const { grid, Logic, COLS, ROWS } = window.__jelly;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (Logic.group(grid, r, c).length >= 2) return { r, c, n: Logic.group(grid, r, c).length };
  });
  const cv = layout.cv, cellPx = cv.w / 7;
  await page.touchscreen.tap(cv.l + (target.c + .5) * cellPx, cv.t + (target.r + .5) * cellPx);
  await page.waitForTimeout(80);
  await page.screenshot({ path: path.join(shots, `02-pop-${tag}.png`) });
  await settle(page);
  const after = await page.evaluate(() => ({ moves: window.__jelly.state.moves, score: window.__jelly.state.score, full: window.__jelly.grid.every(row => row.every(Boolean)) }));
  check(`묶음 터치 → 터지고 점수 +${target.n * (target.n - 1) * 10}`, after.moves === 19 && after.score === target.n * (target.n - 1) * 10, JSON.stringify(after));
  check('터진 자리가 위에서 떨어진 젤리로 다시 채워짐', after.full);

  // 외톨이 젤리 터치는 무시
  const lone = await page.evaluate(() => {
    const { grid, Logic, COLS, ROWS } = window.__jelly;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c].c >= 0 && Logic.group(grid, r, c).length === 1) return { r, c };
  });
  if (lone) {
    await page.touchscreen.tap(cv.l + (lone.c + .5) * cellPx, cv.t + (lone.r + .5) * cellPx);
    await page.waitForTimeout(100);
    const m = await page.evaluate(() => window.__jelly.state.moves);
    check('외톨이 젤리 터치는 횟수를 쓰지 않음', m === 19, m);
  }

  // 끝까지 플레이 (가장 큰 묶음 고르기)
  for (let i = 0; i < 30; i++) {
    const done = await page.evaluate(() => {
      const j = window.__jelly; if (j.state.mode !== 'play') return true;
      let best = null, bn = 1;
      for (let r = 0; r < j.ROWS; r++) for (let c = 0; c < j.COLS; c++) {
        const n = j.grid[r][c].c === j.BOMB ? 99 : j.Logic.group(j.grid, r, c).length;
        if (n > bn) { bn = n; best = [r, c]; }
      }
      if (best) j.tap(best[0], best[1]);
      return false;
    });
    if (done) break;
    await settle(page);
  }
  await page.waitForSelector('#result:not(.hidden)', { timeout: 3000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(shots, `03-result-${tag}.png`) });
  const res = await page.evaluate(() => ({ title: document.getElementById('resultTitle').textContent, mode: window.__jelly.state.mode }));
  check('레벨이 끝나면 결과 화면이 나옴', res.mode === 'result' && res.title.length > 0, res.title);
  console.log('     결과: ' + res.title);
  await page.tap('#retryBtn');
  await settle(page);
  check('다시 하기 → 새 판 시작', await page.evaluate(() => window.__jelly.state.mode === 'play' && window.__jelly.state.moves === 20));
  check('오류(콘솔 에러) 없음', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

// 3) PC 화면 + 키보드
{
  console.log('PC (1280x800)');
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(url);
  await page.screenshot({ path: path.join(shots, '01-title-desktop.png') });
  await page.click('#playBtn');
  await settle(page);
  await page.screenshot({ path: path.join(shots, '02-play-desktop.png') });
  const before = await page.evaluate(() => window.__jelly.state.moves);
  await page.focus('#canvas');
  // 키보드 커서를 묶음이 있는 칸으로 옮긴 뒤 Enter
  const t = await page.evaluate(() => { const { grid, Logic, COLS, ROWS } = window.__jelly;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (Logic.group(grid, r, c).length >= 2) return { r, c }; });
  for (let i = 0; i < 9; i++) await page.keyboard.press('ArrowUp');
  for (let i = 0; i < 7; i++) await page.keyboard.press('ArrowLeft');
  for (let i = 0; i < t.r; i++) await page.keyboard.press('ArrowDown');
  for (let i = 0; i < t.c; i++) await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await settle(page);
  check('키보드(방향키+Enter)로도 플레이 가능', await page.evaluate(() => window.__jelly.state.moves) === before - 1);
  check('게임 중 숨은 시작/결과 화면 버튼에는 Tab 포커스가 가지 않음',
    await page.evaluate(() => [...document.querySelectorAll('.screen.hidden button')].every(b => getComputedStyle(b).visibility === 'hidden')));

  // 7개 이상 → 폭탄 생성 (판을 한 색으로 바꾼 뒤 터치)
  await page.evaluate(() => { const j = window.__jelly; j.startLevel(1); });
  await settle(page);
  const bomb = await page.evaluate(() => { const j = window.__jelly; j.grid.forEach(row => row.forEach(t => t.c = 0)); j.tap(8, 3); return j.grid[8][3].c === j.BOMB; });
  check('7개 이상 터뜨리면 그 자리에 폭탄 젤리가 생김', bomb);
  await settle(page);

  // 터치를 다 쓰면 실패 화면
  await page.evaluate(() => { const j = window.__jelly; j.startLevel(2); });
  await settle(page);
  await page.evaluate(() => { const j = window.__jelly; j.state.moves = 1;
    for (let r = 0; r < j.ROWS; r++) for (let c = 0; c < j.COLS; c++) if (j.grid[r][c].c >= 0 && j.Logic.group(j.grid, r, c).length === 2) { j.tap(r, c); return; } });
  await page.waitForSelector('#result:not(.hidden)', { timeout: 3000 });
  const lose = await page.evaluate(() => ({ t: document.getElementById('resultTitle').textContent, next: getComputedStyle(document.getElementById('nextBtn')).display, focus: document.activeElement.id }));
  check('터치를 다 쓰면 실패 화면 (다음 레벨 버튼 없음, 다시 도전에 포커스)', lose.t === '아쉬워요!' && lose.next === 'none' && lose.focus === 'retryBtn', JSON.stringify(lose));
  await page.screenshot({ path: path.join(shots, '04-fail-desktop.png') });

  // 결과가 뜨기 직전에 집 버튼 → 결과 화면이 나중에 덮이지 않음
  await page.evaluate(() => { const j = window.__jelly; j.startLevel(1); });
  await settle(page);
  await page.evaluate(() => { const j = window.__jelly; j.state.moves = 1;
    for (let r = 0; r < j.ROWS; r++) for (let c = 0; c < j.COLS; c++) if (j.grid[r][c].c >= 0 && j.Logic.group(j.grid, r, c).length >= 2) { j.tap(r, c); return; } });
  await settle(page);
  await page.click('#menuBtn', { force: true });
  await page.waitForTimeout(700);
  check('레벨 끝난 직후 집 버튼 → 결과 화면이 뒤늦게 덮이지 않음', await page.evaluate(() => document.getElementById('result').classList.contains('hidden')));

  // 섞기: 움직일 수 없는 판이면 자동으로 섞음
  await page.evaluate(() => { const j = window.__jelly; j.startLevel(1); });
  await settle(page);
  const shuffled = await page.evaluate(() => { const j = window.__jelly;
    j.grid.forEach((row, r) => row.forEach((t, c) => t.c = (r + c) % 2 ? 2 : 3)); j.grid[0][0].c = 0; j.grid[0][1].c = 0;
    j.tap(0, 0); return true; });
  await settle(page);
  await page.waitForTimeout(100);
  check('묶음이 하나도 없으면 자동으로 섞어서 계속할 수 있음', shuffled && await page.evaluate(() => window.__jelly.Logic.hasMove(window.__jelly.grid)));
  await page.close();
}

// 4) 난이도 점검: 레벨 1~3을 "가장 큰 묶음" 방식으로 50판씩
{
  console.log('난이도 (단순 전략 50판 클리어율)');
  const page = await browser.newPage();
  await page.goto(url);
  const rates = await page.evaluate(() => {
    const { Logic, COLS, ROWS, BOMB } = window.__jelly;
    function sim(lv) {
      const cfg = Logic.levelConfig(lv);
      const rnd = () => ({ c: Math.floor(Math.random() * cfg.colors) });
      let g = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, rnd)), score = 0;
      for (let m = 0; m < cfg.moves; m++) {
        if (!Logic.hasMove(g)) g = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, rnd));
        let best = null, bn = 1;
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const n = g[r][c].c === BOMB ? 99 : Logic.group(g, r, c).length; if (n > bn) { bn = n; best = [r, c]; } }
        const isB = g[best[0]][best[1]].c === BOMB, cells = Logic.group(g, best[0], best[1]);
        score += Logic.score(cells.length, isB);
        cells.forEach(([y, x]) => g[y][x] = null);
        if (!isB && cells.length >= 7) g[best[0]][best[1]] = { c: BOMB };
        for (let c = 0; c < COLS; c++) { const col = []; for (let r = ROWS - 1; r >= 0; r--) if (g[r][c]) col.push(g[r][c]);
          for (let r = ROWS - 1, i = 0; r >= 0; r--, i++) g[r][c] = col[i] || rnd(); }
        if (score >= cfg.target) return 1;
      }
      return 0;
    }
    return [1, 2, 3, 4, 5].map(lv => { let w = 0; for (let i = 0; i < 50; i++) w += sim(lv); return w * 2; });
  });
  rates.forEach((r, i) => console.log(`     레벨 ${i + 1}: ${r}%`));
  check('레벨 1은 쉽게 깰 수 있음 (클리어율 70% 이상)', rates[0] >= 70, rates[0]);
  check('레벨이 오를수록 어려워짐', rates[0] >= rates[2] && rates[2] >= rates[4], rates.join(','));
  await page.close();
}

await browser.close();
console.log(`\n결과: 통과 ${pass} / 실패 ${fail}`);
process.exit(fail ? 1 : 0);
