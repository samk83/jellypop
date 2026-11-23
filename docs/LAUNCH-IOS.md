# 젤리팝 아이폰(App Store) 출시 가이드

작성 2026-11-22 · 앱 버전 0.17.0 · 번들 ID `com.jellydock.jellypop`
이 문서 하나만 보고 순서대로 따라 하면 된다. 사장님 컴퓨터는 Windows라서 아이폰 앱 파일(IPA)은 **Codemagic(코드매직)이라는 클라우드 Mac**에서 만든다. Mac을 살 필요 없음.

---

## 0. 지금 준비된 것

| 항목 | 상태 | 위치 |
|---|---|---|
| 아이폰 프로젝트(Capacitor 8) | ✅ | `app/ios/` |
| 광고 "광고 보고 이어하기"(AdMob 보상형) | ✅ 연결됨, ⚠️ 지금은 **Google 테스트 광고** | `monetize.js`, `monetize-config.js` |
| "광고 없애기 프리미엄" 결제 | ✅ 연결됨(상품 ID `jellypop_supporter`) | 상점 창, 구매 복원 버튼 있음 |
| "앱 추적 허용" 창(ATT) | ✅ 첫 판 클리어 뒤 1번만(한국어·영어 문구) | `Info.plist`, `ko.lproj/InfoPlist.strings` |
| 광고 네트워크 목록(SKAdNetwork) | ✅ Google 권장 50개 | `Info.plist` |
| 개인정보 매니페스트(Apple 필수 파일) | ✅ | `app/ios/App/App/PrivacyInfo.xcprivacy` |
| 수출 규정(암호화) 답 | ✅ "해당 없음" 미리 넣음 → 매번 안 물어봄 | `Info.plist` |
| 클라우드 Mac 빌드 설정 | ✅ 수동 실행만(자동 실행 없음) | `codemagic.yaml` |
| 스토어 등록 글(한/영) | ✅ | `store/LISTING.md` |
| 스크린샷 6.7인치(1290×2796, 한/영 5장씩) | ✅ | `store/screenshots/<ko|en>/phone-6.7/` |
| 아이콘 1024px | ✅ | `app/ios/App/App/Assets.xcassets/AppIcon.appiconset/` |
| 개인정보처리방침 | ✅ 문의처 support@jellydock.com, 젤리독 운영 주소에 게시 | `privacy.html` |
| **IPA 빌드** | ❌ 아직(클라우드 Mac 필요, 4장) | — |
| **실제 아이폰 실행** | ❌ 아직(TestFlight로 확인, 5장) | — |

---

## 1. 수익모델 (확정)

| 항목 | 내용 |
|---|---|
| 앱 가격 | 무료 |
| 광고 | 실패했을 때만 "▶ 광고 보고 이어하기"(보상형, 한 판 1번). 강제 광고·전면 광고·배너 없음 |
| 결제 | **"광고 없애기 프리미엄" ₩3,300 / $2.99, 한 번 구매(비소모성)** — 광고 없이 바로 이어하기 + 배너 없음 |
| 안 하는 것 | 구독, 유료 앱, 뽑기, 에너지 충전 대기 |

**프리미엄 = 예전 "말랑이 후원 팩"을 이름만 바꾼 같은 상품**(상품 ID 그대로 `jellypop_supporter`). 하는 일이 원래 "광고 없애기"였기 때문에 둘로 나누면 같은 걸 두 번 파는 셈이 된다.

**가격을 ₩3,300으로 정한 이유**
1. 이 게임의 광고는 원래 "원할 때만" 보는 광고라, 없애 주는 값어치가 강제 광고 게임보다 작다. 비싸면 안 팔린다.
2. 캐주얼 퍼즐의 "광고 제거"는 보통 $2.99~$4.99. 그중 가장 낮은 축 = 망설임 없이 누르는 가격.
3. 안드로이드·토스와 같은 가격 → 문서·안내 하나로 끝.
4. 3개월 뒤 판매 수를 보고 ₩4,400으로 올릴지 판단(가격 변경은 스토어 화면에서 바로 가능, 앱 수정 불필요).

App Store Connect 가격 목록에 ₩3,300이 없으면 **가장 가까운 값(미국 $2.99 등급)**을 고른다.

---

## 2. 비용·시간 한눈에

| 할 일 | 비용 | 걸리는 시간 |
|---|---|---|
| Apple Developer Program 가입 | **$99 / 매년** (약 14만 원) | 신청 10분 + 승인 최대 48시간 |
| 유료 앱 계약(은행·세금 정보) | 0원 | 20분 |
| 소규모 사업자 프로그램 신청(수수료 30%→15%) | 0원 | 5분 |
| AdMob에 아이폰 앱 추가 | 0원 | 10분 |
| Codemagic 가입·연결 | 0원 (개인 무료 빌드 시간 안에서) | 30분 |
| TestFlight로 내 아이폰에서 확인 | 0원 | 20분 |
| 심사 제출 | 0원 | 입력 1시간 + 심사 보통 1~2일 |

---

## 3. 사장님이 할 일 (순서대로)

### 3-1. Apple Developer Program 가입 — $99/년
1. https://developer.apple.com/programs/enroll/ 에서 **Start Your Enrollment**.
2. Apple ID로 로그인(2단계 인증 필요) → **Individual / Sole Proprietor**(개인) 선택 → 결제.
3. 승인 메일이 오면 끝.

### 3-2. App Store Connect에 앱 만들기
1. https://developer.apple.com/account/resources/identifiers/list → **+** → App IDs → App → Bundle ID **Explicit** `com.jellydock.jellypop`, Description `JellyPop`. Capabilities에서 **In-App Purchase** 체크(기본 켜짐) → Register.
2. https://appstoreconnect.apple.com/apps → **+ → New App**
   - Platforms: iOS / Name: `젤리팝 - 젤리마을 대소동` / Primary Language: Korean / Bundle ID: `com.jellydock.jellypop` / SKU: `jellypop` / User Access: Full Access
3. **Business**(비즈니스) 메뉴 → **Paid Apps** 계약에 동의 + 은행 계좌·세금 정보 입력. 이게 없으면 결제 상품이 작동하지 않는다.
4. https://developer.apple.com/app-store/small-business-program/ 에서 **소규모 사업자 프로그램** 신청 → 수수료 15%.

### 3-3. 결제 상품 만들기
App Store Connect → 젤리팝 → **Monetization → In-App Purchases → +**
| 칸 | 값 |
|---|---|
| Type | **Non-Consumable** |
| Reference Name | `Premium No Ads` |
| Product ID | **`jellypop_supporter`** (글자 하나라도 다르면 작동 안 함) |
| Price | ₩3,300 (없으면 미국 $2.99 등급) |
| 표시 이름(한국어) | 광고 없애기 프리미엄 |
| 설명(한국어) | 광고 없이 바로 이어하기 + 배너 광고 없음 |
| Display Name (English) | Premium — No Ads |
| Description (English) | Continue instantly without ads, no banners |
| Review Screenshot | `design/screens/monetize-shop.png` (상점 창) |
첫 결제 상품은 **앱과 같이 심사**받는다(7장에서 함께 선택).

### 3-4. AdMob에 아이폰 앱 추가 → Claude에게 ID 두 개 전달
1. https://apps.admob.com → **Apps → Add app** → iOS → "아직 스토어에 없음" → 이름 `JellyPop`.
2. 만든 앱에서 **Ad units → Add ad unit → Rewarded** → 이름 `continue`.
3. Claude에게 보내기: **앱 ID**(`ca-app-pub-…~…`)와 **보상형 광고 단위 ID**(`ca-app-pub-…/…`).
   Claude가 `Info.plist`와 `monetize-config.js`(testing: false)에 넣고 새 버전으로 올린다.
4. ⚠️ AdMob **개인정보 보호 및 메시지**에서 **"IDFA 안내 메시지"는 만들지 말 것** — 만들면 앱을 켜자마자 추적 창이 떠 버린다(게임은 첫 판 클리어 뒤에 묻도록 만들어 둠). 유럽용 GDPR 메시지는 만들어도 됨.
5. app-ads.txt: AdMob이 알려 주는 한 줄을 `jellydock.com/app-ads.txt`에 올려야 광고 수익이 제대로 나온다 → Claude가 젤리독에 넣어 둠(젤리독 배포라 사장님 승인 필요).

### 3-5. Codemagic 준비 (클라우드 Mac)
1. https://codemagic.io/signup → **GitHub로 가입** → 저장소 `samk83/jellypop` 추가.
2. App Store Connect → **Users and Access → Integrations → App Store Connect API → +** → 이름 `Codemagic`, Access **App Manager** → Generate → **.p8 파일 내려받기**(한 번만 받을 수 있음), Issuer ID·Key ID 복사.
3. Codemagic → **Team settings → Integrations → App Store Connect → Connect** → 이름을 정확히 **`jellypop_asc`** 로, 2번의 값 3개 입력.
4. Codemagic → **Team settings → codemagic.yaml settings → Code signing identities**
   - iOS certificates → **Generate certificate** → Type **Apple Distribution**, API key `jellypop_asc` → 이름 `jellypop_dist`
   - iOS provisioning profiles → **Fetch profiles** → `com.jellydock.jellypop` **App Store** 프로필 선택(없으면 developer.apple.com에서 Distribution → App Store 프로필 만든 뒤 다시 Fetch)

## 4. 앱 만들기 (IPA) — 버튼 한 번
Codemagic → 젤리팝 → **Start new build** → 브랜치 `main` → 워크플로 **JellyPop iOS → TestFlight** → Start.
약 15~25분 뒤 IPA가 만들어지고 **App Store Connect의 TestFlight에 자동으로 올라간다**. 실패하면 로그 파일 링크를 Claude에게 주면 고친다.

## 5. 내 아이폰에서 확인 (TestFlight)
1. 아이폰에 **TestFlight** 앱 설치(App Store에서 무료).
2. App Store Connect → 젤리팝 → **TestFlight → Internal Testing → +** → 그룹 만들고 내 Apple ID 추가 → 메일/TestFlight에서 설치.
3. 확인할 것:
   - [ ] 첫 판을 깨면 "앱 추적 허용" 창이 한 번 뜬다(한국어 문구). 다시 깨면 안 뜬다
   - [ ] 일부러 져서 "▶ 광고 보고 이어하기" → 광고 끝까지 보면 이어진다(테스트 광고면 "Test Ad" 표시)
   - [ ] 타이틀 "✨ 광고 없애기" → 상점 → 구매(TestFlight는 **돈이 안 나가는 시험 결제**) → 이어하기 버튼이 광고 없이 바로
   - [ ] 앱 지우고 다시 설치 → 상점 → "구매 복원" → 프리미엄 돌아옴
   - [ ] 소리·화면·속도가 웹과 같음

## 6. 스토어 등록 글 채우기 (App Store Connect → 젤리팝 → 1.0 Prepare for Submission)
| 칸 | 값 |
|---|---|
| 스크린샷 6.7/6.9인치 | `store/screenshots/ko/phone-6.7/` 5장 (영어 페이지는 `en/`) |
| 부제·설명·키워드 | `store/LISTING.md` 그대로 복사 |
| 지원 URL | `https://jellydock.com/apps/jelly-pop` |
| 개인정보처리방침 URL | `https://jellydock.com/jellypop/privacy.html` |
| 카테고리 | Games → Puzzle / 보조 Casual |
| 연령 등급 설문 | 전부 "없음" → **4+** · ⚠️ **Kids(어린이) 카테고리는 선택하지 말 것**(어린이 카테고리는 맞춤 광고·추적 금지) |
| 앱 개인정보 보호(Privacy) | `store/LISTING.md` "App Store — 앱 개인정보 보호" 표 그대로: 기기 ID·광고 데이터 = 제3자 광고·추적 예 / 제품 상호작용 = 광고·분석 / 충돌·성능 = 앱 기능. 모두 "사용자와 연결 안 됨" |
| 가격 | Free |
| 판매 국가 | 처음엔 **대한민국만** 권장(안드로이드와 같게), 반응 보고 넓힘 |
| In-App Purchases | 3-3에서 만든 `jellypop_supporter` 를 이 버전에 추가 |
| Build | 4장에서 올라온 빌드 선택 |
| 심사 메모(App Review Information) | "No login. Rewarded ad appears only after losing a stage (tap 'Watch an ad to continue'). Premium — No Ads is in the title screen '✨ Remove ads' button. ATT prompt appears once after clearing stage 1." |

## 7. 심사 제출 → 출시
**Add for Review → Submit**. 보통 1~2일. 승인되면 "Manually release"로 두었다가 사장님이 원하는 날 **Release**.
자주 거절되는 이유와 대비: 추적 창 문구 불명확(✅ 구체적으로 씀), 구매 복원 없음(✅ 있음), 개인정보 URL 안 열림(⚠️ 올린 뒤 제출), 테스트 광고 그대로(⚠️ 3-4의 진짜 ID 넣은 빌드로 제출).

---

## Claude가 ID를 받으면 하는 일 (사장님은 안 봐도 됨)
- `app/ios/App/App/Info.plist` `GADApplicationIdentifier` ← AdMob 앱 ID
- `monetize-config.js` `admob.ios.rewarded` ← 보상형 단위 ID, `admob.testing: false` (안드로이드 ID도 받았으면 같이)
- 테스트 `npm test`, `npm run test:app` → PR → Merge → 사장님이 Codemagic에서 Start new build
- 빌드 번호는 Codemagic 빌드 번호를 자동으로 씀(매번 올라감). 버전 이름은 `app/package.json`·`MARKETING_VERSION`.
