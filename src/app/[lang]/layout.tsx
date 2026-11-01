import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary, hasLocale, locales } from '@/i18n'
import { hand, mono, serif, travels } from '@/fonts'
import '../globals.css'

// intro once per visit: set classes before first paint so the hero never flashes
const introScript = `if(!matchMedia('(prefers-reduced-motion: reduce)').matches){var s=null;try{s=sessionStorage.getItem('intro')}catch(e){}if(!s)document.documentElement.classList.add('boot-pre','loading')}`

// production address; Vercel sets VERCEL_PROJECT_PRODUCTION_URL (follows a custom domain once it's added)
const SITE = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL ?? 'ivanpavlov.vercel.app'}`
const OG_IMAGE = '/opengraph-image.png'

// /en and /ru are prerendered at build time; any other first segment is a 404
export const dynamicParams = false

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }))
}

export async function generateMetadata({ params }: LayoutProps<'/[lang]'>): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const { meta } = await getDictionary(lang)
  return {
    // absolute base for the og:image and og:url links (LinkedIn, Telegram and co. need full URLs)
    metadataBase: new URL(SITE),
    title: meta.title,
    description: meta.description,
    alternates: { languages: { en: '/en', ru: '/ru' } },
    // the preview card: the hero, 1200×630 @2x, served from app/opengraph-image.png. Linked by hand, because
    // the root layout lives in [lang] and a metadata file there would get a /-/ path that 404s in production
    openGraph: {
      images: [{ url: OG_IMAGE, width: 2400, height: 1260, alt: meta.title }],
      type: 'website',
      url: `/${lang}`,
      siteName: 'Ivan Pavlov',
      title: meta.title,
      description: meta.description,
      locale: lang === 'ru' ? 'ru_RU' : 'en_US',
    },
    twitter: { card: 'summary_large_image', title: meta.title, description: meta.description, images: [OG_IMAGE] },
  }
}

export default async function RootLayout({ children, params }: LayoutProps<'/[lang]'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  return (
    // intro classes are added to <html> before React hydrates, hence suppressHydrationWarning
    <html
      lang={lang}
      className={`${travels.variable} ${mono.variable} ${serif.variable} ${hand.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* must run inline before first paint: next/script beforeInteractive is queued and runs after paint (hero flashes).
            React logs a dev-only warning about this tag; it is only needed on the initial HTML load. */}
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
