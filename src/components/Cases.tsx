'use client'

import { useEffect, useRef, useState } from 'react'
import type { Dictionary } from '@/i18n-config'
import type { CSSVars } from '@/types/css'
import { RevealHeading } from './RevealHeading'
import { CaseLayers } from './CaseLayers'
import { Orbit } from './Orbit'
import { Scratch } from './Scratch'
import styles from './Cases.module.css'

type Props = { dict: Pick<Dictionary, 'work' | 'orbit'> }

// selected work: sticky accordion, the active case follows scroll progress (Pamidor) + "before → after" and 3 numbers (Mauricio)
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
                    </div>
                    {c.visual === 'scratch' ? (
                      <Scratch hint={work.eraseHint} />
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
