import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Add polyfills for server-side rendering
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        'pdfjs-dist/build/pdf.worker.entry': false,
      };
    }
    
    // Handle PDF.js worker
    config.resolve.alias = {
      ...config.resolve.alias,
      'pdfjs-dist/build/pdf.worker.entry': 'pdfjs-dist/build/pdf.worker.min.js',
    };

    return config;
  },

  transpilePackages: ['react-pdf'],
};

export default nextConfig;
