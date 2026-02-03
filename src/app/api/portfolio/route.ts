import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

// GET - List all portfolio items
export async function GET() {
  const { data, error } = await supabase
    .from('portfolio')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST - Add stock to portfolio
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stock_code } = body;

    if (!stock_code || !/^\d{6}$/.test(stock_code)) {
      return NextResponse.json(
        { error: 'Invalid stock code. Must be 6 digits.' },
        { status: 400 }
      );
    }

    // Look up company name from companies table
    const { data: company } = await supabase
      .from('companies')
      .select('corp_name')
      .eq('stock_code', stock_code)
      .single();

    const { data, error } = await supabase
      .from('portfolio')
      .insert({
        stock_code,
        corp_name: company?.corp_name || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Stock already in portfolio' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

// DELETE - Remove stock from portfolio
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const stockCode = searchParams.get('stock_code');

  if (!stockCode) {
    return NextResponse.json(
      { error: 'stock_code is required' },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from('portfolio')
    .delete()
    .eq('stock_code', stockCode);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
