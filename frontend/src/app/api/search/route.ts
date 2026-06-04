import { NextRequest, NextResponse } from "next/server";
import { ratelimit } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  // Use IP as identifier for rate limiting
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: "Too Many Requests" },
      { status: 429 }
    );
  }

  // Dummy search logic
  return NextResponse.json({ success: true, results: [] });
}
