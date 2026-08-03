---
id: NOVA-0024
date: 2026-08-03
type: security
area: public-site
---

# Security.txt for responsible reporting

## Summary

Nova IT now publishes `/.well-known/security.txt` with a technical contact,
expiry date, preferred languages and canonical URL.

## Why

Cloudflare flags missing `security.txt` as a security recommendation. Publishing
the file gives researchers and visitors a predictable way to report security
issues without exposing the admin or customer portals.

## Verification

- `/.well-known/security.txt` should be served from the public site.
- The static metadata headers in `public/_headers` should apply the same
  restrictive security headers used for `robots.txt` and `sitemap.xml`.
