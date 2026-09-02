import { useEffect } from 'react'

interface SmoothScrollProps {
  children: React.ReactNode
}

export function SmoothScrollProvider({ children }: SmoothScrollProps) {
  useEffect(() => {
    const previousScrollBehavior = document.documentElement.style.scrollBehavior
    document.documentElement.style.scrollBehavior = 'smooth'

    return () => {
      document.documentElement.style.scrollBehavior = previousScrollBehavior
    }
  }, [])

  return <>{children}</>
}
