import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  ephemeralCache: new Map(),
});

const isPublicRoute = createRouteMatcher(["/", "/billing", "/pricing", "/sign-in(.*)", "/sign-up(.*)"]);
export default clerkMiddleware(async (auth, request) => {
  try {
    const ip = request.ip ?? request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    // Avoid crashing if UPSTASH keys are completely missing
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const { success } = await ratelimit.limit(ip);
      if (!success) {
        return new NextResponse("Too Many Requests", { status: 429 });
      }
    }
  } catch (error) {
    // Fail open
    console.error("Rate limit error:", error);
  }

  if (!isPublicRoute(request)) {
    auth().protect();
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
