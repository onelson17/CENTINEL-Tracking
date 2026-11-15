import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { animated, useTransition } from '@react-spring/web'
import { useMemo, type ReactNode } from 'react'
import { toast } from 'sonner'
import { AnimatedNumber } from '@/components/AnimatedNumber'
import { Reveal } from '@/components/Reveal'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AGENTS, nomComplet } from '@/lib/data'
import { exporterExcel } from '@/lib/excel'
import { duree, dureeCourte, entier, libellePeriode, pourcent } from '@/lib/format'
import { exporterPdf } from '@/lib/pdf'
import { construireRapport } from '@/lib/rapport'
import { dansPeriode, serie, totaux } from '@/lib/stats'
import { useStore } from '@/lib/store'
import type { Periode, Totaux } from '@/lib/types'
import {
  BarresComparaison, BarresParAgent, C, CamembertActivite, CourbeEvolution, DonutDecroche, SERIES,
} from './charts'
import { PeriodePicker } from './PeriodePicker'

const INDICATEURS: { nom: string; valeur: (t: Totaux) => number; format: (n: number) => string }[] = [
  { nom: 'Mails traités', valeur: (t) => t.mails, format: entier },
  { nom: 'Appels entrants', valeur: (t) => t.entrants, format: entier },
  { nom: 'Appels sortants', valeur: (t) => t.sortants, format: entier },
  { nom: 'Appels manqués', valeur: (t) => t.manques, format: entier },
  { nom: 'Durée moyenne d’appel', valeur: (t) => t.dureeMoy, format: duree },
  { nom: 'Temps d’attente moyen', valeur: (t) => t.attenteMoy, format: duree },
]

function Bloc({ titre, aide, ordre, className = '', children }: { titre: string; aide?: string; ordre: number; className?: string; children: ReactNode }) {
  return (
    <Reveal as="section" ordre={ordre} className={`rounded-2xl border bg-card p-6 ${className}`}>
      <h2 className="font-heading text-lg font-semibold">{titre}</h2>
      {aide && <p className="mt-0.5 text-sm text-muted-foreground">{aide}</p>}
      {children}
    </Reveal>
  )
}

function Legende({ items }: { items: { nom: string; couleur: string; valeur?: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
      {items.map((i) => (
        <li key={i.nom} className="flex items-center gap-2">
          <span className="size-2.5 rounded-full" style={{ background: i.couleur }} />
          <span className="text-muted-foreground">{i.nom}</span>
          {i.valeur && <span className="tnum font-medium">{i.valeur}</span>}
        </li>
      ))}
    </ul>
  )
}

export function Dashboard({
  agentId, periode, onPeriode, onAgent, onSaisie,
}: {
  agentId?: string
  periode: Periode
  onPeriode: (p: Periode) => void
  onAgent: (id?: string) => void
  onSaisie: () => void
}) {
  const { releves } = useStore()
  const agent = AGENTS.find((a) => a.id === agentId)

  const d = useMemo(() => {
    const equipe = dansPeriode(releves, periode)
    const vus = agentId ? equipe.filter((r) => r.agentId === agentId) : equipe
    const tEquipe = totaux(equipe)
    const actifs = Math.max(new Set(equipe.map((r) => r.agentId)).size, 1)
    const moyenne = Object.fromEntries(
      Object.entries(tEquipe).map(([k, v]) => [k, v / actifs]),
    ) as Totaux
    const parAgent = AGENTS.map((a) => ({
      id: a.id,
      agent: `${a.prenom} ${a.nom[0]}.`,
      nom: nomComplet(a),
      t: totaux(equipe.filter((r) => r.agentId === a.id)),
    }))
    const points = serie(vus, periode)
    return {
      vus,
      t: totaux(vus),
      moyenne,
      parAgent,
      points: agentId ? points.filter((p) => p.mails || p.entrants) : points,
    }
  }, [releves, periode, agentId])

  // Le titre sortant s'efface avant que le nouveau n'entre.
  const titres = useTransition(agentId ?? '', {
    from: { opacity: 0, transform: 'translate3d(-8px, 0, 0)' },
    enter: { opacity: 1, transform: 'translate3d(0px, 0, 0)' },
    leave: { opacity: 0, transform: 'translate3d(8px, 0, 0)' },
    exitBeforeEnter: true,
    initial: null,
    config: { tension: 260, friction: 28, clamp: true },
  })

  const { t } = d
  const vide = d.vus.length === 0
  const totalActivite = SERIES.reduce((s, x) => s + x.valeur(t), 0) || 1

  const exporter = (type: 'excel' | 'pdf') => {
    const r = construireRapport(releves, periode, agentId)
    if (type === 'excel') exporterExcel(r)
    else exporterPdf(r)
    toast.success(`${r.titre} exportées en ${type === 'excel' ? 'Excel' : 'PDF'}`)
  }

  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-5 px-10 py-9">
      <Reveal as="header" className="flex items-end justify-between gap-6">
        <div className="min-w-0">
          {titres((style, id) => {
            const a = AGENTS.find((x) => x.id === id)
            return (
              <animated.div style={style}>
                <h1 className="font-heading text-[2.6rem] leading-[1.05] font-semibold tracking-tight">
                  {a ? nomComplet(a) : 'Équipe permanence'}
                </h1>
                <p className="mt-2 text-muted-foreground">
                  {a ? 'Statistiques individuelles' : `${AGENTS.length} agents`}, {libellePeriode(periode.du, periode.au)}
                </p>
              </animated.div>
            )
          })}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <PeriodePicker value={periode} onChange={onPeriode} />
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="lg" className="bg-card px-3.5" disabled={vide} />}>
              <Download /> Exporter
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => exporter('excel')}>
                <FileSpreadsheet /> Exporter en Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exporter('pdf')}>
                <FileText /> Exporter en PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Reveal>

      {vide ? (
        <Reveal ordre={1} className="rounded-2xl border border-dashed bg-card px-8 py-20 text-center">
          <p className="font-heading text-xl font-semibold">Aucun relevé sur cette période</p>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            Choisissez une autre période, ou saisissez les chiffres {agent ? `de ${agent.prenom}` : 'de l’équipe'} pour ces dates.
          </p>
          <Button size="lg" className="mt-6 px-4" onClick={onSaisie}>Saisir des relevés</Button>
        </Reveal>
      ) : (
        <>
          <Reveal as="dl" ordre={1} className="grid grid-cols-6 divide-x rounded-2xl border bg-card">
            {INDICATEURS.map((i) => (
              <div key={i.nom} className="px-5 py-5">
                <dt className="truncate text-sm text-muted-foreground">{i.nom}</dt>
                <dd className={`mt-1.5 font-heading text-[1.45rem] leading-none font-semibold whitespace-nowrap ${i.nom === 'Appels manqués' ? 'text-primary' : ''}`}>
                  <AnimatedNumber value={i.valeur(t)} format={i.format} />
                </dd>
              </div>
            ))}
          </Reveal>

          <div className="grid grid-cols-12 gap-5">
            <Bloc ordre={2} titre="Taux de décroché" aide="Appels entrants pris par rapport aux appels reçus" className="col-span-4">
              <div className="relative mx-auto mt-2 h-60 max-w-72">
                <DonutDecroche t={t} />
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-heading text-5xl font-semibold tracking-tight">
                    <AnimatedNumber value={t.tauxDecroche} format={pourcent} />
                  </span>
                  <span className="mt-1 text-sm text-muted-foreground">sur {entier(t.entrants)} appels</span>
                </div>
              </div>
              <div className="-mt-3 flex justify-center">
                <Legende items={[
                  { nom: 'Décrochés', couleur: C.eau, valeur: entier(t.decroches) },
                  { nom: 'Manqués', couleur: C.rouge, valeur: entier(t.manques) },
                ]} />
              </div>
            </Bloc>

            <Bloc ordre={3} titre="Évolution sur la période" className="col-span-8">
              <div className="mt-3">
                <Legende items={[
                  { nom: 'Appels entrants', couleur: C.eau },
                  { nom: 'Mails traités', couleur: C.encre },
                  { nom: 'Appels manqués', couleur: C.rouge },
                ]} />
              </div>
              <div className="mt-2 h-64"><CourbeEvolution points={d.points} /></div>
            </Bloc>

            <Bloc ordre={4} titre="Répartition de l’activité" className="col-span-4">
              <div className="mx-auto mt-3 h-52 max-w-60"><CamembertActivite t={t} /></div>
              <ul className="mt-4 space-y-2 text-sm">
                {SERIES.map((s) => (
                  <li key={s.id} className="flex items-center gap-2.5">
                    <span className="size-2.5 rounded-full" style={{ background: s.couleur }} />
                    <span className="text-muted-foreground">{s.id}</span>
                    <span className="tnum ml-auto font-medium">{entier(s.valeur(t))}</span>
                    <span className="tnum w-14 text-right text-muted-foreground">{pourcent(s.valeur(t) / totalActivite)}</span>
                  </li>
                ))}
              </ul>
            </Bloc>

            <Bloc ordre={5}
              titre={agent ? `${agent.prenom} face à la moyenne de l’équipe` : 'Activité par agent'}
              aide={agent ? undefined : 'Cliquez sur un agent pour ouvrir sa fiche'}
              className="col-span-8"
            >
              <div className="mt-3">
                <Legende items={agent
                  ? [{ nom: agent.prenom, couleur: C.eau }, { nom: 'Moyenne de l’équipe', couleur: C.gris }]
                  : SERIES.map((s) => ({ nom: s.id, couleur: s.couleur }))} />
              </div>
              <div className="mt-2 h-[22rem]">
                {agent
                  ? <BarresComparaison prenom={agent.prenom} agent={t} moyenne={d.moyenne} />
                  : <BarresParAgent lignes={[...d.parAgent].reverse()} onAgent={onAgent} />}
              </div>
            </Bloc>
          </div>

          <Bloc ordre={6} titre={agent ? 'Détail des relevés' : 'Détail par agent'} className="px-0 pb-2 [&>h2]:px-6">
            <div className="mt-3 max-h-[26rem] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">{agent ? 'Période' : 'Agent'}</TableHead>
                    {['Mails traités', 'Entrants', 'Sortants', 'Manqués', 'Taux de décroché', 'Durée moy.', 'Attente moy.'].map((h) => (
                      <TableHead key={h} className="text-right last:pr-6">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(agent
                    ? [...d.vus].sort((a, b) => b.du.localeCompare(a.du)).map((r) => ({
                        cle: `${r.du}${r.au}`, nom: libellePeriode(r.du, r.au), t: totaux([r]), id: undefined as string | undefined,
                      }))
                    : d.parAgent.map((l) => ({ cle: l.id, nom: l.nom, t: l.t, id: l.id as string | undefined }))
                  ).map((l) => (
                    <TableRow
                      key={l.cle}
                      className={l.id ? 'cursor-pointer' : ''}
                      onClick={l.id ? () => onAgent(l.id) : undefined}
                    >
                      <TableCell className="pl-6 font-medium">{l.nom}</TableCell>
                      <TableCell className="tnum text-right">{entier(l.t.mails)}</TableCell>
                      <TableCell className="tnum text-right">{entier(l.t.entrants)}</TableCell>
                      <TableCell className="tnum text-right">{entier(l.t.sortants)}</TableCell>
                      <TableCell className="tnum text-right text-primary">{entier(l.t.manques)}</TableCell>
                      <TableCell className="tnum text-right">{l.t.entrants ? pourcent(l.t.tauxDecroche) : '–'}</TableCell>
                      <TableCell className="tnum text-right">{dureeCourte(l.t.dureeMoy)}</TableCell>
                      <TableCell className="tnum pr-6 text-right">{dureeCourte(l.t.attenteMoy)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Bloc>
        </>
      )}
    </div>
  )
}
