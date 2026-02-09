import './globals.css'
import type { Metadata } from 'next'
import { AuthProvider } from '@/components/providers/auth-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Toaster } from 'react-hot-toast'
import { absoluteUrl, getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from '@/lib/seo'

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: `${SITE_NAME} - Developer Portfolio Builder`,
  description: SITE_DESCRIPTION,
  keywords: ['developer portfolio', 'portfolio builder', 'developer showcase'],
  authors: [{ name: `${SITE_NAME} Team` }],
  alternates: {
    canonical: absoluteUrl('/'),
  },
  openGraph: {
    title: `${SITE_NAME} - Developer Portfolio Builder`,
    description: SITE_DESCRIPTION,
    url: absoluteUrl('/'),
    type: 'website',
    siteName: SITE_NAME,
    images: [
      {
        url: absoluteUrl('/opengraph-image'),
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} preview`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} - Developer Portfolio Builder`,
    description: SITE_DESCRIPTION,
    images: [absoluteUrl('/opengraph-image')],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster 
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: {
                  background: 'hsl(var(--card))',
                  color: 'hsl(var(--card-foreground))',
                  border: '1px solid hsl(var(--border))',
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
