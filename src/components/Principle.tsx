import type { Dictionary } from '@/i18n-config'
import styles from './Principle.module.css'

// one principle, Tony Mak's "Operating Model" style; static, so a Server Component
export function Principle({ dict }: { dict: Pick<Dictionary, 'principle'> }) {
  const { principle } = dict
  return (
    <section className={styles.principle}>
      <article>
        <span className="mono">{principle.label}</span>
        <h3>{principle.title}</h3>
        <p>{principle.text}</p>
      </article>
    </section>
  )
}
