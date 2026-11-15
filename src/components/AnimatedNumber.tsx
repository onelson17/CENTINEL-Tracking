import { animated, useSpring } from '@react-spring/web'

/** Fait glisser un nombre de son ancienne valeur vers la nouvelle. */
export function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const { n } = useSpring({ from: { n: 0 }, n: value, config: { tension: 110, friction: 24, clamp: true } })
  return <animated.span className="tnum">{n.to(format)}</animated.span>
}
