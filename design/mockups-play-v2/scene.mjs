import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const [,, file, outdir] = process.argv;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
const p = await ctx.newPage();
p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('file://' + file + '?seed=7');
async function setup(mock, tsec, hot, frac, extra) {
  await p.evaluate(() => { const j = window.__jp; j.reset(); j.P.seenIntro = true; j.P.seenStory = Object.fromEntries([...Array(31).keys()].map(k=>[k,1])); j.startStage(8); });
  await p.waitForTimeout(1400);
  await p.evaluate(([mock, tsec, hot, frac]) => {
    window.__jp.closeCard(); window.__mock = mock;
    const G = Gummy; const body = G.cottonTree(2, 32, .95, '#ffb3e0') + G.jelly(14, 22, 13, '#ff8fbd', { ears: true, mood: 'joy' }) + G.giftBox(-16, 30, .55, '#ffd23f');
    document.getElementById('bannerImg').src = G.dataURL(G.svg(body, { x: -38, y: -24, w: 76, h: 60 }));
    document.getElementById('tlbl').textContent = tsec; document.getElementById('tbar').classList.toggle('hot', hot);
    document.getElementById('tfill').style.width = frac + '%';
    document.getElementById('tip').classList.add('hide');
    window.__jp.setAngle(-Math.PI / 2 - 0.25); window.__jp.G.crank = Math.PI - 0.35;
    // 안내 카드 숨김
    const c = document.getElementById('hzCard'); if (c) c.hidden = true;
    window.dispatchEvent(new Event('resize'));
  }, [mock, tsec, hot, frac]);
  if (extra) await p.evaluate(extra);
  await p.waitForTimeout(1500);
}
await setup({ score: 1250, combo: 2 }, '하강까지 7초', false, 62);
await p.screenshot({ path: outdir + '/1-play.png' });
await setup({ score: 3480, combo: 1, shake: 1, danger: 1 }, '⚠ 한 칸 내려와요!', true, 4, () => {
  const j = window.__jp, G = j.G; G.b.y0 += j.ROW_H * 4; G.y0Target = G.b.y0;
  const t = document.getElementById('toast'); t.textContent = '천장이 내려와요!'; t.classList.add('show');
});
await p.screenshot({ path: outdir + '/2-drop.png' });
await b.close();
