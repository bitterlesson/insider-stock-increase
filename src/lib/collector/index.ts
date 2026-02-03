import { supabase } from '@/lib/supabase/server';
import { fetchElestock } from '@/lib/opendart/client';
import { sendInsiderAlert } from '@/lib/email/sender';
import { InsiderReport } from '@/types/database';

export interface CollectResult {
  success: boolean;
  processed: number;
  newEvents: number;
  errors: string[];
  emailSent: boolean;
  message?: string;
}

export interface CollectProgress {
  current: number;
  total: number;
}

/**
 * Collect insider trading data from OpenDART
 * @param options.sendEmail - Whether to send email notification
 * @param options.onProgress - Progress callback
 */
export async function collectInsiderData(options?: {
  sendEmail?: boolean;
  onProgress?: (progress: CollectProgress) => void;
}): Promise<CollectResult> {
  const { sendEmail = true, onProgress } = options || {};

  const results: CollectResult = {
    success: false,
    processed: 0,
    newEvents: 0,
    errors: [],
    emailSent: false,
  };

  try {
    // Get portfolio stocks with their corp_codes
    const { data: portfolio } = await supabase
      .from('portfolio')
      .select('stock_code, corp_name');

    if (!portfolio || portfolio.length === 0) {
      results.message = 'No stocks in portfolio';
      results.success = true;
      return results;
    }

    // Get corp_codes for portfolio stocks
    const stockCodes = portfolio.map((p) => p.stock_code);
    const { data: companies } = await supabase
      .from('companies')
      .select('corp_code, stock_code')
      .in('stock_code', stockCodes);

    if (!companies || companies.length === 0) {
      results.message = 'No matching companies found. Run import-corp first.';
      results.success = true;
      return results;
    }

    const newEvents: InsiderReport[] = [];
    const today = new Date();
    today.setHours(today.getHours() + 9); // UTC to KST
    const todayStr = today.toISOString().split('T')[0];

    // Fetch elestock for each company
    for (const company of companies) {
      const result = await fetchElestock(company.corp_code);
      results.processed++;

      // Notify progress
      if (onProgress) {
        onProgress({ current: results.processed, total: companies.length });
      }

      if (result.shouldStop) {
        results.errors.push(`Fatal error: ${result.error}`);
        break;
      }

      if (!result.success) {
        results.errors.push(`${company.corp_code}: ${result.error}`);
        continue;
      }

      // Filter for positive delta (buying) and today's date
      const buyingEvents =
        result.data?.filter((r) => (r.delta_cnt || 0) > 0) || [];

      for (const event of buyingEvents) {
        // Try to insert (ignore duplicates)
        const { data: inserted, error } = await supabase
          .from('insider_reports')
          .upsert(
            {
              ...event,
              stock_code: company.stock_code,
            },
            {
              onConflict: 'rcept_no',
              ignoreDuplicates: true,
            }
          )
          .select()
          .single();

        if (!error && inserted) {
          // Check if this is today's event
          if (inserted.rcept_dt === todayStr) {
            newEvents.push(inserted as InsiderReport);
            results.newEvents++;
          }
        }
      }

      // Rate limiting: small delay between API calls
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Send email if there are new events
    if (sendEmail && newEvents.length > 0) {
      const emailResult = await sendInsiderAlert(newEvents);
      results.emailSent = emailResult.success;

      if (emailResult.success) {
        // Record email run
        await supabase.from('email_runs').upsert({
          run_date: todayStr,
          events_count: newEvents.length,
        });
      } else if (emailResult.error) {
        results.errors.push(`Email error: ${emailResult.error}`);
      }
    }

    results.success = true;
    return results;
  } catch (error) {
    results.success = false;
    results.message = error instanceof Error ? error.message : 'Collection failed';
    return results;
  }
}
