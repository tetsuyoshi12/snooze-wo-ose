/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // 環境変数の検証
  env: {
    NEXT_PUBLIC_API_ENDPOINT: process.env.NEXT_PUBLIC_API_ENDPOINT,
  },
  // 画像最適化設定
  images: {
    domains: [],
  },
  // 本番ビルド設定
  output: 'standalone',
};

module.exports = nextConfig;
