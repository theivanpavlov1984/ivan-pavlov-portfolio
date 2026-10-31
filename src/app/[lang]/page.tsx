import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '@/i18n'
import { SiteNav } from '@/components/SiteNav'
import { Hero } from '@/components/Hero'
import { About } from '@/components/About'
import { Principle } from '@/components/Principle'
import { Cases } from '@/components/Cases'
import { Reviews } from '@/components/Reviews'
import { Footer } from '@/components/Footer'
import { TagCursor } from '@/components/TagCursor'
import { Gutter } from '@/components/Gutter'

export default async function Page({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const dict = await getDictionary(lang)

  return (
    <>
      <SiteNav lang={lang} dict={dict} />
      <main>
        <Hero dict={dict} />
        <About dict={dict} />
        <Principle dict={dict} />
        <Cases dict={dict} />
        <Reviews dict={dict} />
      </main>
      <Footer dict={dict} />
      {/* desktop-only layers: tag cursor and editor line numbers */}
      <TagCursor />
      <Gutter />
    </>
  )
}
