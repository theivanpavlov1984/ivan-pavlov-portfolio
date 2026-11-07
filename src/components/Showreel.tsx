'use client'

import { useEffect, useRef, useState } from 'react'
import type { Dictionary } from '@/i18n-config'
import styles from './Showreel.module.css'

type Props = { dict: Pick<Dictionary, 'reel'> }

const clamp = (v: number) => Math.min(1, Math.max(0, v))

// showreel right after the hero (NBNZIA): a small frame in the corner grows to the full width as the section
// rises from the bottom of the screen to near its top, then scrolls away with the page. --g (0 → 1) is written
// straight to the DOM; the CSS turns it into the scale.
// The video plays muted (browsers only autoplay silent video) and only while it is on screen;
// a click on the frame turns the sound on and off.
export function Showreel({ dict }: Props) {
  const { reel } = dict
  const section = useRef<HTMLElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const [sound, setSound] = useState(false)

  useEffect(() => {
    const sec = section.current!
    const v = video.current!
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches

    // play on screen, pause off screen: no decoding (and no sound) while the user reads other sections.
    // With reduced motion it does not start on its own; the click starts it.
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) v.pause()
      else if (!reduce || !v.muted) v.play().catch(() => {})
    })
    io.observe(sec)

    if (reduce) {
      sec.style.setProperty('--g', '1')
      return () => io.disconnect()
    }
    let raf = 0
    const update = () => {
      raf = 0
      const top = sec.getBoundingClientRect().top, vh = innerHeight
      // the thumbnail first rises into view as is, then grows while the top travels from 70% of the screen to 10%
      const p = clamp((vh * 0.7 - top) / (vh * 0.6))
      sec.style.setProperty('--g', (1 - (1 - p) ** 2).toFixed(4)) // quad ease-out: soft landing at full size
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    addEventListener('scroll', schedule, { passive: true })
    addEventListener('resize', schedule)
    update()
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      removeEventListener('scroll', schedule)
      removeEventListener('resize', schedule)
    }
  }, [])

  const toggle = () => {
    const v = video.current!
    v.muted = sound
    // turning the sound on restarts the reel, so it is heard from the first beat
    if (!sound) v.currentTime = 0
    v.play().catch(() => {})
    setSound(!sound)
  }

  return (
    <section ref={section} className={styles.reel} id="reel" aria-label={reel.label}>
      <div className={styles.frame} data-tag={reel.tag} data-dark="">
        <video
          ref={video}
          className={styles.video}
          poster="/reel/poster.jpg"
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={reel.label}
        >
          <source src="/reel/reel-720.mp4" type="video/mp4" media="(max-width: 760px)" />
          <source src="/reel/reel.mp4" type="video/mp4" />
        </video>
        <button type="button" className={styles.over} aria-pressed={sound} onClick={toggle}>
          <span className="mono">{reel.label}</span>
          <span className="mono">
            <i aria-hidden="true" data-on={sound} />
            {sound ? reel.soundOff : reel.soundOn}
          </span>
        </button>
      </div>
    </section>
  )
}
