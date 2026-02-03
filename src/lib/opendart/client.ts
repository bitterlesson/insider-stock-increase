import { OpenDartResponse, ElestockItem, OPENDART_STATUS } from './types';
import { parseCommaNumber, parseRate, formatDate } from './parser';
import { InsiderReport } from '@/types/database';

const API_KEY = process.env.OPENDART_API_KEY!;
const BASE_URL = 'https://opendart.fss.or.kr/api';

export interface FetchResult {
  success: boolean;
  data?: Partial<InsiderReport>[];
  error?: string;
  shouldStop?: boolean;
}

/**
 * Fetch insider stock trading reports (elestock) for a given corp_code
 */
export async function fetchElestock(corpCode: string): Promise<FetchResult> {
  const url = `${BASE_URL}/elestock.json?crtfc_key=${API_KEY}&corp_code=${corpCode}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const data: OpenDartResponse<ElestockItem> = await response.json();

    // Handle status codes
    switch (data.status) {
      case OPENDART_STATUS.SUCCESS:
        // Parse and transform data
        const reports = (data.list || []).map((item) => ({
          rcept_no: item.rcept_no,
          corp_code: item.corp_code,
          corp_name: item.corp_name,
          repror: item.repror,
          isu_exctv_rgist_at: item.isu_exctv_rgist_at,
          isu_exctv_ofcps: item.isu_exctv_ofcps,
          isu_main_shrholdr: item.isu_main_shrholdr,
          sp_stock_lmp_cnt: parseCommaNumber(item.sp_stock_lmp_cnt),
          sp_stock_lmp_irds_cnt: parseCommaNumber(item.sp_stock_lmp_irds_cnt),
          sp_stock_lmp_rate: parseRate(item.sp_stock_lmp_rate),
          sp_stock_lmp_irds_rate: parseRate(item.sp_stock_lmp_irds_rate),
          delta_cnt: parseCommaNumber(item.sp_stock_lmp_irds_cnt),
          rcept_dt: formatDate(item.rcept_dt),
        }));
        return { success: true, data: reports };

      case OPENDART_STATUS.NO_DATA:
        // No data is normal - just skip
        return { success: true, data: [] };

      case OPENDART_STATUS.EXCEEDED_LIMIT:
      case OPENDART_STATUS.SERVER_ERROR:
        // Retry-able errors - skip this one and continue
        return { success: false, error: data.message };

      case OPENDART_STATUS.INVALID_KEY:
      case OPENDART_STATUS.USAGE_LIMIT:
      case OPENDART_STATUS.UNREGISTERED_IP:
        // Fatal errors - stop processing
        return { success: false, error: data.message, shouldStop: true };

      default:
        return { success: false, error: `Unknown status: ${data.status}` };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Download and extract corpCode.xml from OpenDART
 */
export async function downloadCorpCode(): Promise<ArrayBuffer> {
  const url = `${BASE_URL}/corpCode.xml?crtfc_key=${API_KEY}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download corpCode: ${response.status}`);
  }

  return response.arrayBuffer();
}
