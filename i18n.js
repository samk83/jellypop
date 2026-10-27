// i18n.js — 언어 전환 (한국어 / English). 다른 스크립트보다 먼저 불러온다.
// 키 = 한국어 원문. T('스테이지 {n}', { n }) → 영어면 사전(lang-en.js) 값, 사전에 없으면 원문 그대로.
// 언어 고르기: 주소 ?lang=en|ko → 저장된 선택(localStorage 'jellypop2.lang') → 브라우저 언어(ko면 한국어, 나머지 영어)
// 정적 HTML 글자는 JellyI18n.apply(document.body)가 텍스트·aria-label·title을 사전으로 바꾼다.
// 다른 파일에서 영어 문구 추가: JellyI18n.add({ '한국어': 'English' })
window.JellyI18n = (() => {
  const KEY = 'jellypop2.lang', LANGS = ['ko', 'en'];
  const dict = {};
  function pick() {
    try {
      const q = new URLSearchParams(location.search).get('lang');
      if (LANGS.includes(q)) return q;
      const saved = localStorage.getItem(KEY);
      if (LANGS.includes(saved)) return saved;
    } catch (e) { /* 저장소를 못 쓰는 환경 */ }
    const nav = (navigator.languages && navigator.languages[0]) || navigator.language || '';
    return /^ko\b/i.test(nav) ? 'ko' : 'en';
  }
  const lang = pick();
  document.documentElement.lang = lang;

  function fill(s, v) {
    return v ? s.replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m)) : s;
  }
  function t(s, v) {
    if (lang !== 'ko' && Object.prototype.hasOwnProperty.call(dict, s)) return fill(dict[s], v);
    return fill(s, v);
  }
  function add(obj) { Object.assign(dict, obj); }
  function set(next) {
    if (!LANGS.includes(next) || next === lang) return;
    try { localStorage.setItem(KEY, next); } catch (e) { /* 저장 못 해도 이번 주소로는 바뀜 */ }
    const u = new URL(location.href);
    u.searchParams.set('lang', next);
    location.replace(u.href);
  }
  // 앞뒤 공백은 그대로 두고 가운데 글자만 사전으로 바꾼다
  function swap(s) {
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s);
    return m[2] && Object.prototype.hasOwnProperty.call(dict, m[2]) ? m[1] + dict[m[2]] + m[3] : s;
  }
  function apply(root) {
    if (lang === 'ko' || !root) return;
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      const p = n.parentNode && n.parentNode.nodeName;
      if (p === 'SCRIPT' || p === 'STYLE') continue;
      const v = swap(n.nodeValue);
      if (v !== n.nodeValue) n.nodeValue = v;
    }
    const els = root.querySelectorAll ? root.querySelectorAll('[aria-label],[title],[placeholder]') : [];
    els.forEach(el => ['aria-label', 'title', 'placeholder'].forEach(a => {
      if (el.hasAttribute(a)) { const v = swap(el.getAttribute(a)); if (v !== el.getAttribute(a)) el.setAttribute(a, v); }
    }));
  }
  return { lang, t, add, set, apply, dict };
})();
window.T = window.JellyI18n.t;
