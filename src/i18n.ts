import 'server-only'
import { locales, type Dictionary, type Locale } from './i18n-config'

// dictionaries load on the server only, so translations never reach the client bundle
const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import('./dictionaries/en.json').then((m) => m.default),
  ru: () => import('./dictionaries/ru.json').then((m) => m.default),
}

export { locales, type Locale }

export const hasLocale = (locale: string): locale is Locale => (locales as readonly string[]).includes(locale)

export const getDictionary = async (locale: Locale) => dictionaries[locale]()
