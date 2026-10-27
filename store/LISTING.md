# 스토어 등록 글 (한국어 / English)

복사해서 Google Play Console · App Store Connect · 앱인토스 콘솔에 붙여 넣는다. 글자 수 제한 안에 맞춰 둠.
그림: 아이콘 `store/icons/`, 스크린샷 `store/screenshots/<ko|en>/` (`npm run shots` 로 다시 찍기), 개인정보처리방침 `privacy.html`.

## 기본 정보

| 항목 | 값 |
|---|---|
| 패키지 / 번들 ID | `com.jellydock.jellypop` (안드로이드·아이폰 같음) |
| 토스 appName | `jellypop` |
| 카테고리 | 게임 → 퍼즐 (Puzzle) / 보조: 캐주얼 |
| 가격 | 무료 (인앱 구매 있음 · 광고 있음) |
| 인앱 상품 | `jellypop_supporter` · 비소모성(Non-consumable) · ₩3,300 / US$2.99 · "말랑이 후원 팩 / Mallang Supporter Pack" |
| 연령 | 전체 이용가(폭력·도박·채팅·위치 없음). 광고는 일반 등급(General)만 |
| 개인정보처리방침 URL | `https://jellydock.com/jellypop/privacy.html` (젤리독 출시 후) |
| 지원 이메일 | **Owner 입력 필요** |

---

## 한국어

**앱 이름 (30자)**: 젤리팝 - 젤리마을 대소동

**짧은 설명 (Google Play 80자)**: 말랑이와 거품을 쏘아 갇힌 젤리 친구 30명을 구하는 말랑말랑 버블 슈터!

**부제 (App Store 30자)**: 거품 쏘아 젤리 친구 구하기

**키워드 (App Store 100자)**: 버블,버블슈터,퍼즐,젤리,귀여운,캐주얼,구슬,팡,오프라인,스테이지,보스,힐링

**자세한 설명**
```
젤리마을에 대소동이 났어요! 장난꾸러기 노놈이 젤리 친구들을 거품 속에 가둬 버렸어요.
분홍 젤리 말랑이와 함께 대포를 돌려 같은 색 거품 3개를 맞추고, 친구들을 구해 주세요!

● 손가락 하나로 쉽게
대포 근처를 좌우로 끌어 조준하고, 손을 떼면 발사! 같은 색 3개가 붙으면 펑!

● 30개 스테이지 · 5개 월드 · 보스 4마리
젤리마을, 시럽 숲, 푸딩 동굴, 디저트 공장, 그리고 노놈의 성까지.
천장이 내려오고, 안개가 끼고, 놈놈이 친구를 훔쳐 가요. 폭탄 거품과 랜덤 거품으로 역전해 보세요!

● 스티커 북과 이야기
스테이지를 깰 때마다 친구 스티커를 모으고, 노놈의 생일 초대장에 얽힌 이야기를 따라가요.

● 말랑말랑 3D 젤리 그림과 8비트 음악
반짝이는 구미 젤리 친구들과 신나는 레트로 배경음악.

● 인터넷 없이도 OK
한 번 받으면 어디서나 플레이할 수 있어요.

광고는 원할 때만! 실패했을 때 "광고 보고 이어하기"를 고를 수 있고, "말랑이 후원 팩"을 사면 광고 없이 이어할 수 있어요.
```

**새 기능 (첫 출시)**: 젤리팝이 처음 나왔어요! 30개 스테이지에서 젤리 친구들을 구해 주세요.

---

## English

**App name (30)**: Jelly Pop - Bubble Rescue

**Short description (Play, 80)**: Aim, pop and rescue 30 squishy jelly friends in this cute bubble shooter!

**Subtitle (App Store, 30)**: Pop bubbles, rescue jellies

**Keywords (App Store, 100)**: bubble,shooter,puzzle,jelly,cute,casual,pop,offline,match 3,boss,relaxing,kawaii

**Full description**
```
Trouble in Jelly Village! Mischievous Nonom has trapped the jelly friends inside bubbles.
Team up with Mallang the pink jelly, aim the cannon, match 3 bubbles of the same color and set your friends free!

● Easy one-finger play
Drag left and right near the cannon to aim, release to shoot. Match 3 and POP!

● 30 stages · 5 worlds · 4 bosses
Jelly Village, Syrup Forest, Pudding Cave, Dessert Factory and Nonom's Castle.
Falling ceilings, fog and sneaky Nomnoms stealing friends — turn the tables with bomb and mystery bubbles!

● Sticker book and story
Collect a friend sticker for every stage and follow the tale of Nonom's birthday invitation.

● Squishy 3D jelly art and 8-bit music
Shiny gummy friends and a cheerful retro soundtrack.

● Plays offline
Download once, play anywhere.

Ads only when you want them: choose "Watch an ad to continue" after a loss, or get the Mallang Supporter Pack to continue without ads.
```

**What's new (first release)**: Jelly Pop is here! Rescue the jelly friends across 30 stages.

---

## 설문 답변 가이드

### Google Play — 데이터 보안(Data safety)
| 질문 | 답 |
|---|---|
| 데이터를 수집하거나 공유하나요? | 예 (AdMob SDK 때문) |
| 수집 항목 | 기기 또는 기타 ID(광고 ID) · 앱 활동(앱 상호작용) · 앱 정보 및 성능(비정상 종료 로그, 진단) |
| 목적 | 광고 또는 마케팅 · 분석 · 사기 방지/보안 |
| 공유 | 예 — 광고 ID 를 광고 목적으로 Google 과 공유 |
| 전송 중 암호화 | 예 |
| 삭제 요청 방법 | 계정 없음(기기 안에만 저장, 앱 삭제 시 삭제) |

### Google Play — 콘텐츠 등급(IARC) · 타깃층
- 폭력·공포·성적 내용·욕설·약물·도박 없음, 사용자 간 소통 없음, 위치 공유 없음, 디지털 상품 구매 있음.
- 타깃 연령: **13세 이상 포함**으로 시작 권장 (13세 미만 포함 시 Families 정책 → `monetize-config.js` 의 `childDirected: true` + 가족용 인증 광고만). 결정은 Owner.

### App Store — 앱 개인정보 보호(Privacy Nutrition Label)
| 데이터 | 용도 | 사용자와 연결 | 추적 |
|---|---|---|---|
| 식별자 → 기기 ID | 제3자 광고 | 아니요 | 아니요 (추적 권한 요청 안 함 → 맞춤 광고 제한) |
| 사용 데이터 → 광고 데이터 | 제3자 광고 | 아니요 | 아니요 |
| 진단 → 충돌 데이터 | 앱 기능 | 아니요 | 아니요 |

### 앱인토스
- 게임 등급: 게임물관리위원회 등급분류 또는 **스토어 링크**(Google Play 출시 후 링크 제출이 가장 쉬움).
- 결제(후원 팩): **사업자등록 필요**. 광고만이면 등록 없이 시작 가능(예상 수익 ₩5,000 넘으면 5영업일 안에 등록).
