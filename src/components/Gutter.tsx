'use client'

import { useEffect, useRef } from 'react'
import styles from './Gutter.module.css'

const LINE = 22 // the page is read as a file of 22px lines
const sections = ['hero', 'about', 'principle', 'work', 'reviews', 'contact']

// editor gutter: line numbers scroll with the page; the middle line and current section are in ember
export function Gutter() {
  const col = useRef<HTMLDivElement>(null)
  const num = useRef<HTMLElement>(null)
  const sec = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let raf = 0
    const update = () => {
      const c = col.current!
      const rows = Math.ceil(innerHeight / LINE) + 2, first = Math.floor(scrollY / LINE)
      if (c.childElementCount !== rows) c.replaceChildren(...Array.from({ length: rows }, () => document.createElement('div')))
      ;[...c.children].forEach((d, i) => (d.textContent = String(first + i + 1).padStart(3, '0')))
      c.style.transform = `translateY(${-(scrollY % LINE)}px)`

      const mid = scrollY + innerHeight / 2
      num.current!.textContent = String(Math.floor(mid / LINE) + 1).padStart(3, '0')
      let name = sections[0]
      for (const id of sections) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top + scrollY <= mid) name = id
      }
      if (scrollY + innerHeight >= document.documentElement.scrollHeight - 4) name = 'EOF'
      sec.current!.textContent = '// ' + name
    }
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
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

  return (
    <>
      <div className={`${styles.gutter} mono`} aria-hidden="true">
        <div ref={col} className={styles.col} />
      </div>
      <div className={`${styles.current} mono`} aria-hidden="true">
        <span ref={sec}>{'// hero'}</span>
        <b ref={num}>001</b>
      </div>
    </>
  )
}
