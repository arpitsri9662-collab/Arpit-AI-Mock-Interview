import { useEffect, useRef } from 'react'

export function ParticleEffect() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const particleContainer = container

    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
      element: HTMLDivElement
    }> = []
    let particleCount = 0
    let lastParticleAt = 0
    const colors = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed']

    function createParticle(x: number, y: number) {
      const particle = document.createElement('div')
      const index = particleCount++
      const size = 2 + (index % 5)

      particle.style.position = 'fixed'
      particle.style.left = x + 'px'
      particle.style.top = y + 'px'
      particle.style.width = size + 'px'
      particle.style.height = size + 'px'
      particle.style.backgroundColor = colors[index % colors.length]
      particle.style.borderRadius = '50%'
      particle.style.pointerEvents = 'none'
      particle.style.zIndex = '1'

      particleContainer.appendChild(particle)

      particles.push({
        x,
        y,
        vx: ((index % 7) - 3) * 0.45,
        vy: -1.2 - (index % 4) * 0.25,
        size,
        element: particle,
      })

      setTimeout(() => {
        particle.remove()
        particles.splice(
          particles.findIndex((p) => p.element === particle),
          1
        )
      }, 1500)
    }

    function animate() {
      particles.forEach((particle, index) => {
        particle.x += particle.vx
        particle.y += particle.vy
        particle.vy += 0.1

        particle.element.style.left = particle.x + 'px'
        particle.element.style.top = particle.y + 'px'
        particle.element.style.opacity = (1 - index / particles.length).toString()
      })

      requestAnimationFrame(animate)
    }

    const handleMouseMove = (e: MouseEvent) => {
      const now = window.performance.now()
      if (now - lastParticleAt > 120) {
        lastParticleAt = now
        createParticle(e.clientX, e.clientY)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    animate()

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      particles.forEach((p) => p.element.remove())
    }
  }, [])

  return <div ref={containerRef} className="fixed inset-0 pointer-events-none z-50" />
}
