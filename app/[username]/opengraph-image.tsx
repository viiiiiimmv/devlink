import { ImageResponse } from 'next/og'
import { db } from '@/lib/db'
import { clampText } from '@/lib/seo'

export const runtime = 'nodejs'
export const alt = 'Developer profile'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

type Params = {
  username: string
}

type OgImageProps = {
  params: Promise<Params>
}

function takeTopSkills(skills: string[] | undefined): string[] {
  if (!Array.isArray(skills)) return []
  const result: string[] = []
  for (const skill of skills) {
    if (typeof skill !== 'string') continue
    const normalized = skill.trim()
    if (!normalized) continue
    result.push(normalized)
    if (result.length >= 4) break
  }
  return result
}

export default async function ProfileOpenGraphImage({ params }: OgImageProps) {
  const { username } = await params
  let profile = null
  try {
    profile = await db.findProfile(username)
  } catch (error) {
    console.error('Profile OG image fetch error:', error)
  }

  const isPublished = profile?.isPublished !== false
  const displayName = isPublished ? (profile?.name?.trim() || username) : 'Developer Profile'
  const displayBio = isPublished
    ? (
      profile?.bio?.trim()
        ? clampText(profile.bio, 170)
        : `Explore ${displayName}'s portfolio with projects, skills, and experience.`
    )
    : 'This profile is currently private.'
  const skills = isPublished ? takeTopSkills(profile?.skills) : []

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '54px 62px',
          background:
            'radial-gradient(circle at 12% 20%, rgba(59,130,246,0.36), transparent 44%), radial-gradient(circle at 86% 14%, rgba(20,184,166,0.3), transparent 40%), linear-gradient(135deg, #0f172a 0%, #111827 52%, #082f49 100%)',
          color: '#e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                height: 54,
                width: 54,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f8fafc',
                fontSize: 26,
                fontWeight: 800,
              }}
            >
              {(displayName.charAt(0) || 'D').toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 18, color: '#7dd3fc' }}>Developer Portfolio</span>
              <span style={{ fontSize: 22, color: '#cbd5e1' }}>@{username}</span>
            </div>
          </div>
          <div style={{ fontSize: 20, color: '#22d3ee' }}>DevLink</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              fontSize: 72,
              lineHeight: 1.02,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              maxWidth: 980,
              color: '#f8fafc',
            }}
          >
            {clampText(displayName, 48)}
          </div>
          <div
            style={{
              fontSize: 30,
              color: '#cbd5e1',
              lineHeight: 1.3,
              maxWidth: 940,
            }}
          >
            {displayBio}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {skills.length > 0 ? (
            skills.map((skill) => (
              <div
                key={skill}
                style={{
                  padding: '10px 16px',
                  borderRadius: 999,
                  border: '1px solid rgba(148,163,184,0.45)',
                  backgroundColor: 'rgba(15,23,42,0.45)',
                  fontSize: 22,
                  color: '#e2e8f0',
                }}
              >
                {skill}
              </div>
            ))
          ) : (
            <div
              style={{
                padding: '10px 16px',
                borderRadius: 999,
                border: '1px solid rgba(148,163,184,0.45)',
                backgroundColor: 'rgba(15,23,42,0.45)',
                fontSize: 22,
                color: '#cbd5e1',
              }}
            >
              Projects | Skills | Experience
            </div>
          )}
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
