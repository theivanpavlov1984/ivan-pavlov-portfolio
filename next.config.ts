import type { NextConfig } from 'next'

// static portfolio: no server data, so the Cache Components model is off (keeps dynamicParams available)
const nextConfig: NextConfig = {
  // AVIF first (about 20–50% lighter than WebP for the full-screen hero), WebP for browsers without it
  images: { formats: ['image/avif', 'image/webp'] },
  // the root layout lives in [lang], so a branded 404 has to be a whole document of its own (app/global-not-found.tsx)
  experimental: { globalNotFound: true },
}

export default nextConfig
