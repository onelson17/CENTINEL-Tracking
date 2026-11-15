import { animate } from 'motion'
import { useEffect, useRef } from 'react'

/** Fait défiler un nombre de son ancienne valeur vers la nouvelle. `format` doit être stable. */
export function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const courant = useRef(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      courant.current = value
      el.textContent = format(value)
      return
    }
    const anim = animate(courant.current, value, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        courant.current = v
        el.textContent = format(v)
      },
    })
    return () => anim.stop()
  }, [value, format])

  return <span ref={ref} className="tnum">{format(0)}</span>
}
