# FEATURES — 기능 → 파일 지도

## v0.4 버블 슈터 (`index.html`)
| 기능 | 위치 |
|---|---|
| 스테이지 표 30개(이름·테마·발사 수·색·친구·판·특수 거품·방해 요소·보스 단계) | `stages.js` (`JellyStages.STAGES/WORLDS/INFO`) |
| 방해 요소 상태·예고·발사 후 처리·시계 | `makeHz()`, `hazardsAfterShot()`, `tickHazards()`, `lowerCeiling()`, `bossPhases()` |
| 구름·꼬마 놈놈 | `spawnCloud()`, `punchCloud()`, `nomPeek()`, `nomAct()`, `nomHit()` |
| 방해 요소 설명 카드(처음 한 번) | `#hzCard`, `showHzCard()` |
| 특수 거품·놈놈·보스·소품 그림 | `gummy.js` (`bubbleExtra`, `nomnom`, `boss({kind})`) |
| 거품 판 규칙(이웃·붙기·3개 터뜨리기·떨어뜨리기·조준 길) | `const Board = {…}` |
| 발사·순서 바꾸기·조준 각도(핸들 회전) | `shoot()`, `swapQueue()`, `setAngle()` |
| 붙은 뒤 처리(점수·구출·보스 피해) / 다음 차례·실패 판정 | `land()`, `afterSettle()`, `finish()` |
| 그림(거품·젤리·보스·대포·말랑이·줄 선 친구들) | `bubbleSprite()`, `drawJelly()`, `drawBoss()`, `drawCannonArea()` |
| 스테이지 배경 30종(월드 2~5는 `worldArt`) | `background(theme)`, `worldArt()` |
| 프롤로그 4컷 | `SLIDES`, `slideArt()` |
| 모험 지도 5월드(이전/다음)·말랑이와 친구들 걷기 | `renderMap()`, `mapArtWorld()`, `MAP_LOOK` |
| 결과 창·스티커 | `showResult()` |
| 스티커 북(30칸·스탬프) | `renderBook()` |
| 저장(별·스티커·프롤로그 본 적) | `P`, `saveP()` (localStorage `jellypop2.progress`) |
| 테스트용 손잡이 | `window.__jp` (`evalShot`, `advance`, `?seed=`) |

## v0.1 톡 터뜨리기 (`classic.html`, 보관)
| 기능 | 위치 |
|---|---|
| 규칙(묶음 찾기·폭탄·점수·레벨) | `const Logic = {…}` |
| 젤리 그리기 | `jellyShape()`, `drawJelly()` |

## 테스트
| 파일 | 내용 |
|---|---|
| `tests/bubble.test.mjs` | v0.2: 규칙, 휴대폰 3기종, PC 자동 플레이 1~6, 난이도(시드 10개) |
| `tests/stages30.test.mjs` | v0.4: 특수 거품·방해 요소·놈놈·시계·보스 단계·휴대폰 3기종·월드 전환·완주·난이도(10시드×30) |
| `tests/game.test.mjs` | v0.1 (`classic.html`) |
| `design/screens/v2-*.png` | 테스트가 자동으로 찍는 v0.2 화면 캡처 |
