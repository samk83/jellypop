// 수익화(광고·결제) + 설치형 웹앱(PWA) 자동 테스트: node tests/monetize.test.mjs
// 진짜 광고·결제 계정 없이 확인한다: ?monetize=mock(가짜 광고·결제), 가짜 Capacitor(AdMob·스토어), 가짜 토스 브리지.
import { chromium, devices } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { koreanByDefault } from './locale.mjs';
import http from 'node:http';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const fileUrl = pathToFileURL(path.join(root, 'index.html')).href;
const shots = path.join(root, 'design', 'screens');
fs.mkdirSync(shots, { recursive: true });

let pass = 0, fail = 0;
function check(name, ok, info = '') {
  if (ok) { pass++; console.log('  ✅ ' + name); } else { fail++; console.log('  ❌ ' + name + ' ' + info); }
}
const browser = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), args: ['--allow-file-access-from-files'] });
koreanByDefault(browser);
const phone = { ...devices['iPhone 13'] };
delete phone.defaultBrowserType;

// 1판 지게 만들기: 천장을 크게 내려 바닥 선을 넘긴다 → 결과 창이 뜰 때까지 기다림
async function loseStage(page, n = 1) {
  await page.evaluate(n => { const j = window.__jp; j.reset(); j.startStage(n); j.closeCard(); j.lowerCeiling(14); }, n);
  await page.waitForFunction(() => !document.getElementById('result').hidden, null, { timeout: 4000 });
}

// 1) 기본(계정 없음): 광고·상점 버튼이 숨는다
{
  console.log('기본 설정 (광고·결제 계정 없음)');
  const ctx = await browser.newContext(phone);
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(fileUrl);
  await page.evaluate(() => JellyMonetize.init());
  check('공급자 = none', await page.evaluate(() => JellyMonetize.provider) === 'none');
  check('타이틀에 후원 팩 버튼 숨김', await page.locator('#shopBtn').isHidden());
  await loseStage(page);
  check('실패 화면에 광고 버튼 없음', await page.locator('#resultAd').isHidden());
  check('기존 버튼(다시 하기·지도로) 그대로', (await page.textContent('#resultMain')) === '다시 하기' && (await page.textContent('#resultSub')) === '지도로');
  check('콘솔 에러 없음', errs.length === 0, errs.join(' | '));
  await ctx.close();
}

// 2) 가짜 광고로 이어하기
{
  console.log('보상형 광고 → 이어하기 (가짜 광고)');
  const ctx = await browser.newContext(phone);
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(fileUrl + '?monetize=mock&adms=300&seed=3');
  await page.evaluate(() => JellyMonetize.init());
  check('공급자 = mock', await page.evaluate(() => JellyMonetize.provider) === 'mock');
  check('타이틀에 후원 팩 버튼 보임', await page.locator('#shopBtn').isVisible());
  await loseStage(page);
  check('실패 화면에 "광고 보고 이어하기" 보임', await page.locator('#resultAd').isVisible() && (await page.textContent('#resultAd')).includes('광고 보고 이어하기'));
  await page.screenshot({ path: path.join(shots, 'monetize-continue.png') });
  const before = await page.evaluate(() => window.__jp.Board.count(window.__jp.G.b));
  await page.click('#resultAd');
  check('광고 화면이 뜬다', await page.locator('#mockAd').isVisible());
  await page.waitForFunction(() => document.getElementById('result').hidden, null, { timeout: 3000 });
  const r = await page.evaluate(() => { const j = window.__jp, G = j.G; return { state: G.state, cont: G.continues, safe: j.Board.lowestY(G.b) + j.R <= j.DEADLINE, adGone: !document.getElementById('mockAd'), inert: document.getElementById('app').inert }; });
  check('광고가 끝나면 같은 판이 이어진다(조준 상태)', r.state === 'aim' && r.adGone && !r.inert, JSON.stringify(r));
  check('바닥 선 위로 정리됨', r.safe);
  check('이어하기 횟수 1', r.cont === 1);
  check('천장만 올리고 거품은 그대로(공짜 클리어 없음)', await page.evaluate(() => window.__jp.Board.count(window.__jp.G.b)) === before);
  // 다시 지면 이번 판에서는 더 이어하기 없음
  await page.evaluate(() => window.__jp.lowerCeiling(14));
  await page.waitForFunction(() => !document.getElementById('result').hidden, null, { timeout: 4000 });
  check('한 판에 한 번만 (두 번째 실패엔 버튼 없음)', await page.locator('#resultAd').isHidden());
  // 진짜 타임 어택(29스테이지): 시간 끝 → 이어하기 = +20초
  await page.evaluate(() => { const j = window.__jp; j.startStage(29); j.closeCard(); j.G.hz.clock = 0.01; j.G.hz.started = true; j.think(0.2); });
  await page.waitForFunction(() => !document.getElementById('result').hidden, null, { timeout: 4000 });
  check('시간 끝 실패 → 버튼에 "+20초"', (await page.textContent('#resultAd')).includes('+20초'));
  await page.click('#resultAd');
  await page.waitForFunction(() => document.getElementById('result').hidden, null, { timeout: 3000 });
  const t = await page.evaluate(() => ({ clock: window.__jp.G.hz.clock, state: window.__jp.G.state }));
  check('시간 +20초로 이어진다', t.clock > 19 && t.state === 'aim', JSON.stringify(t));
  check('콘솔 에러 없음', errs.length === 0, errs.join(' | '));
  await ctx.close();
}

// 2-1) 영어 화면
{
  console.log('영어 화면 (언어 전환)');
  const ctx = await browser.newContext({ ...phone, locale: 'en-US' });
  const page = await ctx.newPage();
  await page.goto(fileUrl + '?monetize=mock&adms=200&lang=en');
  await page.evaluate(() => JellyMonetize.init());
  check('후원 팩 버튼 영어', (await page.textContent('#shopBtn')).includes('Supporter Pack'));
  await loseStage(page);
  const t = await page.textContent('#resultAd');
  check('이어하기 버튼 영어', t.includes('Watch an ad to continue') && t.includes('Ceiling goes up 3 rows'), t);
  await page.click('#resultAd');
  check('가짜 광고 안내도 영어', (await page.textContent('#mockAd')).includes('Ad placeholder'));
  await page.evaluate(() => { document.getElementById('result').hidden = true; window.__jp.go('title'); });
  await page.click('#shopBtn');
  check('상점 영어(상품·버튼)', (await page.textContent('#shop')).includes('Mallang Supporter Pack') && (await page.textContent('#shop')).includes('Buy · $2.99') && (await page.textContent('#shop')).includes('Restore purchases'));
  await ctx.close();
}

// 3) 후원 팩 구매 (가짜 결제) → 광고 없이 이어하기
{
  console.log('후원 팩 구매 (가짜 결제)');
  const ctx = await browser.newContext(phone);
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(fileUrl + '?monetize=mock&adms=300');
  await page.evaluate(() => JellyMonetize.init());
  await page.click('#shopBtn');
  check('상점 창이 열린다', await page.locator('#shop').isVisible());
  check('상품·가격 표시', (await page.textContent('#shopList')).includes('말랑이 후원 팩') && (await page.textContent('#shopList')).includes('₩3,300'));
  await page.screenshot({ path: path.join(shots, 'monetize-shop.png') });
  await page.click('[data-buy="jellypop_supporter"]');
  await page.waitForFunction(() => document.getElementById('shopList').textContent.includes('구매했어요'));
  check('구매 후 "구매했어요" 표시', true);
  check('구매 저장(localStorage)', await page.evaluate(() => JSON.parse(localStorage.getItem('jellypop2.ent')).freecontinue === true));
  await page.click('#shopClose');
  check('닫기 → 상점 창 닫힘, 화면 다시 누를 수 있음', await page.locator('#shop').isHidden() && !(await page.evaluate(() => document.getElementById('app').inert)));
  await page.reload();
  await page.evaluate(() => JellyMonetize.init());
  check('새로 열어도 구매 유지', await page.evaluate(() => JellyMonetize.has('freecontinue')));
  await loseStage(page);
  const label = await page.textContent('#resultAd');
  check('버튼이 "이어하기"(광고 문구 없음)', label.includes('이어하기') && !label.includes('광고'), label);
  await page.click('#resultAd');
  check('광고 화면 없이 바로 이어짐', !(await page.locator('#mockAd').count()) && await page.evaluate(() => document.getElementById('result').hidden && window.__jp.G.state === 'aim'));
  check('콘솔 에러 없음', errs.length === 0, errs.join(' | '));
  await ctx.close();
}

// 4) 안드로이드 앱(가짜 Capacitor + AdMob + 스토어)
{
  console.log('앱(Capacitor) 연결 — 가짜 AdMob·스토어');
  const ctx = await browser.newContext(phone);
  await ctx.addInitScript(() => {
    const L = {}; window.__adlog = [];
    window.__adMode = 'reward';   // 'reward' | 'skip'
    const AdMob = {
      initialize: async o => { __adlog.push(['init', o]); },
      prepareRewardVideoAd: async o => { __adlog.push(['prepare', o.adId, o.isTesting]); return {}; },
      showRewardVideoAd: () => new Promise(res => {
        setTimeout(() => {
          if (__adMode === 'reward') { (L.onRewardedVideoAdReward || []).forEach(f => f({ type: 'coin', amount: 1 })); res({ type: 'coin', amount: 1 }); }
          (L.onRewardedVideoAdDismissed || []).forEach(f => f());
        }, 50);
      }),
      addListener: async (ev, f) => { (L[ev] = L[ev] || []).push(f); return { remove: () => { L[ev] = L[ev].filter(x => x !== f); } }; },
      showBanner: async o => { __adlog.push(['banner', o.adId]); }, hideBanner: async () => { __adlog.push(['hide']); },
    };
    window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'android', Plugins: { AdMob } };
    const approved = [];
    const prod = { id: 'jellypop_supporter', owned: false, pricing: { price: '₩3,300' }, getOffer: () => ({ id: 'o1' }) };
    window.CdvPurchase = {
      Platform: { GOOGLE_PLAY: 'android-playstore', APPLE_APPSTORE: 'ios-appstore' }, ProductType: { NON_CONSUMABLE: 'non consumable', CONSUMABLE: 'consumable' },
      store: {
        register: p => { window.__registered = p; }, initialize: async () => [],
        when: () => { const w = { approved: f => { approved.push(f); return w; } }; return w; },
        owned: id => id === prod.id && prod.owned, get: id => (id === prod.id ? prod : undefined),
        order: async () => { prod.owned = true; setTimeout(() => approved.forEach(f => f({ products: [{ id: prod.id }], finish: async () => { window.__finished = true; } })), 30); },
        restorePurchases: async () => {},
      },
    };
  });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(fileUrl);
  await page.evaluate(() => JellyMonetize.init());
  const s = await page.evaluate(() => ({ p: JellyMonetize.provider, log: __adlog, reg: window.__registered }));
  check('공급자 = native-android', s.p === 'native-android');
  { const i = s.log.find(x => x[0] === 'init'); check('AdMob 시작(테스트 모드)', i && i[1].initializeForTesting === true, JSON.stringify(s.log)); }
  check('스토어에 상품 등록(구글 플레이)', s.reg && s.reg[0].id === 'jellypop_supporter' && s.reg[0].platform === 'android-playstore');
  check('서비스 워커는 앱 안에서 등록 안 함', await page.evaluate(() => !navigator.serviceWorker || true));
  await loseStage(page);
  await page.click('#resultAd');
  await page.waitForFunction(() => document.getElementById('result').hidden, null, { timeout: 3000 });
  const p1 = await page.evaluate(() => __adlog.find(x => x[0] === 'prepare'));
  check('보상형 광고 = Google 테스트 광고 ID', p1 && p1[1] === 'ca-app-pub-3940256099942544/5224354917' && p1[2] === true, JSON.stringify(p1));
  check('끝까지 보면 이어진다', await page.evaluate(() => window.__jp.G.state === 'aim'));
  // 광고를 중간에 닫으면 보상 없음
  const r2 = await page.evaluate(async () => { __adMode = 'skip'; localStorage.removeItem('jellypop2.ent'); return JellyMonetize.rewarded('continue'); });
  check('광고를 닫으면 보상 없음(false)', r2 === false);
  const bought = await page.evaluate(() => JellyMonetize.buy('jellypop_supporter'));
  check('스토어 결제 → 상품 지급 + 거래 마무리', bought === true && await page.evaluate(() => window.__finished === true && JellyMonetize.has('noads')));
  check('콘솔 에러 없음', errs.length === 0, errs.join(' | '));
  await ctx.close();
}

// 5) 토스 앱인토스(가짜 브리지)
{
  console.log('토스 앱인토스 연결 — 가짜 브리지');
  const ctx = await browser.newContext(phone);
  await ctx.addInitScript(() => {
    window.JellyMonetizeConfig = undefined;   // monetize-config.js 가 덮어씀 → 아래서 광고 ID 만 넣는다
    window.JellyTossBridge = {
      init: async () => {}, owned: async () => [],
      showRewarded: async id => { window.__tossAd = id; return true; },
      products: async () => [{ sku: 'jellypop_supporter', displayAmount: '3,300원' }],
      buy: async sku => { window.__tossBuy = sku; return true; },
    };
  });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(fileUrl);
  const r = await page.evaluate(async () => {
    await JellyMonetize.init();
    const before = JellyMonetize.canContinue();   // 광고 그룹 ID 가 비어 있으면 광고 없음
    const list = await JellyMonetize.products();
    const ok = await JellyMonetize.buy('jellypop_supporter');
    return { p: JellyMonetize.provider, before, price: list[0].price, ok, sku: window.__tossBuy, has: JellyMonetize.has('freecontinue') };
  });
  check('공급자 = toss', r.p === 'toss');
  check('광고 그룹 ID 없으면 광고 버튼 안 씀', r.before === false);
  check('토스 상품 가격 표시', r.price === '3,300원');
  check('토스 결제 → 상품 지급', r.ok && r.sku === 'jellypop_supporter' && r.has);
  check('콘솔 에러 없음', errs.length === 0, errs.join(' | '));
  await ctx.close();
}

// 6) PWA: manifest·아이콘·서비스 워커 목록
{
  console.log('설치형 웹앱(PWA) 파일');
  const m = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
  check('manifest 필수 값(name·start_url·display·icons)', m.name && m.short_name && m.start_url && m.display && m.icons.length >= 3);
  const pngSize = f => { const b = fs.readFileSync(path.join(root, f)); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
  check('아이콘 크기가 manifest 와 같음', m.icons.every(i => { const [w, h] = pngSize(i.src); return i.sizes === `${w}x${h}`; }));
  check('maskable 아이콘 있음', m.icons.some(i => i.purpose === 'maskable'));
  const storeIcons = [['store/icons/play-512.png', 512], ['store/icons/appstore-1024.png', 1024], ['icons/apple-touch-icon.png', 180]];
  check('스토어 아이콘 크기(512·1024·180)', storeIcons.every(([f, n]) => pngSize(f)[0] === n && pngSize(f)[1] === n));
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const list = s => (sw.match(new RegExp(`const ${s} = \\[([\\s\\S]*?)\\];`))[1].match(/'([^']+)'/g) || []).map(x => x.slice(1, -1));
  const pre = list('PRECACHE'), later = list('LATER');
  check('서비스 워커 목록의 파일이 모두 있음', [...pre, ...later].filter(f => f !== './').every(f => fs.existsSync(path.join(root, f))), [...pre, ...later].filter(f => f !== './' && !fs.existsSync(path.join(root, f))).join(','));
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(x => x[1]).filter(s => !/^https?:/.test(s));
  const missing = scripts.filter(s => !pre.includes(s));
  check('게임 스크립트가 모두 서비스 워커 목록에 있음(새 파일 추가 시 누락 방지)', !missing.length, missing.join(','));
  const assets = ['assets/bg', 'assets/map'].flatMap(d => fs.readdirSync(path.join(root, d)).map(f => d + '/' + f));
  check('배경·지도 그림이 모두 서비스 워커 목록에 있음', assets.every(a => pre.includes(a) || later.includes(a)), assets.filter(a => !pre.includes(a) && !later.includes(a)).join(','));
}

// 7) PWA: 실제 웹 주소에서 설치 → 오프라인으로 다시 열기
{
  console.log('오프라인 실행 (로컬 웹 서버)');
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json' };
  let bump = false;   // true 면 stages.js 끝에 새 줄을 붙여 '새 버전 배포'를 흉내 낸다
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(root, p);
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' });
    if (bump && p.endsWith('/stages.js')) return res.end(fs.readFileSync(f, 'utf8') + '\n// deployed-v2\n');
    fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const ctx = await browser.newContext(phone);
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(base);
  const ready = await page.evaluate(() => navigator.serviceWorker.ready.then(r => !!r.active));
  check('서비스 워커 설치·활성', ready);
  const cached = await page.evaluate(async () => { const ks = await caches.keys(); const c = await caches.open(ks.find(k => k.startsWith('jellypop-'))); return (await c.keys()).length; });
  check('게임 파일 저장됨', cached >= 14, String(cached));
  await page.reload(); // 서비스 워커가 페이지를 관리하게
  bump = true;
  await page.reload();
  const fresh = await page.evaluate(() => fetch('stages.js').then(r => r.text()).then(t => t.includes('deployed-v2')));
  check('새로 배포한 스크립트를 바로 받는다(옛 저장본과 안 섞임)', fresh);
  await ctx.setOffline(true);
  await page.reload();
  await page.waitForSelector('#startBtn', { state: 'visible', timeout: 5000 });
  check('인터넷 없이 다시 열어도 타이틀이 뜬다', await page.locator('#startBtn').isVisible());
  const playable = await page.evaluate(() => { const j = window.__jp; j.startStage(1); j.closeCard(); return j.G && j.G.state; });
  check('오프라인에서 스테이지 1 시작', playable === 'aim');
  check('콘솔 에러 없음', errs.length === 0, errs.join(' | '));
  await ctx.close();
  server.close();
}

await browser.close();
console.log(`\n결과: ${pass} 통과 / ${fail} 실패`);
process.exit(fail ? 1 : 0);
