import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { parseStringPromise } from 'xml2js';
import { supabase } from '@/lib/supabase/server';
import { CorpCodeItem } from '@/lib/opendart/types';
import { downloadCorpCode } from '@/lib/opendart/client';

// Verify cron secret
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;
  const token = authHeader.replace('Bearer ', '');
  return token === process.env.CRON_SECRET;
}

export async function POST(request: NextRequest) {
  // Auth check
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Download ZIP file
    const zipBuffer = await downloadCorpCode();

    // Unzip
    const zip = await JSZip.loadAsync(zipBuffer);
    const xmlFile = zip.file('CORPCODE.xml');

    if (!xmlFile) {
      return NextResponse.json(
        { error: 'CORPCODE.xml not found in ZIP' },
        { status: 500 }
      );
    }

    const xmlContent = await xmlFile.async('text');

    // Parse XML
    const result = await parseStringPromise(xmlContent, {
      explicitArray: false,
    });

    const corpList = result.result.list;
    const items: CorpCodeItem[] = Array.isArray(corpList) ? corpList : [corpList];

    // Filter companies with stock_code (listed companies only)
    const listedCompanies = items.filter(
      (item) => item.stock_code && item.stock_code.trim() !== ''
    );

    // Batch upsert to database
    const BATCH_SIZE = 500;
    let inserted = 0;

    for (let i = 0; i < listedCompanies.length; i += BATCH_SIZE) {
      const batch = listedCompanies.slice(i, i + BATCH_SIZE).map((item) => ({
        corp_code: item.corp_code,
        stock_code: item.stock_code.trim(),
        corp_name: item.corp_name,
      }));

      const { error } = await supabase.from('companies').upsert(batch, {
        onConflict: 'corp_code',
      });

      if (error) {
        console.error('Batch upsert error:', error);
      } else {
        inserted += batch.length;
      }
    }

    return NextResponse.json({
      success: true,
      total: items.length,
      listed: listedCompanies.length,
      inserted,
    });
  } catch (error) {
    console.error('Import corp error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Import failed',
      },
      { status: 500 }
    );
  }
}
