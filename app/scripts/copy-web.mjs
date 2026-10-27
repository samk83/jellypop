// 게임 파일(저장소 루트)을 app/www 로 복사한다 → npx cap sync 가 안드로이드·아이폰 프로젝트로 넣는다.
// 서비스 워커(sw.js)는 앱 안에서 쓰지 않으므로 뺀다. 목록에 없는 새 게임 파일은 tests/app.test.mjs 가 잡는다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(app, '..');
const www = path.join(app, 'www');
export const FILES = [
  'index.html', 'manifest.webmanifest',
  'sprites3d.js', 'sprites3d-scene.js', 'jelly3d.js', 'gummy.js', 'stages.js', 'banner.js', 'story-data.js', 'story.js',
  'monetize-config.js', 'monetize.js',
];
export const DIRS = ['assets', 'icons'];
// 다른 스레드가 추가하는 파일(있으면 복사): 영어판
export const OPTIONAL = ['i18n.js', 'lang-en.js'];

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  fs.rmSync(www, { recursive: true, force: true });
  fs.mkdirSync(www, { recursive: true });
  for (const f of [...FILES, ...OPTIONAL.filter(f => fs.existsSync(path.join(root, f)))]) fs.copyFileSync(path.join(root, f), path.join(www, f));
  for (const d of DIRS) fs.cpSync(path.join(root, d), path.join(www, d), { recursive: true });
  const n = fs.readdirSync(www, { recursive: true }).length;
  console.log(`app/www 에 게임 파일 ${n}개 복사`);
}
