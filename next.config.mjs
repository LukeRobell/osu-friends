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
        // Allow Twitch to iframe these pages — CSP frame-ancestors takes precedence
        // over X-Frame-Options in modern browsers, so we omit X-Frame-Options entirely
        // (ALLOWALL is not a valid value and can cause browsers to block the frame)
        source: '/twitch-extension/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://supervisor.ext-twitch.tv https://twitch.tv https://*.twitch.tv https://dashboard.twitch.tv https://extension-files.twitch.tv",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
