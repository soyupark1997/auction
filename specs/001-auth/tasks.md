# 001 회원 tasks (할 일 목록)

규칙: 작업 하나를 끝내고, 확인 방법으로 확인하고, 저장(commit)한 뒤 다음으로 넘어간다.
인수 조건 번호는 `spec.md` 기준이다.

- [x] T1. 확인: 설치된 TypeORM(^1.1.2)에서 마이그레이션을 만들고 실행하는 방법을 공식 문서로 확인한다. 확인한 방법을 `plan.md` 맨 아래에 적는다.
  - 완료: 이 프로젝트(ESM)에서 쓸 마이그레이션 명령이 정리됨

- [x] T2. 입력 검증과 공통 에러 형식
  - 설치: `class-validator`, `class-transformer`
  - 전역 ValidationPipe(whitelist), 모든 에러를 `{ code, message, details }`로 바꾸는 필터(`src/common/filters/`)
  - 완료: 일부러 잘못된 요청을 보내면 `VALIDATION_FAILED`가 정해진 모양으로 나옴

- [x] T3. users 테이블
  - `src/members/user.entity.ts`와 마이그레이션 (id, email, password_hash, nickname, role, created_at, 이메일·닉네임 유니크)
  - 완료: 마이그레이션 실행 후 DB에서 `users` 테이블과 제약이 보임

- [ ] T4. 가입 API (인수 조건 1, 4, 10)
  - 설치: `argon2` (안 되면 `bcrypt`)
  - `POST /auth/signup`, 이메일 소문자 저장, 비밀번호 해시, 응답에 비밀번호 관련 값 없음
  - 완료: 가입 요청 성공, 응답에 비밀번호 없음, DB에 저장된 값이 입력 원문과 다름

- [ ] T5. 가입 중복 처리 (인수 조건 2, 3, 11)
  - 이메일(대소문자만 달라도), 닉네임 중복을 `EMAIL_TAKEN`, `NICKNAME_TAKEN`(409)으로 응답
  - 완료: 같은 이메일·닉네임으로 다시 가입하면 각각 거절됨

- [ ] T6. 로그인과 증표 발급 (인수 조건 5, 6)
  - 설치: `@nestjs/jwt`, `.env`에 `JWT_SECRET`, `JWT_EXPIRES_IN` 추가(`.env.example`에도)
  - `POST /auth/login`, 실패는 이유와 상관없이 같은 `INVALID_CREDENTIALS`(없는 이메일도 해시 비교 시간을 똑같이)
  - 완료: 올바른 정보로 증표를 받고, 틀린 비밀번호와 없는 이메일은 똑같이 거절됨

- [ ] T7. 인증 가드 (인수 조건 8)
  - 전역 `JwtAuthGuard`, `@Public()`. `GET /health`, 가입, 로그인은 `@Public()`
  - 완료: 증표 없이 보호된 경로를 부르면 `UNAUTHORIZED`, health와 가입·로그인은 그대로 됨

- [ ] T8. 내 정보 (인수 조건 7)
  - `GET /me`, `@CurrentUser()`
  - 완료: 증표로 내 이메일·닉네임·역할이 나옴, 비밀번호 관련 값 없음

- [ ] T9. 역할 가드와 관리자 확인용 경로 (인수 조건 9)
  - `@Roles()`, `RolesGuard`, `GET /admin/ping`
  - 관리자 시작 스크립트로 관리자 한 명 만들기
  - 완료: 일반 회원은 `FORBIDDEN`, 관리자는 통과

- [ ] T10. e2e 테스트
  - 설치: `supertest`와 타입. 테스트용 DB 분리. 인수 조건 1~11을 각각 확인하는 테스트 작성
  - 완료: 테스트 전체 통과

- [ ] T11. 마무리
  - 기획안 9번의 1-1, 1-2, 1-6 체크, 변경된 내용이 있으면 spec과 plan에 반영
  - 완료: 저장과 push 끝
