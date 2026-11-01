'use client'

import { useEffect, useRef } from 'react'
import Image, { type StaticImageData } from 'next/image'
import type { Dictionary } from '@/i18n-config'
import type { CSSVars } from '@/types/css'
import s01 from '@/assets/orbit/shot_01.jpg'
import s02 from '@/assets/orbit/shot_02.jpg'
import s03 from '@/assets/orbit/shot_03.jpg'
import s04 from '@/assets/orbit/shot_04.jpg'
import s05 from '@/assets/orbit/shot_05.jpg'
import s06 from '@/assets/orbit/shot_06.jpg'
import s07 from '@/assets/orbit/shot_07.jpg'
import s08 from '@/assets/orbit/shot_08.jpg'
import s09 from '@/assets/orbit/shot_09.jpg'
import styles from './Orbit.module.css'

type Props = { dict: Pick<Dictionary, 'orbit'> }

// interface shots from Figma (1280w, full pages cropped to the first screen), projects mixed for rhythm
const cards: [StaticImageData, string][] = [
  [s01, 'Mavfarm · feed'],
  [s02, 'Nominex · home'],
  [s03, 'Mars · OTC desk'],
  [s04, 'Mavfarm · news'],
  [s05, 'Nominex · trade'],
  [s06, 'Gold & Diamonds'],
  [s07, 'Mavfarm · music map'],
  [s08, 'Nominex · launchpools'],
  [s09, 'Mavfarm · news map'],
]

const STAGGER = 0.07 // each card starts this much later (share of its own path)
const RANGE = 1 + STAGGER * (cards.length - 1)

const clamp = (v: number) => Math.min(1, Math.max(0, v))

// orbit gallery under Selected work (after Luke Baffait's circle gallery): while the section is pinned, cards fly in
// from the left, make one turn around the phrase on a tilted ellipse and leave to the right; the phrase surfaces
// word by word out of a blur. Desktop only; styles are written straight to the DOM, no re-renders.
export function Orbit({ dict }: Props) {
  const { orbit } = dict
  const section = useRef<HTMLElement>(null)
  const phrase = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const desktop = matchMedia('(min-width: 769px)')
    if (!desktop.matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const sec = section.current!
    const els = [...sec.querySelectorAll<HTMLElement>('[data-card]')]
    const words = [...phrase.current!.querySelectorAll<HTMLElement>('[data-word]')]

    // where a card is at t (0 → 1 of its own path): in from the left, one turn on the ellipse, out to the right
    const place = (t: number, vw: number) => {
      const rx = vw * 0.34, rz = 520, off = vw * 0.85
      const tilt = Math.min(170, innerHeight * 0.2) // front cards stay inside short windows
      if (t < 0.12) {
        const q = t / 0.12
        return { x: -off * (1 - q), y: tilt, z: rz * q, ry: 0 }
      }
      if (t < 0.88) {
        const q = (t - 0.12) / 0.76
        const a = Math.PI / 2 - q * Math.PI * 2
        const z = Math.sin(a) * rz
        return { x: Math.cos(a) * rx, y: (z / rz) * tilt, z, ry: q * 360 }
      }
      const q = (t - 0.88) / 0.12
      return { x: off * q, y: tilt, z: rz * (1 - q), ry: 360 }
    }

    let raf = 0
    const update = () => {
      raf = 0
      const r = sec.getBoundingClientRect()
      if (r.bottom < 0 || r.top > innerHeight) return
      const p = clamp(-r.top / (sec.offsetHeight - innerHeight))

      els.forEach((el, i) => {
        const t = p * RANGE - i * STAGGER
        if (t <= 0 || t >= 1) {
          el.style.opacity = '0'
          return
        }
        const { x, y, z, ry } = place(t, innerWidth)
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${ry.toFixed(1)}deg)`
        el.style.opacity = String(Math.min(1, t / 0.06, (1 - t) / 0.06))
        el.style.zIndex = String(Math.round(z + 600)) // the phrase sits at 600: cards behind it pass under the text
      })

      // phrase: surfaces word by word out of a blur, drifts up, fades out
      const g = clamp((p - 0.22) / 0.56)
      const ph = phrase.current!
      ph.style.transform = `translateY(${(160 * (0.5 - g)).toFixed(1)}px)`
      ph.style.opacity = String(g <= 0 || g >= 1 ? 0 : Math.min(1, g / 0.1, (1 - g) / 0.25))
      words.forEach((w, i) => {
        const k = clamp((clamp(g / 0.4) * (words.length + 4) - i) / 3)
        w.style.opacity = String(k)
        w.style.filter = k < 1 ? `blur(${(8 * (1 - k)).toFixed(1)}px)` : ''
      })
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    addEventListener('scroll', schedule, { passive: true })
    addEventListener('resize', schedule)
    update()
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('scroll', schedule)
      removeEventListener('resize', schedule)
    }
  }, [])

  const split = (text: string) =>
    text
      .split(/(\s+)/)
      .map((w, i) => (/^\s+$/.test(w) || !w ? w : <span key={i} data-word="" className={styles.word}>{w}</span>))

  return (
    <section ref={section} className={styles.orbit} aria-label={orbit.label}>
      <div className={styles.pin}>
        <span className={`${styles.count} mono`}>{orbit.count}</span>
        {cards.map(([img, label], i) => (
          <div key={i} data-card="" className={styles.card} style={{ '--ar': `${img.width} / ${img.height}` } as CSSVars}>
            <Image src={img} alt={label} className={styles.shot} sizes="(max-width: 1250px) 150px, (max-width: 2500px) 12vw, 300px" />
            {/* the far side of the turn shows the card's back, not a mirrored screen */}
            <span className={`${styles.back} mono`} aria-hidden="true">
              {label}
            </span>
          </div>
        ))}
        <p ref={phrase} className={styles.phrase}>
          {split(orbit.before)}
          <em>{split(orbit.em)}</em>
          {split(orbit.after)}
        </p>
      </div>
    </section>
  )
}
