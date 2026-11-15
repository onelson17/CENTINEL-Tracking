import { animated, useSpring } from '@react-spring/web'
import type { ReactNode } from 'react'

/** Apparition douce au chargement ; `ordre` décale légèrement chaque bloc pour un enchaînement fluide. */
export function Reveal({
  ordre = 0, as = 'div', className, children,
}: {
  ordre?: number
  as?: 'div' | 'section' | 'header' | 'dl'
  className?: string
  children: ReactNode
}) {
  const style = useSpring({
    from: { opacity: 0, y: 10 },
    to: { opacity: 1, y: 0 },
    delay: ordre * 70,
    config: { tension: 150, friction: 26 },
  })
  const Tag = animated[as]
  return (
    <Tag className={className} style={{ opacity: style.opacity, transform: style.y.to((y) => `translate3d(0, ${y}px, 0)`) }}>
      {children}
    </Tag>
  )
}
