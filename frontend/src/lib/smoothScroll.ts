let previousScrollBehavior: string | null = null

export function initSmoothScroll() {
  if (typeof window === 'undefined') return

  previousScrollBehavior = document.documentElement.style.scrollBehavior
  document.documentElement.style.scrollBehavior = 'smooth'
}

export function getSmoothScroll() {
  return null
}

export function destroySmoothScroll() {
  if (typeof document !== 'undefined' && previousScrollBehavior !== null) {
    document.documentElement.style.scrollBehavior = previousScrollBehavior
    previousScrollBehavior = null
  }
}
