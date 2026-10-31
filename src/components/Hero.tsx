'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'
import heroImg from '@/assets/hero.jpg'
import type { Dictionary } from '@/i18n-config'
import type { CSSVars } from '@/types/css'
import { LiveCard } from './LiveCard'
import styles from './Hero.module.css'

type Props = { dict: Pick<Dictionary, 'hero' | 'facts'> }

// callouts sit in photo % coordinates, so they stay on the body at any window size
const callouts = [
  { kind: 'box', label: 'avatar · 1:1', style: { left: '41.5%', top: '2.4%', width: '17%', height: '17.6%' } },
  { kind: 'focus', label: 'focus 50% 12%', style: { left: '50.3%', top: '12.4%' } },
  { kind: 'lead', label: 'color.bone #ece6da', style: { left: '63.5%', top: '27%' } },
  { kind: 'leadL', label: 'illustration.custom', style: { left: '42%', top: '29%' } },
] as const

const bootSteps = ['color.accent', 'radius.md', 'space.inset', 'type.display', 'grid.columns']
const clamp = (v: number) => Math.min(1, Math.max(0, v))
const split = (word: string, from: number) =>
  [...word].map((c, i) => (
    <span key={i} className={styles.ch} style={{ '--i': from + i } as CSSVars}>
      {c}
    </span>
  ))

// IVAN ( avatar ) PAVLOV: the circle grows with scroll until it covers the screen with the portrait
export function Hero({ dict }: Props) {
  const { hero, facts } = dict
  const section = useRef<HTMLElement>(null)
  const stick = useRef<HTMLDivElement>(null)
  const name = useRef<HTMLHeadingElement>(null)
  const left = useRef<HTMLSpanElement>(null)
  const right = useRef<HTMLSpanElement>(null)
  const slot = useRef<HTMLSpanElement>(null)
  const win = useRef<HTMLDivElement>(null)
  const por = useRef<HTMLDivElement>(null)
  const role = useRef<HTMLDivElement>(null)
  const pct = useRef<HTMLElement>(null)
  const tok = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const html = document.documentElement
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches

    // styles are written straight to the DOM every frame: no React re-render while scrolling
    const onScroll = () => {
      const s = section.current!, w = win.current!, sl = slot.current!, st = stick.current!
      const vh = innerHeight
      const p = clamp(-s.getBoundingClientRect().top / (s.offsetHeight - vh))
      const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2

      if (!reduce) {
        // stays a circle: grows from the slot to the viewport diagonal, centre moves to the screen centre
        const sr = sl.getBoundingClientRect(), str = st.getBoundingClientRect()
        const diag = Math.hypot(innerWidth, vh), d = sr.width + e * (diag - sr.width)
        const cx = (sr.left - str.left + sr.width / 2) * (1 - e) + (innerWidth / 2) * e
        const cy = (sr.top - str.top + sr.height / 2) * (1 - e) + (vh / 2) * e
        w.style.width = w.style.height = d + 'px'
        w.style.transform = `translate(${cx - d / 2}px, ${cy - d / 2}px)`
        // the portrait, card and tokens are laid out against the screen, not the circle
        const ox = (e * (d - innerWidth)) / 2, oy = (e * (d - vh)) / 2
        w.style.setProperty('--ox', ox + 'px')
        w.style.setProperty('--oy', oy + 'px')
        const pr = por.current!
        pr.style.left = ox + 'px'
        pr.style.top = oy + 'px'
        pr.style.width = d - 2 * ox + 'px'
        // avatar crop: head + neck centred in the circle; scale ≥2.73 keeps the photo's top edge above the frame
        pr.style.transform = `translateY(${(1 - e) * 19}%) scale(${1 + (1 - e) * 1.75})`
        const shift = e * innerWidth * 0.6
        left.current!.style.transform = `translateX(${-shift}px)`
        right.current!.style.transform = `translateX(${shift}px)`
        role.current!.style.opacity = String(1 - e * 2)
        w.dataset.tokens = String(e > 0.6)
        w.dataset.open = String(e > 0.75)
      }
      // header turns light while the portrait covers the screen
      html.dataset.heroDark = String(e > 0.85 && s.getBoundingClientRect().bottom > 60)
    }

    // the name is scaled to fill the row exactly
    const fitName = () => {
      const n = name.current!
      n.style.fontSize = '100px'
      n.style.fontSize = (100 * (innerWidth - 48)) / n.scrollWidth + 'px'
      onScroll()
    }

    let raf = 0
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(onScroll)
    }
    addEventListener('scroll', schedule, { passive: true })
    addEventListener('resize', fitName)

    // intro: letters rise, the circle opens, token counter → portrait (≈1.5s, once per visit)
    let alive = true
    const runIntro = () => {
      requestAnimationFrame(() => requestAnimationFrame(() => html.classList.remove('boot-pre')))
      const t0 = performance.now() + 300, dur = 1100
      const tick = (now: number) => {
        if (!alive) return
        const q = clamp((now - t0) / dur), k = 1 - Math.pow(1 - q, 3)
        pct.current!.textContent = String(Math.round(k * 100)).padStart(3, '0') + '%'
        tok.current!.textContent = bootSteps[Math.min(bootSteps.length - 1, Math.floor(k * bootSteps.length))]
        if (q < 1) return requestAnimationFrame(tick)
        setTimeout(() => {
          html.classList.remove('loading')
          try {
            sessionStorage.setItem('intro', '1')
          } catch {}
        }, 150)
      }
      requestAnimationFrame(tick)
    }

    // wait only for the display font (max 1.5s), then measure and start
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]).then(() => {
      if (!alive) return
      fitName()
      if (html.classList.contains('loading')) runIntro()
    })

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      removeEventListener('scroll', schedule)
      removeEventListener('resize', fitName)
    }
  }, [])

  return (
    <>
      <section ref={section} className={styles.hero} id="hero">
        <div ref={stick} className={styles.stick}>
          <h1 ref={name} className={styles.name} aria-label="Ivan Pavlov">
            <span ref={left} className={styles.half}>
              {split('Ivan', 0)}
            </span>
            <span ref={slot} className={styles.slot} />
            <span ref={right} className={styles.half}>
              {split('Pavlov', 5)}
            </span>
          </h1>

          <div ref={win} className={styles.win} aria-hidden="true">
            <div ref={por} className={styles.por}>
              <Image
                src={heroImg}
                alt={hero.photoAlt}
                fill
                sizes="100vw"
                loading="eager"
                fetchPriority="high"
                placeholder="blur"
              />
              {callouts.map((c, i) => (
                <div
                  key={c.label}
                  className={`${styles.co} ${styles[c.kind]}`}
                  style={{ ...c.style, '--d': `${i * 0.12}s` } as CSSVars}
                >
                  <span>{c.label}</span>
                </div>
              ))}
            </div>
            <div className={styles.boot}>
              <b ref={pct}>000%</b>
              <span ref={tok}>color.accent</span>
            </div>
            <LiveCard />
          </div>

          <div ref={role} className={styles.role}>
            <div>
              <p className="mono">{hero.role}</p>
              <p className={styles.claim}>
                {hero.claimBefore}
                <em>{hero.claimEm}</em>
                {hero.claimAfter}
              </p>
            </div>
            <span className="mono">{hero.scroll}</span>
          </div>
        </div>
      </section>

      {/* recruiter meta (Kristian Ulrych) */}
      <div className={styles.meta}>
        {facts.map((m) => (
          <div key={m.label}>
            <span className="mono">{m.label}</span>
            <p>
              {m.lines[0]}
              <br />
              {m.lines[1]}
            </p>
          </div>
        ))}
      </div>
    </>
  )
}
