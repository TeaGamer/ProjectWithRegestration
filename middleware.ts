import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
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
      // Перенаправляємо на логін
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Тут можна додати перевірку валідності токена, якщо потрібно
    // Наприклад, декодувати JWT або перевірити з API
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