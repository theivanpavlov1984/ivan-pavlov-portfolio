import { NextResponse, type NextRequest } from 'next/server'

const locales = ['en', 'ru']

// "/" and other locale-less paths go to /ru for Russian-speaking browsers, /en for everyone else
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasLocale = locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))
  if (hasLocale) return

  const accept = request.headers.get('accept-language') ?? ''
  const locale = /^ru\b|,\s*ru\b/i.test(accept) ? 'ru' : 'en'
  request.nextUrl.pathname = `/${locale}${pathname === '/' ? '' : pathname}`
  return NextResponse.redirect(request.nextUrl)
}

export const config = {
  // skip Next internals and anything with a file extension (fonts, images, PDFs)
  matcher: ['/((?!_next|.*\\..*).*)'],
}
