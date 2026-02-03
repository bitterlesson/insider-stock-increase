# Insider Stock Increase Monitor

포트폴리오 종목의 임원/주요주주 주식 매수 현황을 모니터링하고 이메일로 알림을 받는 서비스입니다.

## Features

- **포트폴리오 관리**: 관심 종목(종목코드 6자리) 등록/삭제
- **내부자 매수 모니터링**: OpenDART elestock API를 통해 임원/주요주주의 주식 보유 증가 감지
- **이메일 알림**: 내부자 매수 발생 시 Gmail로 알림 발송
- **자동 수집**: Vercel Cron을 통해 매일 아침 07:30(KST) 자동 실행
- **웹 대시보드**: 최근 내부자 매수 이벤트 조회

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

### 수동 배치 실행

```bash
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

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/portfolio` | GET | 포트폴리오 목록 조회 |
| `/api/portfolio` | POST | 종목 추가 |
| `/api/portfolio?stock_code=` | DELETE | 종목 삭제 |
| `/api/events` | GET | 내부자 매수 이벤트 조회 |
| `/api/cron/collect` | GET | 배치 수집 실행 |
| `/api/admin/import-corp` | POST | 회사 코드 import |

## Project Structure

```
src/
├── app/
│   ├── page.tsx                 # 메인 대시보드
│   ├── portfolio/page.tsx       # 포트폴리오 관리
│   └── api/
│       ├── portfolio/route.ts   # 포트폴리오 CRUD
│       ├── events/route.ts      # 이벤트 조회
│       ├── cron/collect/route.ts # 배치 수집
│       └── admin/import-corp/route.ts
├── lib/
│   ├── supabase/server.ts       # Supabase 클라이언트
│   ├── opendart/
│   │   ├── client.ts            # OpenDART API
│   │   ├── types.ts             # 타입 정의
│   │   └── parser.ts            # 데이터 파싱
│   └── email/sender.ts          # 이메일 발송
├── components/
│   ├── EventList.tsx
│   ├── PortfolioForm.tsx
│   └── PortfolioTable.tsx
└── types/database.ts
```

## OpenDART Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 000 | 정상 | 수집 |
| 013 | 데이터 없음 | 정상 (스킵) |
| 020/800 | 재시도 필요 | 스킵 후 계속 |
| 010/011/901 | 키 오류 | 중단 |

## License

MIT
