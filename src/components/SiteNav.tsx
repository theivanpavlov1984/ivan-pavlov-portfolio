'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Dictionary, Locale } from '@/i18n-config'
import { contacts } from '@/content/contacts'
import type { CSSVars } from '@/types/css'
import styles from './SiteNav.module.css'

type Props = { lang: Locale; dict: Pick<Dictionary, 'header' | 'menu' | 'contacts'> }

// header (logo with name ↔ role swap on hover) + burger + full-screen menu
export function SiteNav({ lang, dict }: Props) {
  const [open, setOpen] = useState(false)
  const { header, menu, contacts: labels } = dict
  const other: Locale = lang === 'en' ? 'ru' : 'en'

  // lock page scroll while the menu is open; Esc closes it
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [open])

  const close = () => setOpen(false)
  const items = [
    { href: '#hero', label: menu.home },
    { href: '#work', label: menu.work },
    { href: '#about', label: menu.about },
  ]

  return (
    <>
      <header className={styles.top} data-open={open}>
        <a href="#hero" className={styles.logo} onClick={close}>
          <span className={styles.hey}>{header.hey}</span>
          <span className={styles.swap}>
            <span className={styles.name}>
              <b>{header.first}</b> <i>{header.last}</i>
            </span>
            <span className={styles.role} aria-hidden="true">
              <i>Design</i> <b>Engineer</b>
            </span>
          </span>
          <span className={`${styles.swap} ${styles.status}`}>
            <span className={styles.def}>
              {header.status} <span className={styles.dot} />
            </span>
            <span className={styles.alt} aria-hidden="true">
              {header.skills}
            </span>
          </span>
        </a>

        <div className={styles.right}>
          <Link href={`/${other}`} className="mono" hrefLang={other}>
            {other.toUpperCase()}
          </Link>
          <button
            className={styles.burger}
            aria-expanded={open}
            aria-controls="menu"
            aria-label={open ? header.closeMenu : header.openMenu}
            onClick={() => setOpen(!open)}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      {/* menu turns over like a book page (Studio Namma): a slanted edge sweeps down while the page straightens */}
      <div id="menu" className={styles.menu} data-open={open} aria-hidden={!open}>
        <div className={styles.page}>
          <nav className={styles.inner} onClick={(e) => (e.target as HTMLElement).closest('a') && close()}>
            {items.map((item, i) => (
              <div key={item.href} className={styles.mask} style={{ '--i': i } as CSSVars}>
                <a href={item.href} className={styles.item}>
                  {item.label}
                </a>
              </div>
            ))}

            <div className={`${styles.mask} ${styles.contacts}`} style={{ '--i': items.length + 1 } as CSSVars}>
              <ul className={`${styles.rows} ${styles.rise}`}>
                <li>
                  <a href={`mailto:${contacts.email}`}>
                    <span className="mono">{labels.email}</span>
                    <b>{contacts.email}</b>
                    <i>↗</i>
                  </a>
                </li>
                <li>
                  <a href={contacts.telegram.url} target="_blank" rel="noopener">
                    <span className="mono">{labels.telegram}</span>
                    <b>{contacts.telegram.handle}</b>
                    <i>↗</i>
                  </a>
                </li>
                <li>
                  <a href={contacts.linkedin.url} target="_blank" rel="noopener">
                    <span className="mono">{labels.linkedin}</span>
                    <b>{contacts.linkedin.handle}</b>
                    <i>↗</i>
                  </a>
                </li>
                <li className={styles.cv}>
                  <span className="mono">{labels.resume}</span>
                  <b>
                    <a href={contacts.cv.en} target="_blank">
                      EN · PDF
                    </a>
                    <a href={contacts.cv.ru} target="_blank">
                      RU · PDF
                    </a>
                  </b>
                  <i>↓</i>
                </li>
              </ul>
            </div>
          </nav>
        </div>
      </div>
    </>
  )
}
