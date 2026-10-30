// 0.15.0 자동 테스트: 생명 3개 · 낮아진 게임 오버 선 · 대포 위 안내 창 · 부두목전(놈놈 부하) · 보너스 젤리/스테이지 · 젤리 표정
// 실행: node tests/lives-bonus.test.mjs
import { chromium, devices } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { koreanByDefault } from './locale.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const url = pathToFileURL(path.join(root, 'index.html')).href;
let pass = 0, fail = 0;
function check(name, ok, info = '') {
  if (ok) { pass++; console.log('  ✅ ' + name); } else { fail++; console.log('  ❌ ' + name + ' ' + info); }
}
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
koreanByDefault(browser);
const phone = { ...devices['iPhone 13'] };
delete phone.defaultBrowserType;
const ctx = await browser.newContext(phone);
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => m.type() === 'error' && !/getImageData/.test(m.text()) && errors.push(m.text()));
await page.goto(url + '?seed=7');
await page.evaluate(() => { const j = window.__jp; j.reset(); j.P.seenIntro = true; for (let i = 1; i <= 30; i++) j.P.seenStory[i] = true; j.P.lives = 3; j.save(); });

console.log('생명 3개');
{
  const r = await page.evaluate(() => { const j = window.__jp; j.startStage(1); j.closeCard(); return { lives: j.P.lives, hearts: document.querySelectorAll('#lives span:not(.off)').length, label: document.getElementById('lives').getAttribute('aria-label') }; });
  check('처음 생명 3개, 하트 3개 표시', r.lives === 3 && r.hearts === 3, JSON.stringify(r));
  // 천장을 끝까지 내려 거품이 바닥에 닿게 → 생명 1개 잃고 같은 판 계속
  const a = await page.evaluate(() => {
    const j = window.__jp; let n = 0;
    while (j.P.lives === 3 && n++ < 40) j.lowerCeiling(1);
    const hitState = j.G.state, hit = j.G.loseHit && j.G.loseHit.what;
    j.advance();   // 0.15.1: 닿은 자리를 0.9초 보여 준 뒤 밀어 올린다
    const G = j.G;
    return { lives: j.P.lives, state: G.state, safe: j.Board.lowestY(G.b) + j.R <= j.LOSE_Y, result: !document.getElementById('result').hidden, hearts: document.querySelectorAll('#lives span:not(.off)').length, hitState, hit };
  });
  check('닿으면 잠깐 멈춰 닿은 곳 표시', a.hitState === 'hit' && !!a.hit, JSON.stringify(a));
  check('바닥에 닿으면 생명 -1 (3→2), 결과 창 없이 판이 밀려 올라가 계속', a.lives === 2 && a.state === 'aim' && a.safe && !a.result && a.hearts === 2, JSON.stringify(a));
  const b = await page.evaluate(() => {
    const j = window.__jp; let n = 0;
    while (j.G.state !== 'done' && n++ < 120) { j.lowerCeiling(1); if (j.G.state === 'hit') j.advance(); }
    return { lives: j.P.lives, state: j.G.state, reason: j.G.outcome && j.G.outcome.reason };
  });
  check('생명 3개를 다 쓰면 게임 오버', b.lives === 0 && b.state === 'done' && b.reason === 'line', JSON.stringify(b));
  await page.waitForSelector('#result:not([hidden])', { timeout: 4000 });
  const msg = await page.textContent('#resultMsg');
  check('게임 오버 문구: 생명을 다 썼어요', msg.includes('생명'), msg);
  const c = await page.evaluate(() => { const j = window.__jp; document.getElementById('resultMain').click(); return { lives: j.P.lives, hearts: document.querySelectorAll('#lives span:not(.off)').length, state: j.G.state }; });
  check('다시 하기 → 생명 3개로 새로 시작', c.lives === 3 && c.hearts === 3 && c.state === 'aim', JSON.stringify(c));
}

console.log('경고 선을 넘어도 닿기 전에는 계속');
{
  const r = await page.evaluate(() => {
    const j = window.__jp, G = j.G, b = G.b;
    // 맨 아래 거품이 예전 바닥 선(DEADLINE)은 넘었지만 새 선(LOSE_Y)에는 안 닿게 내린다
    j.setAngle(-Math.PI / 2 + 1.1);   // 0.15.1: 위를 겨누면 대포 속 젤리에 닿으니 옆으로
    const low = j.Board.lowestY(b) + j.R, want = (j.DEADLINE + j.LOSE_Y) / 2;
    b.y0 += want - low; G.y0Target = b.y0;
    G.state = 'settle'; G.settleT = 0; j.advance();
    return { deadline: j.DEADLINE, lose: j.LOSE_Y, state: G.state, lives: j.P.lives, pivot: j.PIVOT.y };
  });
  check('게임 오버 선이 예전 바닥 선보다 아래 (대포 몸통 높이)', r.lose > r.deadline + 40 && r.lose < r.pivot, JSON.stringify(r));
  check('예전 바닥 선을 넘어도 새 선 전에는 계속', r.state === 'aim' && r.lives === 3, JSON.stringify(r));
}

console.log('안내 창이 대포를 가리지 않음');
{
  const r = await page.evaluate(() => {
    const j = window.__jp; j.P.seenHz = {}; j.startStage(7);
    const cv = document.getElementById('canvas').getBoundingClientRect(), k = cv.height / j.H;
    const card = document.getElementById('hzCard').getBoundingClientRect();
    const cannonTop = cv.top + (j.PIVOT.y - 82) * k;   // 포신 끝 + 대포 속 거품 윗부분
    j.closeCard();
    const tip = document.getElementById('tip').getBoundingClientRect();
    return { cardBottom: card.bottom, tipBottom: tip.bottom, cannonTop, tipShown: !document.getElementById('tip').classList.contains('hide') };
  });
  check('새 방해 설명 창이 대포보다 위', r.cardBottom <= r.cannonTop, JSON.stringify(r));
  check('시작 안내 말풍선이 대포보다 위', r.tipShown && r.tipBottom <= r.cannonTop, JSON.stringify(r));
}

console.log('월드 마지막 판 = 부두목전 (놈놈 부하)');
{
  const r = await page.evaluate(() => {
    const j = window.__jp;
    return [6, 12, 18, 24, 30].map(id => { const st = j.STAGES[id - 1]; return { id, boss: !!st.boss, sub: !!(st.boss && st.boss.sub), minions: !!(st.boss && st.boss.minions), nomKey: j.keysOf(st).some(k => k.startsWith('nom-')) }; });
  });
  check('6·12·18·24 부두목 + 놈놈 부하', r.slice(0, 4).every(x => x.boss && x.sub && x.minions && x.nomKey), JSON.stringify(r));
  check('30 최종 보스 노놈도 처음부터 부하', r[4].boss && !r[4].sub && r[4].minions, JSON.stringify(r[4]));
  const s = await page.evaluate(() => {
    const j = window.__jp; j.startStage(6); j.closeCard();
    const G = j.G, first = G.hz.cfg.nom && G.hz.cfg.nom.first;
    let seen = false;
    for (let i = 0; i < 8 && G.state !== 'done'; i++) { j.setAngle(-Math.PI / 2 + (i % 3 - 1) * .3); j.shoot(); j.advance(); if (G.hz.nom) seen = true; }
    return { first, seen, hud: document.getElementById('hudStage').textContent };
  });
  check('6스테이지: 처음부터 놈놈 부하가 나온다', s.first > 0 && s.seen, JSON.stringify(s));
  check('위 표시: 부두목', s.hud.includes('부두목'), s.hud);
}

console.log('보너스 젤리 → 보너스 스테이지');
{
  const has = await page.evaluate(() => window.__jp.STAGES.filter(st => (st.kinds || []).join('').includes('h')).map(st => st.id));
  check('보너스 젤리가 월드마다 한 판씩 (3·8·14·20·26)', JSON.stringify(has) === '[3,8,14,20,26]', JSON.stringify(has));
  const t = await page.evaluate(() => {
    const j = window.__jp; j.P.lives = 2; j.startStage(3); j.closeCard();
    const G = j.G, b = G.b;
    // 보너스 젤리 옆에 같은 색 두 개를 붙여 터뜨린다
    let at = null; b.rows.forEach((row, r) => row.forEach((c, x) => { if (c && c.k === 'h') at = [r, x]; }));
    const col = b.rows[at[0]][at[1]].c;
    const nb = j.Board.neighbors(b, at[0], at[1]).filter(([y, x]) => !j.Board.get(b, y, x) || j.Board.get(b, y, x).friend === undefined);
    nb.slice(0, 1).forEach(([y, x]) => { j.Board.ensureRow(b, y); b.rows[y][x] = { c: col }; });
    const [ry, rx] = nb[1]; const p = j.Board.pos(b, ry, rx);
    if (j.Board.get(b, ry, rx)) b.rows[ry][rx] = null;
    j.land({ x: p.x, y: p.y, c: col });
    return { ticket: G.bonusTicket };
  });
  check('보너스 젤리를 터뜨리면 보너스 표', t.ticket, JSON.stringify(t));
  await page.evaluate(() => { const j = window.__jp; j.G.state = 'aim'; j.finish(true); });
  await page.waitForSelector('#result:not([hidden])', { timeout: 4000 });
  const btn = await page.textContent('#resultMain');
  check('클리어 창 버튼: 보너스 스테이지', btn.includes('보너스'), btn);
  await page.click('#resultMain');
  const m = await page.evaluate(() => { const j = window.__jp; return { mode: j.G && j.G.mode, n: j.G && j.G.bonus.targets.length, hud: document.getElementById('hudStage').textContent }; });
  check('보너스 스테이지 시작 (젤리 12명)', m.mode === 'bonus' && m.n === 12 && m.hud.includes('보너스'), JSON.stringify(m));
  // 준비 시간이 지난 뒤 젤리를 한 명씩 겨눠 맞힌다
  const g = await page.evaluate(() => {
    const j = window.__jp, G = j.G, B = G.bonus;
    let n = 0; while (B.ready > 0 && n++ < 200) { G.time += 1 / 30; j.update(1 / 30); }
    let guard = 0;
    while (G.state !== 'done' && guard++ < 400) {
      const tg = B.targets.find(t => t.alive); if (!tg) break;
      const ty = tg.y + Math.sin(G.time * 3 + tg.ph) * 6;
      j.setAngle(Math.atan2(ty - j.PIVOT.y, tg.x - j.PIVOT.x));
      j.shoot();
      for (let k = 0; k < 12; k++) { G.time += 1 / 60; j.update(1 / 60); }
    }
    for (let k = 0; k < 600 && G.state !== 'done'; k++) { G.time += 1 / 30; j.update(1 / 30); }
    return { got: B.got, ok: B.ok, lives: j.P.lives, state: G.state };
  });
  check('젤리 8명 이상 구하면 생명 +1 (2→3)', g.got >= 8 && g.ok && g.lives === 3, JSON.stringify(g));
  await page.waitForFunction(() => !window.__jp.G, null, { timeout: 8000 });
  const after = await page.evaluate(() => ({ map: !document.getElementById('map').hidden }));
  check('보너스가 끝나면 지도로', after.map, JSON.stringify(after));
  const cap = await page.evaluate(() => { const j = window.__jp; j.P.lives = 5; j.startStage(1); j.closeCard(); return document.querySelectorAll('#lives span').length; });
  check('생명은 최대 5개까지 표시', cap === 5, String(cap));
  await page.evaluate(() => { window.__jp.P.lives = 3; window.__jp.save(); });
}

console.log('젤리 표정');
{
  const r = await page.evaluate(() => {
    const j = window.__jp; j.startStage(2); j.closeCard(); const G = j.G;
    const out = {};
    j.lowerCeiling(1); out.ceil = G.face && G.face.mood;
    G.face = null; G.hz.nom = { act: 'steal', state: 'hover', side: -1, x: 100, y: 330, t: 0 };
    out.nomBase = j.baseMood(); G.hz.nom = null;
    G.streak = 1; G.face = null;
    // 같은 색 묶음에 쏴서 2연속 터뜨리기
    let best = null;
    for (let a = -Math.PI + .2; a < -.2; a += .02) { const e = j.evalShot(a); if (e && e.popped >= 3 && (!best || e.popped > best.p)) best = { a, p: e.popped }; }
    if (best) { j.setAngle(best.a); j.shoot(); j.advance(); }
    out.combo = G.face && G.face.mood; out.streak = G.streak;
    return out;
  });
  check('천장이 내려오면 깜짝 표정', r.ceil === 'o', JSON.stringify(r));
  check('놈놈이 판에 있으면 걱정 표정', r.nomBase === 'worried', JSON.stringify(r));
  check('연속으로 터뜨리면 활짝 표정', r.combo === 'joy' && r.streak >= 2, JSON.stringify(r));
  const k = await page.evaluate(() => {
    const miss = [];
    for (const c of ['#ff5f8a', '#ffd23f', '#5ed46a', '#4fb4ff', '#a76bff', '#ff8c3a']) for (const m of ['happy', 'joy', 'worried', 'o']) if (!window.JELLY3D_SPRITES['jelly|' + c + '|' + m + '|0']) miss.push(c + m);
    return miss;
  });
  check('판 젤리 6색 × 표정 4가지 3D 그림이 다 있음', !k.length, JSON.stringify(k));
}

check('콘솔 에러 없음', !errors.length, JSON.stringify(errors.slice(0, 3)));
await browser.close();
console.log(`\n결과: ${pass} 통과 / ${fail} 실패`);
process.exit(fail ? 1 : 0);
