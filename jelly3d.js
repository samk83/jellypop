// 젤리팝 3D 그림 — 미리 구워 둔 3D 젤리·거품·대포 그림(sprites3d.js)을 찾아 준다.
// 게임 중에는 3D 계산을 하지 않는다 (그림만 붙이는 2D) → 어떤 휴대폰에서도 스테이지 시작이 멈추지 않는다.
// 그림 굽기 도구: design/forest/bake-sprites.mjs (원본 3D 모양: design/forest/jelly3d-baker.js)
// 목록에 없는 그림이거나 ?3d=0 이면 null → 기존 구미 SVG 그림을 그대로 쓴다.
window.Jelly3D = (() => {
  let state = null;
  function init() {
    if (state !== null) return state;
    let off = false;
    try { off = new URLSearchParams(location.search).get('3d') === '0'; } catch (e) { /* noop */ }
    state = !off && !!window.JELLY3D_SPRITES;
    return state;
  }
  // 크기(세 번째 값)는 받지 않는다: 그림은 한 가지 크기로 미리 구워져 있음
  function bake(kind, { color = '#ff7fae', mood = 'happy', ears = false } = {}) {
    if (!init()) return null;
    return window.JELLY3D_SPRITES[[kind, String(color).toLowerCase(), mood, ears ? 1 : 0].join('|')] || null;
  }
  const has = (kind, opt = {}) => !!bake(kind, opt);
  return { ok: init, bake, has };
})();
