// 토스 미니앱용 dist/ 만들기: 게임 파일 복사 + 토스 브리지 번들 + index.html 에 브리지 스크립트 끼우기
// 다음 단계 `ait build` 가 dist/ 를 jellypop.ait 로 묶는다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { FILES, DIRS, OPTIONAL } from '../../scripts/copy-web.mjs';

const toss = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(toss, '../..');
const dist = path.join(toss, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
for (const f of [...FILES.filter(f => f !== 'manifest.webmanifest'), ...OPTIONAL.filter(f => fs.existsSync(path.join(root, f)))]) fs.copyFileSync(path.join(root, f), path.join(dist, f));
for (const d of DIRS) fs.cpSync(path.join(root, d), path.join(dist, d), { recursive: true });

await build({ entryPoints: [path.join(toss, 'bridge.js')], bundle: true, format: 'iife', target: 'es2019', minify: true, outfile: path.join(dist, 'toss-bridge.js'), logLevel: 'warning' });

// 브리지는 monetize 설정보다 먼저 로드 → monetize.js 가 토스를 알아본다. 설치형 웹앱(manifest) 줄은 뺀다
const idx = path.join(dist, 'index.html');
let html = fs.readFileSync(idx, 'utf8');
if (!html.includes('<script src="monetize-config.js"></script>')) throw new Error('index.html 에 monetize-config.js 가 없음');
html = html.replace('<script src="monetize-config.js"></script>', '<script src="toss-bridge.js"></script>\n<script src="monetize-config.js"></script>')
  .replace(/<link rel="manifest"[^>]*>\n/, '');
fs.writeFileSync(idx, html);

// 토스 심사: eval 금지 · 묶음 100MB 이하
const bad = fs.readdirSync(dist, { recursive: true }).filter(f => f.endsWith('.js')).filter(f => /\beval\s*\(|new Function\s*\(/.test(fs.readFileSync(path.join(dist, f), 'utf8')));
const bytes = fs.readdirSync(dist, { recursive: true }).map(f => path.join(dist, f)).filter(f => fs.statSync(f).isFile()).reduce((a, f) => a + fs.statSync(f).size, 0);
console.log(`dist/ 준비: ${(bytes / 1048576).toFixed(1)}MB${bad.length ? ' · ⚠ eval 사용: ' + bad.join(',') : ' · eval 없음'}`);
if (bad.length || bytes > 100 * 1048576) process.exit(1);
