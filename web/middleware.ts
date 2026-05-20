import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_AUTH_COOKIE = "adminAuth";

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (normalized.length % 4 || 4)) % 4;
  return atob(normalized + "=".repeat(padding));
}

async function sign(payload: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );

  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function isValidAdminCookie(cookieValue: string | undefined) {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!cookieValue || !secret) {
    return false;
  }

  const [payload, signature] = cookieValue.split(".");

  if (!payload || !signature) {
    return false;
  }

  const expected = await sign(payload, secret);

  if (expected !== signature) {
    return false;
  }

  try {
    const decoded = JSON.parse(fromBase64Url(payload)) as { exp?: number };
    return !!decoded.exp && decoded.exp > Date.now();
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const auth = request.cookies.get(ADMIN_AUTH_COOKIE)?.value;

    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    if (!(await isValidAdminCookie(auth))) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}
