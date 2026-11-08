'use client'

import { useEffect, useRef, useState } from 'react'
import Image, { type StaticImageData } from 'next/image'
import type { Dictionary } from '@/i18n-config'
import type { CSSVars } from '@/types/css'
import { RevealHeading } from './RevealHeading'
import { CaseLayers } from './CaseLayers'
import { Orbit } from './Orbit'
import transneft from '@/assets/cases/transneft.jpg'
import troika from '@/assets/cases/troika.jpg'
import epamLight from '@/assets/cases/epam-light.jpg'
import epamDark from '@/assets/cases/epam-dark.jpg'
import nominex from '@/assets/cases/nominex.jpg'
import mavfarm from '@/assets/cases/mavfarm.jpg'
import styles from './Cases.module.css'

type Props = { dict: Pick<Dictionary, 'work' | 'orbit'> }

// case photos (visual: "photo"), by case id; a second one fades in on hover (EPAM UUI: light theme → dark)
const photos: Record<string, [StaticImageData, StaticImageData?]> = {
  '01': [transneft],
  '02': [troika],
  '03': [epamLight, epamDark],
  '04': [nominex],
  '05': [mavfarm],
}

// selected work: sticky accordion, the active case follows scroll progress (Pamidor) + "before → after" and 3 numbers (Mauricio).
// Phones keep the accordion in a compact form, so the open case's photo can still take the full width
export function Cases({ dict }: Props) {
  const { work } = dict
  const section = useRef<HTMLElement>(null)
  const cases = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(-1)

  useEffect(() => {
    const html = document.documentElement
    let raf = 0
    const onScroll = () => {
      const c = cases.current!, vh = innerHeight
      const p = Math.min(1, Math.max(0, -c.getBoundingClientRect().top / (c.offsetHeight - vh)))
      // setState with the same value is a no-op, so React re-renders only when the case changes
      const n = work.cases.length, i = Math.min(n - 1, Math.floor(p * n))
      setActive(i)
      // progress inside the active case drives its visual (written to the DOM, no re-render)
      c.style.setProperty('--e', String(Math.min(1, Math.max(0, (p * n - i - 0.12) / 0.55))))
      c.style.setProperty('--t', String(Math.min(1, p * n - i))) // raw 0 → 1 through the case, for the photo zoom
      // dark section under the header → light header
      const r = section.current!.getBoundingClientRect()
      html.dataset.workDark = String(r.top < 60 && r.bottom > 60)
    }
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(onScroll)
    }
    addEventListener('scroll', schedule, { passive: true })
    onScroll()
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('scroll', schedule)
    }
  }, [work.cases.length])

  // the same scroll position the active case is read from: the middle of the case's share of the stretch
  const openCase = (i: number) => {
    const c = cases.current!
    const n = work.cases.length
    scrollTo({ top: c.getBoundingClientRect().top + scrollY + ((i + 0.5) / n) * (c.offsetHeight - innerHeight) })
  }

  return (
    <section ref={section} className={styles.work} id="work" data-dark="">
      <div className={styles.head}>
        <RevealHeading before={work.title} className={styles.title} />
        <span className="mono">{work.meta}</span>
      </div>

      <div ref={cases} id="cases" className={styles.cases} style={{ '--n': work.cases.length } as CSSVars}>
        <div className={styles.stick}>
          {work.cases.map((c, i) => (
            <article key={c.id} className={styles.case} data-case-item="" data-on={i === active}>
              <div className={styles.bar}>
                <span className="mono">{c.id}</span>
                <h3 className={styles.name}>{c.name}</h3>
                <span className="mono">{c.meta}</span>
              </div>
              {/* grid-template-rows 0fr → 1fr animates height: auto */}
              <div className={styles.body}>
                <div>
                  <div className={styles.grid}>
                    <div>
                      <p className={styles.line}>
                        <s>{c.before}</s> → {c.after}
                      </p>
                      <div className={styles.nums}>
                        {c.nums.map((n) => (
                          <div key={n.label}>
                            <b>{n.value}</b>
                            <span className="mono">{n.label}</span>
                          </div>
                        ))}
                      </div>
                      {/* how it got from "before" to "after"; desktop only, the pinned accordion has no room for it on phones */}
                      <p className={styles.did}>
                        <span className="mono">{work.didLabel}</span>
                        {c.did}
                      </p>
                    </div>
                    {c.visual === 'photo' ? (
                      // a live product: the whole photo is the link, the round button only appears with the colour on hover
                      <a
                        className={`${styles.visual} ${styles.photo}`}
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={c.url ? `${work.visit}: ${c.name}` : undefined}
                        // keyboard: every case is a Tab stop; focusing a closed one scrolls the accordion to it, so it opens
                        onFocus={() => i !== active && openCase(i)}
                      >
                        <Image src={photos[c.id][0]} alt={c.name} sizes="(max-width: 760px) 100vw, 45vw" />
                        {photos[c.id][1] ? (
                          <Image src={photos[c.id][1]!} alt="" className={styles.alt} sizes="(max-width: 760px) 100vw, 45vw" />
                        ) : null}
                        {c.url ? (
                          <span className={styles.visit} aria-hidden="true">
                            <span className="mono">{work.visit}</span>
                            <i>↗</i>
                          </span>
                        ) : null}
                      </a>
                    ) : c.visual === 'layers' ? (
                      <CaseLayers />
                    ) : (
                      <div className={styles.visual} data-tone={c.visual} />
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <Orbit dict={dict} />
    </section>
  )
}
