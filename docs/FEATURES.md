# FEATURES — 기능 → 파일 지도

| 기능 | 파일 | 위치 |
|---|---|---|
| 게임 전체(화면·규칙·그리기·소리) | `index.html` | 한 파일, 외부 라이브러리 없음 |
| 규칙(묶음 찾기·폭탄·점수·레벨) | `index.html` | `const Logic = {…}` |
| 터치 처리 | `index.html` | `tap()`, `pointerdown` |
| 젤리 그리기(색별 모양·얼굴) | `index.html` | `jellyShape()`, `drawJelly()` |
| 자동 테스트 | `tests/game.test.mjs` | `npm test` |
| 시안 캡처 | `design/screens/*.png` | 테스트가 자동 생성 |
