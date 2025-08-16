"use client"

import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)', padding: '2rem' }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: '#6366f1', marginBottom: '1rem' }}>404</h1>
      <p style={{ fontSize: '1.2rem', color: '#64748b', marginBottom: '2rem', textAlign: 'center' }}>
        Sorry, the page you are looking for does not exist.<br />
        It might have been moved or deleted.
      </p>
      <Link href="/" style={{ color: '#6366f1', textDecoration: 'underline', fontWeight: '500', fontSize: '1rem' }}>
        Go back to Home
      </Link>
    </div>
  )
}
