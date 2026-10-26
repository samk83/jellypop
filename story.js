// story.js — 스테이지 클리어 컷신 (이야기 데이터: story-data.js)
// 월드 3D 숲 배경(assets/bg/wN.webp) 위에 gummy.js 그림으로 만든 소품·캐릭터를 따로따로 <img> 로 얹고,
// CSS 애니메이션(transform·opacity 만)으로 움직여 가볍게 돈다. 대사는 한 줄씩 눌러 넘긴다.
// 장면 좌표는 390×844 그림 기준(땅 = y 600). 화면에 맞춰 통째로 확대·축소한다.
window.JellyStory = (() => {
  const A = window.Gummy, DATA = window.JellyStoryData, PIECES = window.JellyStoryPieces;
  const { STAGES, WORLDS } = window.JellyStages;
  const MAL = A.C.mal, SW = 390, SH = 844, GY = 600;
  const byId = {}; DATA.forEach(d => byId[d.id] = d);

  // ---------- 스타일 (한 번만 붙인다) ----------
  const css = `
#story{position:fixed;inset:0;z-index:40;overflow:hidden;background:#2a1660;color:#5a2d91;-webkit-user-select:none;user-select:none;touch-action:manipulation}
#story .cs-bg{position:absolute;inset:-4%;background:linear-gradient(#ffd1e8,#fff6e8 60%,#7fdc9a) center/cover no-repeat;animation:csPan 14s ease-out both}
#story .cs-bg.on{background-size:cover;background-position:center 70%}
#story .cs-veil{position:absolute;inset:0;background:linear-gradient(180deg,rgba(42,22,96,.35),rgba(42,22,96,0) 30%,rgba(42,22,96,0) 60%,rgba(42,22,96,.45))}
#story .cs-stage{position:absolute;left:50%;top:0;width:${SW}px;height:${SH}px;transform-origin:50% 0}
#story .cs-l{position:absolute;left:0;top:0;width:${SW}px;height:${SH}px;pointer-events:none}
#story .cs-a{position:absolute;pointer-events:none;will-change:transform}
#story .cs-a>img,#story .cs-a>i{display:block;transform-origin:50% 100%}
#story .cs-a>img{width:100%;height:auto}
#story .idle>img{animation:csIdle 1.6s ease-in-out infinite}
#story .talk>img{animation:csTalk .45s ease-in-out infinite}
#story .enter{animation:csEnter 1.1s cubic-bezier(.3,.7,.4,1) both}
#story .enterL{animation:csEnterL 1.1s cubic-bezier(.3,.7,.4,1) both}
#story .pop{animation:csPop .6s cubic-bezier(.3,1.6,.5,1) both}
#story .dizzy>img{animation:csDizzy 1.2s ease-in-out infinite}
#story .dizzy .swirl{position:absolute;left:50%;top:-6%;width:70%;margin-left:-35%;animation:csSpin 1.4s linear infinite}
#story .gone{animation:csGone 1.4s ease-in both}
#story .fly{animation:csFly 4.5s ease-in-out both}
#story .fall{animation:csFall 2.2s cubic-bezier(.4,.1,.6,1) both}
#story .float>img{animation:csFloat 2.4s ease-in-out infinite}
#story .dance>img{animation:csDance .7s ease-in-out infinite}
#story .twinkle{animation:csTwinkle 1.8s ease-in-out infinite}
#story .rain{animation:csRain 3.2s linear infinite}
#story .hide{display:none}
#story .cs-top{position:absolute;left:0;right:0;top:0;display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding:calc(env(safe-area-inset-top) + 12px) 12px 0}
#story .cs-chap{background:rgba(255,255,255,.92);border:2px solid #ffb3d1;border-radius:16px;padding:6px 14px 8px;box-shadow:0 6px 18px rgba(90,45,145,.25);animation:csDrop .7s cubic-bezier(.3,1.5,.5,1) both}
#story .cs-chap small{display:block;font-size:12px;font-weight:800;color:#a04a7a}
#story .cs-chap b{display:block;font-family:var(--font-display);font-weight:900;font-size:20px;color:#ff4f8b;line-height:1.2}
#story .cs-skip{min-height:44px;min-width:44px;padding:0 16px;border-radius:99px;background:rgba(255,255,255,.88);color:#5a2d91;font-size:15px;box-shadow:0 4px 12px rgba(42,11,78,.25)}
#story .cs-pieces{position:absolute;right:12px;top:calc(env(safe-area-inset-top) + 64px);display:flex;gap:4px;background:rgba(255,255,255,.85);border-radius:12px;padding:5px 7px;font-size:11px;font-weight:800;color:#7a2d5e;align-items:center}
#story .cs-pieces i{width:16px;height:20px;border-radius:3px;background:#e6d8f3;display:block}
#story .cs-pieces i.on{background:linear-gradient(#fffaf0,#ffe2a8);box-shadow:0 0 0 1.5px #e0a84a}
#story .cs-card{position:absolute;left:50%;top:31%;width:min(84vw,330px);transform:translateX(-50%);background:linear-gradient(#fffdf6,#fff0d6);border:3px solid #e8b65c;border-radius:14px;padding:16px 14px;text-align:center;
  font-family:var(--font-display);font-weight:900;color:#8a4a1a;font-size:20px;line-height:1.5;box-shadow:0 14px 36px rgba(42,11,78,.4)}
#story .cs-card span{display:inline-block;margin:0 3px;animation:csPiece .8s cubic-bezier(.3,1.5,.5,1) both}
#story .cs-box{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom) + 14px);transform:translateX(-50%);width:min(calc(100% - 24px),440px);
  background:rgba(255,255,255,.95);border:3px solid #ffb3d1;border-radius:22px;padding:14px 16px 12px;box-shadow:0 10px 28px rgba(42,11,78,.35);cursor:pointer}
#story .cs-who{display:inline-block;margin:-28px 0 6px -4px;background:#ff4f8b;color:#fff;border-radius:99px;padding:3px 12px;font-family:var(--font-display);font-weight:900;font-size:14px;box-shadow:0 3px 8px rgba(90,45,145,.3)}
#story .cs-who.dark{background:#3a1d6e;color:#ffd1e6}
#story .cs-who.none{visibility:hidden}
#story .cs-text{min-height:3.1em;font-size:17px;line-height:1.55;font-weight:700;color:#5a2d91;word-break:keep-all}
#story .cs-row{display:flex;align-items:center;justify-content:space-between;margin-top:8px}
#story .cs-dots{display:flex;gap:5px}
#story .cs-dots i{width:7px;height:7px;border-radius:50%;background:rgba(122,45,94,.25)}
#story .cs-dots i.on{background:#ff4f8b}
#story .cs-next{min-height:46px;padding:0 20px;border-radius:99px;font-size:17px;color:#fff;background:linear-gradient(#ff7aa8,#ff4f8b);box-shadow:0 4px 0 #c2457a,0 8px 16px rgba(194,69,122,.35)}
@keyframes csPan{from{transform:scale(1.12) translateY(1.5%)}to{transform:scale(1) translateY(0)}}
@keyframes csIdle{0%,100%{transform:scale(1,1)}50%{transform:scale(1.04,.96)}}
@keyframes csTalk{0%,100%{transform:translateY(0) scale(1,1)}40%{transform:translateY(-9%) scale(.96,1.05)}80%{transform:translateY(0) scale(1.06,.94)}}
@keyframes csEnter{0%{transform:translate(220px,-40px) rotate(320deg)}35%{transform:translate(110px,0) rotate(160deg)}55%{transform:translate(50px,-46px) rotate(40deg)}75%{transform:translate(0,0) rotate(0)}85%{transform:translate(0,0) scale(1.15,.85)}100%{transform:none}}
@keyframes csEnterL{0%{transform:translate(-220px,-40px) rotate(-320deg)}35%{transform:translate(-110px,0) rotate(-160deg)}55%{transform:translate(-50px,-46px) rotate(-40deg)}75%{transform:translate(0,0) rotate(0)}85%{transform:translate(0,0) scale(1.15,.85)}100%{transform:none}}
@keyframes csPop{from{transform:scale(0);opacity:0}to{transform:none;opacity:1}}
@keyframes csDizzy{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg) translateY(4%)}}
@keyframes csSpin{to{transform:rotate(360deg)}}
@keyframes csGone{0%{transform:none;opacity:1}30%{transform:translate(-10px,-20px) rotate(-30deg)}100%{transform:translate(260px,120px) rotate(540deg) scale(.4);opacity:0}}
@keyframes csFly{0%{transform:translateX(-160px) translateY(20px);opacity:0}15%{opacity:1}50%{transform:translateX(200px) translateY(-20px)}85%{opacity:1}100%{transform:translateX(560px) translateY(10px);opacity:0}}
@keyframes csFall{0%{transform:translate(70px,-260px) rotate(-30deg);opacity:0}10%{opacity:1}35%{transform:translate(-30px,-160px) rotate(20deg)}60%{transform:translate(30px,-70px) rotate(-14deg)}100%{transform:none}}
@keyframes csFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8%)}}
@keyframes csDance{0%,100%{transform:translateY(0) rotate(-6deg)}50%{transform:translateY(-22%) rotate(6deg)}}
@keyframes csTwinkle{0%,100%{opacity:.25;transform:scale(.7)}50%{opacity:1;transform:scale(1.1)}}
@keyframes csRain{from{transform:translateY(-120px) rotate(0)}to{transform:translateY(900px) rotate(540deg)}}
@keyframes csDrop{from{transform:translateY(-80px)}to{transform:none}}
@keyframes csPiece{from{transform:translateY(-60px) rotate(-25deg) scale(.4);opacity:0}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){#story *{animation:none!important}#story .gone,#story .fly{opacity:0}}
`;
  function ensureCss() { if (!document.getElementById('storyCss')) { const s = document.createElement('style'); s.id = 'storyCss'; s.textContent = css; document.head.appendChild(s); } }

  // ---------- 그림 조각 ----------
  const cache = {};
  const art = (key, make) => cache[key] || (cache[key] = make());
  const jellyImg = (color, r, opt = {}) => art(`j-${color}-${r}-${opt.mood || 'happy'}-${opt.ears ? 1 : 0}`, () => A.img(A.jelly(0, 0, r, color, opt), { x: -r * 1.35, y: -r * 1.75, w: r * 2.7, h: r * 2.95 }));
  const bossImg = (kind, r, mood) => art(`b-${kind}-${r}-${mood}`, () => kind === 'nomnom'
    ? A.img(A.nomnom(0, 0, r, { mood }), { x: -r * 1.45, y: -r * 1.75, w: r * 2.9, h: r * 2.95 })
    : A.img(A.boss(0, 0, r, { mood, kind }), { x: -r * 1.45, y: -r * 1.75, w: r * 2.9, h: r * 2.95 }));
  const nomImg = r => art('nom-' + r, () => A.img(A.nomnom(0, 0, r, { mini: true, mood: 'happy' }), { x: -r * 1.6, y: -r * 1.9, w: r * 3.2, h: r * 3.2 }));
  const swirl = () => art('swirl', () => A.img([0, 1, 2].map(i => { const a = i * 2.094; return A.starSvg(Math.cos(a) * 40, Math.sin(a) * 12, 9); }).join('') +
    `<ellipse cx="0" cy="0" rx="40" ry="12" stroke="#fff" stroke-width="2" fill="none" opacity=".6"/>`, { x: -52, y: -24, w: 104, h: 48 }));
  const paper = n => art('paper-' + n, () => A.img(`<path d="M-30 -22 L26 -26 L32 18 L4 22 L-2 16 L-28 24 Z" fill="#fffaf0" stroke="#e0a84a" stroke-width="2"/>` +
    `<path d="M-20 -8 H18 M-18 2 H14" stroke="#c9884a" stroke-width="3" stroke-linecap="round" opacity=".6"/>` + A.sparkle(26, -22, 8, '#ffe27a'), { x: -40, y: -36, w: 80, h: 70 }));
  const partyHat = () => art('hat', () => A.img(`<path d="M0 -40 L18 6 Q0 14 -18 6 Z" fill="#ff5f8a" stroke="#fff" stroke-width="2"/><path d="M-9 -14 L9 -10 M-13 -2 L13 2" stroke="#ffe27a" stroke-width="4"/><circle cx="0" cy="-42" r="6" fill="#ffe27a"/>`, { x: -22, y: -50, w: 44, h: 64 }));
  const tear = () => art('tear', () => A.img(`<path d="M0 -8 Q6 2 0 8 Q-6 2 0 -8Z" fill="#8fd3ff"/>`, { x: -8, y: -10, w: 16, h: 20 }));
  const confettiPiece = (c, i) => art('cf-' + c + i, () => A.img(i % 2 ? `<rect x="-4" y="-7" width="8" height="14" rx="2" fill="${c}"/>` : `<circle r="5" fill="${c}"/>`, { x: -8, y: -8, w: 16, h: 16 }));
  function cake(x, y, s, candles) {
    const t = (yy, w, h, c, top) => `<rect x="${x - w / 2}" y="${yy - h}" width="${w}" height="${h}" rx="${8 * s}" fill="${A.linear([[0, A.light(c, .25)], [1, A.dark(c, .12)]], 0, 0, 0, 1)}"/>` +
      `<path d="M${x - w / 2} ${yy - h + 10 * s} Q${x - w / 4} ${yy - h + 22 * s} ${x} ${yy - h + 10 * s} Q${x + w / 4} ${yy - h + 22 * s} ${x + w / 2} ${yy - h + 10 * s} V${yy - h + 4 * s} H${x - w / 2} Z" fill="${top}"/>`;
    let g = A.groundShadow(x, y, 90 * s, 12 * s, .3);
    g += t(y, 170 * s, 54 * s, '#ffb3d1', '#fff') + t(y - 54 * s, 128 * s, 46 * s, '#c9a6ff', '#fff6fb') + t(y - 100 * s, 86 * s, 40 * s, '#ffe08a', '#fff');
    for (let i = 0; i < candles; i++) { const cx = x + (i - (candles - 1) / 2) * 16 * s, cy = y - 140 * s; g += `<rect x="${cx - 3 * s}" y="${cy - 22 * s}" width="${6 * s}" height="${22 * s}" rx="2" fill="#7fd6ff"/><ellipse cx="${cx}" cy="${cy - 28 * s}" rx="${4 * s}" ry="${7 * s}" fill="#ffd54a"/>` + A.sparkle(cx, cy - 28 * s, 6 * s, '#fff6c0', .9); }
    [[-60, -20], [50, -24], [-30, -70], [36, -76]].forEach(([dx, dy], i) => g += `<circle cx="${x + dx * s}" cy="${y + dy * s}" r="${5 * s}" fill="${['#ff4f6f', '#4fb4ff', '#ffd23f', '#4fdcc4'][i]}"/>`);
    return g;
  }

  // 장면 소품 (390×844, 땅 = GY). 뒤쪽 배경은 월드 3D 숲 그림이 깔려 있으니 양옆·땅 근처만 그린다
  function props(kind) {
    const g = [], add = s => g.push(s), fl = (n, seed, cols) => { for (let i = 0; i < n; i++) { const x = 20 + ((i * 97 + seed * 31) % 350), y = GY + 8 + ((i * 53 + seed) % 34); add(A.flower(x, y, cols[i % cols.length], 1.2)); } };
    // 무대처럼 서는 풀밭 언덕 (월드 그림과 캐릭터를 이어 준다)
    const ground = { 1: '#7fdc9a', 2: '#b8d86a', 3: '#d9b07a', 4: '#ffc4dc', 5: '#b7a0e8' };
    return (w) => {
      add(`<ellipse cx="195" cy="${GY + 70}" rx="300" ry="96" fill="${A.radial(A.light(ground[w], .3), ground[w], A.dark(ground[w], .2), .45, .15, .9)}" opacity=".95"/>`);
      switch (kind) {
        case 'houses': add(A.house(52, GY - 10, { s: .9, wall: '#fff4ea', roof: '#ff8fb1' }) + A.house(340, GY - 4, { s: 1, wall: '#f3f0ff', roof: '#7fd6ff' }) + A.tree(372, GY + 10, .8)); fl(5, 1, ['#ff8fb1', '#ffe27a', '#fff']); break;
        case 'fountain': add(A.fountain(330, GY + 6, .9) + A.tree(30, GY, .9)); fl(4, 2, ['#7fd6ff', '#fff']); break;
        case 'flowers': fl(14, 3, ['#ff8fb1', '#ffe27a', '#ff9f7a', '#fff', '#c9a6ff']); add(A.tree(30, GY - 4, 1) + A.tree(365, GY, .9, '#8fdc7a')); break;
        case 'falls': add(`<path d="M300 ${GY - 260} h70 v280 h-70z" fill="${A.linear([[0, '#bfe9ff'], [1, '#7fd6ff']], 0, 0, 0, 1)}" opacity=".75"/>` + A.cloud(335, GY + 4, .5, .9) + A.cloud(40, GY - 220, .5, .7)); fl(5, 4, ['#fff', '#ffe27a']); break;
        case 'roofs': add(A.house(60, GY + 4, { s: 1.4, wall: '#fff6e0', roof: '#ffb347' }) + A.lamp(350, GY + 4, 1.1, true)); break;
        case 'gate': add(A.tower(36, GY + 6, 46, 150, '#c3a6f2', { flag: '#ff5f8a' }) + A.tower(354, GY + 6, 46, 150, '#c3a6f2', { flag: '#ffd23f' }) + A.fence(80, GY + 6, 310, 1)); break;
        case 'syrup': add(A.tree(40, GY, 1.2, '#b8d86a') + A.tree(360, GY + 4, 1.1, '#e0a050') + A.pot(320, GY + 18, .7)); fl(4, 5, ['#ffb347', '#fff']); break;
        case 'cotton': add(A.cottonTree(46, GY + 4, 1.1) + A.cottonTree(352, GY + 8, 1, '#c9e8ff') + A.cloud(195, GY - 330, .6, .6)); break;
        case 'stream': add(`<path d="M-10 ${GY + 40} Q195 ${GY + 10} 400 ${GY + 46} V${GY + 76} Q195 ${GY + 40} -10 ${GY + 70} Z" fill="#7fd6ff" opacity=".7"/>` + A.tree(30, GY - 6, 1, '#e0a050')); fl(4, 6, ['#ffe27a', '#fff']); break;
        case 'mushrooms': add(A.mushroom(40, GY + 6, 1.4) + A.mushroom(350, GY + 10, 1.2, '#7fd6ff') + A.mushroom(310, GY + 30, .8, '#ffd23f')); break;
        case 'night': add(`<rect width="390" height="844" fill="#1d0f3a" opacity=".35"/>` + A.starsSky(5, 30, [0, 0, 390, 300], .9) + A.lamp(40, GY + 4, 1.1, true) + A.mushroom(350, GY + 8, 1, '#a76bff')); break;
        case 'cave': add(A.crystalRock(40, GY + 6, 1.2) + A.crystalRock(352, GY + 10, 1, '#ffd36a') + A.stalactite(80, 0, 140) + A.stalactite(320, 0, 180)); break;
        case 'caramel': add(A.stalactite(60, 0, 220) + A.stalactite(150, 0, 120) + A.stalactite(300, 0, 200) + A.crystalRock(350, GY + 10, .9, '#ffb347')); break;
        case 'lake': add(A.puddingHill(50, GY + 10, 1.1) + A.puddingHill(345, GY + 14, .9, '#ffb3a0')); break;
        case 'crystal': add(A.crystalRock(36, GY + 4, 1.4) + A.crystalRock(356, GY + 6, 1.3, '#c9a6ff') + A.crystalRock(320, GY + 30, .7, '#7fd6ff')); break;
        case 'dark': add(`<rect width="390" height="844" fill="#120a28" opacity=".45"/><circle cx="195" cy="${GY - 60}" r="190" fill="#fff6c0" opacity=".18" filter="url(#soft24)"/>` + A.crystalRock(40, GY + 6, 1, '#9b6bff')); break;
        case 'pudding': add(A.puddingHill(46, GY + 6, 1.4) + A.puddingHill(350, GY + 10, 1.2, '#ffc94a') + A.stalactite(200, 0, 120)); break;
        case 'factory': add(A.factory(60, GY + 6, .8) + A.belt(200, GY + 40, 150, 1) + A.gear(350, GY - 60, 30)); break;
        case 'oven': add(A.cookie(50, GY - 6, 26) + A.cookie(340, GY + 6, 22) + A.cookie(370, GY - 30, 16) + A.pot(30, GY + 30, .6)); break;
        case 'freezer': add(`<rect width="390" height="844" fill="#cfefff" opacity=".25"/>` + A.crystalRock(40, GY + 6, 1.2, '#dff4ff') + A.crystalRock(352, GY + 8, 1.1, '#bfe9ff') + A.cloud(195, GY - 330, .6, .7, '#fff', '#bfe9ff')); break;
        case 'choco': add(`<path d="M-10 ${GY + 36} Q195 ${GY + 6} 400 ${GY + 40} V${GY + 80} Q195 ${GY + 46} -10 ${GY + 76} Z" fill="#8a5a3a" opacity=".85"/>` + A.cookie(130, GY + 50, 14) + A.cookie(250, GY + 52, 14)); break;
        case 'gifts': add(A.giftBox(46, GY + 4, 1.2) + A.giftBox(345, GY + 8, 1, '#ff5f8a') + A.giftBox(310, GY + 30, .7, '#ffd23f')); break;
        case 'gears': add(A.gear(46, GY - 30, 40) + A.gear(345, GY - 50, 30, '#ffd36a') + A.pipe(300, GY - 220, 24, 200)); break;
        case 'castle': add(A.castle(195, GY - 120, .8, '#c3a6f2', { night: true }) + A.tower(30, GY + 6, 40, 120, '#a990e0')); break;
        case 'jail': add([40, 110, 280, 350].map((x, i) => A.bubble(x, GY - 220 - (i % 2) * 60, 26, ['#5fc8ff', '#7fd8ff', '#ffd0a0', '#c9a6ff'][i])).join('') + A.tower(370, GY + 6, 40, 160, '#8f7bc9')); break;
        case 'mirror': add(A.mirror(46, GY - 30, 1.1) + A.mirror(345, GY - 30, 1.1)); break;
        case 'tower': add(A.starsSky(8, 30, [0, 0, 390, 320], .9) + A.tower(46, GY + 6, 50, 200, '#a070ff', { flag: '#ffd23f' })); break;
        case 'cake': add(cake(316, GY + 8, .72, 1) + A.pot(40, GY + 20, .8)); break;
        case 'party': add(A.starsSky(2, 20, [0, 0, 390, 260], .6)); break;
      }
      return A.img(g.join(''), { x: 0, y: 0, w: SW, h: SH, lx: 100, ly: -120 }, 'class="cs-l"');
    };
  }

  // ---------- 컷신 열기 ----------
  let el = null, onKey = null, onResize = null, pending = null, stopTyping = null;
  function has(id) { return !!byId[id]; }
  function open(id, done, opt = {}) {
    const d = byId[id], st = STAGES[id - 1];
    if (!d || !st) { done && done(); return; }
    ensureCss();
    if (el) { const prevDone = pending; close(); prevDone && prevDone(); }   // 열려 있던 컷신은 끝낸 것으로 처리
    pending = done;
    const sfx = opt.sfx || (() => {});
    const w = st.world, fr = st.friends;
    const names = { mal: '말랑이', f: fr[0].name, f2: (fr[1] || fr[0]).name, f3: (fr[2] || fr[0]).name, boss: st.boss ? st.boss.name : '', nonom: '노놈', nom: '꼬마 놈놈', all: '모두 함께' };
    el = document.createElement('div'); el.id = 'story';
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', `이야기 ${id}: ${d.title}`);
    // 배경: 월드 3D 숲 그림 (실패하면 그라데이션 그대로)
    const bg = `<div class="cs-bg" id="csBg"></div><div class="cs-veil"></div>`;
    // 배우들
    const actors = [];
    const actor = (key, x, y, w2, html, cls = '') => actors.push(`<div class="cs-a ${cls}" data-k="${key}" style="left:${x - w2 / 2}px;top:${y}px;width:${w2}px;transform-origin:50% 100%">${html}</div>`);
    const place = (key, x, r, html, cls, yOff = 0) => { const wpx = r * 2.7, hpx = r * 2.95; actor(key, x, GY - hpx + (hpx - r * 1.75 - r * .92) + yOff, wpx, html, cls); };
    // 이 월드에서 먼저 구한 친구들이 뒤에서 응원 (엔딩은 30명 전부)
    const prev = STAGES.slice((w - 1) * 6, id - 1).flatMap(s => s.friends).slice(-6);
    if (d.kind !== 'ending') prev.forEach((f, i) => place('trail' + i, 40 + (i % 2 ? 330 - i * 22 : 20 + i * 24), 17, jellyImg(f.color, 17, { mood: 'joy' }), 'idle pop', -54 - (i % 3) * 6));
    if (d.kind === 'ending') {
      STAGES.slice(0, 29).flatMap(s => s.friends).forEach((f, i) => {
        const row = i % 3, x = 20 + ((i * 47) % 350), yo = -120 + row * 34;
        place('crowd' + i, x, 15, jellyImg(f.color, 15, { mood: 'joy' }), 'idle crowd', yo);
      });
      actor('cake', 195, GY - 250, 170, art('cake', () => A.img(cake(0, 0, .85, 5), { x: -85, y: -170, w: 170, h: 190 })), 'hide');
      place('nonom', 220, 46, bossImg('nomnom', 46, 'worried'), 'idle', -10);
      actor('hat', 220, GY - 160, 44, partyHat(), 'hide');
      actor('tear', 196, GY - 92, 16, tear(), 'float');
      place('f', 320, 30, jellyImg(fr[0].color, 30, { mood: 'happy' }), 'idle enter');
    } else {
      place('f', 262, 34, jellyImg(fr[0].color, 34, { mood: 'joy' }), 'idle enter');
      if (fr[1]) place('f2', 330, 26, jellyImg(fr[1].color, 26, { mood: 'joy' }), 'idle enter', 8);
      if (fr[2]) place('f3', 205, 24, jellyImg(fr[2].color, 24, { mood: 'joy' }), 'idle enterL', 22);
    }
    place('mal', d.kind === 'ending' ? 110 : 140, 50, jellyImg(MAL, 50, { ears: true, mood: 'joy' }), 'idle');
    if (d.kind === 'boss' || d.kind === 'invite') {
      const bx = 285, by = 140;
      actor('boss', bx, by, 150, bossImg(st.boss.kind, 52, 'o') + `<div class="swirl">${swirl()}</div>`, 'dizzy');
      actor('piece', 200, GY - 230, 80, paper(d.piece), 'hide');
    }
    if (d.peek === 'nonom') actor('peek', 40, 70, 110, bossImg('nomnom', 34, 'angry'), 'hide');
    if (d.peek === 'nom') actor('peek', 40, 120, 70, nomImg(18), 'hide');
    // 반짝이 · 색종이
    const sparks = [[60, 180], [330, 230], [200, 120], [110, 330], [300, 380]].map(([x, y], i) => `<div class="cs-a twinkle" style="left:${x}px;top:${y}px;width:22px;animation-delay:${i * .35}s">${art('sp', () => A.img(A.sparkle(0, 0, 10, '#fff'), { x: -12, y: -12, w: 24, h: 24 }))}</div>`).join('');
    const confetti = d.kind === 'ending' ? `<div class="cs-l hide" data-k="confetti">${Array.from({ length: 26 }, (_, i) => `<div class="cs-a rain" style="left:${(i * 61) % 380}px;top:0;width:12px;animation-delay:${-(i * .37) % 3.2}s;animation-duration:${2.6 + (i % 5) * .3}s">${confettiPiece(['#ff5f8a', '#ffd23f', '#4fb4ff', '#4fdcc4', '#a76bff'][i % 5], i)}</div>`).join('')}</div>` : '';
    const got = d.piece ? d.piece - 1 : DATA.filter(x => x.id < id && x.piece).length;
    const pieceChip = (d.kind === 'boss' || d.kind === 'invite') ? `<div class="cs-pieces" aria-label="초대장 조각 ${d.piece} / 4">초대장 조각 ${PIECES.map((_, i) => `<i class="${i < got ? 'on' : ''}" data-p="${i}"></i>`).join('')}</div>` : '';
    el.innerHTML = bg + `<div class="cs-stage" id="csStage">${props(d.prop)(w)}${sparks}${actors.join('')}${confetti}</div>` +
      `<div class="cs-top"><div class="cs-chap"><small>월드 ${w} · ${WORLDS[w - 1]} — 스테이지 ${id}</small><b>${d.title}</b></div><button class="cs-skip" id="csSkip">건너뛰기</button></div>` + pieceChip +
      (d.kind === 'invite' ? `<div class="cs-card hide" id="csCard">${[2, 0, 1].map((k, i) => `<span style="animation-delay:${i * .3}s">${PIECES[k]}</span>`).join(' ')}<br><span style="animation-delay:1s;font-size:16px">${PIECES[3]}</span></div>` : '') +
      `<div class="cs-box" id="csBox"><div class="cs-who" id="csWho"></div><div class="cs-text" id="csText" aria-live="polite"></div>` +
      `<div class="cs-row"><div class="cs-dots">${d.lines.map(() => '<i></i>').join('')}</div><button class="cs-next" id="csNext">다음 ▶</button></div></div>`;
    document.body.appendChild(el);
    const $ = k => el.querySelector(`[data-k="${k}"]`);
    // 배경 그림은 다 불러온 뒤에 바꿔 끼운다 (없으면 그라데이션)
    const me = el, im = new Image(); im.onload = () => { const b = el === me && el.querySelector('#csBg'); if (b) { b.style.backgroundImage = `url(${im.src})`; b.classList.add('on'); } }; im.src = `assets/bg/w${w}.webp`;
    // 화면 맞추기: 장면 전체가 보이게(contain), 단 대사 상자 위로 땅이 오도록
    onResize = () => {
      const vw = innerWidth, vh = innerHeight, k = Math.min(vw / SW, vh / SH * 1.0);
      const stg = el.querySelector('#csStage'); stg.style.transform = `translateX(-50%) scale(${k})`;
      const box = el.querySelector('#csBox').getBoundingClientRect();
      // 땅(y=GY+40)이 대사 상자보다 아래로 가려지면 위로 올린다
      const over = (GY + 40) * k - (box.top - 8);
      stg.style.top = (vh - SH * k > 0 ? Math.max(0, (vh - SH * k) / 2) : 0) - Math.max(0, over) + 'px';
    };
    onResize(); addEventListener('resize', onResize);
    // 대사 진행
    let li = -1, typing = null, full = '';
    const textEl = el.querySelector('#csText'), whoEl = el.querySelector('#csWho'), nextEl = el.querySelector('#csNext');
    const dots = [...el.querySelectorAll('.cs-dots i')];
    function cue(i) {
      // 줄마다 일어나는 일
      if (d.kind === 'boss' || d.kind === 'invite') {
        if (i === 1) { $('boss').className = 'cs-a gone'; $('piece').className = 'cs-a fall'; sfx('rescue'); setTimeout(() => { const p = el === me && el.querySelector(`.cs-pieces i[data-p="${d.piece - 1}"]`); if (p) p.classList.add('on'); }, 1600); }
        if (d.kind === 'invite' && i === 2) { el.querySelector('#csCard').classList.remove('hide'); $('piece').classList.add('hide'); sfx('win'); }
        if (d.kind === 'invite' && i === 3) { $('boss').className = 'cs-a float'; $('boss').querySelector('.swirl') && $('boss').querySelector('.swirl').remove(); $('boss').querySelector('img').outerHTML = bossImg(st.boss.kind, 52, 'worried'); }
      }
      if (d.peek) { const p = $('peek'); const sp = d.lines[i][0]; if (sp === 'nonom' || sp === 'nom' || (i === 1 && !d.lines.some(l => l[0] === 'nonom' || l[0] === 'nom'))) p.className = 'cs-a fly'; }
      if (d.kind === 'ending') {
        if (i === 2) { $('nonom').querySelector('img').outerHTML = bossImg('nomnom', 46, 'happy'); $('tear').classList.add('hide'); }
        if (i === 3) {
          $('hat').className = 'cs-a pop'; $('cake').className = 'cs-a pop'; el.querySelector('[data-k="confetti"]').classList.remove('hide');
          el.querySelectorAll('.crowd').forEach((c, k) => { c.classList.add('dance'); c.classList.remove('idle'); c.querySelector('img').style.animationDelay = (k % 7) * .09 + 's'; });
          $('mal').classList.add('dance'); sfx('win');
        }
      }
      // 말하는 캐릭터만 통통
      el.querySelectorAll('.talk').forEach(a => a.classList.remove('talk'));
      const sp = d.lines[i][0];
      const who = sp === 'all' ? ['mal', 'f', 'f2', 'f3', 'nonom'] : sp === 'nom' ? ['peek'] : sp ? [sp] : [];
      who.forEach(k => { const a = $(k); if (a && !a.classList.contains('gone')) a.classList.add('talk'); });
    }
    function show(i) {
      li = i; const [sp, t] = d.lines[i];
      whoEl.textContent = sp ? names[sp] : '·'; whoEl.className = 'cs-who' + (sp ? '' : ' none') + (sp === 'nonom' || sp === 'nom' || sp === 'boss' ? ' dark' : '');
      dots.forEach((x, k) => x.classList.toggle('on', k <= i));
      nextEl.textContent = i < d.lines.length - 1 ? '다음 ▶' : (id === STAGES.length ? '끝!' : '계속 ▶');
      cue(i);
      // 글자가 톡톡 찍히는 효과 (누르면 바로 다 보임)
      full = t; let n = 0; textEl.textContent = '';
      clearInterval(typing);
      typing = setInterval(() => { n += 2; textEl.textContent = full.slice(0, n); if (n >= full.length) { clearInterval(typing); typing = null; } }, 32);
    }
    function next() {
      if (typing) { clearInterval(typing); typing = null; textEl.textContent = full; return; }
      if (li < d.lines.length - 1) show(li + 1); else finish();
    }
    stopTyping = () => { clearInterval(typing); typing = null; };
    function finish() { if (el !== me) return; close(); done && done(); }
    el.querySelector('#csBox').addEventListener('click', e => { e.stopPropagation(); next(); });
    el.addEventListener('click', e => { if (e.target.closest('.cs-top')) return; next(); });
    el.querySelector('#csSkip').addEventListener('click', e => { e.stopPropagation(); finish(); });
    onKey = e => {
      if (e.key === 'Escape') { e.preventDefault(); finish(); }
      else if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); if (document.activeElement === el.querySelector('#csSkip')) finish(); else next(); }
      else if (e.key === 'Tab') { e.preventDefault(); (document.activeElement === nextEl ? el.querySelector('#csSkip') : nextEl).focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    // 친구가 굴러 들어오는 타이밍에 맞춰 첫 줄 시작
    show(0);
    setTimeout(() => nextEl.focus({ preventScroll: true }), 50);
    sfx('rescue');
    return el;
  }
  function close(silent) {
    if (!el) return;
    if (onKey) document.removeEventListener('keydown', onKey, true);
    if (onResize) removeEventListener('resize', onResize);
    if (stopTyping) stopTyping();
    el.remove(); el = null; onKey = null; onResize = null; pending = null; stopTyping = null;
  }
  return { open, close, has, isOpen: () => !!el, DATA };
})();
