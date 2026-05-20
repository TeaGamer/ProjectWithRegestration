import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Базова валідація токена: перевіряємо, що це не тривіальний рядок
function isValidTokenFormat(token: string): boolean {
  // Токен повинен мати розумну довжину (не менше 10 символів)
  // щоб запобігти проходженню тривіальних значень на кшталт "abc"
  if (!token || token.length < 10) {
    return false;
  }

  // Перевіряємо, що токен не лише цифри або однакові символи
  if (/^\d+$/.test(token)) {
    return false;
  }

  return true;
}

export async function middleware(request: NextRequest) {
  // Захищені маршрути
  const protectedPaths = ['/Kalendar', '/Dashboard'];
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath) {
    // Перевіряємо токен в cookies або headers
    const token = request.cookies.get('token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      // Перенаправляємо на логін, якщо токена немає
      return NextResponse.redirect(new URL('/Login', request.url));
    }

    // Перевіряємо валідність формату токена
    if (!isValidTokenFormat(token)) {
      // Видаляємо невалідний токен та перенаправляємо на логін
      const response = NextResponse.redirect(new URL('/Login', request.url));
      response.cookies.delete('token');
      return response;
    }

    // Верифікуємо токен з бекенд API
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const verifyResponse = await fetch(`${apiBase}/api/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (verifyResponse.status === 401) {
        // Токен явно відхилений бекендом (Unauthorized)
        const response = NextResponse.redirect(new URL('/Login', request.url));
        response.cookies.delete('token');
        return response;
      }
      // Будь-який інший не-ok статус (404, 500, тощо) — endpoint може бути
      // не реалізований, дозволяємо запит
    } catch (error) {
      // Якщо не можна з'єднатися з бекенд API, дозволяємо запит
      console.error('Failed to verify token with backend:', error);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};