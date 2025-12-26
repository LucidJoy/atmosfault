import { NextResponse } from "next/server";
import { getDHLTrackingInfo } from "@/lib/services/dhl-tracking";
import { checkRateLimit } from "@/lib/ratelimit";
import type { TrackingError } from "@/lib/types/dhl-tracking";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ trackingNumber: string }> }
) {
  try {
    // Rate limiting check
    const { success, remaining, reset } = await checkRateLimit(request);

    if (!success) {
      const errorResponse: TrackingError = {
        error: "Too many requests. Please try again later.",
      };
      const retryAfterSeconds = reset ? Math.ceil(reset / 1000) : 60;
      return NextResponse.json(errorResponse, {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds),
          "X-RateLimit-Remaining": String(remaining || 0),
          "X-RateLimit-Reset": new Date(
            Date.now() + (reset || 60000)
          ).toISOString(),
        },
      });
    }

    // Next.js 16: params is async and must be awaited
    const { trackingNumber } = await params;

    const trackingInfo = await getDHLTrackingInfo(trackingNumber);

    if (!trackingInfo) {
      const errorResponse: TrackingError = {
        error: "Tracking number not found or DHL API unavailable",
        trackingNumber,
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    return NextResponse.json(trackingInfo, {
      status: 200,
      headers: {
        "X-RateLimit-Remaining": String(remaining || 0),
        "X-RateLimit-Reset": new Date(
          Date.now() + (reset || 60000)
        ).toISOString(),
      },
    });
  } catch (error) {
    const errorResponse: TrackingError = {
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
