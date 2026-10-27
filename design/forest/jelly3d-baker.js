// [굽기 도구 전용] 게임에서는 쓰지 않는다. design/forest/bake-sprites.mjs 가 이 파일로 sprites3d.js 를 만든다.
// 젤리팝 3D 그림 굽기(도구) — 젤리·거품·대포를 WebGL 레이마칭(광선 따라가며 3D 모양 계산)으로 한 번 그려 그림(dataURL)으로 저장한다.
// 굽기 때는 window.JELLY3D_FORCE = true 로 소프트웨어 GPU에서도 켠다.
// 설계 원본: design/forest/scene.glsl (배경 그림은 거기서 미리 구워 assets/bg/ 에 둠)
window.Jelly3D = (() => {
  const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes; uniform int uKind; uniform vec3 uCol; uniform vec3 uCol2; uniform float uMood; uniform float uEars; uniform int uAcc;
out vec4 o;
const vec3 SUN = normalize(vec3(-0.12, 0.70, -0.70));
const vec3 KEY = normalize(vec3(0.55, 0.55, 0.65));
const vec3 SUNC = vec3(1.0, 0.86, 0.58);
float RR = 3.0;   // 보스·놈놈(uAcc>0)은 장식이 들어가게 몸을 조금 작게
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
vec3 FOOT = vec3(0.0, -2.7, 0.0);
float sdCap(vec3 p, vec3 a, vec3 b, float r){ vec3 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0); return length(pa-ba*h)-r; }
mat2 rot2(float a){ return mat2(cos(a),-sin(a),sin(a),cos(a)); }
// 보스 장식 (q = 발 기준 좌표, r = 몸 반지름). 재질 번호: 96 금, 99 뿔(몸 색 짙게), 100 시럽, 101 캐러멜, 102 체리, 103 금속, 104 분홍 불빛, 105 줄기
vec2 bossAcc(vec3 q, float r){
  vec2 res = vec2(1e5, 0.0);
  if(uAcc==1 || uAcc==2){ for(int s=0;s<2;s++){ float sx = s==0?-1.0:1.0; vec3 h = q - vec3(sx*0.50*r, 1.50*r, -0.05*r); h.xy = rot2(sx*0.55)*h.xy;
      float d = sdRCone(h, 0.20*r, 0.035*r, 0.62*r); if(d<res.x) res = vec2(d, 99.0); } }
  if(uAcc==1 || uAcc==5){ vec3 c = q - vec3(0.0, 1.80*r, 0.0);
    float band = max(abs(length(c.xz) - 0.30*r) - 0.05*r, abs(c.y) - 0.11*r); band -= 0.01*r;
    if(band<res.x) res = vec2(band, 96.0);
    for(int i=0;i<5;i++){ float a = float(i)*1.2566 + 0.3; vec3 k = c - vec3(cos(a)*0.30*r, 0.08*r, sin(a)*0.30*r);
      float d = sdRCone(k, 0.07*r, 0.015*r, 0.22*r); if(d<res.x) res = vec2(d, 96.0);
      float gem = length(k - vec3(0.0, 0.25*r, 0.0)) - 0.045*r; if(gem<res.x) res = vec2(gem, 96.0); } }
  if(uAcc==2 || uAcc==3){ vec3 e = q - vec3(0.0, 0.92*r, 0.0); float ang = atan(e.z, e.x);
    float edge = (uAcc==3 ? 1.30 : 1.38)*r + (uAcc==3 ? 0.07*r*sin(ang*7.0) : 0.0);
    float cap = max(sdEll(e, vec3(0.97*r, 1.0*r, 0.92*r)), edge - q.y);
    if(uAcc==2){ for(int i=0;i<3;i++){ float dx = i==0?-0.48:(i==1?0.10:0.42); float len = i==1?0.30:0.42;
        float z = 0.86*r*sqrt(max(0.0, 1.0 - dx*dx/0.9)); cap = smin(cap, sdCap(q, vec3(dx*r, 1.40*r, z*0.92), vec3(dx*r, (1.40-len)*r, z), 0.085*r), 0.08*r); } }
    if(cap<res.x) res = vec2(cap, uAcc==2 ? 100.0 : 101.0); }
  if(uAcc==3){ float ch = length(q - vec3(0.0, 2.02*r, 0.05*r)) - 0.19*r; if(ch<res.x) res = vec2(ch, 102.0);
    float st = sdCap(q, vec3(0.0, 2.18*r, 0.05*r), vec3(0.16*r, 2.42*r, 0.0), 0.025*r); if(st<res.x) res = vec2(st, 105.0); }
  if(uAcc==4){ float an = sdCap(q, vec3(0.0, 1.75*r, 0.0), vec3(0.0, 2.30*r, 0.0), 0.045*r); if(an<res.x) res = vec2(an, 103.0);
    float led = length(q - vec3(0.0, 2.38*r, 0.0)) - 0.13*r; if(led<res.x) res = vec2(led, 104.0);
    for(int s=0;s<2;s++){ float sx = s==0?-1.0:1.0; float b = sdRBox(q - vec3(sx*1.0*r, 0.85*r, 0.0), vec3(0.12*r, 0.22*r, 0.16*r), 0.05*r); if(b<res.x) res = vec2(b, 103.0); } }
  return res;
}
// 지도 소품 (q = 땅 기준 좌표, 땅 = q.y 0). 재질: 106 벽(uCol2) 107 지붕(uCol) 108 문 109 창문 불빛 110 나무줄기 111 크림 112 버섯 갓 113 창틀 12 젤리 나뭇잎
vec2 propMap(vec3 q){
  vec2 res = vec2(1e5, 0.0);
  if(uKind==6){   // 집: 둥근 벽 + 둥근 지붕 + 문 + 불 켜진 동그란 창 두 개
    float w = sdRBox(q - vec3(0.0, 1.25, 0.0), vec3(1.7, 1.25, 1.3), 0.38); res = vec2(w, 106.0);
    vec3 r = q - vec3(0.0, 2.35, 0.0);
    float rf = smax(sdEll(r, vec3(2.08, 1.62, 1.62)), -r.y, 0.06); if(rf < res.x) res = vec2(rf, 107.0);
    float kn = length(q - vec3(0.0, 4.02, 0.0)) - 0.26; if(kn < res.x) res = vec2(kn, 107.0);
    vec3 dq = q - vec3(0.0, 0.0, 1.30); float door = sdRBox(dq - vec3(0.0, 0.62, 0.0), vec3(0.42, 0.62, 0.10), 0.10);
    door = smin(door, max(length(dq.xy - vec2(0.0, 1.20)) - 0.42, abs(dq.z) - 0.10), 0.02); door = max(door, -q.y); if(door < res.x) res = vec2(door, 108.0);
    for(int s=0;s<2;s++){ vec3 c = q - vec3(s==0?-1.02:1.02, 1.45, 1.32);
      float g = max(length(c.xy) - 0.34, abs(c.z) - 0.06); if(g < res.x) res = vec2(g, 109.0);
      float fr = length(vec2(length(c.xy) - 0.38, c.z)) - 0.07; if(fr < res.x) res = vec2(fr, 113.0); }
  } else if(uKind==7){   // 나무: 줄기 + 젤리 나뭇잎 (uAcc 1 = 솜사탕 나무: 가늘고 흰 줄기 + 몽실몽실한 잎)
    bool cot = uAcc == 1;
    float tr = sdRCone(q, cot ? 0.26 : 0.40, cot ? 0.18 : 0.28, cot ? 3.0 : 2.2); res = vec2(tr, cot ? 111.0 : 110.0);
    float lf;
    if(cot){ vec3 c = q - vec3(0.0, 3.35, 0.0);
      lf = length(c) - 1.15;
      lf = smin(lf, length(c - vec3(-1.15, -0.25, 0.10)) - 0.85, 0.35); lf = smin(lf, length(c - vec3(1.20, -0.20, 0.05)) - 0.90, 0.35);
      lf = smin(lf, length(c - vec3(-0.55, 0.65, -0.10)) - 0.80, 0.35); lf = smin(lf, length(c - vec3(0.60, 0.70, 0.00)) - 0.78, 0.35);
      lf = smin(lf, length(c - vec3(-1.85, -0.40, 0.00)) - 0.50, 0.30); lf = smin(lf, length(c - vec3(1.90, -0.35, 0.00)) - 0.52, 0.30);
    } else { vec3 c = q - vec3(0.0, 2.95, 0.0);
      lf = length(c) - 1.60;
      lf = smin(lf, length(c - vec3(-0.95, -0.40, 0.20)) - 1.05, 0.45); lf = smin(lf, length(c - vec3(0.98, -0.30, 0.10)) - 1.10, 0.45);
      lf = smin(lf, length(c - vec3(0.10, 0.85, -0.10)) - 1.00, 0.45); }
    if(lf < res.x) res = vec2(lf, 12.0);
  } else {   // 버섯: 크림색 기둥 + 반질반질한 점박이 갓
    float st = sdRCone(q, 0.78, 0.55, 1.8); res = vec2(st, 111.0);
    vec3 c = q - vec3(0.0, 1.65, 0.0);
    float cap = smax(sdEll(c, vec3(2.05, 1.40, 1.95)), -(c.y + 0.10), 0.25); if(cap < res.x) res = vec2(cap, 112.0);
  }
  return res;
}
float eyeR(){ return 0.25*RR; }
vec3 eyePos(float side){ vec3 f = jFwd(FOOT), rt = normalize(cross(vec3(0,1,0), f)); return FOOT + rt*side*0.34*RR + vec3(0, 1.06*RR, 0) + f*0.66*RR; }
bool hasEyes(){ return uKind==0 && uAcc < 5 && (uMood < 0.5 || uMood > 1.5); }
vec2 map(vec3 p){
  vec2 res = vec2(1e5, 0.0);
  if(uKind==0){
    float jb = jellyBody(p - FOOT, RR, uEars);
    if(uAcc>=5){ vec3 q = p - FOOT; q.x = abs(q.x); jb = smin(jb, length(q - vec3(0.60*RR, 1.62*RR, -0.05*RR)) - 0.30*RR, 0.10*RR); }   // 놈놈 둥근 귀
    res = vec2(jb, 10.0);
    if(uAcc>0){ vec2 ac = bossAcc(p - FOOT, RR); if(ac.x < res.x) res = ac; }
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
  else if(uKind>=6){ res = propMap(p - FOOT); }
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
  if(uAcc >= 5){ // 놈놈: 어두운 가면 + 빛나는 분홍 눈
    float mk = length(vec2(u, (w - 0.98)*1.18));
    col = mix(col, vec3(0.012,0.004,0.035), 0.88*smoothstep(0.66, 0.60, mk));
    vec3 pinkc = vec3(1.0,0.42,0.80);
    for(int s=0;s<2;s++){ float sx = s==0?-1.0:1.0; vec2 e = vec2(u - sx*0.28, w - 1.04);
      if(uMood < 1.5){ float a = abs(length(e + vec2(0.0, 0.10)) - 0.14); if(a < 0.035 && e.y > -0.06) col = pinkc*1.6; }
      else { float tilt = (uMood > 2.5 ? -0.30 : 0.30) * sx; vec2 ee = vec2(e.x, e.y - tilt*e.x);
        float al = length(ee*vec2(1.0/0.17, 1.0/0.095));
        col += pinkc*0.9*smoothstep(1.9, 1.0, al);
        if(al < 1.0) col = mix(vec3(1.0,0.82,0.93), pinkc, smoothstep(0.2, 1.0, al))*1.5;
        if(length(e) < 0.045) col = vec3(1.6); } }
    if(uMood > 1.5 && uMood < 2.5){ float m = abs(length(vec2(u, w - 0.60)) - 0.12); if(m < 0.025 && w > 0.66) col = pinkc*1.4; }
    else if(uMood > 2.5){ vec2 m = vec2(u, w - 0.70); if(abs(m.x) < 0.16 && m.y < 0.02 - abs(m.x)*0.1 && m.y > -0.05 + 0.25*abs(abs(m.x)-0.08)) col = pinkc*1.4; }
    else { float m = abs(length(vec2(u, w - 0.80)) - 0.12); if(m < 0.025 && w < 0.74) col = pinkc*1.4; }
    return col;
  }
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
  else if(id > 98.5 && id < 99.5){ alb = uCol*0.45; spec = 0.9; rough = 60.0; }
  else if(id > 99.5 && id < 100.5){ alb = vec3(1.0,0.62,0.16); spec = 1.8; rough = 110.0; }
  else if(id > 100.5 && id < 101.5){ alb = vec3(0.62,0.30,0.08); spec = 1.6; rough = 100.0; }
  else if(id > 101.5 && id < 102.5){ alb = vec3(1.0,0.12,0.25); spec = 1.8; rough = 120.0; }
  else if(id > 102.5 && id < 103.5){ alb = vec3(0.78,0.84,0.95); spec = 1.6; rough = 120.0; }
  else if(id > 103.5 && id < 104.5){ return vec3(1.0,0.40,0.62)*1.8; }
  else if(id > 104.5 && id < 105.5){ alb = vec3(0.25,0.56,0.22); }
  else if(id > 105.5 && id < 106.5){ alb = uCol2; spec = 0.7; rough = 60.0; }
  else if(id > 106.5 && id < 107.5){ alb = uCol; spec = 1.6; rough = 110.0; }
  else if(id > 107.5 && id < 108.5){ alb = uCol*0.62; spec = 0.8; }
  else if(id > 108.5 && id < 109.5){ return vec3(1.0,0.86,0.48)*1.35 + vec3(0.25)*pow(max(dot(n,-rd),0.0),8.0); }
  else if(id > 109.5 && id < 110.5){ alb = vec3(0.79,0.55,0.39); spec = 0.5; rough = 40.0; }
  else if(id > 110.5 && id < 111.5){ alb = vec3(0.98,0.93,0.85); spec = 0.6; rough = 50.0; }
  else if(id > 111.5 && id < 112.5){ alb = uCol; spec = 1.7; rough = 110.0; if(voro(p*1.15 + 3.0).x < 0.20 && n.y > -0.2) alb = vec3(1.0,0.98,0.95); }
  else if(id > 112.5 && id < 113.5){ alb = uCol2*0.72; spec = 0.8; }
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
  if(uAcc > 0 && uKind == 0){ RR = 2.3; FOOT = vec3(0.0, -3.0, 0.0); }   // 보스·놈놈만 (나무의 uAcc는 솜사탕 나무 표시)
  float a = uKind==5 ? 0.0 : uKind>=6 ? 0.32 : 0.12;   // 지도 소품은 위에서 조금 더 내려다봄
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
    vec3 c = uKind==0 ? FOOT : uKind==7 ? FOOT + vec3(0.0, uAcc==1 ? 2.6 : 2.2, 0.0) : vec3(0,-2.4,0);
    col = shadeJelly(p, n, rd, uCol, c, uKind==7 ? 1.7 : RR);
    if(uKind==0) col = faceDecor(col, p, n, c, RR);
    else if(uKind==1 && uMood < 2.5) col = bubbleFace(col, p, n, RR);
  } else col = candy(p, n, rd, id);
  col = col / (1.0 + col*0.25);
  o = vec4(pow(clamp(col,0.0,1.0), vec3(0.4545)), cov);
}`;
  const KIND = { jelly: 0, bubble: 1, barrel: 2, base: 3, housing: 4, wheel: 5, house: 6, tree: 7, mushroom: 8 };
  const MOOD = { happy: 0, joy: 1, worried: 2, angry: 3, none: 3, o: 2 };   // o(깜짝)은 걱정 얼굴로
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
      for (const k of ['uRes', 'uKind', 'uCol', 'uCol2', 'uMood', 'uEars', 'uAcc']) U[k] = gl.getUniformLocation(prog, k);
      state = true;
    } catch (e) { console.warn('Jelly3D off:', e.message); state = false; }
    return state;
  }
  const SIZES = [64, 96, 128, 192, 256, 288, 320, 384, 512, 576, 768];
  const bucket = px => SIZES.find(s => s >= px * 0.9) || 768;
  function rgb(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
    if (!m) return null;
    const n = parseInt(m[1], 16); return [(n >> 16) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }
  // 그림 한 장 굽기 → dataURL (같은 요청은 저장해 두고 재사용)
  function bake(kind, { color = '#ff7fae', mood = 'happy', ears = false, acc = 0, col2 = '#ffffff' } = {}, px = 192) {
    if (!init()) return null;
    const col = rgb(color), c2 = rgb(col2); if (!col || !c2) return null;
    const size = bucket(px), key = [kind, String(color).toLowerCase(), mood, ears ? 1 : 0, acc, String(col2).toLowerCase(), size].join('|');
    if (cache[key] !== undefined) return cache[key];
    if (gl.isContextLost()) { state = false; return null; }
    try {
      cv.width = size; cv.height = size;
      gl.viewport(0, 0, size, size); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(U.uRes, size, size); gl.uniform1i(U.uKind, KIND[kind]); gl.uniform3f(U.uCol, col[0], col[1], col[2]); gl.uniform3f(U.uCol2, c2[0], c2[1], c2[2]);
      gl.uniform1f(U.uMood, MOOD[mood] !== undefined ? MOOD[mood] : 0); gl.uniform1f(U.uEars, ears ? 1 : 0); gl.uniform1i(U.uAcc, acc);
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
