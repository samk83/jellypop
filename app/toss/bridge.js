// 토스 앱인토스 연결(브리지) — @apps-in-toss/web-framework 를 번들해서 window.JellyTossBridge 를 만든다.
// 게임 쪽 monetize.js 는 이 객체만 보고 토스 광고·결제를 쓴다. (scripts/build.mjs 가 dist/toss-bridge.js 로 묶음)
// API 이름은 @apps-in-toss/web-framework 3.9.0 의 dist/index.d.ts 기준.
import { loadFullScreenAd, showFullScreenAd, IAP, graniteEvent, Screen } from '@apps-in-toss/web-framework';

const loaded = {};
const supported = f => { try { return !!(f && f.isSupported && f.isSupported()); } catch (e) { return false; } };

// 광고 미리 불러오기 (토스 심사 기준: 광고는 미리 로드해 두고 바로 보여 준다)
function preload(adGroupId) {
  if (!adGroupId || !supported(loadFullScreenAd)) return Promise.resolve(false);
  return new Promise(res => {
    loadFullScreenAd({
      options: { adGroupId },
      onEvent: e => { if (e.type === 'loaded') { loaded[adGroupId] = true; res(true); } },
      onError: () => res(false),
    });
  });
}

// 보상형 광고: 끝까지 봐서 userEarnedReward 가 오면 true, 그냥 닫으면 false
async function showRewarded(adGroupId) {
  if (!supported(showFullScreenAd)) return false;
  if (!loaded[adGroupId] && !(await preload(adGroupId))) return false;
  loaded[adGroupId] = false;
  return new Promise(res => {
    let earned = false, done = false;
    const end = v => { if (done) return; done = true; res(v); preload(adGroupId); };
    showFullScreenAd({
      options: { adGroupId },
      onEvent: e => {
        if (e.type === 'userEarnedReward') earned = true;
        else if (e.type === 'dismissed') end(earned);
        else if (e.type === 'failedToShow') end(false);
      },
      onError: () => end(false),
    });
  });
}

async function products() {
  if (!supported(IAP.getProductItemList)) return [];
  try { return (await IAP.getProductItemList()).products || []; } catch (e) { return []; }
}

// 결제: processProductGrant 에서 상품을 지급하고 true 를 돌려줘야 한다(30초 안). 아니면 환불 안내가 뜰 수 있음
function buy(sku) {
  if (!supported(IAP.createOneTimePurchaseOrder)) return Promise.resolve(false);
  return new Promise(res => {
    IAP.createOneTimePurchaseOrder({
      options: {
        sku,
        processProductGrant: () => { if (bridge.onGrant) bridge.onGrant(sku); return true; },
      },
      onEvent: e => { if (e.type === 'success') res(true); },
      onError: () => res(false),
    });
  });
}

// 이미 산 상품(환불 제외) — 다시 설치·다른 기기에서도 복원
async function owned() {
  const has = new Set();
  // 결제는 됐는데 지급이 안 끝난 주문 → 지금 지급하고 완료 처리
  if (supported(IAP.getPendingOrders)) {
    try {
      for (const o of (await IAP.getPendingOrders()).orders || []) {
        has.add(o.sku);
        if (bridge.onGrant) bridge.onGrant(o.sku);
        if (supported(IAP.completeProductGrant)) await IAP.completeProductGrant({ params: { orderId: o.orderId } });
      }
    } catch (e) { /* noop */ }
  }
  if (supported(IAP.getCompletedOrRefundedOrders)) {
    try {
      const status = {};
      let key = null, guard = 0;
      do {
        const r = await IAP.getCompletedOrRefundedOrders(key ? { key } : undefined);
        (r.orders || []).forEach(o => { if (status[o.sku] !== 'REFUNDED') status[o.sku] = o.status; });
        key = r.hasNext ? r.nextKey : null;
      } while (key && guard++ < 20);
      Object.keys(status).forEach(s => { if (status[s] === 'COMPLETED') has.add(s); });
    } catch (e) { /* noop */ }
  }
  return [...has];
}

// 안드로이드 뒤로 가기: 열린 창이 있으면 닫고, 없으면 "게임을 끝낼까요?" 확인 후 닫기 (토스 게임 체크리스트)
function exitConfirm() {
  if (document.getElementById('tossExit')) return;
  const el = document.createElement('div');
  el.id = 'tossExit'; el.setAttribute('role', 'dialog');
  el.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(42,11,78,.55);display:grid;place-items:center;padding:16px';
  const en = window.JellyI18n && window.JellyI18n.lang === 'en';
  el.innerHTML = `<div style="background:#fff;border-radius:22px;padding:20px;width:min(100%,300px);text-align:center;font:800 18px 'Noto Sans KR',sans-serif;color:#5a2d91">
    <p style="margin:0 0 14px">${en ? 'Quit the game?' : '게임을 끝낼까요?'}</p>
    <div style="display:flex;gap:8px"><button id="tossExitNo" class="btn light" style="flex:1;min-height:46px;font-size:16px">${en ? 'Keep playing' : '계속하기'}</button>
    <button id="tossExitYes" class="btn" style="flex:1;min-height:46px;font-size:16px">${en ? 'Quit' : '끝내기'}</button></div></div>`;
  document.body.appendChild(el);
  el.querySelector('#tossExitNo').onclick = () => el.remove();
  el.querySelector('#tossExitYes').onclick = () => { el.remove(); Screen.close().catch(() => {}); };
}
function onBack() {
  const open = ['tossExit', 'shop', 'hzCard'].map(id => document.getElementById(id)).find(n => n && !n.hidden);
  if (open && open.id === 'tossExit') return open.remove();
  if (open && open.id === 'shop') return document.getElementById('shopClose').click();
  exitConfirm();
}

const bridge = {
  isToss: true,
  onGrant: null,   // monetize.js 가 채운다
  init: async () => {
    try { graniteEvent.addEventListener('backEvent', { onEvent: onBack }); } catch (e) { /* noop */ }
    const cfg = (window.JellyMonetizeConfig || {}).toss || {};
    if (cfg.rewardedAdGroupId) preload(cfg.rewardedAdGroupId);
  },
  showRewarded, products, buy, owned,
};
window.JellyTossBridge = bridge;
