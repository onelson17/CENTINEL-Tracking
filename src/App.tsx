import { subDays } from 'date-fns'
import { PenLine, Users } from 'lucide-react'
import { animated, useReducedMotion, useSpring } from '@react-spring/web'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { Dashboard } from '@/features/Dashboard'
import { Saisie } from '@/features/Saisie'
import { AGENTS, initiales, nomComplet } from '@/lib/data'
import { iso } from '@/lib/format'
import { StoreProvider } from '@/lib/store'
import type { Periode } from '@/lib/types'

type Page = { type: 'tableau'; agentId?: string } | { type: 'saisie' }

function Entree({ actif, onClick, children }: { actif: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={actif ? 'page' : undefined}
      className="relative flex shrink-0 items-center gap-3 rounded-xl px-3 py-2 text-left lg:w-full text-[0.94rem] outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:hover:bg-transparent"
    >
      <span className={`flex min-w-0 items-center gap-3 transition-colors duration-300 ${actif ? 'text-white' : ''}`}>{children}</span>
    </button>
  )
}

export default function App() {
  const [page, setPage] = useState<Page>({ type: 'tableau' })
  const [periode, setPeriode] = useState<Periode>(() => {
    const j = new Date()
    return { du: iso(subDays(j, 29)), au: iso(j) }
  })
  const [periodeSaisie, setPeriodeSaisie] = useState<Periode>(() => {
    const j = iso(new Date())
    return { du: j, au: j }
  })
  // Chaque écran s'ouvre en haut de page.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [page.type])

  const agentActif = page.type === 'tableau' ? page.agentId : undefined

  // Le fond sombre du menu glisse jusqu'à l'entrée active.
  useReducedMotion()
  const menu = useRef<HTMLDivElement>(null)
  const [fond, fondApi] = useSpring(() => ({ x: 0, y: 0, width: 0, height: 0, opacity: 0, config: { tension: 230, friction: 28 } }))
  const cle = page.type === 'tableau' ? (page.agentId ?? 'equipe') : null
  useLayoutEffect(() => {
    const placer = (immediat: boolean) => {
      const el = menu.current?.querySelector<HTMLElement>('[aria-current="page"]')
      if (!el) return void fondApi.start({ opacity: 0 })
      fondApi.start({
        x: el.offsetLeft, y: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight, opacity: 1,
        immediate: immediat || fond.height.get() === 0,
      })
      return el
    }
    // Sur mobile le menu défile à l'horizontale : on garde l'entrée active visible.
    placer(false)?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    // Le menu change de forme entre mobile et ordinateur : on replace le fond sans animation.
    const obs = new ResizeObserver(() => placer(true)?.scrollIntoView({ block: 'nearest', inline: 'nearest' }))
    if (menu.current) obs.observe(menu.current)
    return () => obs.disconnect()
  }, [cle, fond, fondApi])

  return (
    <StoreProvider>
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="sticky top-0 z-20 flex shrink-0 flex-col border-b bg-card lg:h-screen lg:w-64 lg:border-r lg:border-b-0">
          <div className="flex items-center gap-3 px-4 pt-3 pb-2 lg:px-6 lg:pt-7 lg:pb-6">
            <span className="h-7 w-1.5 rounded-full bg-primary lg:h-9" />
            <p className="font-heading text-[1.15rem] leading-tight font-semibold">Centinel-tracking</p>
            <Button
              variant={page.type === 'saisie' ? 'secondary' : 'default'}
              className="ml-auto h-9 px-3 lg:hidden"
              onClick={() => setPage({ type: 'saisie' })}
            >
              <PenLine /> Saisir
            </Button>
          </div>
          <nav aria-label="Vues" className="overflow-x-auto px-3 pb-2 [scrollbar-width:none] lg:flex-1 lg:overflow-x-visible lg:overflow-y-auto lg:pb-0">
            <div ref={menu} className="relative flex w-max items-center gap-1 lg:block lg:w-auto">
            <animated.span aria-hidden className="pointer-events-none absolute top-0 left-0 rounded-xl bg-encre" style={fond} />
            <Entree actif={page.type === 'tableau' && !agentActif} onClick={() => setPage({ type: 'tableau' })}>
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-white"><Users className="size-4" /></span>
              <span className="font-medium whitespace-nowrap">Toute l’équipe</span>
            </Entree>
            <p className="hidden px-3 pt-5 pb-2 text-sm text-muted-foreground lg:block">Agents</p>
            <ul className="flex gap-1 lg:block lg:space-y-0.5">
              {AGENTS.map((a) => {
                const actif = agentActif === a.id
                return (
                  <li key={a.id}>
                    <Entree actif={actif} onClick={() => setPage({ type: 'tableau', agentId: a.id })}>
                      <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${actif ? 'bg-white/15' : 'bg-secondary text-eau'}`}>
                        {initiales(a)}
                      </span>
                      <span className="whitespace-nowrap lg:truncate">{nomComplet(a)}</span>
                    </Entree>
                  </li>
                )
              })}
            </ul>
            </div>
          </nav>
          <div className="hidden border-t p-4 lg:block">
            <Button
              size="lg"
              variant={page.type === 'saisie' ? 'secondary' : 'default'}
              className="h-10 w-full"
              onClick={() => setPage({ type: 'saisie' })}
            >
              <PenLine /> Saisir des relevés
            </Button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          {page.type === 'saisie' ? (
            <Saisie periode={periodeSaisie} onPeriode={setPeriodeSaisie} />
          ) : (
            <Dashboard
              agentId={page.agentId}
              periode={periode}
              onPeriode={setPeriode}
              onAgent={(id) => setPage({ type: 'tableau', agentId: id })}
              onSaisie={() => setPage({ type: 'saisie' })}
            />
          )}
        </main>
      </div>
      <Toaster />
    </StoreProvider>
  )
}
