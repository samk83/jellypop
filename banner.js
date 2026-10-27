// banner.js — 플레이 화면 위쪽 배너 내용 (여기만 고치면 배너가 바뀐다)
// items 가 여러 개면 5초마다 넘어간다. 비우면([]) 배너가 숨겨진다.
//   tag: 왼쪽 위 작은 딱지 · title: 큰 글씨 · sub: 작은 글씨 · button: 오른쪽 버튼 글자(없으면 버튼 숨김)
//   url: 버튼을 누르면 열 주소(없으면 '곧 열려요!' 안내) · art: 'cotton' | 'gift' | 'star' (왼쪽 그림)
window.JellyBanner = {
  items: [
    { tag: T('이벤트'), title: T('솜사탕 축제 오픈!'), sub: T('3판 깨면 무지개 거품 선물'), button: T('보기'), art: 'cotton' },
    { tag: T('알림'), title: T('천장이 내려와요!'), sub: T('위쪽 시간 게이지를 잘 보세요'), art: 'star' },
  ],
  every: 5,   // 초
};
