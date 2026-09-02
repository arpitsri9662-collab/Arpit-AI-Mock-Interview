import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface FadeInProps {
  children: ReactNode
  delay?: number
  duration?: number
  className?: string
}

export function FadeIn({ children, delay = 0, duration = 0.6, className = '' }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface PulseProps {
  children: ReactNode
  intensity?: number
  className?: string
}

export function Pulse({ children, intensity = 1, className = '' }: PulseProps) {
  return (
    <motion.div
      animate={{ scale: [1, 1 + intensity * 0.05, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface HoverScaleProps {
  children: ReactNode
  scale?: number
  className?: string
}

export function HoverScale({ children, scale = 1.05, className = '' }: HoverScaleProps) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: scale - 0.02 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface BounceProps {
  children: ReactNode
  delay?: number
  className?: string
}

export function Bounce({ children, delay = 0, className = '' }: BounceProps) {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 0.8, delay, repeat: Infinity }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface RotateProps {
  children: ReactNode
  duration?: number
  className?: string
}

export function Rotate({ children, duration = 3, className = '' }: RotateProps) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface SlideInProps {
  children: ReactNode
  direction?: 'left' | 'right' | 'up' | 'down'
  delay?: number
  className?: string
}

export function SlideIn({ children, direction = 'left', delay = 0, className = '' }: SlideInProps) {
  const getInitialPosition = () => {
    switch (direction) {
      case 'left':
        return { x: -100, opacity: 0 }
      case 'right':
        return { x: 100, opacity: 0 }
      case 'up':
        return { y: 100, opacity: 0 }
      case 'down':
        return { y: -100, opacity: 0 }
      default:
        return { x: -100, opacity: 0 }
    }
  }

  return (
    <motion.div
      initial={getInitialPosition()}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface FlipProps {
  children: ReactNode
  axis?: 'x' | 'y'
  delay?: number
  className?: string
}

export function Flip({ children, axis = 'y', delay = 0, className = '' }: FlipProps) {
  return (
    <motion.div
      initial={{ [axis === 'x' ? 'rotateX' : 'rotateY']: 90, opacity: 0 }}
      animate={{ [axis === 'x' ? 'rotateX' : 'rotateY']: 0, opacity: 1 }}
      transition={{ delay, duration: 0.8 }}
      style={{ perspective: '1000px' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface GlowProps {
  children: ReactNode
  color?: 'blue' | 'purple' | 'pink' | 'green'
  className?: string
}

export function Glow({ children, color = 'blue', className = '' }: GlowProps) {
  const glowColors = {
    blue: 'shadow-glow',
    purple: 'shadow-glow-purple',
    pink: 'shadow-glow-pink',
    green: 'shadow-lg',
  }

  return (
    <motion.div
      animate={{ boxShadow: ['0 0 20px rgba(59, 130, 246, 0.3)', '0 0 40px rgba(59, 130, 246, 0.6)'] }}
      transition={{ duration: 2, repeat: Infinity }}
      className={`${glowColors[color]} ${className}`}
    >
      {children}
    </motion.div>
  )
}
