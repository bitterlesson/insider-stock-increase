# Insider Stock Increase Monitor

포트폴리오 종목의 임원/주요주주 주식 매수 현황을 모니터링하고 이메일로 알림을 받는 서비스입니다.

## Features

- **포트폴리오 관리**: 관심 종목(종목코드 6자리) 등록/삭제
- **내부자 매수 모니터링**: OpenDART elestock API를 통해 임원/주요주주의 주식 보유 증가 감지
- **자동 수집**: Vercel Cron을 통해 매일 아침 07:30(KST) 자동 실행
- **수동 수집**: 대시보드에서 "매수내역 감시 개시" 버튼으로 즉시 수집 (5분 쿨다운)
- **이메일 알림**: 자동 수집 시 신규 이벤트 발생하면 Gmail로 알림 발송
- **웹 대시보드**: 최근 내부자 매수 이벤트 조회 및 실시간 수집 상태 표시
- **중복 방지**: 동일 공시는 재수집/재발송 안됨 (Idempotent)

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Scheduling**: Vercel Cron
- **Email**: nodemailer (Gmail SMTP)
- **API**: OpenDART elestock
- **Deployment**: Vercel

## Getting Started

### 1. Prerequisites

- Node.js 18+
- Supabase 계정
- OpenDART API 키 ([발급](https://opendart.fss.or.kr/))
- Gmail 계정 + 앱 비밀번호

### 2. Installation

```bash
# Clone repository
git clone https://github.com/bitterlesson/insider-stock-increase.git
cd insider-stock-increase

# Install dependencies
npm install
```

### 3. Environment Variables

`.env.local.example`을 `.env.local`로 복사하고 값을 설정합니다:

```bash
cp .env.local.example .env.local
```

```env
# OpenDART API
OPENDART_API_KEY=your_opendart_api_key

# Gmail SMTP
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_app_password

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Cron Secret
CRON_SECRET=your_cron_secret

# Notification Email
NOTIFICATION_EMAIL=recipient@example.com
```

### 4. Database Setup

Supabase SQL Editor에서 `supabase/migrations/001_initial_schema.sql` 파일의 SQL을 실행합니다.

### 5. Import Company Data

OpenDART의 회사 코드 데이터를 가져옵니다:

```bash
# 로컬에서 실행
npm run dev

# 다른 터미널에서
curl -X POST http://localhost:3000/api/admin/import-corp \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 6. Run Development Server

```bash
npm run dev
```

http://localhost:3000 에서 확인합니다.

## Usage

### 포트폴리오 관리

1. 웹 대시보드에서 "포트폴리오 관리" 클릭
2. 종목코드 6자리 입력 (예: 005930 삼성전자)
3. "추가" 버튼 클릭

### 수동 수집

**방법 1: 웹 대시보드 (권장)**
1. 메인 대시보드에서 "🔍 매수내역 감시 개시" 버튼 클릭
2. OpenDART API 호출 → 신규 이벤트 자동 저장
3. 토스트 알림으로 결과 확인 (신규 이벤트 수, 처리 종목 수)
4. 5분 쿨다운 후 재사용 가능

**방법 2: API 직접 호출**
```bash
# 수동 수집 (이메일 발송 안됨)
curl -X POST http://localhost:3000/api/manual-collect

# 자동 수집 (이메일 발송됨)
curl http://localhost:3000/api/cron/collect \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Deployment (Vercel)

### 1. Vercel에 배포

```bash
vercel
```

### 2. 환경변수 설정

Vercel 대시보드에서 모든 환경변수를 설정합니다.

### 3. Cron 설정

`vercel.json`에 이미 설정되어 있습니다:

```json
{
  "crons": [
    {
      "path": "/api/cron/collect",
      "schedule": "30 22 * * *"
    }
  ]
}
```

UTC 22:30 = KST 07:30 (매일 아침)

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/portfolio` | GET | - | 포트폴리오 목록 조회 |
| `/api/portfolio` | POST | - | 종목 추가 |
| `/api/portfolio?stock_code=` | DELETE | - | 종목 삭제 |
| `/api/events` | GET | - | 내부자 매수 이벤트 조회 |
| `/api/manual-collect` | POST | - | 수동 수집 (이메일 X) |
| `/api/cron/collect` | GET | Bearer Token | 자동 수집 (이메일 O) |
| `/api/admin/import-corp` | POST | Bearer Token | 회사 코드 import |

## Project Structure

```
src/
├── app/
│   ├── page.tsx                     # 메인 대시보드 (수동 수집 UI 포함)
│   ├── portfolio/page.tsx           # 포트폴리오 관리
│   └── api/
│       ├── portfolio/route.ts       # 포트폴리오 CRUD
│       ├── events/route.ts          # 이벤트 조회
│       ├── manual-collect/route.ts  # 수동 수집 (NEW)
│       ├── cron/collect/route.ts    # 자동 수집
│       └── admin/import-corp/route.ts
├── lib/
│   ├── collector/index.ts           # 공통 수집 로직 (NEW)
│   ├── supabase/server.ts           # Supabase 클라이언트
│   ├── opendart/
│   │   ├── client.ts                # OpenDART API
│   │   ├── types.ts                 # 타입 정의
│   │   └── parser.ts                # 데이터 파싱
│   └── email/sender.ts              # 이메일 발송
├── components/
│   ├── EventList.tsx
│   ├── PortfolioForm.tsx
│   ├── PortfolioTable.tsx
│   ├── Spinner.tsx                  # 로딩 스피너 (NEW)
│   └── Toast.tsx                    # 알림 토스트 (NEW)
└── types/
    ├── database.ts
    └── collect.ts                   # 수집 결과 타입 (NEW)
```

## How It Works

### 자동 수집 (매일 07:30 KST)
1. Vercel Cron이 `/api/cron/collect` 호출
2. 포트폴리오 종목 조회 → OpenDART API 호출
3. 보유 증가(delta_cnt > 0) 이벤트만 필터링
4. DB에 저장 (rcept_no 기준 중복 방지)
5. 신규 이벤트가 1건 이상이면 이메일 발송

### 수동 수집 (사용자 버튼 클릭)
1. 대시보드에서 "매수내역 감시 개시" 버튼 클릭
2. 실시간 프로그레스 표시 (종목 처리 진행률)
3. 자동 수집과 동일한 로직 실행 (이메일 발송 제외)
4. 토스트 알림으로 결과 표시
5. 5분 쿨다운 타이머 시작

### 중복 방지 메커니즘
- **DB 레벨**: `rcept_no` UNIQUE 제약
- **로직 레벨**: `ignoreDuplicates: true` 옵션
- **날짜 필터**: `rcept_dt === todayStr` 체크
- 동일 공시는 여러 번 수집해도 재저장/재발송 안됨 ✅

## OpenDART Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 000 | 정상 | 수집 |
| 013 | 데이터 없음 | 정상 (스킵) |
| 020/800 | 재시도 필요 | 스킵 후 계속 |
| 010/011/901 | 키 오류 | 중단 |

## License

MIT
