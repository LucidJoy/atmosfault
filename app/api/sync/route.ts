import { NextResponse } from 'next/server';
import { fetchAndStoreAllHours, fetchAndStoreHour } from '@/lib/services/windborne';
import { checkSyncRateLimit } from '@/lib/ratelimit';

export async function POST(request: Request) {
  try {
    // Stricter rate limiting for sync endpoint (resource-intensive)
    const { success, remaining, resetIn } = await checkSyncRateLimit(request);

    if (!success) {
      const retryAfterSeconds = resetIn ? Math.ceil(resetIn / 1000) : 3600;
      return NextResponse.json(
        {
          error: 'Sync limit exceeded. Please try again later.',
          message: `Maximum 5 syncs per hour. Try again in ${retryAfterSeconds} seconds.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSeconds),
            'X-RateLimit-Remaining': String(remaining || 0),
            'X-RateLimit-Reset': new Date(Date.now() + (resetIn || 3600000)).toISOString(),
          },
        }
      );
    }

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
      return NextResponse.json(
        {
          success: true,
          hour,
          recordsProcessed: count,
        },
        {
          headers: {
            'X-RateLimit-Remaining': String(remaining || 0),
            'X-RateLimit-Reset': new Date(Date.now() + (resetIn || 3600000)).toISOString(),
          },
        }
      );
    } else {
      // Sync all hours
      const result = await fetchAndStoreAllHours();
      return NextResponse.json(
        {
          success: true,
          totalRecords: result.totalRecords,
          hourResults: result.hourResults,
        },
        {
          headers: {
            'X-RateLimit-Remaining': String(remaining || 0),
            'X-RateLimit-Reset': new Date(Date.now() + (resetIn || 3600000)).toISOString(),
          },
        }
      );
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
