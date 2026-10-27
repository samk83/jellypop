// 젤리·거품·대포 3D 그림을 미리 구워 sprites3d.js 로 저장 (게임은 이 그림만 붙인다 → 실시간 3D 계산 없음)
// 사용: node design/forest/bake-sprites.mjs   (목록: design/forest/sprite-keys.json, "종류|색|표정|귀": 크기px)
// 2배 크기로 구운 뒤 줄여서 테두리를 매끄럽게 한다.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname), root = path.resolve(dir, '../..');
const keys = JSON.parse(fs.readFileSync(path.join(dir, process.env.KEYS || 'sprite-keys.json'), 'utf8'));
const outFile = process.env.OUT || path.join(root, 'sprites3d.js');
const baker = fs.readFileSync(path.join(dir, 'jelly3d-baker.js'), 'utf8');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-watchdog'] });
const page = await browser.newPage();
page.on('console', m => console.log('[page]', m.text()));
await page.setContent('<script>window.JELLY3D_FORCE = true;</script>');
await page.addScriptTag({ content: baker });
const out = {};
let bytes = 0;
for (const [key, size] of Object.entries(keys)) {
  const [kind, color, mood, ears] = key.split('|');
  out[key] = await page.evaluate(async ({ kind, color, mood, ears, size }) => {
    // 투명 젤리 빛 때문에 짙은 색이 회색으로 바래 보이니 놈놈 몸은 채도를 올린 색으로 굽는다 (남보라 / 빨개진 자주)
    const deep = hex => ({ '#3b2a7a': '#5a2fd6', '#722258': '#d02a7c' })[hex] || hex;
    // boss|종류|표정|0 → 장식 달린 보스 젤리, nom|몸 색|표정|꼬마(1) → 놈놈·노놈
    const BOSS = { mungchi: ['#8a5cf0', 1], syrup: ['#e8912f', 2], pudding: ['#ffc94a', 3], robot: ['#7f9bd1', 4] };
    const big = kind === 'boss' ? Jelly3D.bake('jelly', { color: BOSS[color][0], mood, acc: BOSS[color][1] }, size * 2)
      : kind === 'nom' ? Jelly3D.bake('jelly', { color: deep(color), mood, acc: ears === '1' ? 6 : 5 }, size * 2)
      // house|지붕 색|벽 색|0, tree|잎 색|happy 또는 cotton(솜사탕 나무)|0, mushroom|갓 색|happy|0
      : kind === 'house' ? Jelly3D.bake('house', { color, col2: mood }, size * 2)
      : kind === 'tree' ? Jelly3D.bake('tree', { color, acc: mood === 'cotton' ? 1 : 0 }, size * 2)
      : Jelly3D.bake(kind, { color, mood, ears: ears === '1' }, size * 2);
    if (!big) throw new Error('bake failed ' + kind + color);
    const im = new Image(); im.src = big; await im.decode();
    const c = document.createElement('canvas'); c.width = c.height = size;
    const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(im, 0, 0, size, size);
    return c.toDataURL('image/webp', 0.82);
  }, { kind, color, mood, ears, size });
  bytes += out[key].length;
  process.stdout.write('.');
}
await browser.close();
const js = `// 자동 생성 파일 (손으로 고치지 않기): node design/forest/bake-sprites.mjs
// 미리 구운 3D 젤리·거품·대포 그림. 키 = "종류|색|표정|귀"
window.JELLY3D_SPRITES = ${JSON.stringify(out, null, 0).replace(/","/g, '",\n"')};
`;
fs.writeFileSync(outFile, js);
console.log(`\n${Object.keys(out).length}장, ${(bytes / 1024).toFixed(0)}KB`);
