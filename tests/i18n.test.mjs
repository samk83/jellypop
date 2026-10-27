// 젤리팝 영어판·언어 전환 자동 테스트: node tests/i18n.test.mjs
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
const HANGUL = /[가-힣]/;
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});

// 화면에 보이는 글자 (언어 버튼 '한국어'는 일부러 한국어)
const visibleText = () => {
  const out = [];
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    const el = n.parentElement;
    if (!el || el.closest('script,style,#langBtn,[hidden]') || !n.nodeValue.trim()) continue;
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    if (r.width && r.height && cs.visibility !== 'hidden' && cs.display !== 'none') out.push(n.nodeValue.trim());
  }
  document.querySelectorAll('[aria-label]').forEach(el => { if (!el.closest('#langBtn')) out.push(el.getAttribute('aria-label')); });
  return out;
};

// 1) 코드에서 T()로 감싼 한국어가 모두 영어 사전에 있는지 (새 문구를 넣고 영어를 빠뜨리면 여기서 잡힘)
{
  console.log('영어 사전');
  const dict = {};
  const src = fs.readFileSync(path.join(root, 'lang-en.js'), 'utf8');
  new Function('JellyI18n', src)({ add: o => Object.assign(dict, o) });
  // 다른 파일이 JellyI18n.add 로 넣는 영어 (monetize.js)
  new Function('window', 'localStorage', fs.readFileSync(path.join(root, 'monetize.js'), 'utf8'))({ JellyI18n: { add: o => Object.assign(dict, o) } }, { getItem: () => null });
  const missing = [];
  for (const f of ['index.html', 'stages.js', 'story-data.js', 'story.js', 'banner.js', 'monetize.js']) {
    const text = fs.readFileSync(path.join(root, f), 'utf8');
    for (const m of text.matchAll(/\bT\('((?:[^'\\]|\\.)*)'/g)) {
      const k = m[1].replace(/\\'/g, "'");
      if (HANGUL.test(k) && !(k in dict)) missing.push(f + ': ' + k);
    }
  }
  check('T()로 감싼 한국어 문구가 모두 영어 사전에 있음', missing.length === 0, missing.slice(0, 10).join(' | '));
  const stillKo = Object.entries(dict).filter(([, v]) => HANGUL.test(v)).map(([k]) => k);
  check('영어 사전 값에 한국어가 남아 있지 않음', stillKo.length === 0, stillKo.join(' | '));
  const params = Object.entries(dict).filter(([k, v]) => {
    const a = (k.match(/\{\w+\}/g) || []).sort().join(), b = (v.match(/\{\w+\}/g) || []).sort().join();
    return a !== b;
  }).map(([k]) => k);
  const space = Object.entries(dict).filter(([k, v]) => /\s$/.test(k) && v && !/\s$/.test(v)).map(([k]) => JSON.stringify(k));
  check('뒤에 숫자·이름이 붙는 문구(끝 공백)는 영어도 끝 공백 유지', space.length === 0, space.join(' | '));
  check('영어 문구의 {n}·{name} 자리가 한국어와 같음', params.length === 0, params.join(' | '));
}

// 2) 언어 고르기: 브라우저 언어 → 저장된 선택 → 주소 ?lang
{
  console.log('언어 고르기');
  const en = await browser.newPage({ locale: 'en-US' });
  await en.goto(url);
  const a = await en.evaluate(() => ({ lang: JellyI18n.lang, html: document.documentElement.lang, start: document.getElementById('startBtn').textContent, btn: document.getElementById('langBtn').textContent, title: document.title }));
  check('영어 브라우저는 영어로 시작 (모험 시작 → Start Adventure!)', a.lang === 'en' && a.html === 'en' && a.start === 'Start Adventure!' && a.title.startsWith('Jelly Pop'), JSON.stringify(a));
  check('영어일 때 언어 버튼은 "한국어"', a.btn === '한국어', a.btn);
  await en.close();

  const ko = await browser.newPage({ locale: 'ko-KR' });
  await ko.goto(url);
  const b = await ko.evaluate(() => ({ lang: JellyI18n.lang, start: document.getElementById('startBtn').textContent, btn: document.getElementById('langBtn').textContent }));
  check('한국어 브라우저는 한국어로 시작, 버튼은 "English"', b.lang === 'ko' && b.start === '모험 시작!' && b.btn === 'English', JSON.stringify(b));
  // 버튼을 누르면 영어로 바뀌고, 다시 열어도 영어 (저장)
  await Promise.all([ko.waitForNavigation(), ko.click('#langBtn')]);
  const c = await ko.evaluate(() => ({ lang: JellyI18n.lang, start: document.getElementById('startBtn').textContent, saved: localStorage.getItem('jellypop2.lang') }));
  check('언어 버튼을 누르면 영어로 바뀌고 저장됨', c.lang === 'en' && c.start === 'Start Adventure!' && c.saved === 'en', JSON.stringify(c));
  await ko.goto(url);
  check('다시 열어도 저장된 영어 유지 (한국어 브라우저여도)', await ko.evaluate(() => JellyI18n.lang) === 'en');
  await ko.goto(url + '?lang=ko');
  check('주소 ?lang=ko 가 저장된 선택보다 우선', await ko.evaluate(() => JellyI18n.lang) === 'ko');
  await ko.close();
}

// 3) 영어로 전 화면 훑기: 타이틀 → 프롤로그 → 지도 → 플레이(설명 카드) → 결과 → 스티커 북. 한국어가 화면에 안 남음
for (const [label, dev] of [['iPhone SE (320x568)', devices['iPhone SE']], ['iPhone 13 (390x844)', devices['iPhone 13']], ['PC 1280', { viewport: { width: 1280, height: 800 } }]]) {
  console.log('영어 화면 · ' + label);
  const ctx = await browser.newContext({ ...dev, defaultBrowserType: undefined, locale: 'en-US' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url + '?seed=7');
  await page.waitForTimeout(400);
  const found = {};
  const scan = async tag => {
    const ko = (await page.evaluate(visibleText)).filter(s => HANGUL.test(s));
    if (ko.length) found[tag] = ko.slice(0, 5);
    const sx = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    if (sx) found[tag + ':가로스크롤'] = true;
  };
  await scan('title');
  const tag = label.split(' ')[0] === 'PC' ? 'pc' : label.match(/\((\d+)/)[1];
  if (tag !== '320') await page.screenshot({ path: path.join(shots, `en-01-title-${tag}.png`) });
  await page.click('#startBtn');            // 처음이면 프롤로그
  await page.waitForTimeout(300);
  await scan('intro');
  if (tag === '390') await page.screenshot({ path: path.join(shots, `en-02-intro-${tag}.png`) });
  await page.click('#skipBtn');
  await page.waitForTimeout(500);
  await scan('map');
  if (tag !== '320') await page.screenshot({ path: path.join(shots, `en-03-map-${tag}.png`) });
  // 7스테이지(시럽 거품 설명 카드)를 바로 시작해서 카드·HUD 확인
  await page.evaluate(() => window.__jp.startStage(7));
  await page.waitForTimeout(600);
  await scan('play+card');
  if (tag === '390') await page.screenshot({ path: path.join(shots, `en-04-card-${tag}.png`) });
  await page.evaluate(() => window.__jp.closeCard());
  await page.waitForTimeout(300);
  const hud = await page.evaluate(() => ({ stage: document.getElementById('hudStage').textContent, goal: document.getElementById('hudGoalLabel').textContent }));
  if (hud.stage !== 'Stage 7' || hud.goal !== 'Friends to save') found.hud = hud;
  await scan('play');
  if (tag !== '320') await page.screenshot({ path: path.join(shots, `en-05-play-${tag}.png`) });
  // 결과 창 (이기기·지기)
  await page.evaluate(() => { const j = window.__jp; j.G.outcome = { win: true, stars: 2, newSticker: true }; j.showResult(); });
  await page.waitForTimeout(500);
  await scan('win');
  const win = await page.evaluate(() => document.getElementById('resultTitle').textContent);
  if (win !== 'Stage Clear!') found.winTitle = win;
  if (tag === '390') await page.screenshot({ path: path.join(shots, `en-06-clear-${tag}.png`) });
  await page.evaluate(() => { const j = window.__jp; j.G.outcome = { win: false, stars: 0, newSticker: false, reason: 'line' }; j.showResult(); });
  await page.waitForTimeout(300);
  await scan('lose');
  await page.evaluate(() => { document.getElementById('result').hidden = true; document.getElementById('app').inert = false; });
  // 30스테이지 보스 HUD
  await page.evaluate(() => window.__jp.startStage(30));
  await page.waitForTimeout(500);
  await page.evaluate(() => window.__jp.closeCard());
  await page.waitForTimeout(200);
  await scan('boss');
  if (tag === '390') await page.screenshot({ path: path.join(shots, `en-07-boss-${tag}.png`) });
  check(`(${label}) 영어 화면에 한국어 글자 없음·가로 스크롤 없음`, Object.keys(found).length === 0, JSON.stringify(found));
  check(`(${label}) 콘솔 에러 없음`, errors.length === 0, errors.join(' | '));
  await ctx.close();
}

// 4) 영어 컷신 30개: 한국어 없음, 말풍선이 화면 안, 끝까지 넘기면 닫힘. 초대장 카드는 영어 어순
{
  console.log('영어 컷신 30개');
  const page = await browser.newPage({ viewport: { width: 360, height: 640 }, locale: 'en-US' });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url);
  const bad = [];
  for (let id = 1; id <= 30; id++) {
    await page.evaluate(id => { window.__done = false; window.JellyStory.open(id, () => { window.__done = true; }); }, id);
    await page.waitForTimeout(60);
    const n = await page.evaluate(() => document.querySelectorAll('#story .cs-dots i').length);
    for (let i = 0; i < n * 2 + 2 && await page.$('#story'); i++) {
      const lay = await page.evaluate(() => {
        const box = document.getElementById('csBox').getBoundingClientRect();
        const ko = [...document.querySelectorAll('#story *')].map(e => e.childNodes).flatMap(c => [...c]).filter(t => t.nodeType === 3 && /[가-힣]/.test(t.nodeValue)).map(t => t.nodeValue);
        return { ko, out: box.bottom > innerHeight + 1 || box.top < 0, sx: document.documentElement.scrollWidth > innerWidth };
      });
      if (lay.ko.length || lay.out || lay.sx) { bad.push(id + JSON.stringify(lay)); break; }
      await page.click('#csNext');
    }
    if (await page.$('#story') || !(await page.evaluate(() => window.__done))) bad.push(id + ':not closed');
  }
  check('영어 컷신 30개: 한국어 없음, 대사 상자가 화면 안, 끝까지 넘기면 닫힘 (360x640)', bad.length === 0, bad.join(' | '));
  const card = await page.evaluate(async () => {
    const S = window.JellyStory, wait = ms => new Promise(r => setTimeout(r, ms));
    S.open(24, () => {}); await wait(50);
    for (let i = 0; i < 4; i++) { document.getElementById('csNext').click(); await wait(20); }
    const t = document.getElementById('csCard').textContent.replace(/\s+/g, ' ').trim();
    S.close();
    return t;
  });
  check('초대장 카드: "Will you come to my birthday party?" + "— Nonom"', card.startsWith('Will you come to my birthday party?') && card.endsWith('— Nonom'), card);
  check('컷신 콘솔 에러 없음', errors.length === 0, errors.join(' | '));
  await page.close();
}

await browser.close();
console.log(`\n결과: 통과 ${pass} / 실패 ${fail}`);
process.exit(fail ? 1 : 0);
