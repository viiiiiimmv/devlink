'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-9 w-9 px-0">
          <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-amber-200/40 via-amber-100/20 to-sky-200/40 opacity-100 transition-opacity duration-300 dark:from-slate-800/60 dark:via-indigo-900/30 dark:to-slate-900/70" />
          <span className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-full">
            <Sun className="absolute h-5 w-5 text-amber-600 transition-all duration-300 ease-out dark:translate-y-6 dark:opacity-0" />
            <Moon className="absolute h-5 w-5 translate-y-6 text-slate-700 opacity-0 transition-all duration-300 ease-out dark:translate-y-0 dark:opacity-100 dark:text-slate-100" />
          </span>
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Simple toggle version without dropdown
export function SimpleThemeToggle() {
  const { theme, setTheme } = useTheme()
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="relative h-9 w-9 px-0"
      onClick={toggleTheme}
    >
      <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-amber-200/40 via-amber-100/20 to-sky-200/40 opacity-100 transition-opacity duration-300 dark:from-slate-800/60 dark:via-indigo-900/30 dark:to-slate-900/70" />
      <span className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-full">
        <Sun className="absolute h-5 w-5 text-amber-600 transition-all duration-300 ease-out dark:translate-y-6 dark:opacity-0" />
        <Moon className="absolute h-5 w-5 translate-y-6 text-slate-700 opacity-0 transition-all duration-300 ease-out dark:translate-y-0 dark:opacity-100 dark:text-slate-100" />
      </span>
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
