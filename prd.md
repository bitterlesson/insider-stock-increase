# PRD v2.0 (Implemented)

## Insider Stock Increase Monitor

Portfolio-based · OpenDART elestock · Daily Batch · Email Notification

---

## 1. 제품 개요 (Overview)

### 목적

사용자가 등록한 **포트폴리오 종목(종목코드 6자리)**을 기준으로 OpenDART의 임원·주요주주 소유보고(elestock) 공시를 매일 수집하여 보유 주식 수가 증가(+)한 이벤트만 웹 대시보드와 이메일로 제공한다.

### 핵심 정책

- 장내/장외 매수 판단 하지 않음
- 거래금액/1억 기준 판정하지 않음
- "증가 = 매수"로 해석하지 않음 (증여·상속·행사 등 가능성 인정)
- 신규 이벤트가 0건이면 이메일을 발송하지 않음
- 개인용 1인 서비스 (과금/멀티유저 없음)

---

## 2. 기술 스택 (Implemented)

| 항목 | 기술 |
|------|------|
| Frontend/Backend | Next.js 15 (App Router) |
| Database | Supabase (PostgreSQL) |
| Scheduling | Vercel Cron |
| Email | nodemailer (Gmail SMTP) |
| API | OpenDART elestock |
| Deployment | Vercel |

---

## 3. 구현된 기능

### 3.1 포트폴리오 관리

- **입력**: 종목코드 6자리
- **기능**: 추가, 삭제, 중복 방지
- **검증**: 숫자 6자리 형식 검증
- **자동 매핑**: companies 테이블에서 회사명 자동 조회

### 3.2 회사 코드 Import (corp_code)

- OpenDART corpCode.xml 다운로드
- ZIP 해제 → XML 파싱
- 상장사(stock_code 존재) 필터링 후 DB 저장
- stock_code → corp_code 매핑 지원

### 3.3 데이터 수집 배치

- **실행 시각**: 매일 07:30 KST (UTC 22:30)
- **대상**: 포트폴리오에 등록된 종목
- **API**: OpenDART elestock
- **처리**:
  - 종목코드 → corp_code 변환
  - 회사별 elestock API 호출
  - `sp_stock_lmp_irds_cnt > 0` 항목만 추출
  - `rcept_no` 기준 upsert (중복 방지)

### 3.4 이메일 발송

- **발송 조건**: 신규 이벤트 ≥ 1건
- **발송 시점**: 배치 완료 직후
- **발송 방식**: Gmail SMTP (App Password)
- **내용**: 회사명, 종목코드, 보고자, 직위, 증가 주식수, 접수일

### 3.5 웹 대시보드

- **메인 페이지**: 오늘의 내부자 매수 이벤트 목록
- **통계**: 이벤트 건수, 총 매수 주식수
- **포트폴리오 관리**: 종목 추가/삭제

---

## 4. API 엔드포인트

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/portfolio` | GET | 포트폴리오 목록 조회 |
| `/api/portfolio` | POST | 종목 추가 |
| `/api/portfolio?stock_code=` | DELETE | 종목 삭제 |
| `/api/events` | GET | 내부자 매수 이벤트 조회 |
| `/api/cron/collect` | GET | 배치 수집 실행 (Cron) |
| `/api/admin/import-corp` | POST | corpCode 데이터 import |

---

## 5. OpenDART API 처리 정책

### 5.1 Status Code 처리

| Code | 의미 | 처리 정책 |
|------|------|----------|
| 000 | 정상 | 수집/저장 |
| 013 | 데이터 없음 | 정상 (스킵) |
| 020 | 요청 제한 초과 | 스킵 후 계속 |
| 800 | 점검 중 | 스킵 후 계속 |
| 010/011/901 | 키 오류 | 배치 중단 |

### 5.2 데이터 파싱

- 숫자 필드는 쉼표 포함 문자열로 응답됨 → 정규화 필요
- 예: `"1,234,567"` → `1234567`

---

## 6. 데이터베이스 스키마

### companies
```sql
CREATE TABLE companies (
    corp_code VARCHAR(8) PRIMARY KEY,
    stock_code VARCHAR(6),
    corp_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### portfolio
```sql
CREATE TABLE portfolio (
    id SERIAL PRIMARY KEY,
    stock_code VARCHAR(6) UNIQUE NOT NULL,
    corp_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### insider_reports
```sql
CREATE TABLE insider_reports (
    id SERIAL PRIMARY KEY,
    rcept_no VARCHAR(20) UNIQUE NOT NULL,
    corp_code VARCHAR(8) NOT NULL,
    corp_name VARCHAR(100),
    stock_code VARCHAR(6),
    repror VARCHAR(100),
    isu_exctv_rgist_at VARCHAR(10),
    isu_exctv_ofcps VARCHAR(100),
    isu_main_shrholdr VARCHAR(10),
    sp_stock_lmp_cnt BIGINT,
    sp_stock_lmp_irds_cnt BIGINT,
    sp_stock_lmp_rate DECIMAL(10,4),
    sp_stock_lmp_irds_rate DECIMAL(10,4),
    delta_cnt BIGINT,
    rcept_dt DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### email_runs
```sql
CREATE TABLE email_runs (
    run_date DATE PRIMARY KEY,
    events_count INT DEFAULT 0,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. 환경변수

```
OPENDART_API_KEY=           # OpenDART API 키 (40자리)
GMAIL_USER=                 # Gmail 계정
GMAIL_APP_PASSWORD=         # Gmail 앱 비밀번호
NEXT_PUBLIC_SUPABASE_URL=   # Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase Anon Key
SUPABASE_SERVICE_ROLE_KEY=  # Supabase Service Role Key
CRON_SECRET=                # Cron 인증 시크릿
NOTIFICATION_EMAIL=         # 알림 받을 이메일
```

---

## 8. 디렉토리 구조

```
insider-stock-increase/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # 메인 대시보드
│   │   ├── globals.css
│   │   ├── portfolio/
│   │   │   └── page.tsx                # 포트폴리오 관리
│   │   └── api/
│   │       ├── portfolio/route.ts      # CRUD
│   │       ├── events/route.ts         # 이벤트 조회
│   │       ├── cron/collect/route.ts   # 배치 수집
│   │       └── admin/import-corp/route.ts
│   ├── lib/
│   │   ├── supabase/server.ts
│   │   ├── opendart/
│   │   │   ├── client.ts
│   │   │   ├── types.ts
│   │   │   └── parser.ts
│   │   └── email/sender.ts
│   ├── components/
│   │   ├── EventList.tsx
│   │   ├── PortfolioForm.tsx
│   │   └── PortfolioTable.tsx
│   └── types/database.ts
├── supabase/migrations/001_initial_schema.sql
├── vercel.json
├── .env.local.example
└── package.json
```

---

## 9. 변경 이력

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | - | 초기 MVP 정의 |
| v1.1 | - | 신규 0건 시 이메일 미발송 정책 추가 |
| v1.2 | - | OpenDART elestock 개발가이드 제약 반영 |
| v1.3 | - | 최종 통합본 |
| v2.0 | 2025-02-03 | 구현 완료 - 실제 구현 내용 반영 |
