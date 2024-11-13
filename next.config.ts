import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    ppr: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
      {
        hostname: 'nazc9sosqxxi4idj.public.blob.vercel-storage.com',
      },
      {
        hostname: 'fal.media',
      }
    ],
  },
};

export default nextConfig;
