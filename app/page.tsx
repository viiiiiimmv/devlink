import Link from 'next/link'
import { ArrowRight, Code2, Compass, Inbox, Lightbulb, Sparkles, UsersRound, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SimpleThemeToggle } from '@/components/ui/theme-toggle'

const launchPaths = [
  {
    icon: Zap,
    title: 'Build',
    text: 'Shape your profile and go live fast.',
    href: '/auth/signin?from=/dashboard/setup',
    cta: 'Start setup',
  },
  {
    icon: Compass,
    title: 'Discover',
    text: 'Find developers and fresh portfolios.',
    href: '/discover',
    cta: 'Open discover',
  },
  {
    icon: Lightbulb,
    title: 'SparkForge',
    text: 'Post ideas and find people to build with.',
    href: '/sparkforge',
    cta: 'Open SparkForge',
  },
  {
    icon: Inbox,
    title: 'Inbox',
    text: 'Run outreach and replies in one place.',
    href: '/auth/signin?from=/dashboard',
    cta: 'Open inbox',
  },
]

const previewStats = [
  { label: 'Profile views', value: '2.4k' },
  { label: 'New inquiries', value: '08' },
  { label: 'Pulse unread', value: '03' },
]

const quickCapsules = ['Custom URL', 'Live inbox', 'Network sparks', 'SparkForge ideas']

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(221_83%_53%_/_0.10),transparent_58%)] dark:bg-[radial-gradient(circle_at_top,hsl(217_91%_60%_/_0.14),transparent_55%)]" />
        <div className="absolute -top-24 left-[10%] h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute top-48 right-[6%] h-[26rem] w-[26rem] rounded-full bg-cyan-500/18 blur-3xl" />
        <div className="absolute -bottom-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-sky-500/15 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
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
            <Link href="/sparkforge" className="hidden sm:inline-flex">
              <Button variant="ghost">SparkForge</Button>
            </Link>
            <Link href="/auth/signin" className="hidden sm:inline-flex">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/auth/signin">
              <Button className="bg-blue-600 text-white hover:bg-blue-700">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl space-y-10 px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        <section className="grid gap-6 lg:grid-cols-12 lg:items-stretch">
          <Card className="relative overflow-hidden border-blue-200/70 bg-card/85 backdrop-blur lg:col-span-7 dark:border-blue-900/40">
            <div className="pointer-events-none absolute -top-20 right-0 h-56 w-56 rounded-full bg-blue-500/15 blur-3xl" />
            <CardContent className="space-y-6 p-7 sm:p-9">
              <Badge className="w-fit gap-1.5 bg-blue-600/90 text-white hover:bg-blue-600">
                <Sparkles className="h-3.5 w-3.5" />
                New Welcome
              </Badge>

              <h1
                className="max-w-3xl text-4xl font-black leading-[1.05] sm:text-5xl md:text-6xl"
                style={{ fontFamily: '"Space Grotesk", "Avenir Next", "Segoe UI", sans-serif' }}
              >
                Build a developer brand
                <span className="block bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-500 bg-clip-text text-transparent">
                  that feels alive.
                </span>
              </h1>

              <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                Clean, sharp, and ready for launch.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href="/auth/signin">
                  <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-700">
                    Enter dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/discover">
                  <Button size="lg" variant="outline">
                    Explore discover
                  </Button>
                </Link>
                <Link href="/sparkforge">
                  <Button size="lg" variant="outline">
                    Explore SparkForge
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap gap-2">
                {quickCapsules.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-blue-200/70 bg-blue-50/80 px-3 py-1.5 text-xs font-medium text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-blue-200/70 bg-card/85 backdrop-blur lg:col-span-5 dark:border-blue-900/40">
            <div className="pointer-events-none absolute -right-16 top-6 h-44 w-44 rounded-full bg-cyan-500/20 blur-3xl" />
            <CardContent className="p-6 sm:p-7">
              <div className="rounded-2xl border border-border/80 bg-background/75 p-4 shadow-sm backdrop-blur">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">@yourname</p>
                  <span className="inline-flex items-center rounded-full border border-blue-300/60 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:border-blue-900/60 dark:text-blue-300">
                    Live
                  </span>
                </div>
                <div className="space-y-2.5">
                  {previewStats.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-lg border border-border/80 bg-muted/40 px-3 py-2"
                    >
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-semibold text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { icon: Zap, label: 'Boost' },
                  { icon: UsersRound, label: 'Connect' },
                  { icon: Inbox, label: 'Reply' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-border/80 bg-muted/35 px-2 py-3 text-center"
                  >
                    <item.icon className="h-4 w-4 text-blue-600" />
                    <span className="text-[11px] font-medium text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2
              className="text-2xl font-black sm:text-3xl"
              style={{ fontFamily: '"Space Grotesk", "Avenir Next", "Segoe UI", sans-serif' }}
            >
              Pick your path
            </h2>
            <Link href="/discover" className="hidden sm:inline-flex">
              <Button variant="ghost">See discover</Button>
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {launchPaths.map((path) => (
              <Card
                key={path.title}
                className="group relative overflow-hidden border-border/80 bg-card/80 backdrop-blur transition-all hover:-translate-y-1 hover:border-blue-300/80 hover:shadow-xl hover:shadow-blue-500/10"
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-blue-500/10 blur-xl transition-opacity group-hover:opacity-100" />
                <CardContent className="space-y-5 p-6">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40">
                    <path.icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{path.title}</h3>
                    <p className="text-sm text-muted-foreground">{path.text}</p>
                  </div>
                  <Link href={path.href}>
                    <Button variant="outline" className="w-full">
                      {path.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-blue-200/70 bg-blue-50/75 p-6 dark:border-blue-900/40 dark:bg-blue-950/20 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">
                Ready to go
              </p>
              <h3
                className="text-2xl font-black"
                style={{ fontFamily: '"Space Grotesk", "Avenir Next", "Segoe UI", sans-serif' }}
              >
                Make your link impossible to ignore.
              </h3>
            </div>
            <Link href="/auth/signin">
              <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-700">
                Launch now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
