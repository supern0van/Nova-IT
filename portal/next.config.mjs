import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    unoptimized: true,
  },
  // OBS: next.config.mjs's headers()/poweredByHeader tillämpas INTE av
  // OpenNext på Cloudflare Workers (bekräftat live) - säkerhetsheaders sätts
  // i stället i middleware.ts, som garanterat körs på varje request.
  poweredByHeader: false,
}

export default nextConfig
