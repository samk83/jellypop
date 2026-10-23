// Offline raymarch renderer: node render.mjs <mode> <w> <h> <out.png> [pass] [r,g,b] [mood] [ears]
// mode 0 title plate, 1 play plate, 2 jelly sprite, 3 bubble sprite. pass 1 = depth.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const [mode, w, h, out, pass = '0', col = '1,0.4,0.6', mood = '0', ears = '0'] = process.argv.slice(2);
const frag = fs.readFileSync(path.join(dir, 'scene.glsl'), 'utf8');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-watchdog'] });
const page = await browser.newPage();
page.on('console', m => console.log('[page]', m.text()));
await page.setContent('<canvas id=c></canvas>');
const t0 = Date.now();
const url = await page.evaluate(async ({ frag, mode, w, h, pass, col, mood, ears }) => {
  const c = document.getElementById('c'); c.width = w; c.height = h;
  const gl = c.getContext('webgl2', { preserveDrawingBuffer: true, premultipliedAlpha: false, alpha: true });
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, '#version 300 es\nin vec2 p;void main(){gl_Position=vec4(p,0,1);}'));
  gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, frag)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
  gl.useProgram(pr);
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.uniform2f(gl.getUniformLocation(pr, 'uRes'), w, h);
  gl.uniform1i(gl.getUniformLocation(pr, 'uMode'), mode);
  gl.uniform1i(gl.getUniformLocation(pr, 'uPass'), pass);
  gl.uniform3f(gl.getUniformLocation(pr, 'uCol'), ...col);
  gl.uniform1f(gl.getUniformLocation(pr, 'uMood'), mood);
  gl.uniform1f(gl.getUniformLocation(pr, 'uEars'), ears);
  gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  gl.enable(gl.SCISSOR_TEST);
  const strip = 16;
  for (let y = 0; y < h; y += strip) {
    gl.scissor(0, y, w, strip); gl.drawArrays(gl.TRIANGLES, 0, 3); gl.finish();
    if ((y / strip) % 20 === 0) { console.log('row', y); await new Promise(r => setTimeout(r, 0)); }
  }
  return c.toDataURL('image/png');
}, { frag, mode: +mode, w: +w, h: +h, pass: +pass, col: col.split(',').map(Number), mood: +mood, ears: +ears });
fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
console.log('done', out, ((Date.now() - t0) / 1000).toFixed(1) + 's');
await browser.close();
