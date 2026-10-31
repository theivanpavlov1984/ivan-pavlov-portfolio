'use client'

import { useEffect, useRef } from 'react'
import styles from './TagCursor.module.css'

// [label, interactive] for the element under the pointer.
// Components can name themselves with data-tag="<Toggle />"; otherwise the real HTML tag is shown.
function tagOf(t: Element): [string, boolean] {
  const tagged = t.closest<HTMLElement>('[data-tag]')
  if (tagged) return [tagged.dataset.tag!, !!tagged.closest('a, button')]
  if (t.closest('a')) return ['<a>', true]
  if (t.closest('button')) return ['<button>', true]
  if (t.closest('summary')) return ['<details>', true]
  if (t.closest('blockquote')) return ['<blockquote>', false]
  if (t.closest('em')) return ['<em>', false]
  const text = t.closest('h1, h2, h3, p')
  if (text) return [`<${text.tagName.toLowerCase()}>`, false]
  return ['</>', false]
}

// the pointer itself is a tag of what's under it; desktop with a mouse only
export function TagCursor() {
  const el = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const html = document.documentElement
    const cur = el.current!
    html.classList.add('cur-tag')

    let x = -100, y = -100, raf = 0, last = ''
    const update = () => {
      const t = x < 0 ? null : document.elementFromPoint(x, y)
      cur.dataset.on = String(!!t)
      if (!t) return
      const [label, hot] = tagOf(t)
      if (label !== last) cur.textContent = last = label // text changes only when the target changes
      cur.dataset.hot = String(hot)
      cur.dataset.dark = String(!hot && !!t.closest('[data-dark]'))
      // top-left corner of the pill is the hotspot. Position goes through `translate`, which applies after `scale`:
      // with `transform` the press scale would also shrink the offset and fling the cursor towards the corner
      cur.style.translate = `${x}px ${y}px`
    }
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }
    const onMove = (e: MouseEvent) => {
      x = e.clientX
      y = e.clientY
      schedule()
    }
    const onLeave = () => {
      x = y = -100
      schedule()
    }
    const onDown = () => (cur.dataset.down = 'true')
    const onUp = () => (cur.dataset.down = 'false')

    addEventListener('mousemove', onMove)
    addEventListener('scroll', schedule, { passive: true })
    addEventListener('mousedown', onDown)
    addEventListener('mouseup', onUp)
    document.addEventListener('mouseleave', onLeave)
    return () => {
      html.classList.remove('cur-tag')
      cancelAnimationFrame(raf)
      removeEventListener('mousemove', onMove)
      removeEventListener('scroll', schedule)
      removeEventListener('mousedown', onDown)
      removeEventListener('mouseup', onUp)
      document.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return <div ref={el} className={`${styles.cursor} mono`} aria-hidden="true" />
}
