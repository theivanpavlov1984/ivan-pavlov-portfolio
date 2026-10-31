'use client'

import { useEffect, useRef, useState } from 'react'
import { contacts } from '@/content/contacts'
import type { Dictionary } from '@/i18n-config'
import { RevealHeading } from './RevealHeading'
import styles from './Footer.module.css'

type Props = { dict: Pick<Dictionary, 'footer'> }

const copy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false // clipboard needs a user click and a secure context
  }
}

// terminal commands: printed output, then the action
const commands = [
  { id: 'email', label: 'contact --email', out: contacts.email },
  { id: 'telegram', label: 'open telegram', out: `opening ${contacts.telegram.url.replace('https://', '')} …`, url: contacts.telegram.url },
  { id: 'linkedin', label: 'open linkedin', out: 'opening linkedin.com/in/theivanpavlov …', url: contacts.linkedin.url },
  { id: 'cv-en', label: 'download cv --lang=en', out: 'ivan-pavlov-cv-en.pdf  ███████████ 100%', url: contacts.cv.en },
  { id: 'cv-ru', label: 'download cv --lang=ru', out: 'ivan-pavlov-cv-ru.pdf  ███████████ 100%', url: contacts.cv.ru },
] as const

// CTA + terminal with contacts + bottom bar
export function Footer({ dict }: Props) {
  const { footer } = dict
  const term = useRef<HTMLDivElement>(null)
  const typing = useRef(0)
  const [out, setOut] = useState('')
  const [ran, setRan] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [time, setTime] = useState('')

  // type text char by char; a newer command cancels the older one
  const type = async (text: string, speed: number) => {
    const run = ++typing.current
    for (let i = 1; i <= text.length; i++) {
      if (run !== typing.current) return false
      setOut(text.slice(0, i))
      await new Promise((r) => setTimeout(r, speed))
    }
    return true
  }

  const runCommand = async (cmd: (typeof commands)[number]) => {
    setRan(cmd.id)
    if (!(await type(cmd.out, 14))) return
    if (cmd.id === 'email') {
      if (await copy(contacts.email)) setOut(`${cmd.out}\n→ ${footer.copied}`)
    } else if ('url' in cmd) {
      window.open(cmd.url, '_blank', 'noopener')
    }
  }

  const copyEmail = async () => {
    const ok = await copy(contacts.email)
    setToast(ok ? `${footer.copied}  ${contacts.email}` : contacts.email)
    setTimeout(() => setToast(null), 1800)
  }

  useEffect(() => {
    // show how it works: `contact --email` types itself once the terminal scrolls in (no clipboard without a click)
    const io = new IntersectionObserver(
      ([en]) => {
        if (!en.isIntersecting) return
        io.disconnect()
        setRan('email')
        type(contacts.email, 28)
      },
      { threshold: 0.6 },
    )
    io.observe(term.current!)

    // local time in Tbilisi
    const tick = () =>
      setTime(new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Tbilisi', hour: '2-digit', minute: '2-digit' }))
    tick()
    const id = setInterval(tick, 10_000)
    return () => {
      io.disconnect()
      clearInterval(id)
    }
  }, [])

  return (
    <>
      <section className={styles.cta} id="contact">
        <p className="mono">{footer.label}</p>
        <RevealHeading before={footer.ctaBefore} em={footer.ctaEm} className={styles.title} />
        <p className={`${styles.status} mono`}>
          <span className={styles.dot} /> {footer.status}
        </p>

        <div ref={term} className={`${styles.term} mono`}>
          <div className={styles.bar}>
            <i />
            <i />
            <i />
            <span>ivan@portfolio: ~/contact</span>
          </div>
          <div className={styles.body}>
            <p className={styles.hint}>{footer.termHint}</p>
            {commands.map((c) => (
              <button key={c.id} data-ran={ran === c.id} data-tag="<run>" onClick={() => runCommand(c)}>
                <b>$</b> {c.label}
              </button>
            ))}
            <p className={styles.out} aria-live="polite">
              {out}
            </p>
            <p>
              <b>$</b> <span className={styles.caret} />
            </p>
          </div>
        </div>

        <p className={styles.plain}>
          {footer.orEmail} <button data-tag="<copy>" onClick={copyEmail}>
            {contacts.email}
          </button>
        </p>
      </section>

      <footer className={`${styles.footBar} mono`}>
        <span>{footer.designedBy}</span>
        <span>Tbilisi {time}</span>
        <span>© 2026</span>
        <a href="#hero">{footer.backToTop}</a>
      </footer>

      <div className={`${styles.toast} mono`} data-on={toast !== null} role="status">
        {toast}
      </div>
    </>
  )
}
