import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { connection } from 'next/server'

import { AuthProvider } from '@/components/auth/auth-provider'
import { Toaster } from '@/components/ui/sonner'

import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Nova IT – Adminportal',
    template: '%s · Nova IT Adminportal',
  },
  description:
    'Internt arbetsverktyg för Nova IT. Hantera kundärenden från kontaktformulär, supportassistent och kundportal.',
  robots: { index: false, follow: false },
  icons: {
    icon: [{ url: '/nova-it-mark.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/nova-it-mark.svg', type: 'image/svg+xml' }],
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0a1220',
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // En unik CSP-nonce skapas i middleware för varje dokumentrequest. Next kan
  // bara applicera den på sina bootstrap-skript när trädet renderas per request.
  await connection()

  return (
    <html lang="sv" className={`bg-background ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}
