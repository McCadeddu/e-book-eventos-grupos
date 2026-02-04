// web/middleware.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protege tudo que começa com /admin
  if (pathname.startsWith("/admin")) {
    const auth = request.cookies.get("adminAuth");

    // Permite acesso à tela de login
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    // Bloqueia se não estiver autenticado
    if (!auth) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}