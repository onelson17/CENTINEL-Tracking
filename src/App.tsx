import { subDays } from 'date-fns'
import { PenLine, Users } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
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
      className="relative flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[0.94rem] outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
    >
      {actif && (
        <motion.span
          layoutId="entree-active"
          className="absolute inset-0 rounded-xl bg-encre"
          transition={{ type: 'spring', stiffness: 420, damping: 36 }}
        />
      )}
      <span className={`relative flex min-w-0 items-center gap-3 ${actif ? 'text-white' : ''}`}>{children}</span>
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

  return (
    <StoreProvider>
      <div className="flex min-h-screen min-w-[1180px]">
        <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r bg-card">
          <div className="flex items-center gap-3 px-6 pt-7 pb-6">
            <span className="h-9 w-1.5 rounded-full bg-primary" />
            <p className="font-heading text-[1.05rem] leading-tight font-semibold">
              Permanence<br />assainissement
            </p>
          </div>
          <nav aria-label="Vues" className="flex-1 overflow-y-auto px-3">
            <Entree actif={page.type === 'tableau' && !agentActif} onClick={() => setPage({ type: 'tableau' })}>
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-white"><Users className="size-4" /></span>
              <span className="font-medium">Toute l’équipe</span>
            </Entree>
            <p className="px-3 pt-5 pb-2 text-sm text-muted-foreground">Agents</p>
            <ul className="space-y-0.5">
              {AGENTS.map((a) => {
                const actif = agentActif === a.id
                return (
                  <li key={a.id}>
                    <Entree actif={actif} onClick={() => setPage({ type: 'tableau', agentId: a.id })}>
                      <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${actif ? 'bg-white/15' : 'bg-secondary text-eau'}`}>
                        {initiales(a)}
                      </span>
                      <span className="truncate">{nomComplet(a)}</span>
                    </Entree>
                  </li>
                )
              })}
            </ul>
          </nav>
          <div className="border-t p-4">
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
