export interface Company {
  corp_code: string;
  stock_code: string | null;
  corp_name: string;
  created_at?: string;
}

export interface Portfolio {
  id: number;
  stock_code: string;
  corp_name: string | null;
  created_at?: string;
}

export interface InsiderReport {
  id: number;
  rcept_no: string;
  corp_code: string;
  corp_name: string | null;
  stock_code: string | null;
  repror: string | null;
  isu_exctv_rgist_at: string | null;
  isu_exctv_ofcps: string | null;
  isu_main_shrholdr: string | null;
  sp_stock_lmp_cnt: number | null;
  sp_stock_lmp_irds_cnt: number | null;
  sp_stock_lmp_rate: number | null;
  sp_stock_lmp_irds_rate: number | null;
  delta_cnt: number | null;
  rcept_dt: string | null;
  created_at?: string;
}

export interface EmailRun {
  run_date: string;
  events_count: number;
  sent_at?: string;
}
