import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import heroImg from '@/assets/hero.jpg'
import { mono, travels } from '@/fonts'
import './globals.css'
import styles from './not-found.module.css'

export const metadata: Metadata = {
  title: '404 · Ivan Pavlov',
  robots: { index: false },
}

// any unknown address: the hero's name line, with the portrait circle as the zero (4●4).
// The language can't be read from a missing route, so the line is in both
export default function GlobalNotFound() {
  return (
    <html lang="en" className={`${travels.variable} ${mono.variable}`}>
      <body className={styles.page}>
        <main className={styles.main}>
          <h1 className={styles.code} aria-label="404">
            <span aria-hidden="true">4</span>
            <span className={styles.win} aria-hidden="true">
              <Image src={heroImg} alt="" width={240} height={360} sizes="(max-width: 760px) 70vw, 60vw" priority />
            </span>
            <span aria-hidden="true">4</span>
          </h1>
          <p className={styles.text}>
            This page doesn&apos;t exist <span className={styles.dot} aria-hidden="true">·</span> <span className={styles.ru} lang="ru">Такой страницы нет</span>
          </p>
          <nav className={`mono ${styles.links}`}>
            <Link href="/en">→ Home</Link>
            <Link href="/ru" lang="ru">
              → На главную
            </Link>
          </nav>
        </main>
      </body>
    </html>
  )
}
