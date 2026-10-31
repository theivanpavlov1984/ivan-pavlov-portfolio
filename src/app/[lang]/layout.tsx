import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Script from 'next/script'
import { getDictionary, hasLocale, locales } from '@/i18n'
import { hand, mono, serif, travels } from '@/fonts'
import '../globals.css'

// intro once per visit: set classes before first paint so the hero never flashes
const introScript = `if(!matchMedia('(prefers-reduced-motion: reduce)').matches){var s=null;try{s=sessionStorage.getItem('intro')}catch(e){}if(!s)document.documentElement.classList.add('boot-pre','loading')}`

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
    title: meta.title,
    description: meta.description,
    alternates: { languages: { en: '/en', ru: '/ru' } },
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
      <body>
        {children}
        <Script id="intro" strategy="beforeInteractive">
          {introScript}
        </Script>
      </body>
    </html>
  )
}
