import { NextRequest, NextResponse } from 'next/server'
import { verifySession, COOKIE_NAME } from '@/lib/auth'

// ==========================================
// ROUTE PROTECTION MIDDLEWARE
// ==========================================

// Public routes — no auth needed
const PUBLIC_API_ROUTES = [
  '/api/auth',
  '/api/auth/register',
  '/api/physical-cards',  // GET only (public catalog)
  '/api/card-sections',   // GET only (public catalog)
  '/api/flash-products',  // GET only (public catalog)
  '/api/publications',    // GET only (public display)
  '/api/stats',           // public stats counter
  '/api/subscription-plans', // GET only (public plans)
  '/api/download',        // public download of site zip
  '/api/document-requests', // GET (public tracking) + POST (public submission)
]

// Routes that require ADMIN role for write operations
const ADMIN_WRITE_ROUTES = [
  '/api/flash-products',
  '/api/card-sections',
  '/api/physical-cards',
  '/api/publications',
  '/api/subscription-plans',
  '/api/sim-balances',
  '/api/promotional-emails',
  '/api/cabine',
  '/api/reports',
  '/api/admin/loyalty',
  '/api/document-requests', // PUT/DELETE = admin only (POST is public via exception)
]

// Routes that require any authenticated user
const AUTH_REQUIRED_ROUTES = [
  '/api/transactions',
  '/api/recharges',
  '/api/subscriptions',
  '/api/wave-payments',
  '/api/loyalty',
  '/api/flash-orders',
  '/api/promo-codes',
]

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))
}

function isAdminWriteRoute(pathname: string): boolean {
  return ADMIN_WRITE_ROUTES.some(route => pathname.startsWith(route))
}

function isAuthRequiredRoute(pathname: string): boolean {
  return AUTH_REQUIRED_ROUTES.some(route => pathname.startsWith(route))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only protect API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Allow OPTIONS for CORS preflight
  if (request.method === 'OPTIONS') {
    return NextResponse.next()
  }

  // Allow public GET requests on public routes
  if (request.method === 'GET' && isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Allow POST on flash-orders, physical-orders, and transactions (public ordering)
  // Transactions POST is needed for card purchases (PHYSICAL_CARD type)
  if (request.method === 'POST' && (pathname === '/api/flash-orders' || pathname === '/api/physical-orders' || pathname === '/api/transactions')) {
    return NextResponse.next()
  }

  // Allow public POST on document-requests (clients sending documents for processing)
  if (request.method === 'POST' && pathname === '/api/document-requests') {
    return NextResponse.next()
  }

  // Allow public POST on /api/upload (clients uploading their documents)
  // The route itself restricts: folder=documents => document MIME types; otherwise images only
  if (request.method === 'POST' && pathname === '/api/upload') {
    return NextResponse.next()
  }

  // Allow POST on auth routes (login/register)
  if (pathname === '/api/auth' || pathname === '/api/auth/register') {
    return NextResponse.next()
  }

  // For all other routes, verify session
  const token = request.cookies.get(COOKIE_NAME)?.value

  if (!token) {
    return NextResponse.json(
      { error: 'Non authentifié — veuillez vous connecter' },
      { status: 401 }
    )
  }

  const session = await verifySession(token)

  if (!session) {
    // Clear invalid cookie
    const response = NextResponse.json(
      { error: 'Session expirée — veuillez vous reconnecter' },
      { status: 401 }
    )
    response.cookies.delete(COOKIE_NAME)
    return response
  }

  // Check admin access for write operations on admin routes
  if (isAdminWriteRoute(pathname) && request.method !== 'GET') {
    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès refusé — droits administrateur requis' },
        { status: 403 }
      )
    }
  }

  // Check admin access for admin-only routes
  if (pathname.startsWith('/api/reports') || pathname.startsWith('/api/sim-balances') || pathname.startsWith('/api/promotional-emails') || pathname.startsWith('/api/admin/')) {
    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès refusé — droits administrateur requis' },
        { status: 403 }
      )
    }
  }

  // Add session info to request headers for downstream use
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', session.userId)
  requestHeaders.set('x-user-email', session.email)
  requestHeaders.set('x-user-role', session.role)
  if (session.cabineId) {
    requestHeaders.set('x-cabine-id', session.cabineId)
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
}
