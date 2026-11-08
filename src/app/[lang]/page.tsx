import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '@/i18n'
import { SiteNav } from '@/components/SiteNav'
import { Hero } from '@/components/Hero'
import { About } from '@/components/About'
import { Principle } from '@/components/Principle'
import { Cases } from '@/components/Cases'
import { Showreel } from '@/components/Showreel'
import { Experience } from '@/components/Experience'
import { Reviews } from '@/components/Reviews'
import { Footer } from '@/components/Footer'
import { TagCursor } from '@/components/TagCursor'
import { Gutter } from '@/components/Gutter'
import { LangWipe } from '@/components/LangWipe'

export default async function Page({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const dict = await getDictionary(lang)

  return (
    <>
      {/* first Tab stop: jumps past the hero, showreel and about straight to the cases */}
      <a className="skip mono" href="#work">
        {dict.header.skip}
      </a>
      <SiteNav lang={lang} dict={dict} />
      <main>
        <Hero dict={dict} />
        <Showreel dict={dict} />
        <About dict={dict} />
        <Principle dict={dict} />
        <Cases dict={dict} />
        <Experience dict={dict} />
        <Reviews dict={dict} />
      </main>
      <Footer dict={dict} />
      {/* desktop-only layers: tag cursor and editor line numbers */}
      <TagCursor />
      <Gutter />
      <LangWipe lang={lang} />
    </>
  )
}
