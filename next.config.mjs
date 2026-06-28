/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'a.ppy.sh' },
      { protocol: 'https', hostname: 'assets.ppy.sh' },
      { protocol: 'https', hostname: 'osu.ppy.sh' },
    ],
  },
  async headers() {
    return [
      {
        // Allow Twitch to load these pages in their iframe
        source: '/twitch-extension/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors https://supervisor.ext-twitch.tv https://twitch.tv https://*.twitch.tv",
          },
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
