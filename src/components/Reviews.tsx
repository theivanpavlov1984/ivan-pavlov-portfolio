import Image from 'next/image'
import { reviews } from '@/content/reviews'
import type { Dictionary } from '@/i18n-config'
import { RevealHeading } from './RevealHeading'
import { RevealText } from './RevealText'
import { ReviewMore } from './ReviewMore'
import styles from './Reviews.module.css'

// LinkedIn recommendations styled as approvals on a pull request; quotes come in word by word,
// the full text opens in an animated accordion
export function Reviews({ dict }: { dict: Pick<Dictionary, 'reviews'> }) {
  const { reviews: t } = dict
  return (
    <section className={styles.reviews} id="reviews">
      <div className={styles.head}>
        <div>
          <p className="mono">{t.label}</p>
          <RevealHeading before={t.titleBefore} em={t.titleEm} className={styles.title} />
        </div>
        <p className={`${styles.status} mono`}>
          <span className={styles.ok}>✓</span> {t.status}
        </p>
      </div>

      <div className={styles.grid}>
        {reviews.map((r) => (
          <article key={r.name} className={styles.card}>
            <header className={styles.top}>
              <Image src={r.avatar} alt="" width={40} height={40} className={styles.avatar} data-tag="<Avatar />" />
              <p>
                <b>{r.name}</b> {t.approvedChanges}
                <br />
                <span className="mono">
                  {t.now} {r.role} — {t[r.relation]} · {r.date}
                </span>
              </p>
              <span className={`${styles.badge} mono`}>✓ Approved</span>
            </header>
            <RevealText text={`“${r.quote}”`} className={styles.quote} lang="en" />
            <p className={`${styles.labels} mono`}>
              {r.labels.map((l) => (
                <i key={l}>{l}</i>
              ))}
            </p>
            <ReviewMore label={t.showFull} paragraphs={r.full} />
          </article>
        ))}
      </div>
    </section>
  )
}
