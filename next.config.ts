import type { NextConfig } from "next";

// @ts-check
/** @type {import ('next').NextConfig} */

const nextConfig: NextConfig = {
  images: {
    unoptimized: false,
    // loader: "custom",
    // loaderFile: "./loader.js",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  webpack(config) {
    // 1. Next.jsにデフォルトで設定されているSVGのルールを取得
    const fileLoaderRule = config.module.rules.find((rule: any) =>
      rule.test?.test?.(".svg"),
    );

    config.module.rules.push(
      // 2. 取得したルールを、ReactコンポーネントとしてインポートされるSVGを
      //    除外するように変更する
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/, // *.svg?url でインポートされた場合のみ適用
      },
      // 3. ReactコンポーネントとしてインポートされるSVG用の新しいルールを追加
      {
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        resourceQuery: { not: /url/ }, // *.svg?url 以外でインポートされた場合に適用
        use: ["@svgr/webpack"],
      },
    );

    // 4. もとのSVGルールを無効化
    fileLoaderRule.exclude = /\.svg$/i;

    return config;
  },
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
