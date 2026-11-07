'use client'

import { useEffect, useRef } from 'react'
import type { CSSVars } from '@/types/css'
import styles from './RevealText.module.css'

type Props = { text: string; className?: string; lang?: string }

// a quote that comes in like the section headings, but word by word (left to right, out of a blur):
// per-letter spans on four long quotes would be hundreds of blurred layers
export function RevealText({ text, className = '', lang }: Props) {
  const ref = useRef<HTMLQuoteElement>(null)

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
  return (
    <blockquote ref={ref} className={`${styles.text} ${className}`} lang={lang} aria-label={text}>
      <span aria-hidden="true">
        {text.split(/(\s+)/).map((part, k) =>
          /^\s+$/.test(part) ? (
            part
          ) : (
            <span key={k} className={styles.w} style={{ '--i': i++ } as CSSVars}>
              {part}
            </span>
          ),
        )}
      </span>
    </blockquote>
  )
}
