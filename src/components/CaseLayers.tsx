import type { CSSVars } from '@/types/css'
import styles from './Cases.module.css'

const trips = [
  ['Metro', '46 ₽'],
  ['Bus', '46 ₽'],
  ['MCD', '62 ₽'],
]

// Troika: the finished screen comes apart into its layers as you scroll through the case (--e: 0 → 1, set by Cases).
// screen on top, components under it, tokens at the bottom: the system under the app 1.5M people open every day
export function CaseLayers() {
  return (
    <div className={`${styles.visual} ${styles.layers}`} aria-hidden="true">
      <div className={styles.stage}>
        {/* tokens */}
        <div className={`${styles.layer} ${styles.tokens}`} style={{ '--z': 0 } as CSSVars}>
          <span className={`${styles.tag} mono`}>tokens</span>
          <div className={styles.swatches}>
            {['var(--ember)', 'var(--ink)', 'var(--bone)', '#3ddc84'].map((c) => (
              <i key={c} style={{ background: c }} />
            ))}
          </div>
          <div className={styles.type}>
            <b>Aa</b>
            <b>Aa</b>
            <b>Aa</b>
          </div>
          <div className={styles.space}>
            {[4, 8, 16, 24].map((s) => (
              <i key={s} style={{ width: `${s * 0.6}cqh` }} />
            ))}
          </div>
          <p className="mono">radius.lg · 16</p>
        </div>

        {/* components: the same blocks as outlines with their names */}
        <div className={`${styles.layer} ${styles.comps}`} style={{ '--z': 1 } as CSSVars}>
          <span className={`${styles.tag} mono`}>components</span>
          <div className={styles.cCard}>
            <span className="mono">{'<Card />'}</span>
          </div>
          <div className={styles.cBtn}>
            <span className="mono">{'<Button />'}</span>
          </div>
          {trips.map(([t]) => (
            <div key={t} className={styles.cRow}>
              <span className="mono">{'<ListItem />'}</span>
            </div>
          ))}
        </div>

        {/* screen */}
        <div className={`${styles.layer} ${styles.screen}`} style={{ '--z': 2 } as CSSVars}>
          <span className={`${styles.tag} mono`}>screen</span>
          <p className={styles.appTitle}>Troika</p>
          <div className={styles.balance}>
            <span className="mono">Balance</span>
            <b>1 250 ₽</b>
          </div>
          <div className={styles.topup}>Top up</div>
          {trips.map(([t, p]) => (
            <div key={t} className={styles.trip}>
              <i />
              <span>{t}</span>
              <span>{p}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
