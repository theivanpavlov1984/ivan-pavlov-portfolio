import type { MetadataRoute } from 'next'

const SITE = 'https://theivanpavlov.com'
const languages = { en: `${SITE}/en`, ru: `${SITE}/ru` }

// served at /sitemap.xml: the two language versions of the one page, each pointing at the other
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE}/en`, alternates: { languages } },
    { url: `${SITE}/ru`, alternates: { languages } },
  ]
}
