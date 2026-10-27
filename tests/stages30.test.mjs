// 젤리팝 30스테이지 · 방해 요소 자동 테스트: node tests/stages30.test.mjs
// docs/SPEC-stages-30.md 9장 수락기준을 실제 브라우저로 확인한다.
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
// file:// 로 열 때 숲 배경 그림(webp)을 캔버스 픽셀 검사에 쓸 수 있게 허용 (실제 웹 주소에서는 같은 출처라 필요 없음)
const browser = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), args: ['--allow-file-access-from-files'] });

// 자동 플레이 (bubble.test.mjs 와 같은 방식 + 설명 카드 닫기, 놈놈이 막으면 간지럼, 한 발마다 1.5초 생각)
function botPlay(stageNo) {
  const j = window.__jp;
  j.startStage(stageNo); j.closeCard();
  const G0 = () => j.G;
  let guard = 0;
  while (G0().state === 'aim' && guard++ < 200) {
    if (j.blocked()) j.swapQueue();
    j.think(1.5);
    if (G0().state !== 'aim') { j.advance(); continue; }
    const G = G0();
    let best = null;
    const colors = G.queue.length > 1 ? [0, 1] : [0];
    for (const qi of colors) {
      for (let a = -Math.PI + 0.17; a <= -0.17; a += 0.012) {
        const r = j.evalShot(a, G.queue[qi]);
        if (!r) continue;
        let s = r.friends * 100000 + (r.popped + r.dropped) * 100 + r.dropped * 50;
        if (!r.popped) s = -r.lowest;
        if (r.lowest + j.R > j.DEADLINE) s -= 1e7;
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
  return { win: !!(G.outcome && G.outcome.win), reason: G.outcome && G.outcome.reason, left: G.st.shots - G.fired };
}

// 1) 특수 거품 규칙 (판 함수 직접)
{
  console.log('특수 거품 규칙');
  const page = await browser.newPage();
  await page.goto(url + '?seed=7');
  const r = await page.evaluate(() => {
    const { Board } = window.__jp, out = {};
    // 끈적: 두 번 맞혀야 터짐
    let b = Board.fromRows(['rr........'], 10, ['s.........']);
    let p = Board.place(b, 0, 2, 'r');
    out.sticky1 = [p.popped.length, p.unstuck.length, Board.count(b)].join(',');
    Board.place(b, 0, 1, 'r');
    p = Board.place(b, 0, 2, 'r');
    out.sticky2 = p.popped.length;
    // 얼음: 짝이 안 되고, 옆이 터지면 녹음
    b = Board.fromRows(['rrbb......'], 10, ['..i.......']);
    p = Board.place(b, 0, 4, 'b');
    out.iceNoMatch = p.popped.length;
    p = Board.place(b, 1, 0, 'r');
    out.iceThaw = p.thawed.length === 1 && !b.rows[0][2].k;
    // 버섯: 터지면 옆 거품 색이 바뀜
    b = Board.fromRows(['rrb.......', '.y.......'], 10, ['.m........', '.........']);
    p = Board.place(b, 1, 0, 'r');
    out.mush = p.popped.length >= 3 && p.recolored.length >= 1;
    // 흔들 푸딩: 옆에 붙었는데 안 터지면 색이 바뀜
    b = Board.fromRows(['ry........'], 10, ['.u........'], 'rybgp');
    p = Board.place(b, 0, 2, 'b');
    out.pudding = p.wobbled.length === 1 && b.rows[0][1].c === 'b';
    // 수정: 아무 색과 짝
    b = Board.fromRows(['rx........'], 10, ['.c........']);
    p = Board.place(b, 0, 2, 'r');
    out.crystal = p.popped.length;
    // 쿠키: 안 터지지만 떨어짐
    b = Board.fromRows(['rr........', 'x........'], 10, ['..........', 'k........']);
    out.cookieColors = [...Board.colorsOnBoard(b)].join('');
    p = Board.place(b, 0, 2, 'r');
    out.cookieDrop = p.dropped.some(d => d.cell.solid);
    // 무지개 거품: 붙은 곳에서 가장 크게 이어지는 색
    b = Board.fromRows(['bbrr......', '.........'], 10);
    p = Board.place(b, 1, 1, 'w');
    out.rainbow = p.color + p.popped.length;
    // 선물·반딧불
    b = Board.fromRows(['ggg.......', 'bb.......'], 10, ['..........', 'gf.......']);
    p = Board.place(b, 1, 2, 'b');
    out.giftFly = [p.gifts, p.fireflies].join(',');
    // 컨베이어: 한 줄 돌리기
    b = Board.fromRows(['rybgprybgp'], 10); Board.shiftRow(b, 0, 1);
    out.shift = b.rows[0].map(c => c.c).join('');
    // 놈놈이 훔칠 수 있는 칸에 친구는 없음
    b = Board.fromRows(['rrrrRrrrrr', 'yyyyyyyyy'], 10);
    out.stealNoFriend = Board.stealable(b).every(([y, x]) => b.rows[y][x].friend === undefined);
    return out;
  });
  check('끈적 거품: 첫 번째는 시럽만 벗겨지고 남음', r.sticky1 === '2,1,1', r.sticky1);
  check('끈적 거품: 두 번째에 터짐', r.sticky2 >= 3, r.sticky2);
  check('얼음 거품: 같은 색이어도 짝이 안 됨', r.iceNoMatch === 0, r.iceNoMatch);
  check('얼음 거품: 옆이 터지면 녹음', r.iceThaw);
  check('버섯 거품: 터지면 옆 거품 색이 바뀜', r.mush);
  check('흔들 푸딩: 옆에 붙고 안 터지면 다음 색으로', r.pudding);
  check('수정 거품: 아무 색과 짝이 되어 함께 터짐', r.crystal === 3, r.crystal);
  check('쿠키 블록: 쏠 색에 안 들어가고, 떨어뜨리면 없어짐', r.cookieColors === 'r' && r.cookieDrop, r.cookieColors);
  check('무지개 거품: 가장 크게 이어지는 색으로 바뀌어 터짐', r.rainbow === 'b3' || r.rainbow === 'r3', r.rainbow);
  check('선물 상자·반딧불: 터지거나 떨어지면 알려 줌', r.giftFly === '1,1', r.giftFly);
  check('컨베이어: 줄이 한 칸 돌아감', r.shift === 'prybgprybg', r.shift);
  check('놈놈이 훔칠 수 있는 칸에 갇힌 친구는 없음', r.stealNoFriend);
  await page.close();
}

// 1-2) 폭탄 거품 · 랜덤 거품 (0.10.0)
{
  console.log('폭탄 거품 · 랜덤 거품');
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url + '?seed=11');
  await page.evaluate(() => { window.__jp.reset(); window.__jp.P.seenIntro = true; });
  const r = await page.evaluate(() => {
    const j = window.__jp, { Board } = j, out = {};
    const rows = ['rybgprybgp', 'ybgprybgp', 'gprybgpYrb', 'prybgpryb', 'ybgprybgpr'];
    // 폭탄: 쏜 거품이 닿으면 둘레가 색 상관없이 터짐, 갇힌 친구도 풀려남
    let b = Board.fromRows(rows, 10, ['..........', '.........', '..........', '.........', '.......z..']);
    out.bombColors = [...Board.colorsOnBoard(b)].sort().join('');
    out.bombNoMatch = Board.matches(b.rows[4][7], 'r');
    let p = Board.place(b, 5, 7, 'r');
    out.bombPop = p.popped.length; out.bombs = p.bombs;
    out.bombMixed = new Set(p.popped.map(q => q.cell.c)).size;
    out.bombFriend = [...p.popped, ...p.dropped].some(q => q.cell.friend !== undefined);
    // 폭탄 연쇄: 범위 안 다른 폭탄도 터짐
    b = Board.fromRows(rows, 10, ['..........', '.........', '....z.....', '.........', '....z.....']);
    p = Board.place(b, 5, 4, 'g');
    out.chain = p.bombs;
    // 폭탄을 쏘면 붙은 자리에서 터짐 (쿠키·시럽·얼음도 함께)
    b = Board.fromRows(rows, 10, ['..........', '.........', '..........', '.........', '..ksi.....']);
    p = Board.place(b, 5, 3, 'z');
    out.shotBomb = p.bombs === 1 && ['k', 's', 'i'].every(k => p.popped.some(q => q.cell.k === k));
    // 같은 색 3개로 폭탄을 묶어도 짝은 안 됨 (닿아야 터짐) → 떨어진 폭탄은 그냥 떨어짐
    b = Board.fromRows(['rr........', 'z........'], 10, ['..........', 'z........']);
    p = Board.place(b, 0, 2, 'r');
    out.bombDrop = p.bombs === 0 && p.dropped.some(q => q.cell.k === 'z');
    // 랜덤: 닿으면 터지며 효과 1개
    b = Board.fromRows(rows, 10, ['..........', '.........', '..........', '.........', '...q......']);
    out.qColors = [...Board.colorsOnBoard(b)].includes('q');
    p = Board.place(b, 5, 3, 'b');
    out.qHit = p.randoms.length === 1 && !b.rows[4][3];
    // 좋은 효과 60% · 나쁜 효과 40% (1000번 뽑기)
    j.seedRandom(3); let good = 0; const ids = new Set();
    for (let i = 0; i < 1000; i++) { const e = j.pickLucky(); ids.add(e.id); if (e.good) good++; }
    out.good = good; out.kinds = ids.size;
    // 효과 하나씩 실제 게임에 적용
    j.startStage(14); j.closeCard();
    const G = () => j.G, at = Board.pos(G().b, 3, 3), eff = id => j.LUCKY.find(e => e.id === id);
    j.applyLucky(eff('bomb'), at); out.effBomb = G().queue[0] === 'z';
    j.applyLucky(eff('rainbow'), at); out.effRainbow = G().queue[0] === 'w';
    j.applyLucky(eff('firefly'), at); out.effFly = G().hz.aimBoost === 3;
    G().hz.dropT = 2; j.applyLucky(eff('time'), at); out.effTime = G().hz.dropT === G().hz.cfg.dropSec;
    j.applyLucky(eff('fog'), at); out.effFog = !!G().hz.cloud;
    const y0 = G().y0Target; j.applyLucky(eff('ceil'), at); out.effCeil = G().y0Target > y0;
    const friendBefore = JSON.stringify(G().b.rows.flat().filter(c => c && c.friend !== undefined));
    j.applyLucky(eff('mix'), Board.pos(G().b, 2, 5));
    out.effMixFriend = JSON.stringify(G().b.rows.flat().filter(c => c && c.friend !== undefined)) === friendBefore;
    // 실제로 쏜 거품이 랜덤 거품에 붙으면 효과가 나옴 (14스테이지 맨 아래 줄 랜덤 바로 밑)
    j.startStage(14); j.closeCard(); G().lucky = [];
    const q = Board.pos(G().b, 7, 4);
    G().state = 'flying'; j.land({ x: q.x, y: q.y + j.ROW_H, c: 'r' });
    out.landLucky = G().lucky.length;
    // 쏜 폭탄 거품이 대포에서 날아가 터짐
    j.startStage(4); j.closeCard();
    G().queue[0] = 'z'; j.setAngle(-Math.PI / 2); j.shoot(); j.advance();
    out.flyBomb = G().score > 0;
    // 스테이지 배치 · 첫 등장 설명 카드 (월드 1인 4스테이지에서도)
    out.zAt = j.STAGES.filter(s => (s.kinds || []).join('').includes('z')).map(s => s.id).join(',');
    out.qAt = j.STAGES.filter(s => (s.kinds || []).join('').includes('q')).map(s => s.id).join(',');
    j.reset(); j.P.seenIntro = true; j.startStage(4);
    out.card4 = !document.getElementById('hzCard').hidden && document.getElementById('hzList').textContent.includes('폭탄 거품');
    j.closeCard(); j.startStage(4); out.card4again = document.getElementById('hzCard').hidden;
    j.startStage(14); out.card14 = document.getElementById('hzList').textContent.includes('랜덤 거품');
    // 보스 18·24·30은 거품 줄에 랜덤 거품을 섞어 던짐 (lucky 확률)
    out.luckyBoss = j.STAGES.filter(s => s.boss && s.boss.lucky).map(s => s.id).join(',');
    out.keys18 = j.keysOf(j.STAGES[17]).includes('q');
    j.startStage(18); j.closeCard(); G().st.boss.lucky = 1;
    let thrown = 0;
    for (let k = 0; k < 4; k++) { G().shotCount = 5 * (k + 1); j.hazardsAfterShot(); thrown += G().b.rows[0].filter(c => c && c.k === 'q').length; }
    j.STAGES[17].boss.lucky = .5;
    out.thrown = thrown;
    // 폭발 소리: 소리를 켠 상태에서 연쇄 3까지 에러 없이 남
    let boomOk = false; try { j.unlockAudio(); if (j.audioReady()) { j.boom(1); j.boom(3); boomOk = true; } } catch (e) { boomOk = String(e); }   // sfx 의 try 를 거치지 않고 직접
    out.boomOk = boomOk;
    return out;
  });
  check('보스 18·24·30만 랜덤 거품을 섞어 던지고, 18에서 설명 카드 대상', r.luckyBoss === '18,24,30' && r.keys18, r.luckyBoss);
  check('보스가 던지는 줄마다 랜덤 거품 1개 (확률 100%로 4번 → 4개)', r.thrown === 4, r.thrown);
  check('폭발 전용 효과음이 에러 없이 남 (연쇄면 여러 번)', r.boomOk === true, r.boomOk);
  check('폭탄·랜덤 거품은 쏠 색에 들어가지 않고 짝도 안 됨', !r.bombColors.includes('z') && !r.bombNoMatch && !r.qColors, r.bombColors);
  check('폭탄: 닿으면 둘레 거품이 색 상관없이 터짐(1.8칸 안, 맨 아래 줄 폭탄이면 9개)', r.bombs === 1 && r.bombPop >= 9 && r.bombMixed >= 4, r.bombPop + '/' + r.bombMixed);
  check('폭탄: 범위 안 갇힌 친구는 풀려남', r.bombFriend);
  check('폭탄: 범위 안 다른 폭탄은 연쇄로 터짐', r.chain === 2, r.chain);
  check('폭탄을 쏘면 붙은 자리에서 터짐 (쿠키·시럽·얼음도)', r.shotBomb);
  check('폭탄: 닿지 않고 떨어지면 그냥 떨어짐', r.bombDrop);
  check('랜덤: 쏜 거품이 닿으면 터지고 효과 1개', r.qHit);
  check('랜덤: 좋은 효과 약 60% (1000번 중 550~650), 7종 모두 나옴', r.good >= 550 && r.good <= 650 && r.kinds === 7, r.good + ',' + r.kinds);
  check('랜덤 효과: 폭탄·무지개·반딧불·시간 충전', r.effBomb && r.effRainbow && r.effFly && r.effTime, JSON.stringify(r));
  check('랜덤 효과: 안개·천장 한 칸', r.effFog && r.effCeil);
  check('랜덤 효과: 색 섞기는 갇힌 친구를 건드리지 않음', r.effMixFriend);
  check('게임 중 랜덤 거품에 붙이면 효과가 나옴', r.landLucky === 1, r.landLucky);
  check('대포에서 쏜 폭탄 거품이 날아가 터짐', r.flyBomb);
  check('폭탄 배치 4·10·20·25·28, 랜덤 배치 14·17·22·26·29', r.zAt === '4,10,20,25,28' && r.qAt === '14,17,22,26,29', r.zAt + ' / ' + r.qAt);
  check('첫 등장 설명 카드: 4스테이지 폭탄(한 번만), 14스테이지 랜덤', r.card4 && r.card4again && r.card14);
  check('폭탄·랜덤 검사 중 페이지 에러 없음', errors.length === 0, errors.join(' | '));
  await page.close();
}

// 2) 스테이지 표 · 방해 요소가 정해진 스테이지에서만 켜짐 · 예고
{
  console.log('스테이지 표 · 방해 요소 · 예고');
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url + '?seed=4');
  await page.evaluate(() => { window.__jp.reset(); window.__jp.P.seenIntro = true; });
  const t = await page.evaluate(() => {
    const j = window.__jp, out = {};
    out.count = j.STAGES.length;
    out.themes = new Set(j.STAGES.map(s => s.theme)).size;
    out.friends = new Set(j.STAGES.map(s => s.friends[0].name)).size;
    out.bosses = j.STAGES.filter(s => s.boss).map(s => s.id).join(',');
    // 스테이지마다 켜진 방해 요소가 표와 같은지
    const want = { 8: 'cloud', 9: 'miss', 11: 'aim', 14: 'caramel', 15: 'clock', 16: 'nom', 17: 'dark', 19: 'conveyor', 20: 'shotTimer', 22: 'dropSec', 23: 'nom', 27: 'aim', 29: 'clock' };
    out.bad = [];
    for (let n = 1; n <= j.NST; n++) {
      j.startStage(n); j.closeCard();
      // 0.8.0: 모든 스테이지에 시간 천장(cfg.dropSec)이 기본으로 켜진다 → 방해 요소는 스테이지 표(st.hz)로 확인
      const keys = Object.keys(j.G.st.hz);
      if (want[n] && !keys.includes(want[n])) out.bad.push(n + ':' + want[n] + ' 없음');
      if (n <= 6 && keys.length) out.bad.push(n + ':' + keys);
      if (!(j.G.hz.cfg.dropSec > 0)) out.bad.push(n + ': 시간 천장 없음');
    }
    out.fall = j.STAGES.map(s => s.fall);
    return out;
  });
  check('스테이지 30개, 배경 30종, 친구 30명, 보스는 6·12·18·24·30', t.count === 30 && t.themes === 30 && t.friends === 30 && t.bosses === '6,12,18,24,30', JSON.stringify(t));
  check('방해 요소는 진행표에 정한 스테이지에서만 켜짐 (월드 1은 없음), 모든 스테이지에 시간 천장', t.bad.length === 0, t.bad.join(' | '));
  check('천장 하강 간격: 1스테이지 19초 → 뒤로 갈수록 짧아짐, 5스테이지는 12초로 빠름', t.fall[0] === 19 && t.fall[4] === 12 && t.fall[28] < t.fall[6] && t.fall.every(v => v >= 8), JSON.stringify(t.fall));

  const warn = await page.evaluate(() => {
    const j = window.__jp, out = {}, miss = a => { j.setAngle(a); j.shoot(); j.advance(); };
    // 구름 (8): 1발 뒤 예고, 2발 뒤 덮임
    j.startStage(8); j.closeCard();
    miss(-0.25); out.cloudWarn = !!(j.G.hz.warn && !j.G.hz.cloud);
    miss(-0.25); out.cloud = !!j.G.hz.cloud;
    // 놈놈 (16): 2발 뒤 빼꼼, 3발 뒤 훔침
    j.startStage(16); j.closeCard();
    const before = j.Board.count(j.G.b);
    miss(-0.25); miss(-2.9);
    out.peek = j.G.hz.nom && j.G.hz.nom.state;
    const mid = j.Board.count(j.G.b);
    miss(-0.25);
    out.steal = j.G.hz.nom && j.G.hz.nom.act === 'steal' && j.G.hz.nom.carry;
    out.stolen = [before, mid, j.Board.count(j.G.b)].join(',');
    // 캐러멜 (14): 3발 뒤 방울이 맺히고(예고), 4발 뒤 붙음
    j.startStage(14); j.closeCard();
    miss(-0.25); miss(-2.9); miss(-0.25);
    out.caramelWarn = j.G.hz.caramelX !== null;
    const c0 = j.Board.count(j.G.b); miss(-2.9);
    const at = j.G.hz.caramelLast;
    out.caramel = j.G.hz.caramelX === null && !!at && (!!(j.G.b.rows[at[0]] && j.G.b.rows[at[0]][at[1]]) || j.Board.count(j.G.b) < c0);   // 붙은 자리 확인(붙자마자 터졌을 수도 있음)
    // 컨베이어 (19): 3발 뒤 예고, 4발 뒤 움직임
    j.startStage(19); j.closeCard();
    miss(-0.25); miss(-2.9); miss(-0.25);
    out.convWarn = j.G.hz.convWarn;
    // 헛방 (9): 2번째 헛방이면 천장이 떨림(예고), 3번째면 내려옴
    j.startStage(9); j.closeCard();
    const y0 = j.G.b.y0;
    j.G.hz.misses = 1; miss(-0.2);
    out.missWarn = j.G.hz.misses === 2 && j.G.hz.ceilWarn === 1;
    j.G.hz.misses = 2; j.G.queue[0] = 'o'; miss(-0.2);
    out.missDrop = j.G.b.y0 > y0;
    return out;
  });
  check('구름: 1발 전에 "구름이 몰려와요" 예고 → 다음 발에 덮임', warn.cloudWarn && warn.cloud, JSON.stringify(warn));
  const mist = await page.evaluate(async () => {
    const j = window.__jp, out = {};
    // 안개: 위는 짙고 아래로 옅어짐 (캔버스 픽셀로 확인), 터진 자리는 걷힘
    j.startStage(8); j.closeCard();
    j.G.hz.cloud = null; j.G.hz.cfg.cloud = { first: 0, every: 99, last: 9 }; j.G.hz.cloudNext = j.G.shotCount + 1;
    const popAim = () => { for (const c of 'rybgp') for (let a = -2.9; a < -0.2; a += 0.02) { const r = j.evalShot(a, c); if (r && r.popped && r.cell[0] <= 3) { j.G.queue[0] = c; j.setAngle(a); return true; } } return false; };
    j.setAngle(-0.25); j.shoot(); j.advance();
    await new Promise(r => setTimeout(r, 1500));
    const cv = document.getElementById('canvas'), c = cv.getContext('2d'), k = cv.width / j.W;
    const lum = y => { const d = c.getImageData(Math.round(40 * k), Math.round(y * k), 1, 1).data; return d[0] + d[1] + d[2]; };
    const y0 = j.G.b.y0, cl = j.G.hz.cloud;
    out.on = !!cl && cl.a > .9;
    out.top = lum(y0 + 20); out.depth = cl && cl.depth;
    j.G.b.rows = j.G.b.rows.slice(0, 3); out.holes0 = cl.holes.length; out.aimed = popAim(); if (out.aimed) { j.shoot(); j.advance(); } out.holes1 = j.G.hz.cloud && j.G.hz.cloud.holes.length;
    return out;
  });
  check('안개: 덮이면 맨 위는 하얗게 가려짐(밝기 높음)', mist.on && mist.top > 700, JSON.stringify(mist));
  check('안개: 안개 속 거품을 터뜨리면 그 자리가 걷힘', mist.holes1 > mist.holes0, JSON.stringify(mist));
  const aimL = await page.evaluate(() => { const j = window.__jp; return j.STAGES.map(s => j.aimLimit(s)); });
  check('조준선: 월드 1은 끝까지, 7번부터 스테이지가 오를수록 짧아짐(30번 150px)', aimL.slice(0, 6).every(v => v === null || v > 1e9) && aimL.slice(6).every((v, i, a) => i === 0 || v <= a[i - 1]) && aimL[29] === 150 && aimL[6] === 700, JSON.stringify(aimL));
  check('꼬마 놈놈: 1발 전에 빼꼼 예고 → 거품 1개를 훔쳐 감', warn.peek === 'peek' && warn.steal, JSON.stringify(warn));
  check('캐러멜 방울: 1발 전에 천장에 맺힘(예고) → 떨어져 붙음', warn.caramelWarn && warn.caramel, JSON.stringify(warn));
  check('컨베이어: 움직이기 1발 전에 줄이 깜빡임(예고)', warn.convWarn === true, JSON.stringify(warn));
  check('헛방 천장: 2번째 헛방에 천장이 떨리고(예고), 3번째에 내려옴', warn.missWarn && warn.missDrop, JSON.stringify(warn));

  const nom = await page.evaluate(() => {
    const j = window.__jp, out = {};
    // 대포 막기: 쏘면 막혀서 1발이 사라지고, 순서 바꾸기(간지럼)로 쫓아낼 수 있음
    j.startStage(23); j.closeCard();
    j.G.hz.cfg.nom = { first: 0, every: 99, acts: ['block'] };
    j.G.hz.nomNext = 0; j.G.hz.nomIdx = 0; j.G.shotCount = -1; j.setAngle(-0.25); j.shoot(); j.advance();   // 다음 발에서 놈놈 등장
    out.blocked = j.blocked();
    const left = j.G.fired, cnt = j.Board.count(j.G.b); j.shoot(); j.advance();
    out.blockedShot = j.G.fired === left + 1 && j.Board.count(j.G.b) <= cnt && !j.blocked();
    j.G.hz.nom = { act: 'block', state: 'block', side: 1, x: 180, y: 480, tx: 180, ty: 480, t: 0 };
    j.swapQueue(); out.chased = !j.blocked();
    // 친구 데려가기: 천장 시간 -4초, 맞히면 +4초
    j.startStage(26); j.closeCard();
    j.G.hz.cfg.nom = { first: 0, every: 99, acts: ['take'] }; j.G.hz.nomNext = j.G.shotCount + 1; j.G.hz.nomIdx = 0;
    j.G.hz.dropT = 10; const g0 = j.G.hz.elapsed || 0; j.setAngle(-0.25); j.shoot(); j.advance();
    out.taken = Math.round(10 - (j.G.hz.elapsed - g0) - j.G.hz.dropT);   // 날아간 시간을 빼고 4초
    const n = j.G.hz.nom; n.state = 'hover'; n.x = 180; n.y = 400; n.tx = 180; n.ty = 400;
    const t2 = j.G.hz.dropT, g2 = j.G.hz.elapsed; j.setAngle(-Math.PI / 2); j.shoot(); j.advance();
    out.back = Math.round(j.G.hz.dropT - t2 + (j.G.hz.elapsed - g2));
    // 방해 거품: 색 없는 회색 거품이 판에 붙음
    j.startStage(25); j.closeCard();
    j.G.hz.cfg.nom = { first: 0, every: 99, acts: ['junk'] }; j.G.hz.nomNext = j.G.shotCount + 1; j.G.hz.nomIdx = 0;
    j.setAngle(-0.25); j.shoot(); j.advance();
    out.junk = j.G.b.rows.some(row => row.some(c => c && c.k === 'n'));
    // 앞 놈놈이 떠나는 중이어도 다음 놈놈은 빼꼼 예고부터
    j.startStage(25); j.closeCard();
    j.G.hz.cfg.nom = { first: 0, every: 99, acts: ['block'] }; j.G.hz.nomNext = j.G.shotCount + 2; j.G.hz.nomIdx = 0;
    j.G.hz.nom = { act: 'steal', state: 'leave', side: 1, x: 300, y: 330, tx: 300, ty: 330, t: 0 };
    j.setAngle(-0.25); j.shoot(); j.advance();
    out.peekAfterLeave = j.G.hz.nom && j.G.hz.nom.state;
    // 설명 카드가 떠 있으면 순서 바꾸기도 안 됨
    j.G.paused = true; out.swapPaused = j.swapQueue() === false; j.G.paused = false;
    return out;
  });
  check('놈놈 대포 막기: 쏜 거품이 막혀 1발이 사라짐', nom.blocked && nom.blockedShot, JSON.stringify(nom));
  check('놈놈 대포 막기: 맨 앞 친구 누르기(간지럼)로 쫓아냄', nom.chased, JSON.stringify(nom));
  check('놈놈 친구 데려가기: 천장 시간 -4초, 놈놈을 맞히면 +4초', nom.taken === 4 && nom.back === 4, JSON.stringify(nom));
  check('놈놈 방해 거품: 회색 거품이 판에 붙음', nom.junk, JSON.stringify(nom));
  check('앞 놈놈이 떠나는 중이어도 다음 놈놈은 빼꼼 예고부터', nom.peekAfterLeave === 'peek', JSON.stringify(nom));
  check('설명 카드가 떠 있는 동안 순서 바꾸기 안 됨', nom.swapPaused, JSON.stringify(nom));

  const tm = await page.evaluate(() => {
    const j = window.__jp, out = {};
    // 한 발 초침 (20): 7초 지나면 자동 발사
    j.startStage(20); j.closeCard();
    const l = j.G.fired; j.think(7.2); out.auto = j.G.fired === l + 1;
    // 손가락을 대고 있어도 초침은 흐름
    j.startStage(20); j.closeCard(); j.G.aiming = true;
    const la = j.G.fired; j.think(7.2); out.autoHold = j.G.fired === la + 1 && !j.G.aiming;
    // 진짜 타임 어택 (29): 시간이 끝나면 실패
    j.startStage(29); j.closeCard();
    j.G.hz.clock = 1; j.think(1.5); out.hard = j.G.outcome && j.G.outcome.reason;
    // 부드러운 타임 어택 (15): 시간이 끝나면 천장 2칸
    j.startStage(15); j.closeCard();
    const y0 = j.G.b.y0; j.G.hz.clock = .5; j.think(1);
    out.soft = Math.round((j.G.b.y0 - y0) / j.ROW_H);
    // 시간 끝난 뒤에는 천장 간격이 절반으로 (서둘러!)
    out.rush = [j.G.hz.cfg.dropSec, j.STAGES[14].fall]; j.G.hz.started = true;
    const y2 = j.G.b.y0; j.think(j.G.hz.cfg.dropSec - .5);
    out.overWarn = j.G.b.y0 === y2;
    j.think(1); out.overDrop = Math.round((j.G.b.y0 - y2) / j.ROW_H);
    // 시간 천장 (22)
    j.startStage(22); j.closeCard();
    j.G.hz.started = true; const y1 = j.G.b.y0; j.think(8.6); const ya = j.G.b.y0; j.think(.6); out.dropSec = ya === y1 && j.G.b.y0 > y1 && j.G.hz.cfg.dropSec === 9;
    // 숨은 탭·설명 카드에서는 시계가 멈춤
    j.startStage(15); j.closeCard();
    const c0 = j.G.hz.clock;
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    j.think(5); out.hiddenStop = j.G.hz.clock === c0;
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    j.think(2); out.runs = c0 - j.G.hz.clock > 1.5;
    j.G.paused = true; const c1 = j.G.hz.clock; j.think(3); out.pauseStop = j.G.hz.clock === c1; j.G.paused = false;
    return out;
  });
  check('한 발 초침: 7초 안에 안 쏘면 자동 발사', tm.auto, JSON.stringify(tm));
  check('진짜 타임 어택(29): 시간이 끝나면 실패', tm.hard === 'time', JSON.stringify(tm));
  check('부드러운 타임 어택(15): 시간이 끝나면 천장 2칸', tm.soft === 2, JSON.stringify(tm));
  check('시간이 끝난 뒤에는 천장 간격이 절반(서둘러!)', tm.rush[0] === Math.max(4, Math.round(tm.rush[1] / 2)) && tm.overWarn && tm.overDrop === 1, JSON.stringify(tm));
  check('한 발 초침: 손가락을 대고 있어도 시간이 흘러 자동 발사', tm.autoHold, JSON.stringify(tm));
  check('시간 천장(22): 이 스테이지만 9초마다로 빠름', tm.dropSec, JSON.stringify(tm));
  check('앱을 내리면(숨은 탭) 시계가 멈추고, 돌아오면 다시 흐름', tm.hiddenStop && tm.runs, JSON.stringify(tm));
  check('설명 카드가 떠 있는 동안 시계가 멈춤', tm.pauseStop, JSON.stringify(tm));

  const boss = await page.evaluate(() => {
    const j = window.__jp, out = {};
    j.startStage(30); j.closeCard();
    out.kind = j.G.st.boss.kind;
    const popAim = () => { for (const c of 'rybgpo') for (let a = -2.9; a < -0.2; a += 0.02) { const r = j.evalShot(a, c); if (r && r.popped) { j.G.queue[0] = c; j.setAngle(a); return true; } } return false; };
    j.G.bossHp = Math.floor(j.G.st.boss.hp * .6);
    // 아무 거품이나 터뜨려 단계 확인이 돌게
    popAim();
    j.shoot(); j.advance();
    out.phase2 = j.G.hz.phase >= 1 && !!j.G.hz.cfg.nom && !!j.G.hz.cfg.cloud;
    if (j.blocked()) j.swapQueue();
    j.G.bossHp = 5; popAim();
    j.shoot(); j.advance();
    out.phase3 = j.G.hz.red && j.G.hz.cfg.aim === 'short' && !!j.G.hz.cfg.dropSec;
    out.phase3Only = !j.G.hz.cfg.nom && !j.G.hz.cfg.cloud;
    return out;
  });
  check('최종 보스 노놈: 체력이 줄면 2단계(놈놈+구름) → 3단계(붉어짐·짧은 조준선·시간 천장)', boss.kind === 'nomnom' && boss.phase2 && boss.phase3, JSON.stringify(boss));
  check('노놈 3단계에서는 놈놈·구름이 빠져 동시 방해 3개 이하', boss.phase3Only, JSON.stringify(boss));
  check('콘솔 에러 없음', errors.length === 0, errors.join(' | '));
  await page.close();
}

// 3) 설명 카드 · 지도 5월드 · 스티커 북 (휴대폰 3기종)
for (const [label, dev] of [['iPhone SE (320x568)', devices['iPhone SE']], ['Galaxy S8 (360x740)', devices['Galaxy S8']], ['iPhone 13 (390x844)', devices['iPhone 13']]]) {
  console.log(label);
  const ctx = await browser.newContext({ ...dev, defaultBrowserType: undefined });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url + '?seed=5');
  await page.evaluate(() => { const j = window.__jp; j.reset(); j.P.seenIntro = true; for (let i = 0; i < 6; i++) j.P.stars[i] = 2; j.P.stickers = { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true }; j.save(); });
  await page.reload();
  const tag = dev.viewport.width;
  const layout = () => page.evaluate(() => {
    const vis = [...document.querySelectorAll('button')].filter(b => b.offsetParent !== null && !b.closest('[hidden]'));
    const small = vis.filter(b => { const r = b.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).map(b => b.id || b.className);
    return { scrollX: document.documentElement.scrollWidth > innerWidth, small };
  });
  const bad = [];
  const look = async name => { const l = await layout(); if (l.scrollX || l.small.length) bad.push(name + ':' + JSON.stringify(l)); };

  await page.tap('#startBtn');
  const m = await page.evaluate(() => ({ world: document.getElementById('mapWorldName').textContent, nodes: [...document.querySelectorAll('.node')].map(n => n.dataset.stage).join(','), open: [...document.querySelectorAll('.node:not([disabled])')].map(n => n.dataset.stage).join(','), prev: !document.getElementById('mapPrev').hidden, next: !document.getElementById('mapNext').hidden }));
  check('월드 1을 깨면 지도가 월드 2(시럽 숲, 7~12칸)로 바뀌고 7번만 열림', m.world === '시럽 숲' && m.nodes === '7,8,9,10,11,12' && m.open === '7' && m.prev && !m.next, JSON.stringify(m));
  await page.screenshot({ path: path.join(shots, `v3-map-w2-${tag}.png`) });
  await look('map');
  await page.tap('#mapPrev');
  const m1 = await page.evaluate(() => ({ world: document.getElementById('mapWorldName').textContent, nodes: document.querySelectorAll('.node').length, next: !document.getElementById('mapNext').hidden }));
  check('◀ 버튼으로 깬 월드 1 지도를 다시 볼 수 있음', m1.world === '젤리마을' && m1.nodes === 6 && m1.next, JSON.stringify(m1));
  await page.tap('#mapNext');

  await page.tap('.node[data-stage="7"]');
  await page.waitForTimeout(400);
  const card = await page.evaluate(() => ({ shown: !document.getElementById('hzCard').hidden, title: document.querySelector('#hzList b') && document.querySelector('#hzList b').textContent }));
  await page.screenshot({ path: path.join(shots, `v3-card-${tag}.png`) });
  check('새 방해가 처음 나오면 설명 카드 (7스테이지: 끈적 시럽 거품)', card.shown && card.title === '끈적 시럽 거품', JSON.stringify(card));
  await look('card');
  await page.tap('#hzOk');
  check('카드를 닫으면 바로 플레이', await page.evaluate(() => document.getElementById('hzCard').hidden && window.__jp.G.paused === false));
  await page.evaluate(() => window.__jp.startStage(7));
  check('같은 방해의 설명 카드는 한 번만', await page.evaluate(() => document.getElementById('hzCard').hidden));
  await look('play');

  // 그림 확인용: 월드마다 하나씩 + 최종 보스
  for (const n of [11, 17, 21, 28, 30]) {
    await page.evaluate(n => { window.__jp.startStage(n); window.__jp.closeCard(); }, n);
    await page.waitForTimeout(500);
    if (tag === 390) await page.screenshot({ path: path.join(shots, `v3-stage${n}-${tag}.png`) });
  }
  await look('boss');
  await page.evaluate(() => window.__jp.go('book'));
  const book = await page.evaluate(() => ({ cells: document.querySelectorAll('.cell').length, got: document.querySelectorAll('.cell.got').length, wait: document.body.innerHTML.includes('준비 중') }));
  check('스티커 북: 30칸, 받은 6칸만 채워짐, "준비 중" 표시 없음', book.cells === 30 && book.got === 6 && !book.wait, JSON.stringify(book));
  await look('book');
  check('지도·카드·플레이·스티커 북: 가로 스크롤 없음, 버튼 44px 이상', bad.length === 0, bad.join(' | '));
  check('콘솔 에러 없음', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

// 3-1) 소리 · 큰 대포 (Owner 피드백 2)
{
  console.log('소리 · 대포');
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await page.goto(url + '?seed=11');
  await page.evaluate(() => { window.__jp.reset(); window.__jp.startStage(1); });
  await page.waitForTimeout(300);
  // 대포 근처를 한 번 누르면 소리가 켜지고 배경 음악이 흐름
  const box = await page.evaluate(() => { const r = document.getElementById('canvas').getBoundingClientRect(); return [r.left + 60 * r.width / 360, r.top + 600 * r.height / 620]; });
  await page.mouse.move(box[0], box[1]); await page.mouse.down(); await page.mouse.up();
  await page.waitForTimeout(1600);
  const m1 = await page.evaluate(() => window.__jp.music());
  // 새 레트로 곡은 한 칸에 예약하는 음이 예전보다 적어 조금 더 기다림 (0.9초 → 1.6초)
  check('배경 음악: 화면을 누르면 시작되고 음표가 계속 예약됨', m1.running && m1.scheduled > 20, JSON.stringify(m1));
  check('레트로 기본 음악: 플레이 화면은 16마디 플레이 테마', m1.track === 'play' && m1.bars === 16 && !m1.boss, JSON.stringify(m1));
  const tr = await page.evaluate(async () => { const j = window.__jp; j.go('map'); await new Promise(r => setTimeout(r, 400)); const a = j.music(); j.startStage(12); await new Promise(r => setTimeout(r, 400)); const b = j.music(); j.go('map'); j.startStage(1); return { a, b }; });
  check('레트로 기본 음악: 지도 화면은 타이틀 테마(8마디)로 바뀌고 계속 연주', tr.a.track === 'title' && tr.a.bars === 8 && tr.a.scheduled > m1.scheduled, JSON.stringify(tr.a));
  check('레트로 기본 음악: 보스 판은 빠른 보스 변주', tr.b.track === 'play' && tr.b.boss === true, JSON.stringify(tr.b));
  const v = await page.evaluate(() => { const j = window.__jp, a = j.voices(); j.sfx('pop', 8); const b = j.voices(); return { a, b }; });
  check('크게 터지면 젤리 추임새 소리', v.b === v.a + 1, JSON.stringify(v));
  const modes = [];
  for (let i = 0; i < 3; i++) { await page.tap('#soundBtn'); await page.waitForTimeout(300); modes.push(await page.evaluate(() => [window.__jp.soundMode(), window.__jp.music().running])); }
  check('소리 버튼: 음악+효과음 → 효과음만(음악 멈춤) → 끔 → 다시 모두', JSON.stringify(modes) === JSON.stringify([['sfx', false], ['off', false], ['all', true]]), JSON.stringify(modes));
  check('대포가 커짐 (그림 배율 1.05, 전 0.8)', await page.evaluate(() => window.__jp.CS) >= 1);
  await page.screenshot({ path: path.join(shots, 'v4-cannon-390.png') });
  await page.close();
}

// 4) 월드 전환 · 완주
{
  console.log('월드 전환 · 완주');
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(url + '?seed=9');
  await page.evaluate(() => { const j = window.__jp; j.reset(); j.P.seenIntro = true; for (let i = 0; i < 29; i++) { j.P.stars[i] = 1; j.P.stickers[i + 1] = true; } });
  const fin = await page.evaluate(() => {
    const j = window.__jp; j.startStage(30); j.closeCard();
    j.G.bossHp = 1; let ok = false;
    for (let a = -2.9; a < -0.2 && !ok; a += 0.02) { const r = j.evalShot(a); if (r && r.popped) { j.setAngle(a); ok = true; } }
    j.shoot(); j.advance(); return j.G.outcome;
  });
  await page.waitForSelector('#result:not([hidden])', { timeout: 4000 });
  const res = await page.evaluate(() => ({ title: document.getElementById('resultTitle').textContent, msg: document.getElementById('resultMsg').textContent, main: document.getElementById('resultMain').textContent }));
  await page.screenshot({ path: path.join(shots, 'v3-finale-390.png') });
  check('최종 보스를 쓰러뜨리면 "모험 완주" (스티커 30/30)', fin && fin.win && res.title.includes('최종') && res.msg.includes('30명') && res.main === '지도로', JSON.stringify(res));
  await page.evaluate(() => { const j = window.__jp; j.reset(); j.P.seenIntro = true; for (let i = 0; i < 5; i++) j.P.stars[i] = 1; });
  const tr = await page.evaluate(async () => {
    const j = window.__jp; j.startStage(6); j.G.bossHp = 1; let ok = false;
    for (let a = -2.9; a < -0.2 && !ok; a += 0.02) { const r = j.evalShot(a); if (r && r.popped) { j.setAngle(a); ok = true; } }
    j.shoot(); j.advance();
    for (let i = 0; i < 40 && document.getElementById('result').hidden; i++) await new Promise(r => setTimeout(r, 100));
    document.getElementById('resultMain').click();
    const story = !!document.getElementById('story');
    document.getElementById('csSkip').click();   // 보스 6 컷신(뭉치 + 초대장 조각 1) 건너뛰기
    await new Promise(r => setTimeout(r, 100));
    return { story, banner: !document.getElementById('worldBanner').hidden, text: document.getElementById('worldBanner').textContent, world: document.getElementById('mapWorldName').textContent };
  });
  check('보스를 깨고 지도로 가면 다음 월드 이름이 크게 나옴', tr.story && tr.banner && tr.text.includes('시럽 숲') && tr.world === '시럽 숲', JSON.stringify(tr));
  await page.close();
}

// 5) 난이도: 시드 10개 × 30스테이지 자동 플레이
{
  console.log('난이도 (시드 10개 × 30스테이지)');
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const wins = new Array(30).fill(0), left = new Array(30).fill(0);
  for (let seed = 1; seed <= 10; seed++) {
    await page.goto(url + '?seed=' + seed);
    for (let s = 1; s <= 30; s++) { const r = await page.evaluate(botPlay, s); if (r.win) { wins[s - 1]++; left[s - 1] += r.left; } }
  }
  const worldRate = w => wins.slice(w * 6, w * 6 + 6).reduce((a, b) => a + b, 0) / 60;
  console.log('     클리어 수:', [0, 1, 2, 3, 4].map(w => wins.slice(w * 6, w * 6 + 6).join(' ')).join(' | '));
  console.log('     월드별 클리어율:', [0, 1, 2, 3, 4].map(w => Math.round(worldRate(w) * 100) + '%').join(' → '));
  check('자동 플레이로 30스테이지 모두 클리어 가능 (스테이지마다 10판 중 3판 이상)', wins.every(w => w >= 3), wins.join(','));
  check('월드 1은 10판 중 7판 이상 (기존 기준 유지)', wins.slice(0, 6).every(w => w >= 7), wins.slice(0, 6).join(','));
  check('월드 5가 월드 1보다 어려움 (클리어율이 낮음)', worldRate(4) < worldRate(0), [worldRate(0), worldRate(4)].join(' > '));
  check('콘솔 에러 없음', errors.length === 0, errors.join(' | '));
  await page.close();
}

await browser.close();
console.log(`\n결과: 통과 ${pass} / 실패 ${fail}`);
process.exit(fail ? 1 : 0);
