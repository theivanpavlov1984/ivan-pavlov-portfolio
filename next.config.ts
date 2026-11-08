import type { NextConfig } from 'next'

// static portfolio: no server data, so the Cache Components model is off (keeps dynamicParams available)
const nextConfig: NextConfig = {
  // AVIF first (about 20–50% lighter than WebP for the full-screen hero), WebP for browsers without it
  images: { formats: ['image/avif', 'image/webp'] },
}

export default nextConfig
