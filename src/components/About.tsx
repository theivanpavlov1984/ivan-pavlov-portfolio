'use client'

import Image from 'next/image'
import { Fragment, useEffect, useRef } from 'react'
import photo from '@/assets/photo.jpg'
import { clients } from '@/content/clients'
import type { Dictionary } from '@/i18n-config'
import type { CSSVars } from '@/types/css'
import styles from './About.module.css'

type Props = { dict: Pick<Dictionary, 'about'> }

// ---------- inline mini-components: dim until the fill reaches them, then they come alive ----------
const icons = {
  code: (
    <span className={`${styles.ico} ${styles.code}`} data-tag="<Code />">
      <span>&lt;/&gt;</span>
      <i />
    </span>
  ),
  toggle: (
    <span className={`${styles.ico} ${styles.tog}`} data-tag="<Toggle />">
      <i />
    </span>
  ),
  spark: (
    <svg className={`${styles.ico} ${styles.spark}`} viewBox="0 0 40 20" data-tag="<Sparkline />">
      <polyline pathLength={1} points="1,16 8,11 14,13 21,5 27,9 33,3 39,6" />
    </svg>
  ),
  ticket: (
    <svg className={`${styles.ico} ${styles.ticket}`} viewBox="0 0 36 22" data-tag="<Ticket />">
      <path d="M3 1H33a2 2 0 0 1 2 2V8a3 3 0 0 0 0 6v5a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V14a3 3 0 0 0 0-6V3a2 2 0 0 1 2-2Z" />
      <line x1="25" y1="3" x2="25" y2="19" />
      <rect x="6" y="7" width="13" height="3" rx="1" />
      <rect x="6" y="12.5" width="8" height="2.5" rx="1" />
    </svg>
  ),
  line: (
    <svg className={`${styles.ico} ${styles.line}`} viewBox="0 0 48 20" data-tag="<Path />">
      <path className={styles.tangle} pathLength={1} d="M2 10C8-4 14 24 18 8S26-2 24 14 34 18 30 6 42 4 46 10" />
      <path className={styles.straight} pathLength={1} d="M2 10H46" />
    </svg>
  ),
}
type IconName = keyof typeof icons

// ---------- text markup: {icon} glues to the previous word, [text](caseIndex) links to a case ----------
type Word = { text: string; icon?: IconName }
type Item = { kind: 'space'; text: string } | { kind: 'word'; word: Word } | { kind: 'link'; words: Word[]; to: number }

function parse(src: string): Item[] {
  const items: Item[] = []
  let last: Word | undefined
  for (const m of src.matchAll(/\[([^\]]+)\]\((\d)\)|\{(\w+)\}|(\s+)|([^\s[{]+)/g)) {
    if (m[1]) {
      const words = m[1].split(/\s+/).map((text) => ({ text }))
      items.push({ kind: 'link', words, to: Number(m[2]) })
      last = words[words.length - 1]
    } else if (m[3]) {
      if (last) last.icon = m[3] as IconName
    } else if (m[4]) {
      items.push({ kind: 'space', text: m[4] })
      last = undefined
    } else {
      last = { text: m[5] }
      items.push({ kind: 'word', word: last })
    }
  }
  return items
}

// each char (and each icon) is one step of the fill; a word never breaks across lines
function WordView({ word }: { word: Word }) {
  return (
    <span className={styles.wd}>
      {[...word.text].map((c, i) => (
        <span key={i} data-c="">
          {c}
        </span>
      ))}
      {word.icon && <span data-c="">{icons[word.icon]}</span>}
    </span>
  )
}

// story links scroll to the case and open it in the accordion
function goToCase(index: number) {
  const cases = document.getElementById('cases')
  if (!cases) return document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' })
  const n = cases.querySelectorAll('[data-case-item]').length || 1
  const top = cases.getBoundingClientRect().top + scrollY + ((index + 0.5) / n) * (cases.offsetHeight - innerHeight)
  scrollTo({ top, behavior: 'smooth' })
}

// About: pinned for 135vh while the story fills char by char with an ember crest (Pamidor)
export function About({ dict }: Props) {
  const { about } = dict
  const section = useRef<HTMLElement>(null)
  const text = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const chars = [...text.current!.querySelectorAll<HTMLElement>('[data-c]')]
    const links = [...text.current!.querySelectorAll<HTMLElement>('a')]
    const crest = 12
    let raf = 0

    const onScroll = () => {
      const s = section.current!, vh = innerHeight
      const p = Math.min(1, Math.max(0, (-s.getBoundingClientRect().top + vh * 0.3) / (s.offsetHeight - vh * 0.7)))
      const front = p * (chars.length + crest)
      chars.forEach((c, i) => {
        const state = i < front - crest ? 'done' : i < front ? 'crest' : ''
        if (c.dataset.c !== state) c.dataset.c = state // touch the DOM only when the state changes
      })
      links.forEach((a) => {
        const lastChar = a.querySelectorAll<HTMLElement>('[data-c]')
        a.dataset.on = String(lastChar[lastChar.length - 1].dataset.c === 'done')
      })
    }
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(onScroll)
    }
    addEventListener('scroll', schedule, { passive: true })
    onScroll()
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('scroll', schedule)
    }
  }, [])

  const items = parse(about.text)

  return (
    <section ref={section} className={styles.about} id="about">
      <div className={styles.stick}>
        <p className="mono">{about.label}</p>
        <div className={styles.body}>
          <span className={styles.sticker} data-tag="<img>">
            <Image src={photo} alt={about.photoAlt} sizes="220px" placeholder="blur" />
          </span>
          <p ref={text} className={styles.text}>
            {items.map((it, i) =>
              it.kind === 'space' ? (
                <Fragment key={i}>{it.text}</Fragment>
              ) : it.kind === 'word' ? (
                <WordView key={i} word={it.word} />
              ) : (
                <a
                  key={i}
                  href="#work"
                  className={styles.link}
                  onClick={(e) => {
                    e.preventDefault()
                    goToCase(it.to)
                  }}
                >
                  {it.words.map((w, j) => (
                    <Fragment key={j}>
                      {j > 0 && ' '}
                      <WordView word={w} />
                    </Fragment>
                  ))}
                </a>
              ),
            )}
          </p>
        </div>

        <div className={styles.clients}>
          <span className="mono">{about.workedWith}</span>
          <div className={styles.track}>
            {/* two copies of the row so the marquee loops seamlessly */}
            <div className={styles.row}>
              {[...clients, ...clients].map((c, i) => (
                <i
                  key={i}
                  className={styles.logo}
                  data-tag="<Logo />"
                  role="img"
                  aria-label={c.name}
                  aria-hidden={i >= clients.length}
                  style={{ '--src': `url(${c.src})`, '--r': c.ratio, '--h': `${c.h}px` } as CSSVars}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
