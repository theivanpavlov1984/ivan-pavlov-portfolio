'use client'

import { useEffect, useRef } from 'react'
import styles from './Cases.module.css'

const parts = ['Button', 'Input', 'Chip', 'Tabs', 'Data table', 'Modal', 'Toast', 'Card', 'Menu', 'Badge']

// scratch-to-reveal: a grey "legacy" screen on canvas; erasing it (destination-out) shows the system underneath
export function Scratch({ hint }: { hint: string }) {
  const box = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = canvas.current!, ctx = cv.getContext('2d')!
    const paint = () => {
      const { width, height } = box.current!.getBoundingClientRect(), dpr = devicePixelRatio
      cv.width = width * dpr
      cv.height = height * dpr
      ctx.scale(dpr, dpr)
      ctx.fillStyle = '#b9b4aa'
      ctx.fillRect(0, 0, width, height)
      for (let i = 0; i < 26; i++) {
        ctx.fillStyle = ['#a7a196', '#cfc9be', '#8f8a80', '#d9d3c7'][i % 4]
        ctx.fillRect(10 + ((i % 5) * width) / 5, 10 + (Math.floor(i / 5) * height) / 6, width / 5 - 14 - (i % 3) * 6, height / 6 - 12)
      }
      ctx.fillStyle = '#0d0c0a'
      ctx.font = '500 11px monospace'
      ctx.fillText('legacy_v1_final_FINAL.fig', 14, height - 14)
    }
    paint()

    let down = false
    const erase = (e: PointerEvent) => {
      if (!down) return
      const b = cv.getBoundingClientRect()
      ctx.globalCompositeOperation = 'destination-out'
      ctx.beginPath()
      ctx.arc(e.clientX - b.left, e.clientY - b.top, 34, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalCompositeOperation = 'source-over'
    }
    const onDown = (e: PointerEvent) => {
      down = true
      erase(e)
    }
    // a mouse erases on hover; touch/pen only while pressed
    const onMove = (e: PointerEvent) => {
      down = down || e.pointerType === 'mouse'
      erase(e)
    }
    const stop = () => (down = false)
    cv.addEventListener('pointerdown', onDown)
    cv.addEventListener('pointermove', onMove)
    cv.addEventListener('pointerleave', stop)
    cv.addEventListener('pointerup', stop)
    return () => {
      cv.removeEventListener('pointerdown', onDown)
      cv.removeEventListener('pointermove', onMove)
      cv.removeEventListener('pointerleave', stop)
      cv.removeEventListener('pointerup', stop)
    }
  }, [])

  return (
    <div ref={box} className={styles.visual}>
      <div className={styles.sys}>
        {parts.map((p) => (
          <div key={p}>{p}</div>
        ))}
      </div>
      <canvas ref={canvas} className={styles.canvas} />
      <span className={`${styles.hint} mono`}>{hint}</span>
    </div>
  )
}
