import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@app/ui', '@app/auth', '@app/types'],
};

export default nextConfig;
