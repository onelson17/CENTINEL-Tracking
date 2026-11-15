import { endOfMonth, parseISO, startOfMonth, subDays, subMonths } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CalendarDays } from 'lucide-react'
import { useState } from 'react'
import type { DateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { iso, libellePeriode } from '@/lib/format'
import type { Periode } from '@/lib/types'

function raccourcis(): [string, Periode][] {
  const j = new Date()
  const moisDernier = subMonths(j, 1)
  return [
    ['Aujourd’hui', { du: iso(j), au: iso(j) }],
    ['7 derniers jours', { du: iso(subDays(j, 6)), au: iso(j) }],
    ['30 derniers jours', { du: iso(subDays(j, 29)), au: iso(j) }],
    ['Ce mois-ci', { du: iso(startOfMonth(j)), au: iso(j) }],
    ['Mois dernier', { du: iso(startOfMonth(moisDernier)), au: iso(endOfMonth(moisDernier)) }],
    ['90 derniers jours', { du: iso(subDays(j, 89)), au: iso(j) }],
  ]
}

export function PeriodePicker({ value, onChange }: { value: Periode; onChange: (p: Periode) => void }) {
  const [ouvert, setOuvert] = useState(false)
  const [brouillon, setBrouillon] = useState<DateRange | undefined>()

  const ouvrir = (o: boolean) => {
    if (o) setBrouillon({ from: parseISO(value.du), to: parseISO(value.au) })
    setOuvert(o)
  }
  const choisir = (p: Periode) => {
    onChange(p)
    setOuvert(false)
  }

  return (
    <Popover open={ouvert} onOpenChange={ouvrir}>
      <PopoverTrigger render={<Button variant="outline" size="lg" className="bg-card px-3.5 font-normal" />}>
        <CalendarDays className="text-muted-foreground" />
        <span className="tnum">{libellePeriode(value.du, value.au)}</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="flex w-auto flex-row gap-0 p-0">
        <div className="flex w-44 flex-col gap-0.5 border-r p-2">
          {raccourcis().map(([nom, p]) => (
            <Button key={nom} variant="ghost" className="justify-start font-normal" onClick={() => choisir(p)}>
              {nom}
            </Button>
          ))}
        </div>
        <div className="flex flex-col">
          <Calendar
            mode="range"
            locale={fr}
            numberOfMonths={2}
            defaultMonth={subMonths(parseISO(value.au), 1)}
            selected={brouillon}
            onSelect={setBrouillon}
          />
          <div className="flex items-center justify-between gap-3 border-t px-3 py-2.5">
            <p className="text-sm text-muted-foreground">
              {brouillon?.from
                ? libellePeriode(iso(brouillon.from), iso(brouillon.to ?? brouillon.from))
                : 'Choisissez un jour ou une plage de dates'}
            </p>
            <Button
              disabled={!brouillon?.from}
              onClick={() =>
                brouillon?.from && choisir({ du: iso(brouillon.from), au: iso(brouillon.to ?? brouillon.from) })
              }
            >
              Appliquer la période
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
