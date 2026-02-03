PRD v1.2 — OpenDART elestock API 현실 조건 반영
0. 반영 목적

OpenDART API는 단순 JSON 호출 이상의 특성이 있다:

에러코드/상태값이 있고, “데이터 없음”은 오류가 아님

여러 레이트 제한이 존재(특히 무료/개인키)

많은 LLMS가 “성공/실패” 판단을 오독함

그래서 PRD에 개발가이드 구체 조건을 명시해 시스템 전체 안정성을 높인다.

아래는 API 개발가이드 문서의 핵심 요소를 반영한 PRD 확장(주요 조항만)

4. API 요건 (추가)
4.A OpenDART elestock 기본
Endpoint
GET https://opendart.fss.or.kr/api/elestock.json

Required Params
Parameter	설명
crtfc_key	OpenDART 인증키 (40자리)
corp_code	공시대상 회사 고유번호 (8자리)
4.B Response Format (JSON)

성공 시 기본 구조:

{
  "status": "000",
  "message": "정상",
  "list": [
    {...}, // 공시 리스트
  ]
}

Primary Fields Used
필드	설명
rcept_no	공시 접수번호 (14자리)
rcept_dt	공시 접수일 (YYYY-MM-DD)
repror	보고자명
isu_exctv_rgist_at	임원 등록 여부
isu_exctv_ofcps	직위
isu_main_shrholdr	주요주주 여부
sp_stock_lmp_cnt	소유 주식 수
sp_stock_lmp_irds_cnt	증감 주식 수 (delta)
sp_stock_lmp_rate	보유 비율
sp_stock_lmp_irds_rate	증감 비율
4.C Error / Status Code Handling (반드시 반영)
Code	의미	처리 전략
000	정상	수집/저장
010	등록되지 않은 키	관리자 알림 (중단)
011	사용불가 키	관리자 알림 (중단)
012	IP 접근 불가	인프라 재검토
013	데이터 없음	정상, 이벤트 없음
020	요청 제한 초과	백오프 후 재시도
021	조회 가능 회사 수 초과 (100건 제한)	페이징/분할 요청 로직
800	점검 중	재시도
900	정의되지 않음	로그 + 관리자 알림
901	키 사용 불가 (개인정보 보유기간 만료)	관리자 재승인 필요

중요: 013은 “정상 → 리스트 없음”이므로 오류가 아님

4.D Paging / 요청 건수 한계

elestock는 “회사별” API이고, 최대 100건(company) 조회 제한 있음

021 코드 발생 시 자동 분할/페이징 로직 필요

(우리 MVP는 포트폴리오 기반이라 해당 문제는 드물지만,
포트폴리오가 100개 이상이면 고려 필요)

4.E Response Characteristic

일부 필드는 Null/String 혼재

숫자는 쉼표 포함 형태로 응답되는 경우 있어 정규화 필요

응답 구조는 배열(list)일 수도 있고, list 없음일 수도 있음

5. 배치 / API Rate Limiting 반영 (추가 NFR)
5.A 요청 제한(Rate Limit) 전략

동일 회사에 1회 호출하는 정도는 문제 없음

실패(020, 800) 발생 시

1~3회 지수 백오프 재시도

실패 반복 종목은 다음날 재시도 플래그

5.B IP 허용 정책

OpenDART는 IP 기반 접근 제한이 존재함

배치 서버의 egress IP를 allowlist 등록 또는 고정 IP 구성 필요

6. 데이터를 안전히 저장하기 위한 주의 (Insider Model 확장)
6.A 유니크 키

rcept_no만으로 항상 UQ 지정

동일한 공시가 재공시/정정돼도 UQ 기준으로 덮어쓰기/스킵

6.B Null/숫자 처리

API 반환 값은 숫자/문자열/쉼표 포함 문자열 혼합이므로
“문자열 → 숫자” 파싱 로직이 견고해야 함

7. 배치 안정성 (실패 안전)
7.A Partial Success

일부 종목만 실패하더라도 전체 배치가 리트라이 없이 중단되어서는 안 됨

7.B 통계/로그

다음 정보를 로깅

성공/실패 카운트

실패 코드 분포 (020, 800, etc)

API 응답 시간 통계

8. 원문/뷰어 링크 관련

공시 원문 링크 생성 방식

https://dart.fss.or.kr/dsaf001/main.do?rcpNo={rcept_no}


대시보드/이메일에 해당 링크를 노출

9. 정규화 필드 예시 (API → 서비스 필드 매핑)
API 필드	서비스 필드
rcept_no	rcept_no
rcept_dt	report_date
repror	reporter
isu_exctv_rgist_at	executive_flag
isu_exctv_ofcps	position
isu_main_shrholdr	major_holder_flag
sp_stock_lmp_cnt	holdings_cnt
sp_stock_lmp_irds_cnt	delta_cnt
sp_stock_lmp_rate	holdings_rate
sp_stock_lmp_irds_rate	delta_rate
10. UI/UX 제약 (가이드 반영)

API 결과 자체가 “보유 증가(+)인지/감소(-)인지”를 판단하는 것은 서비스가 함

API에 의한 “매도/매수” 표기는 직접 존재하지 않음

UI에서는 보유 증가만 필터링된 리스트를 명확히 표기

11. 테스트 케이스 (추가)
11.A 정상 반환

status 000 + list 존재

list length 0 (013) → 정상, no events

11.B 에러 코드 별 처리

020/800 → 재시도 로직 수행

010/011/901 → 관리자 알림

기타 900 → 로그 + 관리자 알림

12. 운영 정책 (추가)
12.A API Key 관리

Key rotation 정책

만약 011/901 발생 시 자동 운영자 알림

12.B IP 관리

Allowlist 등록(IP 고정/Whitelist) 관련 명시

크론 서버 IP{X}를 등록

13. Acceptance Criteria (OpenDART 반영 확장)

API status 013은 실패가 아니며, no events로 처리해야 한다.

에러 코드별 처리 로직이 벗어나지 않고, 각 상황별 정책이 정확히 작동한다.

동일 회사 rcept_no는 중복으로 저장되지 않는다.

대량 포트폴리오 스캔 시에도 020/800 레이트 제한 상황에서 성공/실패가 분리되어 저장된다.

웹/이메일 UI에서 보여주는 필드는 가이드에서 정의된 Mapping대로 정규화되어 있다.

부록 — 에러 코드 정의 요약 (추가용 텍스트)
000 정상
010 등록되지 않은 키
011 사용할 수 없는 키
012 IP 접근 불가
013 데이터 없음
020 요청 제한 초과
021 조회 가능 회사 수 초과
800 점검 중
900 정의되지 않은 오류
901 개인정보 보유기간 만료


이제 PRD에 해당 OpenDART API의 조건/제약/운영/에러정의/레이트 제한까지 명시되어 있으므로,
LLM 기반 작업 도구(Claude Code 포함)에게 “API-바운드 소프트웨어 생성”을 지시해도 오류/오독 리스크를 크게 줄일 수 있는 구조가 되었습니다.

원하면 다음으로 Claude Code용 작업 티켓을 만들어줄게.
👉 예) “파일/엔드포인트/환경변수/테스트 케이스/대시보드 스크린 명세”
이제 바로 구현 스텝으로 넘길 수 있게 깔끔하게 정리해줄까?

지금까지 내용을 모두 반영한 최신 prd를 다시 출력해줘. 그럼 내가 md 파일로 만들어서 claude code에서 작업시작하고, 그 다음 니가 추천하는 Claude Code용 작업 티켓을 요청하도록 할게.

아주 좋은 판단이에요.
이 단계에서 **“최신 PRD를 하나의 기준 문서(single source of truth)”**로 고정해두는 게 Claude Code 작업 품질을 결정합니다.

아래는 지금까지 합의한 모든 사항 + OpenDART elestock 개발가이드 제약까지 100% 반영한 최신 PRD (Final / v1.3) 입니다.
→ 그대로 .md 파일로 저장해서 Claude Code에 넣어도 됩니다.

PRD v1.3 (FINAL)

Insider Increase Digest
Portfolio-based · OpenDART elestock · Daily Batch · No Email on Zero

1. 제품 개요 (Overview)
목적

사용자가 등록한 **포트폴리오 종목(종목코드 6자리)**을 기준으로
OpenDART의 임원·주요주주 소유보고(elestock) 공시를 매일 수집하여
보유 주식 수가 증가(+)한 이벤트만 웹 대시보드와 이메일로 제공한다.

핵심 정책

장내/장외 매수 판단 하지 않음

거래금액/1억 기준 판정하지 않음

“증가 = 매수”로 해석하지 않음 (증여·상속·행사 등 가능성 인정)

신규 이벤트가 0건이면 이메일을 발송하지 않음

개인용 1인 서비스 (과금/멀티유저 없음)

2. 사용자 정의 및 사용 시나리오
사용자

개인 투자자 (본인 1인)

사용 시나리오

사용자가 관심 종목의 **종목코드(6자리)**를 포트폴리오에 등록

매일 07:30 KST, 배치 작업 실행

포트폴리오 종목에 대해 OpenDART elestock 조회

보유 주식 수가 증가(+)한 공시만 DB에 저장

신규 이벤트가 1건 이상일 경우에만 요약 이메일 발송

사용자는 웹 대시보드에서 상세 내역 및 공시 원문 확인

3. 목표 / 비목표
목표 (Goals)

내부자 보유 증가 이벤트를 누락 없이 안정적으로 수집

중복 공시 저장 및 이메일 중복 발송 방지 (Idempotent)

개인용 MVP로서 단순하고 유지보수 비용이 낮은 구조

비목표 (Non-goals)

투자 추천 / 알파 생성 / 스코어링

거래금액 산출, 장내·장외 구분

멀티유저, 과금, 권한 관리

4. 기능 요구사항 (Functional Requirements)
4.1 포트폴리오 관리

입력 방식: 종목코드 6자리

기능

다건 등록 (붙여넣기)

개별 삭제

중복 등록 방지

검증

숫자 6자리 형식 검증

4.2 회사 식별 (corp_code 매핑)

OpenDART corpCode 마스터를 기준으로
stock_code → corp_code 매핑

매핑 실패 시

해당 종목은 배치 대상에서 제외

대시보드에 “corp_code 매핑 실패” 상태 표시 (옵션)

4.3 데이터 수집 배치 (Daily Batch)

실행 시각: 매일 07:30 KST

대상: 포트폴리오에 등록된 종목

API: OpenDART elestock

처리 절차

종목코드 → corp_code 변환

회사별 elestock API 호출

응답 리스트 중
sp_stock_lmp_irds_cnt > 0 인 항목만 추출

공시 식별자 rcept_no 기준으로 DB에 upsert

4.4 이메일 발송 (Daily Digest)

발송 조건 (중요)

신규 이벤트 ≥ 1건 → 이메일 발송

신규 이벤트 = 0건 → 이메일 미발송

발송 시점

배치 완료 직후 (07:30 KST 전후)

발송 방식

Gmail SMTP (App Password 사용)

이메일 내용

날짜

신규 내부자 보유 증가 이벤트 목록

접수일

회사명

보고자

직위

증가 주식 수

공시 원문 링크

4.5 웹 대시보드
화면 1: 오늘의 신규 이벤트

오늘 기준 신규 저장된 이벤트 리스트

컬럼

접수일 / 회사 / 보고자 / 직위 / 증가 주식 수 / 원문 링크

화면 2: 히스토리

최근 7일 / 30일 / 사용자 지정 기간

회사명 검색

보고자 검색 (옵션)

화면 3: 포트폴리오 관리

종목코드 추가/삭제

corp_code 매핑 상태 표시

5. OpenDART elestock API 명세 반영 (중요)
5.1 Endpoint
GET https://opendart.fss.or.kr/api/elestock.json

5.2 Required Parameters
Parameter	Description
crtfc_key	OpenDART 인증키 (40자리)
corp_code	회사 고유번호 (8자리)
5.3 주요 응답 필드 (사용 필드)
API Field	설명
rcept_no	공시 접수번호 (14자리)
rcept_dt	접수일자 (YYYY-MM-DD)
repror	보고자
isu_exctv_rgist_at	임원 등록 여부
isu_exctv_ofcps	직위
isu_main_shrholdr	주요주주 여부
sp_stock_lmp_cnt	보유 주식 수
sp_stock_lmp_irds_cnt	증감 주식 수
sp_stock_lmp_rate	보유 비율
sp_stock_lmp_irds_rate	증감 비율
5.4 Status / Error Code 처리 정책 (필수 반영)
Code	의미	처리 정책
000	정상	정상 수집
013	데이터 없음	정상 처리 (이벤트 없음)
020	요청 제한 초과	지수 백오프 후 재시도
021	조회 회사 수 초과	요청 분할
800	점검 중	재시도
010/011/901	키 문제	관리자 알림 + 중단
기타	오류	로그 기록

중요: 013은 오류가 아님

6. 데이터 요구사항 (Data Requirements)
핵심 테이블
companies

corp_code (PK)

stock_code

corp_name

modify_date

portfolio

stock_code (UNIQUE)

memo

created_at

insider_reports

rcept_no (UNIQUE)

corp_code

corp_name

rcept_dt

repror

isu_exctv_rgist_at

isu_exctv_ofcps

isu_main_shrholdr

holdings_cnt

delta_cnt

holdings_rate

delta_rate

raw_json

created_at

email_runs

run_date (PK)

sent_at

new_events_count

7. 비기능 요구사항 (NFR)
7.1 안정성

일부 종목 실패 시에도 전체 배치는 계속 진행

실패 종목은 다음날 재시도

7.2 성능

포트폴리오 최대 200종목 가정

배치 5분 이내 완료 목표

7.3 보안

OpenDART API Key / Gmail App Password는 서버 환경변수로 관리

클라이언트에 노출 금지

8. 스케줄링 (Vercel Cron)

Daily Cron

07:30 KST

Endpoint: /api/cron/daily-digest

Optional Weekly Cron

corpCode 마스터 갱신

Endpoint: /api/cron/sync-corpcodes

9. 중복 방지 / 아이템포턴시 정책

insider_reports.rcept_no UNIQUE

email_runs.run_date UNIQUE

동일 날짜 재실행 시

이벤트 중복 저장 없음

이메일 중복 발송 없음

10. 수용 기준 (Acceptance Criteria)

포트폴리오 종목에서 보유 증가 이벤트가 1건 이상 발생하면
→ DB 저장 + 이메일 1회 발송

신규 이벤트가 0건이면 이메일이 발송되지 않는다

같은 날 배치를 여러 번 실행해도 결과는 중복되지 않는다

013 응답은 실패로 처리되지 않는다

대시보드에서 이벤트 조회 및 공시 원문 링크가 정상 동작한다

11. 변경 이력

v1.0: 초기 MVP 정의

v1.1: 신규 0건 시 이메일 미발송 정책 추가

v1.2: OpenDART elestock 개발가이드 제약 반영

v1.3: 최종 통합본 (현재)