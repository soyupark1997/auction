# 두근경매 서버 (auction-server) 작업 지침

## 프로젝트
실시간 경매 백엔드 (가상 포인트, 동시 입찰, 실시간 반영, 마감 처리). 기준 문서는 `docs/auction-project-plan.md` (스택, 규칙, API, 로드맵). 문서와 다르게 가는 게 낫다고 판단되면 바로 바꾸지 말고 이유와 함께 제안한다.

## 사용자
프론트엔드 개발자이고 백엔드(서버, DB, Docker)는 이번이 처음이다. JavaScript/TypeScript는 익숙하다. 한국어 반말, 간결하게 답한다. 한 단계씩 진행하고, 명령어를 준 뒤 결과를 확인하고 다음으로 넘어간다. 개념은 프론트 경험(React, Vite, npm)에 비유해 설명한다.

## 개발 방식 (SDD)
기능마다 `specs/NNN-이름/` 폴더에 spec.md(무엇을, 왜), plan.md(어떻게), tasks.md(할 일) 순서로 쓰고 구현한다. spec에는 기술 용어를 쓰지 않는다. 구현은 spec과 plan에 있는 것만 한다. 로드맵과 단계별 체크리스트는 기획안 9번이다. 작업이 끝나면 체크리스트를 갱신한다.

## 기술 규칙
- Node 24, TypeScript, NestJS, TypeORM, PostgreSQL(docker compose), npm.
- 이 프로젝트는 ESM이다. 상대 경로 import에는 `.js` 확장자를 붙인다 (예: `./health.service.js`).
- 의존성은 로드맵 단계에 맞춰 하나씩 추가한다. 무료 도구만 쓴다.
- 설치된 패키지 버전이 최신이라 알던 예시 코드와 다를 수 있다. 구현 전에 설치된 버전의 공식 문서를 확인한다.
- `npm audit fix --force`는 실행하지 않는다.
- `@nestjs/observe`(외부 관측 서비스)는 쓰지 않는다.
- `.env`는 커밋하지 않는다. 새 환경변수는 `.env.example`에도 추가한다.
- 포인트와 금액은 정수(BIGINT)로 저장한다. 마감 판단 시각은 Clock을 주입받아 쓴다.
- TypeORM `synchronize`는 끄고(false), 테이블 변경은 마이그레이션으로 한다.
- 도메인 규칙(입찰 유효성, 낙찰 등)은 NestJS에 의존하지 않는 순수 TypeScript로 둔다.

## 확인 표기
실행해서 확인하지 못한 명령어와 사용법은 확인하지 못했다고 말하고, 실행 결과를 보고 바로잡는다.
