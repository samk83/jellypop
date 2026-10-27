# 젤리팝 런칭 가이드 (웹 · Google Play · 토스 · App Store)

수익화 전략·우선순위는 [MONETIZATION.md](MONETIZATION.md). 이 문서는 "어떻게 올리나".
같은 게임 파일(저장소 루트)을 네 곳이 같이 쓴다. 게임을 고치면 아래 각 명령만 다시 실행하면 된다.

## 0. 공통 준비 (한 번)

```
npm test               # 게임 자동 테스트 (광고·결제·PWA 포함)
cd app && npm install && cd toss && npm install && cd ../..
npm run test:app       # 앱 포장(안드로이드·아이폰·토스) 테스트
```
광고·결제 ID를 받으면 `monetize-config.js` 의 빈 칸만 채운다. 시험은 주소 끝 `?monetize=mock`.

## 1. 웹 (젤리독 · PWA)

- 젤리독 `public/jellypop/` 에 게임 파일을 복사하면 끝 (영어판 스레드가 진행). `sw.js`·`manifest.webmanifest`·`icons/`·`privacy.html` 도 같이 복사.
- 휴대폰 브라우저 메뉴 → "홈 화면에 추가" 하면 앱처럼 설치되고 인터넷 없이도 열린다.
- 게임 파일을 바꾸면 `sw.js` 의 `VERSION` 을 올린다(안 올리면 휴대폰이 옛 파일을 계속 씀).
- 웹 광고(선택): AdSense 승인 후 `web.provider: 'h5'`, `web.h5.client: 'ca-pub-…'`.

## 2. Google Play (안드로이드)

| 단계 | 누가 | 방법 |
|---|---|---|
| 1 | Owner | Play Console 가입($25, 신분 확인) |
| 2 | Owner | AdMob 가입 → 앱 추가(Android) → 보상형 광고 단위 → **앱 ID(`~`)와 광고 단위 ID(`/`)** 전달 |
| 3 | Claude | `app/android/app/src/main/res/values/strings.xml` 의 `admob_app_id`, `monetize-config.js` 의 `admob.android.rewarded`, `testing: false` |
| 4 | Owner(PC) | Android Studio 설치 → `cd app` → `npm run android` → Android Studio 메뉴 `Build > Generate Signed App Bundle or APK` → Android App Bundle → 새 업로드 키 만들기(**키 파일·비밀번호는 잃어버리면 업데이트 불가 — 꼭 백업**) → `.aab` |
| 5 | Owner | Play Console → 앱 만들기 → 인앱 상품 `jellypop_supporter` ₩3,300 → 데이터 보안·콘텐츠 등급 설문(답: [store/LISTING.md](../store/LISTING.md)) → 스크린샷·아이콘 업로드 |
| 6 | Owner | **비공개 테스트: 테스터 12명 이상, 14일 연속** (2023-11 이후 만든 개인 계정 필수) → 프로덕션 신청 |

여기(클라우드)에서는 Android SDK를 받을 수 없어(dl.google.com 차단) APK를 직접 빌드해 보지는 못했다. 프로젝트 생성·플러그인 연결·설정 값은 `npm run test:app` 으로 확인.

## 3. 토스 앱인토스

| 단계 | 누가 | 방법 |
|---|---|---|
| 1 | Owner | 앱인토스 콘솔 가입 → 앱 등록, 이름 **`jellypop`** (설정 파일 `app/toss/apps-in-toss.config.ts` 와 같아야 함) |
| 2 | Owner | 광고 → 광고 그룹 만들기(리워드) → ID 전달. 시험용 ID: `ait-ad-test-rewarded-id` |
| 3 | Owner | (결제까지 하려면) 사업자등록 → 정산 정보 → 인앱 상품 `jellypop_supporter` |
| 4 | Claude | `monetize-config.js` 의 `toss.rewardedAdGroupId` |
| 5 | 둘 중 | `cd app/toss && npm run build` → `jellypop.ait` 생성 → 콘솔에 업로드(또는 `npx ait deploy --api-key …`) |
| 6 | Owner | 콘솔 QR로 토스 앱에서 시험(필수) → 게임 등급(GRAC 또는 Google Play 링크) 제출 → 출시 검토 3~5영업일 |

토스 게임 체크리스트 대응: 전체 화면 ✓, 안드로이드 뒤로 가기 → "게임을 끝낼까요?" ✓(`app/toss/bridge.js`), 소리 켜기/끄기 버튼 ✓, 앱이 뒤로 가면 소리 멈춤 ✓, 광고·결제 중 소리 멈춤 ✓, 광고 미리 불러오기 ✓, eval 없음 ✓(빌드 때 검사), 진행 저장 ✓(기기 저장소).
**기기에서 확인 필요**: 오른쪽 위 닫기 버튼과 게임 버튼(소리 버튼)이 겹치지 않는지, 저장 진행이 토스 앱 재시작 후에도 남는지.

## 4. App Store (아이폰)

| 단계 | 누가 | 방법 |
|---|---|---|
| 1 | Owner | Apple Developer Program 가입($99/년) → (선택) 소규모 사업자 프로그램 신청(수수료 15%) |
| 2 | Owner | **Mac 결정**: 아이폰 앱은 Xcode(맥)로만 빌드됨. Owner PC는 Windows → 맥 빌리기/구매 또는 클라우드 맥 빌드 서비스(유료 가능, 결정 필요) |
| 3 | Claude | AdMob iOS ID 넣기: `app/ios/App/App/Info.plist` 의 `GADApplicationIdentifier`, `monetize-config.js` 의 `admob.ios.rewarded` |
| 4 | 맥에서 | `cd app && npm install && npm run ios` → (CocoaPods `pod install` 자동) → Xcode 에서 Team 선택 → `Product > Archive` → App Store Connect 업로드 |
| 5 | Owner | App Store Connect → 앱 만들기(번들 ID `com.jellydock.jellypop`) → 인앱 구매 `jellypop_supporter` → 개인정보 라벨 → 심사 제출 |

iOS는 결제 플러그인(Cordova 방식) 때문에 Swift Package Manager 대신 **CocoaPods** 프로젝트로 만들어 두었다.

## 5. 버전 올릴 때

1. 게임 고치기 → `npm test`
2. `sw.js` VERSION, `app/android/app/build.gradle` 의 `versionCode`(+1)·`versionName`, `app/package.json`·`app/toss/package.json` version
3. 웹: 젤리독에 다시 복사 / 안드로이드: `npm run android` → 새 AAB / 토스: `npm run build` → 새 .ait / 아이폰: 맥에서 Archive
