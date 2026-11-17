# 젤리팝 안드로이드(Google Play) 출시 가이드

작성 2026-11-17 · 게임 버전 0.16.0 · 앱 ID `com.jellydock.jellypop`
이 문서 하나만 보고 따라 하면 된다. 파일 경로(android/…, screenshots/…)는 프로젝트 Library의 jellypop-launch/ 폴더 기준. 서명 키는 저장소에 없다.

---

## 0. 지금 준비된 것

| 항목 | 상태 | 파일 |
|---|---|---|
| 출시용 앱 파일(AAB, 서명됨) | ✅ 클라우드에서 실제 빌드·서명 확인 | `android/jellypop-0.16.0-release.aab` (11 MB) |
| 휴대폰 시험 설치용 APK | ✅ 빌드됨 | `android/jellypop-0.16.0-test-install.apk` (14 MB) |
| 업로드 서명 키 + 비밀번호 | ✅ 만들어 둠 | `android/signing-KEEP-SECRET/` (아래 1장 꼭 읽기) |
| 스토어 등록 글(한/영) | ✅ | 저장소 `store/LISTING.md`, 사본 `LISTING.md` |
| 아이콘 512px | ✅ | 저장소 `store/icons/play-512.png` |
| 스크린샷 | ✅ | `screenshots/`, 저장소 `store/screenshots/ko·en` |
| 개인정보처리방침 | ✅ 초안 | `privacy.html` (연락 이메일 칸 비어 있음) |
| 광고 | ⚠️ **Google 테스트 광고** 상태 | 진짜 광고 ID 받으면 Claude가 바꿔서 새 AAB |
| 실제 휴대폰에서 실행 | ❌ 아직 확인 못 함 | 클라우드에 에뮬레이터 가속이 없음 → 사장님 폰으로 확인(3장) |

빌드 확인 내용: 대상 안드로이드 36(Play 요건 35 이상 충족), 버전 0.16.0(코드 1), 결제 라이브러리 9.0(요건 8 이상 충족), 서명 검증 `jar verified`.

---

## 1. 수익모델 — 이렇게 확정

**무료 게임 + "광고 보고 이어하기" + "말랑이 후원 팩" ₩3,300**

| 항목 | 내용 |
|---|---|
| 광고 | 실패했을 때만 "▶ 광고 보고 이어하기"(보상형, 한 판 1번). 판 사이 강제 광고 없음, 배너 없음 |
| 결제 | "말랑이 후원 팩" ₩3,300 한 번 구매(상품 ID `jellypop_supporter`): 광고 없이 이어하기 |
| 안 하는 것 | 구독, 유료 앱, 전면 광고, 뽑기, 에너지(하트 충전 대기) |
| 대상 연령 | 전 연령 캐주얼 퍼즐, 주 대상은 13세 이상 청소년·어른. 콘텐츠 등급은 전체 이용가. Play Console에는 **사실대로** 답함(4-2) |

왜 이걸로 정했나:
1. **이미 만들어져 있다.** 광고 ID만 넣으면 바로 켜진다. 추가 개발 0.
2. **새 게임은 평점·다운로드가 먼저다.** 원할 때만 보는 광고라 별점이 깎이지 않는다. 보상형 광고는 광고 중 단가가 가장 높다.
3. **결제는 보조.** ₩3,300 한 번 구매는 "광고 싫은 사람"을 위한 출구. 구독은 30판짜리 게임에 맞지 않는다.
4. **주 대상은 13세 이상**으로 잡되, Google이 그림 분위기를 보고 "어린이도 대상"이라고 판단하면 가족(Families) 정책을 따른다: 어린이용 광고 설정(`childDirected: true`)으로 바꿔 새 빌드(Claude 30분 작업). 광고 단가는 내려가지만 정책 위반보다 낫다.

예상 수익(가정치): 하루 이용자 200명이면 월 약 ₩5만, 1,000명이면 월 약 ₩28만 (계산식은 MONETIZATION-STORES.md 4장).
**출시 1~2개월 뒤** 숫자를 보고 "이어하기 팩(소모형)"·스킨 팩 추가를 다시 판단한다.

---

## 2. ⚠️ 서명 키 — 제일 중요

`android/signing-KEEP-SECRET/` 폴더의 두 파일:
- `jellypop-upload.jks` = 업로드 키 (앱 파일에 찍는 도장)
- `keystore.properties` = 그 키의 비밀번호

해야 할 일:
1. 프로젝트 Library에서 두 파일을 내려받아 **USB와 구글 드라이브 두 곳에 백업**.
2. 이 파일은 누구에게도 보내지 않는다. 깃허브에는 올라가지 않게 막아 두었다.
3. 백업한 뒤에도 Library에 남겨 두면 Claude가 다음 버전도 같은 키로 만들 수 있다(이 프로젝트는 사장님 혼자만 볼 수 있음). 싫으면 Library에서 지우고, 다음 빌드 때 다시 올려 주면 된다.
4. Play Console에서 **"Play 앱 서명(Play App Signing)" 사용**(기본값)으로 둔다. 그러면 이 키를 잃어버려도 Google에 요청해서 새 업로드 키로 바꿀 수 있다.

---

## 3. 사장님 폰으로 먼저 시험 (10분)

1. 갤럭시 폰에서 Library의 `jellypop-0.16.0-test-install.apk` 를 내려받는다.
2. 누르면 "출처를 알 수 없는 앱" 경고 → **설정 → 이 출처 허용** → 설치.
3. 확인할 것: 첫 화면·소리 / 1판 플레이 / 일부러 져서 **"광고 보고 이어하기" → "Test Ad" 표시 광고**가 나오는지 / 상점 버튼 눌러 보기(시험판이라 결제는 안 됨, 정상).
4. 이상한 점은 스크린샷과 함께 알려 주면 Claude가 고친다.

---

## 4. Play Console에 앱 올리기

Play Console: https://play.google.com/console

### 4-1. 앱 만들기
**Create app** → App name `젤리팝 - 젤리마을 대소동` / Default language `한국어` / App or game `Game` / Free or paid `Free` → 동의 체크 → Create.

### 4-2. 앱 설정(Dashboard → "Set up your app" 항목 순서대로)

| 항목 | 답 |
|---|---|
| Privacy policy | `https://jellydock.com/jellypop/privacy.html` (젤리독에 privacy.html 올린 뒤. 연락 이메일 정해 주면 Claude가 넣고 올림) |
| App access | All functionality is available without special access |
| Ads | **Yes, my app contains ads** |
| Content rating | 설문 이메일 입력 → Category `Game` → 폭력·도박·채팅·위치 공유 **No**, 디지털 상품 구매(Digital purchases) **Yes** → 결과 "전체 이용가/Everyone" 예상 |
| Target audience | 실제로 노리는 나이: **13-15, 16-17, 18+**. 12세 이하를 노린다면 그 칸도 체크(그러면 가족 정책 적용 → Claude에게 알려 주기). Google이 "어린이에게 어필한다"고 판단해 수정 요청이 오면 그대로 따르고 Claude에게 전달 |
| News app | No |
| Data safety | 아래 표 |
| Government apps | No |
| Financial features | None |
| Health | None |
| Advertising ID | **Yes** → 용도 `Advertising or marketing` (AdMob 때문) |
| App category | Game → **Puzzle**, 이메일 = 지원 이메일 |
| Store listing | `LISTING.md` 의 앱 이름·짧은 설명·자세한 설명 붙여넣기, 아이콘 512px, 스크린샷 2장 이상 (그래픽 이미지 1024×500 필요 — Claude가 만들어 드림) |

**Data safety(데이터 보안) 답**:
- Does your app collect or share user data? → **Yes** (광고 SDK 때문)
- 수집·공유(광고 SDK 기준): **Location → Approximate location**(IP로 대략 위치) / **App activity → App interactions** / **App info and performance → Crash logs, Diagnostics** / **Device or other IDs**(광고 ID) — 목적 Advertising or marketing, Analytics, Fraud prevention. 모두 "Shared" 체크(Google에 전달)
- 공식 안내: https://developers.google.com/admob/android/privacy/play-data-disclosure
- 구매 내역(Purchase history) — Google Play 결제가 처리, 목적 App functionality
- 전송 중 암호화 → Yes / 삭제 요청 방법 → 계정이 없어서 해당 없음(앱 삭제 시 기기 저장 기록 삭제)

### 4-3. 거래자(Trader) 신고
**Settings → Developer account → Account details**에서 "거래자 여부" 질문 → 광고·결제로 돈을 버니 **Trader(거래자)** 선택. 주소·전화·이메일이 스토어에 공개될 수 있다(EU 법 요건). 공개가 싫으면 EU를 배포 국가에서 빼는 방법도 있다(아래 4-6).

### 4-4. 결제 프로필 + 후원 팩 상품
1. **Settings → Payments profile** → 은행 계좌 등록(정산용, 무료).
2. 처음 AAB를 한 번 올린 뒤(4-5) **Monetize with Play → Products → One-time products → Create one-time product** (메뉴 이름은 바뀔 수 있음)
   - Product ID `jellypop_supporter` (정확히 이 철자)
   - Name `말랑이 후원 팩` / Description `광고 없이 이어하기`
   - 구매 옵션(Purchase option) 추가 → 가격 ₩3,300 → **Activate**

### 4-5. 비공개 테스트(필수: 테스터 12명 × 14일)
2023-11 이후 만든 개인 계정은 이걸 통과해야 정식 출시 신청이 열린다.
1. **Test and release → Testing → Closed testing → Create track**
2. **Testers**: 이메일 목록 만들기 → 가족·지인 Gmail **12명 이상** (여유 있게 15명 권장)
3. **Create new release** → `jellypop-0.16.0-release.aab` 업로드 → 출시 노트 "첫 시험판" → **Review release → Start rollout**
4. 검토(보통 1~3일) 통과 후 테스터에게 **참여 링크** 전달 → 각자 폰에서 링크 열고 "테스터 되기" → Play 스토어에서 설치
5. **14일 연속**으로 12명 이상이 설치 상태 유지(가끔 열어 보기). 중간에 빠지면 날짜가 다시 셈될 수 있음

### 4-6. 정식 출시
14일 뒤 Dashboard → **Apply for production** → 설문(테스트 소감 등) → 승인 후 **Production → Create release** → 같은 AAB(또는 새 버전) → 국가 선택: **처음엔 대한민국만** 권장(유럽은 동의 설정 화면·거래자 주소 공개 등 할 일이 늘어남. 반응 보고 넓힘) → Start rollout.
→ 이 단계는 **실제 공개**이므로 사장님이 직접 누른다.

---

## 5. AdMob(광고) — 진짜 돈 버는 광고로 바꾸기

지금 앱에는 Google **테스트 광고**가 들어 있다(돈 안 됨). 비공개 테스트는 이대로 해도 된다. 정식 출시 전에 바꾼다.

1. https://admob.google.com 가입(구글 계정, 무료) → 결제 정보·주소 입력
2. **Apps → Add app** → Android → "Is the app listed on a supported app store?" → 아직이면 **No** → 앱 이름 `젤리팝`
3. 만든 앱 → **Ad units → Add ad unit → Rewarded** → 이름 `continue`
4. 두 값을 Claude에게 전달:
   - 앱 ID: `ca-app-pub-숫자~숫자` (물결표 `~`)
   - 광고 단위 ID: `ca-app-pub-숫자/숫자` (슬래시 `/`)
5. (나중에 유럽까지 넓힐 때) **Privacy & messaging → GDPR → Create message** → 게시. 앱에는 동의 창을 광고 전에 띄우는 코드가 이미 있음(한국 이용자에게는 안 뜸). 유럽 출시 전에 Claude가 "개인정보 설정 다시 열기" 버튼을 추가해야 함
6. Claude가 ID 넣고 `testing: false` → 테스트 → 새 AAB(버전 코드 2) 만들어 드림 → 그걸 Play Console에 올림
7. 출시 후 AdMob → 앱 → **Play 스토어 앱 연결**(app-ads.txt는 젤리독에 Claude가 올림)

⚠️ 자기 광고를 직접 여러 번 누르면 AdMob 계정이 정지될 수 있다. 사장님 폰에서는 테스트 광고 버전으로만 확인.

---

## 6. 일정 (예상)

| 주차 | 할 일 |
|---|---|
| 1주차 | 폰 시험(3장) → Play Console 앱 만들기·설정(4-1~4-4) → 비공개 테스트 시작(4-5) / 동시에 AdMob 가입(5장) |
| 2~3주차 | 테스터 14일 유지. 그 사이 Claude가 진짜 광고 ID 버전 빌드 |
| 3~4주차 | 정식 출시 신청 → 승인 → 공개 |

---

## 7. 사장님 할 일 한눈에

| # | 할 일 | 언제 | 비용 | 링크 |
|---|---|---|---|---|
| 1 | 서명 키 2개 파일 백업(USB+드라이브) | 오늘 | 0 | Library → jellypop-launch/android/signing-KEEP-SECRET |
| 2 | 폰에 시험 APK 설치해 보기 | 오늘 | 0 | Library → jellypop-launch/android |
| 3 | 지원·개인정보 연락 이메일 하나 정해서 알려 주기 | 이번 주 | 0 | — |
| 4 | Play Console 앱 만들기 + 설정 + 비공개 테스트 시작 | 이번 주 | 0 | https://play.google.com/console |
| 5 | 테스터 12명 이상 모으기(Gmail) | 이번 주 | 0 | — |
| 6 | AdMob 가입 → 앱 ID·광고 단위 ID 전달 | 2주 안 | 0 | https://admob.google.com |
| 7 | 결제 프로필(계좌) + 후원 팩 상품 만들기 | 2주 안 | 0 | Play Console → Settings |
| 8 | 정식 출시 버튼 | 14일 테스트 뒤 | 0 | Play Console |

## 8. Claude가 이어서 할 일
- 이메일 받으면: 개인정보처리방침 완성 → 젤리독에 올리기(운영 배포라 승인 받고)
- 광고 ID 받으면: 진짜 광고 버전 AAB(버전 코드 2)
- Play 그래픽 이미지(1024×500) 제작
- 폰 시험에서 나온 문제 수정

## 9. 다음 버전 올리는 법 (Claude 작업, 참고)
`app/android/app/build.gradle` 의 `versionCode` +1, `versionName`·`app/package.json` 버전 맞추기 → 서명 키 파일을 `app/android/` 에 두고 `cd app && npm run aab` → `app/android/app/build/outputs/bundle/release/app-release.aab`.
