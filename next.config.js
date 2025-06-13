/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['lhjunwhgvduwcaqrzoh.supabase.co'],
  },
}

module.exports = nextConfig;
