# 실시간 경매 백엔드 프로젝트 기획안

- 작성일: 2026-09-28
- 목적: Spring 백엔드 연습 + 포트폴리오 (중소·중견·스타트업 신입 백엔드 지원 목표)
- 상태: 기획 완료, 개발 환경 세팅 진행 중 (13번 참고)
- 이 문서는 기획 대화에서 정한 내용을 모은 것이며, 확정과 제안, 미정을 구분해서 적었다.

---

## 0. Claude Code에게 (작업 원칙)

- 사용자는 **프론트엔드 개발자**이고 **백엔드, Spring, Docker는 이번이 처음**이다. Homebrew, Git, Docker Desktop은 이미 설치되어 있다.
- **한 단계씩** 진행한다. 명령어를 주고, 실행 결과를 확인한 뒤 다음으로 넘어간다.
- 개념은 **처음부터 차근차근** 설명한다. 프론트 경험(npm, package.json, Vite 등)에 비유하면 이해가 빠르다.
- 한국어 반말, 간결하게 답한다.
- 의존성은 **로드맵 단계에 맞춰 하나씩** 추가한다. (예: Security를 처음부터 넣으면 모든 주소가 로그인 뒤로 잠겨서 첫 실행이 헷갈린다.)
- **무료 도구만** 쓴다.
- 이 문서와 다르게 가는 게 낫다고 판단되면 바로 바꾸지 말고 이유와 함께 제안한다.
- 아직 결정하지 않은 항목(14번)은 필요해지는 시점에 사용자에게 먼저 묻는다.

---

## 1. 개요·컨셉

**한 줄 정의:** 판매자가 상품을 올리면 여러 입찰자가 가상 포인트로 실시간 경쟁 입찰하고, 마감 시각에 서버가 자동으로 낙찰자를 정하는 실시간 경매 서비스.

목적은 Spring 백엔드 연습이다. 그래서 화면은 목록, 상세, 입찰 정도로 최소화하고, 서버가 다루는 문제(동시 입찰, 실시간 반영, 마감 처리, 권한)에 시간을 쓴다.

| 결정 | 내용 | 이유 |
| --- | --- | --- |
| 결제 | 가상 포인트, 실제 결제 없음 | 결제 연동과 거래 관련 부담을 덜고 서버 로직에 집중 |
| 역할 | 일반 회원(판매자와 입찰자 겸함), 관리자 | 권한 설계를 연습하기 좋은 최소 구조 |
| 경매 방식 | 오름 경매(가장 높은 입찰가가 낙찰) | 규칙이 단순하고 실시간성이 가장 강함 |
| 상품 | 판매자가 자유 등록(사진, 설명, 시작가) | 카탈로그 없이 바로 시작 |
| 프론트 | 목록, 상세, 입찰 정도의 최소 화면 | 백엔드가 주인공 |

---

## 2. 경매 규칙

수치(입찰 단위, 연장 시간 등)는 설정값으로 빼두고 값은 개발 중에 정한다.

| 규칙 | 내용 | 서버가 다루는 문제 | 단계 |
| --- | --- | --- | --- |
| 입찰 유효성 | 현재가 + 최소 입찰 단위 이상만 유효, 본인 상품에는 입찰 불가 | 검증 로직, 권한 | MVP |
| 포인트 예치 | 입찰 시 포인트를 동결, 다른 사람에게 밀리면 자동 해제 | 트랜잭션, 정합성 | MVP |
| 마감 처리 | 마감 시각에 최고 입찰자를 낙찰자로 확정, 입찰이 없으면 유찰 | 스케줄링, 중복 실행 방지 | MVP |
| 낙찰 정산 | 낙찰자의 예치 포인트를 판매자에게 이체, 나머지 입찰자는 해제 | 트랜잭션, 비동기 처리 | MVP |
| 실시간 반영 | 새 입찰을 그 경매를 보고 있는 모든 사용자에게 바로 전달 | WebSocket, 재접속 | MVP |
| 알림 | 밀림, 낙찰, 마감 임박 알림 | 큐, 비동기 | 2차 |
| 마감 연장 | 마감 직전 입찰이 들어오면 마감 시각을 연장 (직전 기준과 연장 시간은 설정값) | 스케줄 재등록 | 2차 (10번에서 승격 제안) |
| 즉시구매가 | 판매자가 선택적으로 설정, 도달하면 즉시 낙찰 | 동시성 | 2차 |
| 자동 입찰 | 상한가를 정해 두면 시스템이 최소 단위로 대신 입찰 | 큐, 동시성 | 3차 |

---

## 3. 백엔드 학습 목표와 기능 매핑

| 학습 목표 | 이 프로젝트의 기능 | Spring에서 다룰 것 | 확인 방법 |
| --- | --- | --- | --- |
| 인증·권한 | 회원 로그인, 일반·관리자 권한, 본인 상품 입찰 금지 | Spring Security, 토큰 기반 인증, 역할·소유자 검증 | 권한별 접근 테스트 코드 |
| DB 설계·쿼리 최적화 | 경매 목록 검색·정렬, 입찰 내역, 포인트 장부 | 관계 모델링, 인덱스, N+1, 페이징, 트랜잭션 | 실행 계획(EXPLAIN) 전후 비교 |
| 실시간(WebSocket) | 입찰 현황 전달, 남은 시간 표시 | WebSocket 연결 인증, 경매별 구독 채널, 재접속 | 동시 접속자 테스트, 끊김 후 복구 |
| 비동기·큐·스케줄링 | 마감 처리, 정산, 알림 발송 | 스케줄러, 메시지 큐, 멱등성 | 마감 시각 오차, 중복 처리 테스트 |

여기에 경매에서 만나는 **동시성**(같은 상품에 동시 입찰)이 추가로 붙는다. 이게 이 프로젝트의 가장 큰 보너스다.

---

## 4. 기술 스택

### 확정

| 영역 | 선택 | 메모 |
| --- | --- | --- |
| 언어 | Java 21 | 이미 설치됨(JetBrains 런타임 21.0.11). Boot 4.1은 Java 17~26 지원. 앞서 25(LTS)를 추천했지만 21로 진행 |
| 프레임워크 | Spring Boot 4.1.1 | Initializr 기본값. Spring Framework 7 필요. Boot 3.5는 2026-06 지원 종료, 4.0은 2026-12 말 종료 예정이라 4.1 사용 |
| 빌드 | Gradle (Groovy) | Boot 4.1은 Gradle 8.14 이상 또는 9.x 필요 |
| 웹 방식 | Spring MVC (WebFlux 아님) | 러닝커브가 낮고 이 규모엔 충분 (판단) |
| 실시간 | Spring WebSocket + STOMP | 프레임워크 내장, 경매별 구독 채널에 적합 |

### 제안 (아직 확정 아님)

| 영역 | 제안 | 이유 |
| --- | --- | --- |
| DB | MySQL (PostgreSQL도 가능) | 락과 트랜잭션 학습에는 둘 다 무방, 국내 자료가 많은 편(조사는 안 함) |
| 데이터 접근 | Spring Data JPA (필요 시 QueryDSL 등) | |
| 캐시·락 | Redis | 동시성 방식 비교의 한 축 |
| 큐 | RabbitMQ 먼저, Kafka는 나중 옵션 | 재시도, 실패 처리 개념을 배우기 좋음. Kafka는 처음엔 과함 |
| 테스트 | JUnit 5 + Testcontainers | 실제 DB, Redis로 동시성 테스트 |
| 부하 테스트 | k6 (또는 JMeter) | k6는 시나리오를 JavaScript로 작성 |
| 프론트 | React + TypeScript + Vite (익숙한 프레임워크가 있으면 그걸로) | TanStack Query(조회), @stomp/stompjs(실시간), Tailwind(최소 스타일) |
| 로컬 실행 | Docker Compose | DB, Redis, 큐를 한 번에 |

### 비용 (개발은 전부 무료 가능, 배포만 유료 가능)

| 항목 | 무료 여부 |
| --- | --- |
| Spring Boot, Security, Gradle, JUnit | 무료 (오픈소스, 내가 알기로) |
| Java (OpenJDK 계열) | 무료 |
| MySQL 또는 PostgreSQL | 무료 (커뮤니티 버전, 내가 알기로) |
| Redis | 무료. Redis 8부터 AGPLv3와 SSPL 듀얼 라이선스. 개인·학습용은 문제없음 |
| RabbitMQ, k6, Testcontainers | 무료 (오픈소스, 내가 알기로, 이번엔 확인 안 함) |
| Docker Desktop | 직원 250명 미만, 매출 1천만 달러 미만이면 무료 |
| IntelliJ IDEA | 통합판에서 Java·Kotlin 핵심 기능과 Spring Boot 프로젝트 생성은 무료. Spring 고급 도구는 Ultimate 구독 필요 |
| 배포 서버 | 무료 티어는 제한적 (11번 참고) |

---

## 5. 아키텍처

### 5-1. 시스템 구성

```
[클라이언트: 목록, 상세, 입찰 화면]
        │  REST (입찰, 상품, 회원 요청)
        │  WebSocket/STOMP (입찰 현황 실시간 수신)
        ▼
[Spring Boot 서버]
   ├─ REST API
   ├─ WebSocket (STOMP)
   └─ 스케줄러 (마감·낙찰 처리)
        │
        ├─▶ 관계형 DB   (상품, 입찰, 포인트 장부)
        ├─▶ Redis (제안) (락, 현재가 캐시)
        └─▶ 메시지 큐   ──▶ 워커 (알림 발송, 정산)
```

Redis와 메시지 큐 종류는 아직 고르지 않았다. 로드맵 단계에서 필요해질 때 하나씩 넣고, 넣기 전후의 차이를 부하 테스트로 비교한다.

### 5-2. 서버 내부 구조

요청은 위에서 아래로만 흐른다.

```
진입:  REST 컨트롤러 | WebSocket 컨트롤러 | 스케줄러·큐 컨슈머
          ▼
서비스:  유스케이스 단위 트랜잭션, 도메인 호출 순서 조합
          ▼
도메인:  입찰 유효성, 마감 연장, 낙찰 규칙   ← 규칙은 여기 한 곳에만
          ▼
저장소:  JPA 리포지토리 | Redis 접근(제안) | 큐 프로듀서
공통:    인증·권한, 예외 처리, 설정값
```

- 스케줄러와 REST가 같은 도메인 규칙을 쓰게 한다.
- 마감 시각 같은 시간 입력은 외부에서 주입받는 방식(`Clock`)으로 두어 마감 경계 테스트를 쉽게 한다.

---

## 6. 동시성 처리 전략

문제: 두 사람이 거의 동시에 같은 현재가를 읽고 각자 더 높은 금액을 입찰하면, 둘 다 검증을 통과해서 낮은 입찰이 높은 입찰을 덮어쓰거나 포인트 동결이 어긋난다.

이 프로젝트에서는 **일부러 버그를 먼저 재현하고, 방식을 바꿔가며 고치고, 수치로 비교**하는 것을 핵심 이야기로 삼는다.

| 방식 | 동작 | 장점 | 주의점 |
| --- | --- | --- | --- |
| 락 없음 (기준선) | 읽고 검사하고 저장 | 구현이 가장 단순 | 동시 입찰에서 현재가가 어긋남 (버그 재현용) |
| 비관적 락 | 상품 행을 잠그고 처리 (SELECT ... FOR UPDATE) | 정확성이 쉽게 보장됨 | 대기로 처리량 저하, 데드락 가능성 |
| 낙관적 락 | 버전 컬럼으로 충돌을 감지하고 재시도 | 락 대기가 없음 | 충돌이 잦으면 실패·재시도 증가 |
| Redis 분산 락 | DB 밖에서 경매별로 잠금 | 서버가 여러 대여도 동작 | 락 만료·장애 처리가 복잡, DB와 정합성 필요 |
| Redis 원자 연산 | 현재가 비교·갱신을 한 번에 실행 | 가장 빠르게 처리 가능 | DB와 두 저장소를 맞추는 설계 부담 |

이 순서대로 구현하고, 같은 테스트를 매번 돌려 비교한다. 입찰 처리 방식은 인터페이스로 두고 구현체를 갈아끼운다(`bid/service/strategy`).

### 부하 테스트 계획

- **시나리오:** 사용자 여러 명이 한 경매에 동시에 입찰 요청을 보낸다. 도구는 k6나 JMeter 중 하나(미정).
- **정확성 검사:** 테스트 끝에 ① 최종 현재가가 성공한 입찰 중 최고가와 같은지, ② 입찰 내역이 금액 오름차순으로 일관된지, ③ 전체 포인트 합계(잔액 + 동결)가 그대로인지 검사한다.
- **성능 지표:** 처리량, 응답 시간(하위 구간 포함), 실패·재시도 비율을 방식별 표로 남긴다. 목표 수치는 정해진 게 없으므로 실측 후 설명한다.

---

## 7. 데이터 모델과 API

포인트는 잔액 컬럼만 두지 않고 **불변 장부(ledger)** 테이블에 모든 변동을 기록한다. 그래야 "포인트 합계가 그대로인지" 검사할 수 있다.

### 테이블

| 테이블 | 주요 컬럼 | 비고 |
| --- | --- | --- |
| users | id, email, password_hash, role, created_at | role은 일반 회원과 관리자 |
| point_accounts | user_id, balance, held | held는 입찰에 동결된 포인트 |
| point_ledger | id, user_id, type, amount, ref_id, created_at | 충전·동결·해제·정산 기록, 수정·삭제 없이 추가만 |
| auctions | id, seller_id, title, description, start_price, bid_step, current_price, highest_bidder_id, ends_at, status, version | version은 낙관적 락용, status는 준비·진행·낙찰·유찰 |
| auction_images | id, auction_id, path | 사진 경로 |
| bids | id, auction_id, bidder_id, amount, created_at | 인덱스 후보: (auction_id, amount) |
| notifications | id, user_id, type, payload, read_at | 큐 처리의 결과물 |

인덱스 후보는 이밖에 auctions(status, ends_at)가 있다. 목록 조회와 마감 스케줄러 둘 다 이 조건으로 찾기 때문이다. 인덱스 전후의 실행 계획을 비교하는 것이 DB 학습의 확인 방법이다.

### API (경로 이름은 제안, 구현하면서 바뀔 수 있음)

| 유형 | 엔드포인트 | 설명 | 권한 |
| --- | --- | --- | --- |
| REST | POST /auth/signup, POST /auth/login | 가입·로그인 | 누구나 |
| REST | POST /auctions | 상품 등록 | 로그인 회원 |
| REST | GET /auctions | 목록·검색·정렬·페이징 | 누구나 |
| REST | GET /auctions/{id} | 상세·현재가·입찰 내역 | 누구나 |
| REST | POST /auctions/{id}/bids | 입찰 | 로그인 회원 (본인 상품 제외) |
| REST | POST /admin/auctions/{id}/close | 강제 종료 | 관리자 |
| WebSocket | SUBSCRIBE /topic/auctions/{id} | 새 입찰·남은 시간·낙찰 소식 | 로그인 회원 |
| WebSocket | SUBSCRIBE /user/queue/notifications | 밀림·낙찰 개인 알림 | 본인 |

---

## 8. 폴더 구조

기능(도메인) 단위로 패키지를 나누고 그 안에 레이어를 둔다. 자바 기준이며 패키지 이름(`com.example.auction`)과 마이그레이션 도구는 임시값이다.

```text
auction-server/
├─ build.gradle
├─ docker-compose.yml           # DB, Redis, 메시지 큐를 한 번에 실행
├─ docs/                        # 기획서 링크, 부하 테스트 결과표
├─ loadtest/                    # 부하 테스트 스크립트 (k6 또는 JMeter)
│  └─ scenarios/                # 동시 입찰, 마감 직전 폭주
└─ src/
   ├─ main/
   │  ├─ java/com/example/auction/
   │  │  ├─ AuctionApplication.java
   │  │  ├─ global/
   │  │  │  ├─ config/         # 보안, WebSocket, Redis, 스케줄러 설정
   │  │  │  ├─ security/       # 인증 필터, 토큰, 권한 검사
   │  │  │  ├─ error/          # 공통 예외와 응답 형식
   │  │  │  └─ time/           # Clock 주입 (마감 시각 테스트용)
   │  │  ├─ member/            # 회원, 로그인
   │  │  │  └─ controller/ service/ domain/ repository/ dto/
   │  │  ├─ auction/           # 상품 등록, 조회, 마감
   │  │  │  ├─ controller/     # REST, WebSocket
   │  │  │  ├─ service/
   │  │  │  ├─ domain/         # 경매 엔티티, 상태, 마감 연장·낙찰 규칙
   │  │  │  ├─ repository/
   │  │  │  ├─ scheduler/      # 마감 처리
   │  │  │  └─ dto/
   │  │  ├─ bid/               # 입찰
   │  │  │  ├─ controller/ domain/ repository/ dto/
   │  │  │  └─ service/
   │  │  │     └─ strategy/    # 동시성 방식별 구현체를 갈아끼움
   │  │  ├─ point/             # 포인트 계정, 불변 장부
   │  │  └─ notification/      # 알림, 큐 프로듀서·컨슈머
   │  └─ resources/
   │     ├─ application.yml
   │     ├─ application-local.yml
   │     └─ db/migration/      # 스키마 변경 이력 (도구 미정)
   └─ test/java/com/example/auction/
      ├─ auth/                # 권한별 접근 테스트
      ├─ bid/                 # 동시 입찰 정합성 테스트
      └─ auction/             # 마감 중복 실행, 마감 경계 테스트
```

나눈 이유:

- **기능별 패키지:** 로드맵 단계(회원·인증, 입찰, 마감)와 폴더가 1:1로 맞아서 진행 상황이 보이고, 나중에 서비스를 쪼개기도 쉽다.
- **bid/service/strategy:** 락 없음, 비관적 락, 낙관적 락, Redis 구현체를 바꿔 끼워 같은 테스트로 비교한다.
- **loadtest 폴더:** 부하 테스트 스크립트와 결과표를 저장소에 함께 두면 "측정했다"를 바로 보여줄 수 있다.
- **global/time:** 시간을 코드가 직접 읽지 않고 주입받게 해서 마감 직전, 경계 시각을 테스트에서 고정할 수 있다.

---

## 9. 개발 로드맵

기간은 작업 페이스를 본 뒤 정하려고 비워 뒀다. 각 단계의 통과 기준을 못 채우면 다음 단계로 넘어가지 않는다.

| 단계 | 내용 | 통과 기준 |
| --- | --- | --- |
| 0. 환경 세팅 | JDK, IDE, Docker, 프로젝트 생성, MySQL 연결, 첫 API | 로컬에서 서버가 뜨고 DB에 연결되며 health 응답이 나온다 |
| 1. 기반 | 회원·인증·권한, 상품 등록·조회 | 권한별 접근 테스트 통과 |
| 2. 입찰 | 입찰, 포인트 예치·장부, 동시성 해결 | 동시 입찰 뒤 정합성 검사 통과 |
| 3. 실시간 | WebSocket 반영, 재접속 처리 | 접속자 모두에게 즉시 반영 |
| 4. 마감·큐 | 스케줄러 마감, 알림·정산 큐 | 중복 마감해도 결과 동일 |
| 5. 마무리 | 인덱스 최적화, 부하 테스트, (배포) | 방식별 성능 비교표 완성 |

순서는 "정확하게 만든 뒤 빠르게 만든다"를 따른다. 입찰과 동시성(2)을 먼저 끝내야 실시간(3)과 큐(4)를 올려도 정합성이 무너지지 않는다.

범위가 밀리면 2차 규칙(즉시구매가, 마감 연장)과 3차 규칙(자동 입찰)은 5단계 뒤로 미룬다. 그래도 4단계까지 가면 네 가지 학습 목표는 모두 다룰 수 있다.

---

## 10. 킥이 되는 기능 (제안, 로드맵에 아직 반영 안 됨)

**마감 직전 입찰 폭주를 정확하게 버티는 것.** 경매에서 가장 위험한 순간이 마감 몇 초 전이고, 한 시나리오에 서버 문제가 다 모인다.

- 동시 입찰 폭주 → 동시성 처리 검증
- 마감 연장 → 이미 걸린 마감 스케줄을 다시 잡는 문제
- 마감 경계에서 들어온 입찰을 받을지 정하는 문제 → 기준 시각을 서버 시간 하나로 통일
- 몰리는 동안에도 모든 화면이 같은 현재가를 보여주는 문제 → 실시간 반영

**데모 장면:** 접속자 여러 명이 마감 직전에 동시에 입찰 → 연장이 몇 번 일어남 → 최종 낙찰과 포인트 합계가 정확함을 그래프나 로그로 보여준다.

**로드맵에 반영하려면:** 마감 연장을 2차에서 MVP 안쪽으로 올리고, 4단계 통과 기준에 "마감 직전 폭주 시나리오 통과"를 추가한다. (사용자 결정 대기)

**추가 후보:**
- 자동 입찰(상한가 입력): 큐와 동시성이 엮여 난이도는 높지만 임팩트가 크다.
- 입찰 리플레이: 모든 입찰을 이벤트로 남겨 경매를 되감아 재생한다. 정합성 검증과 분쟁 조사, 관리자 도구로 보여주기 좋다.

---

## 11. 배포 계획 (제안, 미확정)

배포는 **5단계까지 미뤄도 된다.** 그전까지는 `docker-compose.yml`로 로컬에서 실행하면 충분하다.

- **1순위, VM 한 대 + Docker Compose:** 클라우드 서버 한 대에 앱, DB, Redis, 큐를 Compose로 한 번에 띄운다. 리눅스, 도커, 배포를 직접 겪어서 학습 가치와 어필도가 높다.
- **2순위, PaaS(Render, Railway 등):** 쉽지만 무료 티어 제약이 크다. 아래는 블로그(2026-02) 기준이며 조건은 자주 바뀌므로 올리기 전에 직접 확인한다.
  - Render: 15분 쉬면 슬립, 재기동에 30초 이상, 메모리 512MB
  - Fly.io: 메모리 256MB로 Spring Boot에는 부족
  - Oracle Cloud Always Free: 가장 넉넉하다는 평가, 카드 등록 필요
  - AWS, Azure: 12개월 무료, 카드 등록 필요
- **주의:** Spring Boot에 MySQL, Redis, 큐까지 한 서버에 올리면 1GB 메모리로는 빠듯하다. 데모용은 구성을 줄이거나 메모리가 넉넉한 서버를 고른다.
- **프론트:** 정적 호스팅(무료 티어가 흔함, 조건 미확인).
- **자동 배포:** 나중에 GitHub Actions로 push 시 자동 배포하면 어필 포인트가 된다.
- 실제 요금과 무료 조건은 이번에 조사하지 않았다.

---

## 12. 포트폴리오 어필 포인트와 리스크

이 프로젝트의 가치는 "경매 앱을 만들었다"가 아니라 **"동시성 문제를 재현하고 해결하고 증명했다"**에 있다.

**어필 포인트**

- 버그 재현 → 해결 → 수치 비교: 락 없는 구현에서 일부러 낸 오류와 방식별 성능 비교표를 README에 남긴다.
- 정합성 검사: 불변 장부와 포인트 합계 검사로 "돈이 불어나거나 사라지지 않는다"를 보여준다.
- 중복 실행에 안전한 마감: 스케줄러가 두 번 돌아도 낙찰·정산이 한 번만 일어난다.
- 권한 테스트 코드와 실행 계획 비교: 보안과 쿼리 최적화를 말이 아니라 증거로 남긴다.

**리스크와 대응**

| 리스크 | 대응 |
| --- | --- |
| 범위가 커져 끝내지 못한다 | 단계별 통과 기준을 두고, 자동 입찰·즉시구매가는 뒤로 미룬다 |
| 경매·예약 같은 주제는 비슷한 프로젝트가 많을 수 있다 (이번에 조사하지 않았다) | 만든 것보다 측정한 결과와 설명으로 차별화한다 |
| 프론트 작업에 시간을 다 쓴다 | 목록·상세·입찰 정도의 최소 화면만 만든다 |
| 가상 포인트라 현실감이 떨어진다 | 불변 장부와 정합성 설계로 돈을 다루는 서버처럼 설계했다는 점을 보여준다 |
| 백엔드가 처음이라 진입장벽이 높다 | 세팅부터 한 단계씩, 의존성은 단계별로 추가 |

---

## 13. 세팅 진행 상황과 다음 단계

**확인된 것**

- Homebrew, Git, Docker Desktop: 설치되어 있음 (사용자 응답)
- Java: `openjdk 21.0.11` (JetBrains 런타임 빌드). Spring Boot 4.1 요구사항(Java 17 이상)을 충족. 이 빌드는 IDE 번들이라 필요하면 나중에 Temurin 같은 일반 OpenJDK 빌드를 따로 설치해도 된다.

**아직 확인 못 한 것**

- `docker run hello-world` 결과 (Docker 정상 동작)
- IntelliJ IDEA 설치 여부 (`ls /Applications | grep -i -E "intellij|idea"`)

**진행 중: 2단계, Spring 프로젝트 생성**

https://start.spring.io 에서 아래 값으로 생성한다.

| 항목 | 값 |
| --- | --- |
| Project | Gradle - Groovy |
| Language | Java |
| Spring Boot | 4.1.1 (SNAPSHOT·M이 붙은 버전은 피함) |
| Group | com.example |
| Artifact | auction-server |
| Packaging | Jar |
| Java | 21 |
| Dependencies | Spring Web, Spring Data JPA, MySQL Driver, Validation, Spring Boot Actuator |

Security, WebSocket, Data Redis는 로드맵 해당 단계에서 추가한다. (Initializr 의존성 ID: `security`, `websocket`, `data-redis`)

```bash
mkdir -p ~/dev
unzip ~/Downloads/auction-server.zip -d ~/dev
ls ~/dev/auction-server        # build.gradle이 보이면 성공
```

**다음 순서 (0단계 통과 기준까지)**

1. 프로젝트를 IntelliJ에서 열고 서버 실행해 보기
2. `docker-compose.yml`로 MySQL 띄우기
3. `application-local.yml`에 DB 연결 설정
4. 서버 실행 후 `/actuator/health` 응답 확인
5. 간단한 첫 API 하나 만들어 보기 (요청·응답 개념 익히기)

---

## 14. 미정·확인 필요 항목

**아직 결정하지 않은 것**

- DB: MySQL로 갈지 PostgreSQL로 갈지
- 메시지 큐 종류: RabbitMQ 제안 (Kafka는 나중 옵션)
- Redis를 언제 도입할지
- 부하 테스트 도구: k6 또는 JMeter
- 프론트 프레임워크: React + TypeScript + Vite 제안 (익숙한 것이 있으면 그것)
- 패키지 이름, DB 마이그레이션 도구
- 배포 방식과 시점 (11번)
- 킥(마감 직전 폭주 시나리오)을 로드맵에 반영할지, 마감 연장을 MVP로 올릴지 (10번)

**이번 기획에서 확인하지 않은 것**

- 배포 서버의 실제 요금과 무료 조건 (블로그 정보 기준으로만 정리)
- 국내 채용에서 Spring, Node, Python의 정량적 수요 (최신 통계를 찾지 못함)
- 비슷한 경매·예약 포트폴리오 프로젝트가 얼마나 흔한지
- RabbitMQ, k6, Testcontainers, MySQL, Spring 계열의 최신 라이선스 (일반 지식 기준)

---

## 참고 자료

- [Spring Boot System Requirements](https://docs.spring.io/spring-boot/system-requirements.html)
- [HeroDevs: Spring Boot Versions, EOL Dates (July 2026)](https://www.herodevs.com/blog-posts/spring-boot-versions-eol-dates-and-latest-releases-april-2026)
- [Spring Initializr 메타데이터](https://start.spring.io/metadata/client)
- [Redis is now available under the AGPLv3 open source license](https://redis.io/blog/agplv3/)
- [Docker Plans FAQs](https://www.docker.com/pricing/faq/)
- [Introducing The Unified IntelliJ IDEA | FAQ](https://lp.jetbrains.com/intellij-idea-unified-faq/)
- [Free Hosting for Spring Boot: Best Options in 2026 | BSWEN](https://docs.bswen.com/blog/2026-02-28-springboot-free-hosting/)
- [NUGUNA: 백엔드 개발자 진로 로드맵 (2026)](https://www.nugunapass.com/en/community/backend-developer-roadmap-2026)
- [‘점핏’ 통해 찾는 개발자 보니… (베리타스알파, 2021)](https://www.veritas-a.com/news/articleView.html?idxno=395799)
