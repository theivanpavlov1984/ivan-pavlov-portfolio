'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { Locale } from '@/i18n-config'
import type { CSSVars } from '@/types/css'
import styles from './LangWipe.module.css'

type Props = { lang: Locale }

const KEY = 'langwipe' // sessionStorage: "<from>|<to>|<scroll ratio>", set right before the language changes
const COVER_MS = 520 // lines drawn and the page covered: the language is switched under it
const REVEAL_MS = 700

// the intro's layout guides as a curtain between languages: SiteNav fires a 'langwipe' event, the grid draws in
// and covers the page, the route changes underneath (scroll kept), and on the other side the lines retract.
// State lives on the root's data-state, written straight to the DOM like the rest of the motion here
export function LangWipe({ lang }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const root = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)

  // this side: cover, remember where we were, switch
  useEffect(() => {
    const onWipe = (e: Event) => {
      const to = (e as CustomEvent<Locale>).detail
      const go = () => router.push(`/${to}`, { scroll: false })
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return go()
      const el = root.current!
      label.current!.textContent = `locale / ${lang} → ${to}`
      el.dataset.state = 'cover'
      setTimeout(() => {
        const max = document.documentElement.scrollHeight - innerHeight
        try {
          sessionStorage.setItem(KEY, `${lang}|${to}|${max > 0 ? scrollY / max : 0}`)
        } catch {}
        go()
      }, COVER_MS)
    }
    addEventListener('langwipe', onWipe)
    return () => removeEventListener('langwipe', onWipe)
  }, [lang, router])

  // the other side (a remount or just a new pathname): start covered, restore the scroll, retract the lines
  useLayoutEffect(() => {
    let saved: string | null = null
    try {
      saved = sessionStorage.getItem(KEY)
      sessionStorage.removeItem(KEY)
    } catch {}
    if (!saved) return
    const [from, to, ratio] = saved.split('|')
    const el = root.current!
    label.current!.textContent = `locale / ${from} → ${to}`
    el.dataset.state = 'shown'
    scrollTo(0, Number(ratio) * (document.documentElement.scrollHeight - innerHeight))
    let raf = requestAnimationFrame(() => (raf = requestAnimationFrame(() => (el.dataset.state = 'reveal'))))
    const t = setTimeout(() => (el.dataset.state = 'idle'), REVEAL_MS)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t)
    }
  }, [pathname])

  return (
    <div ref={root} className={styles.wipe} data-state="idle" aria-hidden="true">
      <i className={styles.fill} />
      {[0, 1, 2, 3, 4].map((i) => (
        <i key={`v${i}`} className={styles.v} style={{ '--i': i } as CSSVars} />
      ))}
      {[0, 1, 2].map((i) => (
        <i key={`h${i}`} className={styles.h} style={{ '--i': i } as CSSVars} />
      ))}
      <span className={`${styles.tag} ${styles.margin}`}>margin / 24px</span>
      <span className={`${styles.tag} ${styles.axis}`}>axis / center</span>
      <span className={`${styles.tag} ${styles.mid}`}>midline</span>
      <span ref={label} className={styles.locale} />
      <span className={styles.log}>
        {'> switching locale ......... '}
        <b>ok</b>
      </span>
    </div>
  )
}
