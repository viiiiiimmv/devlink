import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getServerSession } from 'next-auth/next'
import { ArrowLeft, ExternalLink, Github } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import MarkdownContent from '@/components/MarkdownContent'
import { absoluteUrl, clampText } from '@/lib/seo'

type ProjectRouteParams = {
  username: string
  projectId: string
}

type ProjectPageProps = {
  params: Promise<ProjectRouteParams>
}

type ProjectGalleryItem = {
  id: string
  url: string
  caption?: string
}

type ProjectMetric = {
  id: string
  label: string
  value: string
  detail?: string
}

type ProjectRecord = {
  id: string
  title: string
  description: string
  caseStudy?: string
  technologies?: string[]
  githubUrl?: string
  liveUrl?: string
  image?: string
  gallery?: ProjectGalleryItem[]
  metrics?: ProjectMetric[]
  featured?: boolean
}

const normalizeProject = (project: ProjectRecord): ProjectRecord => {
  const technologies = Array.isArray(project.technologies)
    ? project.technologies.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : []
  const gallery = Array.isArray(project.gallery)
    ? project.gallery.filter((item): item is ProjectGalleryItem =>
      typeof item?.url === 'string' && item.url.trim().length > 0)
    : []
  const metrics = Array.isArray(project.metrics)
    ? project.metrics.filter((item): item is ProjectMetric =>
      typeof item?.label === 'string'
      && item.label.trim().length > 0
      && typeof item?.value === 'string'
      && item.value.trim().length > 0)
    : []

  return {
    ...project,
    technologies,
    gallery,
    metrics,
  }
}

const getProjectDescription = (project: ProjectRecord) => {
  const source = typeof project.caseStudy === 'string' && project.caseStudy.trim().length > 0
    ? project.caseStudy
    : project.description
  return clampText(source || 'Project case study on DevLink.', 160)
}

const getProjectContext = async ({ username, projectId }: ProjectRouteParams) => {
  const profile = await db.findProfile(username)
  if (!profile) return null

  const project = Array.isArray(profile.projects)
    ? profile.projects.find((item) => item.id === projectId) as ProjectRecord | undefined
    : undefined

  if (!project) return null

  return {
    profile,
    project: normalizeProject(project),
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { username, projectId } = await params
  const context = await getProjectContext({ username, projectId })

  if (!context) {
    return {
      title: 'Project not found',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const { profile, project } = context
  if (profile.isPublished === false) {
    return {
      title: `${project.title} - Draft case study`,
      description: 'This case study is currently not published.',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const projectPath = `/${encodeURIComponent(profile.username)}/projects/${encodeURIComponent(project.id)}`
  const projectUrl = absoluteUrl(projectPath)
  const description = getProjectDescription(project)

  return {
    title: `${project.title} - ${profile.name}`,
    description,
    alternates: {
      canonical: projectUrl,
    },
    openGraph: {
      title: `${project.title} - ${profile.name}`,
      description,
      url: projectUrl,
      type: 'article',
      images: typeof project.image === 'string' && project.image.trim().length > 0
        ? [{ url: project.image }]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${project.title} - ${profile.name}`,
      description,
      images: typeof project.image === 'string' && project.image.trim().length > 0
        ? [project.image]
        : undefined,
    },
  }
}

export default async function ProjectCaseStudyPage({ params }: ProjectPageProps) {
  const { username, projectId } = await params
  const context = await getProjectContext({ username, projectId })
  if (!context) {
    notFound()
  }

  const { profile, project } = context

  const session = await getServerSession(authOptions)
  const viewerUsername =
    session?.user && typeof (session.user as { username?: unknown }).username === 'string'
      ? (session.user as { username: string }).username
      : null
  const canViewUnpublished = viewerUsername === profile.username

  if (profile.isPublished === false && !canViewUnpublished) {
    notFound()
  }

  const galleryItems = (() => {
    const items: ProjectGalleryItem[] = []
    if (typeof project.image === 'string' && project.image.trim().length > 0) {
      items.push({
        id: `${project.id}-cover`,
        url: project.image,
        caption: 'Project cover',
      })
    }
    for (const item of project.gallery || []) {
      if (!items.some((existing) => existing.url === item.url)) {
        items.push(item)
      }
    }
    return items
  })()

  const caseStudyMarkdown = typeof project.caseStudy === 'string' && project.caseStudy.trim().length > 0
    ? project.caseStudy
    : project.description

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-8">
          <Link
            href={`/${profile.username}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {profile.name}&apos;s profile
          </Link>
        </div>

        <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              {project.featured ? (
                <span className="inline-flex rounded-full border border-blue-300/50 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-300">
                  Featured
                </span>
              ) : null}
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{project.title}</h1>
              <p className="max-w-3xl text-base text-muted-foreground">
                {project.description}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              {project.githubUrl ? (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  <Github className="h-4 w-4" />
                  Code
                </a>
              ) : null}
              {project.liveUrl ? (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  <ExternalLink className="h-4 w-4" />
                  Live
                </a>
              ) : null}
            </div>
          </div>

          {Array.isArray(project.technologies) && project.technologies.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {project.technologies.map((tech) => (
                <span
                  key={`${project.id}-${tech}`}
                  className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  {tech}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        {Array.isArray(project.metrics) && project.metrics.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-xl font-bold">Key Metrics</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {project.metrics.map((metric) => (
                <article key={metric.id} className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{metric.label}</p>
                  <p className="mt-1 text-2xl font-black">{metric.value}</p>
                  {metric.detail ? (
                    <p className="mt-1 text-sm text-muted-foreground">{metric.detail}</p>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {galleryItems.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-xl font-bold">Image Gallery</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {galleryItems.map((item) => (
                <figure key={item.id} className="overflow-hidden rounded-xl border border-border bg-card">
                  <div className="relative aspect-[16/10]">
                    <Image
                      src={item.url}
                      alt={item.caption || `${project.title} screenshot`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  {item.caption ? (
                    <figcaption className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
                      {item.caption}
                    </figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h2 className="text-xl font-bold">Case Study</h2>
          <MarkdownContent content={caseStudyMarkdown} className="mt-3 text-foreground" />
        </section>
      </main>
    </div>
  )
}
