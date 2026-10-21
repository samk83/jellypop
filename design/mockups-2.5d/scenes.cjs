const L = require('./lib.cjs');
const { W,H,defs,radial,linear,flushGrads,jelly,bubble,house,tree,cloud,coin,button,panel,hudText,logo3d,confetti,sparkle,road,sampleCurve,flower,hill,fence,speech,groundShadow,starSvg,pillLabel,light,dark,mix } = L;

function wrap(body){ return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs()}${flushGrads()}${body}</svg>`; }
const C = { pink:'#ff5f8a', blue:'#4fb4ff', yellow:'#ffd23f', green:'#5ed46a', purple:'#a76bff', peach:'#ff9f7a', mint:'#4fdcc4', lilac:'#ffb3e0', mal:'#ff7fae' };

// ---------- shared compound pieces ----------
function starsSky(seed=3,n=40,area=[0,0,W,300],op=0.9){
  let r=seed; const rnd=()=>{r=(r*9301+49297)%233280;return r/233280;}; let g='';
  for(let i=0;i<n;i++){const x=area[0]+rnd()*area[2],y=area[1]+rnd()*area[3],s=0.6+rnd()*1.6;g+=`<circle cx="${x}" cy="${y}" r="${s}" fill="#fff" opacity="${op*(0.4+rnd()*0.6)}"/>`;}
  return g;
}
function ribbon(x,y,w,h,text,{color='#7a4bd8',fs=17}={}){
  const d=dark(color,0.35);
  return `<g filter="url(#dropShadow)">
    <path d="M${x-w/2-18} ${y-h/2+6} L${x-w/2+6} ${y-h/2+6} L${x-w/2+6} ${y+h/2+6} L${x-w/2-18} ${y+h/2+6} L${x-w/2-6} ${y+6} Z" fill="${d}"/>
    <path d="M${x+w/2+18} ${y-h/2+6} L${x+w/2-6} ${y-h/2+6} L${x+w/2-6} ${y+h/2+6} L${x+w/2+18} ${y+h/2+6} L${x+w/2+6} ${y+6} Z" fill="${d}"/>
    <path d="M${x-w/2+6} ${y+h/2} L${x-w/2-2} ${y+h/2+8} L${x-w/2+6} ${y+h/2+8}Z" fill="${dark(color,0.6)}"/>
    <path d="M${x+w/2-6} ${y+h/2} L${x+w/2+2} ${y+h/2+8} L${x+w/2-6} ${y+h/2+8}Z" fill="${dark(color,0.6)}"/>
    <path d="M${x-w/2} ${y-h/2} Q${x} ${y-h/2-5} ${x+w/2} ${y-h/2} L${x+w/2} ${y+h/2} Q${x} ${y+h/2-5} ${x-w/2} ${y+h/2} Z" fill="${linear([[0,light(color,0.25)],[1,color]],0,0,0,1)}"/>
    <path d="M${x-w/2} ${y-h/2} Q${x} ${y-h/2-5} ${x+w/2} ${y-h/2} L${x+w/2} ${y-h/2+h*0.45} Q${x} ${y-h/2+h*0.4} ${x-w/2} ${y-h/2+h*0.45} Z" fill="#fff" opacity="0.18"/>
  </g>
  <text x="${x}" y="${y+fs*0.38}" text-anchor="middle" font-family="Noto Sans KR" font-weight="900" font-size="${fs}" fill="#fff" filter="url(#textShadow)">${text}</text>`;
}
function tower(x,y,w,h,c,{flag='#ff5f8a',s=1}={}){
  // cylinder tower with cone roof
  const r=w/2; const cr=dark(c,0.0);
  let g='';
  g+=`<rect x="${x-r}" y="${y-h}" width="${w}" height="${h}" fill="${linear([[0,light(c,0.3)],[0.35,light(c,0.08)],[0.7,c],[1,dark(c,0.35)]],0,0,1,0)}"/>`;
  g+=`<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r*0.3}" fill="${dark(c,0.25)}"/>`;
  // battlement ring
  g+=`<rect x="${x-r*1.12}" y="${y-h-6*s}" width="${w*1.12}" height="${12*s}" fill="${linear([[0,light(c,0.35)],[0.7,c],[1,dark(c,0.35)]],0,0,1,0)}"/>`;
  for(let i=0;i<4;i++){const bx=x-r*1.12+i*(w*1.12/3.6);g+=`<rect x="${bx}" y="${y-h-14*s}" width="${w*1.12/7}" height="${9*s}" fill="${linear([[0,light(c,0.35)],[1,dark(c,0.2)]],0,0,1,0)}"/>`;}
  // cone roof
  const rc=mix(c,'#5a2d91',0.4);
  g+=`<path d="M${x-r*1.15} ${y-h-12*s} L${x} ${y-h-r*2.4} L${x+r*1.15} ${y-h-12*s} Z" fill="${linear([[0,light(rc,0.35)],[0.5,rc],[1,dark(rc,0.4)]],0,0,1,0)}"/>`;
  g+=`<ellipse cx="${x}" cy="${y-h-12*s}" rx="${r*1.15}" ry="${r*0.28}" fill="${light(rc,0.15)}"/>`;
  g+=`<path d="M${x-r*1.15} ${y-h-12*s} L${x} ${y-h-r*2.4} L${x+r*1.15} ${y-h-12*s} Z" fill="${linear([[0,light(rc,0.35)],[0.5,rc],[1,dark(rc,0.4)]],0,0,1,0)}"/>`;
  // flag
  g+=`<rect x="${x-1}" y="${y-h-r*2.4-18*s}" width="2" height="${18*s}" fill="#f2e6ff"/><path d="M${x+1} ${y-h-r*2.4-18*s} L${x+14*s} ${y-h-r*2.4-13*s} L${x+1} ${y-h-r*2.4-8*s} Z" fill="${flag}"/>`;
  // window
  g+=`<rect x="${x-4*s}" y="${y-h*0.6}" width="${8*s}" height="${12*s}" rx="${4*s}" fill="#ffe08a"/><rect x="${x-4*s}" y="${y-h*0.6}" width="${8*s}" height="${12*s}" rx="${4*s}" fill="#ffd36a" opacity="0.7" filter="url(#soft6)"/>`;
  return g;
}
function castle(x,y,s=1,c='#b89ae8',{night=false}={}){
  let g='';
  const wallC = c, wd=dark(c,0.2);
  g+=groundShadow(x,y+4*s,110*s,14*s,0.35);
  // back towers
  g+=tower(x-62*s,y-20*s,26*s,70*s,dark(c,0.1),{s});
  g+=tower(x+62*s,y-20*s,26*s,70*s,dark(c,0.1),{s});
  // main wall
  g+=`<rect x="${x-78*s}" y="${y-62*s}" width="${156*s}" height="${62*s}" fill="${linear([[0,light(wallC,0.2)],[1,wallC]],0,0,0,1)}"/>`;
  for(let i=0;i<9;i++){const bx=x-78*s+i*(156*s/8.5);g+=`<rect x="${bx}" y="${y-72*s}" width="${10*s}" height="${11*s}" fill="${light(wallC,0.15)}"/>`;}
  g+=`<rect x="${x-78*s}" y="${y-62*s}" width="${156*s}" height="${5*s}" fill="${light(wallC,0.35)}"/>`;
  // brick hint
  for(let r=0;r<4;r++){for(let k=0;k<7;k++){const bx=x-70*s+k*22*s+(r%2?11*s:0), by=y-50*s+r*12*s; g+=`<rect x="${bx}" y="${by}" width="${16*s}" height="${7*s}" rx="${1.5*s}" fill="#fff" opacity="0.08"/>`;}}
  // gate
  g+=`<path d="M${x-24*s} ${y} L${x-24*s} ${y-30*s} Q${x} ${y-56*s} ${x+24*s} ${y-30*s} L${x+24*s} ${y} Z" fill="${night?'#1a0f3d':'#4a2c86'}"/>`;
  g+=`<path d="M${x-24*s} ${y} L${x-24*s} ${y-30*s} Q${x} ${y-56*s} ${x+24*s} ${y-30*s} L${x+24*s} ${y} Z" fill="none" stroke="${light(wallC,0.4)}" stroke-width="${3*s}"/>`;
  g+=`<path d="M${x-19*s} ${y} L${x-19*s} ${y-28*s} Q${x} ${y-50*s} ${x+19*s} ${y-28*s} L${x+19*s} ${y} Z" fill="${linear([[0,'#b07a52'],[1,'#6e4630']],0,0,0,1)}"/>`;
  g+=`<line x1="${x}" y1="${y-46*s}" x2="${x}" y2="${y}" stroke="#4a2c1e" stroke-width="${1.5*s}"/>`;
  // front towers
  g+=tower(x-96*s,y,34*s,84*s,c,{s});
  g+=tower(x+96*s,y,34*s,84*s,c,{s});
  return g;
}
function fountain(x,y,s=1){
  let g=groundShadow(x,y+4*s,34*s,9*s,0.3);
  g+=`<ellipse cx="${x}" cy="${y}" rx="${32*s}" ry="${11*s}" fill="#cfd3e6"/><ellipse cx="${x}" cy="${y-5*s}" rx="${32*s}" ry="${11*s}" fill="${linear([[0,'#fbfcff'],[1,'#d8dcee']],0,0,0,1)}"/>`;
  g+=`<ellipse cx="${x}" cy="${y-5*s}" rx="${26*s}" ry="${8*s}" fill="${radial('#bfe9ff','#6ec6ff','#3fa7f0',0.4,0.3,0.8)}"/>`;
  g+=`<rect x="${x-3*s}" y="${y-30*s}" width="${6*s}" height="${26*s}" fill="${linear([[0,'#fff'],[1,'#c9cde0']],0,0,1,0)}"/><ellipse cx="${x}" cy="${y-30*s}" rx="${9*s}" ry="${3*s}" fill="#e8ebf5"/>`;
  g+=`<path d="M${x} ${y-32*s} C${x-14*s} ${y-46*s} ${x-22*s} ${y-20*s} ${x-16*s} ${y-6*s}" stroke="#bfe9ff" stroke-width="${3*s}" fill="none" opacity="0.9"/><path d="M${x} ${y-32*s} C${x+14*s} ${y-46*s} ${x+22*s} ${y-20*s} ${x+16*s} ${y-6*s}" stroke="#bfe9ff" stroke-width="${3*s}" fill="none" opacity="0.9"/><path d="M${x} ${y-32*s} L${x} ${y-44*s}" stroke="#dff4ff" stroke-width="${3*s}" stroke-linecap="round"/>`;
  g+=`<circle cx="${x-3*s}" cy="${y-46*s}" r="${2*s}" fill="#fff"/><circle cx="${x+10*s}" cy="${y-40*s}" r="${1.5*s}" fill="#fff"/>`;
  return g;
}
function lamp(x,y,s=1,on=true){
  let g=`<path d="M${x-2*s} ${y} L${x-1.5*s} ${y-34*s} L${x+1.5*s} ${y-34*s} L${x+2*s} ${y} Z" fill="#5a3f8f"/><ellipse cx="${x}" cy="${y}" rx="${4*s}" ry="${1.6*s}" fill="#4a2c86"/>`;
  g+=`<rect x="${x-5*s}" y="${y-44*s}" width="${10*s}" height="${11*s}" rx="${2*s}" fill="${on?'#ffe8a3':'#dfe6ff'}"/><path d="M${x-6*s} ${y-44*s} L${x} ${y-49*s} L${x+6*s} ${y-44*s} Z" fill="#5a3f8f"/>`;
  if(on) g+=`<circle cx="${x}" cy="${y-38*s}" r="${12*s}" fill="#ffd36a" opacity="0.55" filter="url(#soft12)"/>`;
  return g;
}
function windmill(x,y,s=1){
  let g=groundShadow(x+6*s,y+2,26*s,7*s,0.3);
  g+=`<path d="M${x-16*s} ${y} L${x-10*s} ${y-60*s} L${x+10*s} ${y-60*s} L${x+16*s} ${y} Z" fill="${linear([[0,'#fff6ec'],[1,'#dcc8b2']],0,0,1,0)}"/>`;
  g+=`<path d="M${x-13*s} ${y-58*s} Q${x} ${y-78*s} ${x+13*s} ${y-58*s} Z" fill="${linear([[0,'#ff9fb8'],[1,'#e66a8f']],0,0,0,1)}"/>`;
  g+=`<rect x="${x-3*s}" y="${y-30*s}" width="${6*s}" height="${10*s}" rx="${2*s}" fill="#ffe8a3"/>`;
  for(let i=0;i<4;i++){g+=`<g transform="rotate(${i*90+20} ${x} ${y-62*s})"><rect x="${x-3*s}" y="${y-62*s-30*s}" width="${6*s}" height="${30*s}" rx="${2*s}" fill="#fff"/><rect x="${x+3*s}" y="${y-62*s-28*s}" width="${7*s}" height="${22*s}" rx="${2*s}" fill="#ffd9e4" opacity="0.9"/></g>`;}
  g+=`<circle cx="${x}" cy="${y-62*s}" r="${4*s}" fill="#5a3f8f"/>`;
  return g;
}
function cannon(x,y,{angle=-62,night=false,ball=C.pink,s=1}={}){
  // x,y = base center. Wheel + barrel + crank
  let g='';
  g+=groundShadow(x,y+6*s,46*s,10*s,0.35);
  // base plate
  g+=`<path d="M${x-40*s} ${y} L${x-32*s} ${y-12*s} L${x+32*s} ${y-12*s} L${x+40*s} ${y} Z" fill="${linear([[0,'#b48bf0'],[1,'#7a4bd8']],0,0,0,1)}"/>`;
  g+=`<rect x="${x-40*s}" y="${y}" width="${80*s}" height="${7*s}" fill="#5a2d91"/>`;
  // wheel (behind)
  const wheel=(wx,wy,r)=>`<g filter="url(#gelSmall)"><circle cx="${wx}" cy="${wy}" r="${r}" fill="${radial('#ffe9a8','#ffc84a','#d98a00',0.4,0.3,0.8)}"/></g><circle cx="${wx}" cy="${wy}" r="${r*0.62}" fill="${dark('#ffc84a',0.35)}"/><circle cx="${wx}" cy="${wy}" r="${r*0.5}" fill="${radial('#fff2c8','#ffd56a','#e9a52a',0.4,0.3,0.8)}"/>${[0,45,90,135].map(a=>`<rect x="${wx-r*0.07}" y="${wy-r*0.5}" width="${r*0.14}" height="${r}" rx="${r*0.07}" fill="#d98a00" transform="rotate(${a} ${wx} ${wy})"/>`).join('')}<circle cx="${wx}" cy="${wy}" r="${r*0.16}" fill="#7a4bd8"/>`;
  g+=wheel(x-30*s,y-14*s,18*s);
  // barrel (rotated cylinder)
  const bl=62*s, bw=30*s;
  g+=`<g transform="rotate(${angle+90} ${x+6*s} ${y-22*s})">
    <rect x="${x+6*s-bw/2}" y="${y-22*s-bl}" width="${bw}" height="${bl}" rx="${bw*0.18}" fill="${linear([[0,'#e9ddff'],[0.3,'#ffffff'],[0.65,'#c8b4f6'],[1,'#7a5bc0']],0,0,1,0)}"/>
    <rect x="${x+6*s-bw/2-3*s}" y="${y-22*s-bl-4*s}" width="${bw+6*s}" height="${12*s}" rx="${4*s}" fill="${linear([[0,'#ffd1e3'],[0.5,'#ff7fae'],[1,'#c2457a']],0,0,1,0)}"/>
    <ellipse cx="${x+6*s}" cy="${y-22*s-bl-4*s}" rx="${bw/2+3*s}" ry="${5*s}" fill="#3b1f6e"/>
    <ellipse cx="${x+6*s}" cy="${y-22*s-bl-4*s}" rx="${bw/2-2*s}" ry="${3.5*s}" fill="#1a0a3a"/>
    <rect x="${x+6*s-bw/2-2*s}" y="${y-22*s-bl*0.45}" width="${bw+4*s}" height="${9*s}" rx="${3*s}" fill="${linear([[0,'#ffd1e3'],[0.5,'#ff7fae'],[1,'#c2457a']],0,0,1,0)}"/>
  </g>`;
  // pivot / housing
  g+=`<g filter="url(#gelSmall)"><circle cx="${x+6*s}" cy="${y-22*s}" r="${17*s}" fill="${radial('#d9c9ff','#9b7be6','#5a2d91',0.4,0.3,0.8)}"/></g>`;
  g+=starSvg(x+6*s,y-22*s,8*s,'#ffd54a','#d98a00');
  // front wheel
  g+=wheel(x+34*s,y-12*s,15*s);
  // crank handle (to the left, for 말랑이)
  g+=`<path d="M${x-10*s} ${y-22*s} L${x-30*s} ${y-40*s}" stroke="#5a2d91" stroke-width="${5*s}" stroke-linecap="round"/><circle cx="${x-30*s}" cy="${y-40*s}" r="${6*s}" fill="${radial('#fff','#ffb8d0','#e66a8f',0.4,0.3,0.8)}"/>`;
  // ball glow in barrel mouth (loaded)
  const a=(angle)*Math.PI/180; const mx=x+6*s+Math.cos(a)*(bl+2*s), my=y-22*s+Math.sin(a)*(bl+2*s);
  g+=bubble(mx,my,13*s,ball);
  return g;
}
function hexBoard(rows, {x0=27,y0=118,r=18.2,trapped={},pop=[],dim=false,bomb=[]}={}){
  // rows: strings of color letters; '.' empty; uppercase=trapped friend
  const map={r:C.pink,y:C.yellow,b:C.blue,g:C.green,p:C.purple,o:C.peach,m:C.mint};
  let g=''; const dx=r*2, dy=r*1.74;
  rows.forEach((row,ri)=>{
    const off = ri%2 ? r : 0;
    [...row].forEach((ch,ci)=>{
      if(ch==='.') return;
      const key=`${ri},${ci}`; if(pop.includes(key)) return;
      const x=x0+off+ci*dx+r, y=y0+ri*dy+r;
      const lower=ch.toLowerCase(); const col=map[lower]||C.pink;
      const tr = ch!==lower ? (trapped[ch]||C.peach) : null;
      g+=bubble(x,y,r,col,{trapped:tr,dim});
    });
  });
  return g;
}
function popBurst(x,y,color,r=40,label='+30'){
  let g=`<circle cx="${x}" cy="${y}" r="${r*0.9}" fill="${light(color,0.3)}" opacity="0.55" filter="url(#soft12)"/>`;
  g+=`<circle cx="${x}" cy="${y}" r="${r*0.55}" fill="#fff" opacity="0.8" filter="url(#soft6)"/>`;
  for(let i=0;i<10;i++){const a=i/10*Math.PI*2; const d=r*(0.8+(i%3)*0.25); const px=x+Math.cos(a)*d, py=y+Math.sin(a)*d; const rr=3+(i%3)*2;
    g+=`<g filter="url(#gelSmall)"><path d="M${px} ${py-rr*1.6} C${px+rr} ${py-rr*0.4} ${px+rr} ${py+rr} ${px} ${py+rr} C${px-rr} ${py+rr} ${px-rr} ${py-rr*0.4} ${px} ${py-rr*1.6}Z" fill="${light(color,0.2)}" transform="rotate(${a*180/Math.PI+90} ${px} ${py})"/></g>`;}
  g+=sparkle(x-r*0.9,y-r*0.7,9,'#fff')+sparkle(x+r*0.8,y+r*0.3,7,'#fff')+sparkle(x+r*0.2,y-r*1.1,6,'#ffe27a');
  g+=logo3d(x,y-r*1.4,label,{fs:34,fill:'#ffd23f',extrude:3,gradTop:'#fff9d6',gradBottom:'#ff9f2a',stroke:'#5a2d91'});
  return g;
}
function aimDots(x1,y1,x2,y2,color='#fff'){
  let g=''; const n=18; for(let i=1;i<n;i++){const t=i/n; g+=`<circle cx="${x1+(x2-x1)*t}" cy="${y1+(y2-y1)*t}" r="${2.6-t*0.8}" fill="${color}" opacity="${0.95-t*0.5}" filter="url(#glow)"/>`;} return g;
}
function queue(x,y,colors,count,s=0.7){
  let g=''; colors.forEach((c,i)=>{ g+=jelly(x+i*26*s,y-i*2,14*s,c,{mood:i===0?'joy':'happy'}); });
  g+=`<text x="${x+colors.length*26*s+6}" y="${y+6}" font-family="'Baloo 2'" font-weight="800" font-size="20" fill="#fff" filter="url(#textShadow)">×${count}</text>`;
  return g;
}
function bossJelly(x,y,r,{mood='angry',glow=true}={}){
  const c='#7c4dd8';
  let g='';
  if(glow) g+=`<ellipse cx="${x}" cy="${y}" rx="${r*1.5}" ry="${r*1.3}" fill="#b47cff" opacity="0.55" filter="url(#soft24)"/>`;
  // horns
  const horn=(sx)=>`<path d="M${x+sx*r*0.55} ${y-r*0.75} Q${x+sx*r*0.9} ${y-r*1.05} ${x+sx*r*0.75} ${y-r*1.45} Q${x+sx*r*0.95} ${y-r*1.1} ${x+sx*r*1.0} ${y-r*0.6} Z" fill="${linear([[0,'#5a2d91'],[1,'#2a0b4e']],0,0,0,1)}"/>`;
  g+=horn(-1)+horn(1);
  g+=jelly(x,y,r,c,{mood,shadow:true,eyeColor:'#1a0a3a',faceScale:1.05});
  // glowing eyes overlay
  g+=`<ellipse cx="${x-9*r/38}" cy="${y+r*0.05}" rx="${4.2*r/38}" ry="${5.5*r/38}" fill="#ff5fd0" opacity="0.55" filter="url(#glow)"/><ellipse cx="${x+9*r/38}" cy="${y+r*0.05}" rx="${4.2*r/38}" ry="${5.5*r/38}" fill="#ff5fd0" opacity="0.55" filter="url(#glow)"/>`;
  // crown
  g+=`<path d="M${x-r*0.3} ${y-r*0.98} L${x-r*0.32} ${y-r*1.25} L${x-r*0.15} ${y-r*1.08} L${x} ${y-r*1.32} L${x+r*0.15} ${y-r*1.08} L${x+r*0.32} ${y-r*1.25} L${x+r*0.3} ${y-r*0.98} Z" fill="${linear([[0,'#fff0b3'],[1,'#e9a52a']],0,0,0,1)}" stroke="#b36b00" stroke-width="1.5" stroke-linejoin="round"/>`;
  return g;
}
function topHud({left='home',title='',sub='',right1='',right2='',night=false,fill=null}){
  let g='';
  const pf = fill || (night?'#2a1555':'#3b1f6e');
  g+=panel(14,46,46,46,{fill:pf});
  g+=`<path d="M37 56 L24 68 L28 68 L28 82 L46 82 L46 68 L50 68 Z" fill="#fff"/><rect x="33" y="73" width="8" height="9" fill="${pf}"/>`;
  g+=panel(68,46,196,46,{fill:pf});
  g+=`<text x="82" y="63" font-family="Noto Sans KR" font-weight="700" font-size="10.5" fill="#d9c8ff">${sub}</text><text x="82" y="84" font-family="Noto Sans KR" font-weight="900" font-size="19" fill="#fff" filter="url(#textShadow)">${title}</text>`;
  g+=panel(272,46,104,46,{fill:pf});
  g+=`<text x="324" y="63" text-anchor="middle" font-family="Noto Sans KR" font-weight="700" font-size="10.5" fill="#d9c8ff">${right1}</text><text x="324" y="84" text-anchor="middle" font-family="Noto Sans KR" font-weight="900" font-size="19" fill="#ffd54a" filter="url(#textShadow)">${right2}</text>`;
  return g;
}

// =====================================================================
// 1. TITLE
// =====================================================================
function title(){
  let b='';
  b+=`<rect width="${W}" height="${H}" fill="${linear([[0,'#2e1f7a'],[0.28,'#7a55d8'],[0.52,'#e98fc4'],[0.62,'#ffd0b0'],[0.63,'#9fe0a6'],[1,'#4fa84f']])}"/>`;
  b+=starsSky(7,70,[0,0,W,260],0.8);
  // sun glow at horizon
  b+=`<circle cx="300" cy="500" r="150" fill="#fff0c0" opacity="0.6" filter="url(#soft24)"/><circle cx="300" cy="505" r="70" fill="#fff7dc" opacity="0.9" filter="url(#soft24)"/>`;
  // clouds (far to near)
  b+=cloud(50,372,0.5,0.8,'#ffe6f3','#e9b7dc');
  b+=cloud(345,372,0.6,0.85,'#ffe6f3','#e2aed6');
  b+=cloud(120,430,0.9,0.95,'#fff','#e8c7ec');
  b+=cloud(330,420,0.75,0.9,'#fff','#e8c7ec');
  // far hills
  b+=hill(80,560,230,60,'#8fd9a0'); b+=hill(330,560,220,55,'#9ee0a8');
  // distant village row (atmospheric)
  b+=`<g opacity="0.85">`;
  b+=house(60,525,{s:0.5,wall:'#fff4ea',roof:'#ff8fb1',windows:1});
  b+=house(120,535,{s:0.6,wall:'#fdf0ff',roof:'#7fd6ff',round:true,windows:1});
  b+=tree(165,538,0.6,'#6fcf6a');
  b+=house(215,528,{s:0.55,wall:'#fff6e0',roof:'#ffb347',windows:1});
  b+=house(290,540,{s:0.65,wall:'#f3f0ff',roof:'#a76bff',windows:2});
  b+=tree(345,542,0.7,'#6fcf6a');
  b+=windmill(360,520,0.55);
  b+=tree(20,540,0.6,'#8fdc7a');
  b+=`</g>`;
  // mid hill
  b+=hill(195,640,300,90,'#79d078');
  // foreground mound
  b+=hill(195,760,330,130,'#62c45f');
  // path to village
    // flowers
  [[40,700,C.pink],[70,735,'#ffe27a'],[330,700,'#fff'],[355,740,C.pink],[300,760,'#ffe27a'],[55,780,'#fff'],[345,790,C.lilac],[90,660,'#fff']].forEach(([x,y,c])=>b+=flower(x,y,c,1.3));
  // friends behind
  b+=jelly(118,600,30,C.mint,{mood:'happy'});
  b+=jelly(282,598,32,C.purple,{mood:'joy'});
  // hero
  b+=jelly(80,668,42,C.blue,{mood:'joy'});
  b+=jelly(312,672,44,C.yellow,{mood:'happy'});
  b+=jelly(195,650,84,C.mal,{ears:true,mood:'happy',faceScale:1.05});
  // sparkles
  b+=sparkle(300,560,10,'#fff')+sparkle(60,620,8,'#fff')+sparkle(120,745,7,'#ffe27a')+sparkle(330,780,6,'#fff');
  // logo
  b+=`<ellipse cx="195" cy="190" rx="170" ry="95" fill="#2e1f7a" opacity="0.35" filter="url(#soft24)"/>`;
  b+=logo3d(195,165,'JELLY',{fs:92,fill:'#ff6fa3',extrude:9,gradTop:'#fff3f8',gradBottom:'#ff4f8b',stroke:'#4a1d7a',rotate:-3});
  b+=logo3d(200,262,'POP!',{fs:104,fill:'#ffc53d',extrude:10,gradTop:'#fffbe0',gradBottom:'#ff8f1f',stroke:'#4a1d7a',rotate:-3});
  b+=sparkle(60,120,14,'#fff')+sparkle(335,110,11,'#fff')+sparkle(330,215,9,'#ffe27a')+sparkle(45,260,8,'#fff');
  b+=bubble(345,170,14,C.blue)+bubble(45,195,11,C.green)+bubble(325,60,9,C.purple);
  b+=ribbon(195,322,236,40,'젤리마을 대소동',{color:'#7a4bd8',fs:19});
  // buttons
  b+=button(195,744,268,60,'모험 시작!',{color:'#ff4f8b',fs:24});
  b+=button(195,812,220,46,'스티커 북',{color:'#fdf6ff',fg:'#6a3bbf',fs:18});
  // version note
  b+=`<text x="195" y="836" text-anchor="middle" font-family="Noto Sans KR" font-size="8" fill="#2e1f7a" opacity="0.5"></text>`;
  return wrap(b);
}

// =====================================================================
// 2. MAP / VILLAGE ROADMAP
// =====================================================================
function map(){
  let b='';
  b+=`<rect width="${W}" height="${H}" fill="${linear([[0,'#5db8ff'],[0.22,'#b8e6ff'],[0.3,'#e4f6ff'],[0.31,'#bfe9b7'],[1,'#5fbe5a']])}"/>`;
  b+=`<circle cx="60" cy="150" r="60" fill="#fff8d0" opacity="0.8" filter="url(#soft24)"/>`;
  b+=cloud(300,120,0.55,0.9)+cloud(90,175,0.45,0.85)+cloud(200,95,0.35,0.8);
  // far hills + haze
  b+=hill(60,290,200,50,'#a7dca0'); b+=hill(340,285,180,45,'#b4e2aa');
  // castle (far, hazy)
  b+=`<g opacity="0.96">${castle(195,272,0.82,'#c3a6f2')}</g>`;
  b+=`<rect x="0" y="200" width="${W}" height="120" fill="${linear([[0,'#e4f6ff',0.5],[1,'#e4f6ff',0]],0,0,0,1)}"/>`;
  // mid ground
  b+=hill(195,400,320,70,'#8fd784');
  // river
  b+=`<path d="M0 410 C80 395 150 425 230 415 C300 406 340 430 390 418 L390 470 C330 482 280 455 210 468 C140 480 70 450 0 465 Z" fill="${linear([[0,'#7fd0ff'],[1,'#3fa7f0']],0,0,0,1)}"/>`;
  b+=`<path d="M0 410 C80 395 150 425 230 415 C300 406 340 430 390 418 L390 426 C330 440 280 414 210 428 C140 440 70 408 0 420 Z" fill="#bfe9ff" opacity="0.6"/>`;
  [[40,445],[120,452],[300,448],[350,462],[200,455]].forEach(([x,y])=>b+=`<path d="M${x} ${y} q6 -3 12 0 q6 3 12 0" stroke="#fff" stroke-width="2" fill="none" opacity="0.7" stroke-linecap="round"/>`);
  // waterfall at right
  b+=`<path d="M326 326 L390 326 L390 424 L338 424 Z" fill="${linear([[0,'#8fb98a'],[0.5,'#6f9a6a'],[1,'#557f52']],0,0,1,0)}"/><path d="M326 326 Q332 360 338 424" stroke="#4a6e47" stroke-width="4" fill="none"/><ellipse cx="336" cy="330" rx="14" ry="5" fill="#a9d9a0"/>`;
  b+=`<rect x="348" y="335" width="34" height="85" rx="8" fill="${linear([[0,'#e8f8ff'],[0.5,'#9fdcff'],[1,'#e8f8ff']],0,0,1,0)}" opacity="0.95"/>`;
  b+=`<rect x="352" y="340" width="6" height="75" rx="3" fill="#fff" opacity="0.8"/><rect x="370" y="345" width="4" height="70" rx="2" fill="#fff" opacity="0.7"/>`;
  b+=`<ellipse cx="365" cy="420" rx="26" ry="8" fill="#fff" opacity="0.8" filter="url(#soft6)"/>`;
  // near ground
  b+=hill(195,560,330,90,'#7ccf6c'); b+=hill(195,760,360,150,'#66c25c');
  // path
  const nodes=[[118,722],[272,660],[112,566],[262,462],[128,348],[195,266]];
  const pts=sampleCurve([[160,844],...nodes],70);
  b+=road(pts,{widthFn:t=>56-t*36,edge:'#c49a6c',edgeW:7});
  // bridge over river at crossing
  b+=`<g>${groundShadow(238,478,40,8,0.3)}<path d="M200 462 Q238 440 276 462 L276 470 Q238 450 200 470 Z" fill="${linear([[0,'#e8c9a4'],[1,'#b98a5c']],0,0,0,1)}"/><rect x="200" y="470" width="76" height="8" fill="#b98a5c"/>${[0,1,2,3,4].map(i=>`<rect x="${203+i*17}" y="${452-Math.sin(i/4*Math.PI)*8}" width="4" height="22" fill="#f6e6d2"/>`).join('')}<path d="M200 452 Q238 430 276 452" stroke="#f6e6d2" stroke-width="3" fill="none"/></g>`;
  // houses & props (depth-sorted top to bottom)
  b+=tree(30,330,0.55)+tree(355,300,0.5)+tree(290,335,0.5,'#8fdc7a');
  b+=house(52,350,{s:0.48,wall:'#fff6e0',roof:'#ff8c42',windows:1}); // 노을 지붕
  b+=house(318,372,{s:0.52,wall:'#fdf0ff',roof:'#7fd6ff',round:true,windows:1});
  b+=lamp(170,360,0.7);
  b+=tree(60,500,0.8)+tree(345,520,0.85,'#8fdc7a');
  b+=house(70,540,{s:0.8,wall:'#fff4ea',roof:'#ff8fb1'});
  b+=flower(150,520,C.pink,1.2)+flower(175,540,'#fff',1.2)+flower(60,590,'#ffe27a',1.3)+flower(190,600,C.lilac,1.3)+flower(165,560,'#ffe27a',1.2)+flower(40,620,C.pink,1.3);
  b+=house(330,590,{s:0.9,wall:'#f3f0ff',roof:'#a76bff'});
  b+=fountain(300,640,1.05); // 젤리 분수
  b+=windmill(340,690,0.9);
  b+=fence(10,660,90,0.9);
  b+=tree(40,700,1.0,'#6fcf6a');
  b+=house(40,805,{s:0.95,wall:'#fff6e0',roof:'#ffb347'});
  b+=house(340,790,{s:0.9,wall:'#fdf0ff',roof:'#4fdcc4',round:true});
  b+=lamp(215,790,1.0);
  b+=tree(265,835,1.0,'#8fdc7a');
  // stage coins
  b+=coin(nodes[0][0],nodes[0][1],28,{n:'1',state:'done',stars:3,label:'마을 광장'});
  b+=coin(nodes[1][0],nodes[1][1],26,{n:'2',state:'done',stars:3,label:'젤리 분수'});
  b+=coin(nodes[2][0],nodes[2][1],24,{n:'3',state:'done',stars:2,label:'꽃밭 언덕'});
  b+=coin(nodes[3][0],nodes[3][1],22,{n:'4',state:'current',label:'폭포 다리'});
  b+=coin(nodes[4][0],nodes[4][1],20,{n:'5',state:'locked',label:'노을 지붕'});
  // boss node
  b+=coin(nodes[5][0],nodes[5][1]+6,18,{n:'',state:'locked',color:'#b47cff'});
  b+=bossJelly(195,262,17,{glow:false});
  b+=pillLabel(195,304,'보스 · 마을 입구',{bg:'#5a2d91',fs:11});
  // mascot + friends walking
  b+=jelly(232,432,26,C.mal,{ears:true,mood:'joy'});
  b+=jelly(196,520,15,C.pink,{mood:'happy'})+jelly(172,543,14,C.blue,{mood:'happy'})+jelly(150,566,13,C.peach,{mood:'joy'});
  b+=speech(250,380,100,28,'다음은 여기!',{fs:12,tail:'left'});
  // HUD
  b+=topHud({title:'젤리마을',sub:'월드 1',right1:'스티커',right2:'3 / 30'});
  // bottom buttons
  b+=`<rect x="0" y="760" width="${W}" height="84" fill="${linear([[0,'#2e1f7a',0],[1,'#2e1f7a',0.45]],0,0,0,1)}"/>`;
  b+=button(150,802,250,56,'스테이지 4 시작',{color:'#ff4f8b',fs:21});
  b+=button(325,802,84,56,'📖',{color:'#fdf6ff',fg:'#6a3bbf',fs:24});
  return wrap(b);
}

// =====================================================================
// 3. PLAY (stage 3 꽃밭 언덕)
// =====================================================================
function play(){
  let b='';
  b+=`<rect width="${W}" height="${H}" fill="${linear([[0,'#4b2f9e'],[0.35,'#8d62e0'],[0.62,'#f0a0c8'],[0.72,'#ffd6b8'],[0.73,'#9fe0a6'],[1,'#5fbe5a']])}"/>`;
  b+=starsSky(11,40,[0,0,W,300],0.6);
  b+=`<circle cx="310" cy="610" r="120" fill="#fff0c0" opacity="0.5" filter="url(#soft24)"/>`;
  b+=cloud(60,540,0.6,0.8,'#ffe6f3','#e2aed6')+cloud(340,520,0.7,0.85,'#ffe6f3','#e2aed6');
  // distant village
  b+=hill(100,640,220,45,'#8fd9a0'); b+=hill(320,635,200,45,'#9ee0a8');
  b+=`<g opacity="0.9">${house(40,620,{s:0.5,wall:'#fff4ea',roof:'#ff8fb1',windows:1})}${house(110,628,{s:0.55,wall:'#fdf0ff',roof:'#7fd6ff',round:true,windows:1})}${tree(150,630,0.55)}${house(300,626,{s:0.55,wall:'#fff6e0',roof:'#ffb347',windows:1})}${house(355,632,{s:0.5,wall:'#f3f0ff',roof:'#a76bff',windows:1})}${tree(250,632,0.5,'#8fdc7a')}${windmill(205,618,0.5)}</g>`;
  b+=hill(195,730,300,80,'#79d078');
  b+=hill(195,850,340,120,'#62c45f');
  [[30,700,C.pink],[60,740,'#ffe27a'],[345,690,'#fff'],[365,735,C.pink],[320,790,'#ffe27a'],[40,800,'#fff'],[90,690,C.lilac],[300,720,C.lilac],[350,820,'#fff']].forEach(([x,y,c])=>b+=flower(x,y,c,1.4));
  // glass rails
  const rail=(x)=>`<rect x="${x}" y="100" width="12" height="470" rx="6" fill="${linear([[0,'#fff',0.75],[0.5,'#d9c8ff',0.55],[1,'#fff',0.75]],0,0,1,0)}"/><rect x="${x+3}" y="104" width="3" height="462" rx="1.5" fill="#fff" opacity="0.8"/>`;
  b+=rail(6)+rail(372);
  // ceiling bar
  b+=`<rect x="6" y="96" width="378" height="14" rx="7" fill="${linear([[0,'#ffe9f5'],[1,'#d9a7e6']],0,0,0,1)}"/><rect x="10" y="98" width="370" height="4" rx="2" fill="#fff" opacity="0.8"/>`;
  // danger line
  b+=`<line x1="20" y1="560" x2="370" y2="560" stroke="#fff" stroke-width="2" stroke-dasharray="8 8" opacity="0.6"/>`;
  // board (stage 3 shape, extended)
  const rows=['rrybbyggrr','rybbyggrr','yrr.bbgg.y','..rrOgg...','..bbrrgg..','...byyg...'];
  b+=hexBoard(rows,{x0:12,y0:112,r:18.4,trapped:{O:C.peach},pop:['4,2','4,3','5,3']});
  // pop burst where 3 blues popped
  b+=popBurst(112,262,C.blue,36,'+30');
  // flying bubble
  b+=aimDots(205,690,112,262,'#fff');
  b+=bubble(158,470,18.4,C.blue);
  // ground for cannon
  b+=`<ellipse cx="195" cy="712" rx="140" ry="22" fill="#4f9f48" opacity="0.5"/>`;
  // cannon & 말랑이
  b+=cannon(215,705,{angle:-112,ball:C.blue});
  b+=jelly(118,690,34,C.mal,{ears:true,mood:'joy'});
  b+=`<path d="M150 672 L182 664" stroke="${C.mal}" stroke-width="9" stroke-linecap="round"/>`; // arm to crank
  // friends queue (remaining shots)
  b+=queue(262,752,[C.yellow,C.green,C.pink],12,0.75);
  b+=speech(20,615,120,28,'같은 색 3개!',{fs:12,tail:'right'});
  // HUD
  b+=topHud({title:'꽃밭 언덕',sub:'스테이지 3',right1:'구할 친구',right2:'0 / 1'});
  // bottom status
  b+=panel(90,796,210,34,{fill:'#3b1f6e',op:0.8,r:17});
  b+=`<text x="195" y="819" text-anchor="middle" font-family="Noto Sans KR" font-weight="800" font-size="14" fill="#fff">점수 <tspan fill="#ffd54a">860</tspan>  ·  남은 발사 <tspan fill="#ffd54a">12</tspan></text>`;
  return wrap(b);
}

// =====================================================================
// 4. CLEAR
// =====================================================================
function clear(){
  let b='';
  b+=`<rect width="${W}" height="${H}" fill="${linear([[0,'#ffb6d9'],[0.5,'#ffd9e8'],[0.72,'#ffe9c8'],[0.73,'#9fe0a6'],[1,'#5fbe5a']])}"/>`;
  // light rays
  b+=`<g opacity="0.55">${[...Array(12)].map((_,i)=>`<path d="M195 150 L${195+Math.cos((i*30-90)*Math.PI/180)*700} ${150+Math.sin((i*30-90)*Math.PI/180)*700} L${195+Math.cos((i*30-78)*Math.PI/180)*700} ${150+Math.sin((i*30-78)*Math.PI/180)*700} Z" fill="#fff" opacity="0.55"/>`).join('')}</g>`;
  b+=`<circle cx="195" cy="150" r="140" fill="#fff" opacity="0.6" filter="url(#soft24)"/>`;
  // village bg
  b+=hill(100,640,220,45,'#8fd9a0'); b+=hill(320,635,200,45,'#9ee0a8');
  b+=`<g opacity="0.9">${house(50,622,{s:0.55,wall:'#fff4ea',roof:'#ff8fb1',windows:1})}${tree(110,630,0.6)}${house(330,628,{s:0.6,wall:'#fdf0ff',roof:'#7fd6ff',round:true,windows:1})}${tree(280,632,0.5,'#8fdc7a')}</g>`;
  b+=hill(195,740,320,80,'#79d078'); b+=hill(195,860,340,120,'#62c45f');
  // confetti behind
  b+=`<g opacity="0.9">${confetti(5,70,[0,40,W,500])}</g>`;
  // stars
  const bigStar=(x,y,r,rot)=>`<g transform="rotate(${rot} ${x} ${y})">${groundShadow(x,y+r*0.9,r*0.9,r*0.25,0.25)}<g transform="translate(0 ${r*0.16})">${starSvg(x,y,r,'#e9a52a','#b36b00')}</g><g filter="url(#gel)">${starSvg(x,y,r,'#ffd54a','#e9a52a')}</g><ellipse cx="${x-r*0.25}" cy="${y-r*0.35}" rx="${r*0.22}" ry="${r*0.1}" fill="#fff" opacity="0.7" transform="rotate(-25 ${x-r*0.25} ${y-r*0.35})"/></g>`;
  b+=bigStar(85,235,42,-15)+bigStar(305,235,42,15)+bigStar(195,195,56,0);
  b+=sparkle(40,190,12)+sparkle(350,185,12)+sparkle(195,110,14)+sparkle(135,290,8,'#ffe27a')+sparkle(255,290,8,'#ffe27a');
  // characters
  b+=jelly(240,440,36,C.peach,{mood:'joy'});
  b+=jelly(160,430,58,C.mal,{ears:true,mood:'joy',faceScale:1.05});
  b+=`<text x="118" y="370" font-family="'Baloo 2'" font-weight="800" font-size="20" fill="#ff4f8b" transform="rotate(-15 118 370)">♪</text><text x="262" y="380" font-family="'Baloo 2'" font-weight="800" font-size="20" fill="#7a4bd8" transform="rotate(15 262 380)">♪</text>`;
  // card
  b+=`<rect x="28" y="506" width="334" height="300" rx="28" fill="#2e1f7a" opacity="0.3" filter="url(#soft12)" transform="translate(0 10)"/>`;
  b+=`<rect x="28" y="500" width="334" height="300" rx="28" fill="${linear([[0,'#ffffff'],[1,'#f3ecff']],0,0,0,1)}" stroke="#d8c4ff" stroke-width="3"/>`;
  b+=`<rect x="36" y="506" width="318" height="60" rx="22" fill="url(#glassTop)" opacity="0.8"/>`;
  b+=logo3d(195,560,'스테이지 클리어!',{fs:34,fill:'#8a5cf0',extrude:4,family:'Noto Sans KR',gradTop:'#f3ecff',gradBottom:'#6a3bbf',stroke:'#3b1f6e'});
  b+=`<text x="195" y="600" text-anchor="middle" font-family="Noto Sans KR" font-weight="700" font-size="15" fill="#6a3bbf">점수 <tspan font-size="22" font-weight="900" fill="#ff4f8b">1,240</tspan>   ·   남은 발사 보너스 <tspan font-size="18" font-weight="900" fill="#ff4f8b">+200</tspan></text>`;
  // sticker frame
  b+=`<g>${groundShadow(195,672,40,10,0.25)}<circle cx="195" cy="650" r="40" fill="${linear([[0,'#fff6c8'],[1,'#ffd54a']],0,0,0,1)}" stroke="#e9a52a" stroke-width="4"/><circle cx="195" cy="650" r="33" fill="#fff"/>${jelly(195,653,24,C.peach,{mood:'joy',shadow:false})}</g>`;
  b+=sparkle(150,625,9,'#ffd54a')+sparkle(240,680,8,'#ffd54a');
  b+=`<text x="195" y="716" text-anchor="middle" font-family="Noto Sans KR" font-weight="900" font-size="15" fill="#3b1f6e"><tspan fill="#ff7a4f">꽃잎</tspan> 스티커를 받았어요!</text><text x="195" y="736" text-anchor="middle" font-family="Noto Sans KR" font-weight="700" font-size="12" fill="#8a7bb0">스티커 북 3 / 30</text>`;
  b+=button(130,775,180,46,'다음 스테이지',{color:'#ff4f8b',fs:17});
  b+=button(282,775,110,46,'지도로',{color:'#fdf6ff',fg:'#6a3bbf',fs:16});
  return wrap(b);
}

// =====================================================================
// 5. BOSS (stage 6 마을 입구, night)
// =====================================================================
function boss(){
  let b='';
  b+=`<rect width="${W}" height="${H}" fill="${linear([[0,'#140b3a'],[0.4,'#2e1a6e'],[0.7,'#5a3aa6'],[0.78,'#2f1f5e'],[1,'#1a1040']])}"/>`;
  b+=starsSky(21,90,[0,0,W,520],0.9);
  // moon
  b+=`<circle cx="320" cy="150" r="60" fill="#fff3c4" opacity="0.5" filter="url(#soft24)"/><circle cx="320" cy="150" r="30" fill="${radial('#fffbe6','#fff0b3','#f5d98a',0.4,0.35,0.8)}"/><circle cx="330" cy="140" r="5" fill="#f0dc9a" opacity="0.6"/><circle cx="312" cy="160" r="4" fill="#f0dc9a" opacity="0.5"/>`;
  // purple clouds
  b+=cloud(70,520,0.8,0.9,'#8b6ad6','#3b1f6e')+cloud(330,500,0.7,0.9,'#8b6ad6','#3b1f6e');
  // ground: courtyard
  b+=`<ellipse cx="195" cy="700" rx="330" ry="110" fill="${radial('#6b4bb8','#3b2478','#1f1248',0.5,0.3,0.8)}"/>`;
  // castle
  b+=castle(195,660,0.95,'#8f73d0',{night:true});
  b+=lamp(60,672,1.0)+lamp(330,672,1.0);
  // boss on the wall
  b+=bossJelly(195,560,46,{mood:'angry'});
  // boss hp bar
  b+=panel(60,118,270,26,{fill:'#2a1555',op:0.9,r:13});
  b+=`<rect x="92" y="125" width="196" height="12" rx="6" fill="#1a0a3a"/><rect x="92" y="125" width="${196*22/36}" height="12" rx="6" fill="${linear([[0,'#ff9fd0'],[1,'#ff3f8a']],0,0,0,1)}"/><rect x="94" y="126" width="${196*22/36-4}" height="4" rx="2" fill="#fff" opacity="0.5"/>`;
  b+=`<text x="70" y="136" font-family="Noto Sans KR" font-weight="900" font-size="11" fill="#fff">뭉치</text><text x="318" y="136" text-anchor="end" font-family="'Baloo 2'" font-weight="800" font-size="13" fill="#fff">22/36</text>`;
  // rails
  const rail=(x)=>`<rect x="${x}" y="150" width="12" height="420" rx="6" fill="${linear([[0,'#fff',0.55],[0.5,'#b89ae8',0.45],[1,'#fff',0.55]],0,0,1,0)}"/><rect x="${x+3}" y="154" width="3" height="412" rx="1.5" fill="#fff" opacity="0.7"/>`;
  b+=rail(6)+rail(372);
  b+=`<line x1="20" y1="570" x2="370" y2="570" stroke="#ff7fae" stroke-width="2" stroke-dasharray="8 8" opacity="0.8"/>`;
  // board
  const rows=['pprrggbbyy','prrggbbyyp','..pMg..rr.','...pp.....'];
  b+=hexBoard(rows,{x0:12,y0:152,r:18.4,trapped:{M:C.lilac}});
  // bubble attack text
  b+=logo3d(195,330,'뭉치의 거품 공격!',{fs:30,fill:'#ff6fa3',extrude:4,family:'Noto Sans KR',gradTop:'#fff0f6',gradBottom:'#ff3f8a',stroke:'#2a0b4e',rotate:-2});
  // new bubbles dropping from top (attack)
  b+=`<g opacity="0.9">${bubble(100,286,16,C.purple)}${bubble(290,284,16,C.purple)}${bubble(230,278,14,C.pink)}</g>`;
  // aim
  b+=aimDots(205,690,96,320,'#ffb3e0');
  b+=bubble(150,500,18.4,C.yellow);
  // cannon & 말랑이
  b+=`<ellipse cx="195" cy="722" rx="150" ry="20" fill="#1a0a3a" opacity="0.4"/>`;
  b+=cannon(215,712,{angle:-80,ball:C.yellow});
  b+=jelly(118,696,34,C.mal,{ears:true,mood:'o'});
  b+=`<path d="M150 678 L182 672" stroke="${C.mal}" stroke-width="9" stroke-linecap="round"/>`;
  b+=queue(262,760,[C.green,C.blue,C.pink],18,0.75);
  // HUD
  b+=topHud({title:'마을 입구',sub:'스테이지 6 · 보스',right1:'보스 체력',right2:'22',night:true});
  b+=panel(90,800,210,34,{fill:'#2a1555',op:0.85,r:17});
  b+=`<text x="195" y="823" text-anchor="middle" font-family="Noto Sans KR" font-weight="800" font-size="14" fill="#fff">점수 <tspan fill="#ffd54a">2,410</tspan>  ·  남은 발사 <tspan fill="#ffd54a">18</tspan></text>`;
  return wrap(b);
}

module.exports = { title, map, play, clear, boss };
module.exports._parts = { castle, fountain, windmill, lamp, bossJelly, topHud, tower, cannon, hexBoard };
