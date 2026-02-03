// OpenDART API Response Types

export interface OpenDartResponse<T> {
  status: string;
  message: string;
  list?: T[];
}

// elestock API response item
export interface ElestockItem {
  rcept_no: string;         // 접수번호
  rcept_dt: string;         // 접수일자 (YYYYMMDD)
  corp_code: string;        // 고유번호
  corp_name: string;        // 회사명
  repror: string;           // 보고자
  isu_exctv_rgist_at: string; // 임원등록여부 (Y/N)
  isu_exctv_ofcps: string;  // 임원 직위
  isu_main_shrholdr: string; // 주요주주여부 (Y/N)
  sp_stock_lmp_cnt: string; // 특정증권등 소유주식수 (직전)
  sp_stock_lmp_irds_cnt: string; // 특정증권등 소유주식수 (증감)
  sp_stock_lmp_rate: string; // 특정증권등 소유비율 (직전)
  sp_stock_lmp_irds_rate: string; // 특정증권등 소유비율 (증감)
}

// OpenDART status codes
export const OPENDART_STATUS = {
  SUCCESS: '000',           // 정상
  NO_DATA: '013',           // 데이터 없음
  EXCEEDED_LIMIT: '020',    // 요청 제한 초과
  SERVER_ERROR: '800',      // 시스템 점검
  INVALID_KEY: '010',       // API키 오류
  USAGE_LIMIT: '011',       // 사용량 제한
  UNREGISTERED_IP: '901',   // 미등록 IP
} as const;

// corpCode.xml item
export interface CorpCodeItem {
  corp_code: string;
  corp_name: string;
  stock_code: string;
  modify_date: string;
}
