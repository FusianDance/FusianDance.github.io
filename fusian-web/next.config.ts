import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

const basePath = process.env.NODE_ENV === "production" ? "" : "";

// Load ignored build paths if they exist
let ignoredPaths: string[] = [];
try {
  const ignoredPathsFile = path.join(__dirname, 'ignored-build-paths.json');
  if (fs.existsSync(ignoredPathsFile)) {
    const ignoredPaths = JSON.parse(fs.readFileSync(ignoredPathsFile, 'utf8')) || [];
    console.log('🚫 Excluding paths from build:', ignoredPaths.length > 0 ? ignoredPaths.join(', ') : 'none');
  }
} catch (error) {
  console.warn('⚠️  Could not load ignored-build-paths.json, including all pages');
}

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  basePath: basePath,
  assetPrefix: basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  // Exclude disabled pages from the build
  ...(ignoredPaths.length > 0 && {
    pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
    webpack: (config, { isServer }) => {
      // Add ignored paths to webpack's ignore plugin
      if (isServer) {
        config.module = config.module || {};
        config.module.rules = config.module.rules || [];
        
        // Add a rule to ignore disabled pages
        config.module.rules.push({
          test: (modulePath: string) => {
            return ignoredPaths.some(pattern => {
              const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
              return regex.test(modulePath);
            });
          },
          loader: 'null-loader',
        });
      }
      return config;
    },
  }),
};

export default nextConfig;
