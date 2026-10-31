import type { CSSProperties } from 'react'

// inline styles that also carry CSS custom properties, e.g. { '--i': 3 }
export type CSSVars = CSSProperties & Record<`--${string}`, string | number>
