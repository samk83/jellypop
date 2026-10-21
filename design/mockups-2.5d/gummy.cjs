// Concept A (투명 구미 젤리) — all five screens.
const L = require('./lib.cjs');
const Cc = require('./concepts.cjs');
const P = require('./scenes.cjs')._parts;
const { W,H,defs,radial,linear,flushGrads,button,panel,logo3d,sparkle,flower,hill,groundShadow,starSvg,pillLabel,light,dark,mix,speech,confetti } = L;
const S = Cc.STYLES.gummy;
const { jellyS, houseS, treeS, cloudS, extraDefs, buildTitle, buildMap, bigEyes } = Cc;
const C = { pink:'#ff5f8a', blue:'#4fb4ff', yellow:'#ffd23f', green:'#5ed46a', purple:'#a76bff', peach:'#ff9f7a', mint:'#4fdcc4', lilac:'#ffb3e0', mal:'#ff7fae' };
function wrap(body){ return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs()}${extraDefs}${flushGrads()}${body}</svg>`; }

// gummy glass bubble
function gBubble(x,y,r,color,{trapped=null,mood='happy'}={}){
  let s=`<circle cx="${x}" cy="${y+r*0.15}" r="${r*0.95}" fill="#7a2d5e" opacity="0.18" filter="url(#soft)"/>`;
  s+=`<g filter="url(#glass)"><circle cx="${x}" cy="${y}" r="${r}" fill="${radial(light(color,0.35),color,dark(color,0.1),0.5,0.55,0.75)}" opacity="0.88"/></g>`;
  s+=`<circle cx="${x}" cy="${y}" r="${r}" fill="${radial('#fff',light(color,0.2),color,0.5,0.6,0.55)}" opacity="0.35"/>`;
  s+=`<circle cx="${x}" cy="${y}" r="${r}" fill="${linear([[0,'#fff',0],[0.6,'#fff',0],[0.82,'#fff',0.45],[1,light(color,0.4),0.15]],0,0,0,1)}"/>`;
  if(trapped) s+=jellyS(S,x,y+r*0.12,r*0.56,trapped,{shadow:false,mood:'worried',faceScale:0.95});
  else s+=bigEyes(x,y+r*0.05,r/34,mood,{iris:'#4a1d7a',sparkle:false});
  s+=`<ellipse cx="${x-r*0.38}" cy="${y-r*0.42}" rx="${r*0.26}" ry="${r*0.14}" fill="#fff" opacity="0.95" transform="rotate(-35 ${x-r*0.38} ${y-r*0.42})"/><circle cx="${x+r*0.3}" cy="${y-r*0.55}" r="${r*0.07}" fill="#fff" opacity="0.9"/>`;
  s+=`<circle cx="${x}" cy="${y}" r="${r-0.6}" fill="none" stroke="#fff" stroke-width="1.2" opacity="0.5"/>`;
  return s;
}
function gBoard(rows,{x0=12,y0=112,r=18.4,trapped={},pop=[]}={}){
  const map={r:C.pink,y:C.yellow,b:C.blue,g:C.green,p:C.purple,o:C.peach,m:C.mint};
  let g=''; const dx=r*2, dy=r*1.74;
  rows.forEach((row,ri)=>{ const off=ri%2?r:0; [...row].forEach((ch,ci)=>{ if(ch==='.')return; if(pop.includes(`${ri},${ci}`))return;
    const x=x0+off+ci*dx+r, y=y0+ri*dy+r; const lower=ch.toLowerCase(); g+=gBubble(x,y,r,map[lower]||C.pink,{trapped:ch!==lower?(trapped[ch]||C.peach):null}); }); });
  return g;
}
function gQueue(x,y,colors,count,s=0.75){
  let g=''; colors.forEach((c,i)=>{ g+=jellyS(S,x+i*26*s,y-i*2,14*s,c,{mood:i===0?'joy':'happy'}); });
  g+=`<text x="${x+colors.length*26*s+6}" y="${y+6}" font-family="'Baloo 2'" font-weight="800" font-size="20" fill="#7a2d5e" filter="url(#textShadow)">×${count}</text>`;
  return g;
}
function gCannon(x,y,{angle=-62,ball=C.pink}={}){
  // pink-cream candy cannon
  let g=P.cannon(x,y,{angle,ball});
  g=g.replace(/#b48bf0/g,'#ffb8d0').replace(/#7a4bd8/g,'#e66a8f').replace(/#5a2d91/g,'#c2457a').replace(/#e9ddff/g,'#fff0f6').replace(/#c8b4f6/g,'#ffd6e6').replace(/#7a5bc0/g,'#e08fb0').replace(/#d9c9ff/g,'#ffe6f0').replace(/#9b7be6/g,'#ff9fc0').replace(/#3b1f6e/g,'#7a2d5e').replace(/#1a0a3a/g,'#4a1d3a');
  return g;
}
function gBoss(x,y,r){
  let g=`<ellipse cx="${x}" cy="${y}" rx="${r*1.5}" ry="${r*1.3}" fill="#c89cff" opacity="0.5" filter="url(#soft24)"/>`;
  const horn=(sx)=>`<path d="M${x+sx*r*0.55} ${y-r*0.75} Q${x+sx*r*0.9} ${y-r*1.05} ${x+sx*r*0.75} ${y-r*1.45} Q${x+sx*r*0.95} ${y-r*1.1} ${x+sx*r*1.0} ${y-r*0.6} Z" fill="${linear([[0,'#8a5cf0'],[1,'#4a1d7a']],0,0,0,1)}" opacity="0.9"/>`;
  g+=horn(-1)+horn(1);
  g+=jellyS(S,x,y,r,'#8a5cf0',{mood:'angry',faceScale:1.05});
  g+=`<path d="M${x-r*0.3} ${y-r*0.98} L${x-r*0.32} ${y-r*1.25} L${x-r*0.15} ${y-r*1.08} L${x} ${y-r*1.32} L${x+r*0.15} ${y-r*1.08} L${x+r*0.32} ${y-r*1.25} L${x+r*0.3} ${y-r*0.98} Z" fill="${linear([[0,'#fff0b3'],[1,'#e9a52a']],0,0,0,1)}" stroke="#b36b00" stroke-width="1.5" stroke-linejoin="round"/>`;
  return g;
}
function gRails(y0,h){
  const rail=(x)=>`<rect x="${x}" y="${y0}" width="12" height="${h}" rx="6" fill="${linear([[0,'#fff',0.85],[0.5,'#ffd1e8',0.6],[1,'#fff',0.85]],0,0,1,0)}"/><rect x="${x+3}" y="${y0+4}" width="3" height="${h-8}" rx="1.5" fill="#fff" opacity="0.9"/>`;
  return rail(6)+rail(372)+`<rect x="6" y="${y0-4}" width="378" height="14" rx="7" fill="${linear([[0,'#fff6fa'],[1,'#f5b8d6']],0,0,0,1)}"/><rect x="10" y="${y0-2}" width="370" height="4" rx="2" fill="#fff" opacity="0.9"/>`;
}
function villageBack(){
  let b=hill(100,640,220,45,S.hills[0])+hill(320,635,200,45,S.hills[1]);
  b+=`<g opacity="0.95">${houseS(S,40,620,{s:0.5,wall:'#fff4ea',roof:'#ff8fb1'})}${houseS(S,110,628,{s:0.55,wall:'#fdf0ff',roof:'#7fd6ff'})}${treeS(S,150,630,0.55)}${houseS(S,300,626,{s:0.55,wall:'#fff6e0',roof:'#ffb347'})}${houseS(S,355,632,{s:0.5,wall:'#f3f0ff',roof:'#a76bff'})}${treeS(S,250,632,0.5,'#8fdc7a')}${P.windmill(205,618,0.5)}</g>`;
  b+=hill(195,730,300,80,S.hills[2])+hill(195,850,340,120,S.hills[3]);
  return b;
}

function play(){
  let b=`<rect width="${W}" height="${H}" fill="${linear([[0,'#ffd1e8'],[0.35,'#ffe6f1'],[0.62,'#fff6e8'],[0.72,'#fff1e0'],[0.73,'#c9f3d6'],[1,'#7fdc9a']])}"/>`;
  b+=S.fx(S,b);
  b+=`<circle cx="310" cy="610" r="120" fill="#fff" opacity="0.5" filter="url(#soft24)"/>`;
  b+=cloudS(S,60,540,0.6)+cloudS(S,340,520,0.7);
  b+=villageBack();
  [[30,700,C.pink],[60,740,'#ffe27a'],[345,690,'#fff'],[365,735,C.pink],[320,790,'#ffe27a'],[40,800,'#fff'],[90,690,C.lilac],[300,720,C.lilac],[350,820,'#fff']].forEach(([x,y,c])=>b+=flower(x,y,c,1.4));
  b+=gRails(100,470);
  b+=`<line x1="20" y1="560" x2="370" y2="560" stroke="#ff8fb1" stroke-width="2" stroke-dasharray="8 8" opacity="0.7"/>`;
  const rows=['rrybbyggrr','rybbyggrr','yrr.bbgg.y','..rrOgg...','..bbrrgg..','...byyg...'];
  b+=gBoard(rows,{trapped:{O:C.peach},pop:['4,2','4,3','5,3']});
  b+=P.popBurst(112,262,C.blue,36,'+30');
  b+=P.aimDots(205,690,112,262,'#ff8fb1');
  b+=gBubble(158,470,18.4,C.blue);
  b+=`<ellipse cx="195" cy="712" rx="140" ry="22" fill="#5fc98a" opacity="0.45"/>`;
  b+=gCannon(215,705,{angle:-112,ball:C.blue});
  b+=jellyS(S,118,690,34,C.mal,{ears:true,mood:'joy'});
  b+=`<path d="M150 672 L182 664" stroke="${C.mal}" stroke-width="9" stroke-linecap="round" opacity="0.9"/>`;
  b+=gQueue(262,752,[C.yellow,C.green,C.pink],12);
  b+=speech(20,615,120,28,'같은 색 3개!',{fs:12,tail:'right'});
  b+=P.topHud({title:'꽃밭 언덕',sub:'스테이지 3',right1:'구할 친구',right2:'0 / 1',fill:S.panel});
  b+=panel(90,796,210,34,{fill:S.panel,op:0.85,r:17});
  b+=`<text x="195" y="819" text-anchor="middle" font-family="Noto Sans KR" font-weight="800" font-size="14" fill="#fff">점수 <tspan fill="#ffe27a">860</tspan>  ·  남은 발사 <tspan fill="#ffe27a">12</tspan></text>`;
  return wrap(b);
}

function clear(){
  let b=`<rect width="${W}" height="${H}" fill="${linear([[0,'#ffc2e0'],[0.5,'#ffe3ef'],[0.72,'#fff6e8'],[0.73,'#c9f3d6'],[1,'#7fdc9a']])}"/>`;
  b+=`<g opacity="0.6">${[...Array(12)].map((_,i)=>`<path d="M195 150 L${195+Math.cos((i*30-90)*Math.PI/180)*700} ${150+Math.sin((i*30-90)*Math.PI/180)*700} L${195+Math.cos((i*30-78)*Math.PI/180)*700} ${150+Math.sin((i*30-78)*Math.PI/180)*700} Z" fill="#fff" opacity="0.55"/>`).join('')}</g>`;
  b+=`<circle cx="195" cy="150" r="140" fill="#fff" opacity="0.6" filter="url(#soft24)"/>`;
  b+=hill(100,640,220,45,S.hills[0])+hill(320,635,200,45,S.hills[1]);
  b+=`<g opacity="0.95">${houseS(S,50,622,{s:0.55,wall:'#fff4ea',roof:'#ff8fb1'})}${treeS(S,110,630,0.6)}${houseS(S,330,628,{s:0.6,wall:'#fdf0ff',roof:'#7fd6ff'})}${treeS(S,280,632,0.5,'#8fdc7a')}</g>`;
  b+=hill(195,740,320,80,S.hills[2])+hill(195,860,340,120,S.hills[3]);
  b+=`<g opacity="0.9">${confetti(5,70,[0,40,W,500])}</g>`;
  const bigStar=(x,y,r,rot)=>`<g transform="rotate(${rot} ${x} ${y})">${groundShadow(x,y+r*0.9,r*0.9,r*0.25,0.2)}<g transform="translate(0 ${r*0.16})">${starSvg(x,y,r,'#e9a52a','#d98a00')}</g><g filter="url(#glass)">${starSvg(x,y,r,'#ffd54a','#e9a52a')}</g><g opacity="0.45">${starSvg(x,y,r*0.95,'#fff','#fff').replace(/stroke="#fff"/,'stroke="none"')}</g><ellipse cx="${x-r*0.25}" cy="${y-r*0.35}" rx="${r*0.22}" ry="${r*0.1}" fill="#fff" opacity="0.85" transform="rotate(-25 ${x-r*0.25} ${y-r*0.35})"/></g>`;
  b+=bigStar(85,235,42,-15)+bigStar(305,235,42,15)+bigStar(195,195,56,0);
  b+=`<g filter="url(#bloom)">${sparkle(40,190,12)+sparkle(350,185,12)+sparkle(195,110,14)+sparkle(135,290,8,'#ffe27a')+sparkle(255,290,8,'#ffe27a')}</g>`;
  b+=jellyS(S,240,440,36,C.peach,{mood:'joy'});
  b+=jellyS(S,160,430,58,C.mal,{ears:true,mood:'joy',faceScale:1.05});
  b+=`<text x="118" y="370" font-family="'Baloo 2'" font-weight="800" font-size="20" fill="#ff4f8b" transform="rotate(-15 118 370)">♪</text><text x="262" y="380" font-family="'Baloo 2'" font-weight="800" font-size="20" fill="#c2457a" transform="rotate(15 262 380)">♪</text>`;
  b+=`<rect x="28" y="510" width="334" height="300" rx="28" fill="#7a2d5e" opacity="0.25" filter="url(#soft12)"/>`;
  b+=`<g filter="url(#glass)"><rect x="28" y="500" width="334" height="300" rx="28" fill="${linear([[0,'#ffffff'],[1,'#ffe6f1']],0,0,0,1)}" opacity="0.95"/></g>`;
  b+=`<rect x="28" y="500" width="334" height="300" rx="28" fill="none" stroke="#ffb3d1" stroke-width="3"/>`;
  b+=logo3d(195,560,'스테이지 클리어!',{fs:34,fill:'#ff6fa3',extrude:4,family:"'Noto Sans KR'",gradTop:'#fff3f8',gradBottom:'#ff4f8b',stroke:'#7a2d5e'});
  b+=`<text x="195" y="600" text-anchor="middle" font-family="Noto Sans KR" font-weight="700" font-size="15" fill="#a04a7a">점수 <tspan font-size="22" font-weight="900" fill="#ff4f8b">1,240</tspan>   ·   남은 발사 보너스 <tspan font-size="18" font-weight="900" fill="#ff4f8b">+200</tspan></text>`;
  b+=`<g>${groundShadow(195,672,40,10,0.2)}<circle cx="195" cy="650" r="40" fill="${linear([[0,'#fff6c8'],[1,'#ffd54a']],0,0,0,1)}" stroke="#e9a52a" stroke-width="4"/><circle cx="195" cy="650" r="33" fill="#fff"/>${jellyS(S,195,653,24,C.peach,{mood:'joy',shadow:false})}</g>`;
  b+=sparkle(150,625,9,'#ffd54a')+sparkle(240,680,8,'#ffd54a');
  b+=`<text x="195" y="716" text-anchor="middle" font-family="Noto Sans KR" font-weight="900" font-size="15" fill="#7a2d5e"><tspan fill="#ff7a4f">꽃잎</tspan> 스티커를 받았어요!</text><text x="195" y="736" text-anchor="middle" font-family="Noto Sans KR" font-weight="700" font-size="12" fill="#b07a9a">스티커 북 3 / 30</text>`;
  b+=button(130,775,180,46,'다음 스테이지',{color:S.btn,fs:17});
  b+=button(282,775,110,46,'지도로',{color:'#fdf6ff',fg:'#c2457a',fs:16});
  return wrap(b);
}

function boss(){
  // dusk version of the gummy world: lilac sky, translucent castle, glowing boss
  let b=`<rect width="${W}" height="${H}" fill="${linear([[0,'#5a3aa6'],[0.4,'#9b6fd8'],[0.68,'#ffb3d1'],[0.76,'#ffd6e6'],[0.78,'#5fb87a'],[1,'#3f9a5e']])}"/>`;
  b+=P.starsSky(21,70,[0,0,W,420],0.8);
  b+=`<circle cx="320" cy="150" r="60" fill="#fff3c4" opacity="0.5" filter="url(#soft24)"/><circle cx="320" cy="150" r="30" fill="${radial('#fffbe6','#fff0b3','#f5d98a',0.4,0.35,0.8)}"/>`;
  b+=cloudS(S,70,520,0.8)+cloudS(S,330,500,0.7);
  b+=`<ellipse cx="195" cy="700" rx="330" ry="110" fill="${radial('#7fdc9a','#4faa6c','#2f7a4a',0.5,0.3,0.8)}"/>`;
  b+=`<g opacity="0.92">${P.castle(195,660,0.95,'#c3a6f2')}</g>`;
  b+=P.lamp(60,672,1.0)+P.lamp(330,672,1.0);
  b+=gBoss(195,560,46);
  b+=panel(60,118,270,26,{fill:S.panel,op:0.9,r:13});
  b+=`<rect x="92" y="125" width="196" height="12" rx="6" fill="#4a1d3a"/><rect x="92" y="125" width="${196*22/36}" height="12" rx="6" fill="${linear([[0,'#ffd1e8'],[1,'#ff4f8b']],0,0,0,1)}"/><rect x="94" y="126" width="${196*22/36-4}" height="4" rx="2" fill="#fff" opacity="0.6"/>`;
  b+=`<text x="70" y="136" font-family="Noto Sans KR" font-weight="900" font-size="11" fill="#fff">뭉치</text><text x="318" y="136" text-anchor="end" font-family="'Baloo 2'" font-weight="800" font-size="13" fill="#fff">22/36</text>`;
  b+=gRails(154,416);
  b+=`<line x1="20" y1="570" x2="370" y2="570" stroke="#ff8fb1" stroke-width="2" stroke-dasharray="8 8" opacity="0.8"/>`;
  const rows=['pprrggbbyy','prrggbbyyp','..pMg..rr.','...pp.....'];
  b+=gBoard(rows,{y0:152,trapped:{M:C.lilac}});
  b+=logo3d(195,330,'뭉치의 거품 공격!',{fs:30,fill:'#ff6fa3',extrude:4,family:"'Noto Sans KR'",gradTop:'#fff0f6',gradBottom:'#ff3f8a',stroke:'#4a1d7a',rotate:-2});
  b+=`<g opacity="0.92">${gBubble(100,286,16,C.purple)}${gBubble(290,284,16,C.purple)}${gBubble(230,278,14,C.pink)}</g>`;
  b+=P.aimDots(205,690,96,320,'#ffd1e8');
  b+=gBubble(150,500,18.4,C.yellow);
  b+=`<ellipse cx="195" cy="722" rx="150" ry="20" fill="#2f7a4a" opacity="0.4"/>`;
  b+=gCannon(215,712,{angle:-80,ball:C.yellow});
  b+=jellyS(S,118,696,34,C.mal,{ears:true,mood:'happy'});
  b+=`<path d="M150 678 L182 672" stroke="${C.mal}" stroke-width="9" stroke-linecap="round" opacity="0.9"/>`;
  b+=gQueue(262,760,[C.green,C.blue,C.pink],18);
  b+=P.topHud({title:'마을 입구',sub:'스테이지 6 · 보스',right1:'보스 체력',right2:'22',fill:S.panel});
  b+=panel(90,800,210,34,{fill:S.panel,op:0.9,r:17});
  b+=`<text x="195" y="823" text-anchor="middle" font-family="Noto Sans KR" font-weight="800" font-size="14" fill="#fff">점수 <tspan fill="#ffe27a">2,410</tspan>  ·  남은 발사 <tspan fill="#ffe27a">18</tspan></text>`;
  return wrap(b);
}

module.exports = { 'gummy-1-title':()=>buildTitle(S), 'gummy-2-map':()=>buildMap(S), 'gummy-3-play':play, 'gummy-4-clear':clear, 'gummy-5-boss':boss };
