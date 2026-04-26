import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'bpn-admin-token';

function getSecret(): Uint8Array {
  const secret = process.env.ADMIN_JWT_SECRET || 'dev-secret-change-in-production';
  return new TextEncoder().encode(secret);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect admin dashboard/submission pages
  const isAdminPage = pathname.startsWith('/admin/dashboard') || pathname.startsWith('/admin/submission');
  // Protect admin API routes
  const isAdminApi = pathname.startsWith('/api/admin/') && !pathname.startsWith('/api/admin/login');
  const isPdfApi = pathname.startsWith('/api/pdf/');

  if (!isAdminPage && !isAdminApi && !isPdfApi) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    if (isAdminPage) {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await jwtVerify(token, getSecret());
    return NextResponse.next();
  } catch {
    if (isAdminPage) {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export const config = {
  matcher: [
    '/admin/dashboard/:path*',
    '/admin/submission/:path*',
    '/api/admin/:path*',
    '/api/pdf/:path*',
  ],
};
