// 2.5D SVG primitive library for Jelly Pop mockups. All sizes in CSS px on a 390x844 canvas.
let _id = 0;
const uid = (p) => p + (++_id);
const W = 390, H = 844;

function hex2rgb(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
function rgb2hex(r,g,b){return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');}
function mix(a,b,t){const A=hex2rgb(a),B=hex2rgb(b);return rgb2hex(A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t,A[2]+(B[2]-A[2])*t);}
const light=(c,t)=>mix(c,'#ffffff',t), dark=(c,t)=>mix(c,'#1a0a3a',t);

// ---------- global defs (filters) ----------
function defs(){
  return `<defs>
  <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>
  <filter id="soft6" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="6"/></filter>
  <filter id="soft12" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>
  <filter id="soft24" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="24"/></filter>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="glowBig" x="-80%" y="-80%" width="260%" height="260%">
    <feGaussianBlur stdDeviation="14" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <!-- gel: real 3D shading from alpha bump map -->
  <filter id="gel" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
    <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="blur"/>
    <feSpecularLighting in="blur" surfaceScale="6" specularConstant="0.9" specularExponent="28" lighting-color="#ffffff" result="spec">
      <fePointLight x="120" y="-80" z="260"/></feSpecularLighting>
    <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn"/>
    <feDiffuseLighting in="blur" surfaceScale="4" diffuseConstant="1" lighting-color="#ffffff" result="diff">
      <feDistantLight azimuth="235" elevation="60"/></feDiffuseLighting>
    <feComposite in="diff" in2="SourceAlpha" operator="in" result="diffIn"/>
    <feComposite in="SourceGraphic" in2="diffIn" operator="arithmetic" k1="0.72" k2="0.4" k3="0" k4="0" result="lit"/>
    <feComposite in="lit" in2="specIn" operator="arithmetic" k1="0" k2="1" k3="0.75" k4="0" result="out"/>
    <feComposite in="out" in2="SourceAlpha" operator="in"/>
  </filter>
  <filter id="gelSmall" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
    <feGaussianBlur in="SourceAlpha" stdDeviation="2.2" result="blur"/>
    <feSpecularLighting in="blur" surfaceScale="4" specularConstant="0.8" specularExponent="24" lighting-color="#ffffff" result="spec">
      <fePointLight x="120" y="-80" z="200"/></feSpecularLighting>
    <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn"/>
    <feDiffuseLighting in="blur" surfaceScale="3" diffuseConstant="1" lighting-color="#ffffff" result="diff">
      <feDistantLight azimuth="235" elevation="60"/></feDiffuseLighting>
    <feComposite in="diff" in2="SourceAlpha" operator="in" result="diffIn"/>
    <feComposite in="SourceGraphic" in2="diffIn" operator="arithmetic" k1="0.72" k2="0.4" k3="0" k4="0" result="lit"/>
    <feComposite in="lit" in2="specIn" operator="arithmetic" k1="0" k2="1" k3="0.7" k4="0" result="out"/>
    <feComposite in="out" in2="SourceAlpha" operator="in"/>
  </filter>
  <filter id="bevel" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
    <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"/>
    <feSpecularLighting in="blur" surfaceScale="5" specularConstant="0.6" specularExponent="18" lighting-color="#fff" result="spec">
      <feDistantLight azimuth="235" elevation="50"/></feSpecularLighting>
    <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn"/>
    <feComposite in="SourceGraphic" in2="specIn" operator="arithmetic" k1="0" k2="1" k3="0.7" k4="0" result="o"/>
    <feComposite in="o" in2="SourceAlpha" operator="in"/>
  </filter>
  <filter id="dropShadow" x="-30%" y="-30%" width="160%" height="180%">
    <feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#2a0b4e" flood-opacity="0.35"/></filter>
  <filter id="textShadow" x="-20%" y="-20%" width="140%" height="160%">
    <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#2a0b4e" flood-opacity="0.55"/></filter>
  <radialGradient id="specHi" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff" stop-opacity="0.95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <linearGradient id="glassTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <pattern id="cobble" width="22" height="16" patternUnits="userSpaceOnUse">
    <rect width="22" height="16" fill="#e8c9a4"/>
    <rect x="1" y="1" width="9" height="6" rx="2.5" fill="#f3ddbf"/><rect x="12" y="1" width="9" height="6" rx="2.5" fill="#efd4b2"/>
    <rect x="6" y="9" width="9" height="6" rx="2.5" fill="#f1d8ba"/><rect x="-5" y="9" width="9" height="6" rx="2.5" fill="#edd0ad"/><rect x="17" y="9" width="9" height="6" rx="2.5" fill="#edd0ad"/>
  </pattern>
  </defs>`;
}

// ---------- gradients helper ----------
let gradStore = '';
function radial(c1, c2, c3, cx=0.35, cy=0.3, r=0.75, fx){
  const id = uid('rg');
  gradStore += `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"${fx!==undefined?` fx="${fx}"`:''}><stop offset="0" stop-color="${c1}"/><stop offset="0.55" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/></radialGradient>`;
  return `url(#${id})`;
}
function linear(stops, x1=0,y1=0,x2=0,y2=1){
  const id = uid('lg');
  gradStore += `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o,c,op])=>`<stop offset="${o}" stop-color="${c}"${op!==undefined?` stop-opacity="${op}"`:''}/>`).join('')}</linearGradient>`;
  return `url(#${id})`;
}
function flushGrads(){ const g = gradStore; gradStore=''; return `<defs>${g}</defs>`; }

// ---------- primitives ----------
function groundShadow(x,y,rx,ry,op=0.3, blur='soft6'){
  return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#2a0b4e" opacity="${op}" filter="url(#${blur})"/>`;
}

// Face
function face(x,y,s=1,mood='happy',color='#3a1f5e'){
  const e = (dx)=>`<ellipse cx="${x+dx*s}" cy="${y}" rx="${4.2*s}" ry="${5.5*s}" fill="${color}"/><circle cx="${x+dx*s-1.3*s}" cy="${y-2*s}" r="${1.6*s}" fill="#fff"/>`;
  let eyes = e(-9)+e(9);
  let mouth = `<path d="M${x-4*s} ${y+7*s} Q${x} ${y+11*s} ${x+4*s} ${y+7*s}" stroke="${color}" stroke-width="${1.8*s}" fill="none" stroke-linecap="round"/>`;
  if(mood==='joy'){ eyes = `<path d="M${x-13*s} ${y+1*s} Q${x-9*s} ${y-5*s} ${x-5*s} ${y+1*s}" stroke="${color}" stroke-width="${2.4*s}" fill="none" stroke-linecap="round"/><path d="M${x+5*s} ${y+1*s} Q${x+9*s} ${y-5*s} ${x+13*s} ${y+1*s}" stroke="${color}" stroke-width="${2.4*s}" fill="none" stroke-linecap="round"/>`;
    mouth = `<path d="M${x-6*s} ${y+6*s} Q${x} ${y+15*s} ${x+6*s} ${y+6*s} Z" fill="${color}"/><path d="M${x-3*s} ${y+10.5*s} Q${x} ${y+13*s} ${x+3*s} ${y+10.5*s} Z" fill="#ff7aa5"/>`; }
  if(mood==='angry'){ eyes = `<path d="M${x-15*s} ${y-6*s} L${x-4*s} ${y-1*s}" stroke="${color}" stroke-width="${2.6*s}" stroke-linecap="round"/><path d="M${x+15*s} ${y-6*s} L${x+4*s} ${y-1*s}" stroke="${color}" stroke-width="${2.6*s}" stroke-linecap="round"/>` + e(-9)+e(9);
    mouth = `<path d="M${x-6*s} ${y+10*s} Q${x} ${y+5*s} ${x+6*s} ${y+10*s}" stroke="${color}" stroke-width="${2*s}" fill="none" stroke-linecap="round"/>`; }
  if(mood==='worried'){ mouth = `<path d="M${x-4*s} ${y+9*s} Q${x} ${y+6*s} ${x+4*s} ${y+9*s}" stroke="${color}" stroke-width="${1.8*s}" fill="none" stroke-linecap="round"/>`; }
  if(mood==='o'){ mouth = `<ellipse cx="${x}" cy="${y+8*s}" rx="${2.5*s}" ry="${3.2*s}" fill="${color}"/>`; }
  const blush = `<ellipse cx="${x-15*s}" cy="${y+6*s}" rx="${4.5*s}" ry="${2.6*s}" fill="#ff6d9a" opacity="0.45"/><ellipse cx="${x+15*s}" cy="${y+6*s}" rx="${4.5*s}" ry="${2.6*s}" fill="#ff6d9a" opacity="0.45"/>`;
  return `<g>${blush}${eyes}${mouth}</g>`;
}

// Glossy jelly blob (dome shape). ears=true for 말랑이.
function jelly(x,y,r,color,{ears=false,mood='happy',shadow=true,glow=false,faceScale=1,squash=1,hat=null,eyeColor}={}){
  const body = radial(light(color,0.45), color, dark(color,0.35), 0.38, 0.32, 0.72);
  const rim = linear([[0,'#fff',0],[0.7,'#fff',0],[1,light(color,0.5),0.75]], 0,0,0,1);
  const rx=r, ry=r*0.92*squash;
  const path = `M${x-rx} ${y+ry*0.2} C${x-rx} ${y-ry*0.5} ${x-rx*0.6} ${y-ry} ${x} ${y-ry} C${x+rx*0.6} ${y-ry} ${x+rx} ${y-ry*0.5} ${x+rx} ${y+ry*0.2} C${x+rx*1.0} ${y+ry*0.8} ${x+rx*0.7} ${y+ry} ${x} ${y+ry} C${x-rx*0.7} ${y+ry} ${x-rx*1.0} ${y+ry*0.8} ${x-rx} ${y+ry*0.2} Z`;
  let s='';
  if(shadow) s+=groundShadow(x, y+ry*0.98, rx*0.95, ry*0.22, 0.32);
  if(glow) s+=`<path d="${path}" fill="${color}" opacity="0.6" filter="url(#soft24)"/>`;
  let earsSvg='';
  if(ears){
    const ec = radial(light(color,0.3), color, dark(color,0.3), 0.4,0.3,0.8);
    const inner = light(color,0.1);
    earsSvg = `<g transform="translate(${x} ${y}) scale(0.8 0.86) translate(${-x} ${-y})"><g filter="url(#${r>40?'gel':'gelSmall'})">
      <path d="M${x-rx*0.6} ${y-ry*0.75} C${x-rx*1.15} ${y-ry*0.95} ${x-rx*1.5} ${y-ry*0.1} ${x-rx*1.3} ${y+ry*0.55} C${x-rx*1.2} ${y+ry*0.85} ${x-rx*0.9} ${y+ry*0.8} ${x-rx*0.85} ${y+ry*0.45} C${x-rx*0.8} ${y+ry*0.1} ${x-rx*0.75} ${y-ry*0.4} ${x-rx*0.6} ${y-ry*0.75}Z" fill="${ec}"/>
      <path d="M${x+rx*0.6} ${y-ry*0.75} C${x+rx*1.15} ${y-ry*0.95} ${x+rx*1.5} ${y-ry*0.1} ${x+rx*1.3} ${y+ry*0.55} C${x+rx*1.2} ${y+ry*0.85} ${x+rx*0.9} ${y+ry*0.8} ${x+rx*0.85} ${y+ry*0.45} C${x+rx*0.8} ${y+ry*0.1} ${x+rx*0.75} ${y-ry*0.4} ${x+rx*0.6} ${y-ry*0.75}Z" fill="${ec}"/>
    </g>
    <path d="M${x-rx*1.0} ${y-ry*0.3} C${x-rx*1.25} ${y-ry*0.1} ${x-rx*1.25} ${y+ry*0.3} ${x-rx*1.12} ${y+ry*0.5}" stroke="${mix(color,'#ff5f8a',0.5)}" stroke-width="${r*0.16}" fill="none" stroke-linecap="round" opacity="0.45"/>
    <path d="M${x+rx*1.0} ${y-ry*0.3} C${x+rx*1.25} ${y-ry*0.1} ${x+rx*1.25} ${y+ry*0.3} ${x+rx*1.12} ${y+ry*0.5}" stroke="${mix(color,'#ff5f8a',0.5)}" stroke-width="${r*0.16}" fill="none" stroke-linecap="round" opacity="0.45"/></g>`;
  }
  s += earsSvg;
  s += `<g filter="url(#${r>40?'gel':'gelSmall'})"><path d="${path}" fill="${body}"/></g>`;
  s += `<path d="${path}" fill="${rim}"/>`;
  // specular highlights
  s += `<ellipse cx="${x-rx*0.42}" cy="${y-ry*0.5}" rx="${rx*0.22}" ry="${ry*0.13}" fill="#fff" opacity="0.9" transform="rotate(-28 ${x-rx*0.42} ${y-ry*0.5})"/>`;
  s += `<circle cx="${x-rx*0.18}" cy="${y-ry*0.72}" r="${r*0.06}" fill="#fff" opacity="0.8"/>`;
  s += `<ellipse cx="${x+rx*0.45}" cy="${y+ry*0.3}" rx="${rx*0.12}" ry="${ry*0.3}" fill="url(#specHi)" opacity="0.5"/>`;
  s += face(x, y+ry*0.05, r/38*faceScale, mood, eyeColor);
  if(hat) s+=hat;
  return s;
}

// Glass bubble (for the bubble board). trapped: jelly friend inside.
function bubble(x,y,r,color,{faceMood='happy',trapped=null,dim=false}={}){
  const g = radial(light(color,0.55), color, dark(color,0.25), 0.4,0.35,0.7);
  let s = `<circle cx="${x}" cy="${y+r*0.12}" r="${r*0.95}" fill="#1a0a3a" opacity="0.25" filter="url(#soft)"/>`;
  s += `<g filter="url(#gelSmall)"><circle cx="${x}" cy="${y}" r="${r}" fill="${g}"/></g>`;
  // inner rim light (bottom)
  s += `<circle cx="${x}" cy="${y}" r="${r*0.9}" fill="none" stroke="${light(color,0.6)}" stroke-width="${r*0.13}" opacity="0.55" stroke-dasharray="${r*1.9} ${r*6}" stroke-dashoffset="${-r*0.5}" transform="rotate(50 ${x} ${y})" stroke-linecap="round"/>`;
  if(trapped){ s += jelly(x, y+r*0.12, r*0.56, trapped, {shadow:false, mood:'worried', faceScale:0.95}); }
  else s += face(x, y+r*0.05, r/32, faceMood);
  // glass specular
  s += `<ellipse cx="${x-r*0.38}" cy="${y-r*0.42}" rx="${r*0.24}" ry="${r*0.14}" fill="#fff" opacity="0.92" transform="rotate(-35 ${x-r*0.38} ${y-r*0.42})"/>`;
  s += `<circle cx="${x+r*0.3}" cy="${y-r*0.55}" r="${r*0.07}" fill="#fff" opacity="0.8"/>`;
  s += `<circle cx="${x}" cy="${y}" r="${r-0.5}" fill="none" stroke="#fff" stroke-width="1" opacity="0.35"/>`;
  if(dim) s += `<circle cx="${x}" cy="${y}" r="${r}" fill="#1a0a3a" opacity="0.25"/>`;
  return s;
}

// 2.5D house. (x,y) = bottom-center of front face. w,h = front face. d = side depth. s=scale
function house(x,y,{w=70,h=60,d=28,wall='#fff4ea',roof='#ff8fb1',s=1,door='#b9794f',windows=2,chimney=true,lit=true,round=false}={}){
  w*=s;h*=s;d*=s;
  const wallL = light(wall,0.1), wallD = dark(wall,0.28);
  const roofL = light(roof,0.25), roofD = dark(roof,0.3);
  const fx = x-w/2, fy = y-h;            // front face top-left
  const sx = x+w/2, sy = y;              // side base start
  const dx = d*0.75, dy = -d*0.45;       // depth vector (right-up)
  const rh = h*0.55;                     // roof height
  let g='';
  g += groundShadow(x+dx*0.4, y+2, w*0.75+dx, h*0.12, 0.35);
  // side face
  g += `<path d="M${sx} ${sy} L${sx+dx} ${sy+dy} L${sx+dx} ${fy+dy} L${sx} ${fy} Z" fill="${linear([[0,wallD],[1,dark(wall,0.4)]],0,0,1,0)}"/>`;
  // front face
  g += `<rect x="${fx}" y="${fy}" width="${w}" height="${h}" fill="${linear([[0,wallL],[1,wall]],0,0,0,1)}"/>`;
  // roof: front gable triangle
  if(round){
    g += `<path d="M${fx-6*s} ${fy+4*s} Q${x} ${fy-rh*1.6} ${sx+6*s} ${fy+4*s} Z" fill="${linear([[0,roofL],[1,roofD]],0,0,0,1)}"/>`;
    g += `<path d="M${sx+6*s} ${fy+4*s} Q${x} ${fy-rh*1.6} ${fx-6*s} ${fy+4*s} L${fx-6*s+dx} ${fy+4*s+dy} Q${x+dx} ${fy-rh*1.6+dy} ${sx+6*s+dx} ${fy+4*s+dy} Z" fill="${roofD}" opacity="0.9"/>`;
  } else {
    // roof side slope (right)
    g += `<path d="M${x} ${fy-rh} L${sx+8*s} ${fy+5*s} L${sx+8*s+dx} ${fy+5*s+dy} L${x+dx} ${fy-rh+dy} Z" fill="${linear([[0,roofD],[1,dark(roof,0.45)]],0,0,1,0)}"/>`;
    // roof left slope (visible top)
    g += `<path d="M${x} ${fy-rh} L${fx-8*s} ${fy+5*s} L${fx-8*s+dx} ${fy+5*s+dy} L${x+dx} ${fy-rh+dy} Z" fill="${linear([[0,roofL],[1,roof]],0,0,1,1)}"/>`;
    // gable front
    g += `<path d="M${fx-2*s} ${fy} L${x} ${fy-rh*0.96} L${sx+2*s} ${fy} Z" fill="${mix(wall,roof,0.25)}"/>`;
    // roof front edge thickness
    g += `<path d="M${fx-8*s} ${fy+5*s} L${x} ${fy-rh} L${sx+8*s} ${fy+5*s} L${sx+8*s} ${fy+9*s} L${x} ${fy-rh+4*s} L${fx-8*s} ${fy+9*s} Z" fill="${roof}"/>`;
    g += `<path d="M${fx-8*s} ${fy+5*s} L${x} ${fy-rh} L${sx+8*s} ${fy+5*s}" stroke="${roofL}" stroke-width="${2*s}" fill="none" stroke-linejoin="round"/>`;
    if(chimney) g += `<rect x="${x+w*0.18+dx*0.5}" y="${fy-rh*0.9+dy*0.5}" width="${8*s}" height="${16*s}" fill="${wallD}"/><rect x="${x+w*0.18+dx*0.5-1.5*s}" y="${fy-rh*0.9+dy*0.5-3*s}" width="${11*s}" height="${4*s}" rx="1" fill="${dark(wall,0.4)}"/>`;
  }
  // door
  g += `<path d="M${x-9*s} ${y} L${x-9*s} ${y-20*s} Q${x} ${y-32*s} ${x+9*s} ${y-20*s} L${x+9*s} ${y} Z" fill="${door}"/><path d="M${x-9*s} ${y} L${x-9*s} ${y-20*s} Q${x} ${y-32*s} ${x+9*s} ${y-20*s} L${x+9*s} ${y} Z" fill="${linear([[0,'#fff',0.25],[1,'#000',0.15]],0,0,0,1)}"/><circle cx="${x+5*s}" cy="${y-13*s}" r="${1.5*s}" fill="#ffe08a"/>`;
  // windows
  const win = (wx,wy)=>`<rect x="${wx-7*s}" y="${wy-7*s}" width="${14*s}" height="${14*s}" rx="${3*s}" fill="${lit?'#ffe7a3':'#b7d6ff'}"/><rect x="${wx-7*s}" y="${wy-7*s}" width="${14*s}" height="${14*s}" rx="${3*s}" fill="none" stroke="${wallD}" stroke-width="${2*s}"/><line x1="${wx}" y1="${wy-7*s}" x2="${wx}" y2="${wy+7*s}" stroke="${wallD}" stroke-width="${1.5*s}"/>${lit?`<rect x="${wx-7*s}" y="${wy-7*s}" width="${14*s}" height="${14*s}" rx="${3*s}" fill="#ffd36a" opacity="0.6" filter="url(#soft6)"/>`:''}`;
  if(windows>=1) g += win(x-w*0.3, y-h*0.55);
  if(windows>=2) g += win(x+w*0.3, y-h*0.55);
  // ambient occlusion at base
  g += `<rect x="${fx}" y="${y-6*s}" width="${w}" height="${6*s}" fill="${linear([[0,'#000',0],[1,'#000',0.18]],0,0,0,1)}"/>`;
  return g;
}

// Round tree (3D ball canopy on trunk)
function tree(x,y,s=1,c='#6fcf6a',canopies=3){
  let g = groundShadow(x+4*s, y+2, 22*s, 6*s, 0.3);
  g += `<path d="M${x-4*s} ${y} L${x-3*s} ${y-22*s} L${x+3*s} ${y-22*s} L${x+4*s} ${y} Z" fill="${linear([[0,'#a9775a'],[1,'#6e4630']],0,0,1,0)}"/>`;
  const balls = canopies===3 ? [[-12,-28,15],[12,-30,15],[0,-42,18]] : [[0,-38,22]];
  for(const [bx,by,br] of balls){
    g += `<g filter="url(#gelSmall)"><circle cx="${x+bx*s}" cy="${y+by*s}" r="${br*s}" fill="${radial(light(c,0.45),c,dark(c,0.4),0.38,0.3,0.75)}"/></g>`;
  }
  g += `<ellipse cx="${x-6*s}" cy="${y-50*s}" rx="${6*s}" ry="${3*s}" fill="#fff" opacity="0.55" transform="rotate(-25 ${x-6*s} ${y-50*s})"/>`;
  return g;
}

// Fluffy cloud 2.5D
function cloud(x,y,s=1,op=1,tint='#ffffff',shade='#d7c6f3'){
  const g = radial('#ffffff', tint, shade, 0.4, 0.25, 0.8);
  const blobs = [[0,0,26],[-28,8,18],[28,6,20],[-12,-10,20],[14,-12,18],[44,12,12],[-44,14,11]];
  let p = `<g filter="url(#gelSmall)" opacity="${op}">`;
  for(const [bx,by,br] of blobs) p += `<circle cx="${x+bx*s}" cy="${y+by*s}" r="${br*s}" fill="${g}"/>`;
  p += `</g>`;
  return p;
}

// 3D stage coin button
function coin(x,y,r,{n='1',state='done',stars=3,label='',color='#ffd04a'}={}){
  const c = state==='locked' ? '#c9c2da' : color;
  const top = radial(light(c,0.55), c, dark(c,0.15), 0.4,0.3,0.75);
  let g = groundShadow(x, y+r*0.55, r*1.1, r*0.35, 0.35);
  // rim ring
  g += `<ellipse cx="${x}" cy="${y+r*0.28}" rx="${r*1.06}" ry="${r*0.9}" fill="${dark(c,0.45)}"/>`;
  g += `<ellipse cx="${x}" cy="${y+r*0.12}" rx="${r*1.06}" ry="${r*0.9}" fill="${dark(c,0.25)}"/>`;
  g += `<g filter="url(#gel)"><ellipse cx="${x}" cy="${y}" rx="${r*1.06}" ry="${r*0.9}" fill="${top}"/></g>`;
  g += `<ellipse cx="${x}" cy="${y}" rx="${r*0.82}" ry="${r*0.68}" fill="${linear([[0,dark(c,0.12)],[1,light(c,0.3)]],0,0,0,1)}" opacity="0.9"/>`;
  g += `<ellipse cx="${x}" cy="${y}" rx="${r*0.82}" ry="${r*0.68}" fill="none" stroke="${light(c,0.6)}" stroke-width="2" opacity="0.7"/>`;
  g += `<ellipse cx="${x-r*0.3}" cy="${y-r*0.45}" rx="${r*0.3}" ry="${r*0.12}" fill="#fff" opacity="0.7" transform="rotate(-20 ${x-r*0.3} ${y-r*0.45})"/>`;
  if(state==='current') g += `<ellipse cx="${x}" cy="${y}" rx="${r*1.25}" ry="${r*1.06}" fill="none" stroke="#fff" stroke-width="4" opacity="0.9" filter="url(#glow)"/>`;
  const tc = state==='locked' ? '#7d7595' : '#5a2d91';
  g += `<text x="${x}" y="${y+r*0.3}" text-anchor="middle" font-family="'Baloo 2'" font-weight="800" font-size="${r*0.95}" fill="${tc}" filter="url(#textShadow)">${state==='locked'?'🔒':n}</text>`;
  if(state==='done') g += starsRow(x, y-r*1.05, stars, r*0.28);
  if(label) g += pillLabel(x, y+r*1.25, label);
  return g;
}
function starSvg(x,y,r,fill='#ffd54a',stroke='#d98a00',lit=true){
  const pts=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5;const rr=i%2?r*0.48:r;pts.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr]);}
  const d='M'+pts.map(p=>p.join(' ')).join(' L')+'Z';
  const gr = lit ? radial(light(fill,0.55), fill, '#f39d14', 0.4,0.3,0.8) : '#bfb7d0';
  return `<path d="${d}" fill="${gr}" stroke="${lit?stroke:'#8d85a5'}" stroke-width="${r*0.14}" stroke-linejoin="round"/>`;
}
function starsRow(x,y,n,r){ let g=''; for(let i=0;i<3;i++){ const dx=(i-1)*r*2.2; const dy=i===1?-r*0.35:0; g+=starSvg(x+dx,y+dy,r,'#ffd54a','#d98a00',i<n);} return g; }
function pillLabel(x,y,text,{bg='#4a2c86',fg='#fff',fs=12,pad=10}={}){
  const w = text.length*fs*0.95+pad*2;
  return `<rect x="${x-w/2}" y="${y-fs*0.85}" width="${w}" height="${fs*1.7}" rx="${fs*0.85}" fill="${bg}" opacity="0.92"/><text x="${x}" y="${y+fs*0.38}" text-anchor="middle" font-family="Noto Sans KR" font-weight="700" font-size="${fs}" fill="${fg}">${text}</text>`;
}

// Chunky 3D button
function button(x,y,w,h,text,{color='#ff4f8b',fg='#fff',fs=20,depth=7,icon=''}={}){
  const r=h/2;
  return `<g>
    <rect x="${x-w/2}" y="${y-h/2+depth+4}" width="${w}" height="${h}" rx="${r}" fill="#2a0b4e" opacity="0.35" filter="url(#soft6)"/>
    <rect x="${x-w/2}" y="${y-h/2+depth}" width="${w}" height="${h}" rx="${r}" fill="${dark(color,0.4)}"/>
    <rect x="${x-w/2}" y="${y-h/2}" width="${w}" height="${h}" rx="${r}" fill="${linear([[0,light(color,0.2)],[0.5,color],[1,dark(color,0.12)]],0,0,0,1)}"/>
    <rect x="${x-w/2+6}" y="${y-h/2+3}" width="${w-12}" height="${h*0.42}" rx="${h*0.21}" fill="url(#glassTop)"/>
    <text x="${x}" y="${y+fs*0.36}" text-anchor="middle" font-family="Noto Sans KR" font-weight="900" font-size="${fs}" fill="${fg}" filter="url(#textShadow)">${icon}${text}</text>
  </g>`;
}

// Glass HUD panel
function panel(x,y,w,h,{fill='#3b1f6e',op=0.78,r=16}={}){
  return `<rect x="${x}" y="${y+3}" width="${w}" height="${h}" rx="${r}" fill="#1a0a3a" opacity="0.35" filter="url(#soft)"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" opacity="${op}"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="1.5"/>
  <rect x="${x+4}" y="${y+2}" width="${w-8}" height="${h*0.45}" rx="${r*0.8}" fill="url(#glassTop)" opacity="0.5"/>`;
}
function hudText(x,y,small,big,{anchor='middle',bigColor='#fff',bigSize=18,smallSize=10}={}){
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Noto Sans KR" font-weight="700" font-size="${smallSize}" fill="#d9c8ff">${small}</text>
  <text x="${x}" y="${y+bigSize*1.05}" text-anchor="${anchor}" font-family="Noto Sans KR" font-weight="900" font-size="${bigSize}" fill="${bigColor}" filter="url(#textShadow)">${big}</text>`;
}

// 3D title logo (HTML overlay is easier for text-shadow stacks) -> returns SVG using layered text
function logo3d(x,y,text,{fs=74,fill='#ff6fa3',extrude=8,family="'Baloo 2'",rotate=0,gradTop='#fff0f6',gradBottom='#ff5e9a',stroke='#5a2d91'}={}){
  let g=`<g transform="rotate(${rotate} ${x} ${y})">`;
  // shadow
  g += `<text x="${x}" y="${y+extrude+10}" text-anchor="middle" font-family="${family}" font-weight="800" font-size="${fs}" fill="#2a0b4e" opacity="0.35" filter="url(#soft6)">${text}</text>`;
  for(let i=extrude;i>0;i--){
    g += `<text x="${x}" y="${y+i}" text-anchor="middle" font-family="${family}" font-weight="800" font-size="${fs}" fill="${i===extrude?'#4a1d7a':dark(fill,0.5)}" stroke="#4a1d7a" stroke-width="6" stroke-linejoin="round" paint-order="stroke">${text}</text>`;
  }
  const gr = linear([[0,gradTop],[0.45,light(fill,0.15)],[0.5,fill],[1,gradBottom]],0,0,0,1);
  g += `<text x="${x}" y="${y}" text-anchor="middle" font-family="${family}" font-weight="800" font-size="${fs}" fill="${gr}" stroke="${stroke}" stroke-width="6" stroke-linejoin="round" paint-order="stroke">${text}</text>`;
  g += `<text x="${x}" y="${y}" text-anchor="middle" font-family="${family}" font-weight="800" font-size="${fs}" fill="url(#glassTop)" opacity="0.8">${text}</text>`;
  g += `</g>`;
  return g;
}

// Confetti ribbon
function confetti(seed=1,n=60,area=[0,0,W,H]){
  let r=seed; const rnd=()=>{r=(r*9301+49297)%233280;return r/233280;};
  const cols=['#ff5f8a','#ffd23f','#4fb4ff','#4fdcc4','#a76bff','#ff9f7a','#fff'];
  let g='';
  for(let i=0;i<n;i++){
    const x=area[0]+rnd()*area[2], y=area[1]+rnd()*area[3], c=cols[Math.floor(rnd()*cols.length)];
    const w=5+rnd()*6, h=10+rnd()*10, rot=rnd()*360, sk=rnd()*40-20;
    g+=`<g transform="translate(${x} ${y}) rotate(${rot}) skewX(${sk})"><rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="1.5" fill="${linear([[0,light(c,0.4)],[1,dark(c,0.25)]],0,0,1,1)}"/></g>`;
  }
  return g;
}

// Sparkle (4-point)
function sparkle(x,y,r,c='#fff',op=1){
  return `<path d="M${x} ${y-r} Q${x} ${y} ${x+r} ${y} Q${x} ${y} ${x} ${y+r} Q${x} ${y} ${x-r} ${y} Q${x} ${y} ${x} ${y-r}Z" fill="${c}" opacity="${op}" filter="url(#glow)"/>`;
}

// Perspective path: array of points with widths, draws a 3D road with an edge
function road(pts, {fill='url(#cobble)', edge='#b98a5c', edgeW=7, widthFn=(t)=>40, top='#f1dcc0'}={}){
  // Build polygon by offsetting along normals
  const left=[], right=[];
  for(let i=0;i<pts.length;i++){
    const [x,y]=pts[i]; const t=i/(pts.length-1);
    const p=pts[Math.max(0,i-1)], n=pts[Math.min(pts.length-1,i+1)];
    let dx=n[0]-p[0], dy=n[1]-p[1]; const L=Math.hypot(dx,dy)||1; dx/=L; dy/=L;
    const w=widthFn(t)/2; left.push([x-dy*w, y+dx*w]); right.push([x+dy*w, y-dx*w]);
  }
  const poly = 'M'+left.map(p=>p.join(' ')).join(' L')+' L'+right.reverse().map(p=>p.join(' ')).join(' L')+'Z';
  let g = `<path d="${poly}" transform="translate(0 ${edgeW})" fill="${edge}"/>`;
  g += `<path d="${poly}" transform="translate(0 ${edgeW+5})" fill="#2a0b4e" opacity="0.25" filter="url(#soft6)"/>`;
  g += `<path d="${poly}" fill="${fill}"/>`;
  g += `<path d="${poly}" fill="${linear([[0,'#fff',0.35],[1,'#fff',0]],0,0,0,1)}"/>`;
  g += `<path d="${poly}" fill="none" stroke="${top}" stroke-width="2" opacity="0.8"/>`;
  return g;
}

// Smooth curve through points (Catmull-Rom -> sampled)
function sampleCurve(pts, n=60){
  const out=[]; const P=[pts[0],...pts,pts[pts.length-1]];
  for(let i=1;i<P.length-2;i++){
    const [p0,p1,p2,p3]=[P[i-1],P[i],P[i+1],P[i+2]];
    const segs = Math.max(2, Math.round(n/(pts.length-1)));
    for(let j=0;j<segs;j++){ const t=j/segs, t2=t*t, t3=t2*t;
      out.push([0.5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),
                0.5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)]); }
  }
  out.push(pts[pts.length-1]); return out;
}

// Flower
function flower(x,y,c='#ff8fb1',s=1){
  let g='';
  for(let i=0;i<5;i++){const a=i*72;g+=`<ellipse cx="${x}" cy="${y-4*s}" rx="${2.6*s}" ry="${4*s}" fill="${c}" transform="rotate(${a} ${x} ${y})"/>`;}
  g+=`<circle cx="${x}" cy="${y}" r="${2.2*s}" fill="#ffe27a"/>`; return g;
}

// Hill (layered ground with soft shading)
function hill(cx,cy,rx,ry,c){
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${radial(light(c,0.25),c,dark(c,0.18),0.4,0.2,0.85)}"/>`;
}

// Fence segment
function fence(x1,y,x2,s=1){
  let g=''; const n=Math.floor((x2-x1)/(14*s));
  g+=`<rect x="${x1}" y="${y-14*s}" width="${x2-x1}" height="${3*s}" fill="#f6e6d2"/><rect x="${x1}" y="${y-7*s}" width="${x2-x1}" height="${3*s}" fill="#f6e6d2"/>`;
  for(let i=0;i<=n;i++){const x=x1+i*14*s;g+=`<path d="M${x-2.5*s} ${y} L${x-2.5*s} ${y-17*s} L${x} ${y-21*s} L${x+2.5*s} ${y-17*s} L${x+2.5*s} ${y} Z" fill="${linear([[0,'#fff8f0'],[1,'#dcc8b2']],0,0,1,0)}"/>`;}
  return g;
}

// Speech bubble
function speech(x,y,w,h,text,{fs=13,tail='left'}={}){
  const r=h/2;
  return `<g filter="url(#dropShadow)"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="#fff"/>
  <path d="M${tail==='left'?x+16:x+w-16} ${y+h-2} l${tail==='left'?-8:8} 12 l${tail==='left'?14:-14} -6z" fill="#fff"/></g>
  <text x="${x+w/2}" y="${y+h/2+fs*0.36}" text-anchor="middle" font-family="Noto Sans KR" font-weight="700" font-size="${fs}" fill="#5a2d91">${text}</text>`;
}

module.exports = { W,H,uid,mix,light,dark,defs,radial,linear,flushGrads,groundShadow,face,jelly,bubble,house,tree,cloud,coin,starSvg,starsRow,pillLabel,button,panel,hudText,logo3d,confetti,sparkle,road,sampleCurve,flower,hill,fence,speech };
