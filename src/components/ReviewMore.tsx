'use client'

import { useId, useState } from 'react'
import type { CSSVars } from '@/types/css'
import styles from './Reviews.module.css'

type Props = { label: string; paragraphs: readonly string[] }

// "show full review": the height opens through grid rows 0fr → 1fr (animates height: auto, as in Cases),
// the paragraphs rise in one after another and drop back first on close; the + turns into ×
export function ReviewMore({ label, paragraphs }: Props) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <div className={styles.full} data-open={open}>
      <button type="button" className={`${styles.toggle} mono`} aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        <i aria-hidden="true">+</i>
        <span>{label}</span>
      </button>
      <div id={id} className={styles.more} inert={!open}>
        <div>
          {paragraphs.map((p, i) => (
            <p key={i} lang="en" style={{ '--i': i } as CSSVars}>
              {p}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
