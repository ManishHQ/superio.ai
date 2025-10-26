import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self' https:; script-src 'self' 'unsafe-eval' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https: blob: http://localhost:5001 http://127.0.0.1:5001; font-src 'self' data: https:; connect-src 'self' http://localhost:5001 http://127.0.0.1:5000 http://localhost:5001 http://127.0.0.1:5001 http://localhost:8000 http://127.0.0.1:8000 https: wss: ws:; worker-src 'self' blob:; frame-src 'self' https:;",
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
