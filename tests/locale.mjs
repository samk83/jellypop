// 기존 테스트는 한국어 화면을 확인한다. 게임은 브라우저 언어로 언어를 고르므로(i18n.js),
// 새 페이지·컨텍스트를 기본 한국어(ko-KR)로 연다. 영어 화면은 tests/i18n.test.mjs 가 따로 확인한다.
export function koreanByDefault(browser) {
  for (const m of ['newPage', 'newContext']) {
    const f = browser[m].bind(browser);
    browser[m] = (o = {}) => f({ locale: 'ko-KR', ...o });
  }
  return browser;
}
