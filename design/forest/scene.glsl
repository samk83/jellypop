#version 300 es
// Jelly Pop — sunlit mushroom forest, raymarched (SDF). Rendered offline in headless Chromium.
// uMode: 0 = title plate, 1 = play plate, 2 = jelly sprite, 3 = bubble sprite
// uPass: 0 = color, 1 = depth (for depth-of-field post)
precision highp float;
uniform vec2 uRes;
uniform int uMode;
uniform int uPass;
uniform vec3 uCol;     // sprite color
uniform float uMood;   // sprite face: 0 happy, 1 joy (closed eyes), 2 worried
uniform float uEars;   // sprite: 1 = mascot ears
out vec4 o;

#define PI 3.14159265
const vec3 SUN = normalize(vec3(-0.12, 0.70, -0.70));   // toward sun (back light)
const vec3 KEY = normalize(vec3(0.55, 0.55, 0.65));     // warm front key
const vec3 SUNC = vec3(1.0, 0.86, 0.58);
const vec3 SKYC = vec3(0.62, 0.80, 0.62);

// ---------- noise ----------
float hash3(vec3 p){ p = fract(p*0.3183099 + 0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float noise(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash3(i+vec3(0,0,0)),hash3(i+vec3(1,0,0)),f.x), mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x), mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y), f.z); }
float fbm3(vec3 p){ return 0.5*noise(p)+0.25*noise(p*2.03)+0.125*noise(p*4.07); }
float fbm5(vec3 p){ float a=0.5,s=0.0; for(int i=0;i<5;i++){ s+=a*noise(p); p=p*2.03+1.7; a*=0.5; } return s; }
vec2 voro(vec3 p){ vec3 i=floor(p), f=fract(p); float d1=9.0, d2=9.0;
  for(int z=-1;z<=1;z++) for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){ vec3 g=vec3(x,y,z); vec3 r=g+vec3(hash3(i+g),hash3(i+g+7.1),hash3(i+g+13.3))-f; float d=dot(r,r); if(d<d1){d2=d1;d1=d;} else if(d<d2) d2=d; }
  return vec2(sqrt(d1), sqrt(d2)); }

float smin(float a,float b,float k){ float h=clamp(0.5+0.5*(b-a)/k,0.0,1.0); return mix(b,a,h)-k*h*(1.0-h); }
float smax(float a,float b,float k){ return -smin(-a,-b,k); }
float sdEll(vec3 p, vec3 r){ float k0=length(p/r), k1=length(p/(r*r)); return k0*(k0-1.0)/k1; }
float sdCap(vec3 p, vec3 a, vec3 b, float r){ vec3 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0); return length(pa-ba*h)-r; }
float sdRCone(vec3 p, float r1, float r2, float h){ vec2 q=vec2(length(p.xz),p.y); float b=(r1-r2)/h, a=sqrt(1.0-b*b), k=dot(q,vec2(-b,a));
  if(k<0.0) return length(q)-r1; if(k>a*h) return length(q-vec2(0,h))-r2; return dot(q,vec2(a,b))-r1; }

// ---------- scene description ----------
// jellies: xyz = foot position, w = radius
const int NJ = 4;
vec4 J[NJ]; vec3 JC[NJ]; float JE[NJ]; float JM[NJ];
// mushrooms: xyz = foot, w = cap radius ; MH = height ; MC = cap color
const int NM = 9;
vec4 M[NM]; float MH[NM]; vec3 MC[NM]; float MT[NM];
// flowers: xyz = foot, w = head radius ; FH = height ; FC = petal color
const int NF = 3;
vec4 F[NF]; float FH[NF]; vec3 FC[NF];
// trunks
const int NT = 6;
vec4 T[NT];
// foliage blobs
const int NL = 10;
vec4 L[NL];
vec3 camPos;
bool skipJelly = false;
float groundLift = 0.0;

void setup(){
  for(int i=0;i<NJ;i++){ J[i]=vec4(0,0,0,-1); JE[i]=0.0; JM[i]=0.0; JC[i]=vec3(1); }
  for(int i=0;i<NM;i++){ M[i]=vec4(0,0,0,-1); MH[i]=1.0; MT[i]=0.0; MC[i]=vec3(1); }
  for(int i=0;i<NF;i++){ F[i]=vec4(0,0,0,-1); FH[i]=1.0; FC[i]=vec3(1); }
  for(int i=0;i<NT;i++) T[i]=vec4(0,0,0,-1);
  for(int i=0;i<NL;i++) L[i]=vec4(0,0,0,-1);
  if(uMode==0){
    camPos = vec3(0.0, 0.95, 6.6);
    J[0]=vec4(0.0,0.0,0.25,0.70); JC[0]=vec3(1.0,0.42,0.64); JE[0]=1.0; JM[0]=0.0;   // 말랑이 (pink, ears)
    J[1]=vec4(-0.80,0.0,-1.05,0.36); JC[1]=vec3(0.25,0.62,1.0); JM[1]=1.0;             // 퐁당 (blue)
    J[2]=vec4(0.84,0.0,-0.95,0.34); JC[2]=vec3(1.0,0.80,0.18); JM[2]=0.0;             // 찰랑 (yellow)
    J[3]=vec4(0.42,0.0,-1.75,0.27); JC[3]=vec3(0.30,0.85,0.70); JM[3]=1.0;            // 살랑 (mint)
    M[0]=vec4(-2.05,0.0,-1.3,1.15); MH[0]=2.55; MC[0]=vec3(0.62,0.38,0.92); MT[0]=0.2;
    M[1]=vec4( 2.15,0.0,-1.6,1.30); MH[1]=2.95; MC[1]=vec3(0.95,0.30,0.18); MT[1]=1.3;
    M[2]=vec4(-1.35,0.0,-0.1,0.42); MH[2]=0.80; MC[2]=vec3(1.0,0.52,0.15); MT[2]=2.1;
    M[3]=vec4( 1.55,0.0, 0.55,0.30); MH[3]=0.50; MC[3]=vec3(1.0,0.40,0.25); MT[3]=3.7;
    M[4]=vec4(-0.55,0.0,-3.6,0.55); MH[4]=1.15; MC[4]=vec3(1.0,0.55,0.20); MT[4]=4.4;
    M[5]=vec4( 0.95,0.0,-4.2,0.45); MH[5]=0.85; MC[5]=vec3(0.95,0.35,0.30); MT[5]=5.9;
    M[6]=vec4(-1.65,0.0,1.55,0.22); MH[6]=0.34; MC[6]=vec3(1.0,0.45,0.30); MT[6]=6.3;
    M[7]=vec4( 0.70,0.0,1.75,0.16); MH[7]=0.24; MC[7]=vec3(0.98,0.60,0.20); MT[7]=7.7;
    M[8]=vec4(-2.6,0.0,-5.5,0.9);  MH[8]=2.0;  MC[8]=vec3(0.70,0.42,0.90); MT[8]=8.2;
    F[0]=vec4(-1.10,0.0,1.6,0.27); FH[0]=0.80; FC[0]=vec3(1.0,0.52,0.70);
    F[1]=vec4( 1.12,0.0,1.5,0.28); FH[1]=0.92; FC[1]=vec3(1.0,0.80,0.20);
    F[2]=vec4(-0.38,0.0,-2.6,0.17); FH[2]=0.45; FC[2]=vec3(0.75,0.55,1.0);
    T[0]=vec4(-3.3,0.0,-6.5,0.75); T[1]=vec4(3.0,0.0,-7.5,0.95); T[2]=vec4(-0.9,0.0,-11.0,0.85);
    T[3]=vec4(1.6,0.0,-13.5,1.1); T[4]=vec4(-4.6,0.0,-12.0,1.2); T[5]=vec4(4.6,0.0,-12.5,1.0);
    L[0]=vec4(-3.6,8.6,-7.0,3.2); L[1]=vec4(3.4,9.2,-8.0,3.4); L[2]=vec4(-0.5,11.5,-12.0,3.6);
    L[3]=vec4(5.5,7.5,-12.0,3.0); L[4]=vec4(-5.8,7.2,-11.0,3.0); L[5]=vec4(1.8,12.0,-15.0,3.5); L[6]=vec4(-2.5,6.4,-3.0,1.4);
    L[7]=vec4(-1.7,0.1,-4.6,0.85); L[8]=vec4(2.0,0.1,-5.4,1.0); L[9]=vec4(0.3,0.0,-8.0,1.2);
  } else if(uMode==1){
    camPos = vec3(0.0, 1.35, 7.4);
    M[0]=vec4(-2.25,0.0,-0.4,0.95); MH[0]=1.75; MC[0]=vec3(0.62,0.38,0.92); MT[0]=0.2;
    M[1]=vec4( 2.35,0.0,-0.8,1.05); MH[1]=2.05; MC[1]=vec3(0.95,0.30,0.18); MT[1]=1.3;
    M[2]=vec4(-1.65,0.0,1.55,0.30); MH[2]=0.50; MC[2]=vec3(1.0,0.52,0.15); MT[2]=2.1;
    M[3]=vec4( 1.75,0.0,1.75,0.26); MH[3]=0.40; MC[3]=vec3(1.0,0.40,0.25); MT[3]=3.7;
    M[4]=vec4(-0.9,0.0,-4.5,0.6);  MH[4]=1.3;  MC[4]=vec3(1.0,0.55,0.20); MT[4]=4.4;
    M[5]=vec4( 1.2,0.0,-5.0,0.5);  MH[5]=1.0;  MC[5]=vec3(0.95,0.35,0.30); MT[5]=5.9;
    M[8]=vec4(-2.9,0.0,-7.0,1.0);  MH[8]=2.4;  MC[8]=vec3(0.70,0.42,0.90); MT[8]=8.2;
    F[0]=vec4(-2.2,0.0,2.3,0.24); FH[0]=0.65; FC[0]=vec3(1.0,0.52,0.70);
    F[1]=vec4( 2.25,0.0,2.4,0.24); FH[1]=0.70; FC[1]=vec3(1.0,0.80,0.20);
    T[0]=vec4(-3.6,0.0,-7.5,0.85); T[1]=vec4(3.3,0.0,-8.5,1.0); T[2]=vec4(-0.6,0.0,-13.0,0.9);
    T[3]=vec4(1.9,0.0,-15.5,1.2); T[4]=vec4(-5.0,0.0,-14.0,1.3); T[5]=vec4(5.2,0.0,-14.5,1.1);
    L[0]=vec4(-3.8,9.0,-8.0,3.4); L[1]=vec4(3.6,9.6,-9.0,3.6); L[2]=vec4(-0.4,12.5,-14.0,3.8);
    L[3]=vec4(6.0,8.0,-14.0,3.2); L[4]=vec4(-6.2,7.8,-13.0,3.2); L[5]=vec4(2.0,13.0,-17.0,3.7); L[6]=vec4(0.0,15.0,-9.0,3.0);
  } else {
    camPos = vec3(0.0, 0.0, 20.0);
  }
}

// face frame of a jelly: forward points at camera (flattened)
vec3 jFwd(vec3 c){ vec3 f = camPos - c; f.y = 0.0; return normalize(f); }

float jellyBody(vec3 p, float r, float ears){
  // gumdrop: dome + wide soft base, flat bottom
  float d = sdEll(p - vec3(0, 0.92*r, 0), vec3(0.90*r, 0.95*r, 0.86*r));
  d = smin(d, sdEll(p - vec3(0, 0.30*r, 0), vec3(1.04*r, 0.34*r, 0.98*r)), 0.25*r);
  if(ears > 0.5){
    vec3 q = p; q.x = abs(q.x);
    q -= vec3(0.48*r, 1.70*r, 0.0);
    float a = -0.45; q.xy = mat2(cos(a),-sin(a),sin(a),cos(a))*q.xy;
    d = smin(d, sdEll(q, vec3(0.20*r, 0.30*r, 0.17*r)), 0.12*r);
  }
  d = smax(d, -p.y, 0.06*r);
  return d;
}
float eyeR(float r){ return 0.25*r; }
vec3 eyePos(vec3 c, float r, float side){
  vec3 f = jFwd(c), rt = normalize(cross(vec3(0,1,0), f));
  return c + rt*side*0.34*r + vec3(0, 1.06*r, 0) + f*0.66*r;
}

float trunk(vec3 p, vec4 t){
  vec3 q = p - t.xyz;
  float flare = 1.0 + 0.9*exp(-max(q.y,0.0)*2.2);
  float ang = atan(q.z, q.x);
  float bark = 0.05*t.w*(sin(ang*9.0 + q.y*0.7) * 0.5 + 0.5) + 0.04*t.w*noise(vec3(ang*3.0, q.y*2.0, 0.0));
  float roots = 0.25*t.w*max(0.0, sin(ang*5.0+t.x))*exp(-max(q.y,0.0)*3.0);
  return length(q.xz) - t.w*flare - roots + bark;
}

float mushStem(vec3 q, float r, float h){ // q relative to foot
  q.x += 0.06*h*sin(q.y/h*2.5);
  return sdRCone(q, 0.42*r, 0.30*r, h - 0.1*r) - 0.02*r;
}
float mushCap(vec3 q, float r, float h){
  vec3 c = q - vec3(0, h, 0);
  float d = sdEll(c, vec3(r, 0.62*r, r));
  d = smax(d, -(c.y + 0.12*r) , 0.10*r);
  return d;
}

float flowerHead(vec3 p, vec4 f, float h, out float part){
  vec3 c = f.xyz + vec3(0, h, 0);
  vec3 fw = normalize(camPos - c); fw = normalize(fw + vec3(0,0.25,0));
  vec3 rt = normalize(cross(vec3(0,1,0), fw)), up = cross(fw, rt);
  vec3 q = p - c; vec3 l = vec3(dot(q,rt), dot(q,up), dot(q,fw));
  float r = f.w;
  float center = sdEll(l - vec3(0,0,0.06*r), vec3(0.62*r, 0.62*r, 0.36*r));
  float a = atan(l.y, l.x); float n = 9.0;
  float sector = floor(a/(2.0*PI)*n + 0.5); float aa = sector*2.0*PI/n;
  vec2 pr = mat2(cos(aa),-sin(aa),sin(aa),cos(aa))*l.xy;
  float petal = sdEll(vec3(pr.x - 0.98*r, pr.y, l.z + 0.02*r + 0.06*r*pr.x/r), vec3(0.60*r, 0.36*r, 0.10*r));
  part = center < petal ? 1.0 : 0.0;
  return min(center, petal - 0.01*r);
}

float groundH(vec3 p){
  float h = 0.10*fbm3(vec3(p.xz*0.9, 0.0)) - 0.05;
  // little raised moss mound under the hero
  h += 0.06*exp(-dot(p.xz - vec2(0.0,0.2), p.xz - vec2(0.0,0.2))*0.6);
  return h + groundLift;
}

// returns (distance, material id)
// ids: 1 ground, 10+i jelly, 20+i*2+side eye, 30+i stem, 40+i cap, 50+i flower center, 55+i petal, 60+i flower stem, 70 trunk, 80 foliage, 90 stone
vec2 map(vec3 p){
  vec2 res = vec2(1e5, 0.0);
  if(uMode >= 2){
    float r = 3.0;
    if(uMode==2){
      float d = jellyBody(p - vec3(0,-r*0.9,0), r, uEars);
      res = vec2(d, 10.0);
      if(uMood < 0.5 || uMood > 1.5){
        for(int s=0;s<2;s++){ vec3 e = eyePos(vec3(0,-r*0.9,0), r, s==0?-1.0:1.0); float de = length(p-e)-eyeR(r); if(de<res.x) res=vec2(de, 20.0+float(s)); }
      }
    } else if(uMode==3){
      res = vec2(length(p) - r, 15.0);
    } else if(uMode==4){ // cannon barrel, pivot at origin-ish, pointing up
      vec3 q = p - vec3(0,-2.9,0);
      float d = sdRCone(q, 1.05, 1.30, 5.2);
      d = smax(d, -(length(q.xz) - 0.88), 0.08);           // hollow
      d = smax(d, -(5.0 - q.y) , 0.05);                     // open mouth
      d = max(d, q.y - 5.25);
      res = vec2(d, 95.0);
      vec3 t1 = q - vec3(0,5.05,0); float lip = length(vec2(length(t1.xz)-1.22, t1.y)) - 0.30; if(lip<res.x) res=vec2(lip, 96.0);
      vec3 t2 = q - vec3(0,1.6,0); float band = length(vec2(length(t2.xz)-1.12, t2.y)) - 0.20; if(band<res.x) res=vec2(band, 96.0);
      vec3 t3 = q - vec3(0,3.3,0); float band2 = length(vec2(length(t3.xz)-1.20, t3.y)) - 0.14; if(band2<res.x) res=vec2(band2, 97.0);
    } else { // cannon base: hub + two wheels facing camera
      float hub = sdEll(p - vec3(0,-0.6,0.0), vec3(1.7,1.45,1.4)); res = vec2(hub, 97.0);
      float plinth = sdEll(p - vec3(0,-2.2,0), vec3(2.6,0.55,1.5)); if(plinth<res.x) res=vec2(smin(plinth,res.x,0.2), 97.0);
      for(int s=0;s<2;s++){ float sx = s==0?-2.0:2.0; vec3 q = p - vec3(sx,-1.5,0.9);
        float tire = length(vec2(length(q.xy)-1.05, q.z)) - 0.32; if(tire<res.x) res=vec2(tire, 96.0);
        float disc = max(length(q.xy)-1.0, abs(q.z)-0.12); if(disc<res.x) res=vec2(disc, 98.0);
        float ang = atan(q.y,q.x); float spoke = max(max(abs(sin(ang*3.0))*length(q.xy) - 0.12, length(q.xy)-1.0), abs(q.z-0.12)-0.08); if(spoke<res.x) res=vec2(spoke, 96.0);
        float cap = length(q - vec3(0,0,0.2)) - 0.3; if(cap<res.x) res=vec2(cap, 96.0); }
    }
    return res;
  }
  // ground
  float g = p.y - groundH(p);
  res = vec2(g*0.8, 1.0);
  // jellies
  if(!skipJelly){
    for(int i=0;i<NJ;i++){ if(J[i].w<0.0) continue; vec3 q = p - J[i].xyz; float r=J[i].w;
      float b = length(q - vec3(0,0.8*r,0)) - 1.9*r;
      if(b > 0.15*r){ if(b < res.x) res = vec2(b, 0.0); continue; }
      float d = jellyBody(q, r, JE[i]); if(d<res.x) res=vec2(d, 10.0+float(i));
    }
  }
  for(int i=0;i<NJ;i++){ if(J[i].w<0.0) continue; float r=J[i].w; if(JM[i] > 0.5) continue;
    for(int s=0;s<2;s++){ vec3 e = eyePos(J[i].xyz, r, s==0?-1.0:1.0); float de = length(p-e)-eyeR(r); if(de<res.x) res=vec2(de, 20.0+float(i*2+s)); } }
  // mushrooms
  for(int i=0;i<NM;i++){ if(M[i].w<0.0) continue; vec3 q = p - M[i].xyz; float r=M[i].w, h=MH[i];
    float bound = length(q - vec3(0,h*0.6,0)) - max(h, r*1.3);
    if(bound > 0.3){ if(bound<res.x) res=vec2(bound, 0.0); continue; }
    float ds = mushStem(q, r, h); if(ds<res.x) res=vec2(ds, 30.0+float(i));
    float dc = mushCap(q, r, h); if(dc<res.x) res=vec2(dc, 40.0+float(i)); }
  // flowers
  for(int i=0;i<NF;i++){ if(F[i].w<0.0) continue; vec3 q=p-F[i].xyz; float h=FH[i], r=F[i].w;
    float bound = length(q - vec3(0,h*0.6,0)) - (h*0.6 + r*1.8);
    if(bound > 0.3){ if(bound<res.x) res=vec2(bound,0.0); continue; }
    float st = sdCap(q, vec3(0), vec3(0.04*sin(q.y*3.0),h,0), 0.045*r/0.3); if(st<res.x) res=vec2(st, 60.0+float(i));
    vec3 lq = q - vec3(0.18*r/0.3*(i==0?1.0:-1.0), h*0.35, 0.0);
    float leaf = sdEll(lq, vec3(0.22,0.06,0.10)*r/0.3); if(leaf<res.x) res=vec2(leaf, 60.0+float(i));
    float part; float dh = flowerHead(p, F[i], h, part); if(dh<res.x) res=vec2(dh, part>0.5 ? 50.0+float(i) : 55.0+float(i)); }
  // trunks
  for(int i=0;i<NT;i++){ if(T[i].w<0.0) continue; float d = trunk(p, T[i]); if(d<res.x) res=vec2(d*0.7, 70.0); }
  // foliage
  for(int i=0;i<NL;i++){ if(L[i].w<0.0) continue; vec3 q=p-L[i].xyz; float b=length(q)-L[i].w;
    if(b > 1.5){ if(b-1.0<res.x) res=vec2(b-1.0, 0.0); continue; }
    vec2 lv = voro(p*1.1); float d = b - 1.0*(fbm3(p*0.9)-0.45) - 0.45*(lv.y-lv.x) - 0.2*noise(p*4.0); if(d*0.6<res.x) res=vec2(d*0.6, 80.0); }
  // stones
  if(uMode==0){
    float s1 = sdEll(p-vec3(-0.55,0.0,1.6), vec3(0.22,0.12,0.18)); if(s1<res.x) res=vec2(s1,90.0);
    float s2 = sdEll(p-vec3(1.95,0.0,0.9), vec3(0.28,0.15,0.22)); if(s2<res.x) res=vec2(s2,90.0);
    float s3 = sdEll(p-vec3(-2.3,0.0,0.6), vec3(0.32,0.16,0.26)); if(s3<res.x) res=vec2(s3,90.0);
  }
  return res;
}

vec3 calcN(vec3 p, float e){ vec2 k=vec2(1,-1); return normalize(k.xyy*map(p+k.xyy*e).x + k.yyx*map(p+k.yyx*e).x + k.yxy*map(p+k.yxy*e).x + k.xxx*map(p+k.xxx*e).x); }

vec2 trace(vec3 ro, vec3 rd, float tmax){
  float t = 0.02; vec2 h = vec2(0);
  for(int i=0;i<220;i++){ vec3 p = ro + rd*t; h = map(p);
    if(abs(h.x) < 0.0006*t && h.y > 0.5) return vec2(t, h.y);
    t += h.x > 0.0 ? max(h.x*0.85, 0.0004*t) : h.x; if(t>tmax) break; }
  return vec2(-1.0, 0.0);
}

float softShadow(vec3 ro, vec3 rd, float k){
  float res = 1.0, t = 0.03;
  for(int i=0;i<48;i++){ vec2 h = map(ro + rd*t); if(h.y >= 80.0 && h.y < 81.0) { t += max(h.x,0.05); continue; } // canopy holes handled in light pattern
    res = min(res, k*h.x/t); t += clamp(h.x, 0.03, 0.6); if(res<0.002 || t>12.0) break; }
  return clamp(res, 0.0, 1.0);
}
float ao(vec3 p, vec3 n){ float s=0.0, w=1.0; for(int i=1;i<=5;i++){ float h=0.04*float(i*i); s += w*(h - map(p+n*h).x); w*=0.7; } return clamp(1.0-1.6*s, 0.0, 1.0); }

// dappled sunlight through the canopy
float dapple(vec3 p){ vec2 q = p.xz - SUN.xz/SUN.y*p.y; float n = fbm3(vec3(q*0.55, 2.0)); return smoothstep(0.42, 0.62, n); }

vec3 skyCol(vec3 rd){
  float s = max(dot(rd, SUN), 0.0);
  vec3 c = mix(vec3(0.55,0.72,0.50), vec3(1.0,0.95,0.78), smoothstep(-0.1, 0.6, rd.y));
  c += SUNC*pow(s, 6.0)*0.9 + vec3(1.0,0.97,0.85)*pow(s, 60.0)*1.5;
  return c;
}
vec3 fogCol(vec3 rd){ float s = max(dot(rd, SUN),0.0); return mix(vec3(0.30,0.46,0.26), vec3(1.0,0.88,0.58), 0.15 + 0.85*pow(s,2.0)); }

// ---------- materials ----------
vec3 shadeOpaque(vec3 p, vec3 n, vec3 rd, float id, float t){
  vec3 alb = vec3(0.5); float spec = 0.0, rough = 32.0, sss = 0.0, emi = 0.0;
  vec3 extra = vec3(0);
  if(id < 1.5){ // ground moss
    float f = fbm5(vec3(p.xz*3.0,0.0)); float fine = noise(vec3(p.xz*40.0,1.0));
    alb = mix(vec3(0.16,0.32,0.07), vec3(0.42,0.62,0.12), f);
    alb *= 0.75 + 0.5*fine;
    float clearing = exp(-dot(p.xz-vec2(0.0,0.3), p.xz-vec2(0.0,0.3))*0.18);
    alb = mix(alb, alb*vec3(1.15,1.1,0.8), clearing);
    // fallen petals and tiny flowers
    vec2 v = voro(vec3(p.xz*7.0, 0.0)).xy; float h = hash3(floor(vec3(p.xz*7.0,0.0)));
    if(v.x < 0.10 && h > 0.86) alb = mix(alb, h>0.94 ? vec3(1.0,0.65,0.78) : vec3(1.0,0.95,0.7), smoothstep(0.10,0.05,v.x));
    sss = 0.25; rough = 8.0; spec = 0.05;
  } else if(id < 15.0){
    alb = vec3(1.0);
  } else if(id >= 20.0 && id < 30.0){
    alb = vec3(1.0); spec = 1.2; rough = 120.0;
  } else if(id >= 30.0 && id < 40.0){ // stem
    int i = int(id-30.0); vec3 q = p - M[i].xyz;
    alb = mix(vec3(0.95,0.88,0.76), vec3(1.0,0.97,0.90), smoothstep(0.0, MH[i], q.y));
    alb *= 0.9 + 0.1*noise(p*vec3(30,4,30));
    alb = mix(vec3(0.35,0.5,0.15), alb, smoothstep(0.0, 0.25*MH[i], q.y + 0.1*noise(p*8.0)));
    sss = 0.35; spec = 0.15; rough = 16.0;
  } else if(id >= 40.0 && id < 50.0){ // cap
    int i = int(id-40.0); vec3 q = p - M[i].xyz - vec3(0, MH[i], 0); float r = M[i].w;
    vec3 base = MC[i];
    alb = mix(base*0.75, mix(base, vec3(1.0,0.9,0.7), 0.25), smoothstep(-0.1*r, 0.6*r, q.y));
    vec3 dir = normalize(q/vec3(r,0.62*r,r));
    vec2 v = voro(dir*3.4 + MT[i]);
    float spot = smoothstep(0.30, 0.24, v.x);
    alb = mix(alb, vec3(1.0,0.97,0.93), spot*step(-0.02, dir.y));
    if(n.y < -0.25){ // gills
      float rr = length(q.xz)/r; float gl = 0.5+0.5*sin(atan(q.z,q.x)*60.0);
      alb = mix(vec3(0.98,0.86,0.70), vec3(0.85,0.65,0.50), gl*0.5) * (0.7+0.3*rr);
    }
    spec = 0.55; rough = 40.0; sss = 0.45;
  } else if(id >= 50.0 && id < 55.0){ // flower face
    int i = int(id-50.0); vec3 c = F[i].xyz + vec3(0,FH[i],0); float r = F[i].w;
    vec3 fw = normalize(camPos - c); fw = normalize(fw + vec3(0,0.25,0));
    vec3 rt = normalize(cross(vec3(0,1,0), fw)), up = cross(fw, rt);
    vec2 l = vec2(dot(p-c,rt), dot(p-c,up))/r;
    alb = mix(vec3(1.0,0.78,0.22), vec3(0.98,0.60,0.12), smoothstep(0.0,0.6,length(l)));
    // eyes
    for(int s=0;s<2;s++){ vec2 e = vec2(s==0?-0.22:0.22, 0.10); float de = length((l-e)*vec2(1.0,0.8));
      if(de < 0.13) alb = vec3(0.10,0.07,0.08);
      if(length(l - e - vec2(-0.04,0.05)) < 0.045) alb = vec3(1.0);
    }
    // smile
    float sm = abs(length(l - vec2(0.0, 0.02)) - 0.24); if(sm < 0.035 && l.y < -0.08) alb = vec3(0.55,0.10,0.12);
    float ch = min(length(l-vec2(-0.40,-0.10)), length(l-vec2(0.40,-0.10))); alb = mix(alb, vec3(1.0,0.45,0.45), 0.6*smoothstep(0.12,0.0,ch));
    spec = 0.4; rough = 30.0; sss = 0.3;
  } else if(id >= 55.0 && id < 60.0){ // petals
    int i = int(id-55.0); alb = FC[i]; vec3 c = F[i].xyz + vec3(0,FH[i],0);
    alb = mix(alb, vec3(1.0), 0.25*smoothstep(0.4*F[i].w, 1.4*F[i].w, length(p-c)));
    sss = 0.8; spec = 0.25; rough = 20.0;
  } else if(id >= 60.0 && id < 70.0){ alb = vec3(0.25,0.55,0.15); sss = 0.6; }
  else if(id < 75.0){ // trunk
    float b = fbm5(vec3(atan(p.z,p.x)*4.0, p.y*1.5, 0.0));
    alb = mix(vec3(0.20,0.14,0.10), vec3(0.40,0.31,0.22), b);
    float moss = smoothstep(0.55, 0.75, fbm3(p*1.3) + 0.3*n.y - 0.15*p.y);
    alb = mix(alb, vec3(0.30,0.48,0.12), moss);
    rough = 6.0; spec = 0.03;
  } else if(id < 85.0){ // foliage
    alb = mix(vec3(0.08,0.22,0.05), vec3(0.30,0.55,0.10), fbm3(p*2.0));
    sss = 2.2; rough = 6.0;
  } else if(id < 94.0){ alb = mix(vec3(0.45,0.45,0.40), vec3(0.32,0.50,0.15), smoothstep(0.0,0.6,n.y)*0.8); spec=0.1; }
  else if(id < 95.5){ alb = mix(uCol, vec3(1.0), 0.15*smoothstep(-2.0,2.0,p.y)); if(sin(atan(p.z,p.x)*2.0 + p.y*1.6) > 0.55) alb = mix(alb, vec3(1.0,0.97,0.95), 0.85); if(length(p.xz) < 0.9 && p.y > 1.9) alb = uCol*0.35; spec = 1.0; rough = 70.0; sss = 0.2; }
  else if(id < 96.5){ alb = vec3(1.0,0.78,0.30); spec = 1.4; rough = 90.0; }
  else if(id < 97.5){ alb = vec3(0.62,0.40,0.95); spec = 1.0; rough = 70.0; sss = 0.2; }
  else { alb = vec3(1.0,0.93,0.80); spec = 0.6; rough = 50.0; }

  alb = pow(alb, vec3(2.2));
  float sh = softShadow(p + n*0.02, SUN, 10.0) * (id >= 80.0 && id < 85.0 ? 1.0 : mix(0.35, 1.0, dapple(p)));
  float ksh = softShadow(p + n*0.02, KEY, 8.0);
  float occ = ao(p, n);
  float dS = max(dot(n, SUN), 0.0), dK = max(dot(n, KEY), 0.0);
  vec3 col = alb * (SUNC*1.5*dS*sh + vec3(1.0,0.93,0.82)*0.85*dK*ksh + SKYC*0.55*(0.5+0.5*n.y)*occ + vec3(0.30,0.36,0.18)*0.35*(0.5-0.5*n.y)*occ);
  // translucency (backlit leaves/petals/caps)
  col += alb * sss * SUNC * pow(max(dot(rd, SUN), 0.0), 2.0) * 0.9 * (0.4+0.6*sh);
  col += alb * sss * 0.12;
  vec3 hk = normalize(KEY - rd); col += spec * pow(max(dot(n,hk),0.0), rough) * ksh * vec3(1.0,0.97,0.9);
  vec3 hs = normalize(SUN - rd); col += spec * 0.8 * pow(max(dot(n,hs),0.0), rough) * sh * SUNC;
  // rim
  col += alb * 0.35 * pow(1.0 - max(dot(n,-rd),0.0), 3.0) * SUNC * sh;
  return col;
}

vec3 eyeShade(vec3 p, vec3 n, vec3 rd, vec3 ec, vec3 fw){
  vec3 d = normalize(p - ec);
  vec3 look = normalize(fw + vec3(0.0, 0.10, 0.0) + normalize(camPos-ec)*0.4);
  float c = dot(d, look);
  vec3 col = vec3(0.98, 0.98, 1.0);
  if(c > 0.40){ // iris
    float t = smoothstep(0.40, 0.98, c);
    col = mix(vec3(0.04,0.10,0.30), vec3(0.20,0.50,0.95), smoothstep(0.42,0.70,c)*(1.0-smoothstep(0.74,0.82,c)));
    col = mix(col, vec3(0.01,0.01,0.03), smoothstep(0.80, 0.82, c));
    col = mix(vec3(0.03,0.05,0.15), col, smoothstep(0.40, 0.44, c));
    col *= 0.85 + 0.25*t;
  }
  col = pow(col, vec3(2.2));
  col *= 0.35 + 0.65*max(dot(n, KEY), 0.0) + 0.25*max(n.y,0.0);
  vec3 hk = normalize(KEY - rd); col += 1.4*pow(max(dot(n,hk),0.0), 140.0);
  vec3 hs = normalize(SUN - rd); col += 0.6*pow(max(dot(n,hs),0.0), 60.0);
  // painted catch-lights
  vec3 cl1 = normalize(look + vec3(-0.30, 0.38, 0.0)); col = mix(col, vec3(1.0), smoothstep(0.975, 0.985, dot(d, cl1)));
  vec3 cl2 = normalize(look + vec3(0.22, -0.20, 0.0)); col = mix(col, vec3(1.0), 0.85*smoothstep(0.992, 0.996, dot(d, cl2)));
  col += vec3(1.0)*0.25*pow(1.0-max(dot(n,-rd),0.0), 4.0);
  return col;
}

// jelly: refraction + absorption + inner glow + fresnel reflection
vec3 shadeJelly(vec3 p, vec3 n, vec3 rd, vec3 jc, vec3 c, float r, bool sprite){
  jc = pow(jc, vec3(2.2));
  float ndv = max(dot(n,-rd), 0.0);
  float fres = 0.04 + 0.96*pow(1.0 - ndv, 4.0);
  vec3 rr = refract(rd, n, 1.0/1.33);
  // march inside
  float th = 0.03*r; vec3 q = p - n*0.03*r;
  for(int i=0;i<40;i++){ float d = -map(q).x; if(d < 0.002) break; q += rr*max(d,0.01); th += max(d,0.01); }
  vec3 nOut = calcN(q, 0.002);
  vec3 ro2 = refract(rr, -nOut, 1.33); if(dot(ro2,ro2) < 0.01) ro2 = reflect(rr, -nOut);
  vec3 behind;
  if(sprite){ behind = mix(vec3(1.0), jc, 0.7); }
  else {
    skipJelly = true; vec2 h = trace(q + ro2*0.01, ro2, 40.0);
    if(h.x > 0.0){ vec3 bp = q + ro2*(0.01+h.x); vec3 bn = calcN(bp, 0.001*h.x); behind = shadeOpaque(bp, bn, ro2, h.y, h.x); behind = mix(behind, fogCol(ro2), 1.0-exp(-h.x*0.05)); }
    else behind = skyCol(ro2);
    skipJelly = false;
  }
  float tn = th / (2.0*r);
  vec3 absorb = exp(-(1.0 - jc) * tn * 3.2);
  vec3 trans = behind * absorb * mix(vec3(1.0), jc, 0.55);
  // inner glow (subsurface): brighter toward the core and where light passes through
  float core = pow(ndv, 1.6) * smoothstep(0.1, 0.8, th/(1.7*r));
  // lower-middle inner light (like a lamp inside the jelly)
  float lamp = exp(-pow(length((p - c - vec3(0, 0.62*r, 0)) / r * vec3(1.0, 1.3, 1.0)), 2.0) * 1.6);
  vec3 deep = jc*jc*0.55;
  vec3 glowC = mix(jc, vec3(1.0), 0.18) * 1.15;
  vec3 glow = mix(deep, glowC, smoothstep(0.0, 0.85, core));
  glow += mix(jc, vec3(1.0), 0.5) * lamp * 0.55;
  glow += jc * SUNC * 0.8 * pow(max(dot(rd, SUN), 0.0), 3.0);
  // tiny suspended sparkles
  vec2 sp = voro(p * (sprite ? 2.2 : 2.2*3.0/r));
  glow += vec3(1.0, 0.98, 0.9) * smoothstep(0.15, 0.06, sp.x) * 1.0 * smoothstep(0.05, 0.4, core);
  vec3 body = trans*(sprite ? 0.15 : 0.45) + glow*(sprite ? 0.95 : 0.75) + jc*0.15*max(dot(n,KEY),0.0);
  // bottom contact darkening
  body *= mix(0.72, 1.0, smoothstep(0.0, 0.35*r, p.y - c.y));
  vec3 refl = sprite ? mix(vec3(0.85,0.95,0.85), vec3(1.0,0.98,0.9), n.y*0.5+0.5) : skyCol(reflect(rd,n));
  vec3 col = mix(body, refl*mix(vec3(1.0), jc, 0.35), fres*0.5);
  vec3 hk = normalize(KEY - rd); col += vec3(1.0)*1.6*pow(max(dot(n,hk),0.0), 90.0) + 0.25*pow(max(dot(n,hk),0.0), 12.0);
  vec3 hs = normalize(SUN - rd); col += SUNC*1.2*pow(max(dot(n,hs),0.0), 50.0);
  vec3 hl = normalize(normalize(vec3(-0.55,0.75,0.55)) - rd); col += vec3(1.0)*0.85*smoothstep(0.955, 0.985, dot(n,hl)) * smoothstep(0.95*r, 1.15*r, p.y - c.y);
  // rim light from back sun
  col += mix(jc, vec3(1.0), 0.5) * 0.9 * pow(1.0 - ndv, 2.5) * max(dot(n, SUN)+0.3, 0.0);
  return col;
}

vec3 faceDecor(vec3 col, vec3 p, vec3 n, vec3 c, float r, float mood, vec3 jc){
  vec3 f = jFwd(c), rt = normalize(cross(vec3(0,1,0), f));
  vec3 q = p - c; float u = dot(q, rt)/r, w = q.y/r;
  if(dot(n, f) < 0.2) return col;
  // cheeks
  float ch = min(length(vec2(u+0.60, w-0.80)*vec2(1.0,1.5)), length(vec2(u-0.60, w-0.80)*vec2(1.0,1.5)));
  col = mix(col, vec3(1.0,0.12,0.18), 0.55*smoothstep(0.16, 0.02, ch));
  // smile
  float sm = abs(length(vec2(u, w - 0.90)) - 0.13);
  if(sm < 0.024 && w < 0.84) col = mix(col, vec3(0.04,0.005,0.025), 0.92);
  // closed happy eyes (joy)
  if(mood > 0.5 && mood < 1.5){
    for(int s=0;s<2;s++){ float sx = s==0?-0.36:0.36; float a = abs(length(vec2(u - sx, w - 1.00)) - 0.13);
      if(a < 0.03 && w > 1.02) col = mix(col, vec3(0.03,0.004,0.035), 0.95); }
  }
  return col;
}

vec3 bubbleFace(vec3 col, vec3 p, vec3 n, float r){
  vec2 l = p.xy / r;
  if(n.z < 0.3) return col;
  for(int s=0;s<2;s++){ vec2 e = vec2(s==0?-0.30:0.30, 0.06); vec2 d = (l-e)*vec2(1.0,0.82);
    if(length(d) < 0.15){ float t = length(d)/0.15; col = mix(vec3(0.02,0.015,0.06), vec3(0.06,0.10,0.35), smoothstep(0.3,1.0,t)*0.6); }
    if(length(l - e - vec2(-0.05,0.06)) < 0.055) col = vec3(1.0);
    if(length(l - e - vec2(0.05,-0.06)) < 0.025) col = vec3(0.9);
  }
  float sm = abs(length(l - vec2(0.0,-0.02)) - 0.13); if(sm < 0.025 && l.y < -0.08) col = vec3(0.04,0.005,0.025);
  float ch = min(length(l-vec2(-0.52,-0.12)), length(l-vec2(0.52,-0.12))); col = mix(col, vec3(1.0,0.12,0.18), 0.45*smoothstep(0.14,0.02,ch));
  return col;
}

vec3 render(vec3 ro, vec3 rd, out float depth){
  vec2 h = trace(ro, rd, 60.0);
  depth = h.x < 0.0 ? 60.0 : h.x;
  if(h.x < 0.0) return uMode >= 2 ? vec3(0) : skyCol(rd);
  vec3 p = ro + rd*h.x; float id = h.y;
  vec3 n = calcN(p, 0.0007*h.x);
  vec3 col;
  if(id >= 10.0 && id < 20.0){
    if(uMode >= 2){
      vec3 c = uMode==2 ? vec3(0,-2.7,0) : vec3(0,-3.0*0.80,0);
      col = shadeJelly(p, n, rd, uCol, c, 3.0, true);
      if(uMode==2) col = faceDecor(col, p, n, c, 3.0, uMood, uCol);
      if(uMode==3 && uMood < 2.5) col = bubbleFace(col, p, n, 3.0);
    } else {
      int i = int(id - 10.0);
      col = shadeJelly(p, n, rd, JC[i], J[i].xyz, J[i].w, false);
      col = faceDecor(col, p, n, J[i].xyz, J[i].w, JM[i], JC[i]);
      // dappled sun on top
      col *= mix(0.85, 1.08, dapple(p));
    }
  } else if(id >= 20.0 && id < 30.0){
    int k = int(id - 20.0); int i = k/2; float side = (k - i*2)==0 ? -1.0 : 1.0;
    vec3 c = uMode>=2 ? vec3(0,-2.7,0) : J[i].xyz; float r = uMode>=2 ? 3.0 : J[i].w;
    if(uMode>=2) side = (int(id-20.0)==0) ? -1.0 : 1.0;
    col = eyeShade(p, n, rd, eyePos(c, r, side), jFwd(c));
  } else {
    col = shadeOpaque(p, n, rd, id, h.x);
  }
  if(uMode < 2){
    float fogAmt = 1.0 - exp(-max(h.x - 6.0, 0.0)*0.032);
    col = mix(col, fogCol(rd), fogAmt);
    // height haze (low mist in the distance)
    col = mix(col, vec3(0.85,0.92,0.70), 0.25*fogAmt*exp(-max(p.y,0.0)*0.6));
  }
  return col;
}
vec3 godRays(vec3 ro, vec3 rd, float tEnd){
  float te = min(tEnd, 26.0); float acc = 0.0; const int N = 40;
  for(int i=0;i<N;i++){
    float t = te * (float(i)+0.5)/float(N); vec3 p = ro + rd*t;
    // light reaches p if the canopy pattern (projected along the sun) has a gap
    vec2 q = p.xz - SUN.xz/SUN.y*(p.y - 9.0);
    float gap = smoothstep(0.46, 0.62, fbm3(vec3(q*0.32, 5.0)));
    acc += gap * smoothstep(0.0, 1.5, p.y) * smoothstep(13.0, 6.0, p.y);
  }
  acc *= te / float(N);
  float phase = 0.06 + 1.8*pow(max(dot(rd, SUN), 0.0), 5.0);
  return SUNC * acc * phase * 0.05;
}

void main(){
  setup();
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = (2.0*frag - uRes) / uRes.y;
  vec3 ro, rd;
  if(uMode >= 2){
    ro = vec3(uv*3.6, 20.0); ro.y += 0.0; rd = vec3(0,0,-1);
    if(uMode==2){ ro = vec3(uv.x*3.6, uv.y*3.6, 20.0); }
    // tilt slightly so we see a hint of the top
    float a = 0.12; rd = normalize(vec3(0, -sin(a), -cos(a))); ro = vec3(uv*3.6, 0.0) + vec3(0, 20.0*sin(a), 20.0*cos(a));
    camPos = ro - rd*100.0;
  } else {
    vec3 ta = uMode==0 ? vec3(0.0, 1.55, 0.0) : vec3(0.0, 2.6, 0.0);
    vec3 ww = normalize(ta - camPos), uu = normalize(cross(ww, vec3(0,1,0))), vv = cross(uu, ww);
    float fl = uMode==0 ? 2.05 : 1.85;
    ro = camPos; rd = normalize(uv.x*uu + uv.y*vv + fl*ww);
  }
  float depth;
  if(uPass == 1){ vec2 hh = trace(ro, rd, 60.0); depth = hh.x < 0.0 ? 60.0 : hh.x; o = vec4(vec3(clamp(depth/30.0, 0.0, 1.0)), 1.0); return; }
  vec3 col = render(ro, rd, depth);
  if(uMode < 2) col += godRays(ro, rd, depth);
  if(uPass == 1){ o = vec4(vec3(clamp(depth/30.0, 0.0, 1.0)), 1.0); return; }
  if(uMode >= 2){
    float a = depth < 59.0 ? 1.0 : 0.0;
    col = col / (1.0 + col*0.25);
    o = vec4(pow(clamp(col,0.0,1.0), vec3(0.4545))*a, a);
    return;
  }
  // tone map + grade
  col = col * 1.05;
  col = col / (1.0 + col*0.28);
  col = pow(clamp(col, 0.0, 1.0), vec3(0.4545));
  col = mix(col, col*col*(3.0-2.0*col), 0.45);
  col = mix(vec3(dot(col, vec3(0.299,0.587,0.114))), col, 1.12);
  // vignette
  vec2 vq = gl_FragCoord.xy/uRes - 0.5; col *= 1.0 - 0.55*dot(vq*vec2(1.3,0.9), vq*vec2(1.3,0.9));
  o = vec4(col, 1.0);
}
