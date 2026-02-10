import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import InquiryForm from '@/components/InquiryForm'

type ContactPageProps = {
  params: Promise<{ username: string }>
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { username } = await params
  const profile = await db.findProfile(username)

  if (!profile || profile.isPublished === false) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Contact {profile.name || profile.username}
          </p>
          <h1 className="text-3xl font-bold text-foreground">
            Send a message to {profile.name || profile.username}
          </h1>
          <p className="text-muted-foreground">
            Share project details, collaboration ideas, or hiring opportunities. Your message goes
            directly to their DevLink inbox.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <InquiryForm username={profile.username} profileName={profile.name || profile.username} />
        </div>
      </div>
    </div>
  )
}
