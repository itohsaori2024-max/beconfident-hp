/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Discord のアイコン画像（cdn.discordapp.com）を next/image で表示できるようにする
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        pathname: '/**',
      },
    ],
  },

  // Discord Embedded App（iframe / Webview）内で表示するためのヘッダー設定。
  // Discord のアクティビティは `https://discord.com` から iframe 埋め込みされるため、
  // X-Frame-Options ではなく CSP frame-ancestors で許可する。
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://discord.com https://*.discord.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
