'use client'

import { useEffect, useState } from 'react'
import type { CSSVars } from '@/types/css'
import styles from './Hero.module.css'

// three token sets the card cycles through: same component, different theme
const themes = [
  { r: '10px', p: '14px', g: '10px', a: '#ff4d00', w: '62%', chip: 'v4.2' },
  { r: '0px', p: '18px', g: '14px', a: '#0d0c0a', w: '78%', chip: 'v4.3' },
  { r: '22px', p: '12px', g: '8px', a: '#c9b8ff', w: '91%', chip: 'v5.0' },
]

// the live component docked in the open hero window + the token readout
export function LiveCard() {
  const [i, setI] = useState(0)
  const t = themes[i]

  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % themes.length), 1800)
    return () => clearInterval(id)
  }, [])

  const vars = { '--r': t.r, '--p': t.p, '--g': t.g, '--a': t.a, '--w': t.w } as CSSVars

  return (
    <>
      <div className={styles.card}>
        <div className={styles.demo} style={vars}>
          <div className={styles.demoRow}>
            <span className={styles.demoTitle}>Q3 rollout</span>
            <span className={styles.demoChip}>{t.chip}</span>
          </div>
          <div className={styles.demoBar}>
            <i />
          </div>
          <span className="mono">62% migrated</span>
          <span className={styles.demoBtn}>Ship it</span>
        </div>
      </div>
      <div className={`${styles.tokens} mono`}>
        radius.md <b>{t.r}</b>
        <br />
        space.inset <b>{t.p}</b>
        <br />
        color.accent <b>{t.a}</b>
      </div>
    </>
  )
}
