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
  // async rewrites() {
  //   return [
  //     {
  //       source: "/_fah/image/:path*",
  //       destination:
  //         "https://us-central1-nana-project-firebase.cloudfunctions.net/ext-image-processing-api-handler/:path*",
  //     },
  //   ];
  // },
};

export default nextConfig;
