import type { NextConfig } from "next";

/**
 * Static export for GitHub Pages: `next build` writes plain HTML/CSS/JS to ./out.
 * - trailingSlash: every page becomes /name/index.html, which GitHub Pages serves reliably.
 * - images.unoptimized: Pages has no image-resizing server; images are served as-is.
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  reactStrictMode: true,
  env: { NEXT_PUBLIC_BUILD_TIME: new Date().toISOString() },
};

export default nextConfig;
