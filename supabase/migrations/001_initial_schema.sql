-- Companies table: stores corp_code from OpenDART
CREATE TABLE companies (
    corp_code VARCHAR(8) PRIMARY KEY,
    stock_code VARCHAR(6),
    corp_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for stock_code lookup
CREATE INDEX idx_companies_stock_code ON companies(stock_code);

-- Portfolio table: user's watchlist
CREATE TABLE portfolio (
    id SERIAL PRIMARY KEY,
    stock_code VARCHAR(6) UNIQUE NOT NULL,
    corp_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insider reports table: stores insider trading events
CREATE TABLE insider_reports (
    id SERIAL PRIMARY KEY,
    rcept_no VARCHAR(20) UNIQUE NOT NULL,
    corp_code VARCHAR(8) NOT NULL,
    corp_name VARCHAR(100),
    stock_code VARCHAR(6),
    repror VARCHAR(100),           -- 보고자
    isu_exctv_rgist_at VARCHAR(10), -- 임원등록여부
    isu_exctv_ofcps VARCHAR(100),   -- 직위
    isu_main_shrholdr VARCHAR(10),  -- 주요주주여부
    sp_stock_lmp_cnt BIGINT,        -- 특정증권등 소유주식수 (직전)
    sp_stock_lmp_irds_cnt BIGINT,   -- 특정증권등 소유주식수 (증감)
    sp_stock_lmp_rate DECIMAL(10,4), -- 특정증권등 소유비율 (직전)
    sp_stock_lmp_irds_rate DECIMAL(10,4), -- 특정증권등 소유비율 (증감)
    delta_cnt BIGINT,               -- 증감 주식수 (파싱된 값)
    rcept_dt DATE,                  -- 접수일자
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying by stock_code and date
CREATE INDEX idx_insider_reports_stock_code ON insider_reports(stock_code);
CREATE INDEX idx_insider_reports_rcept_dt ON insider_reports(rcept_dt DESC);
CREATE INDEX idx_insider_reports_delta ON insider_reports(delta_cnt);

-- Email runs table: tracks batch email execution
CREATE TABLE email_runs (
    run_date DATE PRIMARY KEY,
    events_count INT DEFAULT 0,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);
