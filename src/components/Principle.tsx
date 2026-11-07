import type { Dictionary } from '@/i18n-config'
import { Tools } from './Tools'
import styles from './Principle.module.css'

// one principle, Tony Mak's "Operating Model" style, with the tools behind it (Studio Namma);
// the section stays a Server Component, only the tools row is interactive
export function Principle({ dict }: { dict: Pick<Dictionary, 'principle'> }) {
  const { principle } = dict
  return (
    <section className={styles.principle} id="principle">
      <article>
        <span className="mono">{principle.label}</span>
        <h3>{principle.title}</h3>
        <p>{principle.text}</p>
        <Tools />
      </article>
    </section>
  )
}
