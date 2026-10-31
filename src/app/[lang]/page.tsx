import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '@/i18n'
import { SiteNav } from '@/components/SiteNav'
import { Hero } from '@/components/Hero'

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
        <section id="about" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
          <p className="mono">about — next step</p>
        </section>
      </main>
    </>
  )
}
