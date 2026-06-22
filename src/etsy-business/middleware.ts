import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase not configured, allow all traffic (demo mode)
  if (!url || !key) return NextResponse.next()

  const response = NextResponse.next()
  const supabase = createServerClient(url, key, {
    cookies: {
      get(name) { return request.cookies.get(name)?.value },
      set(name, value, options) { response.cookies.set({ name, value, ...options }) },
      remove(name, options) { response.cookies.set({ name, value: '', ...options }) },
    },
  })

  const { data: { session } } = await supabase.auth.getSession()

  // Public routes that don't require auth
  const publicRoutes = ['/login', '/store', '/customer']
  const isPublic = publicRoutes.some((r) => request.nextUrl.pathname === r || request.nextUrl.pathname.startsWith(r + '/'))

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
