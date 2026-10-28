// 배경 음악 미리듣기 파일 만들기: node design/music/render-songs.mjs [저장 폴더]
// index.html 의 Music(코드로 연주하는 칩튠) 부분만 떼어 OfflineAudioContext 로 곡마다 한 바퀴 녹음 → WAV
// mp3 로 바꾸기: ffmpeg -i w1.wav -codec:a libmp3lame -q:a 4 w1.mp3
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = process.argv[2] || path.join(root, 'design', 'music', 'out');
fs.mkdirSync(outDir, { recursive: true });
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
let src = html.slice(html.indexOf('const Music = (() => {'), html.indexOf('function updateSoundBtn()'));
src = src.replace('  return {\n    TRACKS:', '  return {\n    _play: (s, t, S) => play(s, t, S), _prep: prepare, _out: g => { out = g; }, _bpm: n => SONGS[n].bpm, _len: n => TRACK[n].length, _set: n => { track = n; },\n    TRACKS:');
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const page = await b.newPage();
await page.goto('about:blank');
for (const name of ['title', 'w1', 'w2', 'w3', 'w4', 'w5', 'boss']) {
  const wav = await page.evaluate(async ([src, name]) => {
    const SR = 44100;
    const T = s => s;
    // 곡 한 바퀴 + 조금 (최대 40초)
    const tmp = new Function('T', 'audio', 'musicBus', 'soundMode', src + '; return Music;');
    const probe = tmp(T, null, null, 'all');
    const step = 60 / probe._bpm(name) / 4, steps = Math.min(probe._len(name) * (probe._len(name) * step < 20 ? 2 : 1), Math.floor(40 / step));
    const dur = steps * step + 1.5;
    const audio = new OfflineAudioContext(2, Math.ceil(dur * SR), SR);
    const bus = audio.createGain(); bus.gain.value = .32 * .9 * 2.2; bus.connect(audio.destination);
    const M = tmp(T, audio, bus, 'all');
    M._set(name); M._prep(); const out = audio.createGain(); out.connect(bus); M._out(out);
    for (let s = 0; s < steps; s++) M._play(s, .05 + s * step, step);
    const buf = await audio.startRendering();
    const L = buf.getChannelData(0), n = L.length, dv = new DataView(new ArrayBuffer(44 + n * 2));
    const w = (o, s) => [...s].forEach((c, i) => dv.setUint8(o + i, c.charCodeAt(0)));
    w(0, 'RIFF'); dv.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
    dv.setUint32(24, SR, true); dv.setUint32(28, SR * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); w(36, 'data'); dv.setUint32(40, n * 2, true);
    let peak = 0; for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]));
    for (let i = 0; i < n; i++) dv.setInt16(44 + i * 2, Math.max(-1, Math.min(1, L[i])) * 32767, true);
    const bytes = new Uint8Array(dv.buffer); let bin = ''; for (let i = 0; i < bytes.length; i += 32768) bin += String.fromCharCode(...bytes.subarray(i, i + 32768));
    return { b64: btoa(bin), peak, dur };
  }, [src, name]);
  fs.writeFileSync(path.join(outDir, name + '.wav'), Buffer.from(wav.b64, 'base64'));
  console.log(name, wav.dur.toFixed(1) + 's', 'peak', wav.peak.toFixed(2));
}
await b.close();
