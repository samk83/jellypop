// 앱 포장(안드로이드·아이폰·토스) 자동 테스트: npm run test:app
// 먼저 한 번: (cd app && npm install) && (cd app/toss && npm install)
// 진짜 기기 빌드(APK·AAB·IPA)는 여기서 못 한다 — 설정 값·복사·토스 묶음과 브라우저 동작만 확인.
import { chromium, devices } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { koreanByDefault } from './locale.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const app = path.join(root, 'app'), toss = path.join(app, 'toss');
let pass = 0, fail = 0;
function check(name, ok, info = '') {
  if (ok) { pass++; console.log('  ✅ ' + name); } else { fail++; console.log('  ❌ ' + name + ' ' + info); }
}
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

console.log('게임 파일 복사 목록');
const { FILES, DIRS, OPTIONAL } = await import(pathToFileURL(path.join(app, 'scripts/copy-web.mjs')).href);
const html = read('index.html');
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(x => x[1]).filter(s => !/^https?:/.test(s));
const listed = [...FILES, ...OPTIONAL];
check('index.html 의 스크립트가 모두 복사 목록에 있음', scripts.every(s => listed.includes(s)), scripts.filter(s => !listed.includes(s)).join(','));
check('지연 로딩 그림(sprites3d-scene.js)도 복사', FILES.includes('sprites3d-scene.js'));
check('그림 폴더(assets·icons) 복사', DIRS.includes('assets') && DIRS.includes('icons'));
execFileSync('node', [path.join(app, 'scripts/copy-web.mjs')], { stdio: 'pipe' });
check('app/www 만들어짐(index.html·monetize.js)', fs.existsSync(path.join(app, 'www/index.html')) && fs.existsSync(path.join(app, 'www/monetize.js')));
check('app/www 에 서비스 워커 없음(앱 안에선 안 씀)', !fs.existsSync(path.join(app, 'www/sw.js')));

console.log('안드로이드·아이폰 설정');
const cap = JSON.parse(read('app/capacitor.config.json'));
check('앱 ID com.jellydock.jellypop · 웹 폴더 www', cap.appId === 'com.jellydock.jellypop' && cap.webDir === 'www');
const man = read('app/android/app/src/main/AndroidManifest.xml');
check('안드로이드 AdMob 앱 ID 연결', man.includes('com.google.android.gms.ads.APPLICATION_ID') && /admob_app_id">ca-app-pub-\d+~\d+</.test(read('app/android/app/src/main/res/values/strings.xml')));
check('안드로이드 세로 고정', man.includes('android:screenOrientation="portrait"'));
const pl = read('app/ios/App/App/Info.plist');
check('아이폰 AdMob 앱 ID 연결', /<key>GADApplicationIdentifier<\/key>\s*<string>ca-app-pub-\d+~\d+<\/string>/.test(pl));
check('아이폰 AdMob 앱 ID = 실제 계정(시험 ID 아님)', pl.includes('ca-app-pub-9373122711379804~3017391940') && !pl.includes('3940256099942544'));
check('아이폰 세로 고정', /<key>UISupportedInterfaceOrientations<\/key>\s*<array>\s*<string>UIInterfaceOrientationPortrait<\/string>\s*<\/array>/.test(pl));
check('아이폰 결제 플러그인용 CocoaPods(Podfile) 사용', fs.existsSync(path.join(root, 'app/ios/App/Podfile')) && read('app/ios/App/Podfile').includes("pod 'CordovaPlugins'"));
const pkg = JSON.parse(read('app/package.json'));
check('AdMob·스토어 결제 플러그인 버전 고정', /^\d/.test(pkg.dependencies['@capacitor-community/admob']) && /^\d/.test(pkg.dependencies['cordova-plugin-purchase']));
const gradle = read('app/android/app/build.gradle');
const vn = (gradle.match(/versionName "([^"]+)"/) || [])[1];
check('안드로이드 versionName = app/package.json version', vn === pkg.version, `${vn} / ${pkg.version}`);
check('안드로이드 targetSdk 35 이상(Play 요건)', +(read('app/android/variables.gradle').match(/targetSdkVersion = (\d+)/) || [])[1] >= 35);
check('출시 서명은 keystore.properties 에서 읽음(키·비밀번호는 저장소에 없음)', gradle.includes('keystore.properties') && gradle.includes('signingConfig signingConfigs.release'));
{
  const ig = read('app/android/.gitignore');
  const tracked = execFileSync('git', ['ls-files', 'app/android'], { cwd: root, encoding: 'utf8' });
  check('서명 키 파일은 Git 에 안 올라감', ig.includes('keystore.properties') && ig.includes('*.jks') && !/\.(jks|keystore)$|keystore\.properties/m.test(tracked));
}
const icon = path.join(root, 'app/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png');
check('앱 아이콘이 젤리팝 그림(기본 Capacitor 아이콘 아님)', fs.statSync(icon).size > 10000, String(fs.statSync(icon).size));

console.log('아이폰 App Store 준비');
{
  check('아이폰 추적 허용(ATT) 창 문구(영어 기본)', /<key>NSUserTrackingUsageDescription<\/key>\s*<string>[^<]{30,}<\/string>/.test(pl));
  const ko = read('app/ios/App/App/ko.lproj/InfoPlist.strings');
  check('아이폰 추적 허용 창 한국어 문구', /"NSUserTrackingUsageDescription"\s*=\s*"[^"]*광고[^"]*";/.test(ko));
  const sk = (pl.match(/<string>[a-z0-9]{10}\.skadnetwork<\/string>/g) || []);
  check('AdMob 권장 SKAdNetwork 목록(40개 이상, 중복 없음)', sk.length >= 40 && new Set(sk).size === sk.length, String(sk.length));
  check('아이폰 기기 요구 arm64(옛 armv7 아님)', /<key>UIRequiredDeviceCapabilities<\/key>\s*<array>\s*<string>arm64<\/string>/.test(pl));
  check('수출 규정(암호화 없음) 미리 답함', /<key>ITSAppUsesNonExemptEncryption<\/key>\s*<false\/>/.test(pl));
  check('홈 화면 앱 이름: 기본 영어 Jelly Pop, 한국어 젤리팝', /<key>CFBundleDisplayName<\/key>\s*<string>Jelly Pop<\/string>/.test(pl) && /"CFBundleDisplayName" = "Jelly Pop";/.test(read('app/ios/App/App/en.lproj/InfoPlist.strings')) && /"CFBundleDisplayName" = "젤리팝";/.test(read('app/ios/App/App/ko.lproj/InfoPlist.strings')));
  const ad = read('app/ios/App/App/AppDelegate.swift');
  check('아이폰 무음 스위치에도 소리: 오디오 세션 playback + mixWithOthers', /setCategory\(\.playback, mode: \.default, options: \[\.mixWithOthers\]\)/.test(ad) && /didFinishLaunching[\s\S]*configureAudioSession\(\)/.test(ad) && /applicationDidBecomeActive[\s\S]*configureAudioSession\(\)/.test(ad));
  const pi = read('app/ios/App/App/PrivacyInfo.xcprivacy');
  check('개인정보 매니페스트: 광고용 기기 ID 를 추적용으로 표시', /NSPrivacyCollectedDataTypeDeviceID<\/string>[\s\S]*?NSPrivacyCollectedDataTypeTracking<\/key>\s*<true\/>/.test(pi));
  // ITMS-91064: NSPrivacyTracking 이 true 면 NSPrivacyTrackingDomains 가 비면 안 된다. 둘 다 빼 두는 방식(GMA SDK 와 같음)
  check('개인정보 매니페스트: 추적 도메인 없이 NSPrivacyTracking=true 금지 (ITMS-91064)', !/<key>NSPrivacyTracking<\/key>/.test(pi) && !/<key>NSPrivacyTrackingDomains<\/key>/.test(pi));
  const pbx = read('app/ios/App/App.xcodeproj/project.pbxproj');
  check('Xcode 프로젝트에 개인정보 매니페스트·한국어 문구 포함', /PrivacyInfo\.xcprivacy in Resources \*\/,/.test(pbx) && /InfoPlist\.strings in Resources \*\/,/.test(pbx) && pbx.includes('path = ko.lproj/InfoPlist.strings'));
  check('Xcode 지원 언어에 한국어', /knownRegions = \(\s*en,\s*ko,/.test(pbx));
  const mv = [...pbx.matchAll(/MARKETING_VERSION = ([^;]+);/g)].map(x => x[1]);
  check('아이폰 버전(MARKETING_VERSION) = app/package.json version', mv.length === 2 && mv.every(v => v === pkg.version), mv.join(','));
  check('아이폰 번들 ID com.jellydock.jellypop', (pbx.match(/PRODUCT_BUNDLE_IDENTIFIER = com\.jellydock\.jellypop;/g) || []).length === 2);
  const cm = read('codemagic.yaml');
  check('클라우드 Mac 빌드 설정: 수동 실행만(자동 trigger 없음)·App Store 서명·번들 ID', !/^\s*triggering:/m.test(cm) && cm.includes('distribution_type: app_store') && cm.includes('bundle_identifier: com.jellydock.jellypop'));
  check('GitHub Actions 워크플로 없음', !fs.existsSync(path.join(root, '.github/workflows')));
  const cfg = read('monetize-config.js');
  check('추적 허용 창은 첫 판 클리어 뒤(afterFirstWin)', /iosTrackingPrompt:\s*'afterFirstWin'/.test(cfg));
}

console.log('토스 미니앱 묶음');
if (!fs.existsSync(path.join(toss, 'node_modules'))) { check('app/toss npm install 됨', false, '(cd app/toss && npm install)'); }
else {
  const out = execFileSync('node', [path.join(toss, 'scripts/build.mjs')], { encoding: 'utf8' });
  check('dist/ 만들어짐 · eval 없음', out.includes('eval 없음'), out);
  const d = fs.readFileSync(path.join(toss, 'dist/index.html'), 'utf8');
  check('브리지가 monetize 설정보다 먼저', d.indexOf('toss-bridge.js') > 0 && d.indexOf('toss-bridge.js') < d.indexOf('monetize-config.js'));
  check('토스 설정 appName = jellypop', /appName:\s*'jellypop'/.test(read('app/toss/apps-in-toss.config.ts')));

  const browser = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), args: ['--allow-file-access-from-files'] });
  koreanByDefault(browser);
  const phone = { ...devices['iPhone 13'] }; delete phone.defaultBrowserType;
  const ctx = await browser.newContext(phone);
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(pathToFileURL(path.join(toss, 'dist/index.html')).href);
  const r = await page.evaluate(async () => { await JellyMonetize.init(); return { p: JellyMonetize.provider, bridge: !!window.JellyTossBridge, ad: await window.JellyTossBridge.showRewarded('ait-ad-test-rewarded-id') }; });
  check('토스 묶음에서 공급자 = toss', r.p === 'toss' && r.bridge, JSON.stringify(r));
  check('토스 앱 밖(일반 브라우저)에선 광고가 조용히 실패(false)', r.ad === false);
  const st = await page.evaluate(() => { const j = window.__jp; j.startStage(1); j.closeCard(); return j.G.state; });
  check('토스 묶음에서 게임 시작', st === 'aim');
  check('토스 묶음은 서비스 워커를 쓰지 않음(브리지가 있으면 등록 건너뜀)', !d.includes("register('sw.js')") || /!window.JellyTossBridge/.test(d));
  check('콘솔 에러 없음', errs.length === 0, errs.join(' | '));
  await browser.close();
}

console.log(`\n결과: ${pass} 통과 / ${fail} 실패`);
process.exit(fail ? 1 : 0);
