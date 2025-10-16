'use client'

import { useEffect, useState } from 'react'
import { MatrixRain } from './matrix-rain'

export function MatrixRainWrapper() {
  const [isMatrix, setIsMatrix] = useState(false)

  useEffect(() => {
    const checkTheme = () => {
      setIsMatrix(document.documentElement.classList.contains('matrix'))
    }

    // Check on mount
    checkTheme()

    // Create observer to watch for theme changes
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  if (!isMatrix) return null

  return <MatrixRain />
}
