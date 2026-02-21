import './globals.css'
import type { Metadata } from 'next'
import Script from 'next/script'
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
  icons: {
    icon: 'https://res.cloudinary.com/ddyc6aljm/image/upload/v1770660658/Group_14_wvsc34.png',
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
      <head>
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-FH2KRX9EYH" />
        <Script id="google-tag-g-fh2krx9eyh">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', 'G-FH2KRX9EYH');`}
        </Script>
      </head>
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
