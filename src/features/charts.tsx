import { ResponsiveBar } from '@nivo/bar'
import { ResponsiveLine } from '@nivo/line'
import { ResponsivePie } from '@nivo/pie'
import { jourCourt, entier } from '@/lib/format'
import type { PointJour } from '@/lib/stats'
import type { Totaux } from '@/lib/types'

export const C = { eau: '#0b6e7a', eauClair: '#7fbfc6', encre: '#1c2529', rouge: '#e2001a', gris: '#c9d2d4' }

export const SERIES = [
  { id: 'Mails traités', couleur: C.encre, valeur: (t: Totaux) => t.mails },
  { id: 'Appels décrochés', couleur: C.eau, valeur: (t: Totaux) => t.decroches },
  { id: 'Appels sortants', couleur: C.eauClair, valeur: (t: Totaux) => t.sortants },
  { id: 'Appels manqués', couleur: C.rouge, valeur: (t: Totaux) => t.manques },
] as const

const theme = {
  text: { fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter Variable', sans-serif", fontSize: 12, fill: '#5a676c' },
  axis: { ticks: { text: { fontSize: 12, fill: '#5a676c' } } },
  grid: { line: { stroke: '#e9eded' } },
  tooltip: { container: { fontSize: 13, borderRadius: 10, boxShadow: '0 6px 24px rgba(28,37,41,.14)', color: C.encre } },
}

export function DonutDecroche({ t }: { t: Totaux }) {
  return (
    <ResponsivePie
      data={[
        { id: 'Décrochés', value: t.decroches, color: C.eau },
        { id: 'Manqués', value: t.manques, color: C.rouge },
      ]}
      colors={{ datum: 'data.color' }}
      innerRadius={0.8}
      padAngle={1.5}
      cornerRadius={8}
      startAngle={-140}
      endAngle={140}
      enableArcLabels={false}
      enableArcLinkLabels={false}
      activeOuterRadiusOffset={4}
      margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
      valueFormat={entier}
      motionConfig="slow"
      transitionMode="startAngle"
      theme={theme}
    />
  )
}

export function CamembertActivite({ t }: { t: Totaux }) {
  return (
    <ResponsivePie
      data={SERIES.map((s) => ({ id: s.id, value: s.valeur(t), color: s.couleur }))}
      colors={{ datum: 'data.color' }}
      innerRadius={0.55}
      padAngle={1.2}
      cornerRadius={6}
      enableArcLabels={false}
      enableArcLinkLabels={false}
      activeOuterRadiusOffset={5}
      margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
      valueFormat={entier}
      motionConfig="gentle"
      transitionMode="pushIn"
      theme={theme}
    />
  )
}

export function CourbeEvolution({ points, compact }: { points: PointJour[]; compact?: boolean }) {
  const pas = Math.max(1, Math.ceil(points.length / (compact ? 4 : 8)))
  const graduations = points.filter((_, i) => i % pas === 0).map((p) => p.date)
  const serie = (id: string, f: (p: PointJour) => number) => ({ id, data: points.map((p) => ({ x: p.date, y: f(p) })) })
  return (
    <ResponsiveLine
      data={[
        serie('Appels manqués', (p) => p.manques),
        serie('Mails traités', (p) => p.mails),
        serie('Appels entrants', (p) => p.entrants),
      ]}
      colors={[C.rouge, C.encre, C.eau]}
      xScale={{ type: 'point' }}
      yScale={{ type: 'linear', min: 0, max: 'auto' }}
      curve="monotoneX"
      lineWidth={2.5}
      enablePoints={points.length <= 14}
      pointSize={7}
      enableArea
      areaOpacity={0.06}
      enableGridX={false}
      axisLeft={{ tickSize: 0, tickPadding: 10, tickValues: 4 }}
      gridYValues={4}
      axisBottom={{ tickSize: 0, tickPadding: 12, tickValues: graduations, format: (d) => jourCourt(String(d)) }}
      margin={{ top: 12, right: compact ? 12 : 16, bottom: 36, left: compact ? 34 : 44 }}
      enableSlices="x"
      sliceTooltip={({ slice }) => (
        <div className="rounded-xl border bg-card px-3 py-2 text-sm shadow-lg">
          <p className="mb-1 font-medium">{jourCourt(String(slice.points[0].data.x))}</p>
          {[...slice.points].reverse().map((p) => (
            <p key={p.id} className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ background: p.seriesColor }} />
              <span className="text-muted-foreground">{p.seriesId}</span>
              <span className="tnum ml-auto pl-4 font-medium">{p.data.yFormatted}</span>
            </p>
          ))}
        </div>
      )}
      motionConfig="gentle"
      theme={theme}
    />
  )
}

export function BarresParAgent({
  lignes,
  onAgent,
  compact,
}: {
  lignes: { id: string; agent: string; t: Totaux }[]
  onAgent: (id: string) => void
  compact?: boolean
}) {
  const data = lignes.map((l) => ({
    id: l.id,
    agent: l.agent,
    ...Object.fromEntries(SERIES.map((s) => [s.id, s.valeur(l.t)])),
  }))
  return (
    <ResponsiveBar
      data={data}
      keys={SERIES.map((s) => s.id)}
      indexBy="agent"
      layout="horizontal"
      colors={SERIES.map((s) => s.couleur)}
      padding={0.42}
      innerPadding={1.5}
      borderRadius={3}
      enableLabel={false}
      enableGridY={false}
      enableGridX
      axisLeft={{ tickSize: 0, tickPadding: 12 }}
      axisBottom={{ tickSize: 0, tickPadding: 8, tickValues: compact ? 3 : 5 }}
      margin={{ top: 4, right: 20, bottom: 32, left: compact ? 78 : 96 }}
      valueFormat={entier}
      onClick={(d) => onAgent(String(d.data.id))}
      onMouseEnter={(_, e) => ((e.currentTarget as SVGElement).style.cursor = 'pointer')}
      motionConfig="gentle"
      theme={theme}
    />
  )
}

export function BarresComparaison({
  prenom, agent, moyenne, compact,
}: {
  prenom: string
  agent: Totaux
  moyenne: Totaux
  compact?: boolean
}) {
  const autre = 'Moyenne de l’équipe'
  return (
    <ResponsiveBar
      data={SERIES.map((s) => ({ indicateur: s.id, [prenom]: s.valeur(agent), [autre]: Math.round(s.valeur(moyenne)) }))}
      keys={[prenom, autre]}
      indexBy="indicateur"
      groupMode="grouped"
      colors={[C.eau, C.gris]}
      padding={0.38}
      innerPadding={4}
      borderRadius={4}
      enableLabel={false}
      axisLeft={{ tickSize: 0, tickPadding: 10, tickValues: 4 }}
      gridYValues={4}
      // Sur mobile, les libellés complets se chevauchent : on enlève le préfixe « Appels ».
      axisBottom={{ tickSize: 0, tickPadding: 12, format: (v) => (compact ? String(v).replace(/^(Appels|Mails) /, '') : String(v)) }}
      margin={{ top: 8, right: compact ? 8 : 16, bottom: 36, left: compact ? 38 : 48 }}
      valueFormat={entier}
      motionConfig="gentle"
      theme={theme}
    />
  )
}
