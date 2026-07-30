import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=15552000; includeSubDomains' },
  {
    key: 'Content-Security-Policy',
    // Klienten pratar direkt med Supabase (inloggning, MFA) - måste tillåtas
    // i connect-src, annars blockerar CSP:n dessa anrop i webbläsaren.
    value: [
      "default-src 'self'",
      "script-src 'self'",
      "connect-src 'self' https://*.supabase.co",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    unoptimized: true,
  },
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }]
  },
}

export default nextConfig
