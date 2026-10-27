const fs = require('fs');
const f = process.argv[2]; let s = fs.readFileSync(f, 'utf8');
const rep = (a, b) => { if (!s.includes(a)) { console.error('MISS', a.slice(0, 60)); process.exit(1); } s = s.replace(a, b); };
// ---- CSS: 배너 + 타임 게이지
rep('#stageWrap{flex:1;', `
#banner{margin-top:8px;height:74px;border-radius:18px;position:relative;overflow:hidden;display:flex;align-items:center;gap:10px;padding:0 12px 0 8px;
  background:linear-gradient(180deg,rgba(255,240,248,.96),rgba(255,206,228,.94));border:2px solid rgba(255,255,255,.8);
  box-shadow:0 4px 12px rgba(26,10,58,.3),inset 0 -4px 0 rgba(217,84,138,.18),inset 0 3px 0 rgba(255,255,255,.9)}
#banner::before{content:"";position:absolute;left:10px;right:10px;top:4px;height:12px;border-radius:8px;background:linear-gradient(rgba(255,255,255,.9),rgba(255,255,255,0))}
#banner .bimg{flex:none;width:64px;height:64px;display:grid;place-items:center}
#banner .bimg img{width:64px;height:64px;object-fit:contain;filter:drop-shadow(0 3px 3px rgba(122,45,94,.3))}
#banner .btxt{flex:1;min-width:0;line-height:1.15}
#banner .btxt small{display:inline-block;font:800 10px var(--font-body);color:#fff;background:#ff4f8b;border-radius:8px;padding:2px 7px;margin-bottom:3px}
#banner .btxt b{display:block;font:900 16px var(--font-body);color:#5a2d91;white-space:nowrap}
#banner .btxt span{display:block;font:700 12px var(--font-body);color:#a0457a;margin-top:2px;white-space:nowrap}
#banner .bgo{flex:none;font:900 14px var(--font-body);color:#fff;background:linear-gradient(#ffd23f,#ff9f1c);border-radius:14px;padding:9px 12px;box-shadow:0 3px 0 #c76b0a,inset 0 2px 0 rgba(255,255,255,.6);text-shadow:0 1px 1px rgba(122,45,10,.5)}
#banner .dots{position:absolute;left:0;right:0;top:62px;display:flex;justify-content:center;gap:5px}
#banner .dots i{width:6px;height:6px;border-radius:50%;background:rgba(194,69,122,.3)}#banner .dots i.on{width:16px;border-radius:3px;background:#ff4f8b}
#tbar{margin-top:8px;height:30px;display:flex;align-items:center;gap:8px;padding:0 4px}
#tbar .tic{flex:none;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-size:17px;background:radial-gradient(circle at 35% 30%,#fff,#ffd1e8 60%,#f59ac4);box-shadow:0 2px 4px rgba(26,10,58,.35)}
#tbar .track{flex:1;height:18px;border-radius:9px;background:rgba(42,11,78,.55);border:2px solid rgba(255,255,255,.75);position:relative;overflow:hidden;box-shadow:inset 0 2px 3px rgba(0,0,0,.35)}
#tbar .fill{position:absolute;left:0;top:0;bottom:0;border-radius:7px;background:linear-gradient(#bff7d0,#3fd27a 55%,#25a85c)}
#tbar .fill::after{content:"";position:absolute;left:4px;right:4px;top:2px;height:4px;border-radius:2px;background:rgba(255,255,255,.7)}
#tbar.hot .fill{background:linear-gradient(#ffd0de,#ff4f8b 55%,#d81b5e)}
#tbar .ticks{position:absolute;inset:0;display:flex}#tbar .ticks i{flex:1;border-right:2px solid rgba(255,255,255,.35)}#tbar .ticks i:last-child{border:0}
#tbar .lbl{flex:none;min-width:96px;text-align:center;font:900 14px var(--font-body);color:#fff;background:rgba(90,45,145,.88);border-radius:12px;padding:5px 9px;border:1.5px solid rgba(255,255,255,.4)}
#tbar.hot .lbl{background:#ff4f8b}
#stageWrap{flex:1;`);
rep('<div id="stageWrap">', `<div id="banner"><div class="bimg"><img id="bannerImg"></div><div class="btxt"><small>이벤트 배너</small><b>솜사탕 축제 오픈!</b><span>3판 깨면 무지개 거품 3개 선물</span></div><div class="bgo">받기</div></div>
    <div id="tbar"><div class="tic">⏳</div><div class="track"><div class="fill" id="tfill"></div><div class="ticks"><i></i><i></i><i></i><i></i><i></i></div></div><div class="lbl" id="tlbl">하강까지 7초</div></div>
    <div id="stageWrap">`);
rep("#stageWrap{flex:1;min-height:0;display:grid;place-items:center;margin-top:8px;", "#stageWrap{flex:1;min-height:0;display:grid;place-items:end center;margin-top:6px;");
// ---- 말랑이 위치: 핸들에 더 가깝게
rep('const MASCOT = { x: CANNON.bx - 97 * CS,', 'const MASCOT = { x: CANNON.bx - 74 * CS,');
// ---- 팔: 짧고 통통한 구미 팔 두 개 + 동그란 손
rep(`  drawJellySprite(MAL, MASCOT.r, { ears: true, mood }, mx, my, sq);
  // 팔 → 핸들 손잡이
  const kx = wh.x + Math.cos(G.crank) * wh.r * .75, ky = wh.y + Math.sin(G.crank) * wh.r * .75;
  ctx.strokeStyle = MAL; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(mx + 16, my - 4); ctx.quadraticCurveTo((mx + kx) / 2 + 6, Math.min(my, ky) - 10, kx, ky); ctx.stroke();
  ctx.fillStyle = '#ff9fc0'; ctx.beginPath(); ctx.arc(kx, ky, 4.5, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(kx - 1.5, ky - 1.5, 1.6, 0, 7); ctx.fill();`,
`  const kx = wh.x + Math.cos(G.crank) * wh.r * .7, ky = wh.y + Math.sin(G.crank) * wh.r * .7;
  // 짧고 통통한 젤리 팔: 몸 옆에서 나와 살짝 굽어 동그란 손으로 손잡이를 꼭 잡는다
  const arm = (sx, sy, hx, hy, w, back) => {
    const L = Math.hypot(hx - sx, hy - sy), a = Math.atan2(hy - sy, hx - sx), nx = -Math.sin(a), ny = Math.cos(a);
    const cx = (sx + hx) / 2 + nx * L * .22, cy = (sy + hy) / 2 + ny * L * .22;
    const path = () => { ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(cx, cy, hx, hy); };
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    path(); ctx.strokeStyle = back ? '#c94a82' : '#e0679f'; ctx.lineWidth = w + 2.4; ctx.stroke();
    const g = ctx.createLinearGradient(sx, sy - w, sx, sy + w); g.addColorStop(0, back ? '#ffb8d6' : '#ffd6e8'); g.addColorStop(1, back ? '#f07cb0' : '#ff99c4');
    path(); ctx.strokeStyle = g; ctx.lineWidth = w; ctx.stroke();
    ctx.globalAlpha = .75; ctx.beginPath(); ctx.moveTo(sx + 1, sy - w * .28); ctx.quadraticCurveTo(cx, cy - w * .3, (cx + hx) / 2, (cy + hy) / 2 - w * .3); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.globalAlpha = 1;
    const hr = w * .72, hg = ctx.createRadialGradient(hx - hr * .4, hy - hr * .45, .5, hx, hy, hr + 1.2);
    hg.addColorStop(0, '#fff5fa'); hg.addColorStop(.55, back ? '#ffa6cb' : '#ffb8d6'); hg.addColorStop(1, back ? '#e0679f' : '#f27fb0');
    ctx.fillStyle = back ? '#c94a82' : '#e0679f'; ctx.beginPath(); ctx.arc(hx, hy, hr + 1.2, 0, 7); ctx.fill();
    ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(hx, hy, hr, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.ellipse(hx - hr * .35, hy - hr * .42, hr * .3, hr * .18, -.6, 0, 7); ctx.fill();
    ctx.restore();
  };
  const kx2 = kx, ky2 = ky;
  arm(mx + 18, my - 8, kx2 - 1, ky2 - 4, 8.5, true);         // 뒤쪽 팔 (몸 뒤, 진한 분홍)
  drawJellySprite(MAL, MASCOT.r, { ears: true, mood }, mx, my, sq);
  arm(mx + 19, my + 6, kx2 + 1, ky2 + 3, 9.5, false);        // 앞쪽 팔
  // 핸들 손잡이 (손 사이로 살짝 보이는 금색 손잡이)
  ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(kx2 + 4, ky2 - 1, 2.6, 0, 7); ctx.fill();
  // 힘주는 볼 (분홍 땀방울 대신 반짝)
  ctx.fillStyle = 'rgba(255,255,255,.9)'; for (const [dx, dy, r] of [[-28, -26, 2.2], [-34, -18, 1.4]]) { ctx.beginPath(); ctx.arc(mx + dx, my + dy, r, 0, 7); ctx.fill(); }`);
// ---- 줄 선 친구: 다음 3개만, +N 없음 (발사 수 무제한)
rep('const show = Math.min(G.queue.length - 1, 5);', 'const show = Math.min(G.queue.length - 1, 3);');
rep("if (extra > 0) { const p", "if (false) { const p");
rep("const label = '점수 ' + G.score + '  ·  남은 발사 ' + G.shotsLeft;", "const label = '점수 ' + (window.__mock ? window.__mock.score : G.score).toLocaleString() + '  ·  콤보 x' + (window.__mock ? window.__mock.combo : 1);");
// ---- 천장 하강 연출: 흔들림 + 붉은 천장 + 하강 화살표
rep("const h = G.hz, quake = ", "const h = G.hz, MK = window.__mock || {}, quake = MK.shake ? 3.5 : ");
rep("  // 컨베이어 줄: 거품 뒤에", `  if (MK.shake) {
    // 흔들흔들 선 + 아래로 화살표 (위에서 한 칸 내려온다)
    ctx.save(); ctx.strokeStyle = 'rgba(255,79,139,.9)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (const x of [8, W - 8]) for (let k = 0; k < 3; k++) { const y = by + 30 + k * 26, d = x < W / 2 ? 1 : -1; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 5 * d, y + 6, x, y + 12); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,79,139,.95)'; ctx.font = '900 20px "Baloo 2", sans-serif'; ctx.textAlign = 'center';
    for (const x of [60, 180, 300]) ctx.fillText('▼', x, by - 0);
    ctx.restore();
  }
  // 컨베이어 줄: 거품 뒤에`);
// 흔들림 중엔 판 전체를 살짝 기울이고 잔상
rep("  // 보스\n  if (G.st.boss) drawBoss(t);", "  if (MK.shake) { ctx.save(); ctx.translate(W / 2, by); ctx.rotate(-.012); ctx.translate(-W / 2 + 2.5, -by + 6); }\n  // 보스\n  if (G.st.boss) drawBoss(t);");
rep("  G.wobbles = G.wobbles.filter(w => (w.t += dt) < .6);", "  if (MK.shake) ctx.restore();\n  G.wobbles = G.wobbles.filter(w => (w.t += dt) < .6);");
// 바닥선: 위험할 땐 붉게
rep("ctx.strokeStyle = dusk() ? 'rgba(255,209,232,.85)' : 'rgba(255,143,177,.8)'; ctx.setLineDash([8, 8]);", "ctx.strokeStyle = (window.__mock && window.__mock.danger) ? 'rgba(255,60,110,.95)' : dusk() ? 'rgba(255,209,232,.85)' : 'rgba(255,143,177,.8)'; ctx.setLineDash([8, 8]);");
fs.writeFileSync(f, s); console.log('ok');
