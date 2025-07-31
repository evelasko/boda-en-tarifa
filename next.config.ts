import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Alternative: If you want to use @svgr/webpack with Turbopack, use this instead:
  // turbopack: {
  //   rules: {
  //     '*.svg': {
  //       loaders: ['@svgr/webpack'],
  //       as: '*.js',
  //     },
  //   },
  // },
};

export default nextConfig;
