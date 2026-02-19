'use client'

import { usePathname } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/layout'

type DashboardRouteLayoutProps = {
  children: React.ReactNode
}

export default function DashboardRouteLayout({ children }: DashboardRouteLayoutProps) {
  const pathname = usePathname()

  // Keep onboarding setup outside the dashboard shell.
  if (pathname?.startsWith('/dashboard/setup')) {
    return <>{children}</>
  }

  return <DashboardLayout>{children}</DashboardLayout>
}
