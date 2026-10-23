// 젤리팝 3D 그림 굽기 — 젤리·거품·대포를 WebGL 레이마칭(광선 따라가며 3D 모양 계산)으로 한 번 그려 그림(dataURL)으로 저장한다.
// 휴대폰 GPU에서는 한 장에 수 ms. WebGL2가 없거나 소프트웨어 GPU(자동 테스트)면 꺼지고, 기존 구미 SVG 그림을 그대로 쓴다.
// 설계 원본: design/forest/scene.glsl (배경 그림은 거기서 미리 구워 assets/bg/ 에 둠)
window.Jelly3D = (() => {
  const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes; uniform int uKind; uniform vec3 uCol; uniform float uMood; uniform float uEars;
out vec4 o;
const vec3 SUN = normalize(vec3(-0.12, 0.70, -0.70));
const vec3 KEY = normalize(vec3(0.55, 0.55, 0.65));
const vec3 SUNC = vec3(1.0, 0.86, 0.58);
const float RR = 3.0;
vec3 camPos;
float hash3(vec3 p){ p = fract(p*0.3183099 + 0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
vec2 voro(vec3 p){ vec3 i=floor(p), f=fract(p); float d1=9.0, d2=9.0;
  for(int z=-1;z<=1;z++) for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){ vec3 g=vec3(x,y,z); vec3 r=g+vec3(hash3(i+g),hash3(i+g+7.1),hash3(i+g+13.3))-f; float d=dot(r,r); if(d<d1){d2=d1;d1=d;} else if(d<d2) d2=d; }
  return vec2(sqrt(d1), sqrt(d2)); }
float smin(float a,float b,float k){ float h=clamp(0.5+0.5*(b-a)/k,0.0,1.0); return mix(b,a,h)-k*h*(1.0-h); }
float smax(float a,float b,float k){ return -smin(-a,-b,k); }
float sdEll(vec3 p, vec3 r){ float k0=length(p/r), k1=length(p/(r*r)); return k0*(k0-1.0)/k1; }
float sdRCone(vec3 p, float r1, float r2, float h){ vec2 q=vec2(length(p.xz),p.y); float b=(r1-r2)/h, a=sqrt(1.0-b*b), k=dot(q,vec2(-b,a));
  if(k<0.0) return length(q)-r1; if(k>a*h) return length(q-vec2(0,h))-r2; return dot(q,vec2(a,b))-r1; }
float sdRBox(vec3 p, vec3 b, float r){ vec3 q=abs(p)-b+r; return length(max(q,0.0))+min(max(q.x,max(q.y,q.z)),0.0)-r; }
vec3 jFwd(vec3 c){ vec3 f = camPos - c; f.y = 0.0; return normalize(f); }
float jellyBody(vec3 p, float r, float ears){
  float d = sdEll(p - vec3(0, 0.92*r, 0), vec3(0.90*r, 0.95*r, 0.86*r));
  d = smin(d, sdEll(p - vec3(0, 0.30*r, 0), vec3(1.04*r, 0.34*r, 0.98*r)), 0.25*r);
  if(ears > 0.5){ vec3 q = p; q.x = abs(q.x); q -= vec3(0.48*r, 1.70*r, 0.0);
    float a = -0.45; q.xy = mat2(cos(a),-sin(a),sin(a),cos(a))*q.xy; d = smin(d, sdEll(q, vec3(0.20*r, 0.30*r, 0.17*r)), 0.12*r); }
  return smax(d, -p.y, 0.06*r);
}
const vec3 FOOT = vec3(0.0, -2.7, 0.0);
float eyeR(){ return 0.25*RR; }
vec3 eyePos(float side){ vec3 f = jFwd(FOOT), rt = normalize(cross(vec3(0,1,0), f)); return FOOT + rt*side*0.34*RR + vec3(0, 1.06*RR, 0) + f*0.66*RR; }
bool hasEyes(){ return uKind==0 && (uMood < 0.5 || uMood > 1.5); }
vec2 map(vec3 p){
  vec2 res = vec2(1e5, 0.0);
  if(uKind==0){
    res = vec2(jellyBody(p - FOOT, RR, uEars), 10.0);
    if(hasEyes()) for(int s=0;s<2;s++){ float de = length(p-eyePos(s==0?-1.0:1.0))-eyeR(); if(de<res.x) res=vec2(de, 20.0+float(s)); }
  } else if(uKind==1){ res = vec2(length(p) - RR, 15.0); }
  else if(uKind==2){
    vec3 q = p - vec3(0,-2.9,0);
    float d = sdRCone(q, 1.05, 1.30, 5.2); d = smax(d, -(length(q.xz) - 0.88), 0.08); d = smax(d, -(5.0 - q.y), 0.05); d = max(d, q.y - 5.25);
    res = vec2(d, 95.0);
    vec3 t1 = q - vec3(0,5.05,0); float lip = length(vec2(length(t1.xz)-1.22, t1.y)) - 0.30; if(lip<res.x) res=vec2(lip, 96.0);
    vec3 t2 = q - vec3(0,1.6,0); float band = length(vec2(length(t2.xz)-1.12, t2.y)) - 0.20; if(band<res.x) res=vec2(band, 96.0);
    vec3 t3 = q - vec3(0,3.3,0); float band2 = length(vec2(length(t3.xz)-1.20, t3.y)) - 0.14; if(band2<res.x) res=vec2(band2, 97.0);
  } else if(uKind==3){
    vec3 q = p - vec3(0, 0.19, 0);
    float d = sdRBox(q, vec3(3.0 - 0.25*clamp(q.y+0.7,0.0,1.4), 0.62, 1.2), 0.28); res = vec2(d, 95.0);
    float trim = sdRBox(q - vec3(0,-0.62,0), vec3(3.15, 0.16, 1.3), 0.14); if(trim<res.x) res=vec2(trim, 96.0);
  } else if(uKind==4){ res = vec2(length(p) - RR, 95.0); }
  else {
    float tire = length(vec2(length(p.xy)-2.3, p.z)) - 0.7; res = vec2(tire, 96.0);
    float disc = max(length(p.xy)-2.2, abs(p.z)-0.25); if(disc<res.x) res=vec2(disc, 98.0);
    float ang = atan(p.y,p.x); float spoke = max(max(abs(sin(ang*3.0))*length(p.xy) - 0.26, length(p.xy)-2.2), abs(p.z-0.25)-0.17); if(spoke<res.x) res=vec2(spoke, 96.0);
    float cap = length(p - vec3(0,0,0.4)) - 0.65; if(cap<res.x) res=vec2(cap, 97.0);
  }
  return res;
}
vec3 calcN(vec3 p, float e){ vec2 k=vec2(1,-1); return normalize(k.xyy*map(p+k.xyy*e).x + k.yyx*map(p+k.yyx*e).x + k.yxy*map(p+k.yxy*e).x + k.xxx*map(p+k.xxx*e).x); }
vec3 eyeShade(vec3 p, vec3 n, vec3 rd, vec3 ec, vec3 fw){
  vec3 d = normalize(p - ec);
  vec3 look = normalize(fw + vec3(0.0, 0.10, 0.0) + normalize(camPos-ec)*0.4);
  float c = dot(d, look);
  vec3 col = vec3(0.98, 0.98, 1.0);
  if(c > 0.40){ float t = smoothstep(0.40, 0.98, c);
    col = mix(vec3(0.04,0.10,0.30), vec3(0.20,0.50,0.95), smoothstep(0.42,0.70,c)*(1.0-smoothstep(0.74,0.82,c)));
    col = mix(col, vec3(0.01,0.01,0.03), smoothstep(0.80, 0.82, c));
    col = mix(vec3(0.03,0.05,0.15), col, smoothstep(0.40, 0.44, c)); col *= 0.85 + 0.25*t; }
  col = pow(col, vec3(2.2));
  col *= 0.35 + 0.65*max(dot(n, KEY), 0.0) + 0.25*max(n.y,0.0);
  vec3 hk = normalize(KEY - rd); col += 1.4*pow(max(dot(n,hk),0.0), 140.0);
  vec3 cl1 = normalize(look + vec3(-0.30, 0.38, 0.0)); col = mix(col, vec3(1.0), smoothstep(0.975, 0.985, dot(d, cl1)));
  vec3 cl2 = normalize(look + vec3(0.22, -0.20, 0.0)); col = mix(col, vec3(1.0), 0.85*smoothstep(0.992, 0.996, dot(d, cl2)));
  return col + vec3(0.25)*pow(1.0-max(dot(n,-rd),0.0), 4.0);
}
vec3 shadeJelly(vec3 p, vec3 n, vec3 rd, vec3 jc, vec3 c, float r){
  jc = pow(jc, vec3(2.2));
  float ndv = max(dot(n,-rd), 0.0), fres = 0.04 + 0.96*pow(1.0 - ndv, 4.0);
  vec3 rr = refract(rd, n, 1.0/1.33);
  float th = 0.03*r; vec3 q = p - n*0.03*r;
  for(int i=0;i<40;i++){ float d = -map(q).x; if(d < 0.002) break; q += rr*max(d,0.01); th += max(d,0.01); }
  vec3 behind = mix(vec3(1.0), jc, 0.7);
  vec3 trans = behind * exp(-(1.0 - jc) * th / (2.0*r) * 3.2) * mix(vec3(1.0), jc, 0.55);
  float core = pow(ndv, 1.6) * smoothstep(0.1, 0.8, th/(1.7*r));
  float lamp = exp(-pow(length((p - c - vec3(0, 0.62*r, 0)) / r * vec3(1.0, 1.3, 1.0)), 2.0) * 1.6);
  vec3 deep = jc*jc*0.55, glowC = mix(jc, vec3(1.0), 0.18) * 1.15;
  vec3 glow = mix(deep, glowC, smoothstep(0.0, 0.85, core)) + mix(jc, vec3(1.0), 0.5) * lamp * 0.55;
  glow += jc * SUNC * 0.8 * pow(max(dot(rd, SUN), 0.0), 3.0);
  vec2 sp = voro(p * 2.2);
  glow += vec3(1.0, 0.98, 0.9) * smoothstep(0.15, 0.06, sp.x) * smoothstep(0.05, 0.4, core);
  vec3 body = trans*0.15 + glow*0.95 + jc*0.15*max(dot(n,KEY),0.0);
  body *= mix(0.72, 1.0, smoothstep(0.0, 0.35*r, p.y - c.y));
  vec3 refl = mix(vec3(0.85,0.95,0.85), vec3(1.0,0.98,0.9), n.y*0.5+0.5);
  vec3 col = mix(body, refl*mix(vec3(1.0), jc, 0.35), fres*0.5);
  vec3 hk = normalize(KEY - rd); col += vec3(1.6)*pow(max(dot(n,hk),0.0), 90.0) + 0.25*pow(max(dot(n,hk),0.0), 12.0);
  vec3 hs = normalize(SUN - rd); col += SUNC*1.2*pow(max(dot(n,hs),0.0), 50.0);
  vec3 hl = normalize(normalize(vec3(-0.55,0.75,0.55)) - rd); col += vec3(0.85)*smoothstep(0.955, 0.985, dot(n,hl)) * smoothstep(0.95*r, 1.15*r, p.y - c.y);
  return col + mix(jc, vec3(1.0), 0.5) * 0.9 * pow(1.0 - ndv, 2.5) * max(dot(n, SUN)+0.3, 0.0);
}
vec3 ink(vec3 col, float m){ return mix(col, vec3(0.04,0.005,0.025), m); }
float seg(vec2 p, vec2 a, vec2 b){ vec2 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0); return length(pa-ba*h); }
vec3 faceDecor(vec3 col, vec3 p, vec3 n, vec3 c, float r){
  vec3 f = jFwd(c), rt = normalize(cross(vec3(0,1,0), f));
  vec3 q = p - c; float u = dot(q, rt)/r, w = q.y/r;
  if(dot(n, f) < 0.2) return col;
  float ch = min(length(vec2(u+0.60, w-0.80)*vec2(1.0,1.5)), length(vec2(u-0.60, w-0.80)*vec2(1.0,1.5)));
  col = mix(col, vec3(1.0,0.12,0.18), 0.55*smoothstep(0.16, 0.02, ch));
  if(uMood < 1.5){ float sm = abs(length(vec2(u, w - 0.90)) - 0.13); if(sm < 0.024 && w < 0.84) col = ink(col, 0.92); }
  if(uMood > 0.5 && uMood < 1.5){ for(int s=0;s<2;s++){ float sx = s==0?-0.36:0.36; float a = abs(length(vec2(u - sx, w - 1.00)) - 0.13); if(a < 0.03 && w > 1.02) col = ink(col, 0.95); } }
  if(uMood > 1.5 && uMood < 2.5){ // worried: raised inner brows, small round mouth
    for(int s=0;s<2;s++){ float sx = s==0?-1.0:1.0; if(seg(vec2(u,w), vec2(sx*0.18,1.42), vec2(sx*0.48,1.34)) < 0.028) col = ink(col, 0.9); }
    float m = length(vec2(u, w - 0.78)*vec2(1.0,0.85)); if(m < 0.075) col = ink(col, 0.92);
  }
  if(uMood > 2.5){ // angry: lowered inner brows, frown
    for(int s=0;s<2;s++){ float sx = s==0?-1.0:1.0; if(seg(vec2(u,w), vec2(sx*0.16,1.30), vec2(sx*0.50,1.42)) < 0.032) col = ink(col, 0.95); }
    float fr = abs(length(vec2(u, w - 0.70)) - 0.13); if(fr < 0.026 && w > 0.76) col = ink(col, 0.92);
  }
  return col;
}
vec3 bubbleFace(vec3 col, vec3 p, vec3 n, float r){
  vec2 l = p.xy / r; if(n.z < 0.3) return col;
  for(int s=0;s<2;s++){ vec2 e = vec2(s==0?-0.30:0.30, 0.06); vec2 d = (l-e)*vec2(1.0,0.82);
    if(length(d) < 0.15){ float t = length(d)/0.15; col = mix(vec3(0.002,0.001,0.005), vec3(0.004,0.010,0.10), smoothstep(0.3,1.0,t)*0.6); }
    if(length(l - e - vec2(-0.05,0.06)) < 0.055) col = vec3(1.0);
    if(length(l - e - vec2(0.05,-0.06)) < 0.025) col = vec3(0.8); }
  float sm = abs(length(l - vec2(0.0,-0.02)) - 0.13); if(sm < 0.025 && l.y < -0.08) col = ink(col, 1.0);
  float ch = min(length(l-vec2(-0.52,-0.12)), length(l-vec2(0.52,-0.12))); return mix(col, vec3(1.0,0.12,0.18), 0.45*smoothstep(0.14,0.02,ch));
}
vec3 candy(vec3 p, vec3 n, vec3 rd, float id){
  vec3 alb; float spec = 1.0, rough = 70.0;
  if(id < 95.5){ alb = mix(uCol, vec3(1.0), 0.15*smoothstep(-2.0,2.0,p.y));
    if(uKind==2){ if(sin(atan(p.z,p.x)*2.0 + p.y*1.6) > 0.55) alb = mix(alb, vec3(1.0,0.97,0.95), 0.85); if(length(p.xz) < 0.9 && p.y > 1.9) alb = uCol*0.35; } }
  else if(id < 96.5){ alb = vec3(1.0,0.78,0.30); spec = 1.4; rough = 90.0; }
  else if(id < 97.5){ alb = vec3(0.62,0.40,0.95); }
  else { alb = vec3(1.0,0.93,0.80); spec = 0.6; rough = 50.0; }
  alb = pow(alb, vec3(2.2));
  float dK = max(dot(n, KEY), 0.0), dS = max(dot(n, SUN), 0.0);
  vec3 col = alb * (vec3(1.0,0.93,0.82)*1.05*dK + SUNC*0.6*dS + vec3(0.62,0.80,0.70)*0.45*(0.5+0.5*n.y)) + alb*0.12;
  vec3 hk = normalize(KEY - rd); col += spec * pow(max(dot(n,hk),0.0), rough);
  vec3 hl = normalize(normalize(vec3(-0.55,0.75,0.55)) - rd); col += 0.35*spec*smoothstep(0.96,0.99,dot(n,hl));
  return col + alb * 0.4 * pow(1.0 - max(dot(n,-rd),0.0), 3.0) * SUNC;
}
void main(){
  vec2 uv = (2.0*gl_FragCoord.xy - uRes) / uRes.y;
  float a = uKind==5 ? 0.0 : 0.12;
  vec3 rd = normalize(vec3(0, -sin(a), -cos(a)));
  vec3 ro = vec3(uv*3.6, 0.0) + vec3(0, 20.0*sin(a), 20.0*cos(a));
  camPos = ro - rd*100.0;
  // march, keeping the closest miss for soft (anti-aliased) edges
  float px = 7.2 / uRes.y, t = 12.0, tm = t, dm = 1e5, hitT = -1.0; vec2 h;
  for(int i=0;i<160;i++){ h = map(ro + rd*t);
    if(h.x < dm){ dm = h.x; tm = t; }
    if(abs(h.x) < 0.0004*t){ hitT = t; break; }
    t += h.x > 0.0 ? max(h.x*0.85, 0.0004*t) : h.x; if(t > 30.0) break; }
  float cov = 1.0;
  if(hitT < 0.0){ cov = 1.0 - clamp(dm / px, 0.0, 1.0); if(cov <= 0.0){ o = vec4(0); return; } hitT = tm; }
  vec3 p = ro + rd*hitT; float id = map(p).y; vec3 n = calcN(p, 0.004);
  vec3 col;
  if(id >= 20.0 && id < 30.0) col = eyeShade(p, n, rd, eyePos(id < 20.5 ? -1.0 : 1.0), jFwd(FOOT));
  else if(id >= 10.0 && id < 20.0){
    vec3 c = uKind==0 ? FOOT : vec3(0,-2.4,0);
    col = shadeJelly(p, n, rd, uCol, c, RR);
    if(uKind==0) col = faceDecor(col, p, n, c, RR);
    else if(uMood < 2.5) col = bubbleFace(col, p, n, RR);
  } else col = candy(p, n, rd, id);
  col = col / (1.0 + col*0.25);
  o = vec4(pow(clamp(col,0.0,1.0), vec3(0.4545)), cov);
}`;
  const KIND = { jelly: 0, bubble: 1, barrel: 2, base: 3, housing: 4, wheel: 5 };
  const MOOD = { happy: 0, joy: 1, worried: 2, angry: 3, none: 3 };
  let gl = null, prog = null, cv = null, state = null, U = {};
  const cache = {};
  function allowed() {
    try {
      const q = new URLSearchParams(location.search).get('3d');
      if (q === '0') return false;
      if (q === '1' || window.JELLY3D_FORCE) return 'force';
    } catch (e) { /* noop */ }
    return true;
  }
  function init() {
    if (state !== null) return state;
    state = false;
    const allow = allowed();
    if (!allow) return state;
    try {
      cv = document.createElement('canvas');
      gl = cv.getContext('webgl2', { preserveDrawingBuffer: true, premultipliedAlpha: false, alpha: true, antialias: false });
      if (!gl) return state;
      // 휴대폰은 앱을 내리거나 메모리가 부족하면 WebGL을 잃을 수 있다 → 이후로는 SVG 그림 (빈 그림을 저장하지 않게)
      cv.addEventListener('webglcontextlost', e => { e.preventDefault(); state = false; });
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      const ren = String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
      if (allow !== 'force' && /swiftshader|llvmpipe|software/i.test(ren)) return state;   // 소프트웨어 GPU는 너무 느림 → SVG 그림
      const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
      prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, '#version 300 es\nin vec2 p;void main(){gl_Position=vec4(p,0,1);}'));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      for (const k of ['uRes', 'uKind', 'uCol', 'uMood', 'uEars']) U[k] = gl.getUniformLocation(prog, k);
      state = true;
    } catch (e) { console.warn('Jelly3D off:', e.message); state = false; }
    return state;
  }
  const SIZES = [64, 96, 128, 192, 256, 384];
  const bucket = px => SIZES.find(s => s >= px * 0.9) || 384;
  function rgb(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
    if (!m) return null;
    const n = parseInt(m[1], 16); return [(n >> 16) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }
  // 그림 한 장 굽기 → dataURL (같은 요청은 저장해 두고 재사용)
  function bake(kind, { color = '#ff7fae', mood = 'happy', ears = false } = {}, px = 192) {
    if (!init()) return null;
    const col = rgb(color); if (!col) return null;
    const size = bucket(px), key = [kind, String(color).toLowerCase(), mood, ears ? 1 : 0, size].join('|');
    if (cache[key] !== undefined) return cache[key];
    if (gl.isContextLost()) { state = false; return null; }
    try {
      cv.width = size; cv.height = size;
      gl.viewport(0, 0, size, size); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(U.uRes, size, size); gl.uniform1i(U.uKind, KIND[kind]); gl.uniform3f(U.uCol, col[0], col[1], col[2]);
      gl.uniform1f(U.uMood, MOOD[mood] !== undefined ? MOOD[mood] : 0); gl.uniform1f(U.uEars, ears ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (gl.isContextLost()) { state = false; return null; }
      let url = cv.toDataURL('image/webp', 0.92);
      if (!url.startsWith('data:image/webp')) url = cv.toDataURL('image/png');
      cache[key] = url;
    } catch (e) { console.warn('Jelly3D bake failed:', e.message); cache[key] = null; }
    return cache[key];
  }
  return { ok: init, bake, bucket, _cache: cache };
})();
