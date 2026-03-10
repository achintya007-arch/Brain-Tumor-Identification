/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Docker — generates a self-contained server.js in .next/standalone
  output: 'standalone',

  reactStrictMode: true,

  // Proxy /api calls to FastAPI in development
  async rewrites() {
    return [
      {
        source:      '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;