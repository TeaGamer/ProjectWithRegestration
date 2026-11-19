import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { DEMO_ADMIN_COOKIE, verifyDemoAdminSession } from './app/lib/demoAuth';

function isValidTokenFormat(token: string): boolean {
  return token.length >= 10 && !/^\d+$/.test(token);
}

export async function middleware(request: NextRequest) {
  const protectedPaths = ['/Kalendar', '/Dashboard'];
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath) {
    if (
      process.env.NODE_ENV === 'development' &&
      await verifyDemoAdminSession(
        request.cookies.get(DEMO_ADMIN_COOKIE)?.value,
        process.env.DEMO_ADMIN_SESSION_SECRET,
      )
    ) {
      return NextResponse.next();
    }

    const token = request.cookies.get('auth_token')?.value ||
      request.cookies.get('token')?.value ||
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    if (!token) {
      return NextResponse.redirect(new URL('/Login', request.url));
    }

    if (!isValidTokenFormat(token)) {
      const response = NextResponse.redirect(new URL('/Login', request.url));
      response.cookies.delete('token');
      return response;
    }

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const verifyResponse = await fetch(`${apiBase}/api/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "Cookie": `auth_token=${token}`,
          'Authorization': `Bearer ${token}`,
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (verifyResponse.status === 401) {
        const response = NextResponse.redirect(new URL('/Login', request.url));
        response.cookies.delete('token');
        return response;
      }
    } catch (error) {
      console.error('Failed to verify token with backend:', error);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
