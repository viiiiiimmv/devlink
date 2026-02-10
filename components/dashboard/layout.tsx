'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  User, 
  Briefcase, 
  Award, 
  BookOpen, 
  Settings,
  Palette,
  MessageSquare,
  Download,
  LogOut,
  Menu,
  X,
  Code,
  Eye,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SimpleThemeToggle } from '@/components/ui/theme-toggle'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
  { name: 'Projects', href: '/dashboard/projects', icon: Code },
  { name: 'Experience', href: '/dashboard/experience', icon: Briefcase },
  { name: 'Testimonials', href: '/dashboard/testimonials', icon: MessageSquare },
  { name: 'Certifications', href: '/dashboard/certifications', icon: Award },
  { name: 'Research Papers', href: '/dashboard/researches', icon: BookOpen },
  { name: 'Import', href: '/dashboard/import', icon: Download },
  { name: 'Customise', href: '/dashboard/customise', icon: Palette },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false)
  const [isDesktopHovering, setIsDesktopHovering] = useState(false)
  const username = (session?.user as { username?: string | null } | undefined)?.username
  const userImage =
    typeof session?.user?.image === 'string' && session.user.image.trim().length > 0
      ? session.user.image
      : undefined
  const isDesktopExpanded = !isDesktopCollapsed || isDesktopHovering

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  const handleDesktopLogoClick = () => {
    setIsDesktopCollapsed((current) => !current)
    setIsDesktopHovering(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <div className={`lg:hidden fixed inset-0 z-50 ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div 
          className={`fixed inset-0 bg-black/60 transition-opacity ${
            sidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setSidebarOpen(false)}
        />
        
        <div className={`fixed inset-y-0 left-0 flex w-full max-w-xs transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex flex-col w-full bg-card shadow-xl">
            <div className="flex items-center justify-between h-16 px-6 border-b border-border">
              <div className="flex items-center">
                <Code className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-foreground">DevLink</span>
              </div>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="h-6 w-6 text-muted-foreground" />
              </button>
            </div>
            
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href}>
                  <div className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}>
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </div>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      {isDesktopCollapsed && !isDesktopHovering ? (
        <div
          className="hidden lg:block fixed inset-y-0 left-0 z-20 w-3"
          onMouseEnter={() => setIsDesktopHovering(true)}
          aria-hidden
        />
      ) : null}

      <div
        className={`hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:flex-col transition-[width] duration-200 ${
          isDesktopExpanded ? 'lg:w-64' : 'lg:w-16'
        }`}
        onMouseEnter={() => {
          if (isDesktopCollapsed) setIsDesktopHovering(true)
        }}
        onMouseLeave={() => {
          if (isDesktopCollapsed) setIsDesktopHovering(false)
        }}
      >
        <div className="flex flex-col flex-grow bg-card shadow-sm border-r border-border overflow-hidden">
          <button
            type="button"
            onClick={handleDesktopLogoClick}
            className={`flex items-center h-16 border-b border-border transition-[padding] duration-200 hover:bg-muted/40 ${
              isDesktopExpanded ? 'px-6 justify-start' : 'px-0 justify-center'
            }`}
            aria-label={isDesktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isDesktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Code className="h-8 w-8 text-blue-600 shrink-0" />
            {isDesktopExpanded ? (
              <span className="ml-2 text-xl font-bold text-foreground whitespace-nowrap">DevLink</span>
            ) : null}
          </button>
          <div className="sr-only" aria-live="polite">
            {isDesktopCollapsed ? 'Sidebar collapsed' : 'Sidebar expanded'}
          </div>
          
          <nav className={`flex-1 py-6 space-y-2 transition-[padding] duration-200 ${isDesktopExpanded ? 'px-4' : 'px-2'}`}>
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <div className={`flex items-center rounded-lg text-sm font-medium transition-colors ${
                  isDesktopExpanded ? 'px-3 py-2 justify-start' : 'px-0 py-2 justify-center'
                } ${
                  pathname === item.href
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}>
                  <item.icon className={`h-5 w-5 shrink-0 ${isDesktopExpanded ? 'mr-3' : ''}`} />
                  {isDesktopExpanded ? (
                    <span className="whitespace-nowrap">{item.name}</span>
                  ) : null}
                </div>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className={`transition-[padding] duration-200 ${isDesktopCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex h-16 bg-card shadow-sm border-b border-border">
          <button
            type="button"
            className="px-4 border-r border-border text-muted-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 justify-between px-4 lg:px-6">
            <div className="flex items-center">
              {/* Breadcrumb or page title could go here */}
            </div>
            
            <div className="flex items-center gap-4">
              <SimpleThemeToggle />
              <Link href={`/${username ?? ''}`} target="_blank">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">View Portfolio</span>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userImage} />
                      <AvatarFallback>
                        {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{session?.user?.name}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {session?.user?.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/customise">
                      <Palette className="mr-2 h-4 w-4" />
                      Customise
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="p-6 lg:p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}
