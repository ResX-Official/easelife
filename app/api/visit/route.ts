import { hasMatchingOrigin } from "@/lib/request-origin";
import { requestLimit } from "@/lib/request-limit";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VISITOR_COOKIE = "easerent_visitor";

export async function POST(request: Request) {
  const url = new URL(request.url);
  if (!hasMatchingOrigin(request)) return new NextResponse(null, { status: 403 });
  const page = url.searchParams.get("path") ?? request.headers.get("referer") ?? "/";
  let pathname = "/";
  try {
    pathname = new URL(page, url.origin).pathname.slice(0, 300);
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (pathname.startsWith("/admin") || pathname.startsWith("/api") || pathname.startsWith("/manage/")) {
    return new NextResponse(null, { status: 204 });
  }

  const limit = await requestLimit("visitor-event", 120, 60);
  if (!limit.allowed) return new NextResponse(null, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });

  const cookieStore = await cookies();
  const existingId = cookieStore.get(VISITOR_COOKIE)?.value;
  const isNewVisitor = !existingId || !/^[0-9a-f-]{36}$/i.test(existingId);
  const visitorId = isNewVisitor ? randomUUID() : existingId!;

  await prisma.visitorEvent.create({ data: { visitorId, path: pathname } });
  const response = new NextResponse(null, { status: 204 });
  if (isNewVisitor) {
    response.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}
