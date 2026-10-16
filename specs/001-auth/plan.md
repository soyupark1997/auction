# 001 회원 plan (어떻게 만드는가)

상태: 초안. `spec.md`의 인수 조건 1~11을 만족시키는 방법을 정한다.
이 문서의 "확인 필요"는 구현 전에 설치된 버전의 공식 문서로 확인하는 항목이다.

## 기술 결정

| 항목 | 선택 | 이유 | 상태 |
| --- | --- | --- | --- |
| 입력 검증 | `class-validator` + `class-transformer` + 전역 ValidationPipe (`whitelist: true`) | NestJS 공식 문서가 안내하는 방식 | 공식 문서 확인함 |
| 비밀번호 저장 | `argon2` 패키지로 해시 (설치가 안 되면 `bcrypt`) | 원문을 복구할 수 없는 형태로 저장. 문서는 argon2, bcrypt를 직접 쓰는 방법도 허용한다고 안내 | 선택은 내 판단, 설치와 사용법 확인 필요 |
| 증표 | JWT, `@nestjs/jwt` (12.0.3이 NestJS 12 지원) | 서버가 상태를 저장하지 않아도 됨. 갱신 토큰은 쓰지 않음 | npm에서 버전 확인함, 사용법은 확인 필요 |
| 인증 확인 | 직접 작성한 `JwtAuthGuard`를 **전역**으로 적용, 로그인 없이 열어둘 곳에만 `@Public()` | 기본은 "막힘", 열 곳만 표시하는 편이 실수가 적음 | 일반 지식 |
| 권한 확인 | `@Roles('ADMIN')` + `RolesGuard` | 역할 검사를 규칙 한 곳에 모음 | 일반 지식 |
| 대안 (채택 안 함) | `@nestjs/authentication` (공식 새 패키지) | 현재 버전 0.1.1로 아주 새 패키지라 안정성을 알 수 없음 | npm에서 버전만 확인함 |
| DB 접근 | TypeORM 엔티티 + 마이그레이션 | 기획안 결정 | 설치된 버전(^1.1.2)의 마이그레이션 실행 방법 확인 필요 |
| 테스트 | Vitest(프로젝트 기본) + supertest로 e2e | 인수 조건을 요청 단위로 확인 | supertest 설치 필요 (현재 `test/app.e2e-spec.ts`에서 타입 에러가 남) |

## 데이터

`users` 테이블 (기획안 15-2의 컬럼 그대로)
- id, email(소문자로 바꿔 저장), password_hash, nickname, role(USER 또는 ADMIN, 기본 USER), created_at
- 이메일과 닉네임에 각각 유니크 제약. **동시에 같은 이메일로 가입해도 DB가 한 건만 허용**하고, 중복 에러는 EMAIL_TAKEN, NICKNAME_TAKEN으로 바꿔서 응답한다. (인수 조건 2, 3, 11)
- 이메일은 저장하기 전에 소문자로 바꿔서 대소문자만 다른 이메일도 같은 것으로 본다. (인수 조건 2)

## 코드 구조

- `src/users/`: `user.entity.ts`, `users.service.ts`(회원 찾기, 만들기), `users.controller.ts`(GET /me)
- `src/auth/`: `auth.controller.ts`(POST /auth/signup, POST /auth/login), `auth.service.ts`, `jwt-auth.guard.ts`, `roles.guard.ts`, `decorators/`(`public`, `roles`, `current-user`), `dto/`(`signup.dto.ts`, `login.dto.ts`)
- `src/common/filters/`: 모든 에러를 `{ code, message, details }` 모양으로 바꾸는 필터
- `src/database/migrations/`: users 테이블 생성
- 확인용 관리자 경로: `GET /admin/ping` (`@Roles('ADMIN')`, 4단계에서 실제 관리 기능으로 대체)
- 모든 상대 경로 import에는 `.js`를 붙인다 (이 프로젝트는 ESM).

## 동작 방식

- **가입:** 입력 검증 → 이메일 소문자 변환 → 비밀번호 해시 → 저장 → 사용자 정보(비밀번호 제외) 응답.
- **로그인:** 이메일로 회원을 찾는다. 회원이 없어도 **가짜 해시와 비교하는 시간을 똑같이 쓴다**(응답 시간 차이로 계정 존재를 알아내지 못하게). 실패하면 이유와 상관없이 같은 INVALID_CREDENTIALS 응답을 준다. (인수 조건 6)
- **증표 내용:** 사용자 id(sub)와 역할만 담는다. 유효 기간은 설정값(기본 1시간).
- **가드:** `Authorization: Bearer <증표>`를 읽어 검증한다. 증표가 없거나 잘못되었거나 만료되면 UNAUTHORIZED. 통과하면 요청에 사용자 정보를 붙인다. (인수 조건 8)
- **역할:** 증표 안의 역할만 본다 (DB를 다시 읽지 않음). 단점은 역할이 바뀌어도 증표가 만료될 때까지 반영되지 않는다는 점이다. 짧은 유효 기간으로 허용한다. 필요하면 5단계에서 다시 본다.
- **보안:** 비밀번호 원문과 해시는 응답과 로그 어디에도 남기지 않는다. 200번대 응답에도 포함하지 않는다. (인수 조건 1, 7, 10)

## 설정값 (.env, .env.example에도 항목 추가)

- `JWT_SECRET`: 증표 서명용 비밀 값. 충분히 길고 무작위여야 한다. 코드에 쓰지 않는다.
- `JWT_EXPIRES_IN`: 증표 유효 기간 (기본 1h)
- 관리자 시작 계정(시작용 스크립트가 쓰는 값): 구현할 때 정한다.

## 인수 조건별 테스트

- 1~4 가입: e2e (정상, 이메일 중복·대소문자, 닉네임 중복, 입력 오류)
- 5~6 로그인: e2e (정상, 틀린 비밀번호, 없는 이메일이 같은 응답인지)
- 7~9 내 정보와 권한: e2e (증표 있음, 없음·잘못됨·만료, 일반 회원이 관리자 경로 접근, 관리자는 통과)
- 10 저장된 비밀번호가 원문과 다름: 가입 후 DB에서 직접 읽어 비교
- 11 동시 가입: 같은 이메일로 요청을 동시에 여러 번 보내서 성공이 1건인지 확인
- 테스트용 DB: 개발 DB와 분리한다 (같은 Postgres 컨테이너 안의 별도 데이터베이스). 만드는 방법은 구현할 때 정한다.

## 확인 필요 (구현 전에 설치된 버전의 문서로 확인)

1. 설치된 TypeORM(^1.1.2)에서 마이그레이션을 만들고 실행하는 방법 (ESM 프로젝트)
2. `argon2` 설치와 사용법 (실패하면 `bcrypt`)
3. `@nestjs/jwt` 12.x의 설정과 서명·검증 방법
4. Vitest에서 NestJS e2e 테스트를 돌리는 방법과 `supertest` 타입 설치
5. 전역 가드와 `@Public()` 데코레이터 구현 방식이 현재 NestJS 문서와 맞는지

## T1 결과: 마이그레이션 방법 (2026-10-16, 공식 문서와 npm으로 확인)

- TypeORM 1.1.2는 Node `^20.19.0 || ^22.13.0 || >=24.11.0`을 요구한다. 현재 Node v24.12.0이라 통과한다.
- CLI가 읽을 **DataSource 파일을 따로** 만든다 (예: `src/database/data-source.ts`). 앱 안의 연결 설정과는 별도이고, 같은 DB 접속 정보를 쓴다.
- DataSource에서 꼭 필요한 옵션: `synchronize: false`, `migrations: [...]`. 문서는 `.js`와 `.ts`를 모두 포함하는 경로 패턴을 권장한다 (개발은 TypeScript, 배포는 컴파일된 JavaScript).
- 마이그레이션 만들기: `typeorm migration:generate -d <DataSource 파일 경로> <이름>` (변경이 없으면 종료 코드 1).
- 마이그레이션 실행: `typeorm migration:run -- -d <DataSource 파일 경로>`. 기본 `typeorm` 명령은 컴파일된 `.js`만 실행한다.
- TypeScript 파일을 바로 실행하려면 이 프로젝트가 ESM이므로 `typeorm-ts-node-esm`을 쓴다. 문서의 안내: `ts-node`를 개발 의존성으로 설치하고, `package.json`에 `"typeorm": "typeorm-ts-node-esm"` 스크립트를 둔 뒤 `npm run typeorm migration:run -- -d <경로>`로 실행한다.
- 문서에 되돌리기(revert)와 상태 확인(show) 명령은 이번에 읽은 페이지에 없었다. 필요할 때 해당 페이지를 읽는다.
- 문서에 ESM용 마이그레이션 파일 출력 옵션(`esm` 플래그)이 있다는 언급이 있으나 예시 명령은 없다. 확인 필요.
- 주의 (일반 지식, 확인 필요): 문서 예시의 `__dirname`은 ESM에서 쓸 수 없다. 대체 방법이 필요하다.
- 아직 해보지 않은 것: `ts-node`가 이 프로젝트(`module: nodenext`)에서 실제로 동작하는지, `.env`를 CLI에서 읽는 방법(`dotenv` 패키지 또는 Node의 `--env-file` 옵션, 일반 지식). 안 되면 먼저 빌드(`npm run build`)하고 `dist` 안의 `.js`를 실행하는 방법으로 대체한다.
- **T3에서 실제로 해보고 확정한다.**

## T3 결과 (2026-10-16)
- entity: `src/users/user.entity.ts` (users: id BIGSERIAL, email/nickname UNIQUE, password_hash, role 기본 'USER', created_at timestamptz)
- DataSource: `src/database/data-source.ts` — `.env`는 Node 내장 `process.loadEnvFile()`로 읽고, entity는 직접 import(`.js` 확장자), migrations는 `src/database/migrations/*.ts`
- 스크립트: `"typeorm": "typeorm-ts-node-esm"` + devDependency `ts-node`. ESM + Node 24 + ts-node 조합이 정상 동작함 (실제 실행으로 확인)
- 생성: `npm run typeorm -- migration:generate src/database/migrations/<이름> -d src/database/data-source.ts`
- 적용: `npm run typeorm -- migration:run -d src/database/data-source.ts`
- 확인: `docker compose exec postgres psql -U auction -d auction -c "\d users"`
- 이메일 대소문자는 DB가 아니라 앱에서 소문자로 바꿔 저장(T4)
