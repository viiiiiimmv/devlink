'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowRight,
  Check,
  Code,
  Eye,
  LayoutGrid,
  Palette,
  Share,
  Sparkles,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SimpleThemeToggle } from '@/components/ui/theme-toggle'
import { templateOptions, themeOptions } from '@/lib/profile-customization'

const revealContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
}

const revealItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
}

const templatePreviewGradients: Record<string, string> = {
  editorial: 'linear-gradient(140deg, #0f172a 0%, #334155 65%, #64748b 100%)',
  bento: 'linear-gradient(140deg, #0f172a 0%, #0f4c81 55%, #00a3b9 100%)',
  terminal: 'linear-gradient(140deg, #020617 0%, #052e16 55%, #166534 100%)',
  glass: 'linear-gradient(140deg, #0b132b 0%, #1d4ed8 50%, #0ea5e9 100%)',
}

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute top-[20rem] -left-24 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-amber-500/15 blur-3xl" />
      </div>

      <motion.nav
        className="fixed top-0 z-50 w-full border-b border-border/70 bg-background/80 backdrop-blur-xl"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Code className="h-7 w-7 text-cyan-600" />
            <span
              className="text-xl font-extrabold tracking-tight"
              style={{ fontFamily: '"Space Grotesk", "Avenir Next", "Segoe UI", sans-serif' }}
            >
              DevLink
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <SimpleThemeToggle />
            <Link href="/auth/signin">
              <Button variant="ghost" className="hidden sm:inline-flex">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button className="bg-cyan-600 text-white hover:bg-cyan-700">Start Free</Button>
            </Link>
          </div>
        </div>
      </motion.nav>

      <main className="relative z-10">
        <section className="px-4 pb-16 pt-28 sm:px-6 lg:px-8 lg:pt-36">
          <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-12">
            <motion.div
              className="lg:col-span-6"
              variants={revealContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                variants={revealItem}
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300"
                style={{ fontFamily: '"IBM Plex Mono", "Menlo", "Consolas", monospace' }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                New Portfolio System
              </motion.div>

              <motion.h1
                variants={revealItem}
                className="text-4xl font-black leading-tight sm:text-5xl lg:text-6xl"
                style={{ fontFamily: '"Space Grotesk", "Avenir Next", "Segoe UI", sans-serif' }}
              >
                Your developer portfolio
                <span className="block bg-gradient-to-r from-cyan-500 via-blue-500 to-amber-500 bg-clip-text text-transparent">
                  redesigned in minutes
                </span>
              </motion.h1>

              <motion.p variants={revealItem} className="mt-6 max-w-xl text-lg text-muted-foreground">
                Build a profile that looks premium on day one. Pick a template, choose your color language,
                and publish your work with a clean personal URL.
              </motion.p>

              <motion.div variants={revealItem} className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <Link href="/auth/signin">
                  <Button size="lg" className="group bg-cyan-600 px-8 text-white hover:bg-cyan-700">
                    Create My Portfolio
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <a href="#templates">
                  <Button size="lg" variant="outline" className="px-8">
                    Explore Templates
                  </Button>
                </a>
              </motion.div>

              <motion.div variants={revealItem} className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-card/60 p-4">
                  <p className="text-2xl font-black">{templateOptions.length}</p>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Design Templates</p>
                </div>
                <div className="rounded-xl border border-border bg-card/60 p-4">
                  <p className="text-2xl font-black">{themeOptions.length}</p>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Theme Palettes</p>
                </div>
                <div className="rounded-xl border border-border bg-card/60 p-4">
                  <p className="text-2xl font-black">Live</p>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Instant Preview</p>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              className="lg:col-span-6"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.15 }}
            >
              <div className="rounded-3xl border border-border bg-card/70 p-4 shadow-2xl backdrop-blur-xl">
                <div className="mb-4 flex items-center justify-between rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <p
                    className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground"
                    style={{ fontFamily: '"IBM Plex Mono", "Menlo", "Consolas", monospace' }}
                  >
                    /preview/live
                  </p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 p-5 text-slate-100">
                  <div className="grid gap-4 sm:grid-cols-6">
                    <div className="sm:col-span-4 rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Profile Header</p>
                      <div className="mt-3 h-4 w-2/3 rounded bg-cyan-400/70" />
                      <div className="mt-2 h-3 w-full rounded bg-slate-400/40" />
                      <div className="mt-1.5 h-3 w-5/6 rounded bg-slate-400/25" />
                    </div>
                    <div className="sm:col-span-2 rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Stats</p>
                      <div className="mt-3 h-3 w-1/2 rounded bg-amber-400/70" />
                      <div className="mt-2 h-3 w-2/3 rounded bg-cyan-400/60" />
                    </div>
                    <div className="sm:col-span-3 rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Projects</p>
                      <div className="mt-3 space-y-2">
                        <div className="h-3 w-full rounded bg-slate-300/35" />
                        <div className="h-3 w-4/5 rounded bg-slate-300/25" />
                        <div className="h-3 w-2/3 rounded bg-slate-300/20" />
                      </div>
                    </div>
                    <div className="sm:col-span-3 rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Skills</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-md border border-white/20 px-2 py-1 text-xs">React</span>
                        <span className="rounded-md border border-white/20 px-2 py-1 text-xs">Node</span>
                        <span className="rounded-md border border-white/20 px-2 py-1 text-xs">TypeScript</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <motion.div
              className="mb-10 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2
                className="text-3xl font-black sm:text-4xl"
                style={{ fontFamily: '"Space Grotesk", "Avenir Next", "Segoe UI", sans-serif' }}
              >
                Why Developers Pick DevLink
              </h2>
              <p className="mt-3 text-muted-foreground">
                Built for speed, clarity, and profiles that feel personal.
              </p>
            </motion.div>

            <motion.div
              className="grid gap-4 md:grid-cols-3"
              variants={revealContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {[
                {
                  icon: LayoutGrid,
                  title: 'Template-first setup',
                  text: 'Start with a layout language that matches your style, then tune details.',
                },
                {
                  icon: Palette,
                  title: 'Theme control',
                  text: 'Switch across curated color systems without touching CSS.',
                },
                {
                  icon: Share,
                  title: 'Shareable by default',
                  text: 'Publish instantly and send one clean URL to recruiters or clients.',
                },
              ].map((item) => (
                <motion.div
                  key={item.title}
                  variants={revealItem}
                  whileHover={{ y: -4 }}
                  className="rounded-2xl border border-border bg-card/70 p-6 shadow-sm"
                >
                  <item.icon className="h-10 w-10 text-cyan-600" />
                  <h3 className="mt-4 text-xl font-bold">{item.title}</h3>
                  <p className="mt-2 text-muted-foreground">{item.text}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section id="templates" className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <motion.div
              className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div>
                <p
                  className="text-xs uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-300"
                  style={{ fontFamily: '"IBM Plex Mono", "Menlo", "Consolas", monospace' }}
                >
                  Design Languages
                </p>
                <h2
                  className="mt-2 text-3xl font-black sm:text-4xl"
                  style={{ fontFamily: '"Space Grotesk", "Avenir Next", "Segoe UI", sans-serif' }}
                >
                  Four templates, one polished workflow
                </h2>
              </div>
              <Link href="/auth/signin">
                <Button variant="outline" className="gap-2">
                  Try all templates
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
              variants={revealContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {templateOptions.map((template) => (
                <motion.article
                  key={template.id}
                  variants={revealItem}
                  whileHover={{ y: -4 }}
                  className="rounded-2xl border border-border bg-card/70 p-4"
                >
                  <div
                    className="h-28 rounded-xl border border-white/10"
                    style={{
                      backgroundImage:
                        templatePreviewGradients[template.id] ?? templatePreviewGradients.editorial,
                    }}
                  />
                  <h3 className="mt-4 text-lg font-bold">{template.name}</h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {template.vibe}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{template.description}</p>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <motion.div
              className="rounded-3xl border border-border bg-card/70 p-6 md:p-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="grid gap-8 md:grid-cols-3">
                {[
                  {
                    icon: Zap,
                    title: '1. Connect and setup',
                    text: 'Sign in, reserve your username, and load your base profile instantly.',
                  },
                  {
                    icon: Eye,
                    title: '2. Customize with preview',
                    text: 'Switch template, reorder sections, and tune themes with real-time feedback.',
                  },
                  {
                    icon: Check,
                    title: '3. Publish confidently',
                    text: 'Share one clean URL that looks consistent across desktop and mobile.',
                  },
                ].map((step) => (
                  <div key={step.title}>
                    <step.icon className="h-10 w-10 text-cyan-600" />
                    <h3 className="mt-4 text-xl font-bold">{step.title}</h3>
                    <p className="mt-2 text-muted-foreground">{step.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="px-4 pb-20 pt-10 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-5xl rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-cyan-600 to-blue-600 p-8 text-white md:p-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h2
                className="text-3xl font-black sm:text-4xl"
                style={{ fontFamily: '"Space Grotesk", "Avenir Next", "Segoe UI", sans-serif' }}
              >
                Ship a better first impression today
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-cyan-50/90">
                Create a portfolio that feels modern, intentional, and recruiter-ready from the first click.
              </p>
              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/auth/signin">
                  <Button size="lg" className="bg-white text-cyan-700 hover:bg-cyan-50">
                    Start Building
                  </Button>
                </Link>
                <Link href="/auth/signin">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/70 bg-transparent text-white hover:bg-white/10"
                  >
                    View Dashboard
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border/70 bg-background/80 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5 text-cyan-600" />
            <span className="font-semibold">DevLink</span>
          </div>
          <p className="text-sm text-muted-foreground">Portfolio builder for modern developers.</p>
        </div>
      </footer>
    </div>
  )
}
