import { NextResponse } from 'next/server';
import { collectInsiderData } from '@/lib/collector';

/**
 * Manual collection endpoint - triggered by user button click
 * No email sent on manual collection
 */
export async function POST() {
  try {
    const results = await collectInsiderData({ 
      sendEmail: false // Don't send email on manual collection
    });

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        processed: 0,
        newEvents: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        emailSent: false,
        message: 'Collection failed',
      },
      { status: 500 }
    );
  }
}
