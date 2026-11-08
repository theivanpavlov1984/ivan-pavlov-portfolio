import type { MetadataRoute } from 'next'

// served at /robots.txt; the proxy skips paths with a file extension, so it is not redirected to /en
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://theivanpavlov.com/sitemap.xml',
  }
}
