import { NextRequest, NextResponse } from 'next/server';
import { collectInsiderData } from '@/lib/collector';

// Verify cron secret
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;
  const token = authHeader.replace('Bearer ', '');
  return token === process.env.CRON_SECRET;
}

export async function GET(request: NextRequest) {
  // Auth check
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = await collectInsiderData({ sendEmail: true });

  if (!results.success) {
    return NextResponse.json(
      {
        error: results.message || 'Collection failed',
        results,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    results,
  });
}
