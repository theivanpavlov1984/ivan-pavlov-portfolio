import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '@/i18n'
import { SiteNav } from '@/components/SiteNav'
import { Hero } from '@/components/Hero'
import { About } from '@/components/About'
import { Principle } from '@/components/Principle'
import { Cases } from '@/components/Cases'

export default async function Page({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const dict = await getDictionary(lang)

  return (
    <>
      <SiteNav lang={lang} dict={dict} />
      <main>
        <Hero dict={dict} />
        {/* next sections are ported from docs/prototype one by one */}
        <About dict={dict} />
        <Principle dict={dict} />
        <Cases dict={dict} />
        <section style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
          <p className="mono">reviews + footer — next step</p>
        </section>
      </main>
    </>
  )
}
