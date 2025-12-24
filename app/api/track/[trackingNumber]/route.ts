import { NextResponse } from 'next/server';
import { getTrackingInfo } from '@/lib/services/tracking';
import type { TrackingError } from '@/lib/types';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ trackingNumber: string }> }
) {
  try {
    // Next.js 16: params is async and must be awaited
    const { trackingNumber } = await params;

    const trackingInfo = await getTrackingInfo(trackingNumber);

    if (!trackingInfo) {
      const errorResponse: TrackingError = {
        error: 'Tracking number not found',
        trackingNumber,
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    return NextResponse.json(trackingInfo, { status: 200 });
  } catch (error) {
    const errorResponse: TrackingError = {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
