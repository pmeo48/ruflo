/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] }
  },
  images: {
    domains: ['via.placeholder.com', 'placehold.co'],
  },
}

module.exports = nextConfig
