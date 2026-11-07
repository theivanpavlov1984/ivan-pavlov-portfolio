'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import type { CSSVars } from '@/types/css'
import styles from './Tools.module.css'

// the tools behind "I speak code": 3D clay renders in brand colours, public/tools/<id>.png (480px, transparent);
// a tool without src shows as a clay-like placeholder tile with its name
const tools: { id: string; name: string; src?: string }[] = [
  { id: 'figma', name: 'Figma', src: '/tools/figma.png' },
  { id: 'react', name: 'React', src: '/tools/react.png' },
  { id: 'typescript', name: 'TypeScript', src: '/tools/typescript.png' },
  { id: 'storybook', name: 'Storybook', src: '/tools/storybook.png' },
  { id: 'cursor', name: 'Cursor', src: '/tools/cursor.png' },
  { id: 'claude', name: 'Claude', src: '/tools/claude.png' },
]

// Studio Namma's tools row: logos rise out of a mask one after another, and the cursor knocks them —
// a push in the direction (and with the speed) the mouse came in, a small random tilt, then a spring back.
// Their GSAP InertiaPlugin is replaced by a tiny spring; transforms go straight to the DOM.
export function Tools() {
  const row = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const el = row.current!
    const items = [...el.querySelectorAll<HTMLElement>('[data-tool]')]
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches

    // rise in once the row scrolls into view; overflow opens up afterwards so pushed logos are not clipped
    const io = new IntersectionObserver(
      ([en]) => {
        if (!en.isIntersecting) return
        el.dataset.in = 'true'
        io.disconnect()
        setTimeout(() => (el.dataset.free = 'true'), 1500 + items.length * 100)
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    io.observe(el)
    if (reduce) return () => io.disconnect()

    // pointer velocity, px per move event
    let lastX = 0, lastY = 0, dx = 0, dy = 0
    const onMove = (e: PointerEvent) => {
      dx = e.clientX - lastX
      dy = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
    }

    // one spring per logo: position (x, y) and tilt (r) pulled back to 0
    const state = items.map(() => ({ x: 0, y: 0, r: 0, vx: 0, vy: 0, vr: 0, raf: 0 }))
    const K = 0.08, DAMP = 0.82 // stiffness and velocity kept per frame: one soft overshoot, then rest
    const step = (i: number) => {
      const s = state[i]
      s.vx = (s.vx - s.x * K) * DAMP
      s.vy = (s.vy - s.y * K) * DAMP
      s.vr = (s.vr - s.r * K) * DAMP
      s.x += s.vx
      s.y += s.vy
      s.r += s.vr
      const img = items[i].firstElementChild as HTMLElement
      img.style.transform = `translate(${s.x.toFixed(2)}px, ${s.y.toFixed(2)}px) rotate(${s.r.toFixed(2)}deg)`
      const moving = Math.abs(s.x) + Math.abs(s.y) + Math.abs(s.r) + Math.abs(s.vx) + Math.abs(s.vy) > 0.05
      s.raf = moving ? requestAnimationFrame(() => step(i)) : 0
      if (!moving) img.style.transform = ''
    }
    const kick = (i: number, vx: number, vy: number) => {
      const s = state[i]
      const cap = (v: number) => Math.max(-40, Math.min(40, v)) // a flick of the mouse should not throw it off screen
      s.vx += cap(vx)
      s.vy += cap(vy)
      s.vr += (Math.random() - 0.5) * 9
      if (!s.raf) s.raf = requestAnimationFrame(() => step(i))
    }

    const enters = items.map((it, i) => {
      const onEnter = (e: PointerEvent) => {
        // touch: no mouse velocity, so a tap makes it hop up instead
        if (e.pointerType === 'mouse') kick(i, dx * 1.6, dy * 1.6)
        else kick(i, 0, -14)
      }
      it.addEventListener('pointerenter', onEnter)
      return onEnter
    })
    addEventListener('pointermove', onMove, { passive: true })

    return () => {
      io.disconnect()
      removeEventListener('pointermove', onMove)
      items.forEach((it, i) => {
        it.removeEventListener('pointerenter', enters[i])
        cancelAnimationFrame(state[i].raf)
      })
    }
  }, [])

  return (
    <ul ref={row} className={styles.tools} aria-label="Tools">
      {tools.map((t, i) => (
        <li key={t.id} data-tool="" style={{ '--i': i } as CSSVars} data-tag={`<${t.name} />`}>
          <span className={styles.logo}>
            {t.src ? (
              <Image src={t.src} alt={t.name} width={480} height={480} sizes="(max-width: 760px) 88px, 112px" draggable={false} />
            ) : (
              <span className={styles.ph}>
                <span className="mono">{t.name}</span>
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  )
}
