import type en from './dictionaries/en.json'

// shared by server and client components (no 'server-only' here)
export const locales = ['en', 'ru'] as const
export type Locale = (typeof locales)[number]
export type Dictionary = typeof en
