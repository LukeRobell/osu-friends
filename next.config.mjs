/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'a.ppy.sh' },
      { protocol: 'https', hostname: 'assets.ppy.sh' },
      { protocol: 'https', hostname: 'osu.ppy.sh' },
    ],
  },
};

export default nextConfig;
