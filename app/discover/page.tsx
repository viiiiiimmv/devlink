import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Code, Search, Sparkles } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SimpleThemeToggle } from '@/components/ui/theme-toggle'
import { db } from '@/lib/db'
import { absoluteUrl, clampText, SITE_NAME } from '@/lib/seo'

const PAGE_SIZE = 12

type DiscoverSearchParams = {
  q?: string
  page?: string
}

type DiscoverPageProps = {
  searchParams: Promise<DiscoverSearchParams>
}

type DiscoverProfile = {
  username: string
  name?: string
  bio?: string
  skills?: string[]
  theme?: string
  template?: string
  profileImage?: string
  profilePhoto?: {
    url?: string
  }
}

export const metadata: Metadata = {
  title: `Discover Developers - ${SITE_NAME}`,
  description: 'Browse published developer portfolios and discover new talent on DevLink.',
  alternates: {
    canonical: absoluteUrl('/discover'),
  },
  openGraph: {
    title: `Discover Developers - ${SITE_NAME}`,
    description: 'Browse published developer portfolios and discover new talent on DevLink.',
    url: absoluteUrl('/discover'),
    type: 'website',
  },
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

const parsePage = (value: string | undefined): number => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 1
  return Math.max(1, Math.floor(parsed))
}

const getProfileImage = (profile: DiscoverProfile): string | undefined => {
  const photoUrl = typeof profile.profilePhoto?.url === 'string' ? profile.profilePhoto.url.trim() : ''
  if (photoUrl) return photoUrl

  const image = typeof profile.profileImage === 'string' ? profile.profileImage.trim() : ''
  if (image) return image

  return undefined
}

const getProfileName = (profile: DiscoverProfile): string => {
  const name = typeof profile.name === 'string' ? profile.name.trim() : ''
  if (name) return name
  return profile.username
}

const buildPageHref = (query: string, page: number): string => {
  const params = new URLSearchParams()
  if (query) params.set('q', query)
  if (page > 1) params.set('page', String(page))
  const serialized = params.toString()
  return serialized ? `/discover?${serialized}` : '/discover'
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const params = await searchParams
  const query = typeof params.q === 'string' ? params.q.trim() : ''
  const page = parsePage(params.page)
  const skip = (page - 1) * PAGE_SIZE

  const fetchedProfiles = query
    ? await db.searchProfiles(query, PAGE_SIZE + 1, skip)
    : await db.getAllProfiles(PAGE_SIZE + 1, skip)

  const hasMore = fetchedProfiles.length > PAGE_SIZE
  const profiles = fetchedProfiles.slice(0, PAGE_SIZE) as unknown as DiscoverProfile[]
  const showingFrom = profiles.length === 0 ? 0 : skip + 1
  const showingTo = skip + profiles.length

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute top-48 -left-16 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
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
            <Link href="/sparkforge" className="hidden sm:inline-flex">
              <Button variant="ghost">
                SparkForge
              </Button>
            </Link>
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
      </header>

      <main className="relative z-10 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl space-y-8">
          <section className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
              <Sparkles className="h-3.5 w-3.5" />
              Discover Talent
            </div>
            <div className="space-y-3">
              <h1
                className="text-4xl font-black leading-tight sm:text-5xl"
                style={{ fontFamily: '"Space Grotesk", "Avenir Next", "Segoe UI", sans-serif' }}
              >
                Discover published
                <span className="block bg-gradient-to-r from-cyan-500 via-blue-500 to-amber-500 bg-clip-text text-transparent">
                  developer portfolios
                </span>
              </h1>
              <p className="max-w-3xl text-muted-foreground">
                Search by name, username, bio, or skills to find developers and explore their public work.
              </p>
              <p className="text-sm text-muted-foreground">
                Want to discover active build concepts?{' '}
                <Link href="/sparkforge" className="font-semibold text-blue-600 hover:text-blue-700">
                  Open SparkForge
                </Link>
                .
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card/70 p-4 sm:p-6">
            <form action="/discover" method="get" className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="q"
                  defaultValue={query}
                  placeholder="Search developers by name, username, bio, or skills"
                  className="pl-9"
                />
              </div>
              <Button type="submit" className="sm:w-auto">
                Search
              </Button>
              {query ? (
                <Button asChild variant="ghost" className="sm:w-auto">
                  <Link href="/discover">Clear</Link>
                </Button>
              ) : null}
            </form>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>
                {profiles.length > 0
                  ? `Showing ${showingFrom}-${showingTo}${query ? ` for "${query}"` : ''}`
                  : query
                    ? `No results for "${query}"`
                    : 'No published profiles found yet'}
              </span>
              <span>Page {page}</span>
            </div>
          </section>

          {profiles.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No profiles found</CardTitle>
                <CardDescription>
                  {query
                    ? 'Try a broader keyword or clear search to browse all published portfolios.'
                    : 'There are no published portfolios yet.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link href={query ? '/discover' : '/auth/signin'}>
                    {query ? 'Browse all portfolios' : 'Create your portfolio'}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {profiles.map((profile) => {
                const profileName = getProfileName(profile)
                const profileImage = getProfileImage(profile)
                const bio = typeof profile.bio === 'string' ? profile.bio.trim() : ''
                const skills = Array.isArray(profile.skills) ? profile.skills.slice(0, 5) : []

                return (
                  <Card key={profile.username} className="flex h-full flex-col">
                    <CardHeader className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-11 w-11 border border-border">
                          <AvatarImage src={profileImage} alt={profileName} />
                          <AvatarFallback>{profileName.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <CardTitle className="truncate text-lg">{profileName}</CardTitle>
                          <p className="truncate text-sm text-muted-foreground">@{profile.username}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profile.template ? <Badge variant="secondary">{profile.template}</Badge> : null}
                        {profile.theme ? <Badge variant="outline">{profile.theme}</Badge> : null}
                      </div>
                    </CardHeader>

                    <CardContent className="flex-1 space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {bio ? clampText(bio, 150) : 'No bio added yet.'}
                      </p>
                      {skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {skills.map((skill) => (
                            <Badge key={`${profile.username}-${skill}`} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No skills listed yet.</p>
                      )}
                    </CardContent>

                    <CardFooter>
                      <Button asChild className="w-full">
                        <Link href={`/${profile.username}`}>
                          View Portfolio
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </section>
          )}

          {profiles.length > 0 ? (
            <section className="flex items-center justify-between gap-3">
              {page > 1 ? (
                <Button asChild variant="outline">
                  <Link href={buildPageHref(query, page - 1)}>Previous</Link>
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  Previous
                </Button>
              )}

              {hasMore ? (
                <Button asChild>
                  <Link href={buildPageHref(query, page + 1)}>Next</Link>
                </Button>
              ) : (
                <Button disabled>Next</Button>
              )}
            </section>
          ) : null}
        </div>
      </main>
    </div>
  )
}
