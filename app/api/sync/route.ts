import { NextResponse } from 'next/server';
import { fetchAndStoreAllHours, fetchAndStoreHour } from '@/lib/services/windborne';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { hour } = body;

    if (hour !== undefined) {
      // Sync specific hour
      if (typeof hour !== 'number' || hour < 0 || hour > 23) {
        return NextResponse.json(
          { error: 'Invalid hour. Must be between 0 and 23' },
          { status: 400 }
        );
      }

      const count = await fetchAndStoreHour(hour);
      return NextResponse.json({
        success: true,
        hour,
        recordsProcessed: count,
      });
    } else {
      // Sync all hours
      const result = await fetchAndStoreAllHours();
      return NextResponse.json({
        success: true,
        totalRecords: result.totalRecords,
        hourResults: result.hourResults,
      });
    }
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
