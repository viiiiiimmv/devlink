import type { Metadata } from 'next'
import Link from 'next/link'
import { Code2, Lightbulb } from 'lucide-react'
import SparkForgeBoard from '@/components/sparkforge/board'
import { Button } from '@/components/ui/button'
import { SimpleThemeToggle } from '@/components/ui/theme-toggle'
import { absoluteUrl, SITE_NAME } from '@/lib/seo'

export const metadata: Metadata = {
  title: `SparkForge Ideas - ${SITE_NAME}`,
  description: 'Post ideas, discover collaborators, send sparks, and connect to build together on DevLink.',
  alternates: {
    canonical: absoluteUrl('/sparkforge'),
  },
  openGraph: {
    title: `SparkForge Ideas - ${SITE_NAME}`,
    description: 'Post ideas, discover collaborators, send sparks, and connect to build together on DevLink.',
    url: absoluteUrl('/sparkforge'),
    type: 'website',
  },
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function SparkForgePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute top-48 -left-16 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Code2 className="h-6 w-6 text-blue-600" />
            <span
              className="text-lg font-extrabold tracking-tight"
              style={{ fontFamily: '"Space Grotesk", "Avenir Next", "Segoe UI", sans-serif' }}
            >
              DevLink
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <SimpleThemeToggle />
            <Link href="/discover" className="hidden sm:inline-flex">
              <Button variant="ghost">Discover</Button>
            </Link>
            <Link href="/auth/signin" className="hidden sm:inline-flex">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/dashboard/sparkforge">
              <Button className="bg-blue-600 text-white hover:bg-blue-700">
                <Lightbulb className="mr-1.5 h-4 w-4" />
                Open in Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        <SparkForgeBoard />
      </main>
    </div>
  )
}
