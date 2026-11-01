import localFont from 'next/font/local'
import { Caveat, IBM_Plex_Mono, PT_Serif } from 'next/font/google'

// TT Travels Next: licensed set, subset to Latin + Cyrillic (~37 KB per style)
export const travels = localFont({
  src: [
    { path: './fonts/TTTravelsNext-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/TTTravelsNext-Italic.woff2', weight: '400', style: 'italic' },
    { path: './fonts/TTTravelsNext-Medium.woff2', weight: '500', style: 'normal' },
    { path: './fonts/TTTravelsNext-MediumItalic.woff2', weight: '500', style: 'italic' },
    { path: './fonts/TTTravelsNext-DemiBold.woff2', weight: '600', style: 'normal' },
    { path: './fonts/TTTravelsNext-DemiBoldItalic.woff2', weight: '600', style: 'italic' },
    { path: './fonts/TTTravelsNext-Bold.woff2', weight: '700', style: 'normal' },
    { path: './fonts/TTTravelsNext-BoldItalic.woff2', weight: '700', style: 'italic' },
  ],
  variable: '--font-travels',
  display: 'swap',
})

export const mono = IBM_Plex_Mono({
  weight: ['400', '500'],
  subsets: ['latin', 'cyrillic'],
  variable: '--font-mono',
  display: 'swap',
})

// RU italic accents (locked decision)
export const serif = PT_Serif({
  weight: '400',
  style: 'italic',
  subsets: ['latin', 'cyrillic'],
  variable: '--font-serif',
  display: 'swap',
})

// handwritten "Hi, I'm" in the logo
export const hand = Caveat({
  weight: '500',
  subsets: ['latin', 'cyrillic'],
  variable: '--font-hand',
  display: 'swap',
})
