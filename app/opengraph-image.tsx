import { ImageResponse } from 'next/og'
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/seo'

export const alt = `${SITE_NAME} - Developer Portfolio Builder`
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px 64px',
          background:
            'radial-gradient(circle at 15% 20%, rgba(20,184,166,0.35), transparent 40%), radial-gradient(circle at 85% 10%, rgba(56,189,248,0.3), transparent 38%), linear-gradient(135deg, #020617 0%, #0f172a 48%, #0b1f32 100%)',
          color: '#f8fafc',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              height: 18,
              width: 18,
              borderRadius: 999,
              backgroundColor: '#22d3ee',
            }}
          />
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            {SITE_NAME}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              fontSize: 72,
              lineHeight: 1.04,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              maxWidth: 900,
            }}
          >
            Build a portfolio that gets noticed
          </div>
          <div
            style={{
              fontSize: 30,
              color: '#cbd5e1',
              lineHeight: 1.3,
              maxWidth: 920,
            }}
          >
            {SITE_DESCRIPTION}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, fontSize: 24, color: '#a5f3fc' }}>
          <span>Templates</span>
          <span>Custom Themes</span>
          <span>Shareable Profiles</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
