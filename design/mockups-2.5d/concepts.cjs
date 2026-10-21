// Style-concept variants of the title + village roadmap screens.
// Each concept supplies a STYLE object; buildTitle/buildMap compose the same layout with concept-specific pieces.
const L = require('./lib.cjs');
const { W,H,defs,radial,linear,flushGrads,house,tree,cloud,coin,button,panel,logo3d,sparkle,road,sampleCurve,flower,hill,fence,speech,groundShadow,starSvg,pillLabel,light,dark,mix,face } = L;

const extraDefs = `<defs>
  <filter id="clay" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
    <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur"/>
    <feDiffuseLighting in="blur" surfaceScale="5" diffuseConstant="1" lighting-color="#fff" result="diff"><feDistantLight azimuth="235" elevation="58"/></feDiffuseLighting>
    <feComposite in="diff" in2="SourceAlpha" operator="in" result="diffIn"/>
    <feComposite in="SourceGraphic" in2="diffIn" operator="arithmetic" k1="0.8" k2="0.3" k3="0" k4="0" result="lit"/>
    <feSpecularLighting in="blur" surfaceScale="5" specularConstant="0.35" specularExponent="8" lighting-color="#fff" result="spec"><feDistantLight azimuth="235" elevation="58"/></feSpecularLighting>
    <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn"/>
    <feComposite in="lit" in2="specIn" operator="arithmetic" k1="0" k2="1" k3="0.5" k4="0" result="o"/>
    <feComposite in="o" in2="SourceAlpha" operator="in"/>
  </filter>
  <filter id="matte" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
    <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"/>
    <feDiffuseLighting in="blur" surfaceScale="3" diffuseConstant="1" lighting-color="#fff" result="diff"><feDistantLight azimuth="235" elevation="65"/></feDiffuseLighting>
    <feComposite in="diff" in2="SourceAlpha" operator="in" result="diffIn"/>
    <feComposite in="SourceGraphic" in2="diffIn" operator="arithmetic" k1="0.55" k2="0.5" k3="0" k4="0" result="lit"/>
    <feComposite in="lit" in2="SourceAlpha" operator="in"/>
  </filter>
  <filter id="glass" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">
    <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="blur"/>
    <feSpecularLighting in="blur" surfaceScale="9" specularConstant="1.1" specularExponent="40" lighting-color="#fff" result="spec"><fePointLight x="100" y="-120" z="300"/></feSpecularLighting>
    <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn"/>
    <feSpecularLighting in="blur" surfaceScale="9" specularConstant="0.5" specularExponent="12" lighting-color="#ffd6f2" result="rim"><fePointLight x="300" y="900" z="200"/></feSpecularLighting>
    <feComposite in="rim" in2="SourceAlpha" operator="in" result="rimIn"/>
    <feComposite in="SourceGraphic" in2="specIn" operator="arithmetic" k1="0" k2="1" k3="0.9" k4="0" result="a"/>
    <feComposite in="a" in2="rimIn" operator="arithmetic" k1="0" k2="1" k3="0.7" k4="0" result="b"/>
    <feComposite in="b" in2="SourceAlpha" operator="in"/>
  </filter>
  <filter id="bloom" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8" result="b"/><feComposite in="b" in2="SourceGraphic" operator="arithmetic" k1="0" k2="0.9" k3="1" k4="0"/></filter>
</defs>`;

function wrap(body){ return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs()}${extraDefs}${flushGrads()}${body}</svg>`; }
const C = { pink:'#ff5f8a', blue:'#4fb4ff', yellow:'#ffd23f', green:'#5ed46a', purple:'#a76bff', peach:'#ff9f7a', mint:'#4fdcc4', lilac:'#ffb3e0', mal:'#ff7fae' };

// ---------------- jelly body path ----------------
function blobPath(x,y,rx,ry){
  return `M${x-rx} ${y+ry*0.2} C${x-rx} ${y-ry*0.5} ${x-rx*0.6} ${y-ry} ${x} ${y-ry} C${x+rx*0.6} ${y-ry} ${x+rx} ${y-ry*0.5} ${x+rx} ${y+ry*0.2} C${x+rx*1.0} ${y+ry*0.8} ${x+rx*0.7} ${y+ry} ${x} ${y+ry} C${x-rx*0.7} ${y+ry} ${x-rx*1.0} ${y+ry*0.8} ${x-rx} ${y+ry*0.2} Z`;
}
function earsPath(x,y,rx,ry,sx){
  return `M${x+sx*rx*0.6} ${y-ry*0.75} C${x+sx*rx*1.15} ${y-ry*0.95} ${x+sx*rx*1.5} ${y-ry*0.1} ${x+sx*rx*1.3} ${y+ry*0.55} C${x+sx*rx*1.2} ${y+ry*0.85} ${x+sx*rx*0.9} ${y+ry*0.8} ${x+sx*rx*0.85} ${y+ry*0.45} C${x+sx*rx*0.8} ${y+ry*0.1} ${x+sx*rx*0.75} ${y-ry*0.4} ${x+sx*rx*0.6} ${y-ry*0.75}Z`;
}

// ---------------- faces per style ----------------
function bigEyes(x,y,s,mood,{iris='#3a1f5e',sparkle=true}={}){
  // kawaii: big round eyes with two highlights
  const e=(dx)=>`<ellipse cx="${x+dx*s}" cy="${y}" rx="${6*s}" ry="${7.5*s}" fill="${iris}"/><circle cx="${x+dx*s-2*s}" cy="${y-3*s}" r="${2.4*s}" fill="#fff"/><circle cx="${x+dx*s+2*s}" cy="${y+2.5*s}" r="${1.2*s}" fill="#fff"/>`;
  let eyes=e(-10)+e(10);
  let mouth=`<path d="M${x-3*s} ${y+9*s} Q${x} ${y+12*s} ${x+3*s} ${y+9*s}" stroke="${iris}" stroke-width="${1.8*s}" fill="none" stroke-linecap="round"/>`;
  if(mood==='joy'){ eyes=`<path d="M${x-15*s} ${y+1*s} Q${x-10*s} ${y-6*s} ${x-5*s} ${y+1*s}" stroke="${iris}" stroke-width="${2.6*s}" fill="none" stroke-linecap="round"/><path d="M${x+5*s} ${y+1*s} Q${x+10*s} ${y-6*s} ${x+15*s} ${y+1*s}" stroke="${iris}" stroke-width="${2.6*s}" fill="none" stroke-linecap="round"/>`;
    mouth=`<path d="M${x-5*s} ${y+7*s} Q${x} ${y+15*s} ${x+5*s} ${y+7*s} Z" fill="${iris}"/><path d="M${x-2.5*s} ${y+11*s} Q${x} ${y+13.5*s} ${x+2.5*s} ${y+11*s} Z" fill="#ff7aa5"/>`; }
  const blush=`<ellipse cx="${x-17*s}" cy="${y+7*s}" rx="${5*s}" ry="${3*s}" fill="#ff6d9a" opacity="0.5"/><ellipse cx="${x+17*s}" cy="${y+7*s}" rx="${5*s}" ry="${3*s}" fill="#ff6d9a" opacity="0.5"/>`;
  const sp = sparkle ? `<path d="M${x-22*s} ${y+4*s} l1.2 2.2 2.2 1.2 -2.2 1.2 -1.2 2.2 -1.2 -2.2 -2.2 -1.2 2.2 -1.2z" fill="#fff" opacity="0.9"/>` : '';
  return blush+eyes+mouth+sp;
}
function dotEyes(x,y,s,mood,{iris='#2b1b3d'}={}){
  // clay: small bead eyes
  const e=(dx)=>`<circle cx="${x+dx*s}" cy="${y}" r="${3.6*s}" fill="${iris}"/><circle cx="${x+dx*s-1.2*s}" cy="${y-1.2*s}" r="${1.1*s}" fill="#fff"/>`;
  let eyes=e(-9)+e(9);
  let mouth=`<path d="M${x-4*s} ${y+7*s} Q${x} ${y+10.5*s} ${x+4*s} ${y+7*s}" stroke="${iris}" stroke-width="${1.8*s}" fill="none" stroke-linecap="round"/>`;
  if(mood==='joy'){ eyes=`<path d="M${x-12*s} ${y} Q${x-9*s} ${y-4*s} ${x-6*s} ${y}" stroke="${iris}" stroke-width="${2.2*s}" fill="none" stroke-linecap="round"/><path d="M${x+6*s} ${y} Q${x+9*s} ${y-4*s} ${x+12*s} ${y}" stroke="${iris}" stroke-width="${2.2*s}" fill="none" stroke-linecap="round"/>`; mouth=`<path d="M${x-5*s} ${y+6*s} Q${x} ${y+13*s} ${x+5*s} ${y+6*s} Z" fill="${iris}"/>`; }
  const blush=`<circle cx="${x-15*s}" cy="${y+6*s}" r="${3.5*s}" fill="#ff8aa8" opacity="0.6"/><circle cx="${x+15*s}" cy="${y+6*s}" r="${3.5*s}" fill="#ff8aa8" opacity="0.6"/>`;
  return blush+eyes+mouth;
}

// ---------------- STYLE-aware jelly ----------------
function jellyS(S,x,y,r,color,{ears=false,mood='happy',shadow=true,faceScale=1}={}){
  const rx=r, ry=r*0.92; const path=blobPath(x,y,rx,ry); const fs=r/38*faceScale;
  let s='';
  if(shadow) s+=groundShadow(x,y+ry*0.98,rx*0.95,ry*0.22,S.shadowOp||0.3);
  const col = S.tint? S.tint(color): color;
  if(S.kind==='gummy'){
    // translucent gummy: see-through body, bright inner core, refracted bottom light
    const body=radial(light(col,0.25),col,dark(col,0.15),0.5,0.55,0.75);
    if(ears){ s+=`<g transform="translate(${x} ${y}) scale(0.8 0.86) translate(${-x} ${-y})" filter="url(#glass)"><path d="${earsPath(x,y,rx,ry,-1)}" fill="${col}" opacity="0.85"/><path d="${earsPath(x,y,rx,ry,1)}" fill="${col}" opacity="0.85"/></g>`; }
    s+=`<g filter="url(#glass)"><path d="${path}" fill="${body}" opacity="0.88"/></g>`;
    s+=`<path d="${path}" fill="${radial('#fff',light(col,0.2),col,0.5,0.6,0.55)}" opacity="0.35"/>`; // inner glow core
    s+=`<path d="${path}" fill="${linear([[0,'#fff',0],[0.62,'#fff',0],[0.82,'#fff',0.5],[1,light(col,0.4),0.2]],0,0,0,1)}"/>`; // bottom refraction band
    s+=`<ellipse cx="${x-rx*0.4}" cy="${y-ry*0.52}" rx="${rx*0.26}" ry="${ry*0.14}" fill="#fff" opacity="0.95" transform="rotate(-28 ${x-rx*0.4} ${y-ry*0.52})"/><circle cx="${x-rx*0.1}" cy="${y-ry*0.74}" r="${r*0.07}" fill="#fff"/>`;
    s+=`<path d="${path}" fill="none" stroke="#fff" stroke-width="${r*0.05}" opacity="0.45"/>`;
    s+=bigEyes(x,y+ry*0.05,fs*0.95,mood,{iris:'#4a1d7a',sparkle:false});
  } else if(S.kind==='kawaii'){
    const pc=light(col,0.18);
    const body=radial(light(pc,0.5),pc,dark(pc,0.12),0.4,0.3,0.8);
    if(ears){ s+=`<g transform="translate(${x} ${y}) scale(0.85 0.9) translate(${-x} ${-y})" filter="url(#matte)"><path d="${earsPath(x,y,rx,ry,-1)}" fill="${radial(light(pc,0.3),pc,dark(pc,0.12),0.4,0.3,0.8)}"/><path d="${earsPath(x,y,rx,ry,1)}" fill="${radial(light(pc,0.3),pc,dark(pc,0.12),0.4,0.3,0.8)}"/></g>`; }
    s+=`<g filter="url(#matte)"><path d="${path}" fill="${body}"/></g>`;
    s+=`<path d="${path}" fill="${linear([[0,'#fff',0.35],[0.5,'#fff',0],[1,dark(pc,0.1),0.15]],0,0,0,1)}"/>`;
    s+=`<ellipse cx="${x-rx*0.38}" cy="${y-ry*0.5}" rx="${rx*0.2}" ry="${ry*0.1}" fill="#fff" opacity="0.8" transform="rotate(-28 ${x-rx*0.38} ${y-ry*0.5})"/>`;
    s+=bigEyes(x,y+ry*0.08,fs,mood,{iris:'#3a2a55'});
  } else if(S.kind==='clay'){
    const cc=mix(col,'#c8b7a6',0.18);
    const body=radial(light(cc,0.25),cc,dark(cc,0.22),0.4,0.3,0.8);
    if(ears){ s+=`<g transform="translate(${x} ${y}) scale(0.8 0.86) translate(${-x} ${-y})" filter="url(#clay)"><path d="${earsPath(x,y,rx,ry,-1)}" fill="${cc}"/><path d="${earsPath(x,y,rx,ry,1)}" fill="${cc}"/></g>`; }
    s+=`<g filter="url(#clay)"><path d="${path}" fill="${body}"/></g>`;
    s+=`<path d="${path}" fill="${linear([[0,'#fff',0],[0.75,'#000',0],[1,'#000',0.18]],0,0,0,1)}"/>`;
    s+=`<ellipse cx="${x-rx*0.36}" cy="${y-ry*0.5}" rx="${rx*0.16}" ry="${ry*0.08}" fill="#fff" opacity="0.45" transform="rotate(-28 ${x-rx*0.36} ${y-ry*0.5})"/>`;
    s+=dotEyes(x,y+ry*0.05,fs,mood);
  } else { // neon glass
    const body=radial(light(col,0.5),col,dark(col,0.3),0.38,0.3,0.72);
    s+=`<path d="${path}" fill="${col}" opacity="0.55" filter="url(#soft24)"/>`;
    if(ears){ s+=`<g transform="translate(${x} ${y}) scale(0.8 0.86) translate(${-x} ${-y})" filter="url(#gel)"><path d="${earsPath(x,y,rx,ry,-1)}" fill="${col}"/><path d="${earsPath(x,y,rx,ry,1)}" fill="${col}"/></g>`; }
    s+=`<g filter="url(#gel)"><path d="${path}" fill="${body}" opacity="0.92"/></g>`;
    s+=`<path d="${path}" fill="${linear([[0,'#fff',0],[0.65,'#fff',0],[1,'#ff9fd8',0.75]],0,0,0,1)}"/>`; // pink rim light from below
    s+=`<path d="${path}" fill="none" stroke="#fff" stroke-width="${r*0.06}" opacity="0.55"/>`;
    s+=`<ellipse cx="${x-rx*0.42}" cy="${y-ry*0.5}" rx="${rx*0.24}" ry="${ry*0.13}" fill="#fff" opacity="0.95" transform="rotate(-28 ${x-rx*0.42} ${y-ry*0.5})"/><circle cx="${x-rx*0.15}" cy="${y-ry*0.72}" r="${r*0.07}" fill="#fff"/>`;
    s+=`<g filter="url(#glow)">${face(x,y+ry*0.05,fs,mood,'#2a0b4e')}</g>`;
  }
  return s;
}

// ---------------- STYLE-aware house ----------------
function houseS(S,x,y,o={}){
  const s=o.s||1;
  if(S.kind==='gummy'){
    // gummy block house: translucent rounded body + jelly dome roof
    const wall=o.wall||'#ffe1f0', roof=o.roof||'#ff8fb1'; const w=(o.w||64)*s,h=(o.h||52)*s,d=22*s;
    let g=groundShadow(x+6*s,y+2,w*0.8,h*0.14,0.3);
    g+=`<g filter="url(#glass)"><rect x="${x-w/2}" y="${y-h}" width="${w}" height="${h}" rx="${10*s}" fill="${radial(light(wall,0.3),wall,dark(wall,0.1),0.4,0.3,0.9)}" opacity="0.92"/></g>`;
    g+=`<path d="M${x+w/2-6*s} ${y-h+10*s} Q${x+w/2+d} ${y-h+2*s} ${x+w/2+d-4*s} ${y-6*s} L${x+w/2-6*s} ${y} Z" fill="${dark(wall,0.22)}" opacity="0.8"/>`;
    g+=`<g filter="url(#glass)"><path d="M${x-w/2-6*s} ${y-h+8*s} Q${x} ${y-h-h*0.9} ${x+w/2+6*s} ${y-h+8*s} Z" fill="${radial(light(roof,0.4),roof,dark(roof,0.2),0.4,0.4,0.8)}" opacity="0.9"/></g>`;
    g+=`<path d="M${x-w/2-6*s} ${y-h+8*s} Q${x} ${y-h-h*0.9} ${x+w/2+6*s} ${y-h+8*s} Z" fill="${linear([[0,'#fff',0.5],[0.6,'#fff',0]],0,0,0,1)}"/>`;
    g+=`<circle cx="${x}" cy="${y-h-h*0.42}" r="${5*s}" fill="${light(roof,0.3)}"/><circle cx="${x}" cy="${y-h-h*0.42}" r="${8*s}" fill="${light(roof,0.3)}" opacity="0.5" filter="url(#soft6)"/>`;
    g+=`<path d="M${x-8*s} ${y} L${x-8*s} ${y-18*s} Q${x} ${y-30*s} ${x+8*s} ${y-18*s} L${x+8*s} ${y} Z" fill="${dark(roof,0.1)}" opacity="0.9"/>`;
    const win=(wx,wy)=>`<circle cx="${wx}" cy="${wy}" r="${6*s}" fill="#fff6c8"/><circle cx="${wx}" cy="${wy}" r="${6*s}" fill="none" stroke="${dark(wall,0.25)}" stroke-width="${1.5*s}"/><circle cx="${wx}" cy="${wy}" r="${9*s}" fill="#ffd36a" opacity="0.4" filter="url(#soft6)"/>`;
    g+=win(x-w*0.28,y-h*0.55)+win(x+w*0.28,y-h*0.55);
    g+=`<ellipse cx="${x-w*0.3}" cy="${y-h*0.85}" rx="${w*0.14}" ry="${h*0.06}" fill="#fff" opacity="0.7" transform="rotate(-20 ${x-w*0.3} ${y-h*0.85})"/>`;
    return g;
  }
  if(S.kind==='kawaii'){
    // mushroom-cap pastel house
    const wall=light(o.wall||'#fff4ea',0.1), roof=light(o.roof||'#ff8fb1',0.15); const w=(o.w||62)*s,h=(o.h||48)*s;
    let g=groundShadow(x+4*s,y+2,w*0.75,h*0.14,0.25);
    g+=`<g filter="url(#matte)"><rect x="${x-w/2}" y="${y-h}" width="${w}" height="${h}" rx="${14*s}" fill="${linear([[0,light(wall,0.2)],[1,dark(wall,0.08)]],0,0,0,1)}"/></g>`;
    g+=`<g filter="url(#matte)"><path d="M${x-w/2-12*s} ${y-h+14*s} C${x-w/2-12*s} ${y-h-h*0.9} ${x+w/2+12*s} ${y-h-h*0.9} ${x+w/2+12*s} ${y-h+14*s} Q${x} ${y-h+24*s} ${x-w/2-12*s} ${y-h+14*s} Z" fill="${radial(light(roof,0.35),roof,dark(roof,0.15),0.38,0.3,0.8)}"/></g>`;
    [[-0.3,-0.45,5],[0.2,-0.6,4],[0.45,-0.3,3.5],[-0.05,-0.25,3]].forEach(([dx,dy,r])=>g+=`<circle cx="${x+dx*w*0.8}" cy="${y-h+dy*h*0.6-4*s}" r="${r*s}" fill="#fff" opacity="0.85"/>`);
    g+=`<path d="M${x-7*s} ${y} L${x-7*s} ${y-16*s} Q${x} ${y-26*s} ${x+7*s} ${y-16*s} L${x+7*s} ${y} Z" fill="${mix(roof,'#b9794f',0.5)}"/>`;
    const win=(wx,wy)=>`<rect x="${wx-6*s}" y="${wy-6*s}" width="${12*s}" height="${12*s}" rx="${5*s}" fill="#fff3c0"/><rect x="${wx-6*s}" y="${wy-6*s}" width="${12*s}" height="${12*s}" rx="${5*s}" fill="none" stroke="${dark(wall,0.2)}" stroke-width="${1.5*s}"/>`;
    g+=win(x-w*0.27,y-h*0.5)+win(x+w*0.27,y-h*0.5);
    g+=`<path d="M${x+w*0.3} ${y-h-h*0.35} l2 4 4 2 -4 2 -2 4 -2 -4 -4 -2 4 -2z" fill="#fff"/>`;
    return g;
  }
  if(S.kind==='clay'){
    // pudding-shaped clay house: rounded dome, thick, matte
    const wall=mix(o.wall||'#fff4ea','#d9c7b3',0.25), roof=mix(o.roof||'#ff8fb1','#c9a98f',0.2); const w=(o.w||66)*s,h=(o.h||50)*s;
    let g=groundShadow(x+8*s,y+3,w*0.85,h*0.16,0.4);
    g+=`<g filter="url(#clay)"><path d="M${x-w/2} ${y} L${x-w/2} ${y-h*0.55} Q${x-w/2} ${y-h*1.25} ${x} ${y-h*1.25} Q${x+w/2} ${y-h*1.25} ${x+w/2} ${y-h*0.55} L${x+w/2} ${y} Z" fill="${radial(light(roof,0.25),roof,dark(roof,0.25),0.38,0.25,0.85)}"/></g>`;
    g+=`<g filter="url(#clay)"><rect x="${x-w/2+3*s}" y="${y-h*0.62}" width="${w-6*s}" height="${h*0.62}" rx="${8*s}" fill="${radial(light(wall,0.2),wall,dark(wall,0.15),0.4,0.3,0.9)}"/></g>`;
    g+=`<path d="M${x-w/2} ${y-h*0.55} Q${x} ${y-h*0.45} ${x+w/2} ${y-h*0.55} L${x+w/2} ${y-h*0.62} Q${x} ${y-h*0.52} ${x-w/2} ${y-h*0.62}Z" fill="${dark(roof,0.3)}" opacity="0.5"/>`;
    g+=`<path d="M${x-7*s} ${y} L${x-7*s} ${y-16*s} Q${x} ${y-26*s} ${x+7*s} ${y-16*s} L${x+7*s} ${y} Z" fill="${mix(roof,'#8a6a52',0.6)}"/>`;
    const win=(wx,wy)=>`<circle cx="${wx}" cy="${wy}" r="${6*s}" fill="#fff0c0"/><circle cx="${wx}" cy="${wy}" r="${6*s}" fill="none" stroke="${dark(wall,0.3)}" stroke-width="${2*s}"/>`;
    g+=win(x-w*0.27,y-h*0.35)+win(x+w*0.27,y-h*0.35);
    g+=`<ellipse cx="${x-w*0.2}" cy="${y-h*1.05}" rx="${w*0.12}" ry="${h*0.05}" fill="#fff" opacity="0.35"/>`;
    return g;
  }
  // neon: the normal 2.5D house with glowing windows and gel roof
  let g=house(x,y,{...o,lit:true});
  const w=(o.w||70)*s,h=(o.h||60)*s;
  g+=`<rect x="${x-w*0.3-7*s}" y="${y-h*0.55-7*s}" width="${14*s}" height="${14*s}" rx="${3*s}" fill="#ffd36a" opacity="0.5" filter="url(#soft12)"/><rect x="${x+w*0.3-7*s}" y="${y-h*0.55-7*s}" width="${14*s}" height="${14*s}" rx="${3*s}" fill="#ffd36a" opacity="0.5" filter="url(#soft12)"/>`;
  return g;
}

function treeS(S,x,y,s=1,c='#6fcf6a'){
  if(S.kind==='gummy'){ let g=groundShadow(x+4*s,y+2,20*s,5*s,0.25); g+=`<rect x="${x-3*s}" y="${y-20*s}" width="${6*s}" height="${20*s}" rx="${3*s}" fill="#c98b63"/>`; g+=`<g filter="url(#glass)"><circle cx="${x}" cy="${y-36*s}" r="${20*s}" fill="${radial(light(c,0.3),c,dark(c,0.1),0.45,0.5,0.75)}" opacity="0.9"/></g><ellipse cx="${x-7*s}" cy="${y-45*s}" rx="${6*s}" ry="${3*s}" fill="#fff" opacity="0.8" transform="rotate(-25 ${x-7*s} ${y-45*s})"/>`; return g; }
  if(S.kind==='kawaii'){ const pc=light(c,0.15); let g=groundShadow(x+4*s,y+2,20*s,5*s,0.2); g+=`<rect x="${x-3*s}" y="${y-18*s}" width="${6*s}" height="${18*s}" rx="${3*s}" fill="#c9a07a"/>`; g+=`<g filter="url(#matte)"><ellipse cx="${x}" cy="${y-36*s}" rx="${20*s}" ry="${22*s}" fill="${radial(light(pc,0.4),pc,dark(pc,0.1),0.4,0.3,0.8)}"/></g><circle cx="${x+8*s}" cy="${y-30*s}" r="${3*s}" fill="#ff8fb1"/><circle cx="${x-9*s}" cy="${y-40*s}" r="${2.5*s}" fill="#ff8fb1"/><circle cx="${x+3*s}" cy="${y-48*s}" r="${2.5*s}" fill="#fff"/>`; return g; }
  if(S.kind==='clay'){ const cc=mix(c,'#b8a88f',0.2); let g=groundShadow(x+6*s,y+3,22*s,6*s,0.35); g+=`<rect x="${x-4*s}" y="${y-20*s}" width="${8*s}" height="${20*s}" rx="${3*s}" fill="#8a6a52"/>`; g+=`<g filter="url(#clay)"><circle cx="${x}" cy="${y-38*s}" r="${21*s}" fill="${radial(light(cc,0.25),cc,dark(cc,0.25),0.38,0.28,0.8)}"/></g>`; return g; }
  let g=tree(x,y,s,c); g+=`<circle cx="${x}" cy="${y-40*s}" r="${22*s}" fill="${c}" opacity="0.35" filter="url(#soft12)"/>`; return g;
}

function cloudS(S,x,y,s=1){
  if(S.kind==='neon') return cloud(x,y,s,0.9,'#9b7be6','#3b1f6e');
  if(S.kind==='clay') return `<g filter="url(#clay)">${[[0,0,26],[-28,8,18],[28,6,20],[-12,-10,20],[14,-12,18]].map(([bx,by,br])=>`<circle cx="${x+bx*s}" cy="${y+by*s}" r="${br*s}" fill="#fbf6ee"/>`).join('')}</g>`;
  if(S.kind==='gummy') return cloud(x,y,s,0.95,'#fff','#f5b8d6');
  return cloud(x,y,s,0.95,'#fff','#f3d7f0');
}

function coinS(S,x,y,r,o){
  if(S.kind==='gummy'||S.kind==='neon'){
    const c=o.state==='locked'?'#cfc6e6':(o.color||'#ffd04a');
    let g=groundShadow(x,y+r*0.55,r*1.1,r*0.35,0.3);
    g+=`<ellipse cx="${x}" cy="${y+r*0.22}" rx="${r*1.06}" ry="${r*0.9}" fill="${dark(c,0.3)}" opacity="0.8"/>`;
    g+=`<g filter="url(#glass)"><ellipse cx="${x}" cy="${y}" rx="${r*1.06}" ry="${r*0.9}" fill="${radial(light(c,0.5),c,dark(c,0.1),0.45,0.5,0.75)}" opacity="0.92"/></g>`;
    g+=`<ellipse cx="${x-r*0.3}" cy="${y-r*0.45}" rx="${r*0.3}" ry="${r*0.12}" fill="#fff" opacity="0.8" transform="rotate(-20 ${x-r*0.3} ${y-r*0.45})"/>`;
    if(o.state==='current') g+=`<ellipse cx="${x}" cy="${y}" rx="${r*1.25}" ry="${r*1.06}" fill="none" stroke="#fff" stroke-width="4" opacity="0.9" filter="url(#glow)"/>`;
    g+=`<text x="${x}" y="${y+r*0.3}" text-anchor="middle" font-family="'Baloo 2'" font-weight="800" font-size="${r*0.95}" fill="${o.state==='locked'?'#8d85a5':'#5a2d91'}" filter="url(#textShadow)">${o.state==='locked'?'🔒':o.n}</text>`;
    if(o.state==='done') g+=L.starsRow(x,y-r*1.05,o.stars,r*0.28);
    if(o.label) g+=pillLabel(x,y+r*1.25,o.label,{bg:S.kind==='neon'?'#2a1555':'#7a4bd8'});
    return g;
  }
  if(S.kind==='clay'){ return coin(x,y,r,{...o,color:o.color||'#f2c14e'}).replace(/url\(#gel\)/g,'url(#clay)'); }
  return coin(x,y,r,{...o,color:o.color||'#ffd97a'}).replace(/url\(#gel\)/g,'url(#matte)');
}

// ---------------- STYLES ----------------
const STYLES = {
  gummy: { kind:'gummy', name:'투명 구미 젤리', shadowOp:0.25,
    sky: ()=>linear([[0,'#ffd1e8'],[0.3,'#ffe6f1'],[0.55,'#fff6e8'],[0.62,'#c9f3d6'],[1,'#7fdc9a']]),
    skyMap: ()=>linear([[0,'#ffd7ea'],[0.25,'#fff1f6'],[0.3,'#d4f5de'],[1,'#8ae2a4']]),
    hills:['#b9efc9','#9be8b3','#7fdc9a','#6ad28b'], ground:'#6ad28b', roadEdge:'#f0a4c0', roadFill:'#fff0f6', roadTop:'#fff',
    logo:{a:{fill:'#ff6fa3',gradTop:'#fff3f8',gradBottom:'#ff4f8b',stroke:'#c2457a'}, b:{fill:'#ffc53d',gradTop:'#fffbe0',gradBottom:'#ff8f1f',stroke:'#c2457a'}},
    btn:'#ff5f9d', ribbon:'#ff8fb1', panel:'#d9548a', text:'#7a2d5e',
    fx:(S,b)=>{ let g=''; for(let i=0;i<18;i++){const x=(i*73)%W, y=60+(i*131)%700; g+=`<circle cx="${x}" cy="${y}" r="${2+(i%3)}" fill="#fff" opacity="0.7"/>`;} return g; } },
  kawaii: { kind:'kawaii', name:'파스텔 카와이', shadowOp:0.2, tint:(c)=>light(c,0.15),
    sky: ()=>linear([[0,'#bde3ff'],[0.35,'#e8d9ff'],[0.55,'#ffe3f0'],[0.62,'#fff5d6'],[0.63,'#c8f0c8'],[1,'#8fd89a']]),
    skyMap: ()=>linear([[0,'#bde3ff'],[0.22,'#eaf6ff'],[0.3,'#d5f3d5'],[1,'#95dc9f']]),
    hills:['#cdefcd','#b5e8b8','#a3e0a8','#8fd89a'], ground:'#8fd89a', roadEdge:'#e3b3cf', roadFill:'#fff7fb', roadTop:'#fff',
    logo:{a:{fill:'#ff9ac2',gradTop:'#fff6fa',gradBottom:'#ff7fb0',stroke:'#7a4bd8'}, b:{fill:'#ffd98a',gradTop:'#fffbe8',gradBottom:'#ffb347',stroke:'#7a4bd8'}},
    btn:'#ff8fb8', ribbon:'#b89aff', panel:'#8a6fd6', text:'#5a3f8f',
    fx:(S,b)=>{ let g=''; const hearts=[[40,140],[350,120],[60,300],[330,330],[300,60]]; hearts.forEach(([x,y],i)=>{const s=0.6+(i%3)*0.3; g+=`<path d="M${x} ${y+6*s} C${x-9*s} ${y-2*s} ${x-6*s} ${y-9*s} ${x} ${y-4*s} C${x+6*s} ${y-9*s} ${x+9*s} ${y-2*s} ${x} ${y+6*s}Z" fill="#ffb3d1" opacity="0.8"/>`;}); return g; } },
  clay: { kind:'clay', name:'클레이 푸딩', shadowOp:0.4, tint:(c)=>mix(c,'#d9c9b4',0.12),
    sky: ()=>linear([[0,'#9fc9e8'],[0.45,'#d9e8f0'],[0.6,'#f3e9d8'],[0.61,'#a9cf8a'],[1,'#7fb866']]),
    skyMap: ()=>linear([[0,'#a6cde6'],[0.25,'#dcebf2'],[0.3,'#b9d99d'],[1,'#86bf6c']]),
    hills:['#c3dba8','#aacd8f','#98c27e','#86bf6c'], ground:'#86bf6c', roadEdge:'#b48a66', roadFill:'#e9d3b5', roadTop:'#f4e4cc',
    logo:{a:{fill:'#ff7f9e',gradTop:'#ffe9ee',gradBottom:'#e85d84',stroke:'#5a3a4a'}, b:{fill:'#f2c14e',gradTop:'#fff3cc',gradBottom:'#e09a2a',stroke:'#5a3a4a'}},
    btn:'#ee6f94', ribbon:'#7f6fb8', panel:'#6a5a8a', text:'#4a3a5a',
    fx:(S,b)=>'' },
  neon: { kind:'neon', name:'캔디 나이트 글로우', shadowOp:0.45,
    sky: ()=>linear([[0,'#1a1046'],[0.35,'#3b2480'],[0.55,'#7a4bb8'],[0.62,'#c86fb0'],[0.64,'#2f6a55'],[1,'#1f4a3a']]),
    skyMap: ()=>linear([[0,'#1a1046'],[0.2,'#3b2480'],[0.3,'#2a5a48'],[1,'#1e4a38']]),
    hills:['#3f8a6a','#357a5c','#2d6a4f','#255a43'], ground:'#255a43', roadEdge:'#5a3a8a', roadFill:'#7c5fc0', roadTop:'#c9b0ff',
    logo:{a:{fill:'#ff6fa3',gradTop:'#fff3f8',gradBottom:'#ff4f8b',stroke:'#2a0b4e'}, b:{fill:'#ffc53d',gradTop:'#fffbe0',gradBottom:'#ff8f1f',stroke:'#2a0b4e'}},
    btn:'#ff4f8b', ribbon:'#7a4bd8', panel:'#2a1555', text:'#fff',
    fx:(S,b)=>{ let g=''; let r=9; const rnd=()=>{r=(r*9301+49297)%233280;return r/233280;}; for(let i=0;i<80;i++){g+=`<circle cx="${rnd()*W}" cy="${rnd()*520}" r="${0.6+rnd()*1.5}" fill="#fff" opacity="${0.3+rnd()*0.7}"/>`;} for(let i=0;i<14;i++){g+=`<circle cx="${rnd()*W}" cy="${400+rnd()*400}" r="${2+rnd()*2}" fill="#ffe27a" opacity="0.9" filter="url(#glowBig)"/>`;} return g; } },
};

// ---------------- TITLE layout ----------------
function buildTitle(S){
  let b=`<rect width="${W}" height="${H}" fill="${S.sky()}"/>`;
  if(S.kind==='neon') b+=`<circle cx="310" cy="150" r="70" fill="#fff3c4" opacity="0.4" filter="url(#soft24)"/><circle cx="310" cy="150" r="30" fill="${radial('#fffbe6','#fff0b3','#f5d98a',0.4,0.35,0.8)}"/>`;
  else b+=`<circle cx="300" cy="500" r="150" fill="#fff" opacity="0.5" filter="url(#soft24)"/>`;
  b+=S.fx(S,b);
  b+=cloudS(S,50,372,0.5)+cloudS(S,345,372,0.6)+cloudS(S,120,430,0.9)+cloudS(S,330,420,0.75);
  b+=hill(80,560,230,60,S.hills[0])+hill(330,560,220,55,S.hills[1]);
  b+=`<g opacity="0.95">`;
  b+=houseS(S,60,525,{s:0.5,wall:'#fff4ea',roof:'#ff8fb1'});
  b+=houseS(S,122,535,{s:0.6,wall:'#fdf0ff',roof:'#7fd6ff'});
  b+=treeS(S,168,538,0.6,'#6fcf6a');
  b+=houseS(S,218,528,{s:0.55,wall:'#fff6e0',roof:'#ffb347'});
  b+=houseS(S,292,540,{s:0.65,wall:'#f3f0ff',roof:'#a76bff'});
  b+=treeS(S,348,542,0.7,'#6fcf6a')+treeS(S,20,540,0.6,'#8fdc7a');
  b+=`</g>`;
  b+=hill(195,640,300,90,S.hills[2]);
  b+=hill(195,760,330,130,S.hills[3]);
  if(S.kind==='neon') b+=`<ellipse cx="195" cy="700" rx="200" ry="40" fill="#5fd6a0" opacity="0.25" filter="url(#soft24)"/>`;
  const fl = S.kind==='neon'?['#ff9fd8','#ffe27a','#9fe8ff']:[C.pink,'#ffe27a','#fff'];
  [[40,700],[70,735],[330,700],[355,740],[300,760],[55,780],[345,790],[90,660]].forEach(([x,y],i)=>b+=flower(x,y,fl[i%3],1.3));
  b+=jellyS(S,118,600,30,C.mint)+jellyS(S,282,598,32,C.purple,{mood:'joy'});
  b+=jellyS(S,80,668,42,C.blue,{mood:'joy'})+jellyS(S,312,672,44,C.yellow);
  b+=jellyS(S,195,650,84,C.mal,{ears:true,faceScale:1.05});
  b+=sparkle(300,560,10)+sparkle(60,620,8)+sparkle(120,745,7,'#ffe27a')+sparkle(330,780,6);
  b+=`<ellipse cx="195" cy="190" rx="170" ry="95" fill="${S.kind==='neon'?'#000':'#fff'}" opacity="${S.kind==='neon'?0.35:0.3}" filter="url(#soft24)"/>`;
  b+=logo3d(195,165,'JELLY',{fs:92,extrude:9,rotate:-3,...S.logo.a});
  b+=logo3d(200,262,'POP!',{fs:104,extrude:10,rotate:-3,...S.logo.b});
  if(S.kind==='gummy'||S.kind==='neon'){ b+=`<g filter="url(#bloom)">${sparkle(60,120,14)+sparkle(335,110,11)+sparkle(330,215,9,'#ffe27a')+sparkle(45,260,8)}</g>`; }
  else b+=sparkle(60,120,14)+sparkle(335,110,11)+sparkle(330,215,9,'#ffe27a')+sparkle(45,260,8);
  b+=jellyS(S,345,170,13,C.blue,{shadow:false})+jellyS(S,45,195,11,C.green,{shadow:false})+jellyS(S,325,60,9,C.purple,{shadow:false});
  b+=ribbonS(S,195,322,236,40,'젤리마을 대소동');
  b+=button(195,744,268,60,'모험 시작!',{color:S.btn,fs:24});
  b+=button(195,812,220,46,'스티커 북',{color:'#fdf6ff',fg:'#6a3bbf',fs:18});
  return wrap(b);
}
function ribbonS(S,x,y,w,h,text){
  const color=S.ribbon, d=dark(color,0.35);
  return `<g filter="url(#dropShadow)">
    <path d="M${x-w/2-18} ${y-h/2+6} L${x-w/2+6} ${y-h/2+6} L${x-w/2+6} ${y+h/2+6} L${x-w/2-18} ${y+h/2+6} L${x-w/2-6} ${y+6} Z" fill="${d}"/>
    <path d="M${x+w/2+18} ${y-h/2+6} L${x+w/2-6} ${y-h/2+6} L${x+w/2-6} ${y+h/2+6} L${x+w/2+18} ${y+h/2+6} L${x+w/2+6} ${y+6} Z" fill="${d}"/>
    <path d="M${x-w/2} ${y-h/2} Q${x} ${y-h/2-5} ${x+w/2} ${y-h/2} L${x+w/2} ${y+h/2} Q${x} ${y+h/2-5} ${x-w/2} ${y+h/2} Z" fill="${linear([[0,light(color,0.25)],[1,color]],0,0,0,1)}"/>
    <path d="M${x-w/2} ${y-h/2} Q${x} ${y-h/2-5} ${x+w/2} ${y-h/2} L${x+w/2} ${y-h/2+h*0.45} Q${x} ${y-h/2+h*0.4} ${x-w/2} ${y-h/2+h*0.45} Z" fill="#fff" opacity="0.2"/>
  </g><text x="${x}" y="${y+7}" text-anchor="middle" font-family="Noto Sans KR" font-weight="900" font-size="19" fill="#fff" filter="url(#textShadow)">${text}</text>`;
}

// ---------------- MAP layout ----------------
function buildMap(S){
  const night=S.kind==='neon';
  let b=`<rect width="${W}" height="${H}" fill="${S.skyMap()}"/>`;
  b+=S.fx(S,b);
  if(!night) b+=`<circle cx="60" cy="150" r="60" fill="#fff8d0" opacity="0.8" filter="url(#soft24)"/>`;
  else b+=`<circle cx="320" cy="140" r="60" fill="#fff3c4" opacity="0.45" filter="url(#soft24)"/><circle cx="320" cy="140" r="26" fill="${radial('#fffbe6','#fff0b3','#f5d98a',0.4,0.35,0.8)}"/>`;
  b+=cloudS(S,300,120,0.55)+cloudS(S,90,175,0.45)+cloudS(S,200,95,0.35);
  b+=hill(60,290,200,50,S.hills[0])+hill(340,285,180,45,S.hills[1]);
  // castle: reuse scenes castle via require to avoid duplication
  const { castle } = require('./scenes.cjs')._parts;
  b+=`<g opacity="0.96">${castle(195,272,0.82, night?'#8f73d0':(S.kind==='clay'?'#b9a7d6':'#c3a6f2'),{night})}</g>`;
  if(!night) b+=`<rect x="0" y="200" width="${W}" height="120" fill="${linear([[0,'#ffffff',0.45],[1,'#ffffff',0]],0,0,0,1)}"/>`;
  b+=hill(195,400,320,70,S.hills[2]);
  // river
  const wc = night?['#3a6ab8','#1f3f8a','#7fb0ff']:['#7fd0ff','#3fa7f0','#bfe9ff'];
  b+=`<path d="M0 410 C80 395 150 425 230 415 C300 406 340 430 390 418 L390 470 C330 482 280 455 210 468 C140 480 70 450 0 465 Z" fill="${linear([[0,wc[0]],[1,wc[1]]],0,0,0,1)}"/>`;
  b+=`<path d="M0 410 C80 395 150 425 230 415 C300 406 340 430 390 418 L390 426 C330 440 280 414 210 428 C140 440 70 408 0 420 Z" fill="${wc[2]}" opacity="0.6"/>`;
  [[40,445],[120,452],[300,448],[350,462],[200,455]].forEach(([x,y])=>b+=`<path d="M${x} ${y} q6 -3 12 0 q6 3 12 0" stroke="#fff" stroke-width="2" fill="none" opacity="0.7" stroke-linecap="round"/>`);
  b+=`<path d="M326 326 L390 326 L390 424 L338 424 Z" fill="${linear([[0,S.hills[1]],[1,dark(S.hills[3],0.3)]],0,0,1,0)}"/><rect x="348" y="335" width="34" height="85" rx="8" fill="${linear([[0,'#e8f8ff'],[0.5,wc[2]],[1,'#e8f8ff']],0,0,1,0)}" opacity="0.95"/><rect x="352" y="340" width="6" height="75" rx="3" fill="#fff" opacity="0.8"/><ellipse cx="365" cy="420" rx="26" ry="8" fill="#fff" opacity="0.8" filter="url(#soft6)"/>`;
  b+=hill(195,560,330,90,S.hills[3]); b+=hill(195,760,360,150,S.ground);
  const nodes=[[118,722],[272,660],[112,566],[262,462],[128,348],[195,266]];
  const pts=sampleCurve([[160,844],...nodes],70);
  b+=road(pts,{widthFn:t=>56-t*36,edge:S.roadEdge,edgeW:7,fill:S.kind==='clay'?'url(#cobble)':S.roadFill,top:S.roadTop});
  if(S.kind==='gummy'||S.kind==='kawaii'){ // candy dots along the road
    pts.filter((_,i)=>i%6===3).forEach(([x,y],i)=>b+=`<circle cx="${x}" cy="${y}" r="3.5" fill="${[C.pink,C.blue,C.yellow,C.green][i%4]}" opacity="0.8"/>`);
  }
  if(night) b+=`<path d="M160 844 ${pts.map(p=>'L'+p[0]+' '+p[1]).join(' ')}" stroke="#d9b8ff" stroke-width="22" fill="none" opacity="0.18" filter="url(#soft12)"/>`;
  // bridge
  b+=`<g>${groundShadow(238,478,40,8,0.3)}<path d="M200 462 Q238 440 276 462 L276 470 Q238 450 200 470 Z" fill="${linear([[0,light(S.roadEdge,0.3)],[1,S.roadEdge]],0,0,0,1)}"/><rect x="200" y="470" width="76" height="8" fill="${S.roadEdge}"/>${[0,1,2,3,4].map(i=>`<rect x="${203+i*17}" y="${452-Math.sin(i/4*Math.PI)*8}" width="4" height="22" fill="#fff" opacity="0.85"/>`).join('')}<path d="M200 452 Q238 430 276 452" stroke="#fff" stroke-width="3" fill="none" opacity="0.85"/></g>`;
  // props
  b+=treeS(S,30,330,0.55)+treeS(S,355,300,0.5)+treeS(S,290,335,0.5,'#8fdc7a');
  b+=houseS(S,52,350,{s:0.48,wall:'#fff6e0',roof:'#ff8c42'});
  b+=houseS(S,318,372,{s:0.52,wall:'#fdf0ff',roof:'#7fd6ff'});
  b+=treeS(S,60,500,0.8)+treeS(S,345,520,0.85,'#8fdc7a');
  b+=houseS(S,70,540,{s:0.8,wall:'#fff4ea',roof:'#ff8fb1'});
  const fl = night?['#ff9fd8','#ffe27a','#9fe8ff']:[C.pink,'#fff','#ffe27a'];
  [[150,520],[175,540],[60,590],[190,600],[165,560],[40,620]].forEach(([x,y],i)=>b+=flower(x,y,fl[i%3],1.25));
  b+=houseS(S,330,590,{s:0.9,wall:'#f3f0ff',roof:'#a76bff'});
  const { fountain, windmill, lamp, bossJelly } = require('./scenes.cjs')._parts;
  b+=fountain(300,640,1.05); b+=windmill(340,690,0.9); b+=fence(10,660,90,0.9);
  b+=treeS(S,40,700,1.0,'#6fcf6a');
  b+=houseS(S,40,805,{s:0.95,wall:'#fff6e0',roof:'#ffb347'});
  b+=houseS(S,340,790,{s:0.9,wall:'#fdf0ff',roof:'#4fdcc4'});
  b+=lamp(215,790,1.0); b+=treeS(S,265,835,1.0,'#8fdc7a');
  if(night) b+=lamp(170,360,0.7)+lamp(60,480,0.8);
  // coins
  b+=coinS(S,nodes[0][0],nodes[0][1],28,{n:'1',state:'done',stars:3,label:'마을 광장'});
  b+=coinS(S,nodes[1][0],nodes[1][1],26,{n:'2',state:'done',stars:3,label:'젤리 분수'});
  b+=coinS(S,nodes[2][0],nodes[2][1],24,{n:'3',state:'done',stars:2,label:'꽃밭 언덕'});
  b+=coinS(S,nodes[3][0],nodes[3][1],22,{n:'4',state:'current',label:'폭포 다리'});
  b+=coinS(S,nodes[4][0],nodes[4][1],20,{n:'5',state:'locked',label:'노을 지붕'});
  b+=coinS(S,nodes[5][0],nodes[5][1]+6,18,{n:'',state:'locked',color:'#b47cff'});
  b+=jellyS(S,195,262,17,'#7c4dd8',{mood:'angry'});
  b+=pillLabel(195,304,'보스 · 마을 입구',{bg:'#5a2d91',fs:11});
  b+=jellyS(S,232,432,26,C.mal,{ears:true,mood:'joy'});
  b+=jellyS(S,196,520,15,C.pink)+jellyS(S,172,543,14,C.blue)+jellyS(S,150,566,13,C.peach,{mood:'joy'});
  b+=speech(250,380,100,28,'다음은 여기!',{fs:12,tail:'left'});
  // HUD
  const { topHud } = require('./scenes.cjs')._parts;
  b+=topHud({title:'젤리마을',sub:'월드 1',right1:'스티커',right2:'3 / 30',night,fill:S.panel});
  b+=`<rect x="0" y="760" width="${W}" height="84" fill="${linear([[0,'#2e1f7a',0],[1,'#2e1f7a',0.45]],0,0,0,1)}"/>`;
  b+=button(150,802,250,56,'스테이지 4 시작',{color:S.btn,fs:21});
  b+=button(325,802,84,56,'📖',{color:'#fdf6ff',fg:'#6a3bbf',fs:24});
  return wrap(b);
}

const out={};
for(const k of Object.keys(STYLES)){ out[`${k}-title`]=()=>buildTitle(STYLES[k]); out[`${k}-map`]=()=>buildMap(STYLES[k]); }
module.exports = out;
