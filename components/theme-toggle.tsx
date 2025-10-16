'use client'

import { useEffect, useState } from 'react'
import { Button } from './ui/button'

type Theme = 'light' | 'dark' | 'matrix'

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('matrix')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Get saved theme from localStorage or default to matrix
    const savedTheme = (localStorage.getItem('theme') as Theme) || 'matrix'
    setTheme(savedTheme)
    applyTheme(savedTheme)
  }, [])

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement
    root.classList.remove('light', 'dark', 'matrix')
    root.classList.add(newTheme)
  }

  const cycleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'matrix']
    const currentIndex = themes.indexOf(theme)
    const nextTheme = themes[(currentIndex + 1) % themes.length]

    setTheme(nextTheme)
    localStorage.setItem('theme', nextTheme)
    applyTheme(nextTheme)
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="w-10 h-10">
        <span className="sr-only">Loading theme</span>
      </Button>
    )
  }

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>
        )
      case 'dark':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        )
      case 'matrix':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M7 7h.01" />
            <path d="M17 7h.01" />
            <path d="M7 17h.01" />
            <path d="M17 17h.01" />
            <path d="M12 7v10" />
            <path d="M7 12h10" />
          </svg>
        )
    }
  }

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light mode - Click for dark'
      case 'dark':
        return 'Dark mode - Click for Matrix'
      case 'matrix':
        return 'Matrix mode - Click for light'
    }
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={cycleTheme}
      className="w-10 h-10"
      aria-label={getLabel()}
      title={getLabel()}
    >
      {getIcon()}
      <span className="sr-only">{getLabel()}</span>
    </Button>
  )
}
