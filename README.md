# 젤리팝 — 젤리마을 대소동

말랑이가 핸들 달린 거품 대포로 갇힌 젤리 친구들을 구하는 웹 버블 슈터. 휴대폰·PC 브라우저에서 설치 없이 플레이.

> 작업 흐름: `main`에서 기능 브랜치 → `npm test` 통과 → PR → Merge (GitHub Actions 사용 안 함). [docs/GITHUB-POLICY.md](docs/GITHUB-POLICY.md)

## 플레이
- `index.html`을 브라우저로 열면 바로 시작 (v0.4, 5월드 · 30스테이지 · 방해 요소)
- 조작: 대포 근처를 좌우로 끌어 대포를 돌리고 → 손을 떼면 발사(위로 끌어 올리면 취소). 맨 앞에 줄 선 친구를 누르면 순서 바꾸기. 오른쪽 위 소리 버튼: 음악+효과음 / 효과음만 / 끔
- PC 키보드: ← → 조준, Space 발사, X 순서 바꾸기
- 이전 버전(톡 터뜨리기): `classic.html`

## 테스트
```
npm install
npm test
```
Playwright 브라우저가 따로 설치된 환경(클라우드 등): `CHROMIUM=/opt/pw-browsers/chromium npm test`
