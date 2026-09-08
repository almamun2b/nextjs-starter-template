import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    // Avatar uploads go through a Server Action; Next rejects request bodies
    // over 1 MB by default, before the action body ever runs.
    serverActions: { bodySizeLimit: '4mb' },
  },
  async rewrites() {
    return [
      {
        source: '/server/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/:path*`,
      },
    ]
  },
}

export default nextConfig
