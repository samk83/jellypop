// monetize-config.js — 광고·결제 설정 (여기 값만 바꾸면 된다. 코드는 monetize.js)
// 지금은 계정이 없어서 진짜 광고·결제는 꺼져 있다. Owner가 계정을 만든 뒤 빈 칸('')에 ID를 채우면 켜진다.
// 자세한 순서: docs/MONETIZATION.md 의 "Owner가 할 일"
//
// 시험해 보기: 주소 끝에 ?monetize=mock 을 붙이면 가짜 광고(2초)·가짜 결제로 버튼 흐름을 볼 수 있다. (돈·계정 필요 없음)
window.JellyMonetizeConfig = {
  enabled: true,              // false 면 광고·상점 버튼을 모두 숨긴다
  continuePerStage: 1,        // 실패했을 때 "광고 보고 이어하기" 가능 횟수 (스테이지 한 판마다)

  // ---- 웹(젤리독·PWA) ----
  // 'none' = 광고 없음 / 'h5' = Google H5 게임 광고(Ad Placement API, AdSense 승인 필요)
  web: {
    provider: 'none',
    h5: { client: '', test: true },   // client 예: 'ca-pub-1234567890123456'. 승인 전에는 test: true
  },

  // ---- 안드로이드·아이폰 앱(Capacitor) — AdMob ----
  // 비어 있으면 Google 공식 "테스트 광고"가 나온다 (돈 안 됨, 개발 확인용). 출시 전에 진짜 ID로 바꾸기
  admob: {
    testing: true,
    childDirected: false,      // 13세 미만 대상 앱으로 등록하면 true (Families 정책)
    android: { rewarded: '', banner: '' },
    ios: { rewarded: '', banner: '' },
    bannerOnMap: false,        // 지도 화면 아래 배너 광고 (기본 끔 — 게임 화면을 가리지 않게)
  },

  // ---- 토스 앱인토스(미니앱) ----
  toss: { rewardedAdGroupId: '' },   // 앱인토스 콘솔 → 광고 그룹 ID

  // ---- 인앱 구매 상품 ----
  // id 는 Google Play Console·App Store Connect·앱인토스 콘솔에 같은 이름으로 만들어야 한다
  products: [
    {
      id: 'jellypop_supporter',
      type: 'non-consumable',               // 한 번 사면 계속 (복원 가능)
      grants: ['noads', 'freecontinue'],    // 광고 없음 + 광고 없이 이어하기
      price: { KRW: 3300, USD: 2.99 },      // 표시용 기본값. 실제 가격은 스토어에서 받아 온다
      title: { ko: '말랑이 후원 팩', en: 'Mallang Supporter Pack' },
      desc: { ko: '광고 없이 이어하기 + 배너 광고 없음', en: 'Continue without ads + no banner ads' },
    },
  ],
};
