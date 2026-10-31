'use client'

import { useEffect, useRef } from 'react'
import type { CSSVars } from '@/types/css'
import styles from './RevealHeading.module.css'

type Props = { before: string; em?: string; after?: string; className?: string }

// section heading: chars fade in from blur when it scrolls in (same as v1: blur 16px, 20px rise, 1s, .03s stagger)
export function RevealHeading({ before, em, after = '', className = '' }: Props) {
  const ref = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const io = new IntersectionObserver(
      ([en]) => {
        if (!en.isIntersecting) return
        ref.current!.dataset.in = 'true'
        io.disconnect()
      },
      { rootMargin: '0px 0px -12% 0px' },
    )
    io.observe(ref.current!)
    return () => io.disconnect()
  }, [])

  let i = 0
  const chars = (text: string) =>
    text.split(/(\s+)/).map((part, k) =>
      /^\s+$/.test(part) ? (
        part
      ) : (
        <span key={k} className={styles.word}>
          {[...part].map((c, j) => (
            <span key={j} className={styles.ch} style={{ '--i': i++ } as CSSVars}>
              {c}
            </span>
          ))}
        </span>
      ),
    )

  const label = before + (em ?? '') + after
  return (
    // screen readers get the whole phrase, not single letters
    <h2 ref={ref} className={`${styles.heading} ${className}`} aria-label={label}>
      <span aria-hidden="true">
        {chars(before)}
        {em && <em>{chars(em)}</em>}
        {after && chars(after)}
      </span>
    </h2>
  )
}
