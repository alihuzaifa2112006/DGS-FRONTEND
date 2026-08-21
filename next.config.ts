import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // `typedRoutes: true` is available, but it forces every shared component that
  // takes an `href: string` (Button, Logo, Footer) to cast to `Route`. Left off
  // so hrefs stay plain strings.
}

export default nextConfig
