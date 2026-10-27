# GitHub Operating Policy (Owner 지정, 2026-10-27)

## 역할 분리
- Claude Code: 개발, 수정, 검사, 커밋, PR, Merge 담당
- GitHub: 원격 코드 저장소, 버전 관리 및 백업 전용
- GitHub Actions: 사용하지 않음

## 기본 작업 절차
1. 작업 시작 전 최신 코드 확인
2. 기능 브랜치 생성
3. Claude Code에서 개발 및 수정
4. 로컬 환경에서 필요한 검사 수행
5. 변경사항을 Git Commit 및 Push
6. GitHub CLI(gh)로 Pull Request 생성
7. Claude Code에서 PR 변경사항 검토
8. 문제가 없으면 PR Merge
9. Merge 결과 확인 및 로컬 main 동기화

## 자동 실행 정책
- 일반적인 개발 작업은 PR 생성부터 Merge까지 자동 수행 가능
- 사전 정의된 로컬 검사 실패 시 Merge 중단
- 충돌이나 예상하지 못한 변경사항 발견 시 Merge 중단
- 데이터 삭제, 보안 설정 변경, 결제 관련 변경 등 고위험 작업은 Owner 승인 요청
- 불필요한 사용자 승인 요청 최소화

## GitHub Actions 제한
- GitHub Actions 실행 및 신규 워크플로 생성 금지
- CI/CD, 자동 테스트, 자동 Build를 GitHub Actions에 등록하지 않음
- 로컬 검사는 Claude Code에서 수행
- GitHub CLI를 사용하여 PR 및 Merge 처리
- GitHub Actions 기반 자동 배포 금지

## 목적
Owner가 Claude Code에서 모든 개발 작업을 통합 관리하고 GitHub는 코드 저장 및 버전 이력 관리 용도로만 사용한다.

---

## 이 repo에 적용한 내용 (참고)
- 기본 브랜치: `main` (2026-10-27부터 게임 코드 전체가 main에 있음)
- 기능 브랜치 이름: `claude/<작업명>` (예: `claude/github-policy`)
- 사전 정의된 로컬 검사 = `npm test` (테스트 5종: bubble · stages30 · game · jelly3d · story). 하나라도 실패하면 Merge 안 함
  - 클라우드 환경처럼 Playwright 브라우저가 따로 설치된 곳에서는 `CHROMIUM=/opt/pw-browsers/chromium npm test`
- Merge 방식: merge commit (커밋 이력 보존)
- `.github/workflows/` 없음 (2026-10-27 확인). 만들지 않는다
