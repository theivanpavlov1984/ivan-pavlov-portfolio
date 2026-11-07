'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Dictionary } from '@/i18n-config'
import type { CSSVars } from '@/types/css'
import { RevealHeading } from './RevealHeading'
import styles from './Experience.module.css'

type Props = { dict: Pick<Dictionary, 'experience'> }

// a coded mini interface per discipline instead of a picture (the About icons, grown up); each loops while shown
const scenes: ReactNode[] = [
  // product design: a screen assembles itself from blocks
  <div key="p" className={`${styles.scene} ${styles.product}`}>
    <i className={styles.pHead} />
    <i className={styles.pCard} />
    <i className={styles.pRow} />
    <i className={styles.pRow} />
    <i className={styles.pBtn} />
  </div>,
  // design systems: the same button re-themed by its tokens
  <div key="d" className={`${styles.scene} ${styles.tokens}`}>
    <div className={styles.sw}>
      <i />
      <i />
      <i />
      <i />
    </div>
    <span className={styles.tBtn}>Button</span>
  </div>,
  // design engineering: a line of JSX is typed, the component renders under it
  <div key="e" className={`${styles.scene} ${styles.code}`}>
    <code>
      <span>&lt;Button primary /&gt;</span>
    </code>
    <span className={styles.cBtn}>Button</span>
  </div>,
  // AI workflow: a prompt, then the block rebuilds itself
  <div key="a" className={`${styles.scene} ${styles.ai}`}>
    <code>
      <span>&gt; make it pop</span>
    </code>
    <i className={styles.aBlock} />
  </div>,
]

// one list with a floating card: the card glides to the active row, its content swaps through a mask
function List({ kind, count, card, children }: { kind: 'skills'; count: number; card: (i: number) => ReactNode; children: (i: number) => ReactNode }) {
  const list = useRef<HTMLOListElement>(null)
  const current = useRef(-1) // the active row, readable from the scroll handler without re-subscribing
  const [active, setActive] = useState(-1)
  const [prev, setPrev] = useState(-1) // the row whose content is leaving upwards
  const [y, setY] = useState(0) // middle of the active row: where the card glides to

  // -1 = nothing active (the card folds away)
  const go = (i: number) => {
    if (i === current.current) return
    const row = list.current!.children[i] as HTMLElement | undefined
    if (row) setY(row.offsetTop + row.offsetHeight / 2)
    setPrev(current.current)
    setActive((current.current = i))
  }

  // touch screens have no hover: the row at the middle of the screen is the active one
  useEffect(() => {
    if (matchMedia('(hover: hover)').matches) return
    let raf = 0
    const onScroll = () => {
      const rows = [...list.current!.children] as HTMLElement[]
      const mid = innerHeight / 2
      const r = list.current!.getBoundingClientRect()
      if (r.bottom < mid - 40 || r.top > mid + 40) return go(-1)
      let best = 0, dist = Infinity
      rows.forEach((row, i) => {
        const b = row.getBoundingClientRect(), d = Math.abs(b.top + b.height / 2 - mid)
        if (d < dist) [best, dist] = [i, d]
      })
      go(best)
    }
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(onScroll)
    }
    addEventListener('scroll', schedule, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('scroll', schedule)
    }
  }, [])

  return (
    <div className={styles.listBox} data-kind={kind} data-active={active >= 0} onMouseLeave={() => go(-1)}>
      <ol ref={list} className={styles.list}>
        {Array.from({ length: count }, (_, i) => (
          <li key={i} data-on={i === active} onMouseEnter={() => go(i)}>
            {children(i)}
          </li>
        ))}
      </ol>
      <div className={styles.card} style={{ '--y': `${y}px` } as CSSVars} aria-hidden="true" data-tag="<Preview />">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className={styles.layer} data-s={i === active ? 'in' : i === prev ? 'out' : ''}>
            {card(i)}
          </div>
        ))}
      </div>
    </div>
  )
}

// the title rolls up to its twin on hover (kstoimenov)
const Roll = ({ text }: { text: string }) => (
  <span className={styles.roll}>
    <span>{text}</span>
    <span aria-hidden="true">{text}</span>
  </span>
)

// what I do next to where I did it: the active row lights up, the rest dims, a small card with a coded
// mini interface glides next to it; the work history stays a plain list (Studio Namma + NBNZIA + Luke)
export function Experience({ dict }: Props) {
  const { experience: t } = dict
  return (
    <section className={styles.experience} id="experience">
      <div className={styles.head}>
        <div>
          <p className="mono">{t.label}</p>
          <RevealHeading before={t.titleBefore} em={t.titleEm} className={styles.title} />
        </div>
        <p className="mono">{t.meta}</p>
      </div>

      <div className={styles.cols}>
        <div>
          <p className={`${styles.colLabel} mono`}>{t.doLabel}</p>
          <List kind="skills" count={t.skills.length} card={(i) => scenes[i]}>
            {(i) => {
              const s = t.skills[i]
              return (
                <div className={styles.skill}>
                  <span className={`${styles.num} mono`}>{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3>
                      <Roll text={s.title} />
                    </h3>
                    <p>{s.text}</p>
                    <p className={`${styles.tags} mono`}>{s.tags}</p>
                  </div>
                </div>
              )
            }}
          </List>
        </div>

        <div>
          <p className={`${styles.colLabel} mono`}>{t.jobsLabel}</p>
          {/* plain history: the hover effects stay on the disciplines only */}
          <ul className={styles.list}>
            {t.jobs.map((j, i) => (
              <li key={j.company} className={styles.job}>
                <span className={`${styles.years} mono`}>
                  {i === 0 ? <i className={styles.dot} aria-hidden="true" /> : null}
                  {j.years}
                </span>
                <b>{j.company}</b>
                <span className={styles.role}>{j.role}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
