// monetize.js — 광고(보상형·배너)와 인앱 구매를 한 곳에서 다루는 모듈
// 게임(index.html)은 플랫폼을 몰라도 된다: JellyMonetize.rewarded() / buy() 만 부른다.
// 어디서 실행되는지에 따라 아래 "공급자(provider)" 하나가 고른다.
//   mock   : 주소에 ?monetize=mock — 가짜 광고·가짜 결제 (시험·자동 테스트용)
//   toss   : 토스 앱인토스 미니앱 안 (app/toss 의 브리지가 window.JellyTossBridge 를 만들어 준다)
//   native : 안드로이드·아이폰 앱(Capacitor) — AdMob 광고 + 스토어 결제(cordova-plugin-purchase)
//   h5     : 웹 + Google H5 게임 광고 (설정 web.provider = 'h5')
//   none   : 광고·결제 없음 → 관련 버튼이 숨는다
// 설정 값: monetize-config.js
window.JellyMonetize = (() => {
  'use strict';
  // 게임 화면에 넣는 문구의 영어 (i18n.js 사전에 추가 — 정적 HTML 은 게임 시작 때 자동 번역, 나중에 넣는 글자는 T())
  if (window.JellyI18n && window.JellyI18n.add) window.JellyI18n.add({
    '▶ 이어하기': '▶ Continue', '▶ 광고 보고 이어하기': '▶ Watch an ad to continue', '천장이 3칸 올라가요': 'Ceiling goes up 3 rows', '시간 +20초': '+20 seconds',
    '이어서 해 봐요!': 'Keep going!', '후원 팩': 'Supporter Pack', '🎁 후원 팩': '🎁 Supporter Pack', '구매 복원': 'Restore purchases', '닫기': 'Close',
    '구매했어요': 'Purchased', '구매하기': 'Buy',
    "구매는 스토어 계정으로 결제돼요. 한 번 사면 다시 설치해도 '구매 복원'으로 돌아와요.": 'Purchases are billed to your store account. Use “Restore purchases” after reinstalling.',
  });
  const CFG = Object.assign({ enabled: true, continuePerStage: 1, web: {}, admob: {}, toss: {}, products: [] }, window.JellyMonetizeConfig || {});
  const KEY = 'jellypop2.ent';
  const listeners = [];
  let provider = null, ready = null;

  // ---------- 산 물건(권한) 저장 ----------
  const ent = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })();
  function grant(productId) {
    const p = CFG.products.find(x => x.id === productId); if (!p) return;
    (p.grants || []).forEach(g => { ent[g] = true; });
    ent['own:' + productId] = true;
    try { localStorage.setItem(KEY, JSON.stringify(ent)); } catch (e) { /* 저장 못 해도 이번 실행에는 적용 */ }
    listeners.forEach(f => { try { f(productId); } catch (e) { /* noop */ } });
  }
  const has = g => !!ent[g];

  // ---------- 글자 (한국어/영어) ----------
  const lang = () => {
    const l = (window.JellyI18n && window.JellyI18n.lang) || document.documentElement.lang || 'ko';
    return String(l).slice(0, 2) === 'en' ? 'en' : 'ko';
  };
  const T = {
    ko: { adLoading: '광고를 불러오는 중…', adFail: '지금은 광고를 볼 수 없어요. 잠시 후 다시 해 봐요.', mockAd: '광고 자리 (시험)', mockSub: '진짜 광고는 계정 연결 후 나와요', buyFail: '결제를 마치지 못했어요.', bought: '고마워요! 후원 팩이 적용됐어요.', restored: '구매 내역을 불러왔어요.', nothing: '복원할 구매가 없어요.' },
    en: { adLoading: 'Loading ad…', adFail: 'No ad available right now. Try again soon.', mockAd: 'Ad placeholder (test)', mockSub: 'Real ads appear after accounts are connected', buyFail: 'The purchase was not completed.', bought: 'Thank you! Supporter Pack is active.', restored: 'Purchases restored.', nothing: 'No purchases to restore.' },
  };
  const t = k => T[lang()][k];

  // ---------- 공급자 고르기 ----------
  function pick() {
    let q = null;
    try { q = new URLSearchParams(location.search).get('monetize'); } catch (e) { /* noop */ }
    if (!CFG.enabled || q === 'off') return makeNone();
    if (q === 'mock') return makeMock();
    if (window.JellyTossBridge) return makeToss(window.JellyTossBridge);
    const cap = window.Capacitor;
    if (cap && cap.isNativePlatform && cap.isNativePlatform()) return makeNative(cap);
    if ((CFG.web || {}).provider === 'h5' && CFG.web.h5 && CFG.web.h5.client) return makeH5(CFG.web.h5);
    return makeNone();
  }

  function makeNone() {
    return { name: 'none', init: async () => {}, canRewarded: () => false, rewarded: async () => false, canBuy: () => false, products: async () => [], buy: async () => false, restore: async () => 0 };
  }

  // 가짜 광고 화면 (mock 공급자 · 기본 HTML 만 사용)
  function fakeAdOverlay(ms) {
    return new Promise(res => {
      const el = document.createElement('div');
      el.id = 'mockAd'; el.setAttribute('role', 'dialog');
      el.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(20,10,40,.92);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;font:800 20px "Noto Sans KR",sans-serif;gap:10px;text-align:center;padding:24px';
      el.innerHTML = `<div>📺 ${t('mockAd')}</div><small style="font-weight:700;font-size:14px;opacity:.8">${t('mockSub')}</small><b id="mockAdSec" style="font-size:30px">${Math.ceil(ms / 1000)}</b>`;
      document.body.appendChild(el);
      const t0 = Date.now();
      const iv = setInterval(() => {
        const left = Math.max(0, ms - (Date.now() - t0));
        const s = el.querySelector('#mockAdSec'); if (s) s.textContent = Math.ceil(left / 1000);
        if (!left) { clearInterval(iv); el.remove(); res(true); }
      }, 100);
    });
  }
  function makeMock() {
    let adMs = 2000;
    try { const v = Number(new URLSearchParams(location.search).get('adms')); if (v >= 0 && location.search.includes('adms=')) adMs = v; } catch (e) { /* noop */ }
    return {
      name: 'mock', init: async () => {}, canRewarded: () => true,
      rewarded: () => fakeAdOverlay(adMs),
      canBuy: () => true,
      products: async () => CFG.products.map(p => ({ id: p.id, title: p.title[lang()], desc: p.desc[lang()], price: lang() === 'en' ? '$' + p.price.USD : '₩' + p.price.KRW.toLocaleString(), owned: has('own:' + p.id) })),
      buy: async id => { grant(id); return true; },
      restore: async () => 0,
    };
  }

  // 토스 앱인토스: 실제 SDK 호출은 app/toss/bridge.js 가 맡는다 (번들된 @apps-in-toss/web-framework)
  function makeToss(B) {
    return {
      name: 'toss',
      init: async () => { B.onGrant = grant; if (B.init) await B.init(); if (B.owned) (await B.owned()).forEach(grant); },
      canRewarded: () => !!(CFG.toss.rewardedAdGroupId && B.showRewarded),
      rewarded: () => B.showRewarded(CFG.toss.rewardedAdGroupId),
      canBuy: () => !!B.buy,
      products: async () => {
        const list = B.products ? await B.products() : [];
        return CFG.products.map(p => { const s = list.find(x => x.sku === p.id) || {}; return { id: p.id, title: p.title[lang()], desc: p.desc[lang()], price: s.displayAmount || '₩' + p.price.KRW.toLocaleString(), owned: has('own:' + p.id) }; });
      },
      buy: async id => { const ok = await B.buy(id); if (ok) grant(id); return ok; },
      restore: async () => { const ids = B.owned ? await B.owned() : []; ids.forEach(grant); return ids.length; },
    };
  }

  // 안드로이드·아이폰 (Capacitor): AdMob = @capacitor-community/admob, 결제 = cordova-plugin-purchase (window.CdvPurchase)
  function makeNative(cap) {
    const os = cap.getPlatform();   // 'android' | 'ios'
    const A = CFG.admob || {}, ids = A[os] || {};
    // Google 공식 테스트 광고 ID (https://developers.google.com/admob/android/test-ads , /ios/test-ads)
    const TEST = { android: { rewarded: 'ca-app-pub-3940256099942544/5224354917', banner: 'ca-app-pub-3940256099942544/9214589741' }, ios: { rewarded: 'ca-app-pub-3940256099942544/1712485313', banner: 'ca-app-pub-3940256099942544/2435281174' } }[os] || {};
    const unit = k => (A.testing || !ids[k]) ? TEST[k] : ids[k];
    const AdMob = cap.Plugins && cap.Plugins.AdMob;
    let store = null, storeReady = false;
    async function initStore() {
      const C = window.CdvPurchase; if (!C) return;
      store = C.store;
      const platform = os === 'ios' ? C.Platform.APPLE_APPSTORE : C.Platform.GOOGLE_PLAY;
      store.register(CFG.products.map(p => ({ id: p.id, platform, type: p.type === 'consumable' ? C.ProductType.CONSUMABLE : C.ProductType.NON_CONSUMABLE })));
      // 결제 승인 → (서버 영수증 확인은 아직 없음: 로컬 확인) → 상품 지급 → 거래 마무리
      store.when().approved(tr => { (tr.products || []).forEach(p => grant(p.id)); tr.finish(); });
      await store.initialize([platform]);
      CFG.products.forEach(p => { if (store.owned(p.id)) grant(p.id); });
      storeReady = true;
    }
    return {
      name: 'native-' + os,
      init: async () => {
        if (AdMob) {
          await AdMob.initialize({ initializeForTesting: !!A.testing, tagForChildDirectedTreatment: !!A.childDirected });
        }
        await new Promise(res => { if (window.CdvPurchase) return res(); document.addEventListener('deviceready', res, { once: true }); setTimeout(res, 4000); });
        try { await initStore(); } catch (e) { console.warn('[monetize] store', e); }
      },
      canRewarded: () => !!AdMob,
      rewarded: async () => {
        // showRewardVideoAd 는 보상을 받았을 때만 끝난다 → 닫힘(Dismissed) 이벤트로 "안 보고 닫음"도 처리
        let earned = false;
        await AdMob.prepareRewardVideoAd({ adId: unit('rewarded'), isTesting: !!A.testing });
        return new Promise(async res => {
          const hs = [];
          const done = v => { hs.forEach(h => h.remove()); res(v); };
          hs.push(await AdMob.addListener('onRewardedVideoAdReward', () => { earned = true; }));
          hs.push(await AdMob.addListener('onRewardedVideoAdDismissed', () => done(earned)));
          hs.push(await AdMob.addListener('onRewardedVideoAdFailedToShow', () => done(false)));
          AdMob.showRewardVideoAd().then(() => { earned = true; }).catch(() => done(false));
        });
      },
      showBanner: async () => { if (AdMob && !has('noads')) await AdMob.showBanner({ adId: unit('banner'), isTesting: !!A.testing, position: 'BOTTOM_CENTER', adSize: 'ADAPTIVE_BANNER' }); },
      hideBanner: async () => { if (AdMob) await AdMob.hideBanner().catch(() => {}); },
      canBuy: () => storeReady,
      products: async () => CFG.products.map(p => {
        const sp = store && store.get(p.id), pr = sp && sp.pricing;
        return { id: p.id, title: p.title[lang()], desc: p.desc[lang()], price: pr ? pr.price : (lang() === 'en' ? '$' + p.price.USD : '₩' + p.price.KRW.toLocaleString()), owned: has('own:' + p.id) };
      }),
      buy: async id => {
        const sp = store && store.get(id), offer = sp && sp.getOffer();
        if (!offer) return false;
        const err = await store.order(offer);
        if (err) return false;
        // approved 콜백에서 지급된다. 잠깐 기다렸다 결과를 알려 준다
        for (let i = 0; i < 40 && !has('own:' + id); i++) await new Promise(r => setTimeout(r, 250));
        return has('own:' + id);
      },
      restore: async () => { if (!store) return 0; await store.restorePurchases(); let n = 0; CFG.products.forEach(p => { if (store.owned(p.id)) { grant(p.id); n++; } }); return n; },
    };
  }

  // 웹: Google H5 게임 광고 (Ad Placement API: adBreak / adConfig)
  // https://developers.google.com/ad-placement/apis
  function makeH5(h5) {
    let ok = false;
    return {
      name: 'h5',
      init: () => new Promise(res => {
        const s = document.createElement('script');
        s.async = true; s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(h5.client);
        s.crossOrigin = 'anonymous'; s.setAttribute('data-ad-client', h5.client);
        if (h5.test) s.setAttribute('data-adbreak-test', 'on');
        s.onload = () => { ok = true; res(); }; s.onerror = () => res();
        document.head.appendChild(s);
        window.adsbygoogle = window.adsbygoogle || [];
        window.adBreak = window.adConfig = o => window.adsbygoogle.push(o);
        window.adConfig({ preloadAdBreaks: 'on', sound: 'on' });
      }),
      canRewarded: () => ok,
      rewarded: () => new Promise(res => {
        let viewed = false, settled = false;
        const end = v => { if (!settled) { settled = true; res(v); } };
        window.adBreak({
          type: 'reward', name: 'continue',
          beforeReward: showAdFn => showAdFn(),
          adViewed: () => { viewed = true; },
          adDismissed: () => end(false),
          adBreakDone: () => end(viewed),   // 광고가 없으면 바로 여기로 (viewed=false)
        });
      }),
      canBuy: () => false, products: async () => [], buy: async () => false, restore: async () => 0,
    };
  }

  // ---------- 공개 API ----------
  function init() {
    if (!ready) {
      provider = pick();
      ready = Promise.resolve().then(() => provider.init()).catch(e => { console.warn('[monetize] init', e); provider = makeNone(); });
    }
    return ready;
  }
  let busy = false;
  const api = {
    init,
    get provider() { return provider ? provider.name : 'none'; },
    has,
    onChange(f) { listeners.push(f); },
    // 이어하기 버튼을 보여 줄지: 후원 팩이 있으면 광고 없이, 아니면 보상형 광고가 될 때만
    canContinue() { return !!provider && CFG.enabled && (has('freecontinue') || provider.canRewarded()); },
    continuePerStage: CFG.continuePerStage,
    // 보상형 광고 → true 면 보상 지급. 후원 팩이 있으면 광고 없이 바로 true
    async rewarded(placement) {
      await init();
      if (has('freecontinue')) return true;
      if (busy || !provider.canRewarded()) return false;
      busy = true;
      try { return !!(await provider.rewarded(placement)); } catch (e) { console.warn('[monetize] ad', e); return false; } finally { busy = false; }
    },
    canShop() { return !!provider && CFG.enabled && provider.canBuy(); },
    products: () => init().then(() => provider.products()),
    async buy(id) { await init(); try { return await provider.buy(id); } catch (e) { console.warn('[monetize] buy', e); return false; } },
    async restore() { await init(); try { return await provider.restore(); } catch (e) { return 0; } },
    showBanner() { return provider && provider.showBanner && CFG.admob.bannerOnMap && !has('noads') ? provider.showBanner().catch(() => {}) : Promise.resolve(); },
    hideBanner() { return provider && provider.hideBanner ? provider.hideBanner().catch(() => {}) : Promise.resolve(); },
    t,
  };
  return api;
})();
