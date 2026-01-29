import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

// Health check endpoint to verify KV is configured
export async function GET() {
  try {
    // Check if environment variables are set
    const hasKVUrl = !!process.env.REDIS_URL;
    const hasKVToken = !!process.env.VERCEL_OIDC_TOKEN;

    if (!hasKVUrl || !hasKVToken) {
      return NextResponse.json(
        {
          configured: false,
          error: "KV environment variables are missing",
          hasKVUrl,
          hasKVToken,
          message:
            "Please create a KV database in your Vercel project and ensure environment variables are set.",
        },
        { status: 503 }
      );
    }

    // Try a simple operation to verify connection
    try {
      await kv.ping();
      return NextResponse.json({
        configured: true,
        connected: true,
        message: "KV is properly configured and connected",
      });
    } catch (pingError) {
      return NextResponse.json(
        {
          configured: true,
          connected: false,
          error: pingError instanceof Error ? pingError.message : "Connection failed",
          message: "KV is configured but connection test failed",
        },
        { status: 503 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        configured: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to check KV configuration",
      },
      { status: 500 }
    );
  }
}
