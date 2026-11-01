import { NextResponse, type NextRequest } from 'next/server'

const locales = ['en', 'ru']

// "/" and other locale-less paths go to /en; Russian is one click away in the header
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasLocale = locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))
  if (hasLocale) return

  request.nextUrl.pathname = `/en${pathname === '/' ? '' : pathname}`
  return NextResponse.redirect(request.nextUrl)
}

export const config = {
  // skip Next internals and anything with a file extension (fonts, images, PDFs)
  matcher: ['/((?!_next|.*\\..*).*)'],
}
