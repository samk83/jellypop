// 젤리팝 렌더링 시안용 장면 그리기 (WebGL 광선 추적, 라이브러리 없음)
// 장면 번호: 1 타이틀 · 2 모험 지도 · 3 게임 · 4 스테이지 클리어 · 5 보스
window.JellyRender = (() => {
const FS = `
precision highp float;
uniform vec2 uRes;
uniform float uScene;
vec2 gUV;
float gGlass = 1.0;
const vec3 SUN = vec3(-0.42, 0.62, 0.66);

float hash(float n){ return fract(sin(n*127.1)*43758.5453); }
float smin(float a, float b, float k){ float h = clamp(.5+.5*(b-a)/k, 0., 1.); return mix(b, a, h) - k*h*(1.-h); }
float sdRoundBox(vec3 p, vec3 b, float r){ vec3 q = abs(p)-b+r; return length(max(q,0.)) + min(max(q.x,max(q.y,q.z)),0.) - r; }
float sdEllipsoid(vec3 p, vec3 r){ float k0 = length(p/r); float k1 = length(p/(r*r)); return k0*(k0-1.)/k1; }
float sdCapsule(vec3 p, vec3 a, vec3 b, float r){ vec3 pa = p-a, ba = b-a; float h = clamp(dot(pa,ba)/dot(ba,ba), 0., 1.); return length(pa-ba*h) - r; }
float sdTorus(vec3 p, vec2 t){ vec2 q = vec2(length(p.xz)-t.x, p.y); return length(q)-t.y; }
float sdCyl(vec3 p, float h, float r){ vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h); return min(max(d.x,d.y),0.) + length(max(d,0.)); }
float sdCone(vec3 p, float h, float r){ float q = length(p.xz); return max(dot(normalize(vec2(h, r)), vec2(q, p.y)), -p.y - h) ; }
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c,-s,s,c); }
float sdStar(vec2 p, float r, float rf){
  const vec2 k1 = vec2(0.809016994375, -0.587785252292);
  const vec2 k2 = vec2(-k1.x, k1.y);
  p.x = abs(p.x);
  p -= 2.0*max(dot(k1,p),0.0)*k1;
  p -= 2.0*max(dot(k2,p),0.0)*k2;
  p.x = abs(p.x);
  p.y -= r;
  vec2 ba = rf*vec2(-k1.y,k1.x) - vec2(0,1);
  float h = clamp(dot(p,ba)/dot(ba,ba), 0.0, r);
  return length(p-ba*h) * sign(p.y*ba.x-p.x*ba.y);
}
vec2 U(vec2 a, vec2 b){ return a.x < b.x ? a : b; }

// 젤리 친구: 바닥 y=0, +z 쪽을 바라봄. ears=1 말랑이 귀, happy=1 웃는 눈, angry=1 화난 눈(보스)
vec2 jelly(vec3 q, float s, float mat, float ears, float happy){
  float bd = length(q - vec3(0., .55*s, 0.)) - 1.05*s;
  if (bd > .4) return vec2(bd, 0.);   // 멀면 대충 거리만 (빠르게)
  q /= s;
  float body = sdEllipsoid(q - vec3(0., .5, 0.), vec3(.6, .53, .54));
  body = max(body, -q.y);
  body = smin(body, sdEllipsoid(q - vec3(0., .06, 0.), vec3(.57, .1, .51)), .05);
  float d = body;
  if (ears > .5){ vec3 e = q - vec3(0., .66, 0.); e.x = abs(e.x) - .6; e.xy *= rot(-.55); d = smin(d, sdEllipsoid(e, vec3(.17, .38, .15)), .07); }
  vec3 eq = q - vec3(0., .63, .47); eq.x = abs(eq.x) - .2;
  float eye = happy > .5
    ? min(sdCapsule(eq, vec3(-.075,-.02,0.), vec3(0.,.04,0.), .03), sdCapsule(eq, vec3(0.,.04,0.), vec3(.075,-.02,0.), .03))
    : sdEllipsoid(eq, vec3(.072, .1, .05));
  float mouth = min(sdCapsule(q, vec3(-.09,.47,.505), vec3(0.,.42,.52), .024), sdCapsule(q, vec3(.09,.47,.505), vec3(0.,.42,.52), .024));
  vec3 cq = q - vec3(0., .5, .44); cq.x = abs(cq.x) - .34;
  float cheek = sdEllipsoid(cq, vec3(.09, .055, .035));
  vec2 r = vec2(d*s, mat);
  r = U(r, vec2(min(eye, mouth)*s, 12.));
  r = U(r, vec2(cheek*s, 17.));
  return r;
}
// 사탕 거품(얼굴 있는 거품): 중심 c, 반지름 rad
vec2 candy(vec3 p, vec3 c, float rad, float mat){
  float bd = length(p - c) - rad*1.15;
  if (bd > .3) return vec2(bd, 0.);
  vec3 q = (p - c)/rad;
  float b = length(q) - 1.;
  vec3 eq = q - vec3(0., .1, .9); eq.x = abs(eq.x) - .3;
  float eye = sdEllipsoid(eq, vec3(.11, .15, .09));
  float mouth = min(sdCapsule(q, vec3(-.13,-.16,.94), vec3(0.,-.24,.96), .04), sdCapsule(q, vec3(.13,-.16,.94), vec3(0.,-.24,.96), .04));
  vec2 r = vec2(b*rad, mat);
  return U(r, vec2(min(eye, mouth)*rad, 12.));
}
vec2 house(vec3 q, float s, float roofMat){
  float bd = length(q - vec3(0., 1.3*s, 0.)) - 2.4*s;
  if (bd > .4) return vec2(bd, 0.);
  q /= s;
  float body = sdRoundBox(q - vec3(0., .95, 0.), vec3(1.1, .95, 1.), .16);
  float roof = sdEllipsoid(q - vec3(0., 1.85, 0.), vec3(1.42, 1.0, 1.3));
  roof = max(roof, -(q.y - 1.82));
  float door = sdRoundBox(q - vec3(0., .5, 1.), vec3(.3, .5, .07), .13);
  float win = sdRoundBox(vec3(abs(q.x) - .68, q.y - 1.2, q.z - 1.), vec3(.2, .2, .05), .09);
  float chim = sdRoundBox(q - vec3(.6, 2.55, -.3), vec3(.16, .3, .16), .05);
  vec2 r = vec2(body*s, 3.);
  r = U(r, vec2(min(roof, chim)*s, roofMat));
  r = U(r, vec2(door*s, 18.));
  r = U(r, vec2(win*s, 11.));
  return r;
}
vec2 tree(vec3 q, float s, float leafMat){
  float bd = length(q - vec3(0., 1.6*s, 0.)) - 1.75*s;
  if (bd > .4) return vec2(bd, 0.);
  q /= s;
  float trunk = sdCapsule(q, vec3(0.), vec3(0., 1.3, 0.), .16);
  float leaf = smin(length(q - vec3(0., 2., 0.)) - .85, length(q - vec3(.45, 1.6, .2)) - .6, .3);
  leaf = smin(leaf, length(q - vec3(-.45, 1.65, -.15)) - .6, .3);
  return U(vec2(trunk*s, 6.), vec2(leaf*s, leafMat));
}

// ---------- 장면 1·4: 언덕 위 친구들 ----------
vec2 mapHill(vec3 p, float clear){
  float g = p.y - (.25*sin(p.x*.4)*sin(p.z*.3) + (clear > .5 ? 1.0 - .03*dot(p.xz,p.xz) : 0.));
  vec2 r = vec2(g*.7, 1.);
  // 마을 (뒤쪽)
  for (int i = 0; i < 6; i++){
    float fi = float(i);
    vec3 hp = vec3(-7.5 + fi*3.0 + hash(fi)*1.2, 0., -9. - hash(fi+3.)*4.);
    if (abs(hp.x) < 1.8) hp.x += 2.6*sign(hp.x + .01);
    vec3 q = p - hp; q.xz *= rot(.3*(hash(fi+7.)-.5));
    r = U(r, house(q, .95 + .3*hash(fi+1.), 4. + fract(fi*.27)));
  }
  for (int i = 0; i < 5; i++){
    float fi = float(i);
    float tx = -6. + fi*3.1 + hash(fi+9.);
    if (abs(tx) < 2.2) tx += 2.8*sign(tx + .01);
    r = U(r, tree(p - vec3(tx, 0., -5.5 - hash(fi+11.)*2.5), .8 + .4*hash(fi), hash(fi+5.) > .5 ? 7.5 : 7.));
  }
  if (clear < .5){
    // 타이틀: 말랑이 + 친구 넷, 떠 있는 유리 거품
    r = U(r, jelly(p - vec3(0., 0., .5), 1.25, 8., 1., 0.));
    r = U(r, jelly(p - vec3(-1.05, 0., -.55), .85, 9., 0., 1.));
    r = U(r, jelly(p - vec3(1.1, 0., -.45), .85, 10., 0., 0.));
    r = U(r, jelly(p - vec3(-1.65, 0., -1.7), .7, 19., 0., 0.));
    r = U(r, jelly(p - vec3(1.7, 0., -1.75), .7, 20., 0., 1.));
    if (gGlass > .5){
      r = U(r, vec2(length(p - vec3(-1.25, 2.6, -.4)) - .42, 50.));
      r = U(r, vec2(length(p - vec3(1.35, 2.25, -.8)) - .32, 50.));
      r = U(r, vec2(length(p - vec3(.4, 3.3, -1.6)) - .28, 50.));
    }
    r = U(r, candy(p, vec3(-1.8, 1.55, .2), .22, 24.));
    r = U(r, candy(p, vec3(1.85, 1.75, .3), .2, 27.));
  } else {
    // 클리어: 뛰어오른 말랑이, 기뻐하는 친구, 금별 셋, 꽃가루
    r = U(r, jelly(p - vec3(-.05, 1.55, .4), 1.1, 8., 1., 1.));
    r = U(r, jelly(p - vec3(1.05, .98, .1), .7, 9., 0., 1.));
    for (int i = 0; i < 3; i++){
      float fi = float(i) - 1.;
      vec3 q = p - vec3(fi*1.15, 3.55 + (fi == 0. ? .35 : 0.), 0.);
      q.xy *= rot(-fi*.25);
      float sz = fi == 0. ? .62 : .48;
      float st = sdStar(q.xy, sz, .45);
      float star = length(max(vec2(st, abs(q.z) - .1), 0.)) + min(max(st, abs(q.z) - .1), 0.) - .06;
      r = U(r, vec2(star, 14.));
    }
    vec3 c = p - vec3(0., 3., -1.);
    vec3 id = floor(c/.7);
    if (abs(id.x) < 4. && id.y > -2. && id.y < 3. && abs(id.z) < 2.){
      vec3 q = mod(c, .7) - .35 + (vec3(hash(dot(id, vec3(1.,7.,13.))), hash(dot(id, vec3(3.,5.,11.))), hash(dot(id, vec3(9.,2.,4.)))) - .5)*.3;
      q.xy *= rot(hash(id.x+id.y*9.)*6.28); q.yz *= rot(hash(id.z+id.y*3.)*6.28);
      r = U(r, vec2(sdRoundBox(q, vec3(.08, .04, .01), .005), 30. + floor(hash(dot(id, vec3(5.,3.,1.)))*5.)));
    }
  }
  return r;
}

// ---------- 장면 2: 모험 지도 ----------
float roadX(float z){ return 2.1*sin(z*.36 + .5); }
float nodeZ(float i){ return 5.2 - i*3.05; }
vec2 mapRoad(vec3 p){
  float river = smoothstep(.8, .45, abs(p.z + 4.5));
  float off = abs(p.x - roadX(p.z));
  float g = p.y - (.18*smoothstep(2., 6., off)*sin(p.x*.6)*sin(p.z*.5) - .45*river);
  vec2 r = vec2(g*.7, 1.);
  r = U(r, vec2(max(p.y + .12, abs(p.z + 4.5) - .6), 16.));               // 강물
  float bx = roadX(-4.5);
  r = U(r, vec2(sdRoundBox(p - vec3(bx, .05, -4.5), vec3(.85, .07, .95), .04), 18.)); // 다리
  r = U(r, vec2(sdCapsule(vec3(abs(p.x - bx) - .85, p.y - .3, p.z + 4.5), vec3(0.,0.,-.95), vec3(0.,0.,.95), .06), 6.));
  for (int i = 0; i < 6; i++){
    float fi = float(i), z = nodeZ(fi);
    vec3 q = p - vec3(roadX(z), .12, z);
    float m = fi < 2. ? 14. : (fi < 3. ? 22. : (fi < 5. ? 25. : 15.));
    r = U(r, vec2(sdCyl(q, .12, .62) - .04, m));
  }
  for (int i = 0; i < 9; i++){
    float fi = float(i), z = 6.2 - fi*2.05;
    float s = mod(fi, 2.) < 1. ? -1. : 1.;
    vec3 q = p - vec3(roadX(z) + s*(2.0 + hash(fi)*.9), 0., z);
    q.xz *= rot(-s*.5);
    if (z > -11.) r = U(r, house(q, .42 + .1*hash(fi+2.), 4. + fract(fi*.31)));
  }
  for (int i = 0; i < 10; i++){
    float fi = float(i), z = 7. - fi*1.9;
    float s = mod(fi, 2.) < 1. ? 1. : -1.;
    r = U(r, tree(p - vec3(roadX(z) + s*(3.0 + hash(fi+4.)*1.3), 0., z), .4 + .15*hash(fi), hash(fi+1.) > .55 ? 7.5 : 7.));
  }
  // 분수
  vec3 fq = p - vec3(roadX(3.6) - 1.9, 0., 3.6);
  r = U(r, vec2(sdCyl(fq - vec3(0., .12, 0.), .12, .55) - .03, 13.));
  r = U(r, vec2(max(sdCyl(fq - vec3(0., .2, 0.), .06, .47), -1.), 16.));
  r = U(r, vec2(sdCapsule(fq, vec3(0.), vec3(0., .55, 0.), .07), 13.));
  // 성
  vec3 cq = p - vec3(0., 0., -12.2);
  float wall = sdRoundBox(cq - vec3(0., .8, 0.), vec3(3.4, .8, .35), .05);
  float crenel = sdRoundBox(vec3(mod(cq.x + .25, .5) - .25, cq.y - 1.7, cq.z), vec3(.13, .12, .35), .02);
  wall = min(wall, max(crenel, abs(cq.x) - 3.4));
  wall = max(wall, -sdRoundBox(cq - vec3(roadX(-12.2), .45, 0.), vec3(.55, .65, .6), .4));
  vec3 tq = vec3(abs(cq.x) - 3.3, cq.y, cq.z);
  float tower = sdCyl(tq - vec3(0., 1.3, 0.), 1.3, .6);
  r = U(r, vec2(min(wall, tower), 15.));
  r = U(r, vec2(sdCone(tq - vec3(0., 3.45, 0.), .85, .75), 20.));
  // 말랑이(3번 칸) + 따라오는 친구
  float mz = nodeZ(2.);
  r = U(r, jelly(p - vec3(roadX(mz), .28, mz), .62, 8., 1., 0.));
  r = U(r, jelly(p - vec3(roadX(mz + .95) + .1, 0., mz + .95), .42, 9., 0., 1.));
  r = U(r, jelly(p - vec3(roadX(mz + 1.7) - .05, 0., mz + 1.7), .42, 10., 0., 0.));
  // 잠긴 칸 위 구름
  for (int i = 3; i < 6; i++){
    float fi = float(i), z = nodeZ(fi);
    vec3 q = p - vec3(roadX(z), 1.05, z);
    float c = smin(length(q - vec3(-.55, 0., 0.)) - .42, length(q - vec3(.1, .18, 0.)) - .52, .25);
    c = smin(c, length(q - vec3(.7, 0., .1)) - .38, .25);
    r = U(r, vec2(c, 21.));
  }
  return r;
}

// ---------- 장면 3·5: 게임 화면 (정면 화면) ----------
float bubbleColor(float row, float col){
  return mod(floor(col/2. + .5*mod(row, 2.)) + floor(row/2.), 5.);
}
vec2 mapPlay(vec3 p, float boss){
  vec2 r = vec2(1e5, 0.);
  float y0 = boss > .5 ? 16.4 : 20.1, rows = boss > .5 ? 4. : 6.;
  // 거품 판: 가까운 줄 3개만 확인
  float rr = clamp(floor((y0 - p.y)/.866 + .5), 1., rows - 2.);
  for (int k = -1; k <= 1; k++){
    float row = rr + float(k);
    if (row < 0. || row >= rows) continue;
    float odd = mod(row, 2.);
    float cmax = odd > .5 ? 8. : 9.;
    float col = clamp(floor(p.x + 4.5 - .5*odd + .5), 0., cmax);
    if (row == rows - 1. && (col < 2. || col > cmax - 2.)) continue;
    vec3 c = vec3(-4.5 + col + .5*odd, y0 - row*.866, 0.);
    bool friendCell = boss < .5 && row == 2. && col == 4.;
    if (friendCell){
      if (gGlass > .5) r = U(r, vec2(length(p - c) - .48, 50.));
      r = U(r, jelly(p - c + vec3(0., .3, 0.), .5, 8., 0., 0.));
    } else {
      r = U(r, candy(p, c, .47, 24. + bubbleColor(row, col)));
    }
  }
  // 날아가는 거품
  r = U(r, candy(p, boss > .5 ? vec3(1.6, 9.6, 0.) : vec3(-2.1, 11.2, 0.), .47, 25.));
  // 발판 + 대포 + 핸들 + 말랑이 + 줄 선 친구들
  r = U(r, vec2(sdRoundBox(p - vec3(0., .7, .6), vec3(5.8, 1.1, 1.3), .5), boss > .5 ? 15. : 22.));
  vec3 cb = p - vec3(.2, 2.05, .9);
  r = U(r, vec2(sdEllipsoid(cb, vec3(.95, .6, .8)), 13.));
  vec3 bq = cb - vec3(0., .4, 0.); bq.xy *= rot(.38);
  r = U(r, vec2(sdCapsule(bq, vec3(0.), vec3(0., 1.55, 0.), .42), 13.));
  r = U(r, vec2(sdTorus((bq - vec3(0., 1.6, 0.)), vec2(.44, .1)), 14.));
  r = U(r, candy(p, vec3(.2, 2.05, .9) + vec3(-sin(.38), cos(.38), 0.)*2.05, .4, 24.));
  vec3 wq = p - vec3(-1.75, 2.55, 1.45); wq = wq.xzy;
  float wheel = sdTorus(wq, vec2(.5, .08));
  wheel = min(wheel, sdCapsule(p - vec3(-1.75, 2.55, 1.45), vec3(-.45, -.2, 0.), vec3(.45, .2, 0.), .05));
  wheel = min(wheel, sdCapsule(p - vec3(-1.75, 2.55, 1.45), vec3(.2, -.45, 0.), vec3(-.2, .45, 0.), .05));
  wheel = min(wheel, sdCapsule(p, vec3(-1.75, 2.55, 1.45), vec3(-.6, 2.4, 1.2), .07));
  r = U(r, vec2(wheel, 14.));
  r = U(r, jelly(p - vec3(-3.2, 1.8, 1.25), 1.0, 8., 1., 0.));
  r = U(r, vec2(sdCapsule(p, vec3(-2.75, 2.45, 1.55), vec3(-2.2, 2.95, 1.5), .13), 8.));
  r = U(r, jelly(p - vec3(1.95, 1.8, 1.3), .62, 9., 0., 0.));
  r = U(r, jelly(p - vec3(2.8, 1.8, 1.2), .56, 10., 0., 1.));
  r = U(r, jelly(p - vec3(3.6, 1.8, 1.1), .5, 19., 0., 0.));
  r = U(r, jelly(p - vec3(4.35, 1.8, 1.0), .46, 20., 0., 1.));
  // 뒤 배경
  r = U(r, vec2((p.y - 1.8)*.9, 1.));
  if (boss < .5){
    for (int i = 0; i < 5; i++){
      float fi = float(i);
      r = U(r, house(p - vec3(-5.2 + fi*2.6, 1.8, -8. - hash(fi)*3.), 1.1 + .35*hash(fi+3.), 4. + fract(fi*.27)));
    }
    for (int i = 0; i < 6; i++){
      float fi = float(i);
      r = U(r, tree(p - vec3(-6. + fi*2.4 + hash(fi+2.), 1.8, -12.5 - hash(fi+6.)*2.), 1.3 + .5*hash(fi), hash(fi+1.) > .5 ? 7.5 : 7.));
    }
    vec3 fq = p - vec3(.3, 1.8, -5.5);
    r = U(r, vec2(sdCyl(fq - vec3(0., .3, 0.), .3, 1.4) - .05, 13.));
    r = U(r, vec2(sdCyl(fq - vec3(0., .55, 0.), .08, 1.2), 16.));
    r = U(r, vec2(sdCapsule(fq, vec3(0.), vec3(0., 1.5, 0.), .16), 13.));
    r = U(r, vec2(sdCyl(fq - vec3(0., 1.5, 0.), .08, .6), 13.));
  } else {
    // 노놈의 성 + 보스 뭉치
    vec3 cq = p - vec3(0., 1.8, -7.);
    float wall = sdRoundBox(cq - vec3(0., 3.2, 0.), vec3(6., 3.2, .5), .05);
    float crenel = sdRoundBox(vec3(mod(cq.x + .4, .8) - .4, cq.y - 6.6, cq.z), vec3(.22, .25, .5), .03);
    wall = min(wall, crenel);
    vec3 tq = vec3(abs(cq.x) - 4.2, cq.y, cq.z - .6);
    float tower = sdCyl(tq - vec3(0., 4.2, 0.), 4.2, 1.1);
    r = U(r, vec2(min(wall, tower), 15.));
    r = U(r, vec2(sdCone(tq - vec3(0., 9.9, 0.), 1.5, 1.4), 20.));
    r = U(r, vec2(sdRoundBox(vec3(abs(cq.x) - 4.2, cq.y - 6., cq.z - 1.65), vec3(.22, .35, .06), .15), 11.));
    vec3 bq2 = p - vec3(-1.4, 8.0, -7.9);
    vec3 q = bq2/2.6;
    float body = sdEllipsoid(q - vec3(0., .5, 0.), vec3(.68, .52, .55));
    vec3 hq = q - vec3(0., .85, 0.); hq.x = abs(hq.x) - .42; hq.xy *= rot(-.45);
    body = smin(body, sdCone(hq - vec3(0., .25, 0.), .25, .14), .05);
    r = U(r, vec2(body*2.6, 15.5));
    vec3 eq = q - vec3(0., .58, .5); eq.x = abs(eq.x) - .22; eq.xy *= rot(-.5);
    r = U(r, vec2(sdEllipsoid(eq, vec3(.12, .05, .06))*2.6, 23.));
    r = U(r, vec2(sdCapsule(q, vec3(-.14,.36,.53), vec3(.14,.36,.53), .035)*2.6, 23.));
  }
  return r;
}

vec2 map(vec3 p){
  if (uScene < 1.5) return mapHill(p, 0.);
  if (uScene < 2.5) return mapRoad(p);
  if (uScene < 3.5) return mapPlay(p, 0.);
  if (uScene < 4.5) return mapHill(p, 1.);
  return mapPlay(p, 1.);
}

vec3 normal(vec3 p){
  vec2 e = vec2(.0012, 0.);
  return normalize(vec3(map(p+e.xyy).x - map(p-e.xyy).x, map(p+e.yxy).x - map(p-e.yxy).x, map(p+e.yyx).x - map(p-e.yyx).x));
}
float march(vec3 ro, vec3 rd, out vec2 h){
  float t = 0.;
  for (int i = 0; i < 180; i++){
    h = map(ro + rd*t);
    if (h.x < .0006*t + .0004) return t;
    t += h.x*.8;
    if (t > 90.) break;
  }
  return -1.;
}
float softShadow(vec3 ro, vec3 rd){
  float g = gGlass; gGlass = 0.;
  float r = 1., t = .06;
  for (int i = 0; i < 40; i++){
    float h = map(ro + rd*t).x;
    r = min(r, 9.*h/t);
    t += clamp(h, .03, .5);
    if (r < .01 || t > 20.) break;
  }
  gGlass = g;
  return clamp(r, 0., 1.);
}
float ao(vec3 p, vec3 n){
  float g = gGlass; gGlass = 0.;
  float o = 0., s = 1.;
  for (int i = 1; i <= 5; i++){ float h = .07*float(i); o += (h - map(p + n*h).x)*s; s *= .7; }
  gGlass = g;
  return clamp(1. - 2.*o, 0., 1.);
}

bool night(){ return uScene > 4.5; }
bool ortho(){ return uScene > 2.5 && uScene < 3.5 || uScene > 4.5; }
vec3 sky(vec3 rd){
  float y = ortho() ? gUV.y + .35 : rd.y;
  if (night()){
    vec3 c = mix(vec3(.32, .16, .5), vec3(.09, .04, .2), clamp(y, 0., 1.));
    vec2 sp = floor(gUV*40.), sf = fract(gUV*40.) - .5;
    float st = step(.94, hash(sp.x*31. + sp.y*7.)) * smoothstep(.16, .04, length(sf)) * (.5 + .5*hash(sp.x + sp.y*13.));
    c += st*vec3(1.);
    c += vec3(1., .9, .7)*smoothstep(.06, .05, length(gUV - vec2(.17, .4)));
    return c;
  }
  vec3 top = vec3(.42, .7, 1.), hor = vec3(1., .86, .93);
  if (uScene > 3.5 && uScene < 4.5){ top = vec3(1., .7, .85); hor = vec3(1., .93, .7); }
  vec3 c = mix(hor, top, pow(clamp(y, 0., 1.), .6));
  if (uScene > 3.5 && uScene < 4.5){
    vec2 q = gUV - vec2(0., .18);
    float a = atan(q.y, q.x);
    c += vec3(1., .95, .7)*.18*smoothstep(.3, 1., sin(a*12.))*smoothstep(.9, .1, length(q));
  }
  if (!ortho()) c += vec3(1., .85, .6)*pow(max(dot(rd, normalize(SUN)), 0.), 64.)*.6;
  vec2 cu = ortho() ? gUV*vec2(3., 6.) : rd.xz/max(rd.y, .05)*.35;
  float cl = smoothstep(.55, .9, sin(cu.x*3.1 + 1.)*sin(cu.y*2.3 + sin(cu.x*1.7)) * .5 + .5);
  return mix(c, vec3(1.), cl*.65*smoothstep(0., .2, y));
}

vec3 roofCol(float h){
  return h < .25 ? vec3(1., .43, .68) : h < .5 ? vec3(.65, .42, 1.) : h < .75 ? vec3(1., .66, .25) : vec3(.25, .72, .95);
}
// 재질: col, spec, gloss, jelly(젤리처럼 빛이 퍼짐), emit
void material(float m, vec3 p, out vec3 col, out float spec, out float gloss, out float jel, out float emit){
  spec = .1; gloss = 16.; jel = 0.; emit = 0.;
  if (m < 1.5){
    col = mix(vec3(.5, .82, .42), vec3(.7, .92, .52), .5 + .5*sin(p.x*1.7)*sin(p.z*1.3));
    if (uScene > 1.5 && uScene < 2.5){
      float off = abs(p.x - roadX(p.z));
      vec2 st = vec2(p.x - roadX(p.z), p.z)*3.;
      vec2 f = fract(st) - .5;
      float stone = smoothstep(.5, .36, max(abs(f.x), abs(f.y)));
      vec3 road = mix(vec3(.78, .6, .42), vec3(.98, .88, .7), stone);
      col = mix(col, road, smoothstep(.72, .62, off));
    }
    if (night()) col = vec3(.3, .22, .45);
    vec2 fl = floor(p.xz*2.);
    float fh = hash(fl.x*7. + fl.y*31.);
    if (fh > .93 && length(fract(p.xz*2.) - .5) < .17 && !night()) col = fh > .965 ? vec3(1., .55, .75) : vec3(1., .9, .35);
  }
  else if (m < 3.5){ col = vec3(1., .95, .9); spec = .15; }
  else if (m < 5.){ col = roofCol(m - 4.); spec = .9; gloss = 60.; jel = .6; }
  else if (m < 6.5){ col = vec3(.6, .4, .27); }
  else if (m < 7.25){ col = vec3(.35, .76, .38); spec = .25; gloss = 24.; jel = .3; }
  else if (m < 7.75){ col = vec3(1., .62, .8); spec = .25; gloss = 24.; jel = .3; }
  else if (m < 8.5){ col = vec3(1., .42, .68); spec = 1.; gloss = 90.; jel = 1.; }
  else if (m < 9.5){ col = vec3(.25, .64, 1.); spec = 1.; gloss = 90.; jel = 1.; }
  else if (m < 10.5){ col = vec3(1., .8, .2); spec = 1.; gloss = 90.; jel = 1.; }
  else if (m < 11.5){ col = vec3(1., .9, .55); emit = 1.; }
  else if (m < 12.5){ col = vec3(.13, .06, .22); spec = .9; gloss = 120.; }
  else if (m < 13.5){ col = vec3(.97, .95, 1.); spec = .7; gloss = 50.; }
  else if (m < 14.5){ col = vec3(1., .74, .18); spec = 1.2; gloss = 70.; }
  else if (m < 15.25){ col = vec3(.36, .22, .55); spec = .3; gloss = 30.; }
  else if (m < 15.75){ col = vec3(.3, .14, .5); spec = 1.; gloss = 80.; jel = .8; }
  else if (m < 16.5){ col = vec3(.35, .72, .95); spec = 1.2; gloss = 120.; }
  else if (m < 17.5){ col = vec3(1., .5, .6); spec = .1; }
  else if (m < 18.5){ col = vec3(.68, .44, .3); spec = .1; }
  else if (m < 19.5){ col = vec3(.35, .85, .45); spec = 1.; gloss = 90.; jel = 1.; }
  else if (m < 20.5){ col = vec3(.62, .42, 1.); spec = 1.; gloss = 90.; jel = 1.; }
  else if (m < 21.5){ col = vec3(1.); spec = 0.; jel = .5; }
  else if (m < 22.5){ col = vec3(.85, .78, 1.); spec = .5; gloss = 40.; }
  else if (m < 23.5){ col = vec3(1., .3, .6); emit = 1.; }
  else if (m < 29.){
    float k = m - 24.;
    col = k < .5 ? vec3(1., .33, .5) : k < 1.5 ? vec3(1., .8, .2) : k < 2.5 ? vec3(.33, .82, .4) : k < 3.5 ? vec3(.25, .62, 1.) : vec3(.62, .4, 1.);
    if (m > 24.9 && m < 25.1 && uScene > 1.5 && uScene < 2.5) col = vec3(.82, .82, .9);
    spec = 1.1; gloss = 100.; jel = 1.;
  }
  else {
    float k = m - 30.;
    col = k < .5 ? vec3(1., .4, .6) : k < 1.5 ? vec3(1., .85, .3) : k < 2.5 ? vec3(.4, .85, 1.) : k < 3.5 ? vec3(.6, .45, 1.) : vec3(.45, .9, .5);
    spec = .6; gloss = 40.;
  }
}

vec3 shade(vec3 p, vec3 rd, vec2 h, float t){
  vec3 n = normal(p);
  vec3 col; float spec, gloss, jel, emit;
  material(h.y, p, col, spec, gloss, jel, emit);
  if (emit > .5) return col*1.3;
  vec3 sun = normalize(SUN);
  vec3 lightCol = night() ? vec3(.75, .7, 1.05) : vec3(1.25, 1.1, .95);
  float dif = clamp(dot(n, sun), 0., 1.);
  float sh = softShadow(p + n*.02, sun);
  float oc = ao(p, n);
  float wrap = clamp((dot(n, sun) + .5)/1.5, 0., 1.);
  vec3 hal = normalize(sun - rd);
  float sp = pow(clamp(dot(n, hal), 0., 1.), gloss)*spec;
  float fre = pow(1. - clamp(dot(n, -rd), 0., 1.), 3.);
  vec3 lin = mix(dif, wrap, jel*.7)*sh*lightCol;
  lin += clamp(.5 + .5*n.y, 0., 1.)*oc*(night() ? vec3(.35, .3, .6) : vec3(.45, .55, .75))*.65;
  lin += clamp(dot(n, normalize(vec3(-sun.x, 0., -sun.z))), 0., 1.)*oc*vec3(.35, .25, .3)*.4;
  vec3 c = col*lin;
  c += jel*col*.2*(1. - dif)*oc;
  c += sp*sh;
  c += fre*oc*(.12 + jel*.35)*sky(reflect(rd, n));
  if (uScene > 4.5 && h.y > 14.9 && h.y < 15.8) c += vec3(.4, .1, .3)*.25*fre;   // 보스 테두리 분홍빛
  return c;
}

vec3 render(vec3 ro, vec3 rd, float fogStart){
  vec2 h; float t = march(ro, rd, h);
  if (t < 0.) return sky(rd);
  vec3 p = ro + rd*t;
  vec3 c;
  if (h.y > 49.5){
    // 유리 거품: 겉면 반사 + 안쪽 모습
    vec3 n = normal(p);
    float fre = pow(1. - clamp(dot(n, -rd), 0., 1.), 2.5);
    vec3 refl = sky(reflect(rd, n));
    float sp = pow(clamp(dot(n, normalize(normalize(SUN) - rd)), 0., 1.), 140.);
    gGlass = 0.;
    vec2 h2; float t2 = march(p + rd*.02, rd, h2);
    vec3 inside = t2 < 0. ? sky(rd) : shade(p + rd*(.02 + t2), rd, h2, t + t2);
    gGlass = 1.;
    c = mix(inside*vec3(.95, .98, 1.08), refl, .1 + .65*fre) + sp*1.5 + vec3(.25, .2, .35)*fre;
  } else {
    c = shade(p, rd, h, t);
  }
  float ft = max(t - fogStart, 0.);
  float fogK = uScene > 1.5 && uScene < 2.5 ? .0006 : .0012;
  return mix(c, sky(rd), 1. - exp(-fogK*ft*ft));
}

void camera(vec2 uv, out vec3 ro, out vec3 rd, out float fs){
  fs = 0.;
  if (ortho()){
    vec3 fw = normalize(vec3(0., -.1, -1.)), rt = vec3(1., 0., 0.), up = cross(rt, fw);
    vec3 center = vec3(0., 11.2, 0.);
    ro = center - fw*30. + (uv.x*rt + uv.y*up)*23.;
    rd = fw; fs = 31.;
    return;
  }
  vec3 ta; float zoom;
  if (uScene < 1.5){ ro = vec3(0., 1.45, 6.8); ta = vec3(0., 1.0, 0.); zoom = .9; }
  else if (uScene < 2.5){ ro = vec3(0., 15.5, 7.6); ta = vec3(0., 0., -3.4); zoom = 1.12; }
  else { ro = vec3(0., 2.2, 7.4); ta = vec3(0., 2.05, 0.); zoom = 1.0; }
  vec3 fw = normalize(ta - ro), rt = normalize(cross(fw, vec3(0., 1., 0.))), up = cross(rt, fw);
  rd = normalize(uv.x*rt + uv.y*up + zoom*fw);
}

void main(){
  vec2 uv = (gl_FragCoord.xy - .5*uRes)/uRes.y;
  gUV = uv;
  vec3 ro, rd; float fs;
  camera(uv, ro, rd, fs);
  vec3 col = render(ro, rd, fs);
  col = pow(col, vec3(.4545));
  col = col*col*(3. - 2.*col)*.35 + col*.65;
  col = mix(vec3(dot(col, vec3(.299, .587, .114))), col, 1.25);
  col *= 1. - .22*dot(uv*.9, uv*.9);
  gl_FragColor = vec4(col, 1.);
}`;

// 화면 좌표 계산 (글자·버튼을 3D 물체 위에 맞춰 얹을 때 사용)
function project(scene, P, W, H) {
  const sub = (a, b) => a.map((v, i) => v - b[i]), dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const norm = a => { const l = Math.hypot(...a); return a.map(v => v / l); };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  let ux, uy;
  if (scene === 3 || scene === 5) {
    const fw = norm([0, -.1, -1]), rt = [1, 0, 0], up = cross(rt, fw), d = sub(P, [0, 11.2, 0]);
    ux = dot(d, rt) / 23; uy = dot(d, up) / 23;
  } else {
    const cams = { 1: [[0, 1.45, 6.8], [0, 1.0, 0], .9], 2: [[0, 15.5, 7.6], [0, 0, -3.4], 1.12], 4: [[0, 2.2, 7.4], [0, 2.05, 0], 1] };
    const [ro, ta, zoom] = cams[scene];
    const fw = norm(sub(ta, ro)), rt = norm(cross(fw, [0, 1, 0])), up = cross(rt, fw), d = sub(P, ro);
    const z = dot(d, fw);
    ux = zoom * dot(d, rt) / z; uy = zoom * dot(d, up) / z;
  }
  return [W / 2 + ux * H, H / 2 - uy * H];
}
const roadX = z => 2.1 * Math.sin(z * .36 + .5), nodeZ = i => 5.2 - i * 3.05;

function render(canvas, scene, quality = 1) {
  const gl = canvas.getContext('webgl', { antialias: false, preserveDrawingBuffer: true });
  if (!gl) return false;
  const d = Math.min(window.devicePixelRatio || 1, 2) * quality;
  canvas.width = Math.round(canvas.clientWidth * d); canvas.height = Math.round(canvas.clientHeight * d);
  gl.viewport(0, 0, canvas.width, canvas.height);
  const mk = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, mk(gl.VERTEX_SHADER, 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'));
  gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.uniform2f(gl.getUniformLocation(prog, 'uRes'), canvas.width, canvas.height);
  gl.uniform1f(gl.getUniformLocation(prog, 'uScene'), scene);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));   // 다 그릴 때까지 기다림
  return true;
}
return { render, project, roadX, nodeZ };
})();
