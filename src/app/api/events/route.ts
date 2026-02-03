import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

// GET - List insider events (today's events by default, or by date)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date');

  // Default to today (KST)
  const today = new Date();
  today.setHours(today.getHours() + 9); // UTC to KST
  const dateStr = dateParam || today.toISOString().split('T')[0];

  // Get portfolio stock codes
  const { data: portfolio } = await supabase
    .from('portfolio')
    .select('stock_code');

  const stockCodes = portfolio?.map((p) => p.stock_code) || [];

  if (stockCodes.length === 0) {
    return NextResponse.json([]);
  }

  // Get events for portfolio stocks with delta_cnt > 0
  const { data, error } = await supabase
    .from('insider_reports')
    .select('*')
    .in('stock_code', stockCodes)
    .gt('delta_cnt', 0)
    .gte('rcept_dt', dateStr)
    .order('delta_cnt', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
